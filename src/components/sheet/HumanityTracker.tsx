"use client";

import React, { useState } from "react";
import { addStainAction, rollRemorseAction } from "@/app/actions/humanityActions";

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

  const isDegenerating = humanity + stains > 10;
  const dicePool = Math.max(1, 10 - humanity - stains);

  // Manipular alteração de humanidade via stepper
  const adjustHumanity = (amount: number) => {
    if (disabled) return;
    const newVal = Math.max(0, Math.min(10, humanity + amount));
    onHumanityChange(newVal);
  };

  // Manipular adição de Máculas (Stains) chamando a Server Action para tratar overflow
  const handleAddStain = async () => {
    if (disabled || isUpdatingStains) return;
    setIsUpdatingStains(true);

    try {
      const res = await addStainAction(characterId, 1);
      if (res.success) {
        onStainsChange(res.stains ?? stains);
        if (res.degradation && res.degradation > 0) {
          alert(
            `💥 Degradação Moral! Suas Máculas ultrapassaram o limite da Humanidade. Você sofreu ${res.degradation} de Dano Agravado na Força de Vontade.`
          );
        }
      } else {
        alert(`Erro ao adicionar Mácula: ${res.error}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro de conexão ao adicionar Mácula.");
    } finally {
      setIsUpdatingStains(false);
    }
  };

  // Manipular remoção de Mácula (Stains)
  const handleRemoveStain = async () => {
    if (disabled || isUpdatingStains || stains <= 0) return;
    setIsUpdatingStains(true);

    try {
      const res = await addStainAction(characterId, -1);
      if (res.success) {
        onStainsChange(res.stains ?? stains);
      } else {
        alert(`Erro ao remover Mácula: ${res.error}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro de conexão ao remover Mácula.");
    } finally {
      setIsUpdatingStains(false);
    }
  };

  // Executar teste de Remorso
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
        
        // Atualizar estado na interface do jogador
        onStainsChange(0);
        onHumanityChange(res.newHumanity ?? humanity);
      } else {
        alert(`Erro ao rolar Remorso: ${res.error}`);
        setIsRemorseModalOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro ao conectar com o servidor para rolar Remorso.");
      setIsRemorseModalOpen(false);
    } finally {
      setIsRollingRemorse(false);
    }
  };

  const closeRemorseModal = () => {
    setIsRemorseModalOpen(false);
    setRemorseResult(null);
  };

  return (
    <div className="space-y-2 bg-bg-card/35 p-3 rounded-sm border border-white/5 shadow-none relative">
      <div className="flex justify-between items-center text-xs font-data uppercase font-semibold text-text-muted">
        <span>Bússola Moral (Humanidade)</span>
        <span className="text-[10px] text-gold-accent font-semibold">
          Hum: {humanity} / Mac: {stains}
        </span>
      </div>

      {/* RENDERIZAÇÃO DA TRILHA BIDIRECIONAL */}
      <div className="flex items-center space-x-2">
        {/* Stepper Esquerda: Humanidade */}
        {!disabled && (
          <div className="flex space-x-1 shrink-0">
            <button
              onClick={() => adjustHumanity(-1)}
              className="w-6 h-6 bg-white/5 border border-white/10 hover:border-gold-accent/50 hover:bg-white/10 text-xs font-bold text-text-muted hover:text-gold-accent flex items-center justify-center rounded-xs transition-colors cursor-pointer select-none"
              title="Reduzir Humanidade"
            >
              -
            </button>
            <button
              onClick={() => adjustHumanity(1)}
              className="w-6 h-6 bg-white/5 border border-white/10 hover:border-gold-accent/50 hover:bg-white/10 text-xs font-bold text-text-muted hover:text-gold-accent flex items-center justify-center rounded-xs transition-colors cursor-pointer select-none"
              title="Aumentar Humanidade"
            >
              +
            </button>
          </div>
        )}

        {/* A Trilha central de 10 caixas */}
        <div 
          className={`flex-1 flex justify-between items-center p-1 rounded-xs transition-all duration-300 border bg-bg-main/30 h-8 ${
            isDegenerating 
              ? "border-hunger-red/40 bg-deep-crimson/5 animate-pulse" 
              : "border-white/5"
          }`}
          role="group"
          aria-label={`Trilha de Humanidade ${humanity} e Máculas ${stains}.`}
        >
          {Array.from({ length: 10 }).map((_, idx) => {
            const boxNum = idx + 1;
            const isHum = boxNum <= humanity;
            const isStn = boxNum > (10 - stains);
            
            let bgClass = "bg-transparent border border-white/10";
            let content = null;

            if (isHum) {
              // Humanidade Preenchida: Rosa Vermelha ou Dourado Sólido
              bgClass = "bg-gold-accent border-gold-accent text-bg-main shadow-[0_0_6px_rgba(255,216,77,0.4)]";
              content = <span className="text-[10px] select-none leading-none">🌹</span>;
            } else if (isStn) {
              // Mácula Ativa: Vermelho Escuro Manchado
              bgClass = "bg-hunger-red/25 border-hunger-red text-hunger-red font-bold shadow-[0_0_6px_rgba(200,36,52,0.3)] animate-pulse-subtle";
              content = <span className="text-[10px] select-none leading-none">/</span>;
            }

            return (
              <div
                key={idx}
                className={`w-5 h-5 rounded-xs flex items-center justify-center text-[10px] ${bgClass}`}
                title={`Posição ${boxNum}: ${isHum ? "Humanidade" : isStn ? "Mácula" : "Vazio"}`}
              >
                {content}
              </div>
            );
          })}
        </div>

        {/* Stepper Direita: Máculas */}
        {!disabled && (
          <div className="flex space-x-1 shrink-0">
            <button
              onClick={handleRemoveStain}
              disabled={isUpdatingStains || stains <= 0}
              className="w-6 h-6 bg-white/5 border border-white/10 hover:border-hunger-red/50 hover:bg-white/10 text-xs font-bold text-text-muted hover:text-hunger-red flex items-center justify-center rounded-xs transition-colors cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed"
              title="Remover Mácula"
            >
              -
            </button>
            <button
              onClick={handleAddStain}
              disabled={isUpdatingStains}
              className="w-6 h-6 bg-white/5 border border-white/10 hover:border-hunger-red/50 hover:bg-white/10 text-xs font-bold text-text-muted hover:text-hunger-red flex items-center justify-center rounded-xs transition-colors cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed"
              title="Adicionar Mácula (Risco de Degradação)"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Mensagens de Alerta e Botão de Fim de Sessão */}
      <div className="flex flex-col space-y-1.5 pt-0.5">
        {isDegenerating && (
          <span className="text-[9px] text-hunger-red font-bold uppercase tracking-wider block animate-pulse">
            ⚠️ Alerta: Máculas em excesso causaram dano à Força de Vontade!
          </span>
        )}

        {stains > 0 && !disabled && (
          <button
            onClick={() => setIsRemorseModalOpen(true)}
            className="w-full py-1.5 bg-burgundy/40 border border-blood-red hover:bg-burgundy text-[10px] font-bold font-data text-text-primary uppercase tracking-widest rounded-xs transition-all duration-150 cursor-pointer shadow-[0_0_8px_rgba(200,36,52,0.15)] flex items-center justify-center gap-1.5 select-none"
          >
            <span>⚖️ Rolar Remorso (Fim de Sessão)</span>
          </button>
        )}
      </div>

      {/* MODAL GÓTICO DE CONFIRMAÇÃO DO TESTE DE REMORSO */}
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
                    <span className="text-text-muted">Parada de Dados (Vazias):</span>
                    <span className="text-gold-accent font-bold">{dicePool} d10</span>
                  </div>
                  <p className="text-[10px] text-text-dim italic">
                    * Calculado como: 10 - Humanidade ({humanity}) - Máculas ({stains}). Mínimo de 1 dado. Pelo menos um resultado 6 ou mais garante o sucesso.
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
