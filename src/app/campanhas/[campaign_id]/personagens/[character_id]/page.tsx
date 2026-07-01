import { getCharacterSheet } from "@/app/actions/characterActions";
import CharacterSheetClient from "@/components/sheet/CharacterSheetClient";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { eq } from "drizzle-orm";

interface PageProps {
  params: Promise<{
    campaign_id: string;
    character_id: string;
  }>;
}

export default async function CharacterPage({ params }: PageProps) {
  const { campaign_id, character_id } = await params;

  // Carregar os dados de forma limpa direto no servidor
  const response = await getCharacterSheet(character_id);

  if (!response.success) {
    // Retorna página 404 nativa se o ID não for um UUID ou o personagem não existir
    return notFound();
  }

  // Buscar a campanha para injetar as regras customizadas (homebrews)
  const campaignResult = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaign_id))
    .limit(1);

  const campaign = campaignResult[0] || null;
  const initialData = response.data ?? null;

  return (
    <CharacterSheetClient 
      characterId={character_id}
      campaignId={campaign_id}
      initialData={initialData}
      initialName={response.name ?? ""}
      initialStatus={(response.type === "npc") ? "DRAFT" : response.status}
      initialBuildState={response.buildState}
      characterType={response.type}
      chronicle={campaign}
    />
  );
}
