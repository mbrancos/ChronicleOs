"use client";

import React, { useState, useEffect, useRef } from "react";
import type { AnatomicalVitality, BodySectorId, SectorDamage } from "@/types/systems/regrasDeOuro";
import { healSectorDamage, refreshAllPenalties } from "@/lib/systems/regrasDeOuro/rules";
import SolidHeaderBanner from "@/components/common/SolidHeaderBanner";
import AnatomicalSilhouetteSVG from "./AnatomicalSilhouetteSVG";

export interface AnatomicalHealthTrackerProps {
  vitality: AnatomicalVitality;
  currentBlood?: number;
  maxBlood?: number;
  onChangeVitality: (newVitality: AnatomicalVitality) => void;
  onChangeBlood?: (newBlood: number) => void;
  disabled?: boolean;
  className?: string;
}

interface SectorSpec {
  id: BodySectorId;
  label: string;
  d10Number: string;
  isVital: boolean;
  maxNormal: number;
  maxLetal: number;
  maxAgravado: number;
  penaltyLabels: string[];
  description: string;
}

const SECTORS_SPEC: Record<BodySectorId, SectorSpec> = {
  cabeca: {
    id: "cabeca",
    label: "Cabeça",
    d10Number: "1",
    isVital: true,
    maxNormal: 5,
    maxLetal: 4,
    maxAgravado: 3,
    penaltyLabels: ["0", "-1", "-2", "-4", "X"],
    description: "Área Vital • Afeta Percepção, Raciocínio e Ações Mentais. Nível X provoca Torpor imediato.",
  },
  pescoco: {
    id: "pescoco",
    label: "Pescoço",
    d10Number: "0",
    isVital: true,
    maxNormal: 5,
    maxLetal: 4,
    maxAgravado: 3,
    penaltyLabels: ["0", "-1", "-2", "-4", "X"],
    description: "Área Vital • Ponto carotídeo crítico. Nível X com dano letal ou agravado acarreta decapitação.",
  },
  torax: {
    id: "torax",
    label: "Tórax",
    d10Number: "5 • 6",
    isVital: true,
    maxNormal: 7,
    maxLetal: 6,
    maxAgravado: 5,
    penaltyLabels: ["0", "0", "-1", "-2", "-3", "-4", "X"],
    description: "Área Vital Central • Protege o Coração Cainita. Maior absorção. Nível X conduz a Torpor.",
  },
  braco_d: {
    id: "braco_d",
    label: "Braço D.",
    d10Number: "2",
    isVital: false,
    maxNormal: 5,
    maxLetal: 4,
    maxAgravado: 3,
    penaltyLabels: ["0", "-1", "-2", "-3", "X"],
    description: "Membro Superior • Penalidades subtraem dados de ataques corpo a corpo e armas de fogo.",
  },
  braco_e: {
    id: "braco_e",
    label: "Braço E.",
    d10Number: "9",
    isVital: false,
    maxNormal: 5,
    maxLetal: 4,
    maxAgravado: 3,
    penaltyLabels: ["0", "-1", "-2", "-3", "X"],
    description: "Membro Superior • Penalidades afetam uso de escudo, empunhadura bimanual e agarrões.",
  },
  mao_d: {
    id: "mao_d",
    label: "Mão D.",
    d10Number: "3",
    isVital: false,
    maxNormal: 4,
    maxLetal: 3,
    maxAgravado: 2,
    penaltyLabels: ["0", "-1", "-2", "X"],
    description: "Extremidade • Nível X força desarmamento imediato e inutiliza a mão dominante.",
  },
  mao_e: {
    id: "mao_e",
    label: "Mão E.",
    d10Number: "8",
    isVital: false,
    maxNormal: 4,
    maxLetal: 3,
    maxAgravado: 2,
    penaltyLabels: ["0", "-1", "-2", "X"],
    description: "Extremidade • Perda de destreza manual e empunhadura secundária.",
  },
  perna_d: {
    id: "perna_d",
    label: "Perna D.",
    d10Number: "4",
    isVital: false,
    maxNormal: 6,
    maxLetal: 5,
    maxAgravado: 4,
    penaltyLabels: ["0", "0", "-1", "-2", "-3", "X"],
    description: "Membro Inferior • Penalidades reduzem Esquiva, Deslocamento e testes de Atletismo.",
  },
  perna_e: {
    id: "perna_e",
    label: "Perna E.",
    d10Number: "7",
    isVital: false,
    maxNormal: 6,
    maxLetal: 5,
    maxAgravado: 4,
    penaltyLabels: ["0", "0", "-1", "-2", "-3", "X"],
    description: "Membro Inferior • Penalidades reduzem velocidade e salto. Em X, o personagem cai ao solo.",
  },
};

