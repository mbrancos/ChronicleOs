import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { campaigns, characters, users } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import PlayerLobbyClient from "@/components/lobby/PlayerLobbyClient";
import { CharacterSheetData } from "@/types/character";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    campaign_id: string;
  }>;
}

export default async function PlayerLobbyPage({ params }: PageProps) {
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

  const userId = session.user.id;

  // 3. Buscar a campanha/crônica
  const campaignResult = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaign_id))
    .limit(1);

  if (campaignResult.length === 0) {
    return notFound();
  }

  const campaign = campaignResult[0];

  // 4. Buscar o personagem do jogador logado nesta crônica
  const myCharacterResult = await db
    .select()
    .from(characters)
    .where(
      and(
        eq(characters.campaignId, campaign_id),
        eq(characters.userId, userId),
        eq(characters.type, "jogador")
      )
    )
    .limit(1);

  // Segurança: se o usuário não possuir um personagem ativo associado a esta crônica, chuta ele para o Hub
  if (myCharacterResult.length === 0) {
    redirect("/hub?error=acesso_negado");
  }

  const myCharacter = myCharacterResult[0];

  // 5. Buscar o nome do Narrador da crônica
  const narratorResult = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, campaign.narratorId))
    .limit(1);

  const narratorName = narratorResult[0]?.name ?? "Narrador Oculto";

  // 6. Buscar outros membros da Coterie (Aliados)
  const coterieCharacters = await db
    .select({
      id: characters.id,
      name: characters.name,
      sheetData: characters.sheetData,
    })
    .from(characters)
    .where(
      and(
        eq(characters.campaignId, campaign_id),
        eq(characters.type, "jogador"),
        ne(characters.id, myCharacter.id)
      )
    );

  // Serializar os dados dos aliados
  const coterie = coterieCharacters.map(char => {
    const data = char.sheetData as CharacterSheetData;
    return {
      id: char.id,
      name: char.name,
      clan: data?.profile?.clan || "Vampiro",
    };
  });

  return (
    <PlayerLobbyClient
      campaign={{
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        powerLevel: campaign.powerLevel,
        narratorName,
      }}
      character={{
        id: myCharacter.id,
        name: myCharacter.name,
        clan: (myCharacter.sheetData as CharacterSheetData)?.profile?.clan || "Vampiro",
        concept: (myCharacter.sheetData as CharacterSheetData)?.profile?.concept || "Neófito",
      }}
      coterie={coterie}
    />
  );
}
