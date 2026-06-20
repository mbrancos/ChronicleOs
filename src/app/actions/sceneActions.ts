"use server";

import { db } from "@/db";
import { sceneTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Busca todos os tokens associados a uma campanha.
 * Jogadores comuns só visualizam tokens onde isVisible === true.
 */
export async function getSceneTokens(campaignId: string, isNarrator: boolean) {
  try {
    if (!uuidRegex.test(campaignId)) {
      return { success: false, error: "ID de campanha inválido" };
    }

    let result;
    if (isNarrator) {
      result = await db
        .select()
        .from(sceneTokens)
        .where(eq(sceneTokens.campaignId, campaignId));
    } else {
      result = await db
        .select()
        .from(sceneTokens)
        .where(
          and(
            eq(sceneTokens.campaignId, campaignId),
            eq(sceneTokens.isVisible, true)
          )
        );
    }

    return JSON.parse(
      JSON.stringify({ success: true, data: result })
    );
  } catch (error) {
    console.error("Erro em getSceneTokens:", error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao buscar tokens do cenário" };
  }
}

/**
 * Cria ou insere um novo token no tabuleiro.
 */
export async function createSceneToken(
  campaignId: string,
  characterId: string | null,
  name: string,
  type: "player" | "full_npc" | "quick_npc",
  x: number,
  y: number,
  isVisible: boolean,
  quickStats?: {
    physical: number;
    social: number;
    combat: number;
    health: {
      max: number;
      superficial: number;
      aggravated: number;
    };
  }
) {
  try {
    if (!uuidRegex.test(campaignId)) {
      return { success: false, error: "ID de campanha inválido" };
    }

    if (characterId && !uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido" };
    }

    // Se já existir um token para esse personagem (player ou full_npc) no tabuleiro, não duplica, apenas retorna sucesso
    if (characterId) {
      const existing = await db
        .select()
        .from(sceneTokens)
        .where(
          and(
            eq(sceneTokens.campaignId, campaignId),
            eq(sceneTokens.characterId, characterId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { success: true, id: existing[0].id, msg: "Token já existente" };
      }
    }

    const inserted = await db
      .insert(sceneTokens)
      .values({
        campaignId,
        characterId,
        name: name.trim(),
        type,
        x,
        y,
        isVisible,
        quickStats: quickStats || null
      })
      .returning({ id: sceneTokens.id });

    return { success: true, id: inserted[0].id };
  } catch (error) {
    console.error("Erro em createSceneToken:", error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao criar token no cenário" };
  }
}

/**
 * Atualiza a posição de coordenadas (X, Y) e a visibilidade (isVisible) de um token.
 */
export async function updateTokenPosition(
  tokenId: string,
  x: number,
  y: number,
  isVisible: boolean
) {
  try {
    if (!uuidRegex.test(tokenId)) {
      return { success: false, error: "ID de token inválido" };
    }

    await db
      .update(sceneTokens)
      .set({ x, y, isVisible })
      .where(eq(sceneTokens.id, tokenId));

    return { success: true };
  } catch (error) {
    console.error("Erro em updateTokenPosition:", error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao mover token" };
  }
}

/**
 * Deleta/remove um token do cenário.
 */
export async function deleteSceneToken(tokenId: string) {
  try {
    if (!uuidRegex.test(tokenId)) {
      return { success: false, error: "ID de token inválido" };
    }

    await db.delete(sceneTokens).where(eq(sceneTokens.id, tokenId));

    return { success: true };
  } catch (error) {
    console.error("Erro em deleteSceneToken:", error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao remover token" };
  }
}

/**
 * Alterna a flag hasActed de um token específico no banco de dados.
 */
export async function toggleTokenAction(tokenId: string, hasActed: boolean) {
  try {
    if (!uuidRegex.test(tokenId)) {
      return { success: false, error: "ID de token inválido" };
    }

    await db
      .update(sceneTokens)
      .set({ hasActed })
      .where(eq(sceneTokens.id, tokenId));

    return { success: true };
  } catch (error) {
    console.error("Erro em toggleTokenAction:", error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao alternar ação do token" };
  }
}

/**
 * Reinicia a rodada definindo hasActed = false para todos os tokens da campanha.
 */
export async function resetRound(campaignId: string) {
  try {
    if (!uuidRegex.test(campaignId)) {
      return { success: false, error: "ID de campanha inválido" };
    }

    await db
      .update(sceneTokens)
      .set({ hasActed: false })
      .where(eq(sceneTokens.campaignId, campaignId));

    return { success: true };
  } catch (error) {
    console.error("Erro em resetRound:", error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao reiniciar rodada" };
  }
}

/**
 * Atualiza especificamente o estado de vida (Vitalidade) de um Quick NPC dentro de quickStats.
 */
export async function updateTokenQuickHealth(
  tokenId: string,
  healthData: { max: number; superficial: number; aggravated: number }
) {
  try {
    if (!uuidRegex.test(tokenId)) {
      return { success: false, error: "ID de token inválido" };
    }

    // Buscar o token atual para preservar os outros campos de quickStats
    const current = await db
      .select({ quickStats: sceneTokens.quickStats })
      .from(sceneTokens)
      .where(eq(sceneTokens.id, tokenId))
      .limit(1);

    if (current.length === 0) {
      return { success: false, error: "Token não encontrado" };
    }

    const stats = current[0].quickStats;
    if (!stats) {
      return { success: false, error: "Token não possui quickStats cadastrado" };
    }

    const updatedStats = {
      ...stats,
      health: healthData
    };

    await db
      .update(sceneTokens)
      .set({ quickStats: updatedStats })
      .where(eq(sceneTokens.id, tokenId));

    return { success: true };
  } catch (error) {
    console.error("Erro em updateTokenQuickHealth:", error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao atualizar vida do figurante" };
  }
}
