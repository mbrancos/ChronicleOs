"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePresence } from "@/hooks/usePresence";

interface LobbyCampaign {
  id: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "RECRUITING" | "IN_PROGRESS" | "PAUSED" | "ARCHIVED";
  powerLevel: string;
  narratorName: string;
}

interface LobbyCharacter {
  id: string;
  name: string;
  clan: string;
  concept: string;
}

interface CoterieMember {
  id: string;
  name: string;
  clan: string;
  userId?: string | null;
}

interface PlayerLobbyClientProps {
  campaign: LobbyCampaign;
  character: LobbyCharacter;
  coterie: CoterieMember[];
}

export default function PlayerLobbyClient({
  campaign,
  character,
  coterie,
}: PlayerLobbyClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onlineUsers = usePresence(campaign.id);

  // Mapeamento visual do status da crônica
  const statusLabels = {
    DRAFT: { label: "Rascunho (Fechada)", class: "bg-white/5 border-white/10 text-text-dim" },
    RECRUITING: { label: "Recrutamento Aberto", class: "bg-green-500/10 border-green-500/25 text-green-400" },
    IN_PROGRESS: { label: "Em Jogo / Ativa", class: "bg-blood-red/15 border-blood-red/35 text-blood-red" },
    PAUSED: { label: "Pausada (Fechada)", class: "bg-amber-500/10 border-amber-500/25 text-amber-400" },
    ARCHIVED: { label: "Arquivada", class: "bg-white/5 border-white/10 text-text-muted" },
  };

  const statusInfo = statusLabels[campaign.status] || { label: campaign.status, class: "bg-white/5 border-white/10" };

  // A mesa de jogo estará trancada se o status for DRAFT (Rascunho) ou PAUSED (Pausada)
  const isVttLocked = campaign.status === "DRAFT" || campaign.status === "PAUSED" || campaign.status === "ARCHIVED";

  return (
    <main className="min-h-screen bg-bg-main text-text-primary p-4 md:p-8 font-reading flex flex-col items-center select-none">
      <div className="w-full max-w-6xl space-y-8">
        
        {/* CABEÇALHO DO LOBBY */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-white/10 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] uppercase tracking-widest text-gold-accent font-data font-bold border border-gold-accent/30 px-2 py-0.5 rounded-sm">
                Lobby do Jogador
              </span>
              <span className={`px-2 py-0.5 rounded-xs border text-[8px] uppercase font-bold tracking-wider font-data ${statusInfo.class}`}>
                {statusInfo.label}
              </span>
            </div>
            
            <h1 className="text-4xl font-gothic tracking-widest text-blood-red pt-2 uppercase">
              {campaign.name}
            </h1>
            <p className="text-xs text-text-muted font-reading pt-1 leading-relaxed max-w-2xl">
              {campaign.description || "Nenhuma sinopse registrada para esta campanha nas sombras."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {campaign.status !== "IN_PROGRESS" && (
              <button
                onClick={async () => {
                  if (confirm("Deseja realmente desvincular este personagem e retirá-lo da crônica? Você voltará ao Hub e poderá selecionar outra ficha.")) {
                    setLoading(true);
                    const { leaveCampaignAction } = await import("@/app/actions/characterActions");
                    const res = await leaveCampaignAction(character.id);
                    if (res.success) {
                      router.push("/hub");
                    } else {
                      alert(res.error || "Erro ao desvincular.");
                      setLoading(false);
                    }
                  }
                }}
                disabled={loading}
                className="px-4 py-1.5 bg-hunger-red/10 border border-hunger-red/35 hover:border-hunger-red hover:bg-hunger-red hover:text-white text-[10px] font-bold uppercase tracking-widest font-data text-hunger-red transition-all duration-200 rounded-sm cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {loading ? "Retirando..." : "Retirar da Crônica"}
              </button>
            )}
            <Link
              href="/hub"
              className="px-4 py-1.5 border border-white/10 hover:border-blood-red text-xs uppercase tracking-widest font-data text-text-dim hover:text-hunger-red transition-all duration-200 rounded-sm bg-bg-card/20 cursor-pointer"
            >
              Voltar ao Hub
            </Link>
          </div>
        </header>

        {/* DETALHES DE NAVEGAÇÃO / DUAS COLUNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ======================================================= */}
          {/* COLUNA ESQUERDA: INFORMAÇÕES PESSOAIS (MEU PERSONAGEM) */}
          {/* ======================================================= */}
          <section className="lg:col-span-1 space-y-6">
            <div className="bg-bg-card border border-white/10 p-6 rounded-sm space-y-5 shadow-lg relative">
              <span className="text-[10px] uppercase tracking-widest text-gold-accent font-data font-bold border-b border-white/15 pb-1 block">
                Meu Personagem
              </span>

              {/* Avatar Temático do Jogador */}
              <div className="flex flex-col items-center py-4 bg-black/40 border border-white/5 rounded-xs space-y-3">
                <div className="w-24 h-24 rounded-full bg-bg-main border border-gold-accent/40 flex items-center justify-center overflow-hidden shadow-inner group">
                  <svg className="w-14 h-14 text-text-dim/20 group-hover:text-blood-red/40 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                
                <div className="text-center">
                  <h2 className="text-2xl font-gothic text-text-primary tracking-wide uppercase">
                    {character.name}
                  </h2>
                  <p className="text-[9px] uppercase tracking-widest text-gold-accent font-data font-semibold">
                    Clã {character.clan} • {character.concept === "FLEDGLING" ? "Cria" : character.concept === "NEONATE" ? "Neófito" : character.concept === "ANCILLAE" ? "Ancila" : character.concept}
                  </p>
                </div>
              </div>

              {/* Botões de Ação na Ficha - Garantindo que a visualização da ficha seja estritamente Read-Only */}
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href={`/campanhas/${campaign.id}/personagens/${character.id}`}
                  className="w-full text-center py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-data font-bold text-xs uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  📖 Abrir Ficha (Somente Leitura)
                </Link>
                <Link
                  href={`/campanhas/${campaign.id}/personagens/${character.id}#xp_diary`}
                  className="w-full text-center py-2 bg-gold-accent/10 hover:bg-gold-accent/15 border border-gold-accent/25 text-gold-accent font-data font-bold text-xs uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  📈 Distribuir e Evoluir XP
                </Link>
              </div>

              <p className="text-[9px] text-text-muted font-reading leading-normal text-center pt-2 italic">
                * Qualquer alteração na ficha em jogo deve ser feita por XP ou aprovada pelo Narrador ({campaign.narratorName}).
              </p>
            </div>
          </section>

          {/* ======================================================= */}
          {/* COLUNA DIREITA: ENTRADA NO VTT E HISTÓRICO DA COTERIE */}
          {/* ======================================================= */}
          <section className="lg:col-span-2 space-y-6">
            
            {/* PORTA DE ENTRADA DO VTT */}
            <div className="bg-bg-card border border-white/10 p-6 rounded-sm shadow-lg space-y-4">
              <span className="text-[10px] uppercase tracking-widest text-gold-accent font-data font-bold border-b border-white/15 pb-1 block">
                Mesa de Jogo
              </span>

              {isVttLocked ? (
                /* ESTADO DESABILITADO (Mesa Fechada) */
                <div className="flex flex-col items-center justify-center p-6 bg-black/45 border border-white/5 rounded-xs space-y-3">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-text-dim/60">
                    🔒
                  </div>
                  <button
                    disabled
                    className="w-full py-4 bg-gray-800 border border-white/5 text-text-dim/40 font-gothic text-xl tracking-widest uppercase rounded-xs cursor-not-allowed shadow-none"
                  >
                    Mesa de Jogo Fechada
                  </button>
                  <p className="text-xs text-hunger-red font-medium tracking-wide flex items-center gap-1">
                    ⚠️ A mesa de jogo está desativada pelo Narrador no momento.
                  </p>
                </div>
              ) : (
                /* ESTADO HABILITADO (Mesa Ativa) */
                <div className="flex flex-col items-center justify-center p-6 bg-blood-red/5 border border-blood-red/20 rounded-xs space-y-3 shadow-[0_0_15px_rgba(200,36,52,0.04)]">
                  <div className="w-12 h-12 bg-blood-red/10 border border-blood-red/35 rounded-full flex items-center justify-center text-blood-red animate-pulse text-lg">
                    🩸
                  </div>
                  <Link
                    href={`/campanhas/${campaign.id}/mesa`}
                    className="w-full py-4 text-center bg-linear-to-r from-red-700 to-burgundy hover:from-red-600 hover:to-red-700 text-white font-gothic text-xl tracking-widest uppercase rounded-xs transition-all duration-300 shadow-[0_0_12px_rgba(200,36,52,0.4)] cursor-pointer"
                  >
                    🦇 Entrar na Mesa de Jogo
                  </Link>
                  <p className="text-xs text-green-400 font-medium tracking-wide flex items-center gap-1">
                    ✓ Mesa de Jogo aberta e pronta para a sessão.
                  </p>
                </div>
              )}
            </div>

            {/* SEÇÃO DA COTERIE (ALIADOS) */}
            <div className="bg-bg-card border border-white/10 p-6 rounded-sm shadow-lg space-y-4">
              <span className="text-[10px] uppercase tracking-widest text-gold-accent font-data font-bold border-b border-white/15 pb-1 block">
                Os Aliados (Coterie)
              </span>

              {coterie.length === 0 ? (
                <div className="border border-dashed border-white/5 bg-black/25 rounded-xs p-8 flex flex-col items-center justify-center text-center h-44">
                  <svg className="w-10 h-10 text-text-dim/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-xs text-text-dim/60 italic font-reading">
                    Você caminha sozinho na noite. Nenhum outro jogador ingressou nesta crônica.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {coterie.map(member => (
                    <div 
                      key={member.id} 
                      className="bg-black/35 border border-white/5 p-3 rounded-xs flex items-center space-x-3.5"
                    >
                      {/* Avatar Placeholder para Aliados */}
                      <div className="w-10 h-10 rounded-full bg-bg-main border border-white/10 flex items-center justify-center shrink-0 relative">
                        <svg className="w-5 h-5 text-text-dim/40" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                        
                        {/* Indicador de presença */}
                        <span 
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-bg-card shrink-0 ${
                            member.userId && onlineUsers.includes(member.userId)
                              ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)] animate-pulse" 
                              : "bg-zinc-600"
                          }`}
                          title={member.userId && onlineUsers.includes(member.userId) ? "Aliado Online" : "Aliado Offline"}
                        />
                      </div>
                      
                      <div className="truncate">
                        <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide truncate">
                          {member.name}
                        </h4>
                        <p className="text-[9px] uppercase tracking-widest text-text-dim/70 font-data">
                          Clã {member.clan}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>

        </div>

      </div>
    </main>
  );
}
