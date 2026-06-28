"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CharacterSheetData } from "@/types/character";
import { useToast } from "@/context/ToastContext";

interface CharacterMiniCardProps {
  character: {
    id: string;
    name: string;
    campaignId: string | null;
    type: string;
    sheetData: any; // JSONB
    status?: "DRAFT" | "READY" | "IN_PLAY";
    userId?: string | null;
  };
  isOnline?: boolean;
}

export default function CharacterMiniCard({ character, isOnline }: CharacterMiniCardProps) {
  const { showSuccess, showError } = useToast();
  const [isUnlockConfirmOpen, setIsUnlockConfirmOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const sheet = character.sheetData as CharacterSheetData;

  const clan = sheet?.profile?.clan || "Sem Clã";
  const concept = sheet?.profile?.concept || "Conceito não definido";
  const hunger = sheet?.status?.hunger ?? 0;
  const health = sheet?.status?.health || { max: 5, superficial: 0, aggravated: 0 };
  const willpower = sheet?.status?.willpower || { max: 5, superficial: 0, aggravated: 0 };

  // Helper para renderizar quadradinhos de dano (Tracker) de forma estática e segura no Tailwind
  const renderTrackerBoxes = (
    tracker: { max: number; superficial: number; aggravated: number },
    type: "health" | "willpower"
  ) => {
    const boxes = [];
    const max = tracker.max || 5;
    const agg = tracker.aggravated || 0;
    const sup = tracker.superficial || 0;

    const isHealth = type === "health";
    const borderAggClass = isHealth ? "border-hunger-red/40" : "border-gold-accent/40";
    const borderSupClass = isHealth ? "border-hunger-red/20" : "border-gold-accent/20";
    const textAccentClass = isHealth ? "text-hunger-red font-bold" : "text-gold-accent font-bold";
    const textSupClass = isHealth ? "text-hunger-red/80" : "text-gold-accent/80";

    for (let i = 0; i < max; i++) {
      let content = "";
      let bgStyle = "bg-bg-input border-white/10";
      let textStyle = "text-transparent";

      if (i < agg) {
        // Dano Agravado: ✕
        content = "✕";
        bgStyle = `bg-bg-main ${borderAggClass}`;
        textStyle = textAccentClass;
      } else if (i < agg + sup) {
        // Dano Superficial: ╱
        content = "╱";
        bgStyle = `bg-bg-main ${borderSupClass}`;
        textStyle = textSupClass;
      }

      boxes.push(
        <div
          key={i}
          className={`w-4 h-4 rounded-xs border flex items-center justify-center text-[10px] select-none ${bgStyle}`}
        >
          <span className={textStyle}>{content}</span>
        </div>
      );
    }

    return boxes;
  };

  return (
    <div className="bg-bg-card border border-white/10 hover:border-blood-red/30 p-5 rounded-sm flex flex-col justify-between transition-all duration-200 gap-4 group">
      
      {/* Informações Básicas */}
      <div className="space-y-1">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 truncate pr-2">
            {isOnline !== undefined && (
              <span 
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isOnline 
                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" 
                    : "bg-zinc-600"
                }`}
                title={isOnline ? "Membro Online" : "Membro Offline"}
              />
            )}
            <h3 className="text-xl font-gothic tracking-wide text-text-primary group-hover:text-gold-accent transition-colors truncate">
              {character.name.toUpperCase()}
            </h3>
          </div>
          <span className={`text-[9px] font-data uppercase tracking-widest px-2 py-0.5 rounded-sm ${
            character.type === "npc" ? "bg-hunger-red/10 text-hunger-red border border-hunger-red/20" : "bg-gold-accent/10 text-gold-accent border border-gold-accent/20"
          }`}>
            {character.type}
          </span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-data">
          Clã {clan} • <span className="text-text-dim">{concept}</span>
        </p>
      </div>

      <div className="h-px bg-white/5" />

      {/* Rastreadores Rápidos (Tático) */}
      <div className="space-y-3">
        
        {/* Marcador de Fome (Bolinhas Vermelhas) */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-data">Fome</span>
          <div className="flex space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                  i < hunger
                    ? "bg-hunger-red border-hunger-red shadow-[0_0_5px_rgba(230,36,36,0.5)]"
                    : "bg-bg-input border-white/15"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Marcador de Vitalidade (Quadradinhos) */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-data">Vitalidade</span>
          <div className="flex space-x-1">
            {renderTrackerBoxes(health, "health")}
          </div>
        </div>

        {/* Marcador de Força de Vontade (Quadradinhos) */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-data">Força de Vontade</span>
          <div className="flex space-x-1">
            {renderTrackerBoxes(willpower, "willpower")}
          </div>
        </div>

      </div>

      <div className="h-px bg-white/5" />

      {/* Rodapé e Link de Acesso */}
      <div className="flex justify-between items-center text-[10px] font-data">
        <span className="text-text-dim uppercase">ID: {character.id.slice(0, 8)}</span>
        
        <div className="flex items-center space-x-3">
          {character.type === "jogador" && character.status === "IN_PLAY" && (
            <button
              onClick={() => setIsUnlockConfirmOpen(true)}
              className="text-gold-accent hover:text-white transition-colors uppercase tracking-widest font-bold text-[10px] cursor-pointer"
            >
              Destravar 🔓
            </button>
          )}
          <Link
            href={character.campaignId ? `/campanhas/${character.campaignId}/personagens/${character.id}` : `/campanhas/cofre/personagens/${character.id}`}
            className="text-xs uppercase tracking-widest font-bold text-blood-red hover:text-white transition-colors"
          >
            Abrir Ficha →
          </Link>
        </div>
      </div>

      {isUnlockConfirmOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in normal-case text-left font-sans">
          <div
            className="w-full max-w-md bg-bg-card border border-gold-accent/40 rounded-sm p-6 relative shadow-[0_0_25px_rgba(255,216,77,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsUnlockConfirmOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white text-lg font-data focus:outline-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-gothic tracking-widest text-gold-accent uppercase pb-2 border-b border-white/5 mb-4">
              Destravar Ficha
            </h3>

            <p className="text-xs text-text-primary font-reading leading-relaxed mb-6">
              Deseja destravar a ficha de <strong className="text-gold-accent">{character.name.toUpperCase()}</strong> para edições e correções? O personagem sairá do estado de jogo temporariamente.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsUnlockConfirmOpen(false)}
                className="px-4 py-2 border border-white/10 hover:border-white text-text-muted hover:text-white text-xs uppercase tracking-widest font-data transition-colors rounded-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setIsUnlocking(true);
                  const { anistiaCharacterAction } = await import("@/app/actions/characterActions");
                  const res = await anistiaCharacterAction(character.id);
                  if (res.success) {
                    showSuccess("Edição destravada! O personagem agora está com status READY.", "Anistia de Ficha");
                    setTimeout(() => {
                      window.location.reload();
                    }, 1500);
                  } else {
                    showError(res.error || "Falha ao destravar edição.", "Erro");
                    setIsUnlocking(false);
                  }
                }}
                disabled={isUnlocking}
                className="px-5 py-2 bg-gold-accent hover:bg-yellow-600 text-bg-main text-xs uppercase tracking-widest font-data font-bold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(255,216,77,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUnlocking ? "Destravando..." : "Destravar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
