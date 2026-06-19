"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCharacterAction } from "@/app/actions/hubActions";
import Link from "next/link";

interface InviteClientProps {
  campaign: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function InviteClient({ campaign, user }: InviteClientProps) {
  const router = useRouter();
  const [characterName, setCharacterName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = characterName.trim();

    if (!name) {
      setErrorMsg("O nome do seu personagem nas sombras é obrigatório.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await createCharacterAction(name, campaign.id);

      if (response.success && response.characterId) {
        // Redireciona diretamente para a ficha do personagem
        router.push(`/campanhas/${campaign.id}/personagens/${response.characterId}`);
      } else {
        setErrorMsg(response.error || "Erro ao forjar o personagem.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Erro no submit do convite:", err);
      setErrorMsg("Ocorreu um erro inesperado. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-main text-text-primary p-4 md:p-6 font-reading">
      <div className="w-full max-w-lg border border-blood-red/40 bg-bg-card p-8 md:p-10 rounded-sm shadow-[0_0_30px_rgba(200,36,52,0.12)] relative space-y-8 animate-fade-in">
        
        {/* Adorno Temático de Canto Gótico */}
        <div className="absolute top-2 left-2 text-[10px] font-data text-white/5 uppercase tracking-widest pointer-events-none select-none">
          Camarilla Network
        </div>
        <div className="absolute top-2 right-2 text-[10px] font-data text-white/5 uppercase tracking-widest pointer-events-none select-none">
          ChronicleOS V5
        </div>

        {/* Título Ritualístico */}
        <div className="text-center space-y-3">
          <span className="text-[10px] uppercase tracking-widest text-gold-accent font-data font-bold">
            Chamado do Narrador
          </span>
          <h1 className="text-4xl md:text-5xl font-gothic tracking-widest text-blood-red uppercase leading-tight pt-1">
            UM CONVITE DO SANGUE
          </h1>
          <div className="h-px w-24 bg-blood-red/40 mx-auto my-3" />
          <p className="text-xs uppercase tracking-widest text-text-muted leading-relaxed font-data">
            Você foi convocado para integrar a crônica
          </p>
          <p className="text-2xl font-gothic tracking-wide text-white font-medium uppercase pt-2">
            {campaign.name}
          </p>
        </div>

        {/* Informações da Conta */}
        <div className="bg-bg-main/60 border border-white/5 p-4 rounded-sm flex flex-col sm:flex-row justify-between items-center text-xs gap-3">
          <div className="text-left font-sans">
            <span className="text-text-dim block text-[10px] uppercase font-data tracking-wider">Membro Logado</span>
            <span className="text-text-primary font-semibold block">{user.name}</span>
          </div>
          <div className="text-right sm:text-right font-sans w-full sm:w-auto">
            <span className="text-text-dim block text-[10px] uppercase font-data tracking-wider">E-mail de Vinculação</span>
            <span className="text-text-primary block font-mono text-[11px]">{user.email}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-hunger-red/10 border border-hunger-red text-hunger-red text-xs p-3 rounded-sm font-data uppercase tracking-wider text-center">
            {errorMsg}
          </div>
        )}

        {/* Formulário de Ingresso */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label 
              htmlFor="charName" 
              className="block text-xs uppercase tracking-widest font-data text-text-muted font-bold"
            >
              Nome do seu Personagem / Vampiro
            </label>
            <input
              id="charName"
              type="text"
              required
              disabled={loading}
              placeholder="Ex: Marcus Thorne, Helena Vane"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="w-full bg-bg-input border border-white/10 rounded-sm p-3 text-sm font-reading text-text-primary focus:border-blood-red focus:ring-1 focus:ring-blood-red outline-none transition-all duration-200"
            />
            <p className="text-[10px] text-text-dim leading-relaxed pt-1">
              Nota: O personagem será inicializado como um membro do Clã Brujah (11ª Geração) por padrão. O conceito poderá ser modificado e customizado a qualquer momento na edição da ficha.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <Link
              href="/hub"
              className="w-full sm:w-1/3 py-3 border border-white/10 hover:border-white text-text-muted hover:text-white text-center text-xs uppercase tracking-widest font-data transition-colors rounded-sm cursor-pointer"
            >
              Recusar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-2/3 py-3 bg-blood-red hover:bg-burgundy text-white text-xs uppercase tracking-widest font-data font-bold rounded-sm transition-all duration-250 cursor-pointer shadow-[0_0_12px_rgba(200,36,52,0.4)] disabled:opacity-50"
            >
              {loading ? "Entrando na Crônica..." : "Aceitar e Criar Personagem"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
