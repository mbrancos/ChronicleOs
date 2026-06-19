"use server";

import { db } from "@/db";
import { characters, campaigns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CharacterSheetData } from "@/types/character";
import { auth } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";

// Função para buscar dados da ficha do banco
export async function getCharacterSheet(characterId: string) {
  try {
    // Valida se o ID fornecido é um formato UUID aceitável para o PostgreSQL
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido (não é um UUID válido)" };
    }

    const result = await db
      .select({ 
        sheetData: characters.sheetData,
        name: characters.name 
      })
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "Personagem não encontrado no banco de dados" };
    }

    return { 
      success: true, 
      data: result[0].sheetData as CharacterSheetData | null,
      name: result[0].name
    };
  } catch (error: any) {
    console.error("Erro em getCharacterSheet:", error);
    return { success: false, error: error?.message || "Erro interno de banco de dados" };
  }
}

// Server Action para salvar a ficha no banco
export async function updateCharacterSheet(characterId: string, sheetData: CharacterSheetData) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido (não é um UUID válido)" };
    }

    // Se o profile possuir o campo name, atualiza também a coluna pública name do banco para manter sincronia
    const updatePayload: any = { sheetData };
    if (sheetData.profile && sheetData.profile.name) {
      updatePayload.name = sheetData.profile.name.trim();
    }

    await db
      .update(characters)
      .set(updatePayload)
      .where(eq(characters.id, characterId));

    return { success: true };
  } catch (error: any) {
    console.error("Erro em updateCharacterSheet:", error);
    return { success: false, error: error?.message || "Falha na sincronização com o banco" };
  }
}

// Server Action de exclusão de personagem
export async function deleteCharacterAction(characterId: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido." };
    }

    // 1. Buscar o personagem para validar autoria ou Narrador
    const charResult = await db
      .select({
        userId: characters.userId,
        campaignId: characters.campaignId,
        narratorId: campaigns.narratorId,
      })
      .from(characters)
      .leftJoin(campaigns, eq(characters.campaignId, campaigns.id))
      .where(eq(characters.id, characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const char = charResult[0];

    // Permissão: Jogador dono OU Narrador da crônica
    const isOwner = char.userId === session.user.id;
    const isNarrator = char.narratorId === session.user.id;

    if (!isOwner && !isNarrator) {
      return { success: false, error: "Acesso negado: Você não possui autorização para remover este personagem." };
    }

    // 2. Deletar do banco
    await db.delete(characters).where(eq(characters.id, characterId));

    revalidatePath("/hub");
    revalidatePath(`/campanhas/${char.campaignId}/narrador`);
    return { success: true };
  } catch (err: any) {
    console.error("Erro em deleteCharacterAction:", err);
    return { success: false, error: err?.message || "Falha ao excluir personagem." };
  }
}

