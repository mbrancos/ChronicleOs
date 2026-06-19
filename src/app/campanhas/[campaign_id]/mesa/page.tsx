import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import VttRoomClient from "@/components/vtt/VttRoomClient";

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

  // 3. Buscar o personagem do jogador nesta campanha específica no Neon Database
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

  // Segurança: se o usuário não possuir ficha associada a esta crônica, chuta ele para o Hub
  if (userCharacters.length === 0) {
    redirect("/hub");
  }

  const character = userCharacters[0];

  return (
    <VttRoomClient 
      character={{
        id: character.id,
        campaignId: character.campaignId,
        userId: character.userId,
        name: character.name,
        type: character.type,
        sheetData: character.sheetData
      }} 
    />
  );
}
