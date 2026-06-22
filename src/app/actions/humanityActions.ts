"use server";

import { db } from "@/db";
import { characters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CharacterSheetData } from "@/types/character";
import { applyDamageAction } from "@/app/actions/damageActions";
import { saveRoll } from "@/app/actions/rolls";
import { pusherServer } from "@/lib/pusher";
import { revalidatePath } from "next/cache";

/**
 * Server Action para adicionar ou remover Máculas (Stains) de um personagem,
 * aplicando Dano Agravado na Força de Vontade por overflow (Degradação) se aplicável.
 */
export async function addStainAction(characterId: string, amount: number) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido." };
    }

    // 1. Carregar personagem do banco de dados
    const result = await db
      .select({
        id: characters.id,
        name: characters.name,
        campaignId: characters.campaignId,
        sheetData: characters.sheetData,
      })
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const character = result[0];
    const sheet = character.sheetData as CharacterSheetData;
    if (!sheet || !sheet.status) {
      return { success: false, error: "Dados do personagem corrompidos ou inválidos." };
    }

    const humanity = Number(sheet.status.humanity) ?? 7;
    const currentStains = Number(sheet.status.stains) ?? 0;
    
    let newStains = Math.max(0, currentStains + amount);
    let degradation = 0;

    // 2. Regra da Colisão / Overflow de Máculas (Degradação Moral)
    if (humanity + newStains > 10) {
      degradation = (humanity + newStains) - 10;
      newStains = 10 - humanity; // Trava as máculas no teto das caixas vazias
    }

    // 3. Se houver degradação, aplicar dano na Força de Vontade usando o motor central da Fase 28
    if (degradation > 0) {
      const damageResult = await applyDamageAction(characterId, "willpower", degradation, "aggravated");
      if (!damageResult.success) {
        return { success: false, error: `Falha ao aplicar dano de degradação: ${damageResult.error}` };
      }
    }

    // 4. Buscar a versão mais recente da ficha após a aplicação do dano da Força de Vontade
    const freshResult = await db
      .select({ sheetData: characters.sheetData })
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);
    
    const freshSheet = freshResult[0].sheetData as CharacterSheetData;
    freshSheet.status.stains = newStains;

    // 5. Salvar a ficha atualizada com as novas Máculas
    await db
      .update(characters)
      .set({ sheetData: freshSheet })
      .where(eq(characters.id, characterId));

    // 6. Notificar o Pusher sobre as novas máculas
    const campaignId = character.campaignId;
    if (campaignId) {
      try {
        await pusherServer.trigger(`public-campaign-${campaignId}`, "stains-updated", {
          characterId: character.id,
          characterName: character.name,
          newStains,
          degradationOccurred: degradation > 0,
          degradationAmount: degradation
        });
      } catch (pushErr) {
        console.error("Erro ao notificar Pusher (stains-updated):", pushErr);
      }
    }

    // Revalidar caminhos do Next.js
    if (campaignId) {
      revalidatePath(`/campanhas/${campaignId}/mesa`);
      revalidatePath(`/campanhas/${campaignId}/jogador`);
      revalidatePath(`/campanhas/${campaignId}/narrador`);
    } else {
      revalidatePath(`/hub`);
    }

    return { success: true, stains: newStains, degradation };
  } catch (error: any) {
    console.error("Erro em addStainAction:", error);
    return { success: false, error: error?.message || "Erro interno ao gerenciar Máculas." };
  }
}

/**
 * Server Action para rolar o teste de Remorso de fim de sessão no V5.
 */
export async function rollRemorseAction(characterId: string) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido." };
    }

    // 1. Carregar personagem do banco
    const result = await db
      .select({
        id: characters.id,
        name: characters.name,
        campaignId: characters.campaignId,
        sheetData: characters.sheetData,
      })
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const character = result[0];
    const sheet = character.sheetData as CharacterSheetData;
    if (!sheet || !sheet.status) {
      return { success: false, error: "Dados do personagem inválidos." };
    }

    const oldHumanity = Number(sheet.status.humanity) ?? 7;
    const oldStains = Number(sheet.status.stains) ?? 0;

    if (oldStains <= 0) {
      return { success: false, error: "Este personagem não possui nenhuma Mácula para rolar Remorso." };
    }

    // 2. Calcular a Parada de Dados (Caixas vazias da trilha de Humanidade)
    // dicePool = 10 - humanity - stains. Mínimo de 1 dado.
    let dicePool = 10 - oldHumanity - oldStains;
    if (dicePool < 1) {
      dicePool = 1;
    }

    // 3. Rolar os d10 virtuais
    const rolledDice: number[] = [];
    for (let i = 0; i < dicePool; i++) {
      rolledDice.push(Math.floor(Math.random() * 10) + 1);
    }

    // 4. Veredito de Sucesso (pelo menos um d10 >= 6)
    const isSuccess = rolledDice.some(val => val >= 6);
    let newHumanity = oldHumanity;

    if (isSuccess) {
      // Remorso sentido: Máculas zeradas, humanidade mantida
    } else {
      // Falha (A Besta Venceu): Máculas zeradas, humanidade cai em 1
      newHumanity = Math.max(0, oldHumanity - 1);
    }

    // 5. Atualizar os status na ficha
    sheet.status.stains = 0;
    sheet.status.humanity = newHumanity;

    await db
      .update(characters)
      .set({ sheetData: sheet })
      .where(eq(characters.id, characterId));

    // 6. Gravar o log da rolagem no banco e disparar Pusher via saveRoll
    const campaignId = character.campaignId;
    if (campaignId) {
      const remorseLogData = {
        type: "remorse_log",
        dicePool,
        rolledDice,
        isSuccess,
        oldHumanity,
        newHumanity,
        oldStains,
        newStains: 0
      };

      await saveRoll(
        campaignId,
        character.id,
        character.name,
        "Teste de Remorso",
        remorseLogData,
        false // Púbico
      );
    }

    // Revalidar caminhos do Next.js
    if (campaignId) {
      revalidatePath(`/campanhas/${campaignId}/mesa`);
      revalidatePath(`/campanhas/${campaignId}/jogador`);
      revalidatePath(`/campanhas/${campaignId}/narrador`);
    } else {
      revalidatePath(`/hub`);
    }

    return {
      success: true,
      isSuccess,
      oldHumanity,
      newHumanity,
      oldStains,
      dicePool,
      rolledDice
    };
  } catch (error: any) {
    console.error("Erro em rollRemorseAction:", error);
    return { success: false, error: error?.message || "Erro interno ao rodar teste de Remorso." };
  }
}
