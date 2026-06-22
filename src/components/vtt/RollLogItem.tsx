"use client";

import React from "react";
import { RollItem } from "./ActionFeed";
import { V5RollResult, RouseCheckResult } from "@/lib/vtt/BloodEngine";

interface RollLogItemProps {
  roll: RollItem;
  localCharacterId?: string;
  isStoryteller?: boolean;
  selectedDiceIndices: number[];
  onSelectDie: (rollId: string, dieIdx: number) => void;
}

export default function RollLogItem({
  roll,
  localCharacterId,
  isStoryteller = false,
  selectedDiceIndices,
  onSelectDie,
}: RollLogItemProps) {
  const isStandard = roll.resultData.type === "standard";
  const standardResult = roll.resultData as V5RollResult;
  const rouseResult = roll.resultData as RouseCheckResult;
  
  const showSecret = roll.isSecret && !isStoryteller;

  // Formatar hora
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

  const timeStr = formatTime(roll.createdAt);

  if ((roll.resultData as any).type === "xp_grant") {
    const xpData = roll.resultData as any;
    return (
      <div className="backdrop-blur-md bg-gold-accent/5 border border-gold-accent/25 rounded-sm p-3 flex flex-col space-y-2 select-text shadow-[0_0_12px_rgba(212,175,55,0.08)]">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center text-[9px] font-data tracking-wider text-gold-accent font-bold">
          <div className="flex items-center space-x-1.5 truncate">
            <svg className="w-3.5 h-3.5 text-gold-accent mr-1 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10M6 10h10" />
            </svg>
            <span>FIM DE SESSÃO</span>
          </div>
          <span className="text-[8px] text-gold-accent/70 font-mono">
            {timeStr}
          </span>
        </div>

        {/* Título da Sessão */}
        <div className="space-y-0.5">
          <h4 className="font-gothic text-xs text-gold-accent tracking-wide uppercase leading-tight truncate">
            {xpData.sessionTitle}
          </h4>
          <p className="text-[9px] text-text-muted font-reading leading-tight">
            O Narrador encerrou a sessão e distribuiu pontos de experiência (XP) para a coterie.
          </p>
        </div>

        {/* Lista de Personagens e XP recebido */}
        <div className="bg-black/40 border border-white/5 rounded-xs p-2 space-y-1 text-[9px] font-data text-text-primary">
          <div className="flex justify-between border-b border-white/5 pb-1 text-[8px] text-text-muted">
            <span>Membro da Coterie</span>
            <span>XP</span>
          </div>
          {xpData.individualGrants?.map((grant: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center py-0.5">
              <span className="font-medium text-text-muted truncate max-w-[70%]">{grant.characterName}</span>
              <span className="text-gold-accent font-bold">+{grant.totalXp} XP</span>
            </div>
          ))}
        </div>

        {/* Rodapé do Grant */}
        <div className="flex justify-between items-center text-[8px] font-data text-gold-accent/60 pt-1 border-t border-gold-accent/15">
          <span>Base da Sessão: {xpData.baseXp} XP</span>
          <span>Sincronizado ✓</span>
        </div>
      </div>
    );
  }

  if ((roll.resultData as any).type === "damage_log") {
    const damageData = roll.resultData as any;
    const isHealth = damageData.trackType === "health";
    const trackLabel = isHealth ? "Vitalidade" : "Força de Vontade";

    let actionDesc = "";
    const characterName = roll.characterName || "Personagem";
    const isOverride = damageData.damageType === "override";
    
    if (isOverride) {
      actionDesc = `ajustou a trilha de ${trackLabel} para: ${damageData.newSuperficial} Superficial / ${damageData.newAggravated} Agravado.`;
    } else {
      const isHeal = damageData.amount < 0;
      const absAmount = Math.abs(damageData.amount);
      const isAgg = damageData.damageType === "aggravated";
      const dmgTypeLabel = isAgg ? "Agravado" : "Superficial";
      
      if (isHeal) {
        actionDesc = `curou ${absAmount} de Dano ${dmgTypeLabel} em ${trackLabel}.`;
      } else {
        actionDesc = `sofreu ${absAmount} de Dano ${dmgTypeLabel} em ${trackLabel}.`;
      }
    }

    const isCritical = damageData.isCritical;
    const borderClass = isCritical
      ? "border-hunger-red shadow-[0_0_12px_rgba(239,68,68,0.25)] animate-pulse"
      : isHealth 
        ? "border-blood-red/20 hover:border-blood-red/35 shadow-[0_2px_8px_rgba(139,0,0,0.1)]"
        : "border-willpower-blue/20 hover:border-willpower-blue/35 shadow-[0_2px_8px_rgba(59,130,246,0.1)]";

    return (
      <div className={`backdrop-blur-md bg-bg-card-dark/90 rounded-sm p-3 flex flex-col space-y-2 border select-text ${borderClass}`}>
        {/* Cabeçalho */}
        <div className="flex justify-between items-center text-[9px] font-data tracking-wider font-bold">
          <div className="flex items-center space-x-1.5 truncate">
            <span className={`flex items-center gap-1.5 ${isCritical ? "text-hunger-red animate-pulse" : isHealth ? "text-blood-red" : "text-willpower-blue"}`}>
              {isHealth ? (
                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 fill-none stroke-current shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.88A2.5 2.5 0 0 1 9.5 2Z" />
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.88A2.5 2.5 0 0 0 14.5 2Z" />
                </svg>
              )}
              <span>{isCritical ? "ESTADO CRÍTICO" : "REGISTRO DE DANO"}</span>
            </span>
          </div>
          <span className="text-[8px] text-text-dim/75 font-mono">
            {timeStr}
          </span>
        </div>

        {/* Descrição principal */}
        <div className="space-y-1">
          <div className="text-xs text-text-primary font-reading leading-relaxed">
            <span className="font-bold text-gold-accent font-data uppercase tracking-wider">{characterName}</span>{" "}
            {actionDesc}
          </div>

          {isCritical && (
            <div className="mt-1 bg-hunger-red/10 border border-hunger-red/30 rounded-xs p-2 flex items-center space-x-2 text-hunger-red text-[10px] font-bold uppercase tracking-wider font-data">
              <span>💀</span>
              <span>
                {isHealth
                  ? "O personagem entrou em Torpor!"
                  : "O personagem sofreu um Colapso Mental!"}
              </span>
            </div>
          )}
        </div>

        {/* Estado atualizado da trilha */}
        <div className="bg-black/35 border border-white/5 rounded-xs p-2 flex items-center justify-between text-[9.5px] font-data text-text-muted">
          <span>Nova Trilha:</span>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-0.5">
              {Array.from({ length: damageData.newSuperficial + damageData.newAggravated }).map((_, idx) => {
                const isAgg = idx < damageData.newAggravated;
                const charSymbol = isAgg ? "✕" : "╱";
                const colorClass = isAgg ? "text-hunger-red bg-hunger-red/10 border-hunger-red/30" : "text-white bg-white/5 border-white/10";
                return (
                  <span 
                    key={idx} 
                    className={`w-3.5 h-3.5 border flex items-center justify-center font-bold text-[8px] rounded-xs ${colorClass}`}
                    title={isAgg ? "Dano Agravado" : "Dano Superficial"}
                  >
                    {charSymbol}
                  </span>
                );
              })}
              {damageData.newSuperficial + damageData.newAggravated === 0 && (
                <span className="text-[9px] text-green-500 font-bold uppercase font-data">✓ Integro</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ordenação inteligente de dados (preservando o índice original para dados normais)
  let sortedNormalDice: Array<{ value: number; originalIdx: number }> = [];
  let sortedHungerDice: number[] = [];

  if (isStandard && !showSecret) {
    if (Array.isArray(standardResult.normalDice)) {
      sortedNormalDice = standardResult.normalDice
        .map((value, originalIdx) => ({ value, originalIdx }))
        .sort((a, b) => b.value - a.value);
    }
    if (Array.isArray(standardResult.hungerDice)) {
      sortedHungerDice = [...standardResult.hungerDice].sort((a, b) => b - a);
    }
  }

  // Estilos de dados
  const getDieClass = (val: number, isHunger: boolean, isSelected: boolean, isClickable: boolean) => {
    let base = "w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-mono font-bold select-none border transition-all duration-150 ";
    
    if (isClickable) {
      base += "cursor-pointer hover:scale-105 active:scale-95 ";
    } else {
      base += "cursor-default ";
    }

    if (isHunger) {
      // Dados de Fome (Vermelhos)
      if (val === 10) {
        base += "bg-hunger-red/35 border-hunger-red text-gold-accent shadow-[0_0_6px_rgba(239,68,68,0.4)] animate-pulse";
      } else if (val >= 6) {
        base += "bg-hunger-red/25 border-hunger-red text-red-200";
      } else if (val === 1) {
        base += "bg-hunger-red/10 border-hunger-red/50 text-hunger-red/80";
      } else {
        base += "bg-black/40 border-hunger-red/30 text-red-300/60";
      }
    } else {
      // Dados Normais (Escuros/Pretos)
      if (isSelected) {
        base += "bg-willpower-blue/30 border-willpower-blue text-white shadow-[0_0_6px_rgba(59,130,246,0.5)]";
      } else if (val === 10) {
        base += "bg-black/60 border-gold-accent text-gold-accent shadow-[0_0_4px_rgba(212,175,55,0.2)]";
      } else if (val >= 6) {
        base += "bg-black/60 border-white/20 text-text-primary";
      } else {
        base += "bg-black/30 border-white/5 text-text-muted/50";
      }
    }

    return base;
  };

  const isClickable = roll.characterId === localCharacterId && isStandard && !roll.isRerolled && !showSecret;

  return (
    <div
      className={`backdrop-blur-md border rounded-sm p-2 flex flex-col space-y-1.5 transition-all duration-200 select-text ${
        roll.isRerolled
          ? "bg-bg-card-dark/45 border-white/5 opacity-60"
          : "bg-bg-card-dark/85 border-white/10 hover:border-white/15"
      }`}
    >
      {/* Cabeçalho compacto: [Hora] Nome - Atributo */}
      <div className="flex justify-between items-center text-[9px] font-data tracking-wider">
        <div className="flex items-center space-x-1.5 truncate max-w-[80%]">
          <span className="font-bold text-text-primary truncate">
            {showSecret ? "Narrador" : roll.characterName}
          </span>
          <span className="text-text-dim/60 font-semibold truncate">
            {showSecret ? "Rolagem Secreta" : roll.poolName}
          </span>
        </div>
        <span className="text-[8px] text-text-dim font-mono shrink-0">
          {timeStr}
        </span>
      </div>

      {/* Visualização de Dados */}
      <div className="flex flex-wrap gap-1 items-center">
        {showSecret ? (
          // Dados mascarados para rolagens secretas de jogadores
          isStandard ? (
            Array.from({ length: (standardResult.normalDice?.length || 0) + (standardResult.hungerDice?.length || 0) }).map((_, idx) => (
              <div
                key={`sec-die-${idx}`}
                className="w-5 h-5 rounded-xs flex items-center justify-center text-[9px] border bg-black/45 border-white/5 text-text-dim/30 font-bold"
              >
                ?
              </div>
            ))
          ) : (
            <div className="w-5 h-5 rounded-xs flex items-center justify-center text-[9px] border bg-black/45 border-white/5 text-text-dim/30 font-bold">
              ?
            </div>
          )
        ) : isStandard ? (
          // Dados Normais Ordenados
          <>
            {sortedNormalDice.map(({ value, originalIdx }) => {
              const isSelected = selectedDiceIndices.includes(originalIdx);
              return (
                <div
                  key={`normal-${originalIdx}`}
                  className={getDieClass(value, false, isSelected, isClickable)}
                  onClick={() => isClickable && onSelectDie(roll.id, originalIdx)}
                >
                  {value}
                </div>
              );
            })}
            {/* Dados de Fome Ordenados */}
            {sortedHungerDice.map((value, idx) => (
              <div
                key={`hunger-${idx}`}
                className={getDieClass(value, true, false, false)}
                title="Dado de Fome (Inalterável)"
              >
                {value}
              </div>
            ))}
          </>
        ) : (
          // Dado de Rouse Check (Despertar)
          <div
            className={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-mono font-bold border ${
              rouseResult.isSuccess
                ? "bg-green-500/10 border-green-500/35 text-green-400"
                : "bg-hunger-red/25 border-hunger-red text-red-200 animate-pulse"
            }`}
          >
            {rouseResult.dieResult ?? "?"}
          </div>
        )}
      </div>

      {/* Resultado consolidado em linha compacta */}
      {!showSecret && (
        <div className="flex justify-between items-center pt-1 border-t border-white/5 text-[9px] font-data">
          {isStandard ? (
            <>
              {/* Sucessos consolidado */}
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-text-primary font-mono text-[10px]">
                  {standardResult.totalSuccesses}
                </span>
                <span className="text-text-muted uppercase">
                  {standardResult.totalSuccesses === 1 ? "Sucesso" : "Sucessos"}
                </span>
                {standardResult.difficulty > 0 && (
                  <span className="text-text-dim/60">
                    / Alvo {standardResult.difficulty}
                  </span>
                )}
              </div>

              {/* Badges de regras */}
              <div className="flex space-x-1">
                {roll.isRerolled && (
                  <span className="px-1 py-0.2 bg-willpower-blue/20 text-willpower-blue border border-willpower-blue/30 rounded-xs font-bold text-[8px] uppercase tracking-wider">
                    Rerrolado 🌀
                  </span>
                )}
                {standardResult.isBestialFailure && (
                  <span className="px-1 py-0.2 bg-hunger-red/25 text-hunger-red border border-hunger-red/35 rounded-xs font-bold text-[8px] uppercase tracking-wider shadow-sm animate-pulse">
                    Falha Bestial! 💀
                  </span>
                )}
                {standardResult.isMessianic && (
                  <span className="px-1 py-0.2 bg-gold-accent/25 text-gold-accent border border-gold-accent/35 rounded-xs font-bold text-[8px] uppercase tracking-wider shadow-sm animate-pulse">
                    Crítico Messiânico! ✨
                  </span>
                )}
                {!standardResult.isBestialFailure && !standardResult.isMessianic && standardResult.difficulty > 0 && (
                  <span
                    className={`px-1 py-0.2 rounded-xs border font-bold text-[8px] uppercase tracking-wider ${
                      standardResult.isSuccess
                        ? "bg-green-500/10 text-green-400 border-green-500/25"
                        : "bg-white/5 text-text-dim/60 border-white/10"
                    }`}
                  >
                    {standardResult.isSuccess ? "Sucesso" : "Falha"}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="text-text-muted uppercase">Teste de Despertar</span>
              <span
                className={`px-1 py-0.2 rounded-xs border font-bold text-[8px] uppercase tracking-wider ${
                  rouseResult.isSuccess
                    ? "bg-green-500/10 text-green-400 border-green-500/25"
                    : "bg-hunger-red/20 text-hunger-red border-hunger-red/30"
                }`}
              >
                {rouseResult.isSuccess ? "Sucesso (Fome Mantida)" : "Falha (Fome +1) 🩸"}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
