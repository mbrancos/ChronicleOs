"use server";

import { db } from "@/db";
import { rolls } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { rerollV5 } from "@/lib/vtt/BloodEngine";

/**
 * Persiste uma nova rolagem (padrão ou teste de despertar) no banco de dados.
 */
export async function saveRoll(
  campaignId: string,
  characterId: string | null,
  characterName: string,
  poolName: string,
  resultData: any
) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(campaignId)) {
      return { success: false, error: "ID de campanha inválido (não é um UUID válido)" };
    }

    if (characterId && !uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido (não é um UUID válido)" };
    }

    const inserted = await db
      .insert(rolls)
      .values({
        campaignId,
        characterId,
        characterName: characterName.trim(),
        poolName: poolName.trim(),
        resultData,
      })
      .returning({ id: rolls.id });

    return { success: true, id: inserted[0].id };
  } catch (error: any) {
    console.error("Erro ao salvar rolagem:", error);
    return { success: false, error: error?.message || "Falha ao gravar rolagem no banco" };
  }
}

/**
 * Busca as últimas 50 rolagens executadas em uma mesa/campanha específica.
 */
export async function getRecentRolls(campaignId: string) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(campaignId)) {
      return { success: false, error: "ID de campanha inválido" };
    }

    const result = await db
      .select()
      .from(rolls)
      .where(eq(rolls.campaignId, campaignId))
      .orderBy(desc(rolls.createdAt))
      .limit(50);

    const serialized = result.map((roll) => ({
      ...roll,
      createdAt: roll.createdAt instanceof Date ? roll.createdAt.toISOString() : String(roll.createdAt),
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error("Erro em getRecentRolls:", error);
    return { success: false, error: error?.message || "Falha ao buscar rolagens do banco" };
  }
}

/**
 * Executa a rerrolagem de Força de Vontade (Willpower Reroll) para um teste padrão.
 */
export async function executeWillpowerReroll(
  originalRollId: string,
  diceIndices: number[],
  characterId: string
) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(originalRollId) || !uuidRegex.test(characterId)) {
      return { success: false, error: "IDs inválidos fornecidos." };
    }

    if (!Array.isArray(diceIndices) || diceIndices.length === 0 || diceIndices.length > 3) {
      return { success: false, error: "Selecione entre 1 e 3 dados normais para rerrolar." };
    }

    const transactionResult = await db.transaction(async (tx) => {
      // 1. Buscar a rolagem original
      const existing = await tx
        .select()
        .from(rolls)
        .where(eq(rolls.id, originalRollId))
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Rolagem original não encontrada.");
      }

      const originalRoll = existing[0];

      // 2. Verificar posse e validade
      if (originalRoll.characterId !== characterId) {
        throw new Error("Você não é o dono desta rolagem para poder rerrolá-la.");
      }

      if (originalRoll.isRerolled) {
        throw new Error("Esta rolagem já foi rerrolada anteriormente.");
      }

      const resultData = originalRoll.resultData as any;
      if (!resultData || resultData.type !== "standard") {
        throw new Error("Apenas rolagens padrão (não Rouse Checks) podem ser rerroladas.");
      }

      // 3. Executar o cálculo lógico da rerrolagem
      const newResultData = rerollV5(resultData, diceIndices);

      // 4. Marcar a original como já rerrolada
      await tx
        .update(rolls)
        .set({ isRerolled: true })
        .where(eq(rolls.id, originalRollId));

      // 5. Inserir a nova rolagem
      const inserted = await tx
        .insert(rolls)
        .values({
          campaignId: originalRoll.campaignId,
          characterId,
          characterName: originalRoll.characterName,
          poolName: `Rerrolagem: ${originalRoll.poolName}`,
          resultData: newResultData,
          isRerolled: true,
        })
        .returning({ id: rolls.id });

      return inserted[0].id;
    });

    return { success: true, id: transactionResult };
  } catch (error: any) {
    console.error("Erro em executeWillpowerReroll:", error);
    return { success: false, error: error?.message || "Falha ao executar rerrolagem no banco" };
  }
}
