"use server";

import { db } from "@/db";
import { characters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CharacterSheetData } from "@/types/character";

// Função para buscar dados da ficha do banco
export async function getCharacterSheet(characterId: string) {
  try {
    // Valida se o ID fornecido é um formato UUID aceitável para o PostgreSQL
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido (não é um UUID válido)" };
    }

    const result = await db
      .select({ sheetData: characters.sheetData })
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "Personagem não encontrado no banco de dados" };
    }

    return { 
      success: true, 
      data: result[0].sheetData as CharacterSheetData | null 
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

    await db
      .update(characters)
      .set({ sheetData })
      .where(eq(characters.id, characterId));

    return { success: true };
  } catch (error: any) {
    console.error("Erro em updateCharacterSheet:", error);
    return { success: false, error: error?.message || "Falha na sincronização com o banco" };
  }
}
