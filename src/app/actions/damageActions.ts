"use server";

import { db } from "@/db";
import { characters, rolls } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CharacterSheetData, getMaxHealth, getMaxWillpower } from "@/types/character";
import { pusherServer } from "@/lib/pusher";
import { revalidatePath } from "next/cache";

export async function applyDamageAction(
  characterId: string,
  trackType: "health" | "willpower",
  amount: number,
  damageType: "superficial" | "aggravated"
) {
  try {
    // 1. Validar UUID do personagem
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido." };
    }

    // 2. Carregar personagem do banco
    const result = await db
      .select({
        id: characters.id,
        campaignId: characters.campaignId,
        name: characters.name,
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
      return { success: false, error: "Dados do personagem inválidos ou incompletos." };
    }

    // 3. Obter limites e dano existente
    const maxHealth = getMaxHealth(sheet);
    const maxWillpower = getMaxWillpower(sheet);
    const max = trackType === "health" ? maxHealth : maxWillpower;

    const track = sheet.status[trackType];
    if (!track) {
      return { success: false, error: `Trilha ${trackType} não encontrada no status do personagem.` };
    }

    // Garantir que a trilha tem o tamanho 'max' atualizado no banco
    track.max = max;

    let superficial = Number(track.superficial) || 0;
    let aggravated = Number(track.aggravated) || 0;
    let isCritical = false;

    // 4. Aplicar o cálculo do dano/cura
    if (amount < 0) {
      // CURA: Reduz o dano correspondente (cura superficial ou agravada)
      const healAmount = Math.abs(amount);
      if (damageType === "aggravated") {
        aggravated = Math.max(0, aggravated - healAmount);
      } else {
        superficial = Math.max(0, superficial - healAmount);
      }
    } else if (amount > 0) {
      // DANO
      if (damageType === "aggravated") {
        aggravated += amount;
        if (aggravated >= max) {
          aggravated = max;
          superficial = 0;
          isCritical = true;
        } else if (superficial + aggravated > max) {
          // Ajustar o superficial para caber no resto da trilha
          superficial = max - aggravated;
        }
      } else {
        // Dano Superficial
        superficial += amount;
        if (superficial + aggravated > max) {
          // O excesso converte Superficial em Agravado (1 para 1)
          const excess = (superficial + aggravated) - max;
          aggravated += excess;
          superficial = max - aggravated;
          
          if (aggravated >= max) {
            aggravated = max;
            superficial = 0;
            isCritical = true;
          }
        }
      }
    }

    // 5. Gravar os novos valores no sheetData
    track.superficial = superficial;
    track.aggravated = aggravated;

    const updatedSheetData = {
      ...sheet,
      status: {
        ...sheet.status,
        [trackType]: track,
      },
    };

    await db
      .update(characters)
      .set({ sheetData: updatedSheetData })
      .where(eq(characters.id, characterId));

    // 6. Pusher Seguro: disparar apenas se campaignId for válido
    const campaignId = character.campaignId;
    if (campaignId) {
      try {
        const eventData = {
          type: "damage_log",
          trackType,
          amount,
          damageType,
          newSuperficial: superficial,
          newAggravated: aggravated,
          isCritical,
        };

        // Salvar no banco de dados para persistir permanentemente no feed!
        const insertedRoll = await db
          .insert(rolls)
          .values({
            campaignId,
            characterId: character.id,
            characterName: character.name,
            poolName: "Registro de Dano",
            resultData: eventData,
            hungerDice: 0,
            isSecret: false,
          })
          .returning({ id: rolls.id });

        const insertedId = insertedRoll[0].id;
        const serializedRoll = {
          id: insertedId,
          campaignId,
          characterId: character.id,
          characterName: character.name,
          poolName: "Registro de Dano",
          resultData: eventData,
          hungerDice: 0,
          isRerolled: false,
          isSecret: false,
          createdAt: new Date().toISOString(),
        };

        // Disparar new-roll no Pusher para atualizar o feed em tempo real de todos
        await pusherServer.trigger(
          `public-campaign-${campaignId}`,
          "new-roll",
          serializedRoll
        );

        // Disparar damage-applied para atualizar os status das fichas e tokens dos jogadores
        await pusherServer.trigger(
          `public-campaign-${campaignId}`,
          "damage-applied",
          {
            characterId: character.id,
            characterName: character.name,
            trackType,
            amount,
            damageType,
            newSuperficial: superficial,
            newAggravated: aggravated,
            isCritical,
            createdAt: new Date(),
          }
        );
      } catch (pushErr) {
        console.error("Erro ao notificar Pusher (damage-applied):", pushErr);
      }
    }

    // Revalidar rotas no cache do Next.js
    if (campaignId) {
      revalidatePath(`/campanhas/${campaignId}/mesa`);
      revalidatePath(`/campanhas/${campaignId}/jogador`);
      revalidatePath(`/campanhas/${campaignId}/narrador`);
    } else {
      revalidatePath(`/hub`);
    }

    return {
      success: true,
      health: updatedSheetData.status.health,
      willpower: updatedSheetData.status.willpower,
    };
  } catch (error: any) {
    console.error("Erro em applyDamageAction:", error);
    return { success: false, error: error?.message || "Erro interno ao aplicar dano." };
  }
}

