"use server";

import { db } from "@/db";
import { rolls } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro em getRecentRolls:", error);
    return { success: false, error: error?.message || "Falha ao buscar rolagens do banco" };
  }
}
