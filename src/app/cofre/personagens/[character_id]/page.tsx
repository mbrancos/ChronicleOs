import { getCharacterSheet } from "@/app/actions/characterActions";
import CharacterSheetClient from "@/components/sheet/CharacterSheetClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    character_id: string;
  }>;
}

export default async function VaultCharacterPage({ params }: PageProps) {
  const { character_id } = await params;

  // Carregar a ficha de forma limpa direto no servidor
  const response = await getCharacterSheet(character_id);

  if (!response.success) {
    return notFound();
  }

  const initialData = response.data ?? null;

  return (
    <CharacterSheetClient 
      characterId={character_id}
      campaignId={null}
      initialData={initialData}
      initialName={response.name ?? ""}
      initialStatus={(response.type === "npc") ? "DRAFT" : response.status}
      initialBuildState={response.buildState}
      characterType={response.type}
      chronicle={null}
    />
  );
}
