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
    });

    revalidatePath("/hub");
    return { success: true };
  } catch (err: any) {
    console.error("Erro em createCampaignAction:", err);
    return { success: false, error: err?.message || "Erro ao criar a crônica." };
  }
}

// Cria um novo personagem inicializando a ficha com dados padrão
export async function createCharacterAction(name: string, campaignId: string, type: "jogador" | "npc" = "jogador") {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: "O nome do personagem é obrigatório." };
    }

    // Validar se o ID da campanha é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(campaignId)) {
      return { success: false, error: "ID de campanha inválido." };
    }

    const newChar = await db.insert(characters).values({
      campaignId,
      userId: type === "jogador" ? session.user.id : null,
      name: trimmedName,
      type,
      sheetData: DEFAULT_CHARACTER_DATA,
    }).returning({ id: characters.id });

    revalidatePath("/hub");
    revalidatePath(`/campanhas/${campaignId}/narrador`);
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
