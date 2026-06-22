import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { characters, campaigns } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import VttRoomClient from "@/components/vtt/VttRoomClient";
import StorytellerDashboardClient from "@/components/vtt/StorytellerDashboardClient";
import { CharacterSheetData } from "@/types/character";

interface PageProps {
  params: Promise<{
    campaign_id: string;
  }>;
}

export default async function MesaPage({ params }: PageProps) {
  const { campaign_id } = await params;

  // 1. Validar se o UUID da campanha é válido
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(campaign_id)) {
    return notFound();
  }

  // 2. Buscar a sessão do usuário
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/");
  }

  // 3. Buscar a crônica/campanha para checar se o usuário logado é o Narrador
  const campaignResult = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaign_id))
    .limit(1);

  if (campaignResult.length === 0) {
    return notFound();
  }

  const campaign = campaignResult[0];
  const isNarrator = campaign.narratorId === session.user.id;

  if (isNarrator) {
    return (
      <StorytellerDashboardClient 
        campaign={{
          id: campaign.id,
          name: campaign.name,
          narratorId: campaign.narratorId,
          description: campaign.description,
          rollEffectMode: campaign.rollEffectMode,
          comedyImageUrl: campaign.comedyImageUrl
        }}
      />
    );
  }

  // 4. Buscar o personagem do jogador nesta campanha específica no Neon Database
  const userCharacters = await db
    .select()
    .from(characters)
    .where(
      and(
        eq(characters.campaignId, campaign_id),
        eq(characters.userId, session.user.id)
      )
    )
    .limit(1);

  // Segurança: se o usuário não possuir ficha associada a esta crônica, chuta ele para o Hub com erro de acesso
  if (userCharacters.length === 0) {
    redirect("/hub?error=acesso_negado");
  }

  const character = userCharacters[0];

  return (
    <VttRoomClient 
      character={{
        id: character.id,
        campaignId: character.campaignId!,
        userId: character.userId,
        name: character.name,
        type: character.type,
        sheetData: character.sheetData as CharacterSheetData,
        status: character.status,
        buildState: character.buildState
      }} 
      campaignSettings={{
        rollEffectMode: campaign.rollEffectMode,
        comedyImageUrl: campaign.comedyImageUrl
      }}
    />
  );
}
