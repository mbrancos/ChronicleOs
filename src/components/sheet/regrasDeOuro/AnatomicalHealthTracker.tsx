"use client";

import React, { useState } from "react";
import type { AnatomicalVitality, BodySectorId } from "@/types/systems/regrasDeOuro";
import { applyAnatomicalDamage, healSectorDamage } from "@/lib/systems/regrasDeOuro/rules";
import GothicSelect from "@/components/common/GothicSelect";

interface AnatomicalHealthTrackerProps {
  vitality: AnatomicalVitality;
  currentBlood: number;
  maxBlood: number;
  onChangeVitality: (newVitality: AnatomicalVitality) => void;
  onChangeBlood?: (newBlood: number) => void;
  disabled?: boolean;
}

interface SectorMeta {
  id: BodySectorId;
  label: string;
  isVital: boolean;
  totalBoxes: number;
  description: string;
}

const SECTORS_META: SectorMeta[] = [
  { id: "cabeca", label: "Cabeça", isVital: true, totalBoxes: 3, description: "Vital. Afeta paradas mentais e físicas." },
  { id: "pescoco", label: "Pescoço", isVital: true, totalBoxes: 2, description: "Vital. Risco de asfixia e decapitação." },
  { id: "torax", label: "Tórax", isVital: true, totalBoxes: 4, description: "Vital. Penalidade afeta TODAS ações físicas." },
  { id: "braco_d", label: "Braço D.", isVital: false, totalBoxes: 3, description: "Penalidade em ações com o braço direito." },
  { id: "braco_e", label: "Braço E.", isVital: false, totalBoxes: 3, description: "Penalidade em ações com o braço esquerdo." },
  { id: "mao_d", label: "Mão D.", isVital: false, totalBoxes: 2, description: "Manuseio fino e empunhadura direita." },
  { id: "mao_e", label: "Mão E.", isVital: false, totalBoxes: 2, description: "Manuseio fino e empunhadura esquerda." },
  { id: "perna_d", label: "Perna D.", isVital: false, totalBoxes: 4, description: "Mobilidade, salto e locomoção." },
  { id: "perna_e", label: "Perna E.", isVital: false, totalBoxes: 4, description: "Mobilidade, salto e locomoção." },
];

