"use server";

import { db } from "@/db";
import { campaigns, characters } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import { eq } from "drizzle-orm";

export async function getCampaignDashboard(campaignId: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // Validar se o ID da campanha segue um formato UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(campaignId)) {
      return { success: false, error: "ID de campanha inválido." };
    }

    // 1. Buscar a campanha no banco
    const campaignResult = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (campaignResult.length === 0) {
      return { success: false, error: "Crônica não encontrada." };
    }

    const campaign = campaignResult[0];

    // 2. Validar se o usuário atual é o Narrador da campanha
    if (campaign.narratorId !== session.user.id) {
      return { success: false, error: "Acesso negado: Você não é o Narrador desta crônica.", isForbidden: true };
    }

    // 3. Buscar todos os personagens pertencentes a essa campanha
    const campaignCharacters = await db
      .select()
      .from(characters)
      .where(eq(characters.campaignId, campaignId));

    const players = campaignCharacters.filter(c => c.type === "jogador");
    const npcs = campaignCharacters.filter(c => c.type === "npc");

    return {
      success: true,
      data: {
        campaign,
        players,
        npcs
      }
    };
  } catch (err: any) {
    console.error("Erro em getCampaignDashboard:", err);
    return { success: false, error: err?.message || "Erro ao carregar o painel da crônica." };
  }
}
