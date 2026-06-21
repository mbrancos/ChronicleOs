"use client";

import React from "react";

interface HumanityTrackerProps {
  humanity: number;
  stains: number;
  onHumanityChange: (val: number) => void;
  onStainsChange: (val: number) => void;
  disabled?: boolean;
}

export default function HumanityTracker({
  humanity,
  stains,
  onHumanityChange,
  onStainsChange,
  disabled = false
}: HumanityTrackerProps) {
  
  const isDegenerating = humanity + stains > 10;

  const handleBoxClick = (boxNum: number) => {
    if (disabled) return;
    // Cliques na metade esquerda (1-5) definem a Humanidade.
    // Cliques na metade direita (6-10) definem as Máculas.
    if (boxNum <= 5) {
      onHumanityChange(humanity === boxNum ? Math.max(0, boxNum - 1) : boxNum);
    } else {
      const newStains = 10 - boxNum + 1;
      onStainsChange(stains === newStains ? Math.max(0, newStains - 1) : newStains);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs font-data uppercase font-semibold text-text-muted">
        <span>Humanidade & Máculas</span>
        <span className="text-[10px] text-gold-accent font-semibold">
          Hum: {humanity} | Mac: {stains}
        </span>
      </div>

      {/* TRILHA DE 10 CAIXAS COM SUPORTE A FEEDBACK VISUAL DE DEGENERAÇÃO */}
      <div 
        className={`flex space-x-1 h-11 items-center p-1 rounded-sm transition-all duration-300 ${
          isDegenerating 
            ? "ring-1 ring-hunger-red/70 bg-deep-crimson/10 animate-pulse" 
            : ""
        }`}
        role="group"
        aria-label={`Trilha de Humanidade ${humanity} e Máculas ${stains}. ${
          isDegenerating ? "Perigo de Degeneração moral!" : ""
        }`}
      >
        {Array.from({ length: 10 }).map((_, idx) => {
          const boxNum = idx + 1;
          const isHum = boxNum <= humanity;
          const isStn = boxNum > (10 - stains);
          
          let bgClass = "bg-bg-input border-text-dim/80 hover:border-gold-accent";
          let content = null;

          if (isHum) {
            bgClass = "bg-gold-accent border-gold-accent text-bg-main shadow-[0_0_6px_rgba(255,216,77,0.5)]";
            content = <div className="w-1.5 h-1.5 rounded-full bg-bg-main" />;
          } else if (isStn) {
            bgClass = "bg-deep-crimson/20 border-blood-red text-hunger-red font-bold";
            content = <span className="text-[10px]">!</span>;
          }

          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => handleBoxClick(boxNum)}
              className={`w-6 h-6 border rounded-sm flex items-center justify-center focus:outline-none transition-all duration-150 ${
                disabled ? "cursor-default opacity-85" : "cursor-pointer"
              } ${bgClass}`}
              aria-label={`Trilha Posição ${boxNum}: ${
                isHum ? "Humanidade" : isStn ? "Mácula" : "Vazio"
              }`}
            >
              {content}
            </button>
          );
        })}
      </div>
      
      {/* MENSAGEM DE ALERTA DE DEGENERAÇÃO */}
      {isDegenerating && (
        <span className="text-[9px] text-hunger-red font-semibold uppercase tracking-wider block animate-pulse">
          Alerta: Máculas ultrapassaram o limite da Humanidade! Risco de Degeneração moral.
        </span>
      )}
    </div>
  );
}