export function getSectorActivePenalty(spec: SectorSpec, sector: SectorDamage): string {
  const normal = sector?.normal || 0;
  const letal = sector?.letal || 0;
  const agravado = sector?.agravado || 0;
  const total = normal + letal + agravado;
  if (total === 0) return "0";
  const worstIdx = Math.min(spec.penaltyLabels.length - 1, total - 1);
  return spec.penaltyLabels[worstIdx] || "0";
}

export default function AnatomicalHealthTracker({
  vitality,
  currentBlood = 10,
  maxBlood = 10,
  onChangeVitality,
  onChangeBlood,
  disabled = false,
  className = "",
}: AnatomicalHealthTrackerProps) {
  const [hoveredSector, setHoveredSector] = useState<BodySectorId | null>(null);
  const [selectedSector, setSelectedSector] = useState<BodySectorId | null>(null);
  const [lastD10Roll, setLastD10Roll] = useState<{ roll: number; sectorId: BodySectorId; label: string } | null>(null);

  const trackerRef = useRef<HTMLDivElement>(null);

  // Clique Fora para Desselecionar e Voltar à Visão Geral
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (trackerRef.current && !trackerRef.current.contains(event.target as Node)) {
        setSelectedSector(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Marcação direta de 1 clique
  const handleToggleDot = (
    sectorId: BodySectorId,
    type: "normal" | "letal" | "agravado",
    dotIndex: number
  ) => {
    if (disabled) return;
    const updated: AnatomicalVitality = JSON.parse(JSON.stringify(vitality));
    const sector = updated[sectorId];
    if (!sector) return;

    const currentVal = sector[type] || 0;
    if (currentVal === dotIndex + 1) {
      sector[type] = dotIndex;
    } else {
      sector[type] = dotIndex + 1;
    }

    onChangeVitality(refreshAllPenalties(updated));
  };

  // Cura rápida com 1 clique (consome Vitæ)
  const handleQuickHeal = (sectorId: BodySectorId) => {
    if (disabled) return;
    const sector = vitality[sectorId];
    if (!sector) return;

    let healType: "normal_all" | "letal_one" | "agravado_one" = "normal_all";
    if (sector.agravado > 0) {
      healType = "agravado_one";
    } else if (sector.letal > 0) {
      healType = "letal_one";
    } else if (sector.normal > 0) {
      healType = "normal_all";
    } else {
      return;
    }

    const { vitality: updated, vitaeCost } = healSectorDamage(vitality, sectorId, healType);
    if (vitaeCost > 0 && onChangeBlood && currentBlood >= vitaeCost) {
      onChangeBlood(currentBlood - vitaeCost);
    }
    onChangeVitality(updated);
  };

  // Limpar todos os danos
  const handleResetAllDamage = () => {
    if (disabled) return;
    const updated: AnatomicalVitality = JSON.parse(JSON.stringify(vitality));
    (Object.keys(SECTORS_SPEC) as BodySectorId[]).forEach((secId) => {
      if (updated[secId]) {
        updated[secId].normal = 0;
        updated[secId].letal = 0;
        updated[secId].agravado = 0;
        updated[secId].penalty = 0;
      }
    });
    onChangeVitality(refreshAllPenalties(updated));
  };

  // Rolar 1d10 para localização de impacto
  const handleRollD10Location = () => {
    const roll = Math.floor(Math.random() * 10);
    let targetSector: BodySectorId = "torax";
    if (roll === 1) targetSector = "cabeca";
    else if (roll === 0) targetSector = "pescoco";
    else if (roll === 2) targetSector = "braco_d";
    else if (roll === 9) targetSector = "braco_e";
    else if (roll === 3) targetSector = "mao_d";
    else if (roll === 8) targetSector = "mao_e";
    else if (roll === 4) targetSector = "perna_d";
    else if (roll === 7) targetSector = "perna_e";
    else if (roll === 5 || roll === 6) targetSector = "torax";

    const label = SECTORS_SPEC[targetSector].label;
    setLastD10Roll({ roll, sectorId: targetSector, label });
    setSelectedSector(targetSector);
    setHoveredSector(targetSector);

    setTimeout(() => {
      setHoveredSector(null);
    }, 2500);
  };

  // Cálculo da pior penalidade geral ativa do personagem
  const getWorstGeneralPenalty = () => {
    let worst = 0;
    let hasX = false;
    (Object.keys(SECTORS_SPEC) as BodySectorId[]).forEach((id) => {
      const p = getSectorActivePenalty(SECTORS_SPEC[id], vitality[id]);
      if (p === "X") hasX = true;
      else {
        const num = parseInt(p, 10);
        if (num < worst) worst = num;
      }
    });
    if (hasX) return "X (INCAPACITADO)";
    return worst === 0 ? "0" : String(worst);
  };

  const damagedSectors = (Object.keys(SECTORS_SPEC) as BodySectorId[]).filter((id) => {
    const d = vitality[id];
    return d && (d.normal + d.letal + d.agravado) > 0;
  });

  const worstGeneralPenalty = getWorstGeneralPenalty();

  return (
    <div
      ref={trackerRef}
      className={`p-4 bg-noir-card border border-noir-border rounded-sm space-y-4 select-none ${className}`}
    >
      {/* Tarja de Cabeçalho Superior */}
      <SolidHeaderBanner
        title="TABELA DE VITALIDADE ANATÔMICA"
        subtitle="Registro cirúrgico de danos localizados por membro • Sistema Izandro"
        icon={
          <svg className="w-4 h-4 text-crimson-blood" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        }
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRollD10Location}
              disabled={disabled}
              className="px-3 py-1 bg-crimson-blood hover:bg-red-700 text-white rounded-xs text-[11px] font-condensed tracking-wider font-bold uppercase transition-all shadow-[0_0_8px_rgba(200,36,52,0.4)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>🎲</span>
              <span>Rolar d10</span>
            </button>
            <button
              type="button"
              onClick={handleResetAllDamage}
              disabled={disabled}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-noir-text-muted hover:text-white border border-white/10 rounded-xs text-[11px] font-condensed tracking-wider uppercase transition-all cursor-pointer disabled:opacity-50"
              title="Limpar todos os danos da anatomia"
            >
              Limpar
            </button>
          </div>
        }
      />

      {/* Alerta de Sorteio do d10 */}
      {lastD10Roll && (
        <div className="px-3 py-2 bg-crimson-blood/20 border border-crimson-blood rounded-xs text-[12px] text-white flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold">🎲 Sorteio: {lastD10Roll.roll}</span>
            <span className="text-noir-text-secondary">&rarr;</span>
            <span className="font-bold text-crimson-blood uppercase">{lastD10Roll.label}</span>
          </div>
          <button
            type="button"
            onClick={() => setLastD10Roll(null)}
            className="text-[10px] text-noir-text-muted hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grade Principal: Silhueta Vetorial 1:1 + Gaveta Cirúrgica Tática */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Coluna 1: Silhueta Vetorial 1:1 */}
        <div className="p-3 bg-noir-base/60 border border-noir-border rounded-xs flex justify-center">
          <AnatomicalSilhouetteSVG
            vitality={vitality}
            hoveredSector={hoveredSector}
            selectedSector={selectedSector}
            onHoverSector={setHoveredSector}
            onSelectSector={(secId) => setSelectedSector(secId)}
            disabled={disabled}
          />
        </div>

        {/* Coluna 2: Gaveta Cirúrgica Tática */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="p-4 bg-noir-card-subtle border border-noir-border rounded-xs space-y-4 shadow-xl min-h-[440px] flex flex-col justify-between"
        >
          {/* ESTADO 1: NENHUM MEMBRO SELECIONADO (VISÃO GERAL DO CORPO) */}
          {!selectedSector ? (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="pb-3 border-b border-white/10 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-mono text-noir-text-muted uppercase">Status Geral</div>
                  <h3 className="text-[16px] font-condensed font-bold text-white uppercase tracking-wider">
                    Visão Geral do Corpo
                  </h3>
                  <div className="text-[11px] text-noir-text-secondary mt-0.5">
                    Nenhum membro selecionado
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-mono text-noir-text-muted uppercase">Penalidade Máx.</div>
                  <div
                    className={`text-[20px] font-mono font-bold leading-none ${
                      worstGeneralPenalty.includes("X")
                        ? "text-red-500 animate-pulse"
                        : worstGeneralPenalty !== "0"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {worstGeneralPenalty}
                  </div>
                </div>
              </div>

              {/* Lista dos Membros Atingidos */}
              <div className="bg-noir-base/80 border border-white/5 rounded-xs p-3 flex-1 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-noir-text-muted uppercase">
                  <span>Membros Atingidos</span>
                  <span className="text-crimson-blood font-bold">{damagedSectors.length} de 9</span>
                </div>

                {damagedSectors.length === 0 ? (
                  <div className="py-8 text-center text-noir-text-muted text-[12px] space-y-1">
                    <div className="text-xl">✨</div>
                    <p>Corpo totalmente íntegro.</p>
                    <p className="text-[10px]">Nenhum ferimento ativo.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                    {damagedSectors.map((secId) => {
                      const spec = SECTORS_SPEC[secId];
                      const d = vitality[secId];
                      const penalty = getSectorActivePenalty(spec, d);
                      return (
                        <div
                          key={secId}
                          onClick={() => setSelectedSector(secId)}
                          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xs flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div>
                            <div className="text-[12px] font-bold text-white flex items-center gap-1.5">
                              <span className="font-mono text-noir-text-muted">[{spec.d10Number}]</span>
                              <span>{spec.label}</span>
                            </div>
                            <div className="flex gap-2 text-[10px] text-noir-text-secondary mt-0.5 font-mono">
                              {d.normal > 0 && <span className="text-amber-400">{d.normal} Cont.</span>}
                              {d.letal > 0 && <span className="text-red-400">{d.letal} Let.</span>}
                              {d.agravado > 0 && <span className="text-purple-400">{d.agravado} Agr.</span>}
                            </div>
                          </div>
                          <span
                            className={`font-mono text-[13px] font-bold ${
                              penalty === "X" ? "text-red-400 font-black" : "text-amber-300"
                            }`}
                          >
                            {penalty}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-noir-text-muted text-center pt-2">
                Clique em qualquer parte do corpo ou no botão 🎲 Rolar d10 para registrar danos.
              </div>
            </div>
          ) : (
            /* ESTADO 2: MEMBRO SELECIONADO */
            (() => {
              const spec = SECTORS_SPEC[selectedSector];
              const sector = vitality[selectedSector] || {
                normal: 0,
                letal: 0,
                agravado: 0,
                maxNormal: spec.maxNormal,
                maxLetal: spec.maxLetal,
                maxAgravado: spec.maxAgravado,
                penalty: 0,
              };
              const activePenalty = getSectorActivePenalty(spec, sector);
              const hasDamage = sector.normal > 0 || sector.letal > 0 || sector.agravado > 0;

              return (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Cabeçalho do Membro */}
                    <div className="pb-3 border-b border-white/10 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-white text-black font-mono font-black text-[10px] rounded-xs">
                            {spec.d10Number}
                          </span>
                          <h3 className="text-[17px] font-condensed font-bold text-white uppercase tracking-wider">
                            {spec.label}
                          </h3>
                        </div>
                        <div
                          className={`text-[10px] font-semibold mt-1 ${
                            spec.isVital ? "text-crimson-blood" : "text-noir-text-secondary"
                          }`}
                        >
                          {spec.isVital ? "ÁREA VITAL • Risco Crítico" : "MEMBRO PERIFÉRICO"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[9px] font-mono text-noir-text-muted uppercase">Penalidade</div>
                        <div
                          className={`text-[22px] font-mono font-bold leading-none ${
                            activePenalty === "X"
                              ? "text-red-500 animate-pulse font-black"
                              : activePenalty !== "0"
                              ? "text-amber-400"
                              : "text-white"
                          }`}
                        >
                          {activePenalty}
                        </div>
                      </div>
                    </div>

                    {/* Descrição Tática */}
                    <p className="text-[11px] text-noir-text-secondary leading-relaxed">
                      {spec.description}
                    </p>

                    {/* Matriz CSS Grid Rígida de 4 Colunas */}
                    <div className="p-3 bg-noir-base/80 border border-white/5 rounded-xs space-y-2">
                      <div className="grid grid-cols-[50px_1fr_1fr_1fr] items-center justify-items-center pb-2 border-b border-white/5 text-[10px] font-mono font-bold text-noir-text-muted uppercase">
                        <span className="justify-self-start pl-1">Escala</span>
                        <span className="text-amber-400 flex items-center gap-1">🩹 Cont.</span>
                        <span className="text-red-400 flex items-center gap-1">🗡️ Let.</span>
                        <span className="text-crimson-blood flex items-center gap-1">🔥 Agr.</span>
                      </div>

                      <div className="space-y-1.5">
                        {spec.penaltyLabels.map((rowLabel, rIdx) => {
                          const isNormalFilled = sector.normal > rIdx;
                          const isLetalFilled = sector.letal > rIdx;
                          const isAgravadoFilled = sector.agravado > rIdx;

                          return (
                            <div
                              key={rIdx}
                              className="grid grid-cols-[50px_1fr_1fr_1fr] items-center justify-items-center"
                            >
                              <span
                                className={`justify-self-start pl-1 font-mono text-[11px] font-bold ${
                                  rowLabel === "X"
                                    ? isNormalFilled || isLetalFilled || isAgravadoFilled
                                      ? "text-red-500 font-black animate-pulse"
                                      : "text-noir-text-muted"
                                    : rowLabel !== "0"
                                    ? isNormalFilled || isLetalFilled || isAgravadoFilled
                                      ? "text-amber-300"
                                      : "text-noir-text-muted"
                                    : "text-noir-text-muted"
                                }`}
                              >
                                {rowLabel}
                              </span>

                              {/* Contusivo */}
                              <button
                                type="button"
                                onClick={() => handleToggleDot(selectedSector, "normal", rIdx)}
                                disabled={disabled}
                                title={`Contusivo [${rIdx + 1}]`}
                                className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center font-mono text-[9px] font-black transition-all ${
                                  disabled ? "cursor-default" : "cursor-pointer"
                                } ${
                                  isNormalFilled
                                    ? "bg-amber-600 border-amber-400 text-white shadow-[0_0_6px_#d97706]"
                                    : "border-white/10 bg-black/40 hover:border-amber-400"
                                }`}
                              >
                                {isNormalFilled ? "/" : ""}
                              </button>

                              {/* Letal */}
                              <button
                                type="button"
                                onClick={() => handleToggleDot(selectedSector, "letal", rIdx)}
                                disabled={disabled}
                                title={`Letal [${rIdx + 1}]`}
                                className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center font-mono text-[9px] font-black transition-all ${
                                  disabled ? "cursor-default" : "cursor-pointer"
                                } ${
                                  isLetalFilled
                                    ? "bg-red-600 border-red-400 text-white shadow-[0_0_8px_#dc2626]"
                                    : "border-white/10 bg-black/40 hover:border-red-400"
                                }`}
                              >
                                {isLetalFilled ? "✕" : ""}
                              </button>

                              {/* Agravado */}
                              <button
                                type="button"
                                onClick={() => handleToggleDot(selectedSector, "agravado", rIdx)}
                                disabled={disabled}
                                title={`Agravado [${rIdx + 1}]`}
                                className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center font-mono text-[9px] font-black transition-all ${
                                  disabled ? "cursor-default" : "cursor-pointer"
                                } ${
                                  isAgravadoFilled
                                    ? "bg-gradient-to-tr from-purple-800 to-crimson-blood border-red-400 text-white shadow-[0_0_10px_#ef4444] animate-pulse"
                                    : "border-white/10 bg-black/40 hover:border-purple-400"
                                }`}
                              >
                                {isAgravadoFilled ? "✦" : ""}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Ações do Membro */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleQuickHeal(selectedSector)}
                      disabled={disabled || !hasDamage || currentBlood < 1}
                      className="w-full py-2 bg-crimson-dark hover:bg-crimson-blood border border-crimson-blood text-white font-condensed font-bold text-[12px] uppercase tracking-wider rounded-xs transition-all shadow-[0_0_10px_rgba(200,36,52,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>🩸</span>
                      <span>Curar Ferimento (1 Vitæ)</span>
                    </button>
                    <div className="flex justify-between items-center text-[10px] text-noir-text-muted px-1">
                      <span>Clique na bolinha para marcar/desmarcar</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSector(null)}
                        className="hover:text-white underline cursor-pointer"
                      >
                        Fechar foco
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
