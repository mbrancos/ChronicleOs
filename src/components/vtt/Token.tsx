"use client";

import React, { useState, useRef, useEffect } from "react";

export interface TokenData {
  id: string;
  campaignId: string;
  characterId: string | null;
  name: string;
  type: "player" | "full_npc" | "quick_npc";
  x: number;
  y: number;
  isVisible: boolean;
  hasActed: boolean;
  quickStats?: { physical: number; social: number; health: number } | null;
}

interface TokenProps {
  token: TokenData;
  isStoryteller: boolean;
  onDragStart?: (e: React.PointerEvent<HTMLDivElement>, tokenId: string) => void;
  onDoubleClick?: (characterId: string) => void;
  onQuickRoll?: (tokenId: string, name: string, statName: string, value: number, isSecret: boolean) => void;
  onDelete?: (tokenId: string) => void;
  onToggleActed?: (tokenId: string, hasActed: boolean) => void;
}

export default function Token({
  token,
  isStoryteller,
  onDragStart,
  onDoubleClick,
  onQuickRoll,
  onDelete,
  onToggleActed,
}: TokenProps) {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fechar o popover se clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowPopover(false);
      }
    }

    if (showPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPopover]);

  // Se o token estiver nos bastidores e for jogador normal, não renderiza nada
  if (!token.isVisible && !isStoryteller) {
    return null;
  }

  // Obter iniciais para exibir no medalhão
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Se clicar no botão de popover ou no próprio popover, não inicia o drag
    if ((e.target as HTMLElement).closest(".popover-container")) {
      return;
    }
    if (isStoryteller && onDragStart) {
      onDragStart(e, token.id);
    }
  };

  const handleDoubleClick = () => {
    if (onDoubleClick && token.characterId) {
      onDoubleClick(token.characterId);
    }
  };

  const handleTokenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isStoryteller && token.type === "quick_npc") {
      setShowPopover(!showPopover);
    }
  };

  // Cores de contorno baseado no tipo
  let ringClass = "";
  let shadowColor = "";

  if (token.type === "player") {
    ringClass = "border-amber-400";
    shadowColor = "rgba(251,191,36,0.4)";
  } else if (token.type === "full_npc") {
    ringClass = "border-red-500";
    shadowColor = "rgba(239,68,68,0.4)";
  } else {
    ringClass = "border-sky-500";
    shadowColor = "rgba(14,165,233,0.4)";
  }

  // Estilo de opacidade inteligente e escala de cinza
  let opacityClass = "";
  if (!token.isVisible) {
    opacityClass = "opacity-50"; // Bastidores (legibilidade Narrador)
  } else if (token.hasActed) {
    opacityClass = "opacity-70"; // Agiu no Palco
  }

  const grayscaleClass = token.hasActed ? "grayscale-[0.8]" : "";

  return (
    <div
      style={{
        position: "absolute",
        left: token.x,
        top: token.y,
        transform: "translate(-50%, -50%)",
        transition: isStoryteller ? "none" : "all 2.5s ease",
      }}
      className={`z-30 select-none flex flex-col items-center group transition-all duration-300 ${opacityClass} ${grayscaleClass}`}
    >
      {/* Botão de Check para o Narrador (Alternar Ação Concluída) */}
      {isStoryteller && onToggleActed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleActed(token.id, !token.hasActed);
          }}
          className={`absolute -top-2 -left-2 w-5 h-5 border border-white/20 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 cursor-pointer shadow-md z-40 focus:outline-none ${
            token.hasActed 
              ? "bg-green-600 hover:bg-green-500 text-white" 
              : "bg-black/60 hover:bg-black/80 text-white/50 hover:text-white"
          }`}
          title={token.hasActed ? "Marcar como Ativo" : "Marcar como Concluído"}
        >
          ✓
        </button>
      )}

      {/* Botão de Deletar para o Narrador (aparece no hover) */}
      {isStoryteller && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(token.id);
          }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-hunger-red hover:bg-red-600 border border-white/20 rounded-full flex items-center justify-center text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer shadow-md z-40 focus:outline-none"
          title="Remover do Tabuleiro"
        >
          ✕
        </button>
      )}

      {/* Círculo do Medalhão */}
      <div
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        onClick={handleTokenClick}
        style={{
          boxShadow: `0 0 12px ${shadowColor}`,
        }}
        className={`w-14 h-14 rounded-full border-2 bg-bg-card-dark/95 flex items-center justify-center font-gothic text-xl tracking-wider text-text-primary select-none transition-transform duration-200 ${
          isStoryteller ? "cursor-grab active:cursor-grabbing hover:scale-105" : "cursor-default"
        } ${ringClass}`}
      >
        {getInitials(token.name)}
      </div>

      {/* Etiqueta de Nome */}
      <div className="mt-1.5 max-w-[100px] text-center bg-black/80 px-1.5 py-0.5 rounded-sm border border-white/5 shadow-md">
        <div className="text-[9px] uppercase tracking-widest text-text-primary font-data font-bold truncate">
          {token.name}
        </div>
      </div>

      {/* Popover de Rolagens Rápidas (Apenas Quick NPCs e se for Narrador) */}
      {showPopover && isStoryteller && token.type === "quick_npc" && token.quickStats && (
        <div
          ref={popoverRef}
          className="popover-container absolute bottom-16 bg-bg-card-dark/95 border border-white/10 p-3 rounded shadow-2xl z-50 w-44 text-xs font-data flex flex-col space-y-2 select-text"
        >
          <div className="flex justify-between items-center border-b border-white/5 pb-1">
            <span className="text-[10px] text-gold-accent font-bold uppercase tracking-wider truncate">
              {token.name}
            </span>
            <button
              onClick={() => setShowPopover(false)}
              className="text-text-muted hover:text-white text-[10px] cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            {/* Status Físico */}
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>FÍSICO</span>
                <span className="font-bold text-text-primary">{token.quickStats.physical} Dados</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    onQuickRoll?.(token.id, token.name, "Físico", token.quickStats!.physical, false);
                    setShowPopover(false);
                  }}
                  className="py-0.5 bg-white/5 hover:bg-white/15 text-[9px] font-bold text-text-primary uppercase border border-white/5 rounded-xs transition-colors cursor-pointer"
                >
                  Público
                </button>
                <button
                  onClick={() => {
                    onQuickRoll?.(token.id, token.name, "Físico (Secreto)", token.quickStats!.physical, true);
                    setShowPopover(false);
                  }}
                  className="py-0.5 bg-willpower-blue/20 hover:bg-willpower-blue/30 text-[9px] font-bold text-willpower-blue border border-willpower-blue/30 rounded-xs transition-colors cursor-pointer"
                >
                  Secreto
                </button>
              </div>
            </div>

            {/* Status Social */}
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>SOCIAL</span>
                <span className="font-bold text-text-primary">{token.quickStats.social} Dados</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    onQuickRoll?.(token.id, token.name, "Social", token.quickStats!.social, false);
                    setShowPopover(false);
                  }}
                  className="py-0.5 bg-white/5 hover:bg-white/15 text-[9px] font-bold text-text-primary uppercase border border-white/5 rounded-xs transition-colors cursor-pointer"
                >
                  Público
                </button>
                <button
                  onClick={() => {
                    onQuickRoll?.(token.id, token.name, "Social (Secreto)", token.quickStats!.social, true);
                    setShowPopover(false);
                  }}
                  className="py-0.5 bg-willpower-blue/20 hover:bg-willpower-blue/30 text-[9px] font-bold text-willpower-blue border border-willpower-blue/30 rounded-xs transition-colors cursor-pointer"
                >
                  Secreto
                </button>
              </div>
            </div>

            {/* Status Combate (usando a propriedade health) */}
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>COMBATE</span>
                <span className="font-bold text-text-primary">{token.quickStats.health} Dados</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    onQuickRoll?.(token.id, token.name, "Combate", token.quickStats!.health, false);
                    setShowPopover(false);
                  }}
                  className="py-0.5 bg-white/5 hover:bg-white/15 text-[9px] font-bold text-text-primary uppercase border border-white/5 rounded-xs transition-colors cursor-pointer"
                >
                  Público
                </button>
                <button
                  onClick={() => {
                    onQuickRoll?.(token.id, token.name, "Combate (Secreto)", token.quickStats!.health, true);
                    setShowPopover(false);
                  }}
                  className="py-0.5 bg-willpower-blue/20 hover:bg-willpower-blue/30 text-[9px] font-bold text-willpower-blue border border-willpower-blue/30 rounded-xs transition-colors cursor-pointer"
                >
                  Secreto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
