"use client";

import React, { useRef, useState, useEffect } from "react";
import Token, { TokenData } from "./Token";
import { updateTokenPosition, showSceneImageAction, updateSceneBackground } from "@/app/actions/sceneActions";
import { CharacterSheetData } from "@/types/character";
import { useToast } from "@/context/ToastContext";
import AssetVaultModal from "@/components/media/AssetVaultModal";

interface DirectorBoardProps {
  tokens: TokenData[];
  isStoryteller: boolean;
  sceneBackground?: string | null;
  campaignId?: string;
  getCharacterSheetData?: (characterId: string) => CharacterSheetData | null;
  onTokensChange?: (updatedTokens: TokenData[]) => void;
  onDoubleClickToken?: (characterId: string) => void;
  onQuickRollToken?: (tokenId: string, name: string, statName: string, value: number, isSecret: boolean) => void;
  onDeleteToken?: (tokenId: string) => void;
  onToggleTokenActed?: (tokenId: string, hasActed: boolean) => void;
  onUpdateQuickHealth?: (tokenId: string, health: { max: number; superficial: number; aggravated: number }) => void;
  onUpdateCharacterStatus?: (
    characterId: string,
    status: {
      health?: { max: number; superficial: number; aggravated: number };
      willpower?: { max: number; superficial: number; aggravated: number };
      hunger?: number;
    }
  ) => void;
  onResetRound?: () => void;
  onOpenDamageModal?: (characterId: string, characterName: string) => void;
  onChangeSceneBackground?: (url: string | null) => void;
  activeSceneImage?: string | null;
  onShowSceneImage?: (url: string | null) => void;
  onOpenNarratorImageModal?: (url: string) => void;
}

