"use client";

import React, { useState } from "react";
import type { RegrasDeOuroTalentos } from "@/types/systems/regrasDeOuro";
import { TALENTOS_META } from "@/lib/systems/regrasDeOuro/constants";
import SolidHeaderBanner from "@/components/common/SolidHeaderBanner";

interface TalentosGridProps {
  talentos: RegrasDeOuroTalentos;
  onChangeTalento: (key: keyof RegrasDeOuroTalentos, value: number) => void;
  onRollTalento?: (key: keyof RegrasDeOuroTalentos, label: string, value: number) => void;
  disabled?: boolean;
  talentosQuota?: number;
  talentosRemaining?: number;
  isDraftMode?: boolean;
  etariaLabel?: string;
}

export default function TalentosGrid({
  talentos,
  onChangeTalento,
  onRollTalento,
  disabled = false,
  talentosQuota,
  talentosRemaining,
  isDraftMode = false,
  etariaLabel,
}: TalentosGridProps) {
  const [isFisicosOpen, setIsFisicosOpen] = useState(false); // Recolhido por padrão para caber na dobra!
  const [isMentaisOpen, setIsMentaisOpen] = useState(false); // Recolhido por padrão para caber na dobra!

  const fisicos = TALENTOS_META.filter((t) => t.category === "fisico");
  const mentais = TALENTOS_META.filter((t) => t.category === "mental");

  const renderDotLine = (
    key: keyof RegrasDeOuroTalentos,
    label: string,
    value: number,
    description: string,
    variant: "red" | "gold" = "gold"
  ) => {
    return (
      <div
        key={key}
        className="flex items-center justify-between h-8 px-2 rounded-xs border-b border-white/5 hover:bg-white/5 transition-colors group"
      >
        <div
          className="flex flex-col cursor-pointer select-none min-w-0"
          onClick={() => onRollTalento?.(key, label, value)}
          title={`Clique para rolar teste de ${label} (${description})`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-data uppercase tracking-wider font-semibold transition-colors truncate ${
                variant === "red"
                  ? "group-hover:text-blood-red text-text-primary"
                  : "group-hover:text-gold-accent text-text-primary"
              }`}
            >
              {label}
            </span>
            <span className="text-[9px] text-text-dim opacity-0 group-hover:opacity-100 transition-opacity font-data">
              🎲
            </span>
          </div>
        </div>

        {/* 6 Bolinhas clicáveis (0 a 6) */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5, 6].map((dot) => {
            const filled = (value ?? 0) >= dot;
            return (
              <button
                key={dot}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  if (dot === 1 && value === 1) {
                    onChangeTalento(key, 0);
                  } else {
                    onChangeTalento(key, dot);
                  }
                }}
                className="p-0.5 cursor-pointer flex items-center justify-center disabled:cursor-not-allowed group/dot"
                title={`${label}: ${dot} ponto${dot > 1 ? "s" : ""}`}
              >
                <span
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border transition-all flex items-center justify-center ${
                    filled
                      ? variant === "red"
                        ? "bg-blood-red border-blood-red shadow-[0_0_4px_rgba(200,36,52,0.6)]"
                        : "bg-gold-accent border-gold-accent shadow-[0_0_4px_rgba(255,216,77,0.5)]"
                      : "bg-transparent border-white/20 group-hover/dot:border-white/60"
                  }`}
                />
              </button>
            );
          })}
          <span className="ml-1 text-[10px] font-mono text-text-muted w-3 text-right">
            {value ?? 0}
          </span>
        </div>
      </div>
    );
  };

  const totalFisicos = fisicos.reduce((acc, t) => acc + (talentos[t.key] ?? 0), 0);
  const totalMentais = mentais.reduce((acc, t) => acc + (talentos[t.key] ?? 0), 0);
  const totalSpent = totalFisicos + totalMentais;

  return (
    <div className="space-y-2">
      {/* Banner de Dicas e Pontos Restantes na Criação (Modo Draft) */}
      {isDraftMode && talentosQuota !== undefined && talentosRemaining !== undefined && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-black/50 border border-white/10 rounded-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-data px-2.5 py-0.5 rounded-xs border uppercase font-bold tracking-wider ${
                talentosRemaining === 0
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                  : talentosRemaining > 0
                  ? "bg-amber-950/60 border-amber-500/40 text-amber-400 animate-pulse"
                  : "bg-red-950/60 border-red-500/40 text-red-400"
              }`}
            >
              {talentosRemaining === 0
                ? "🟢 0 Restantes (Concluído) ✓"
                : talentosRemaining > 0
                ? `🟡 ${talentosRemaining} ${talentosRemaining === 1 ? "ponto restante" : "pontos restantes"}`
                : `🔴 ${Math.abs(talentosRemaining)} pontos acima da cota`}
            </span>
            <span className="text-[11px] font-mono text-text-dim">
              {totalSpent} / {talentosQuota} pontos distribuídos
            </span>
          </div>
          <span className="text-[11px] font-data text-gold-accent/90 bg-gold-accent/10 border border-gold-accent/20 px-2 py-0.5 rounded-xs normal-case tracking-normal">
            💡 Cota da Etária ({etariaLabel || "Neonato"}): {talentosQuota} pts entre os 12 Talentos
          </span>
        </div>
      )}

      {/* Barra de Talentos Físicos (3) */}
      <div className="bg-noir-card border border-white/10 rounded-xs overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
        <SolidHeaderBanner
          title="TALENTOS FÍSICOS"
          subtitle="(Força, Vigor, Agilidade)"
          icon="⚔"
          badge={`Total: ${totalFisicos} pts`}
          variant="crimson"
          action={
            <div className="flex items-center gap-2">
              {!isFisicosOpen && (
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-noir-text-muted">
                  {fisicos.map((t) => (
                    <span key={t.key} className="bg-black/50 px-1.5 py-0.5 rounded-2xs border border-white/10">
                      {t.label}: <strong className="text-white">{talentos[t.key] ?? 0}</strong>
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsFisicosOpen(!isFisicosOpen)}
                className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xs text-[9px] font-mono cursor-pointer transition-colors"
              >
                {isFisicosOpen ? "▲ Recolher" : "▼ Expandir"}
              </button>
            </div>
          }
        />

        {isFisicosOpen && (
          <div className="p-2 grid grid-cols-1 md:grid-cols-3 gap-2 bg-black/30">
            {fisicos.map((t) =>
              renderDotLine(
                t.key,
                t.label,
                talentos[t.key] ?? 0,
                t.description,
                "red"
              )
            )}
          </div>
        )}
      </div>

      {/* Barra de Talentos Mentais (9) */}
      <div className="bg-noir-card border border-white/10 rounded-xs overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
        <SolidHeaderBanner
          title="TALENTOS MENTAIS"
          subtitle="(9 perícias cognitivas e interpessoais)"
          icon="◆"
          badge={`Total: ${totalMentais} pts`}
          variant="noir"
          action={
            <div className="flex items-center gap-2">
              {!isMentaisOpen && (
                <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono text-noir-text-muted truncate max-w-sm">
                  {mentais.slice(0, 4).map((t) => (
                    <span key={t.key} className="bg-black/50 px-1 py-0.5 rounded-2xs border border-white/10">
                      {t.label.slice(0, 4)}: <strong className="text-white">{talentos[t.key] ?? 0}</strong>
                    </span>
                  ))}
                  <span>...</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsMentaisOpen(!isMentaisOpen)}
                className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xs text-[9px] font-mono cursor-pointer transition-colors"
              >
                {isMentaisOpen ? "▲ Recolher" : "▼ Expandir (9)"}
              </button>
            </div>
          }
        />

        {isMentaisOpen && (
          <div className="p-2 grid grid-cols-1 md:grid-cols-3 gap-1.5 bg-black/30">
            {mentais.map((t) =>
              renderDotLine(
                t.key,
                t.label,
                talentos[t.key] ?? 0,
                t.description,
                "gold"
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
