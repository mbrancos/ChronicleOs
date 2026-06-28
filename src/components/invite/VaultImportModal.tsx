"use client";

import { useState } from "react";
import { calculateSpentXp } from "@/lib/xpUtils";

interface CampaignSettings {
  id: string;
  name: string;
  powerLevel: string;
  extraXp: number;
  allowedClans: string[] | null;
}

interface VaultCharacter {
  id: string;
  name: string;
  status: "DRAFT" | "READY" | "IN_PLAY";
  sheetData: any;
  buildState: any;
}

interface VaultImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignSettings;
  vaultCharacters: VaultCharacter[];
  onImport: (characterId: string) => Promise<void>;
  loading: boolean;
}

const POWER_LEVEL_XP_MAP = {
  FLEDGLING: 0,
  NEONATE: 15,
  ANCILLAE: 35,
};

const POWER_LEVEL_LABEL_MAP = {
  FLEDGLING: "Fledgling (0 XP)",
  NEONATE: "Neonate (15 XP)",
  ANCILLAE: "Ancillae (35 XP)",
};

export default function VaultImportModal({
  isOpen,
  onClose,
  campaign,
  vaultCharacters,
  onImport,
  loading,
}: VaultImportModalProps) {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  if (!isOpen) return null;

  const conceptToPowerLevel = (concept: string): "FLEDGLING" | "NEONATE" | "ANCILLAE" => {
    const normalized = String(concept).toLowerCase().trim();
    if (normalized === "cria" || normalized === "fledgling") return "FLEDGLING";
    if (normalized === "ancila" || normalized === "ancillae") return "ANCILLAE";
    return "NEONATE";
  };

  // Mapear personagens e calcular regras da alfândega
  const validatedCharacters = vaultCharacters.map((char) => {
    const clan = char.sheetData?.profile?.clan || "Sem Clã";
    const concept = char.sheetData?.profile?.concept || "Neófito";
    const charPowerLevel = conceptToPowerLevel(concept);
    const allowedPowerLevels = (campaign.powerLevel || "NEONATE").split(",");
    
    const spentXp = calculateSpentXp(clan, char.buildState);
    const maxAllowedXpForChar = (POWER_LEVEL_XP_MAP[charPowerLevel] ?? 15) + (campaign.extraXp || 0);

    let isValid = true;
    let reason = "";

    // 1. Validação de Rascunho
    if (char.status !== "READY") {
      isValid = false;
      reason = "Incompatível: Ficha em rascunho (DRAFT). Finalize a criação básica no Cofre antes de importar.";
    }
    // 2. Validação de Clãs Permitidos
    else if (
      campaign.allowedClans &&
      campaign.allowedClans.length > 0 &&
      !campaign.allowedClans.includes(clan)
    ) {
      isValid = false;
      reason = `Incompatível: Clã '${clan}' não permitido nesta crônica.`;
    }
    // 3. Validação de Nível de Poder Permitido
    else if (!allowedPowerLevels.includes(charPowerLevel)) {
      isValid = false;
      reason = `Incompatível: Nível de poder '${charPowerLevel}' (baseado no conceito '${concept}') não é permitido nesta crônica.`;
    }
    // 4. Validação de Limite de XP
    else if (spentXp > maxAllowedXpForChar) {
      isValid = false;
      reason = `Incompatível: Gastou ${spentXp} XP (limite da crônica para a categoria ${charPowerLevel} é ${maxAllowedXpForChar} XP). Reduza os pontos em excesso no Cofre.`;
    }

    return {
      ...char,
      clan,
      spentXp,
      charPowerLevel,
      isValid,
      reason,
    };
  });

  const handleImportClick = (charId: string) => {
    onImport(charId);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-bg-card border border-white/10 p-6 md:p-8 rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-gold-accent font-data font-bold">
              Alfândega do Templo
            </span>
            <h2 className="text-2xl font-gothic tracking-wider text-blood-red uppercase">
              Importar Vampiro do Cofre
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-white text-lg font-mono p-1 hover:bg-white/5 rounded-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Regras de Validação Visíveis */}
        <div className="bg-black/30 border border-white/5 p-3 rounded-sm mb-4 text-xs space-y-1.5 font-sans">
          <span className="text-[9px] uppercase tracking-widest text-text-muted font-data font-bold block">
            Regras da Crônica “{campaign.name}”
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-text-primary text-[11px]">
            <div>
              <span className="text-text-dim">Níveis de Poder Permitidos:</span>{" "}
              <span className="font-semibold text-gold-accent">
                {campaign.powerLevel.split(",").map(lvl => lvl === "FLEDGLING" ? "Cria" : lvl === "NEONATE" ? "Neófito" : "Ancila").join(" / ")}
                {campaign.extraXp > 0 ? ` (+ ${campaign.extraXp} XP extra)` : ""}
              </span>
            </div>
            <div>
              <span className="text-text-dim">Clãs Permitidos:</span>{" "}
              <span className="font-semibold text-white">
                {campaign.allowedClans && campaign.allowedClans.length > 0
                  ? `${campaign.allowedClans.length} clãs autorizados`
                  : "Todos os clãs permitidos"}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Fichas do Cofre */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[200px]">
          {validatedCharacters.length === 0 ? (
            <div className="text-center py-12 text-text-dim italic text-xs font-reading border border-dashed border-white/5 rounded-sm">
              Você não possui nenhum personagem livre no cofre no momento.
            </div>
          ) : (
            validatedCharacters.map((char) => (
              <div
                key={char.id}
                className={`p-4 border rounded-sm transition-all duration-200 ${
                  char.isValid
                    ? selectedCharId === char.id
                      ? "border-gold-accent bg-gold-accent/5"
                      : "border-white/10 bg-bg-input hover:border-white/20"
                    : "opacity-40 grayscale border-hunger-red/10 bg-black/40"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`font-gothic uppercase tracking-wide text-base ${char.isValid ? "text-white" : "text-text-dim"}`}>
                        {char.name}
                      </span>
                      {char.isValid ? (
                        <span className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[8px] font-data font-bold uppercase px-1.5 py-0.5 rounded-xs">
                          Elegível
                        </span>
                      ) : (
                        <span className="bg-hunger-red/10 border border-hunger-red/35 text-hunger-red text-[8px] font-data font-bold uppercase px-1.5 py-0.5 rounded-xs">
                          Bloqueado
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-[10px] font-mono text-text-dim">
                      <span>Clã: <strong className="text-text-primary">{char.clan}</strong></span>
                      <span>•</span>
                      <span>Categoria: <strong className="text-text-primary">{char.charPowerLevel}</strong></span>
                      <span>•</span>
                      <span>XP Gasto: <strong className="text-text-primary">{char.spentXp} XP</strong></span>
                      <span>•</span>
                      <span className="uppercase text-[9px]">{char.status}</span>
                    </div>

                    {!char.isValid && (
                      <p className="text-[10px] text-hunger-red/90 font-sans font-medium pt-1.5 flex items-start">
                        <span className="mr-1">⚠️</span> {char.reason}
                      </p>
                    )}
                  </div>

                  {char.isValid && (
                    <div className="flex items-center sm:self-center">
                      <button
                        onClick={() => handleImportClick(char.id)}
                        disabled={loading}
                        className="w-full sm:w-auto px-4 py-2 bg-gold-accent hover:bg-yellow-600 disabled:bg-gray-800 text-bg-main text-xs uppercase tracking-widest font-data font-bold rounded-sm transition-all cursor-pointer shadow-[0_0_10px_rgba(255,216,77,0.15)] disabled:opacity-50"
                      >
                        {loading && selectedCharId === char.id ? "Importando..." : "Importar"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Botão de Fechar */}
        <div className="border-t border-white/10 pt-4 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-bg-main border border-white/10 hover:border-white text-text-muted hover:text-white text-xs uppercase tracking-widest font-data transition-colors rounded-sm cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
