"use client";

import React from "react";

interface TrackerBoxesProps {
  max: number;
  superficial: number;
  aggravated: number;
  variant: "health" | "willpower";
  onBoxClick: (index: number) => void;
  disabled?: boolean;
}

export default function TrackerBoxes({
  max,
  superficial,
  aggravated,
  variant,
  onBoxClick,
  disabled = false
}: TrackerBoxesProps) {
  return (
    <div 
      className={`flex space-x-1.5 h-11 items-center ${disabled ? "pointer-events-none opacity-60" : ""}`}
      role="group"
      aria-label={`Trilha: Max ${max}, Superficiais ${superficial}, Agravados ${aggravated}`}
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
            type="button"
            disabled={disabled}
            onClick={() => onBoxClick(idx)}
            className={`w-7 h-7 rounded-sm border flex items-center justify-center text-xs font-bold transition-all duration-150 focus:outline-none ${
              disabled ? "cursor-not-allowed" : "cursor-pointer hover:border-gold-accent"
            } ${colorClass}`}
            aria-label={`Caixa ${idx + 1}: ${isAgg ? "Dano Agravado" : isSup ? "Dano Superficial" : "Livre"}`}
          >
            {char}
          </button>
        );
      })}
    </div>
  );
}
