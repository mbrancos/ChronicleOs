"use client";

import React, { useState, useRef, useEffect } from "react";
import TokenPopover from "./TokenPopover";
import { CharacterSheetData } from "@/types/character";

export interface TokenData {
  id: string;
  campaignId: string;
  characterId: string | null;
  name: string;
  type: "player" | "full_npc" | "quick_npc" | "item";
  x: number;
  y: number;
  isVisible: boolean;
  hasActed: boolean;
  quickStats?: {
    imageUrl?: string;
    description?: string;
    physical?: number;
    social?: number;
    combat?: number;
    health?: {
      max: number;
      superficial: number;
      aggravated: number;
    };
  } | null;
}

interface TokenProps {
  token: TokenData;
  isStoryteller: boolean;
  characterSheetData?: CharacterSheetData | null;
  onDragStart?: (e: React.PointerEvent<HTMLDivElement>, tokenId: string) => void;
  onDoubleClick?: (characterId: string) => void;
  onQuickRoll?: (tokenId: string, name: string, statName: string, value: number, isSecret: boolean) => void;
  onDelete?: (tokenId: string) => void;
  onToggleActed?: (tokenId: string, hasActed: boolean) => void;
  onUpdateQuickHealth?: (tokenId: string, health: { max: number; superficial: number; aggravated: number }) => void;
  onUpdateCharacterStatus?: (
    characterId: string,
    status: {
      health?: { max: number; superficial: number; aggravated: number };
      willpower?: { max: number; superficial: number; aggravated: number };
    }
  ) => void;
  onOpenDamageModal?: (characterId: string, characterName: string) => void;
  onInspectItem?: (item: { name: string; imageUrl: string; description?: string }) => void;
}

export default function Token({
  token,
  isStoryteller,
  characterSheetData,
  onDragStart,
  onDoubleClick,
  onQuickRoll,
  onDelete,
  onToggleActed,
  onUpdateQuickHealth,
  onUpdateCharacterStatus,
  onOpenDamageModal,
  onInspectItem,
}: TokenProps) {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pointerDownCoordRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

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
    pointerDownCoordRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    if (isStoryteller && onDragStart) {
      onDragStart(e, token.id);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const dist = Math.hypot(
      e.clientX - pointerDownCoordRef.current.x,
      e.clientY - pointerDownCoordRef.current.y
    );
    if (dist > 5) {
      hasDraggedRef.current = true;
    }
  };

  const handleDoubleClick = () => {
    setShowPopover(false);
    if (token.type === "item") {
      if (onInspectItem && token.quickStats?.imageUrl) {
        onInspectItem({
          name: token.name,
          imageUrl: token.quickStats.imageUrl,
          description: token.quickStats.description,
        });
      }
      return;
    }
    if (onDoubleClick && token.characterId) {
      onDoubleClick(token.characterId);
    }
  };

  const handleTokenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Se foi um arrasto (movimento > 5px), NÃO abre o popover nem o modal de inspeção
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    if (token.type === "item") {
      if (onInspectItem && token.quickStats?.imageUrl) {
        onInspectItem({
          name: token.name,
          imageUrl: token.quickStats.imageUrl,
          description: token.quickStats.description,
        });
      }
      return;
    }
    if (isStoryteller) {
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
  } else if (token.type === "item") {
    ringClass = "border-gold-accent ring-1 ring-gold-accent/40";
    shadowColor = "rgba(212,175,55,0.5)";
  } else {
    ringClass = "border-sky-500";
    shadowColor = "rgba(14,165,233,0.4)";
  }

  // Estilo de opacidade inteligente e escala de cinza
  let opacityClass = "";
  if (!token.isVisible) {
    opacityClass = "opacity-50"; // Bastidores (legibilidade Narrador)
  } else if (token.hasActed && token.type !== "item") {
    opacityClass = "opacity-70"; // Agiu no Palco
  }

  const grayscaleClass = token.hasActed && token.type !== "item" ? "grayscale-[0.8]" : "";

  // Imagem do avatar ou item se existir
  const tokenAvatarUrl =
    token.type === "item"
      ? token.quickStats?.imageUrl
      : characterSheetData?.profile?.avatarUrl || characterSheetData?.profile?.portrait_url;

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
      {/* Botão de Check para o Narrador (Alternar Ação Concluída) - Não exibido para itens */}
      {isStoryteller && onToggleActed && token.type !== "item" && (
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
        onPointerMove={handlePointerMove}
        onDoubleClick={handleDoubleClick}
        onClick={handleTokenClick}
        style={{
          boxShadow: `0 0 12px ${shadowColor}`,
        }}
        className={`w-14 h-14 rounded-full border-2 bg-bg-card-dark/95 overflow-hidden flex items-center justify-center font-gothic text-xl tracking-wider text-text-primary select-none transition-transform duration-200 ${
          isStoryteller ? "cursor-grab active:cursor-grabbing hover:scale-105" : "cursor-pointer hover:scale-105"
        } ${ringClass}`}
        title={token.type === "item" ? "Clique para inspecionar o item" : undefined}
      >
        {tokenAvatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={tokenAvatarUrl}
            alt={token.name}
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : (
          getInitials(token.name)
        )}
      </div>

      {/* Etiqueta de Nome */}
      <div className="mt-1.5 max-w-[100px] text-center bg-black/80 px-1.5 py-0.5 rounded-sm border border-white/5 shadow-md">
        <div className="text-[9px] uppercase tracking-widest text-text-primary font-data font-bold truncate">
          {token.name}
        </div>
      </div>

      {/* Popover Universal (Apenas se for Narrador e não for Item) */}
      {showPopover && isStoryteller && token.type !== "item" && (
        <div ref={popoverRef}>
          <TokenPopover
            token={token}
            characterSheetData={characterSheetData}
            onClose={() => setShowPopover(false)}
            onQuickRoll={(tid, nm, stat, val, sec) => {
              onQuickRoll?.(tid, nm, stat, val, sec);
              setShowPopover(false);
            }}
            onUpdateQuickHealth={onUpdateQuickHealth}
            onUpdateCharacterStatus={onUpdateCharacterStatus}
            onOpenDamageModal={onOpenDamageModal}
          />
        </div>
      )}
    </div>
  );
}
