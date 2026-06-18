"use client";

import React from "react";
import { Tracker } from "@/types/character";

interface DamageTrackerProps {
  label: string;
  value: Tracker;
  onChange: (val: Tracker) => void;
  variant: "health" | "willpower";
}

export default function DamageTracker({
  label,
  value,
  onChange,
  variant
}: DamageTrackerProps) {
  const { max, superficial, aggravated } = value;

  // Lógica de clique por intenção de valor (anti-teleporte)
  const handleBoxClick = (idx: number) => {
    let newSuperficial = superficial;
    let newAggravated = aggravated;

    // Determina o estado da caixa baseando-se na ordem visual (Agravado -> Superficial -> Vazio)
    const isAggravated = idx < aggravated;
    const isSuperficial = !isAggravated && idx < aggravated + superficial;
    const isEmpty = !isAggravated && !isSuperficial;

    if (isEmpty) {
      // Intenção: Adicionar dano superficial (se houver espaço livre)
      if (superficial + aggravated < max) {
        newSuperficial += 1;
      }
    } else if (isSuperficial) {
      // Intenção: Piorar o dano de Superficial (/) para Agravado (X)
      if (superficial > 0) {
        newSuperficial = Math.max(0, newSuperficial - 1);
        newAggravated = Math.min(max, newAggravated + 1);
      }
    } else if (isAggravated) {
      // Intenção: Curar/remover dano agravado (X)
      if (newAggravated > 0) {
        newAggravated = Math.max(0, newAggravated - 1);
      }
    }

    onChange({
      max,
      superficial: newSuperficial,
      aggravated: newAggravated
    });
  };

  return (
    <div className="space-y-1">
      {/* CADASTRAR ACESSIBILIDADE */}
      <div className="flex justify-between items-center text-xs font-data uppercase font-semibold text-text-muted">
        <span>{label}</span>
        <span className="text-[10px] text-text-dim font-normal">
          Clique no símbolo para curar ou alterar
        </span>
      </div>

      <div 
        className="flex space-x-1.5 h-11 items-center"
        role="group"
        aria-label={`${label}: Max ${max}, Superficiais ${superficial}, Agravados ${aggravated}`}
      >
        {Array.from({ length: max }).map((_, idx) => {
          const isAgg = idx < aggravated;
          const isSup = !isAgg && idx < aggravated + superficial;
          
          let char = "";
          let colorClass = "border-text-muted text-text-primary bg-bg-input";

          if (isSup) {
            char = "/";
            if (variant === "willpower") {
              colorClass = "border-willpower-blue text-willpower-blue bg-willpower-blue/10";
            } else {
              colorClass = "border-text-primary text-text-primary bg-bg-input";
            }
          } else if (isAgg) {
            char = "X";
            colorClass = "border-deep-crimson text-hunger-red bg-deep-crimson/15 font-bold";
          }

          return (
            <button
              key={idx}
              onClick={() => handleBoxClick(idx)}
              className={`w-7 h-7 rounded-sm border flex items-center justify-center text-xs cursor-pointer focus:outline-none transition-all duration-150 hover:border-gold-accent ${colorClass}`}
              aria-label={`Caixa ${idx + 1}: ${isAgg ? "Dano Agravado" : isSup ? "Dano Superficial" : "Livre"}`}
            >
              {char}
            </button>
          );
        })}
      </div>
    </div>
  );
}
