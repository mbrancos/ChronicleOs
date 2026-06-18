interface PageProps {
  params: Promise<{
    campaign_id: string;
    character_id: string;
  }>;
}

export default async function CharacterPage({ params }: PageProps) {
  const { campaign_id, character_id } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold tracking-tight">ChronicleOS - Ficha Completa</h1>
      <div className="mt-4 text-zinc-500 space-y-2 text-center">
        <p>
          Campanha ID: <span className="font-mono text-zinc-800 dark:text-zinc-200">{campaign_id}</span>
        </p>
        <p>
          Personagem ID: <span className="font-mono text-zinc-800 dark:text-zinc-200">{character_id}</span>
        </p>
      </div>
    </main>
  );
}
