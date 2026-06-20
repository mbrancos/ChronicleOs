"use client";

import React from "react";
import DiceVisualizer from "./DiceVisualizer";
import { V5RollResult, RouseCheckResult } from "@/lib/vtt/BloodEngine";

export interface RollItem {
  id: string;
  campaignId: string;
  characterId: string | null;
  characterName: string;
  poolName: string;
  resultData: V5RollResult | RouseCheckResult;
  createdAt: Date | string;
}

interface ActionFeedProps {
  rolls: RollItem[];
}

export default function ActionFeed({ rolls }: ActionFeedProps) {
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
                className="bg-bg-card-dark/85 backdrop-blur-md border border-white/10 rounded-sm shadow-xl p-3 flex flex-col space-y-2 relative transition-all duration-300 animate-slide-in hover:border-white/20 select-text"
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
                  <DiceVisualizer result={roll.resultData} />
                </div>

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
                      <div className="flex gap-1">
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
