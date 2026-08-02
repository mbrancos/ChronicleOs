import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { characters, campaigns } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  email?: string | null;
}

/**
 * Garante que a requisição venha de um usuário autenticado via Neon Auth.
 */
export async function requireUser(): Promise<{ success: true; user: AuthenticatedUser } | { success: false; error: string }> {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    return {
      success: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao verificar autenticação." };
  }
}

/**
 * Verifica se o usuário tem permissão de acesso/edição sobre o personagem.
 * Permissão é concedida se:
 * 1. O usuário é o dono/criador do personagem (userId === character.userId).
 * 2. O usuário é o Narrador da campanha vinculada ao personagem (userId === campaign.narratorId).
 */
export async function requireCharacterAccess(
  characterId: string,
  userId: string
): Promise<{ success: true; character: any; isNarrator: boolean } | { success: false; error: string }> {
  try {
    const charResult = await db
      .select({
        character: characters,
        narratorId: campaigns.narratorId,
      })
      .from(characters)
      .leftJoin(campaigns, eq(characters.campaignId, campaigns.id))
      .where(eq(characters.id, characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const { character, narratorId } = charResult[0];
    const isOwner = character.userId === userId;
    const isNarrator = Boolean(narratorId && narratorId === userId);

    if (!isOwner && !isNarrator) {
      return { success: false, error: "Acesso negado: Você não possui permissão sobre este personagem." };
    }

    return { success: true, character, isNarrator };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao verificar acesso ao personagem." };
  }
}

/**
 * Verifica se o usuário é o Narrador da campanha informada.
 */
export async function requireCampaignNarrator(
  campaignId: string,
  userId: string
): Promise<{ success: true; campaign: any } | { success: false; error: string }> {
  try {
    const campaignResult = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (campaignResult.length === 0) {
      return { success: false, error: "Crônica não encontrada." };
    }

    const campaign = campaignResult[0];
    if (campaign.narratorId !== userId) {
      return { success: false, error: "Acesso negado: Você não é o Narrador desta crônica." };
    }

    return { success: true, campaign };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao verificar permissão do Narrador." };
  }
}
