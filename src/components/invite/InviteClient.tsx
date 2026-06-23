"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCharacterAction } from "@/app/actions/hubActions";
import { importCharacterAction } from "@/app/actions/importCharacterAction";
import VaultImportModal from "./VaultImportModal";
import Link from "next/link";

interface InviteClientProps {
  campaign: {
    id: string;
    name: string;
    description: string | null;
    powerLevel: "FLEDGLING" | "NEONATE" | "ANCILLAE";
    extraXp: number;
    allowedClans: string[] | null;
    tenets?: string[];
  };
  narratorName: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  vaultCharacters: {
    id: string;
    name: string;
    status: "DRAFT" | "READY" | "IN_PLAY";
    sheetData: any;
    buildState: any;
  }[];
}

const POWER_LEVEL_XP_MAP = {
  FLEDGLING: 0,
  NEONATE: 15,
  ANCILLAE: 35,
};

const POWER_LEVEL_LABEL_MAP = {
  FLEDGLING: "Fledgling (0 XP Inicial)",
  NEONATE: "Neonate (15 XP Inicial)",
  ANCILLAE: "Ancillae (35 XP Inicial)",
};

export default function InviteClient({ campaign, narratorName, user, vaultCharacters }: InviteClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQuickCreate = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await createCharacterAction("Novo Vampiro", campaign.id);

      if (response.success && response.characterId) {
        // Redireciona diretamente para o lobby do jogador recém-ingressado
        router.push(`/campanhas/${campaign.id}/jogador`);
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

  const handleImportCharacter = async (characterId: string) => {
    setImportLoading(true);
    setErrorMsg(null);
    try {
      const response = await importCharacterAction(characterId, campaign.id);

      if (response.success) {
        setIsModalOpen(false);
        // Redireciona diretamente para o lobby do jogador da campanha recém-ingressada
        router.push(`/campanhas/${campaign.id}/jogador`);
      } else {
        setErrorMsg(response.error || "Erro ao importar personagem.");
        setImportLoading(false);
      }
    } catch (err: any) {
      console.error("Erro no ingresso de personagem:", err);
      setErrorMsg("Ocorreu um erro inesperado no servidor. Tente novamente.");
      setImportLoading(false);
    }
  };

  const maxAllowedXp = (POWER_LEVEL_XP_MAP[campaign.powerLevel] ?? 15) + (campaign.extraXp || 0);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-main text-text-primary p-4 md:p-6 font-reading py-12">
      <div className="w-full max-w-2xl border border-blood-red/40 bg-bg-card p-6 md:p-10 rounded-sm shadow-[0_0_35px_rgba(200,36,52,0.12)] relative space-y-8 animate-fade-in">
        
        {/* Adornos Temáticos Góticos */}
        <div className="absolute top-2 left-2 text-[9px] font-data text-white/5 uppercase tracking-widest pointer-events-none select-none">
          Camarilla Network
        </div>
        <div className="absolute top-2 right-2 text-[9px] font-data text-white/5 uppercase tracking-widest pointer-events-none select-none">
          Dossiê de Ingresso v1.0
        </div>

        {/* Título Ritualístico */}
        <div className="text-center space-y-2 pt-2">
          <span className="text-[10px] uppercase tracking-widest text-gold-accent font-data font-bold">
            Pacto de Sangue
          </span>
          <h1 className="text-3xl md:text-4xl font-gothic tracking-wider text-blood-red uppercase leading-tight">
            DOSSIÊ DA CRÔNICA
          </h1>
          <div className="h-px w-20 bg-blood-red/40 mx-auto my-2" />
        </div>

        {/* Seção Principal: Dossiê Detalhado */}
        <div className="space-y-6">
          {/* Dados Gerais */}
          <div className="border-b border-white/10 pb-4 space-y-2">
            <h2 className="text-2xl font-gothic uppercase tracking-wide text-white leading-normal text-center">
              {campaign.name}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-sans text-text-dim">
              <span>
                Narrador: <strong className="text-text-primary">{narratorName}</strong>
              </span>
              <span className="hidden sm:inline">•</span>
              <span>
                Status: <strong className="text-gold-accent uppercase">Recrutando</strong>
              </span>
            </div>
          </div>

          {/* Sinopse da Crônica */}
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest text-text-muted font-data font-bold">
              Sinopse & Ambientação
            </h3>
            <div className="bg-black/25 border border-white/5 p-4 rounded-sm">
              <p className="text-xs text-text-muted leading-relaxed font-sans whitespace-pre-wrap">
                {campaign.description?.trim() || "Nenhuma sinopse fornecida pelo Narrador. Prepare-se para enfrentar a escuridão sem aviso prévio."}
              </p>
            </div>
          </div>

          {/* Princípios da Crônica (Moralidade) */}
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest text-text-muted font-data font-bold">
              Diretrizes e Princípios da Crônica (Tenets)
            </h3>
            <div className="bg-bg-main/70 border border-blood-red/20 p-4 rounded-sm space-y-3">
              <p className="text-[10px] text-text-dim leading-normal font-sans">
                Estes são os limites morais partilhados pelo grupo. Transgredi-los causa desvio da Humanidade e atrai Máculas (Stains) para sua alma.
              </p>
              <div className="space-y-2">
                {campaign.tenets && campaign.tenets.length > 0 ? (
                  campaign.tenets.map((tenet, idx) => (
                    <div key={idx} className="flex items-start text-xs font-reading italic text-text-primary gap-2">
                      <span className="text-blood-red">🌹</span>
                      <span>“{tenet}”</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start text-xs font-reading italic text-text-muted gap-2">
                    <span className="text-text-dim/60">🌹</span>
                    <span>Esta crônica segue os valores morais intrínsecos de sobrevivência gótica (sem restrições customizadas).</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Requisitos da Ficha e Clãs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nível de Poder */}
            <div className="bg-black/20 border border-white/5 p-4 rounded-sm space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-text-dim font-data block">
                Nível de Geração & Poder
              </span>
              <span className="text-sm font-gothic text-gold-accent uppercase block">
                {POWER_LEVEL_LABEL_MAP[campaign.powerLevel]}
              </span>
              {campaign.extraXp > 0 && (
                <span className="text-[10px] text-text-muted font-sans block">
                  + {campaign.extraXp} XP extra de criação concedido.
                </span>
              )}
              <span className="text-[10px] font-sans text-text-dim block">
                Total permitido: <strong>{maxAllowedXp} XP gasto</strong>.
              </span>
            </div>

            {/* Clãs Permitidos */}
            <div className="bg-black/20 border border-white/5 p-4 rounded-sm space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-text-dim font-data block">
                Clãs de Sangue Permitidos
              </span>
              {campaign.allowedClans && campaign.allowedClans.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {campaign.allowedClans.map(clan => (
                    <span
                      key={clan}
                      className="bg-bg-card border border-white/10 text-text-primary text-[9px] font-sans px-2 py-0.5 rounded-xs"
                    >
                      {clan}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs font-sans text-emerald-400 font-semibold block pt-1">
                  Todos os clãs permitidos sem restrição.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Informações da Conta de Ingresso */}
        <div className="bg-bg-main/50 border border-white/5 p-3 rounded-sm flex flex-col sm:flex-row justify-between items-center text-xs gap-3">
          <div className="text-left font-sans">
            <span className="text-text-dim block text-[9px] uppercase font-data tracking-wider">Assinatura de Sangue</span>
            <span className="text-text-primary font-semibold block text-[11px]">{user.name}</span>
          </div>
          <div className="text-right sm:text-right font-sans w-full sm:w-auto">
            <span className="text-text-dim block text-[9px] uppercase font-data tracking-wider">E-mail Vinculado</span>
            <span className="text-text-primary block font-mono text-[10px]">{user.email}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-hunger-red/10 border border-hunger-red text-hunger-red text-xs p-3 rounded-sm font-data uppercase tracking-wider text-center">
            {errorMsg}
          </div>
        )}

        {/* Ações Principais */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          {/* Botão Importar do Cofre */}
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={loading || importLoading}
            className="w-full py-4 border border-gold-accent/40 bg-bg-card hover:border-gold-accent hover:text-gold-accent text-text-primary text-xs uppercase tracking-widest font-data font-bold rounded-sm transition-all duration-200 cursor-pointer shadow-[0_0_12px_rgba(255,216,77,0.06)] disabled:opacity-50"
          >
            Importar do Cofre 🔒
          </button>

          {/* Botão Forjar Novo Vampiro */}
          <button
            onClick={handleQuickCreate}
            disabled={loading || importLoading}
            className="w-full py-4 bg-blood-red hover:bg-burgundy text-white text-xs uppercase tracking-widest font-data font-bold rounded-sm transition-all duration-250 cursor-pointer shadow-[0_0_15px_rgba(200,36,52,0.25)] disabled:opacity-50"
          >
            {loading ? "Evocando Prole..." : "Forjar Novo Vampiro 🩸"}
          </button>
        </div>

        {/* Retornar ao Hub */}
        <div className="text-center">
          <Link
            href="/hub"
            className="text-[10px] uppercase tracking-widest font-data text-text-dim hover:text-white transition-colors"
          >
            ← Recusar Convite e Ir ao Hub
          </Link>
        </div>

        {/* Modal de Importação com a Alfândega */}
        <VaultImportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          campaign={{
            id: campaign.id,
            name: campaign.name,
            powerLevel: campaign.powerLevel,
            extraXp: campaign.extraXp,
            allowedClans: campaign.allowedClans,
          }}
          vaultCharacters={vaultCharacters}
          onImport={handleImportCharacter}
          loading={importLoading}
        />
      </div>
    </main>
  );
}
