"use client";

import React from "react";
import { CharacterSheetData } from "@/types/character";

interface PlayerDockProps {
  character: {
    id: string;
    campaignId: string;
    userId: string | null;
    name: string;
    type: "jogador" | "npc" | "coterie";
    sheetData: any; // jsonb
  };
  onOpenSheet: () => void;
}

export default function PlayerDock({ character, onOpenSheet }: PlayerDockProps) {
  const sheet = character.sheetData as CharacterSheetData;
  
  const health = sheet?.status?.health || { max: 6, superficial: 0, aggravated: 0 };
  const hunger = sheet?.status?.hunger ?? 2;

  // Saúde limpa restante (sem nenhum dano)
  const currentHealth = Math.max(0, health.max - health.superficial - health.aggravated);

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <footer 
      className="fixed bottom-0 left-0 w-full h-20 bg-bg-card border-t border-red-900/30 z-40 px-6 flex items-center justify-between select-none shadow-[0_-8px_24px_rgba(0,0,0,0.5)]"
      role="contentinfo"
    >
      {/* LADO ESQUERDO: AVATAR E NOME */}
      <div className="flex items-center space-x-4">
        <div 
          onClick={onOpenSheet}
          className="w-10 h-10 rounded-full bg-bg-main border border-gold-accent/40 flex items-center justify-center font-gothic text-gold-accent text-sm cursor-pointer hover:border-gold-accent hover:bg-burgundy/10 transition-colors shrink-0"
          title="Clique para abrir a ficha"
        >
          {getInitials(character.name || "Marcus")}
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold font-gothic text-text-primary tracking-wider uppercase truncate max-w-[120px] sm:max-w-[200px]">
            {character.name}
          </div>
          <button
            onClick={onOpenSheet}
            className="text-[10px] font-data text-gold-accent hover:text-white uppercase tracking-wider transition-colors cursor-pointer select-none focus:outline-none flex items-center"
          >
            Ficha do Personagem <span className="ml-1 text-[8px]">🩸</span>
          </button>
        </div>
      </div>

      {/* CENTRO: CARRINHO DE ROLAGENS (FUTURO VTT) */}
      <div className="hidden md:flex flex-col items-center justify-center text-center">
        <span className="text-[9px] text-text-dim uppercase tracking-widest font-data font-semibold">
          Mesa de Crônica
        </span>
        <span className="text-[10px] text-text-muted/50 font-reading italic">
          Motor de Sangue inativo...
        </span>
      </div>

      {/* LADO DIREITO: STATUS VITAS COMPACTOS */}
      <div className="flex items-center space-x-6 sm:space-x-8">
        
        {/* VITALIDADE COMPACTA (HEALTH) */}
        <div className="flex flex-col items-end leading-none space-y-1">
          <span className="text-[9px] uppercase tracking-wider font-data text-text-muted font-bold">
            Vitalidade
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-text-primary font-data">
              {currentHealth} / {health.max}
            </span>
            <div className="flex space-x-0.5">
              {Array.from({ length: health.max }).map((_, idx) => {
                const isAggravated = idx < health.aggravated;
                const isSuperficial = idx >= health.aggravated && idx < (health.aggravated + health.superficial);
                
                let boxStyle = "bg-bg-main border border-text-dim/80"; // Vazio
                let content = "";
                
                if (isAggravated) {
                  boxStyle = "bg-hunger-red border border-hunger-red text-bg-main flex items-center justify-center font-bold text-[8px]";
                  content = "✕"; // Dano Agravado
                } else if (isSuperficial) {
                  boxStyle = "bg-burgundy/60 border border-blood-red/40 text-blood-red flex items-center justify-center font-bold text-[8px]";
                  content = "╱"; // Dano Superficial
                }
                
                return (
                  <div 
                    key={idx} 
                    className={`w-3 h-3 rounded-xs flex items-center justify-center leading-none ${boxStyle}`}
                    title={isAggravated ? "Dano Agravado" : isSuperficial ? "Dano Superficial" : "Íntegro"}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOME COMPACTA (HUNGER) */}
        <div className="flex flex-col items-end leading-none space-y-1">
          <span className="text-[9px] uppercase tracking-wider font-data text-hunger-red font-bold animate-pulse">
            Fome
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-hunger-red font-data">
              {hunger} / 5
            </span>
            <div className="flex space-x-0.5">
              {Array.from({ length: 5 }).map((_, idx) => {
                const isActive = idx < hunger;
                return (
                  <div
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
                      isActive 
                        ? "bg-hunger-red ring-1 ring-hunger-red/40 shadow-[0_0_4px_rgba(255,92,92,0.4)]" 
                        : "bg-bg-main border border-text-dim/80"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
