"use client";

import React, { useState } from "react";
import DiceVisualizer from "./DiceVisualizer";
import { V5RollResult, RouseCheckResult } from "@/lib/vtt/BloodEngine";

export interface RollItem {
  id: string;
  campaignId: string;
  characterId: string | null;
  characterName: string;
  poolName: string;
  resultData: V5RollResult | RouseCheckResult;
  isRerolled: boolean;
  createdAt: Date | string;
}

interface ActionFeedProps {
  rolls: RollItem[];
  localCharacterId?: string;
  onReroll?: (rollId: string, indices: number[]) => Promise<void>;
  isRerolling?: boolean;
}

export default function ActionFeed({ rolls, localCharacterId, onReroll, isRerolling }: ActionFeedProps) {
  const [selectedDice, setSelectedDice] = useState<{ rollId: string; indices: number[] } | null>(null);
  // Formatar hora a partir da data de criação
  const formatTime = (dateInput: Date | string) => {
    try {
      const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="absolute left-4 top-4 bottom-24 w-80 z-30 pointer-events-none flex flex-col justify-end overflow-hidden">
      {/* Container de rolagem interna. pointer-events-auto permite scroll e interações */}
      <div className="pointer-events-auto overflow-y-auto flex flex-col-reverse justify-end scrollbar-none pr-2 pb-2 h-full max-h-full space-y-3 space-y-reverse">
        {rolls.length === 0 ? (
          <div className="text-center py-4 bg-bg-card-dark/40 backdrop-blur-xs border border-white/5 rounded-sm p-4 text-[10px] uppercase tracking-widest text-text-dim/80 font-data select-none animate-slide-in">
            Nenhuma rolagem nesta mesa
          </div>
        ) : (
          rolls.map((roll) => {
            const isStandard = roll.resultData.type === "standard";
            const standardResult = roll.resultData as V5RollResult;
            const rouseResult = roll.resultData as RouseCheckResult;
            const timeStr = formatTime(roll.createdAt);

            return (
              <div
                key={roll.id}
                className={`backdrop-blur-md border rounded-sm shadow-xl p-3 flex flex-col space-y-2 relative transition-all duration-300 animate-slide-in select-text ${
                  roll.isRerolled 
                    ? "bg-bg-card-dark/50 border-white/5 opacity-70" 
                    : "bg-bg-card-dark/85 border-white/10 hover:border-white/20"
                }`}
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between text-[10px] uppercase font-data tracking-wider">
                  <span className="font-bold text-text-primary text-xs truncate max-w-[70%]">
                    {roll.characterName}
                  </span>
                  <span className="text-text-dim text-[9px] font-mono shrink-0">
                    {timeStr}
                  </span>
                </div>

                {/* Nome da Ação/Pool */}
                <div className="text-xs text-text-muted font-reading italic">
                  {roll.poolName}
                </div>

                {/* Visualizador dos Dados */}
                <div className="py-1">
                  <DiceVisualizer 
                    result={roll.resultData} 
                    isClickable={roll.characterId === localCharacterId && isStandard && !roll.isRerolled}
                    selectedIndices={selectedDice?.rollId === roll.id ? selectedDice.indices : []}
                    onDieClick={(dieIdx) => {
                      setSelectedDice((prev) => {
                        if (!prev || prev.rollId !== roll.id) {
                          return { rollId: roll.id, indices: [dieIdx] };
                        }
                        if (prev.indices.includes(dieIdx)) {
                          const newIndices = prev.indices.filter(idx => idx !== dieIdx);
                          return newIndices.length === 0 ? null : { rollId: roll.id, indices: newIndices };
                        }
                        if (prev.indices.length < 3) {
                          return { rollId: roll.id, indices: [...prev.indices, dieIdx] };
                        }
                        return prev;
                      });
                    }}
                  />
                </div>

                {/* Botão de Rerrolar com Força de Vontade */}
                {selectedDice?.rollId === roll.id && selectedDice.indices.length > 0 && (
                  <button
                    disabled={isRerolling}
                    onClick={async () => {
                      if (onReroll) {
                        await onReroll(roll.id, selectedDice.indices);
                        setSelectedDice(null);
                      }
                    }}
                    className="w-full mt-2 py-1.5 px-3 bg-linear-to-r from-gold-accent to-amber-500 hover:from-amber-400 hover:to-gold-accent disabled:from-gray-700 disabled:to-gray-800 disabled:text-text-dim text-black font-data font-bold text-xs uppercase tracking-wider rounded-sm transition-all duration-300 shadow-md hover:shadow-gold-accent/20 cursor-pointer text-center select-none"
                  >
                    {isRerolling ? "Rerrolando..." : `Rerrolar ${selectedDice.indices.length} ${selectedDice.indices.length === 1 ? "Dado" : "Dados"} (1 FV)`}
                  </button>
                )}

                {/* Veredito e Resultado Consolidado */}
                <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-white/5 text-xs">
                  {isStandard ? (
                    <>
                      <div className="flex items-center space-x-1 font-data font-bold">
                        <span className="text-text-primary text-sm">
                          {standardResult.totalSuccesses}
                        </span>
                        <span className="text-text-muted text-[10px] uppercase">
                          {standardResult.totalSuccesses === 1 ? "Sucesso" : "Sucessos"}
                        </span>
                        {standardResult.difficulty > 0 && (
                          <span className="text-text-dim text-[10px] font-normal">
                            / Alvo {standardResult.difficulty}
                          </span>
                        )}
                      </div>

                      {/* Badges de Regras V5 */}
                      <div className="flex flex-wrap gap-1">
                        {roll.isRerolled && (
                          <span className="px-1.5 py-0.5 rounded-[2px] bg-willpower-blue/30 text-white border border-willpower-blue/50 font-data font-bold text-[9px] uppercase tracking-wider">
                            Rerrolado 🌀
                          </span>
                        )}
                        {standardResult.isBestialFailure && (
                          <span className="px-1.5 py-0.5 rounded-[2px] bg-hunger-red/20 text-hunger-red border border-hunger-red/30 font-data font-bold text-[9px] uppercase tracking-wider animate-pulse shadow-[0_0_8px_rgba(255,92,92,0.3)]">
                            Falha Bestial! 💀
                          </span>
                        )}
                        {standardResult.isMessianic && (
                          <span className="px-1.5 py-0.5 rounded-[2px] bg-gold-accent/20 text-gold-accent border border-gold-accent/30 font-data font-bold text-[9px] uppercase tracking-wider animate-pulse shadow-[0_0_8px_rgba(255,216,77,0.3)]">
                            Crítico Messiânico! ✨
                          </span>
                        )}
                        {!standardResult.isBestialFailure && !standardResult.isMessianic && standardResult.difficulty > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded-[2px] border font-data font-semibold text-[9px] uppercase tracking-wider ${
                              standardResult.isSuccess
                                ? "bg-green-500/10 text-green-400 border-green-500/25"
                                : "bg-white/5 text-text-dim border-white/10"
                            }`}
                          >
                            {standardResult.isSuccess ? "Sucesso" : "Falha"}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-data font-semibold text-[10px] text-text-muted uppercase tracking-wider">
                        Resultado:
                      </div>
                      <div>
                        {rouseResult.isSuccess ? (
                          <span className="px-1.5 py-0.5 rounded-[2px] bg-green-500/10 text-green-400 border border-green-500/25 font-data font-bold text-[9px] uppercase tracking-wider">
                            Sucesso (Fome Mantida)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-[2px] bg-hunger-red/20 text-hunger-red border border-hunger-red/30 font-data font-bold text-[9px] uppercase tracking-wider animate-pulse shadow-[0_0_6px_rgba(255,92,92,0.2)]">
                            Falha (Aumente Fome +1) 🩸
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