export default function AnatomicalHealthTracker({
  vitality,
  currentBlood,
  maxBlood,
  onChangeVitality,
  onChangeBlood,
  disabled = false,
}: AnatomicalHealthTrackerProps) {
  // Modal de dano
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<BodySectorId>("torax");
  const [damageType, setDamageType] = useState<"normal" | "letal" | "agravado">("normal");
  const [damageAmount, setDamageAmount] = useState<number>(1);

  // Manipulação de aplicação de dano
  const handleApplyDamage = () => {
    const updated = applyAnatomicalDamage(vitality, selectedSector, damageType, damageAmount);
    onChangeVitality(updated);
    setIsDamageModalOpen(false);
    setDamageAmount(1);
  };

  // Manipulação de cura
  const handleHeal = (sectorId: BodySectorId, healType: "normal_all" | "letal_one" | "agravado_one") => {
    if (disabled) return;
    const { vitality: updated, vitaeCost } = healSectorDamage(vitality, sectorId, healType);
    if (vitaeCost > 0 && onChangeBlood && currentBlood >= vitaeCost) {
      onChangeBlood(currentBlood - vitaeCost);
    }
    onChangeVitality(updated);
  };

  // Renderizar as caixas de um setor
  const renderSectorBoxes = (sectorId: BodySectorId) => {
    const sector = vitality[sectorId] || { normal: 0, letal: 0, agravado: 0, maxNormal: 3, penalty: 0 };
    const meta = SECTORS_META.find((s) => s.id === sectorId)!;
    const maxBoxes = meta.totalBoxes;

    // Constrói array com os estados das caixas
    const boxes: Array<"vazio" | "normal" | "letal" | "agravado"> = [];
    for (let i = 0; i < sector.agravado && boxes.length < maxBoxes; i++) boxes.push("agravado");
    for (let i = 0; i < sector.letal && boxes.length < maxBoxes; i++) boxes.push("letal");
    for (let i = 0; i < sector.normal && boxes.length < maxBoxes; i++) boxes.push("normal");
    while (boxes.length < maxBoxes) boxes.push("vazio");

    return (
      <div className="flex items-center gap-1">
        {boxes.map((b, idx) => (
          <div
            key={idx}
            className={`w-5 h-5 rounded-xs border text-xs font-mono font-bold flex items-center justify-center transition-all ${
              b === "agravado"
                ? "bg-purple-950/80 border-purple-500 text-purple-300 shadow-[0_0_6px_rgba(168,85,247,0.4)]"
                : b === "letal"
                ? "bg-blood-red/80 border-blood-red text-white shadow-[0_0_6px_rgba(200,36,52,0.4)]"
                : b === "normal"
                ? "bg-amber-950/70 border-amber-500 text-amber-300 shadow-[0_0_4px_rgba(245,158,11,0.3)]"
                : "bg-bg-input/60 border-white/20 text-transparent hover:border-white/40"
            }`}
            title={`Caixa ${idx + 1}: ${b.toUpperCase()}`}
          >
            {b === "agravado" ? "✦" : b === "letal" ? "✕" : b === "normal" ? "/" : ""}
          </div>
        ))}
      </div>
    );
  };

  const renderSectorCard = (sectorId: BodySectorId) => {
    const sector = vitality[sectorId];
    if (!sector) return null;
    const meta = SECTORS_META.find((s) => s.id === sectorId)!;
    const hasDamage = sector.normal > 0 || sector.letal > 0 || sector.agravado > 0;

    return (
      <div
        key={sectorId}
        className={`p-3 rounded-sm border transition-all ${
          meta.isVital
            ? "bg-bg-card/90 border-blood-red/40 hover:border-blood-red/70 shadow-[0_2px_12px_rgba(200,36,52,0.06)]"
            : "bg-bg-card/70 border-white/10 hover:border-white/20"
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-data uppercase tracking-wider font-bold text-text-primary">
                {meta.label}
              </span>
              {meta.isVital && (
                <span className="px-1 py-0.2 bg-blood-red/20 text-blood-red border border-blood-red/40 rounded-2xs text-[8px] uppercase font-bold tracking-widest">
                  Vital
                </span>
              )}
            </div>
            <p className="text-[9px] text-text-dim font-reading leading-tight mt-0.5">
              {meta.description}
            </p>
          </div>

          {/* Penalidade atual e Ação Rápida */}
          <div className="text-right flex items-center gap-1.5">
            <span
              className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-xs ${
                sector.penalty < 0
                  ? "bg-hunger-red/20 text-hunger-red border border-hunger-red/40"
                  : "text-text-dim"
              }`}
            >
              {sector.penalty < 0 ? `${sector.penalty} dados` : "Íntegro"}
            </span>

            {!disabled && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSector(sectorId);
                  setIsDamageModalOpen(true);
                }}
                className="text-[9px] px-1.5 py-0.5 rounded-2xs border border-white/10 hover:border-hunger-red/50 hover:bg-hunger-red/10 text-text-dim hover:text-white transition-colors cursor-pointer"
                title={`Registrar dano em ${meta.label}`}
              >
                + Dano
              </button>
            )}
          </div>
        </div>

        {/* Caixas de Dano */}
        <div className="flex justify-between items-center pt-1 border-t border-white/5">
          {renderSectorBoxes(sectorId)}

          {/* Ações de Cura Rápida */}
          {hasDamage && !disabled && (
            <div className="flex gap-1">
              {sector.normal > 0 && (
                <button
                  type="button"
                  onClick={() => handleHeal(sectorId, "normal_all")}
                  className="px-1.5 py-0.5 bg-amber-950/40 text-amber-300 hover:bg-amber-900 border border-amber-600/40 rounded-2xs text-[9px] font-data uppercase tracking-wider cursor-pointer transition-colors"
                  title="Curar todo dano Normal (Custo: 1 Sangue)"
                >
                  Curar N
                </button>
              )}
              {sector.letal > 0 && (
                <button
                  type="button"
                  onClick={() => handleHeal(sectorId, "letal_one")}
                  className="px-1.5 py-0.5 bg-blood-red/30 text-blood-red hover:bg-blood-red/50 border border-blood-red/40 rounded-2xs text-[9px] font-data uppercase tracking-wider cursor-pointer transition-colors"
                  title="Curar 1 ponto Letal (Custo: 1 Sangue)"
                >
                  Curar L
                </button>
              )}
              {sector.agravado > 0 && (
                <button
                  type="button"
                  onClick={() => handleHeal(sectorId, "agravado_one")}
                  className="px-1.5 py-0.5 bg-purple-950/40 text-purple-300 hover:bg-purple-900 border border-purple-600/40 rounded-2xs text-[9px] font-data uppercase tracking-wider cursor-pointer transition-colors"
                  title="Curar 1 ponto Agravado (Custo: 1 Sangue + Repouso)"
                >
                  Curar A
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Barra de Topo com Ações e Resumo de Sangue */}
      <div className="flex justify-between items-center p-3 bg-bg-card/60 border border-white/10 rounded-sm">
        <div>
          <h3 className="text-sm font-gothic tracking-widest text-gold-accent uppercase flex items-center gap-2">
            <span>Vitalidade Anatômica</span>
            <span className="text-[10px] font-data text-text-dim lowercase tracking-normal">
              (9 setores corporais com transbordamento)
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Legenda de Tipos de Dano */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-data text-text-muted mr-2">
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-xs border border-amber-500 bg-amber-950/70 text-amber-300 font-mono text-[9px] flex items-center justify-center">/</span> Normal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-xs border border-blood-red bg-blood-red/80 text-white font-mono text-[9px] flex items-center justify-center">✕</span> Letal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-xs border border-purple-500 bg-purple-950/80 text-purple-300 font-mono text-[9px] flex items-center justify-center">✦</span> Agravado
            </span>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsDamageModalOpen(true)}
            className="px-3 py-1 bg-hunger-red/20 hover:bg-hunger-red/40 text-hunger-red border border-hunger-red/40 rounded-xs text-[10px] uppercase font-data font-semibold tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_8px_rgba(230,36,36,0.15)]"
          >
            + Sofrer Dano
          </button>
        </div>
      </div>

      {/* Grid Anatômico Estruturado */}
      <div className="space-y-3">
        {/* Setores Vitais: Cabeça, Pescoço, Tórax */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {renderSectorCard("cabeca")}
          {renderSectorCard("pescoco")}
          {renderSectorCard("torax")}
        </div>

        {/* Membros Superiores: Braços e Mãos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {renderSectorCard("braco_d")}
          {renderSectorCard("mao_d")}
          {renderSectorCard("braco_e")}
          {renderSectorCard("mao_e")}
        </div>

        {/* Membros Inferiores: Pernas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {renderSectorCard("perna_d")}
          {renderSectorCard("perna_e")}
        </div>
      </div>

      {/* Modal de Aplicação de Dano */}
      {isDamageModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsDamageModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-bg-card border border-hunger-red/40 rounded-sm p-6 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsDamageModalOpen(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base w-8 h-8 flex items-center justify-center rounded-xs hover:bg-white/10"
            >
              ✕
            </button>

            <h4 className="text-lg font-gothic tracking-widest text-hunger-red uppercase pb-2 border-b border-white/5 mb-4">
              Registrar Impacto / Dano
            </h4>

            <div className="space-y-4">
              {/* Setor Alvo */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Setor Corporal Atingido
                </label>
                <GothicSelect
                  variant="blood"
                  value={selectedSector}
                  onChange={(val) => setSelectedSector(val as BodySectorId)}
                  options={SECTORS_META.map((s) => ({
                    value: s.id,
                    label: `${s.label} ${s.isVital ? "(Vital)" : "(Não-vital)"}`,
                    description: s.description,
                    badge: s.isVital ? "VITAL" : undefined,
                  }))}
                />
              </div>

              {/* Tipo de Dano */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Gravidade do Dano
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDamageType("normal")}
                    className={`p-2 rounded-xs border text-center transition-all cursor-pointer ${
                      damageType === "normal"
                        ? "bg-amber-950/40 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                        : "bg-bg-input border-white/10 text-text-muted"
                    }`}
                  >
                    <div className="text-xs font-bold uppercase font-data">Normal</div>
                    <div className="text-[9px] text-text-dim">Contusão / Socos</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDamageType("letal")}
                    className={`p-2 rounded-xs border text-center transition-all cursor-pointer ${
                      damageType === "letal"
                        ? "bg-blood-red/30 border-blood-red text-white shadow-[0_0_8px_rgba(200,36,52,0.3)]"
                        : "bg-bg-input border-white/10 text-text-muted"
                    }`}
                  >
                    <div className="text-xs font-bold uppercase font-data">Letal</div>
                    <div className="text-[9px] text-text-dim">Armas / Balas</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDamageType("agravado")}
                    className={`p-2 rounded-xs border text-center transition-all cursor-pointer ${
                      damageType === "agravado"
                        ? "bg-purple-950/50 border-purple-500 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                        : "bg-bg-input border-white/10 text-text-muted"
                    }`}
                  >
                    <div className="text-xs font-bold uppercase font-data">Agravado</div>
                    <div className="text-[9px] text-text-dim">Fogo / Luz Solar</div>
                  </button>
                </div>
              </div>

              {/* Quantidade */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Pontos de Dano
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={damageAmount}
                    onChange={(e) => setDamageAmount(Number(e.target.value))}
                    className="flex-1 accent-hunger-red cursor-pointer"
                  />
                  <span className="text-base font-mono font-bold text-white w-6 text-center">
                    {damageAmount}
                  </span>
                </div>
                <p className="text-[9px] text-text-dim font-reading">
                  O dano excedente transbordará automaticamente para Letal e Agravado conforme as Regras de Ouro.
                </p>
              </div>

              {/* Ações */}
              <div className="flex justify-end space-x-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsDamageModalOpen(false)}
                  className="px-3 py-1.5 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 rounded-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyDamage}
                  className="px-4 py-1.5 text-xs uppercase font-data font-semibold bg-hunger-red hover:bg-red-800 text-white rounded-xs transition-colors cursor-pointer shadow-[0_0_8px_rgba(230,36,36,0.3)]"
                >
                  Aplicar Dano
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
