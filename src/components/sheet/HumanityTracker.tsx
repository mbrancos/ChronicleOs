"use client";

import React, { useState, useTransition } from "react";
import { addStainAction, rollRemorseAction, setHumanityAction } from "@/app/actions/humanityActions";
import { useToast } from "@/context/ToastContext";

interface HumanityTrackerProps {
  characterId: string;
  humanity: number;
  stains: number;
  onHumanityChange: (val: number) => void;
  onStainsChange: (val: number) => void;
  disabled?: boolean;
}

export default function HumanityTracker({
  characterId,
  humanity,
  stains,
  onHumanityChange,
  onStainsChange,
  disabled = false
}: HumanityTrackerProps) {
  const { showError, showDegradation, showWarning } = useToast();
  const [isUpdatingHumanity, startHumanityTransition] = useTransition();
  const [isUpdatingStains, setIsUpdatingStains] = useState(false);
  const [isRemorseModalOpen, setIsRemorseModalOpen] = useState(false);
  const [isRollingRemorse, setIsRollingRemorse] = useState(false);
  const [remorseResult, setRemorseResult] = useState<{
    success: boolean;
    isSuccess: boolean;
    rolledDice: number[];
    oldHumanity: number;
    newHumanity: number;
  } | null>(null);

  const isWassail = humanity === 0;
  const isWassailDanger = humanity === 1;
  // Fórmula V5 correta: humanidade não coberta por máculas
  const dicePool = Math.max(1, humanity - stains);

  // ============================================================
  // HANDLERS
  // ============================================================

  // Humanidade via Server Action dedicada (persistência imediata)
  const adjustHumanity = (amount: number) => {
    if (disabled || isWassail && amount < 0) return;
    const newVal = Math.max(0, Math.min(10, humanity + amount));
    if (newVal === humanity) return;

    // Atualização otimista
    onHumanityChange(newVal);

    // Persistir no banco via Server Action
    startHumanityTransition(async () => {
      try {
        const res = await setHumanityAction(characterId, newVal);
        if (res.success) {
          // Corrigir Máculas se o backend as ajustou por overflow
          if (res.stains !== undefined && res.stains !== stains) {
            onStainsChange(res.stains);
          }
        } else {
          // Reverter
          onHumanityChange(humanity);
          showError(res.error || "Erro ao ajustar Humanidade.", "Humanidade");
        }
      } catch {
        onHumanityChange(humanity);
        showError("Erro de conexão ao ajustar Humanidade.", "Erro de Rede");
      }
    });
  };

  // Máculas via Server Action (já existente)
  const handleAddStain = async () => {
    if (disabled || isUpdatingStains || isWassail) return;
    setIsUpdatingStains(true);
    try {
      const res = await addStainAction(characterId, 1);
      if (res.success) {
        onStainsChange(res.stains ?? stains);
        if (res.degradation && res.degradation > 0) {
          showDegradation(res.degradation);
        }
      } else {
        showError(res.error || "Erro desconhecido", "Adicionar Mácula");
      }
    } catch {
      showError("Erro de conexão ao adicionar Mácula.", "Erro de Rede");
    } finally {
      setIsUpdatingStains(false);
    }
  };

  const handleRemoveStain = async () => {
    if (disabled || isUpdatingStains || stains <= 0) return;
    setIsUpdatingStains(true);
    try {
      const res = await addStainAction(characterId, -1);
      if (res.success) {
        onStainsChange(res.stains ?? stains);
      } else {
        showError(res.error || "Erro desconhecido", "Remover Mácula");
      }
    } catch {
      showError("Erro de conexão ao remover Mácula.", "Erro de Rede");
    } finally {
      setIsUpdatingStains(false);
    }
  };

  // Teste de Remorso
  const handleRollRemorse = async () => {
    if (disabled || isRollingRemorse) return;
    setIsRollingRemorse(true);
    try {
      const res = await rollRemorseAction(characterId);
      if (res.success) {
        setRemorseResult({
          success: true,
          isSuccess: res.isSuccess ?? false,
          rolledDice: res.rolledDice ?? [],
          oldHumanity: res.oldHumanity ?? humanity,
          newHumanity: res.newHumanity ?? humanity
        });
        onStainsChange(0);
        onHumanityChange(res.newHumanity ?? humanity);
      } else {
        showError(res.error || "Erro desconhecido", "Teste de Remorso");
        setIsRemorseModalOpen(false);
      }
    } catch {
      showError("Erro ao conectar com o servidor para rolar Remorso.", "Erro de Rede");
      setIsRemorseModalOpen(false);
    } finally {
      setIsRollingRemorse(false);
    }
  };

  const closeRemorseModal = () => {
    setIsRemorseModalOpen(false);
    setRemorseResult(null);
  };

  // ============================================================
  // SVG ICONS
  // ============================================================

  const HumanityDot = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0">
      <circle cx="6" cy="6" r="5" fill="currentColor" stroke="currentColor" strokeWidth="1" />
    </svg>
  );

  const StainMark = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0">
      <line x1="3" y1="9" x2="9" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={`space-y-3 p-3 rounded-sm border transition-all duration-300 ${
      isWassail 
        ? "bg-deep-crimson/10 border-hunger-red/50 shadow-[0_0_12px_rgba(200,36,52,0.2)]" 
        : isWassailDanger
          ? "bg-hunger-red/5 border-hunger-red/25"
          : "bg-bg-card/35 border-white/5"
    }`}>

      {/* ===== CABEÇALHO ===== */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-data uppercase font-semibold tracking-wider text-text-muted">
          Bússola Moral
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-data font-bold px-1.5 py-0.5 rounded-xs border ${
            isWassail
              ? "text-hunger-red border-hunger-red/40 bg-hunger-red/10"
              : "text-gold-accent border-gold-accent/20 bg-gold-accent/5"
          }`}>
            {isWassail ? "WASSAIL" : `HUM ${humanity}`}
          </span>
          {stains > 0 && (
            <span className="text-[10px] font-data font-bold text-hunger-red px-1.5 py-0.5 rounded-xs border border-hunger-red/30 bg-hunger-red/5">
              {stains} {stains === 1 ? "MÁCULA" : "MÁCULAS"}
            </span>
          )}
          {isUpdatingHumanity && (
            <span className="text-[9px] text-text-dim font-data animate-pulse">Salvando...</span>
          )}
        </div>
      </div>

      {/* ===== TRILHA DE 10 POSIÇÕES ===== */}
      <div 
        className={`flex items-center justify-between p-1.5 rounded-xs border transition-all duration-300 h-9 ${
          isWassail
            ? "border-hunger-red/40 bg-deep-crimson/10"
            : stains > 0 && humanity + stains > 8
              ? "border-hunger-red/25 bg-hunger-red/5 animate-pulse-subtle" 
              : "border-white/5 bg-bg-main/30"
        }`}
        role="group"
        aria-label={`Trilha de Humanidade ${humanity} e Máculas ${stains}.`}
      >
        {Array.from({ length: 10 }).map((_, idx) => {
          const boxNum = idx + 1;
          const isHum = boxNum <= humanity;
          const isStn = boxNum > (10 - stains);
          
          let boxClass = "bg-transparent border border-white/10";
          let content = null;

          if (isHum) {
            boxClass = "bg-gold-accent/90 border-gold-accent text-bg-main shadow-[0_0_5px_rgba(255,216,77,0.35)]";
            content = <HumanityDot />;
          } else if (isStn) {
            boxClass = "bg-hunger-red/15 border-hunger-red/60 text-hunger-red shadow-[0_0_5px_rgba(200,36,52,0.25)]";
            content = <StainMark />;
          }

          return (
            <div
              key={idx}
              className={`w-5.5 h-5.5 rounded-xs flex items-center justify-center transition-all duration-150 ${boxClass}`}
              title={`Posição ${boxNum}: ${isHum ? "Humanidade" : isStn ? "Mácula" : "Vazio"}`}
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* ===== CONTROLES SEPARADOS ===== */}
      {!disabled && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
          {/* Controle de Humanidade */}
          <div className="flex items-center justify-between gap-1 bg-bg-main/50 border border-white/10 rounded-xs px-2 py-1 flex-1 min-w-[110px]">
            <span className="text-[9px] font-data uppercase tracking-wider text-text-muted font-bold truncate">Humanidade</span>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => adjustHumanity(-1)}
                disabled={isUpdatingHumanity || isWassail}
                className="w-5 h-5 bg-white/5 border border-white/10 hover:border-gold-accent/50 hover:bg-white/10 text-[10px] font-bold text-text-muted hover:text-gold-accent flex items-center justify-center rounded-xs transition-colors cursor-pointer select-none disabled:opacity-30 disabled:cursor-not-allowed"
                title="Reduzir Humanidade"
              >
                −
              </button>
              <span className="text-xs font-data font-bold text-gold-accent w-3.5 text-center tabular-nums">{humanity}</span>
              <button
                onClick={() => adjustHumanity(1)}
                disabled={isUpdatingHumanity || humanity >= 10}
                className="w-5 h-5 bg-white/5 border border-white/10 hover:border-gold-accent/50 hover:bg-white/10 text-[10px] font-bold text-text-muted hover:text-gold-accent flex items-center justify-center rounded-xs transition-colors cursor-pointer select-none disabled:opacity-30 disabled:cursor-not-allowed"
                title="Aumentar Humanidade"
              >
                +
              </button>
            </div>
          </div>

          {/* Controle de Máculas */}
          <div className="flex items-center justify-between gap-1 bg-bg-main/50 border border-white/10 rounded-xs px-2 py-1 flex-1 min-w-[110px]">
            <span className="text-[9px] font-data uppercase tracking-wider text-text-muted font-bold truncate">Máculas</span>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={handleRemoveStain}
                disabled={isUpdatingStains || stains <= 0 || isWassail}
                className="w-5 h-5 bg-white/5 border border-white/10 hover:border-hunger-red/50 hover:bg-white/10 text-[10px] font-bold text-text-muted hover:text-hunger-red flex items-center justify-center rounded-xs transition-colors cursor-pointer select-none disabled:opacity-30 disabled:cursor-not-allowed"
                title="Remover Mácula"
              >
                −
              </button>
              <span className={`text-xs font-data font-bold w-3.5 text-center tabular-nums ${stains > 0 ? "text-hunger-red" : "text-text-dim"}`}>{stains}</span>
              <button
                onClick={handleAddStain}
                disabled={isUpdatingStains || isWassail}
                className="w-5 h-5 bg-white/5 border border-white/10 hover:border-hunger-red/50 hover:bg-white/10 text-[10px] font-bold text-text-muted hover:text-hunger-red flex items-center justify-center rounded-xs transition-colors cursor-pointer select-none disabled:opacity-30 disabled:cursor-not-allowed"
                title="Adicionar Mácula"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ALERTAS E AÇÕES ===== */}
      <div className="flex flex-col space-y-1.5">
        {/* Alerta de Wassail */}
        {isWassail && (
          <div className="p-2 bg-deep-crimson/15 border border-hunger-red/40 rounded-xs text-[10px] font-data text-hunger-red uppercase tracking-wider font-bold text-center animate-pulse">
            💀 Wassail — A Besta dominou por completo. Este personagem perdeu sua alma.
          </div>
        )}

        {/* Aviso de perigo */}
        {isWassailDanger && !isWassail && (
          <span className="text-[9px] text-hunger-red/80 font-bold uppercase tracking-wider block">
            ⚠️ Humanidade em nível crítico. Próxima falha de Remorso = Wassail.
          </span>
        )}

        {/* Botão de Teste de Remorso */}
        {stains > 0 && !disabled && !isWassail && (
          <button
            onClick={() => setIsRemorseModalOpen(true)}
            className="w-full py-1.5 bg-burgundy/40 border border-blood-red hover:bg-burgundy text-[10px] font-bold font-data text-text-primary uppercase tracking-widest rounded-xs transition-all duration-150 cursor-pointer shadow-[0_0_8px_rgba(200,36,52,0.15)] flex items-center justify-center gap-1.5 select-none"
          >
            <span>⚖️ Rolar Remorso — {dicePool} {dicePool === 1 ? "dado" : "dados"}</span>
          </button>
        )}
      </div>

      {/* ===== MODAL DE TESTE DE REMORSO ===== */}
      {isRemorseModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-blood-red max-w-sm w-full p-5 rounded-sm shadow-[0_0_25px_rgba(139,0,0,0.3)] space-y-4">
            
            {/* Cabeçalho */}
            <div className="border-b border-white/10 pb-2">
              <h3 className="text-base font-gothic tracking-wider text-blood-red uppercase flex items-center gap-1.5">
                <span>⚖️ Teste de Remorso</span>
              </h3>
              <p className="text-[9px] text-text-muted font-data uppercase tracking-wider">
                Julgamento da Besta no Fim da Sessão
              </p>
            </div>

            {/* Conteúdo dinâmico / Resultados */}
            {!remorseResult ? (
              <div className="space-y-3">
                <div className="bg-bg-main/50 p-3 rounded border border-white/5 text-xs font-reading space-y-2">
                  <p>
                    O Remorso é testado para ver se o seu vampiro ainda sente culpa por suas ações ou se sua alma se degradou de vez.
                  </p>
                  <div className="flex justify-between border-t border-white/5 pt-2 font-data text-[11px]">
                    <span className="text-text-muted">Parada de Dados:</span>
                    <span className="text-gold-accent font-bold">{dicePool} d10</span>
                  </div>
                  <p className="text-[10px] text-text-dim italic">
                    * Calculado como: Humanidade ({humanity}) − Máculas ({stains}). Mínimo de 1 dado. Pelo menos um resultado 6 ou mais garante o sucesso.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={closeRemorseModal}
                    disabled={isRollingRemorse}
                    className="px-3.5 py-1.5 border border-white/10 rounded-xs text-[10px] font-data uppercase tracking-wider text-text-muted hover:text-white transition-colors cursor-pointer select-none"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleRollRemorse}
                    disabled={isRollingRemorse}
                    className="px-3.5 py-1.5 bg-burgundy border border-blood-red text-text-primary text-[10px] font-bold font-data uppercase tracking-wider rounded-xs hover:bg-blood-red transition-all duration-150 shadow-[0_0_8px_rgba(200,36,52,0.2)] cursor-pointer select-none"
                  >
                    {isRollingRemorse ? "Rolando dados..." : "Rolar Dados"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual dos dados rolados */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-text-muted font-data uppercase tracking-wider">Dados Rolados:</span>
                  <div className="flex flex-wrap gap-1.5 justify-center py-2.5 bg-bg-main/40 border border-white/5 rounded-xs">
                    {remorseResult.rolledDice.map((val, idx) => {
                      const isSuccessDie = val >= 6;
                      return (
                        <div
                          key={idx}
                          className={`w-8 h-8 rounded-xs border flex items-center justify-center font-data text-xs font-bold transition-all ${
                            isSuccessDie
                              ? "bg-gold-accent border-gold-accent text-bg-main shadow-[0_0_8px_rgba(255,216,77,0.5)]"
                              : "bg-black/40 border-white/10 text-text-muted/65"
                          }`}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Veredito */}
                <div className="space-y-2">
                  {remorseResult.isSuccess ? (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-500/40 rounded-xs space-y-1">
                      <h4 className="font-gothic text-sm text-emerald-400 font-bold uppercase tracking-wide">
                        A Culpa o Assombra!
                      </h4>
                      <p className="text-[10.5px] text-text-primary font-reading leading-snug">
                        Sua humanidade ainda chora pelas atrocidades cometidas. A alma sobrevive. 
                        <strong> Máculas zeradas!</strong> sua Humanidade permanece em <strong>{remorseResult.newHumanity}</strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-hunger-red/10 border border-hunger-red/40 rounded-xs space-y-1 animate-pulse">
                      <h4 className="font-gothic text-sm text-hunger-red font-bold uppercase tracking-wide">
                        A Besta Venceu!
                      </h4>
                      <p className="text-[10.5px] text-text-primary font-reading leading-snug">
                        Você não sentiu remorso e aceitou a monstruosidade. Sua Humanidade caiu de {remorseResult.oldHumanity} para <strong>{remorseResult.newHumanity}</strong>.
                        As Máculas foram zeradas.
                        {remorseResult.newHumanity === 0 && (
                          <span className="block mt-1 text-hunger-red font-bold">💀 Wassail. A Besta reinou. O personagem caiu nas trevas.</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeRemorseModal}
                    className="px-4 py-1.5 bg-white/5 border border-white/10 text-text-muted hover:text-white rounded-xs text-[10px] font-data uppercase tracking-wider transition-colors cursor-pointer select-none"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
