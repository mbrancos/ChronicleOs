interface PageProps {
  params: Promise<{ campaign_id: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { campaign_id } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold tracking-tight">ChronicleOS - Convite</h1>
      <p className="mt-4 text-zinc-500">
        Processando convite de entrada para a campanha: <span className="font-mono text-zinc-800 dark:text-zinc-200">{campaign_id}</span>
      </p>
    </main>
  );
}