export async function setTrackerDamageAction(
  characterId: string,
  trackType: "health" | "willpower",
  superficial: number,
  aggravated: number
) {
  try {
    // 1. Validar UUID do personagem
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido." };
    }

    // 2. Carregar personagem do banco
    const result = await db
      .select({
        id: characters.id,
        campaignId: characters.campaignId,
        name: characters.name,
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
      return { success: false, error: "Dados do personagem inválidos ou incompletos." };
    }

    // 3. Obter limites da trilha
    const max = trackType === "health" ? getMaxHealth(sheet) : getMaxWillpower(sheet);
    const track = sheet.status[trackType];
    if (!track) {
      return { success: false, error: `Trilha ${trackType} não encontrada.` };
    }

    // 4. Validar limites
    const finalAgg = Math.max(0, Math.min(max, aggravated));
    const finalSup = Math.max(0, Math.min(max - finalAgg, superficial));
    const isCritical = finalAgg >= max;

    track.max = max;
    track.superficial = finalSup;
    track.aggravated = finalAgg;

    const updatedSheetData = {
      ...sheet,
      status: {
        ...sheet.status,
        [trackType]: track,
      },
    };

    // 5. Salvar no banco
    await db
      .update(characters)
      .set({ sheetData: updatedSheetData })
      .where(eq(characters.id, characterId));

    // 6. Pusher Seguro: disparar apenas se campaignId for válido
    const campaignId = character.campaignId;
    if (campaignId) {
      try {
        const eventData = {
          type: "damage_log",
          trackType,
          amount: 0,
          damageType: "override",
          newSuperficial: finalSup,
          newAggravated: finalAgg,
          isCritical,
        };

        // Salvar no banco de dados para persistir permanentemente no feed!
        const insertedRoll = await db
          .insert(rolls)
          .values({
            campaignId,
            characterId: character.id,
            characterName: character.name,
            poolName: "Registro de Dano",
            resultData: eventData,
            hungerDice: 0,
            isSecret: false,
          })
          .returning({ id: rolls.id });

        const insertedId = insertedRoll[0].id;
        const serializedRoll = {
          id: insertedId,
          campaignId,
          characterId: character.id,
          characterName: character.name,
          poolName: "Registro de Dano",
          resultData: eventData,
          hungerDice: 0,
          isRerolled: false,
          isSecret: false,
          createdAt: new Date().toISOString(),
        };

        // Disparar new-roll no Pusher para atualizar o feed em tempo real de todos
        await pusherServer.trigger(
          `public-campaign-${campaignId}`,
          "new-roll",
          serializedRoll
        );

        // Disparar damage-applied para atualizar os status das fichas e tokens dos jogadores
        await pusherServer.trigger(
          `public-campaign-${campaignId}`,
          "damage-applied",
          {
            characterId: character.id,
            characterName: character.name,
            trackType,
            amount: 0,
            damageType: "override",
            newSuperficial: finalSup,
            newAggravated: finalAgg,
            isCritical,
            createdAt: new Date(),
          }
        );
      } catch (pushErr) {
        console.error("Erro ao notificar Pusher (damage-applied override):", pushErr);
      }
    }

    // Revalidar rotas no cache do Next.js
    if (campaignId) {
      revalidatePath(`/campanhas/${campaignId}/mesa`);
      revalidatePath(`/campanhas/${campaignId}/jogador`);
      revalidatePath(`/campanhas/${campaignId}/narrador`);
    } else {
      revalidatePath(`/hub`);
    }

    return {
      success: true,
      health: updatedSheetData.status.health,
      willpower: updatedSheetData.status.willpower,
    };
  } catch (error: any) {
    console.error("Erro em setTrackerDamageAction:", error);
    return { success: false, error: error?.message || "Erro interno ao ajustar dano." };
  }
}
