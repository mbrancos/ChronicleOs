"use server";

import { db } from "@/db";
import { characters, campaigns, users } from "@/db/schema";
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

    // 1. Buscar o personagem para validar autoria
    const charResult = await db
      .select({
        userId: characters.userId,
        campaignId: characters.campaignId,
      })
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const char = charResult[0];

    // Permissão: Apenas o jogador dono pode deletar seu próprio personagem permanentemente
    const isOwner = char.userId === session.user.id;

    if (!isOwner) {
      return { success: false, error: "Acesso negado: Você não possui autorização para remover este personagem." };
    }

    // 2. Deletar do banco
    await db.delete(characters).where(eq(characters.id, characterId));

    revalidatePath("/hub");
    if (char.campaignId) {
      revalidatePath(`/campanhas/${char.campaignId}/narrador`);
    }
    return { success: true };
  } catch (err: any) {
    console.error("Erro em deleteCharacterAction:", err);
    return { success: false, error: err?.message || "Falha ao excluir personagem." };
  }
}

// Server Action de duplicação de personagem
export async function duplicateCharacterAction(characterId: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido." };
    }

    // 1. Buscar o personagem original
    const charResult = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem original não encontrado." };
    }

    const originalChar = charResult[0];

    // Segurança: apenas o dono pode duplicar o personagem
    if (originalChar.userId !== session.user.id) {
      return { success: false, error: "Acesso negado: Você não é o proprietário deste personagem." };
    }

    // 2. Inserir clone no Cofre
    await db.insert(characters).values({
      name: `${originalChar.name} (Cópia)`,
      type: originalChar.type,
      userId: session.user.id,
      campaignId: null, // Forçado a ir para o Cofre
      sheetData: originalChar.sheetData,
    });

    revalidatePath("/hub");
    return { success: true };
  } catch (err: any) {
    console.error("Erro em duplicateCharacterAction:", err);
    return { success: false, error: err?.message || "Falha ao duplicar personagem." };
  }
}

// Server Action de transferência de personagem para outro jogador
export async function transferCharacterAction(characterId: string, targetUserEmail: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido." };
    }

    const emailTrimmed = targetUserEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      return { success: false, error: "O e-mail de destino é obrigatório." };
    }

    // 1. Buscar o personagem original
    const charResult = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const char = charResult[0];

    // Segurança: apenas o dono pode transferir o personagem
    if (char.userId !== session.user.id) {
      return { success: false, error: "Acesso negado: Você não é o proprietário deste personagem." };
    }

    // Evitar transferir para si mesmo
    if (session.user.email?.toLowerCase() === emailTrimmed) {
      return { success: false, error: "Você já é o proprietário deste personagem." };
    }

    // 2. Buscar o usuário de destino pelo e-mail
    const targetUserResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, emailTrimmed))
      .limit(1);

    if (targetUserResult.length === 0) {
      return { success: false, error: "Usuário destinatário não encontrado na base de dados." };
    }

    const targetUserId = targetUserResult[0].id;

    // 3. Atualizar o personagem: muda o dono e expulsa de qualquer crônica ativa (vai pro Cofre)
    await db
      .update(characters)
      .set({
        userId: targetUserId,
        campaignId: null, // Expulsa da crônica ativa
      })
      .where(eq(characters.id, characterId));

    revalidatePath("/hub");
    if (char.campaignId) {
      revalidatePath(`/campanhas/${char.campaignId}/narrador`);
    }
    return { success: true };
  } catch (err: any) {
    console.error("Erro em transferCharacterAction:", err);
    return { success: false, error: err?.message || "Falha ao transferir personagem." };
  }
}

// Server Action para associar um personagem livre do cofre a uma nova campanha (crônica)
export async function joinCampaignWithCharacterAction(characterId: string, campaignId: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId) || !uuidRegex.test(campaignId)) {
      return { success: false, error: "IDs fornecidos são inválidos." };
    }

    // 1. Verificar se a campanha existe
    const campResult = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (campResult.length === 0) {
      return { success: false, error: "Crônica não encontrada." };
    }

    // 2. Buscar o personagem para validar posse e se ele está no cofre
    const charResult = await db
      .select({ 
        userId: characters.userId, 
        campaignId: characters.campaignId 
      })
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const char = charResult[0];

    // Segurança: o usuário atual deve ser o dono do personagem
    if (char.userId !== session.user.id) {
      return { success: false, error: "Acesso negado: Você não é o proprietário deste personagem." };
    }

    // Segurança: o personagem deve estar no cofre (sem crônica ativa)
    if (char.campaignId) {
      return { success: false, error: "Este personagem já faz parte de outra crônica ativa." };
    }

    // 3. Atualizar o campaignId do personagem no banco
    await db
      .update(characters)
      .set({ campaignId })
      .where(eq(characters.id, characterId));

    revalidatePath("/hub");
    revalidatePath(`/campanhas/${campaignId}/narrador`);
    return { success: true };
  } catch (err: any) {
    console.error("Erro em joinCampaignWithCharacterAction:", err);
    return { success: false, error: err?.message || "Falha ao entrar na crônica." };
  }
}

