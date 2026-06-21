"use server";

import { db } from "@/db";
import { campaigns, characters } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { DEFAULT_CHARACTER_DATA } from "@/types/character";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Busca os dados iniciais do Hub do usuário logado
export async function getUserHubData() {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;

    // 1. Buscar campanhas criadas pelo usuário (Narrador)
    const userCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.narratorId, userId));

    // 2. Buscar personagens criados pelo usuário com o nome da campanha associada
    const userCharacters = await db
      .select({
        id: characters.id,
        name: characters.name,
        type: characters.type,
        campaignId: characters.campaignId,
        campaignName: campaigns.name,
        sheetData: characters.sheetData,
      })
      .from(characters)
      .leftJoin(campaigns, eq(characters.campaignId, campaigns.id))
      .where(eq(characters.userId, userId));

    return {
      success: true,
      data: {
        campaigns: userCampaigns,
        characters: userCharacters,
        user: {
          id: session.user.id,
          name: session.user.name ?? "Membro da Camarilla",
          email: session.user.email,
        }
      }
    };
  } catch (err: any) {
    console.error("Erro em getUserHubData:", err);
    return { success: false, error: err?.message || "Erro ao carregar dados do Hub." };
  }
}

const DEFAULT_ALLOWED_CLANS = [
  "Banu Haqim", "Brujah", "Gangrel", "Hecata", "Lasombra", "Malkaviano", "Malkavian", "Ministério", "Nosferatu", "Ravnos", "Salubri", "Toreador", "Tremere", "Tzimisce", "Ventrue", "Caitiff", "Sem Clã"
];

// Cria uma nova campanha (crônica)
export async function createCampaignAction(name: string, description?: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: "O nome da crônica é obrigatório." };
    }

    await db.insert(campaigns).values({
      name: trimmedName,
      description: description?.trim() || null,
      narratorId: session.user.id,
      status: "RECRUITING", // Começa aberta para recrutamento por padrão
      powerLevel: "NEONATE",
      extraXp: 0,
      allowedClans: DEFAULT_ALLOWED_CLANS,
    });

    revalidatePath("/hub");
    return { success: true };
  } catch (err: any) {
    console.error("Erro em createCampaignAction:", err);
    return { success: false, error: err?.message || "Erro ao criar a crônica." };
  }
}

// Cria um novo personagem inicializando a ficha com dados padrão
export async function createCharacterAction(name: string, campaignId?: string | null, type: "jogador" | "npc" = "jogador") {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: "O nome do personagem é obrigatório." };
    }

    let targetCampaignId: string | null = null;
    if (campaignId && campaignId.trim() !== "") {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(campaignId)) {
        return { success: false, error: "ID de campanha inválido." };
      }
      targetCampaignId = campaignId;
    }

    const newChar = await db.insert(characters).values({
      campaignId: targetCampaignId,
      userId: type === "jogador" ? session.user.id : null,
      name: trimmedName,
      type,
      sheetData: DEFAULT_CHARACTER_DATA,
    }).returning({ id: characters.id });

    revalidatePath("/hub");
    if (targetCampaignId) {
      revalidatePath(`/campanhas/${targetCampaignId}/narrador`);
    }
    return { success: true, characterId: newChar[0].id };
  } catch (err: any) {
    console.error("Erro em createCharacterAction:", err);
    return { success: false, error: err?.message || "Erro ao criar o personagem." };
  }
}

// Ação de Logout
export async function signOutAction() {
  try {
    await auth.signOut({
      fetchOptions: {
        headers: await headers(),
      },
    });
  } catch (error) {
    console.error("Erro no signOut:", error);
  }
  redirect("/");
}

// Server Action para atualizar nome e descrição de uma campanha (crônica)
export async function updateCampaignAction(campaignId: string, name: string, description?: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(campaignId)) {
      return { success: false, error: "ID de crônica inválido." };
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 50) {
      return { success: false, error: "O nome da crônica deve ter entre 3 e 50 caracteres." };
    }

    // 1. Verificar se a campanha existe e se o usuário é o narrador
    const campResult = await db
      .select({ narratorId: campaigns.narratorId })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (campResult.length === 0) {
      return { success: false, error: "Crônica não encontrada." };
    }

    if (campResult[0].narratorId !== session.user.id) {
      return { success: false, error: "Acesso negado: Apenas o Narrador criador pode editar esta crônica." };
    }

    // 2. Atualizar no banco
    await db
      .update(campaigns)
      .set({
        name: trimmedName,
        description: description?.trim() || null,
      })
      .where(eq(campaigns.id, campaignId));

    revalidatePath("/hub");
    return { success: true };
  } catch (err: any) {
    console.error("Erro em updateCampaignAction:", err);
    return { success: false, error: err?.message || "Falha ao editar a crônica." };
  }
}

// Server Action para excluir uma campanha (crônica)
export async function deleteCampaignAction(campaignId: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(campaignId)) {
      return { success: false, error: "ID de crônica inválido." };
    }

    // 1. Verificar se a campanha existe e se o usuário é o narrador
    const campResult = await db
      .select({ narratorId: campaigns.narratorId })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (campResult.length === 0) {
      return { success: false, error: "Crônica não encontrada." };
    }

    if (campResult[0].narratorId !== session.user.id) {
      return { success: false, error: "Acesso negado: Apenas o Narrador criador pode excluir esta crônica." };
    }

    // 2. Deletar do banco (Postgres lidará com CASCADE em rolagens e SET NULL em personagens)
    await db.delete(campaigns).where(eq(campaigns.id, campaignId));

    revalidatePath("/hub");
    return { success: true };
  } catch (err: any) {
    console.error("Erro em deleteCampaignAction:", err);
    return { success: false, error: err?.message || "Falha ao excluir a crônica." };
  }
}

// Server Action para atualizar configurações refinadas da campanha (Narrador)
export async function updateCampaignSettingsAction(
  campaignId: string,
  settings: {
    status: "DRAFT" | "RECRUITING" | "IN_PROGRESS" | "PAUSED" | "ARCHIVED";
    powerLevel: "FLEDGLING" | "NEONATE" | "ANCILLAE";
    extraXp: number;
    allowedClans: string[];
  }
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(campaignId)) {
      return { success: false, error: "ID de crônica inválido." };
    }

    // 1. Verificar se a campanha existe e se o usuário é o narrador
    const campResult = await db
      .select({ narratorId: campaigns.narratorId })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (campResult.length === 0) {
      return { success: false, error: "Crônica não encontrada." };
    }

    if (campResult[0].narratorId !== session.user.id) {
      return { success: false, error: "Acesso negado: Apenas o Narrador criador pode editar as configurações desta crônica." };
    }

    // 2. Atualizar no banco
    await db
      .update(campaigns)
      .set({
        status: settings.status,
        powerLevel: settings.powerLevel,
        extraXp: Math.max(0, Number(settings.extraXp) || 0),
        allowedClans: settings.allowedClans,
      })
      .where(eq(campaigns.id, campaignId));

    revalidatePath("/hub");
    revalidatePath(`/campanhas/${campaignId}/narrador`);
    return { success: true };
  } catch (err: any) {
    console.error("Erro em updateCampaignSettingsAction:", err);
    return { success: false, error: err?.message || "Falha ao atualizar configurações da crônica." };
  }
}
