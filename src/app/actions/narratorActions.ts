"use server";

import { db } from "@/db";
import { campaigns, characters, users } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import { eq, and, isNull, or, ne } from "drizzle-orm";

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

    // 3. Executar as buscas de personagens da campanha e do cofre em paralelo (Eliminação de Waterfalls)
    const [rawCharacters, vaultCharacters] = await Promise.all([
      db
        .select({
          character: characters,
          userName: users.name,
          userEmail: users.email
        })
        .from(characters)
        .leftJoin(users, eq(characters.userId, users.id))
        .where(eq(characters.campaignId, campaignId)),
      db
        .select()
        .from(characters)
        .where(
          and(
            eq(characters.userId, session.user.id),
            or(
              isNull(characters.campaignId),
              ne(characters.campaignId, campaignId)
            )
          )
        )
    ]);

    const campaignCharacters = rawCharacters.map(row => ({
      ...row.character,
      userName: row.userName || null,
      userEmail: row.userEmail || null
    }));

    const players = campaignCharacters.filter(c => c.type === "jogador");
    const npcs = campaignCharacters.filter(c => c.type === "npc");

    return JSON.parse(
      JSON.stringify({
        success: true,
        data: {
          campaign,
          players,
          npcs,
          vaultCharacters
        }
      })
    );
  } catch (err) {
    console.error("Erro em getCampaignDashboard:", err);
    return { success: false, error: err instanceof Error ? err.message : "Erro ao carregar o painel da crônica." };
  }
}
