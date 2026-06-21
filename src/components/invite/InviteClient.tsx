"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCharacterAction } from "@/app/actions/hubActions";
import { joinCampaignWithCharacterAction } from "@/app/actions/characterActions";
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
  vaultCharacters: {
    id: string;
    name: string;
  }[];
}

export default function InviteClient({ campaign, user, vaultCharacters }: InviteClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"ask" | "select">("ask");
  const [selectedCharId, setSelectedCharId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQuickCreate = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await createCharacterAction("Novo Vampiro", campaign.id);

      if (response.success && response.characterId) {
        // Redireciona diretamente para a ficha do novo personagem
        router.push(`/campanhas/${campaign.id}/personagens/${response.characterId}`);
      } else {
        setErrorMsg(response.error || "Erro ao forjar o personagem.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Erro ao criar personagem:", err);
      setErrorMsg("Ocorreu um erro inesperado. Tente novamente.");
      setLoading(false);
    }
  };

  const handleJoinWithExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCharId) {
      setErrorMsg("Selecione um vampiro do seu cofre para ingressar.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await joinCampaignWithCharacterAction(selectedCharId, campaign.id);

      if (response.success) {
        // Redireciona diretamente para a ficha do personagem associado
        router.push(`/campanhas/${campaign.id}/personagens/${selectedCharId}`);
      } else {
        setErrorMsg(response.error || "Erro ao associar o personagem.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Erro no ingresso de personagem:", err);
      setErrorMsg("Ocorreu um erro inesperado. Tente novamente.");
      setLoading(false);
    }
  };

  const hasVaultCharacters = vaultCharacters.length > 0;

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

        {/* MODO DE PERGUNTA INICIAL */}
        {mode === "ask" && (
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-wider text-text-muted font-data text-center">
              Como deseja adentrar esta crônica nas sombras?
            </p>

            <div className="flex flex-col space-y-4 pt-2">
              {/* Botão de Escolher Existente */}
              <button
                onClick={() => setMode("select")}
                disabled={!hasVaultCharacters || loading}
                className={`w-full py-4 border rounded-sm text-xs uppercase tracking-widest font-data font-bold transition-all duration-200 ${
                  hasVaultCharacters
                    ? "border-gold-accent/40 bg-bg-card hover:border-gold-accent hover:text-gold-accent text-text-primary cursor-pointer shadow-[0_0_8px_rgba(255,216,77,0.1)]"
                    : "border-white/5 bg-white/5 text-text-dim/30 cursor-not-allowed select-none"
                }`}
              >
                {hasVaultCharacters 
                  ? "Selecionar Vampiro do Cofre 🔒" 
                  : "Sem Vampiros no Cofre"}
              </button>

              {/* Botão de Forjar Novo */}
              <button
                onClick={handleQuickCreate}
                disabled={loading}
                className="w-full py-4 bg-blood-red hover:bg-burgundy text-white text-xs uppercase tracking-widest font-data font-bold rounded-sm transition-all duration-250 cursor-pointer shadow-[0_0_12px_rgba(200,36,52,0.3)] disabled:opacity-50"
              >
                {loading ? "Invocando..." : "Forjar Novo Vampiro 🩸"}
              </button>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/hub"
                className="text-[10px] uppercase tracking-widest font-data text-text-dim hover:text-white transition-colors"
              >
                ← Recusar Convite e Ir ao Hub
              </Link>
            </div>
          </div>
        )}

        {/* MODO DE SELEÇÃO DE PERSONAGEM */}
        {mode === "select" && (
          <form onSubmit={handleJoinWithExisting} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-widest font-data text-text-muted font-bold text-center">
                Selecione sua Prole do Cofre
              </label>
              
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2 border-y border-white/5 py-4">
                {vaultCharacters.map(char => (
                  <label 
                    key={char.id}
                    className={`flex items-center justify-between p-3 border rounded-sm cursor-pointer transition-all duration-150 ${
                      selectedCharId === char.id
                        ? "border-gold-accent bg-gold-accent/5 text-gold-accent"
                        : "border-white/10 bg-bg-input hover:border-white/20 text-text-primary"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="characterSelection"
                        checked={selectedCharId === char.id}
                        onChange={() => setSelectedCharId(char.id)}
                        className="accent-gold-accent focus:ring-0 cursor-pointer"
                      />
                      <span className="font-gothic uppercase tracking-wider text-sm">{char.name}</span>
                    </div>
                    <span className="text-[9px] font-mono text-text-dim uppercase">Cofre</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode("ask");
                }}
                className="w-full sm:w-1/3 py-3 border border-white/10 hover:border-white text-text-muted hover:text-white text-center text-xs uppercase tracking-widest font-data transition-colors rounded-sm cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading || !selectedCharId}
                className="w-full sm:w-2/3 py-3 bg-gold-accent hover:bg-yellow-600 text-bg-main text-xs uppercase tracking-widest font-data font-bold rounded-sm transition-all duration-250 cursor-pointer shadow-[0_0_12px_rgba(255,216,77,0.2)] disabled:opacity-50"
              >
                {loading ? "Vinculando..." : "Confirmar Ingresso"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
