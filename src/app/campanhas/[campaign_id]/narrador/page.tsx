interface PageProps {
  params: Promise<{ campaign_id: string }>;
}

export default async function NarratorPage({ params }: PageProps) {
  const { campaign_id } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold tracking-tight">ChronicleOS - Painel do Narrador</h1>
      <p className="mt-4 text-zinc-500">
        Campanha ID: <span className="font-mono text-zinc-800 dark:text-zinc-200">{campaign_id}</span>
      </p>
    </main>
  );
}
