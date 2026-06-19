import { redirect } from "next/navigation";
import HubClient from "@/components/hub/HubClient";
import { getUserHubData } from "@/app/actions/hubActions";

export const dynamic = "force-dynamic";

export default async function HubPage() {
  // 1. Carregar dados do Hub do usuário autenticado via Server Action consolidada
  const result = await getUserHubData();

  if (!result.success || !result.data) {
    if (result.error === "Usuário não autenticado.") {
      redirect("/");
    }
    throw new Error(result.error || "Erro ao carregar os dados do Hub.");
  }

  const { campaigns, characters, user } = result.data;

  // 2. Renderizar o Client Component passando os dados carregados
  return (
    <HubClient
      user={user}
      campaigns={campaigns}
      characters={characters}
    />
  );
}

