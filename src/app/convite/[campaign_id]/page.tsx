import { db } from "@/db";
import { campaigns, characters, users } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import InviteClient from "@/components/invite/InviteClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ campaign_id: string }>;
}

// Interface gótica amigável para quando o convite não existe
function InviteNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-main text-text-primary p-6 font-reading">
      <div className="w-full max-w-md border border-blood-red/30 bg-bg-card p-8 text-center space-y-6 rounded-sm shadow-[0_0_20px_rgba(200,36,52,0.1)] animate-fade-in">
        <h1 className="text-3xl font-gothic tracking-wider text-blood-red">
          O CONVITE SE DESFEZ NA NÉVOA
        </h1>
        <div className="h-px w-16 bg-blood-red/40 mx-auto" />
        <p className="text-sm text-text-muted leading-relaxed">
          Esta crônica não foi encontrada nas sombras do templo. O elo de convite pode estar corrompido ou a campanha foi apagada pelo Narrador.
        </p>
        <div className="pt-2">
          <Link
            href="/hub"
            className="inline-block px-5 py-2.5 bg-bg-main border border-white/10 hover:border-blood-red text-xs uppercase tracking-widest font-data text-text-muted hover:text-white transition-all duration-250 rounded-sm cursor-pointer"
          >
            Retornar ao Hub
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function InvitePage({ params }: PageProps) {
  // A Promise params deve ser resolvida com await no Next.js 15
  const { campaign_id } = await params;

  // 1. Validar se o ID da campanha segue um formato UUID válido para evitar erros de query no Postgres
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(campaign_id)) {
    return <InviteNotFound />;
  }

  // 2. Buscar a crônica no Neon Database
  const result = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaign_id))
    .limit(1);

  if (result.length === 0) {
    return <InviteNotFound />;
  }

  const campaign = result[0];

  // 3. Buscar o nome do Narrador da campanha
  const narratorResult = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, campaign.narratorId))
    .limit(1);
  
  const narratorName = narratorResult[0]?.name ?? "Narrador Desconhecido";

  // 4. Verificar se o jogador já possui sessão de Better Auth ativa
  const { data: session } = await auth.getSession();

  if (!session || !session.user) {
    // Redireciona o jogador deslogado passando o callbackUrl
    redirect(`/cadastro?callbackUrl=/convite/${campaign_id}`);
  }

  // 5. Buscar os personagens do jogador que estão no Cofre (campaignId é nulo) com detalhes
  const vaultCharacters = await db
    .select({
      id: characters.id,
      name: characters.name,
      status: characters.status,
      sheetData: characters.sheetData,
      buildState: characters.buildState,
    })
    .from(characters)
    .where(
      and(
        eq(characters.userId, session.user.id),
        isNull(characters.campaignId),
        eq(characters.type, "jogador")
      )
    );

  // 6. Renderizar a interface cliente de onboarding do jogador
  return (
    <InviteClient
      campaign={{
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        powerLevel: campaign.powerLevel,
        extraXp: campaign.extraXp,
        allowedClans: campaign.allowedClans,
        tenets: campaign.tenets,
      }}
      narratorName={narratorName}
      user={{
        id: session.user.id,
        name: session.user.name ?? "Membro da Camarilla",
        email: session.user.email,
      }}
      vaultCharacters={vaultCharacters}
    />
  );
}
