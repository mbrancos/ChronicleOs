import { getCharacterSheet } from "@/app/actions/characterActions";
import CharacterSheetClient from "@/components/sheet/CharacterSheetClient";
import { notFound } from "next/navigation";

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

  const initialData = response.data ?? null;

  return (
    <CharacterSheetClient 
      characterId={character_id}
      campaignId={campaign_id}
      initialData={initialData}
    />
  );
}
