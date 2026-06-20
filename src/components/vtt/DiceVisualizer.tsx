"use client";

import React from "react";
import { V5RollResult, RouseCheckResult } from "@/lib/vtt/BloodEngine";

interface DiceVisualizerProps {
  result: V5RollResult | RouseCheckResult;
  isClickable?: boolean;
  selectedIndices?: number[];
  onDieClick?: (index: number) => void;
}

export default function DiceVisualizer({ result, isClickable, selectedIndices, onDieClick }: DiceVisualizerProps) {
  if (result.type === "rouse") {
    const val = result.dieResult;
    const isSuccess = result.isSuccess;

    // Estilo especial para o único dado rolado no Teste de Despertar
    let dieClass = "";
    if (isSuccess) {
      if (val === 10) {
        dieClass = "bg-hunger-red/30 border-gold-accent text-gold-accent shadow-[0_0_10px_rgba(212,175,55,0.5)] font-extrabold";
      } else {
        dieClass = "bg-hunger-red/30 border-hunger-red/50 text-text-primary font-bold";
      }
    } else {
      if (val === 1) {
        dieClass = "bg-hunger-red/10 border-hunger-red text-hunger-red shadow-[0_0_10px_rgba(200,36,52,0.6)] font-black animate-pulse";
      } else {
        dieClass = "bg-hunger-red/15 border-hunger-red/20 text-text-dim/60 font-semibold";
      }
    }

    return (
      <div className="flex items-center space-x-3">
        <div className={`w-9 h-9 rounded-md flex items-center justify-center text-base border shadow select-none transition-all duration-200 ${dieClass}`}>
          {val}
        </div>
        <span className={`text-xs font-semibold uppercase tracking-wider ${isSuccess ? "text-green-500" : "text-hunger-red animate-pulse"}`}>
          {isSuccess ? "Fome Mantida" : "Fome Aumentou"}
        </span>
      </div>
    );
  }

  // Rolagem Padrão (standard)
  const { normalDice, hungerDice } = result;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Dados Normais */}
      {normalDice.map((val, idx) => {
        let diceStyle = "";
        if (val === 10) {
          diceStyle = "bg-gold-accent/15 border-gold-accent/60 text-gold-accent shadow-[0_0_8px_rgba(212,175,55,0.3)] font-extrabold";
        } else if (val >= 6) {
          diceStyle = "bg-white/10 border-white/20 text-text-primary font-bold";
        } else {
          diceStyle = "bg-black/30 border-white/5 text-text-dim/40 font-normal";
        }

        const isSelected = selectedIndices?.includes(idx);
        const borderStyle = isSelected
          ? "ring-2 ring-gold-accent border-gold-accent shadow-[0_0_8px_rgba(255,216,77,0.5)] scale-105"
          : isClickable
          ? "cursor-pointer hover:border-gold-accent/70 hover:scale-105"
          : "";

        return (
          <div
            key={`normal-${idx}`}
            className={`w-8 h-8 rounded-md flex items-center justify-center text-sm border shadow select-none transition-all duration-200 ${diceStyle} ${borderStyle}`}
            title={isClickable ? "Clique para selecionar para rerrolagem de Força de Vontade" : "Dado Normal"}
            onClick={() => isClickable && onDieClick && onDieClick(idx)}
          >
            {val}
          </div>
        );
      })}

      {/* Dados de Fome */}
      {hungerDice.map((val, idx) => {
        let diceStyle = "";
        if (val === 10) {
          diceStyle = "bg-hunger-red/35 border-gold-accent text-gold-accent shadow-[0_0_12px_rgba(212,175,55,0.6)] animate-pulse font-black scale-105";
        } else if (val >= 6) {
          diceStyle = "bg-hunger-red/30 border-hunger-red/50 text-text-primary font-bold";
        } else if (val === 1) {
          diceStyle = "bg-hunger-red/15 border-hunger-red text-hunger-red shadow-[0_0_10px_rgba(200,36,52,0.6)] font-black scale-105 border-2";
        } else {
          diceStyle = "bg-hunger-red/15 border-hunger-red/20 text-text-dim/60 font-medium";
        }

        return (
          <div
            key={`hunger-${idx}`}
            className={`w-8 h-8 rounded-md flex items-center justify-center text-sm border shadow select-none transition-all duration-200 ${diceStyle}`}
            title="Dado de Fome"
          >
            {val}
          </div>
        );
      })}
    </div>
  );
}
