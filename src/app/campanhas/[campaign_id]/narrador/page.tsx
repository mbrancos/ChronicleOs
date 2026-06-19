import { redirect } from "next/navigation";
import { getCampaignDashboard } from "@/app/actions/narratorActions";
import NarratorDashboardClient from "@/components/narrator/NarratorDashboardClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ campaign_id: string }>;
}

export default async function NarratorPage({ params }: PageProps) {
  // 1. Resolver params de forma assíncrona no Next.js 15
  const { campaign_id } = await params;

  // 2. Chamar a Server Action de busca e segurança do painel
  const result = await getCampaignDashboard(campaign_id);

  if (!result.success || !result.data) {
    if (result.isForbidden) {
      // Segurança: se não for o narrador, redireciona silenciosamente para o Hub
      redirect("/hub");
    }
    // Caso a crônica não exista ou outro erro de banco, lança erro
    throw new Error(result.error || "Erro ao carregar dados do painel do Narrador.");
  }

  const { campaign, players, npcs } = result.data;

  // 3. Renderizar o painel tático do mestre
  return (
    <NarratorDashboardClient
      campaign={campaign}
      players={players}
      npcs={npcs}
    />
  );
}

