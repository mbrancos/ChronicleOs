"use client";

import React from "react";

interface HealthTrackerProps {
  max: number;
  superficial: number;
  aggravated: number;
  onChange: (superficial: number, aggravated: number, max?: number) => void;
  variant: "health" | "willpower";
  label: string;
  allowAdjustMax?: boolean; // Permite alterar o tamanho máximo da trilha (ex: para Quick NPCs)
}

export default function HealthTracker({
  max,
  superficial,
  aggravated,
  onChange,
  variant,
  label,
  allowAdjustMax = false,
}: HealthTrackerProps) {
  // Garantir limites sadios para evitar bugs de renderização
  const safeMax = Math.max(1, Math.min(10, max));
  const safeAggravated = Math.max(0, Math.min(safeMax, aggravated));
  const safeSuperficial = Math.max(0, Math.min(safeMax - safeAggravated, superficial));

  // Criar array representando o estado de cada caixa
  const boxes: Array<"aggravated" | "superficial" | "empty"> = [];
  for (let i = 0; i < safeAggravated; i++) {
    boxes.push("aggravated");
  }
  for (let i = 0; i < safeSuperficial; i++) {
    boxes.push("superficial");
  }
  while (boxes.length < safeMax) {
    boxes.push("empty");
  }

  // Lógica de clique cíclico nas caixas
  const handleBoxClick = (index: number) => {
    const boxType = boxes[index];

    let newSuperficial = safeSuperficial;
    let newAggravated = safeAggravated;

    if (boxType === "empty") {
      // Tentar adicionar dano Superficial
      if (safeSuperficial + safeAggravated < safeMax) {
        newSuperficial += 1;
      } else if (safeSuperficial > 0) {
        // Estouro: Converte um Superficial em Agravado
        newSuperficial -= 1;
        newAggravated += 1;
      }
    } else if (boxType === "superficial") {
      // Converter Superficial em Agravado
      newSuperficial -= 1;
      newAggravated += 1;
    } else if (boxType === "aggravated") {
      // Limpar a caixa de dano
      newAggravated -= 1;
    }

    onChange(newSuperficial, newAggravated, safeMax);
  };

  // Ajuste do valor máximo da trilha
  const handleAdjustMax = (amount: number) => {
    const newMax = Math.max(1, Math.min(10, safeMax + amount));
    // Ajustar os danos se o novo máximo for menor que a soma atual
    let newAgg = safeAggravated;
    let newSup = safeSuperficial;

    if (newAgg > newMax) {
      newAgg = newMax;
      newSup = 0;
    } else if (newAgg + newSup > newMax) {
      newSup = newMax - newAgg;
    }

    onChange(newSup, newAgg, newMax);
  };

  // Cores e estilizações com base no tipo (Vitalidade vs Força de Vontade)
  const isHealth = variant === "health";
  const themeColor = isHealth ? "text-hunger-red" : "text-willpower-blue";
  const borderColor = isHealth ? "border-hunger-red/30" : "border-willpower-blue/30";
  const hoverBorderColor = isHealth ? "group-hover:border-hunger-red/60" : "group-hover:border-willpower-blue/60";
  const activeBgColor = isHealth ? "bg-hunger-red/20" : "bg-willpower-blue/20";
  
  return (
    <div className="flex flex-col space-y-1.5 select-none w-full">
      {/* Cabeçalho do Tracker */}
      <div className="flex justify-between items-center">
        <span className={`text-[9px] uppercase tracking-widest font-data font-bold ${isHealth ? "text-text-muted" : "text-willpower-blue/80"}`}>
          {label}
        </span>
        
        {allowAdjustMax && (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => handleAdjustMax(-1)}
              className="w-3.5 h-3.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xs flex items-center justify-center text-[10px] text-text-muted hover:text-white cursor-pointer transition-colors"
              title="Reduzir caixas máximas"
            >
              -
            </button>
            <span className="text-[9px] font-mono text-text-muted font-bold px-0.5">{safeMax}</span>
            <button
              type="button"
              onClick={() => handleAdjustMax(1)}
              className="w-3.5 h-3.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xs flex items-center justify-center text-[10px] text-text-muted hover:text-white cursor-pointer transition-colors"
              title="Aumentar caixas máximas"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Grade de Caixas */}
      <div className="flex items-center space-x-1.5">
        {boxes.map((type, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleBoxClick(idx)}
            className={`group w-4.5 h-4.5 border rounded-xs flex items-center justify-center cursor-pointer transition-all duration-150 relative overflow-hidden bg-black/40 ${borderColor} ${hoverBorderColor} hover:scale-105 active:scale-95`}
          >
            {type === "superficial" && (
              <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold font-mono leading-none ${themeColor} ${activeBgColor}`}>
                ╱
              </span>
            )}
            {type === "aggravated" && (
              <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold font-mono leading-none ${themeColor} ${activeBgColor}`}>
                ✕
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
