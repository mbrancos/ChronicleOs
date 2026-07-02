"use server";

import { db } from "@/db";
import { rolls } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { rerollV5 } from "@/lib/vtt/BloodEngine";
import { pusherServer } from "@/lib/pusher";

/**
 * Persiste uma nova rolagem (padrão ou teste de despertar) no banco de dados e notifica via WebSocket.
 */
export async function saveRoll(
  campaignId: string,
  characterId: string | null,
  characterName: string,
  poolName: string,
  resultData: any,
  isSecret: boolean = false
) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(campaignId)) {
      return { success: false, error: "ID de campanha inválido (não é um UUID válido)" };
    }

    if (characterId && !uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido (não é um UUID válido)" };
    }

    // Calcular dados de fome a partir do resultado
    let hungerCount = 0;
    if (resultData && resultData.type === "standard" && Array.isArray(resultData.hungerDice)) {
      hungerCount = resultData.hungerDice.length;
    }

    const inserted = await db
      .insert(rolls)
      .values({
        campaignId,
        characterId,
        characterName: characterName.trim(),
        poolName: poolName.trim(),
        resultData,
        hungerDice: hungerCount,
        isSecret,
      })
      .returning({ id: rolls.id });

    const insertedId = inserted[0].id;
    const createdAtStr = new Date().toISOString();

    const serializedRoll = {
      id: insertedId,
      campaignId,
      characterId,
      characterName: characterName.trim(),
      poolName: poolName.trim(),
      resultData,
      hungerDice: hungerCount,
      isRerolled: false,
      isSecret,
      createdAt: createdAtStr
    };

    // Disparar WebSocket no Pusher
    try {
      if (isSecret) {
        // Enviar completo apenas para o Narrador (canal privado)
        await pusherServer.trigger(`private-gm-${campaignId}`, "new-roll", serializedRoll);
        
        // Enviar fantasma mascarado para os jogadores no canal público
        const maskedResult = resultData.type === "standard" 
          ? {
              type: "standard",
              normalDice: Array(resultData.normalDice?.length || 0).fill(null),
              hungerDice: Array(resultData.hungerDice?.length || 0).fill(null),
              totalSuccesses: 0,
              isSuccess: false,
              isBestialFailure: false,
              isMessianic: false
            }
          : {
              type: "rouse",
              isSuccess: false
            };

        await pusherServer.trigger(`public-campaign-${campaignId}`, "new-roll", {
          ...serializedRoll,
          characterId: null,
          characterName: "Narrador",
          poolName: "O Narrador realizou uma rolagem em segredo...",
          resultData: maskedResult,
        });
      } else {
        // Enviar completo no canal público
        await pusherServer.trigger(`public-campaign-${campaignId}`, "new-roll", serializedRoll);
      }
    } catch (pushErr) {
      console.error("Erro ao disparar Pusher na rolagem:", pushErr);
    }

    return { success: true, id: insertedId };
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

    return JSON.parse(
      JSON.stringify({ success: true, data: serialized })
    );
  } catch (error) {
    console.error("Erro em getRecentRolls:", error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao buscar rolagens do banco" };
  }
}

/**
 * Executa a rerrolagem de Força de Vontade (Willpower Reroll) para um teste padrão e notifica via WebSocket.
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
      const newHungerCount = newResultData.hungerDice ? newResultData.hungerDice.length : 0;

      // 4. Marcar a original como já rerrolada
      await tx
        .update(rolls)
        .set({ isRerolled: true })
        .where(eq(rolls.id, originalRollId));

      // 5. Inserir a nova rolagem inheriting isSecret
      const inserted = await tx
        .insert(rolls)
        .values({
          campaignId: originalRoll.campaignId,
          characterId,
          characterName: originalRoll.characterName,
          poolName: `Rerrolagem: ${originalRoll.poolName}`,
          resultData: newResultData,
          hungerDice: newHungerCount,
          isRerolled: true,
          isSecret: originalRoll.isSecret,
        })
        .returning({ id: rolls.id });

      return {
        newRollId: inserted[0].id,
        campaignId: originalRoll.campaignId,
        isSecret: originalRoll.isSecret,
        originalName: originalRoll.characterName,
        originalPoolName: originalRoll.poolName,
        newResultData,
        newHungerCount
      };
    });

    // Disparar WebSocket no Pusher
    try {
      const channelPrefix = transactionResult.isSecret ? "private-gm" : "public-campaign";
      const campaignId = transactionResult.campaignId;

      // 1. Notificar alteração de isRerolled na rolagem original
      await pusherServer.trigger(`${channelPrefix}-${campaignId}`, "update-roll", {
        id: originalRollId,
        isRerolled: true
      });

      // 2. Notificar a nova rolagem de rerrolagem
      const serializedReroll = {
        id: transactionResult.newRollId,
        campaignId,
        characterId,
        characterName: transactionResult.originalName,
        poolName: `Rerrolagem: ${transactionResult.originalName}`,
        resultData: transactionResult.newResultData,
        hungerDice: transactionResult.newHungerCount,
        isRerolled: true,
        isSecret: transactionResult.isSecret,
        createdAt: new Date().toISOString()
      };

      if (transactionResult.isSecret) {
        await pusherServer.trigger(`private-gm-${campaignId}`, "new-roll", serializedReroll);
        
        // Enviar fantasma mascarado para os jogadores
        const maskedResult = {
          type: "standard",
          normalDice: Array(transactionResult.newResultData.normalDice?.length || 0).fill(null),
          hungerDice: Array(transactionResult.newResultData.hungerDice?.length || 0).fill(null),
          totalSuccesses: 0,
          isSuccess: false
        };
        await pusherServer.trigger(`public-campaign-${campaignId}`, "new-roll", {
          ...serializedReroll,
          characterId: null,
          characterName: "Narrador",
          poolName: "O Narrador realizou uma rolagem em segredo...",
          resultData: maskedResult
        });
      } else {
        await pusherServer.trigger(`public-campaign-${campaignId}`, "new-roll", serializedReroll);
      }
    } catch (pushErr) {
      console.error("Erro ao disparar Pusher na rerrolagem:", pushErr);
    }

    return { success: true, id: transactionResult.newRollId };
  } catch (error: any) {
    console.error("Erro em executeWillpowerReroll:", error);
    return { success: false, error: error?.message || "Falha ao executar rerrolagem no banco" };
  }
}
