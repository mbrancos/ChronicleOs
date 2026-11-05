"use client";

import React from "react";
import type { RegrasDeOuroTalentos } from "@/types/systems/regrasDeOuro";
import { TALENTOS_META } from "@/lib/systems/regrasDeOuro/constants";

interface TalentosGridProps {
  talentos: RegrasDeOuroTalentos;
  onChangeTalento: (key: keyof RegrasDeOuroTalentos, value: number) => void;
  onRollTalento?: (key: keyof RegrasDeOuroTalentos, label: string, value: number) => void;
  disabled?: boolean;
}

export default function TalentosGrid({
  talentos,
  onChangeTalento,
  onRollTalento,
  disabled = false,
}: TalentosGridProps) {
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
        className="flex items-center justify-between h-10 px-2.5 rounded-xs border-b border-white/5 hover:bg-white/5 transition-colors group"
      >
        <div
          className="flex flex-col cursor-pointer select-none"
          onClick={() => onRollTalento?.(key, label, value)}
          title={`Clique para rolar teste de ${label} (${description})`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-data uppercase tracking-wider font-semibold transition-colors ${
                variant === "red"
                  ? "group-hover:text-blood-red text-text-primary"
                  : "group-hover:text-gold-accent text-text-primary"
              }`}
            >
              {label}
            </span>
            <span className="text-[10px] text-text-dim opacity-0 group-hover:opacity-100 transition-opacity font-data">
              🎲 Rolar
            </span>
          </div>
          <span className="text-[9px] text-text-dim font-reading truncate max-w-44">
            {description}
          </span>
        </div>

        {/* 6 Bolinhas clicáveis (0 a 6) com Touch Target Generoso (Mobile-Friendly) */}
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
                className="p-1 cursor-pointer flex items-center justify-center disabled:cursor-not-allowed group/dot"
                title={`${label}: ${dot} ponto${dot > 1 ? "s" : ""}`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center ${
                    filled
                      ? variant === "red"
                        ? "bg-blood-red border-blood-red shadow-[0_0_5px_rgba(200,36,52,0.6)]"
                        : "bg-gold-accent border-gold-accent shadow-[0_0_5px_rgba(255,216,77,0.5)]"
                      : "bg-transparent border-white/20 group-hover/dot:border-white/60"
                  }`}
                />
              </button>
            );
          })}
          <span className="ml-1 text-[11px] font-mono text-text-muted w-3 text-right">
            {value ?? 0}
          </span>
        </div>
      </div>
    );
  };

  const totalFisicos = fisicos.reduce((acc, t) => acc + (talentos[t.key] ?? 0), 0);
  const totalMentais = mentais.reduce((acc, t) => acc + (talentos[t.key] ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Talentos Físicos (3) */}
      <div className="bg-bg-card/70 border border-blood-red/30 rounded-sm p-4 relative shadow-[0_4px_16px_rgba(200,36,52,0.06)]">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-blood-red/20">
          <h3 className="text-sm font-gothic tracking-widest text-blood-red uppercase flex items-center gap-2">
            <span>Talentos Físicos</span>
            <span className="text-[10px] font-data text-text-dim lowercase tracking-normal">
              (Força, Vigor e Agilidade)
            </span>
          </h3>
          <span className="text-[10px] font-data text-text-muted">
            Total: {totalFisicos} pts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
      </div>

      {/* Talentos Mentais (9) */}
      <div className="bg-bg-card/70 border border-gold-accent/30 rounded-sm p-4 relative shadow-[0_4px_16px_rgba(212,175,55,0.06)]">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gold-accent/20">
          <h3 className="text-sm font-gothic tracking-widest text-gold-accent uppercase flex items-center gap-2">
            <span>Talentos Mentais</span>
            <span className="text-[10px] font-data text-text-dim lowercase tracking-normal">
              (9 perícias cognitivas e interpessoais)
            </span>
          </h3>
          <span className="text-[10px] font-data text-text-muted">
            Total: {totalMentais} pts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
      </div>
    </div>
  );
}