export default function DirectorBoard({
  tokens,
  isStoryteller,
  sceneBackground,
  activeSceneImage,
  campaignId,
  getCharacterSheetData,
  onTokensChange,
  onDoubleClickToken,
  onQuickRollToken,
  onDeleteToken,
  onToggleTokenActed,
  onUpdateQuickHealth,
  onUpdateCharacterStatus,
  onResetRound,
  onOpenDamageModal,
  onChangeSceneBackground,
  onShowSceneImage,
  onOpenNarratorImageModal,
}: DirectorBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [prevTokens, setPrevTokens] = useState<TokenData[]>(tokens);
  const [localTokens, setLocalTokens] = useState<TokenData[]>(tokens);

  const { showSuccess, showError } = useToast();
  const [currentSceneImage, setCurrentSceneImage] = useState<string | null>(activeSceneImage || null);
  const [isShowingSceneImage, setIsShowingSceneImage] = useState(!!activeSceneImage);
  const [isImageError, setIsImageError] = useState(false);

  // Estados para Asset Vault e Inspeção de Item
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultTargetType, setVaultTargetType] = useState<"scene" | "background">("scene");
  const [inspectedItem, setInspectedItem] = useState<{
    name: string;
    imageUrl: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    if (activeSceneImage !== undefined) {
      setCurrentSceneImage(activeSceneImage);
      setIsShowingSceneImage(!!activeSceneImage);
      if (!activeSceneImage) {
        setIsImageError(false);
      }
    }
  }, [activeSceneImage]);


  // Efeito para calcular escala de forma responsiva monitorando a área disponível da mesa central
  useEffect(() => {
    if (!containerRef.current) return;
    const parent = containerRef.current;

    const updateScale = () => {
      const parentRect = parent.getBoundingClientRect();
      const availableWidth = parentRect.width - 32;
      const availableHeight = parentRect.height - 32;

      const scaleX = availableWidth / 1000;
      const scaleY = availableHeight / 600;

      // Fator de escala ideal mantendo proporções (sem limite máximo para o tabuleiro poder expandir)
      const factor = Math.min(scaleX, scaleY);
      setScale(factor);
    };

    updateScale();

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });
    resizeObserver.observe(parent);

    window.addEventListener("resize", updateScale);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

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

    // Posição do clique relativa ao tabuleiro e convertida para coordenadas lógicas baseadas na escala
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;
 
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
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

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
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-bg-main overflow-hidden p-4 scrollbar-none select-none relative"
    >
      {/* Wrapper para limitar o tamanho de layout ao tamanho escalado do tabuleiro */}
      <div
        style={{
          width: 1000 * scale,
          height: 600 * scale,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
        className="shrink-0 transition-all duration-300"
      >
        {/* Tabuleiro de tamanho fixo 1000x600 para manter coordenadas consistentes entre resoluções */}
        <div
          ref={boardRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-250 h-150 bg-bg-card-dark/40 border border-white/5 rounded-md relative overflow-hidden shrink-0 shadow-2xl select-none"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            willChange: "transform",
            // Imagem de fundo da cena: exibida como cover quando definida pelo narrador
            backgroundImage: sceneBackground
              ? `radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px), url(${JSON.stringify(sceneBackground)})`
              : "radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)",
            backgroundSize: sceneBackground ? "24px 24px, cover" : "24px 24px",
            backgroundPosition: sceneBackground ? "0 0, center center" : "0 0",
          }}
        >
          {/* Botão de Nova Rodada — dentro do canvas, canto superior direito da área do palco (em bastidores) */}
          {isStoryteller && onResetRound && (
            <button
              onClick={() => {
                if (confirm("Reiniciar as ações de todos os personagens no tabuleiro?")) {
                  onResetRound();
                }
              }}
              className="absolute top-17 right-25 z-40 py-1 px-2.5 bg-bg-card-dark/90 hover:bg-black border border-gold-accent/30 hover:border-gold-accent text-gold-accent font-data font-bold text-[9px] uppercase tracking-wider rounded-xs transition-all duration-300 shadow-md cursor-pointer select-none"
            >
              ↺ Nova Rodada
            </button>
          )}

          {/* Controles de Imagem de Cena e Fundo do Tabuleiro no topo esquerdo */}
          {isStoryteller && campaignId && (
            <div className="absolute top-17 left-25 z-40 flex items-center gap-2.5">
              {/* SLOT 1: PROJEÇÃO DE CENA (AO VIVO PARA JOGADORES) */}
              <div className="flex items-center gap-1.5 bg-bg-card-dark/95 border border-white/10 rounded-xs p-1 select-none shadow-md">
                <span className="text-[8px] uppercase tracking-wider text-text-muted font-data font-bold px-1 shrink-0">
                  Cena
                </span>

                {isShowingSceneImage && currentSceneImage ? (
                  <div className="relative flex items-center gap-1.5">
                    {/* Thumbnail 32x32px */}
                    <div
                      className="relative w-8 h-8 rounded-xs border border-gold-accent/40 bg-black/40 overflow-hidden shrink-0 cursor-pointer group"
                      onClick={() => {
                        if (onOpenNarratorImageModal && currentSceneImage) {
                          onOpenNarratorImageModal(currentSceneImage);
                        }
                      }}
                      title="Clique para ver em tela cheia"
                    >
                      {!isImageError ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={currentSceneImage}
                          alt="Thumbnail da Cena"
                          className="w-full h-full object-cover object-center transition-transform group-hover:scale-105"
                          onError={() => setIsImageError(true)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black/70 text-amber-500 font-bold text-xs">
                          ⚠️
                        </div>
                      )}
                    </div>

                    {/* Badge AO VIVO */}
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xs text-[8px] uppercase tracking-wider text-emerald-400 font-data font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span>AO VIVO</span>
                    </div>

                    {/* Botão de Trocar */}
                    <button
                      onClick={() => {
                        setVaultTargetType("scene");
                        setIsVaultOpen(true);
                      }}
                      className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-gold-accent/40 text-text-muted hover:text-white font-data text-[8px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                      title="Escolher outra imagem da biblioteca"
                    >
                      Trocar
                    </button>

                    {/* Botão de Encerrar Projeção ✕ */}
                    <button
                      onClick={async () => {
                        const prevUrl = currentSceneImage;
                        setCurrentSceneImage(null);
                        setIsShowingSceneImage(false);
                        setIsImageError(false);

                        try {
                          const res = await showSceneImageAction(campaignId, null);
                          if (res.success) {
                            showSuccess("Projeção de cena encerrada.", "Cena");
                            if (onShowSceneImage) onShowSceneImage(null);
                          } else {
                            setCurrentSceneImage(prevUrl);
                            setIsShowingSceneImage(true);
                            showError("Falha ao encerrar projeção.", "Cena");
                          }
                        } catch {
                          setCurrentSceneImage(prevUrl);
                          setIsShowingSceneImage(true);
                          showError("Falha ao encerrar projeção.", "Cena");
                        }
                      }}
                      className="px-1.5 py-1 bg-hunger-red/15 hover:bg-hunger-red/30 border border-hunger-red/40 text-hunger-red font-data font-bold text-[9px] uppercase tracking-wider rounded-xs transition-all cursor-pointer shrink-0"
                      title="Remover Imagem de Cena"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  /* Botão Limpo para Projetar Cena */
                  <button
                    onClick={() => {
                      setVaultTargetType("scene");
                      setIsVaultOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-blood-red/80 hover:bg-blood-red border border-blood-red text-white font-data font-bold text-[9px] uppercase tracking-wider rounded-xs transition-all cursor-pointer shadow-md"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Projetar Cena</span>
                  </button>
                )}
              </div>

              {/* SLOT 2: FUNDO DO TABULEIRO */}
              <div className="flex items-center gap-1.5 bg-bg-card-dark/95 border border-white/10 rounded-xs p-1 select-none shadow-md">
                <span className="text-[8px] uppercase tracking-wider text-text-muted font-data font-bold px-1 shrink-0">
                  Fundo
                </span>

                {sceneBackground ? (
                  <div className="flex items-center gap-1.5">
                    {/* Thumbnail 32x32px */}
                    <div className="w-8 h-8 rounded-xs border border-gold-accent/30 bg-black/40 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sceneBackground} alt="Fundo" className="w-full h-full object-cover" />
                    </div>

                    <button
                      onClick={() => {
                        setVaultTargetType("background");
                        setIsVaultOpen(true);
                      }}
                      className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-gold-accent/40 text-text-muted hover:text-white font-data text-[8px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                      title="Escolher outro fundo da biblioteca"
                    >
                      Trocar
                    </button>

                    <button
                      onClick={async () => {
                        if (onChangeSceneBackground) onChangeSceneBackground(null);
                        await updateSceneBackground(campaignId, null);
                        showSuccess("Fundo do tabuleiro removido.");
                      }}
                      className="px-1.5 py-1 bg-hunger-red/15 hover:bg-hunger-red/30 border border-hunger-red/40 text-hunger-red font-data font-bold text-[9px] uppercase tracking-wider rounded-xs transition-all cursor-pointer shrink-0"
                      title="Remover Fundo do Tabuleiro"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  /* Botão Limpo para Fundo */
                  <button
                    onClick={() => {
                      setVaultTargetType("background");
                      setIsVaultOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 hover:bg-black border border-gold-accent/40 hover:border-gold-accent text-gold-accent font-data font-bold text-[9px] uppercase tracking-wider rounded-xs transition-all cursor-pointer shadow-md"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Fundo do Tabuleiro</span>
                  </button>
                )}
              </div>
            </div>
          )}

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
            characterSheetData={t.characterId && getCharacterSheetData ? getCharacterSheetData(t.characterId) : null}
            onDragStart={handleDragStart}
            onDoubleClick={onDoubleClickToken}
            onQuickRoll={onQuickRollToken}
            onDelete={onDeleteToken}
            onToggleActed={onToggleTokenActed}
            onUpdateQuickHealth={onUpdateQuickHealth}
            onUpdateCharacterStatus={onUpdateCharacterStatus}
            onOpenDamageModal={onOpenDamageModal}
            onInspectItem={(item) => setInspectedItem(item)}
          />
        ))}
      </div>
      </div>

      {/* Modal do Asset Vault com Contexto Definido */}
      <AssetVaultModal
        isOpen={isVaultOpen}
        campaignId={campaignId}
        targetCategory="scene"
        title={vaultTargetType === "scene" ? "Projetar Imagem na Cena" : "Escolher Fundo do Tabuleiro"}
        onClose={() => setIsVaultOpen(false)}
        onSelectImage={async (url) => {
          if (!campaignId) return;
          if (vaultTargetType === "scene") {
            setCurrentSceneImage(url);
            setIsShowingSceneImage(true);
            await showSceneImageAction(campaignId, url);
            if (onShowSceneImage) onShowSceneImage(url);
            showSuccess("Cenário projetado ao vivo!");
          } else {
            if (onChangeSceneBackground) onChangeSceneBackground(url);
            await updateSceneBackground(campaignId, url);
            showSuccess("Fundo do tabuleiro atualizado!");
          }
        }}
      />

      {/* Modal de Inspeção de Item em Tela Cheia */}
      {inspectedItem && (
        <div
          onClick={() => setInspectedItem(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4 select-none animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[85vh] bg-bg-card-dark border border-gold-accent/40 rounded-sm shadow-2xl flex flex-col overflow-hidden animate-scale-in cursor-default"
          >
            <div className="flex justify-between items-center px-4 py-2.5 bg-black/60 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-gold-accent text-sm">🗡️</span>
                <span className="font-gothic text-xs uppercase tracking-widest text-text-primary font-bold">
                  {inspectedItem.name}
                </span>
              </div>
              <button
                onClick={() => setInspectedItem(null)}
                className="text-text-muted hover:text-white text-xs cursor-pointer px-1 py-0.5"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inspectedItem.imageUrl}
                alt={inspectedItem.name}
                className="max-h-[65vh] max-w-full object-contain rounded-xs border border-white/10"
              />
            </div>

            <div className="px-4 py-2 bg-black/40 border-t border-white/10 text-center text-[10px] font-data text-text-muted">
              Clique fora da imagem para fechar
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
