"use client";

import React, { useRef, useState } from "react";
import Token, { TokenData } from "./Token";
import { updateTokenPosition } from "@/app/actions/sceneActions";

interface DirectorBoardProps {
  tokens: TokenData[];
  isStoryteller: boolean;
  onTokensChange?: (updatedTokens: TokenData[]) => void;
  onDoubleClickToken?: (characterId: string) => void;
  onQuickRollToken?: (tokenId: string, name: string, statName: string, value: number, isSecret: boolean) => void;
  onDeleteToken?: (tokenId: string) => void;
}

export default function DirectorBoard({
  tokens,
  isStoryteller,
  onTokensChange,
  onDoubleClickToken,
  onQuickRollToken,
  onDeleteToken,
}: DirectorBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [prevTokens, setPrevTokens] = useState<TokenData[]>(tokens);
  const [localTokens, setLocalTokens] = useState<TokenData[]>(tokens);

  // Sincronizar tokens do servidor durante a renderização (React Best Practice)
  if (tokens !== prevTokens) {
    setPrevTokens(tokens);
    if (!draggedTokenId) {
      setLocalTokens(tokens);
    }
  }

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>, tokenId: string) => {
    if (!isStoryteller || !boardRef.current) return;
    
    e.preventDefault();
    const rect = boardRef.current.getBoundingClientRect();
    const token = localTokens.find((t) => t.id === tokenId);
    if (!token) return;

    // Posição do clique relativa ao tabuleiro
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Distância do clique em relação ao centro do token
    setDragOffset({
      x: clickX - token.x,
      y: clickY - token.y,
    });
    setDraggedTokenId(tokenId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isStoryteller || !draggedTokenId || !boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let newX = clickX - dragOffset.x;
    let newY = clickY - dragOffset.y;

    // Limites da mesa de jogo de 1000x600px (margem de 28px para o token ficar visível)
    newX = Math.max(28, Math.min(972, newX));
    newY = Math.max(28, Math.min(572, newY));

    // Atualização local para Optimistic UI (ultra fluida)
    const updated = localTokens.map((t) => {
      if (t.id === draggedTokenId) {
        // Checar visibilidade em tempo real para dar feedback visual no arrasto
        const isVisible = newX >= 100 && newX <= 900 && newY >= 100 && newY <= 500;
        return { ...t, x: Math.round(newX), y: Math.round(newY), isVisible };
      }
      return t;
    });

    setLocalTokens(updated);
    if (onTokensChange) {
      onTokensChange(updated);
    }
  };

  const handlePointerUp = async () => {
    if (!isStoryteller || !draggedTokenId) return;

    const token = localTokens.find((t) => t.id === draggedTokenId);
    setDraggedTokenId(null);

    if (token) {
      // Calcular visibilidade final no palco de 800x400 (centralizado no grid de 1000x600)
      // Palco: left 100px a 900px, top 100px a 500px
      const isVisible = token.x >= 100 && token.x <= 900 && token.y >= 100 && token.y <= 500;

      // Salvar a posição no Neon DB via Server Action de forma assíncrona
      try {
        const res = await updateTokenPosition(token.id, token.x, token.y, isVisible);
        if (!res.success) {
          console.error("Falha ao salvar posição do token:", res.error);
        }
      } catch (err) {
        console.error("Erro ao chamar updateTokenPosition:", err);
      }
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-bg-main overflow-auto p-4 scrollbar-none select-none">
      {/* Tabuleiro de tamanho fixo 1000x600 para manter coordenadas consistentes entre resoluções */}
      <div
        ref={boardRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-[1000px] h-[600px] bg-bg-card-dark/40 border border-white/5 rounded-md relative overflow-hidden shrink-0 shadow-2xl select-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* RETÂNGULO DO PALCO (800x400px no centro, left: 100px, top: 100px) */}
        <div
          style={{
            position: "absolute",
            left: "100px",
            top: "100px",
            width: "800px",
            height: "400px",
          }}
          className="border-2 border-dashed border-gold-accent/20 rounded-md bg-burgundy/5 flex flex-col justify-between p-4 pointer-events-none select-none"
        >
          {/* Indicativo Superior do Palco */}
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-gold-accent/40 font-data font-bold">
            <span>● PALCO DA CENA</span>
            <span>STAGE AREA ●</span>
          </div>

          {/* Indicativo Inferior do Palco */}
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-gold-accent/20 font-data font-bold">
            <span>EXIBIDO PARA OS JOGADORES</span>
            <span>800x400PX</span>
          </div>
        </div>

        {/* Indicadores de Bastidores (exclusivo Narrador) */}
        {isStoryteller && (
          <>
            {/* Top Backstage */}
            <div className="absolute top-4 left-4 text-[9px] uppercase tracking-widest text-white/20 font-data font-bold pointer-events-none">
              ▲ BASTIDORES (INVISÍVEL PARA OS JOGADORES)
            </div>
            {/* Bottom Backstage */}
            <div className="absolute bottom-4 left-4 text-[9px] uppercase tracking-widest text-white/20 font-data font-bold pointer-events-none">
              ▼ BASTIDORES (INVISÍVEL PARA OS JOGADORES)
            </div>
          </>
        )}

        {/* Renderizar os Tokens */}
        {localTokens.map((t) => (
          <Token
            key={t.id}
            token={t}
            isStoryteller={isStoryteller}
            onDragStart={handleDragStart}
            onDoubleClick={onDoubleClickToken}
            onQuickRoll={onQuickRollToken}
            onDelete={onDeleteToken}
          />
        ))}
      </div>
    </div>
  );
}
