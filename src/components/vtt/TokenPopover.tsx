"use client";

import React from "react";
import HealthTracker from "./HealthTracker";
import { TokenData } from "./Token";
import { CharacterSheetData } from "@/types/character";

interface TokenPopoverProps {
  token: TokenData;
  characterSheetData?: CharacterSheetData | null;
  onClose: () => void;
  onQuickRoll?: (tokenId: string, name: string, statName: string, value: number, isSecret: boolean) => void;
  onUpdateQuickHealth?: (tokenId: string, health: { max: number; superficial: number; aggravated: number }) => void;
  onUpdateCharacterStatus?: (
    characterId: string,
    status: {
      health?: { max: number; superficial: number; aggravated: number };
      willpower?: { max: number; superficial: number; aggravated: number };
    }
  ) => void;
  onOpenDamageModal?: (characterId: string, characterName: string) => void;
}

export default function TokenPopover({
  token,
  characterSheetData,
  onClose,
  onQuickRoll,
  onUpdateQuickHealth,
  onUpdateCharacterStatus,
  onOpenDamageModal,
}: TokenPopoverProps) {
  const isQuickNpc = token.type === "quick_npc";
  
  // Evitar bolhas de eventos no arrasto do tabuleiro
  const preventPropagation = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={preventPropagation}
      onPointerDown={preventPropagation}
      className="popover-container absolute bottom-16 left-1/2 -translate-x-1/2 bg-bg-card-dark/95 backdrop-blur-md border border-white/10 p-3.5 rounded-sm shadow-2xl z-50 w-48 text-xs font-data flex flex-col space-y-3.5 select-text"
    >
      {/* Cabeçalho */}
      <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
        <span className="text-[10px] text-gold-accent font-bold uppercase tracking-wider truncate max-w-[130px]" title={token.name}>
          {token.name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-text-muted hover:text-text-primary text-[10px] cursor-pointer transition-colors"
          title="Fechar Popover"
        >
          ✕
        </button>
      </div>

      {/* Renderização Contextual */}
      {isQuickNpc ? (
        // --- SEÇÃO QUICK NPC (Figurantes Rápidos) ---
        <div className="space-y-3 pt-0.5">
          {token.quickStats ? (
            <>
              {/* Rolagens de Atributos */}
              <div className="space-y-2.5">
                {/* Físico */}
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span className="font-bold">FÍSICO</span>
                    <span className="font-mono text-text-primary font-bold">{token.quickStats.physical} Dados</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => onQuickRoll?.(token.id, token.name, "Físico", token.quickStats!.physical, false)}
                      className="py-0.5 bg-white/5 hover:bg-white/15 text-[9px] font-bold text-text-primary uppercase border border-white/5 rounded-xs transition-colors cursor-pointer"
                    >
                      Público
                    </button>
                    <button
                      onClick={() => onQuickRoll?.(token.id, token.name, "Físico (Secreto)", token.quickStats!.physical, true)}
                      className="py-0.5 bg-willpower-blue/20 hover:bg-willpower-blue/30 text-[9px] font-bold text-willpower-blue border border-willpower-blue/30 rounded-xs transition-colors cursor-pointer"
                    >
                      Secreto
                    </button>
                  </div>
                </div>

                {/* Social */}
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span className="font-bold">SOCIAL</span>
                    <span className="font-mono text-text-primary font-bold">{token.quickStats.social} Dados</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => onQuickRoll?.(token.id, token.name, "Social", token.quickStats!.social, false)}
                      className="py-0.5 bg-white/5 hover:bg-white/15 text-[9px] font-bold text-text-primary uppercase border border-white/5 rounded-xs transition-colors cursor-pointer"
                    >
                      Público
                    </button>
                    <button
                      onClick={() => onQuickRoll?.(token.id, token.name, "Social (Secreto)", token.quickStats!.social, true)}
                      className="py-0.5 bg-willpower-blue/20 hover:bg-willpower-blue/30 text-[9px] font-bold text-willpower-blue border border-willpower-blue/30 rounded-xs transition-colors cursor-pointer"
                    >
                      Secreto
                    </button>
                  </div>
                </div>

                {/* Combate */}
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span className="font-bold">COMBATE</span>
                    <span className="font-mono text-text-primary font-bold">{token.quickStats.combat} Dados</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => onQuickRoll?.(token.id, token.name, "Combate", token.quickStats!.combat, false)}
                      className="py-0.5 bg-white/5 hover:bg-white/15 text-[9px] font-bold text-text-primary uppercase border border-white/5 rounded-xs transition-colors cursor-pointer"
                    >
                      Público
                    </button>
                    <button
                      onClick={() => onQuickRoll?.(token.id, token.name, "Combate (Secreto)", token.quickStats!.combat, true)}
                      className="py-0.5 bg-willpower-blue/20 hover:bg-willpower-blue/30 text-[9px] font-bold text-willpower-blue border border-willpower-blue/30 rounded-xs transition-colors cursor-pointer"
                    >
                      Secreto
                    </button>
                  </div>
                </div>
              </div>

              {/* Vida do Figurante */}
              <div className="border-t border-white/5 pt-2">
                <HealthTracker
                  label="VITALIDADE"
                  variant="health"
                  max={token.quickStats.health?.max ?? 5}
                  superficial={token.quickStats.health?.superficial ?? 0}
                  aggravated={token.quickStats.health?.aggravated ?? 0}
                  allowAdjustMax={true}
                  onChange={(sup, agg, mx) => {
                    if (onUpdateQuickHealth) {
                      onUpdateQuickHealth(token.id, {
                        max: mx ?? token.quickStats!.health?.max ?? 5,
                        superficial: sup,
                        aggravated: agg,
                      });
                    }
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-[10px] text-text-dim italic text-center py-2">Sem quickStats definidos.</div>
          )}
        </div>
      ) : (
        // --- SEÇÃO PLAYER E NPC COMPLETO ---
        <div className="space-y-3 pt-0.5">
          {onOpenDamageModal && token.characterId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDamageModal(token.characterId!, token.name);
              }}
              className="w-full py-1 bg-blood-red/10 hover:bg-blood-red border border-blood-red/20 hover:border-blood-red text-hunger-red hover:text-white font-data font-bold text-[9px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
            >
              🩸 Aplicar Dano/Cura
            </button>
          )}
          {characterSheetData ? (
            <>
              {/* Vitalidade */}
              <HealthTracker
                label="VITALIDADE"
                variant="health"
                max={characterSheetData.status?.health?.max ?? 5}
                superficial={characterSheetData.status?.health?.superficial ?? 0}
                aggravated={characterSheetData.status?.health?.aggravated ?? 0}
                allowAdjustMax={false} // Determinado pela ficha de personagem
                onChange={(sup, agg) => {
                  if (onUpdateCharacterStatus && token.characterId) {
                    onUpdateCharacterStatus(token.characterId, {
                      health: {
                        max: characterSheetData.status?.health?.max ?? 5,
                        superficial: sup,
                        aggravated: agg,
                      },
                    });
                  }
                }}
              />

              {/* Força de Vontade */}
              <div className="border-t border-white/5 pt-2">
                <HealthTracker
                  label="FORÇA DE VONTADE"
                  variant="willpower"
                  max={characterSheetData.status?.willpower?.max ?? 5}
                  superficial={characterSheetData.status?.willpower?.superficial ?? 0}
                  aggravated={characterSheetData.status?.willpower?.aggravated ?? 0}
                  allowAdjustMax={false} // Determinado pela ficha de personagem
                  onChange={(sup, agg) => {
                    if (onUpdateCharacterStatus && token.characterId) {
                      onUpdateCharacterStatus(token.characterId, {
                        willpower: {
                          max: characterSheetData.status?.willpower?.max ?? 5,
                          superficial: sup,
                          aggravated: agg,
                        },
                      });
                    }
                  }}
                />
              </div>
            </>
          ) : token.characterId ? (
            // Carregando ficha
            <div className="flex flex-col items-center justify-center py-4 space-y-2 text-[10px] text-text-muted">
              <div className="w-4 h-4 border-2 border-gold-accent border-t-transparent rounded-full animate-spin"></div>
              <span>Buscando ficha...</span>
            </div>
          ) : (
            <div className="text-[10px] text-hunger-red italic text-center py-2">Ficha de personagem ausente.</div>
          )}
        </div>
      )}
    </div>
  );
}
