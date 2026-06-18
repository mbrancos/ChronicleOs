import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { campaigns, characters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import HubClient from "@/components/hub/HubClient";

export const dynamic = "force-dynamic";

export default async function HubPage() {
  // 1. Validar sessão ativa no servidor
  const { data: session } = await auth.getSession();

  if (!session || !session.user) {
    redirect("/");
  }

  const userId = session.user.id;

  // 2. Buscar as campanhas narradas pelo usuário
  const userCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.narratorId, userId));

  // 3. Buscar os personagens pertencentes ao usuário
  const userCharacters = await db
    .select()
    .from(characters)
    .where(eq(characters.userId, userId));

  // 4. Renderizar o Client Component passando os dados
  return (
    <HubClient
      user={{
        id: session.user.id,
        name: session.user.name ?? "Membro da Camarilla",
        email: session.user.email,
      }}
      campaigns={userCampaigns}
      characters={userCharacters}
    />
  );
}
