"use client";

import React, { useState } from "react";
import type { RegrasDeOuroBesta, RegrasDeOuroTrilha, FlageloEntry } from "@/types/systems/regrasDeOuro";
import { PANIC_TABLE } from "@/lib/systems/regrasDeOuro/constants";

interface BestaPanelProps {
  besta: RegrasDeOuroBesta;
  trilha: RegrasDeOuroTrilha;
  onChangeBesta: (besta: RegrasDeOuroBesta) => void;
  onChangeTrilha: (trilha: RegrasDeOuroTrilha) => void;
  disabled?: boolean;
}

export default function BestaPanel({
  besta,
  trilha,
  onChangeBesta,
  onChangeTrilha,
  disabled = false,
}: BestaPanelProps) {
  const [panicRollResult, setPanicRollResult] = useState<{
    roll: number;
    effect: string;
    actionLostTurns?: number;
    isFaint?: boolean;
    peculiaridade?: boolean;
  } | null>(null);

  const [isAddFlageloOpen, setIsAddFlageloOpen] = useState(false);
  const [newFlageloNome, setNewFlageloNome] = useState("");
  const [newFlageloDesc, setNewFlageloDesc] = useState("");

  // Rolar teste de Pânico / Autocontrole
  const handleRollPanic = () => {
    // d10 simples + modificador ou d20 conforme mecânica de pânico
    const roll = Math.floor(Math.random() * 20) + 1;
    // Encontrar o efeito na tabela correspondente ao roll
    const matched = PANIC_TABLE.find((entry) => roll >= entry.minRoll) || PANIC_TABLE[PANIC_TABLE.length - 1];
    setPanicRollResult({
      roll,
      effect: matched.effect,
      actionLostTurns: matched.actionLostTurns,
      isFaint: matched.isFaint,
      peculiaridade: matched.peculiaridade,
    });
  };

  const handleAddFlagelo = () => {
    if (!newFlageloNome.trim()) return;
    const newEntry: FlageloEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `flag-${Date.now()}`,
      nome: newFlageloNome.trim(),
      descricao: newFlageloDesc.trim() || "Flagelo comportamental da Besta.",
    };
    onChangeBesta({
      ...besta,
      flagelos: [...(besta.flagelos || []), newEntry],
    });
    setNewFlageloNome("");
    setNewFlageloDesc("");
    setIsAddFlageloOpen(false);
  };

  const handleRemoveFlagelo = (id: string) => {
    onChangeBesta({
      ...besta,
      flagelos: (besta.flagelos || []).filter((f: FlageloEntry) => f.id !== id),
    });
  };

  const maxAngstia = Math.max(1, 10 - trilha.nivel);

  return (
    <div className="space-y-4">
      {/* Grade com Trilha da Sabedoria e Medidores da Besta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Painel da Trilha de Sabedoria */}
        <div className="bg-bg-card/70 border border-gold-accent/30 rounded-sm p-4 relative shadow-[0_4px_16px_rgba(212,175,55,0.05)]">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gold-accent/20">
            <div>
              <h3 className="text-sm font-gothic tracking-widest text-gold-accent uppercase flex items-center gap-2">
                <span>{trilha.nome || "Trilha de Sabedoria"}</span>
              </h3>
              <p className="text-[9px] text-text-dim font-reading">
                A âncora moral que separa o monstro do predador lúcido.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-gold-accent">
                Nível {trilha.nivel}
              </span>
            </div>
          </div>

          {/* Dots da Trilha (1 a 10) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-data tracking-wider text-text-muted">
                Grau de Iluminação Moral
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChangeTrilha({ ...trilha, nivel: num })}
                    className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                      trilha.nivel >= num
                        ? "bg-gold-accent border-gold-accent shadow-[0_0_5px_rgba(255,216,77,0.4)]"
                        : "bg-transparent border-white/20 hover:border-white/40"
                    } disabled:cursor-not-allowed`}
                    title={`Trilha nível ${num}`}
                  />
                ))}
              </div>
            </div>

            {/* Pecado do Nível Atual */}
            <div className="p-2.5 bg-black/30 border border-white/5 rounded-xs mt-3">
              <span className="text-[9px] uppercase font-data tracking-widest text-gold-accent block mb-1">
                Hierarquia de Pecados (Nível {trilha.nivel})
              </span>
              <p className="text-xs text-text-primary font-reading italic">
                {trilha.pecados?.[trilha.nivel - 1] || "Transgredir a dignidade moral e entregar-se aos impulsos primais."}
              </p>
            </div>
          </div>
        </div>

        {/* Medidores da Besta: Ângstia & Líbido */}
        <div className="bg-bg-card/70 border border-blood-red/30 rounded-sm p-4 relative shadow-[0_4px_16px_rgba(200,36,52,0.05)]">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-blood-red/20">
            <div>
              <h3 className="text-sm font-gothic tracking-widest text-blood-red uppercase flex items-center gap-2">
                <span>Guia da Besta</span>
                <span className="text-[10px] font-mono text-text-dim">Nível {besta.nivel}</span>
              </h3>
              <p className="text-[9px] text-text-dim font-reading">
                Ângstia reprimida e volúpia instintiva do predador interior.
              </p>
            </div>

            <button
              type="button"
              disabled={disabled}
              onClick={handleRollPanic}
              className="px-2.5 py-1 bg-hunger-red/20 hover:bg-hunger-red/40 text-hunger-red border border-hunger-red/40 rounded-xs text-[10px] uppercase font-data font-bold tracking-wider transition-colors cursor-pointer shadow-[0_0_6px_rgba(230,36,36,0.2)] disabled:opacity-50"
            >
              🎲 Teste de Pânico
            </button>
          </div>

          <div className="space-y-3">
            {/* Medidor de Ângstia */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] uppercase font-data tracking-wider text-text-muted">
                  Ângstia ({besta.angstia} / {maxAngstia})
                </span>
                <span className="text-[9px] text-text-dim font-reading">
                  Limite: 10 - Trilha
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: maxAngstia }).map((_, idx) => {
                  const filled = besta.angstia > idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        const next = idx + 1;
                        onChangeBesta({
                          ...besta,
                          angstia: besta.angstia === next ? idx : next,
                        });
                      }}
                      className={`flex-1 h-3 rounded-2xs border transition-all cursor-pointer ${
                        filled
                          ? "bg-blood-red border-blood-red shadow-[0_0_5px_rgba(200,36,52,0.5)]"
                          : "bg-transparent border-white/20 hover:border-white/40"
                      }`}
                      title={`Ângstia ${idx + 1}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Medidor de Líbido */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] uppercase font-data tracking-wider text-text-muted">
                  Líbido ({besta.libido} / 10)
                </span>
                <span className="text-[9px] text-text-dim font-reading">
                  Fúria & Predação Carnal
                </span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const filled = besta.libido > idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        const next = idx + 1;
                        onChangeBesta({
                          ...besta,
                          libido: besta.libido === next ? idx : next,
                        });
                      }}
                      className={`flex-1 h-3 rounded-2xs border transition-all cursor-pointer ${
                        filled
                          ? "bg-purple-600 border-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.4)]"
                          : "bg-transparent border-white/20 hover:border-white/40"
                      }`}
                      title={`Líbido ${idx + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resultado do Teste de Pânico */}
      {panicRollResult && (
        <div className="p-3 bg-burgundy/20 border border-blood-red/40 rounded-sm flex items-center justify-between animate-fade-in">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-xs bg-blood-red text-white text-[10px] font-mono font-bold">
                Resultado: {panicRollResult.roll}
              </span>
              <span className="text-xs uppercase font-data font-bold text-blood-red tracking-wider">
                Verificação de Pânico
              </span>
            </div>
            <p className="text-xs text-text-primary font-reading mt-1">
              {panicRollResult.effect}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPanicRollResult(null)}
            className="text-text-dim hover:text-white text-xs cursor-pointer px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Flagelos Comportamentais da Besta */}
      <div className="bg-bg-card/70 border border-white/10 rounded-sm p-4 relative">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
          <div>
            <h4 className="text-xs font-gothic tracking-widest text-text-primary uppercase flex items-center gap-2">
              <span>Flagelos da Besta</span>
              <span className="text-[10px] font-data text-text-dim font-normal lowercase tracking-normal">
                (Compulsões, obsessões e cicatrizes da alma)
              </span>
            </h4>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsAddFlageloOpen(true)}
            className="px-2.5 py-0.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/10 rounded-xs text-[10px] uppercase font-data tracking-wider transition-colors cursor-pointer"
          >
            + Adicionar Flagelo
          </button>
        </div>

        {(!besta.flagelos || besta.flagelos.length === 0) ? (
          <p className="text-xs text-text-dim font-reading italic">
            Nenhum flagelo ativo. A alma do vampiro ainda não cedeu aos rompantes da Besta.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(besta.flagelos || []).map((f: FlageloEntry) => (
              <div
                key={f.id}
                className="p-2.5 rounded-xs border border-blood-red/20 bg-bg-input/50 flex justify-between items-start gap-2"
              >
                <div>
                  <h5 className="text-xs font-data font-bold text-blood-red uppercase tracking-wider">
                    {f.nome}
                  </h5>
                  <p className="text-[10px] text-text-muted font-reading mt-0.5 leading-relaxed">
                    {f.descricao}
                  </p>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFlagelo(f.id)}
                    className="text-text-dim hover:text-hunger-red text-xs font-bold cursor-pointer transition-colors"
                    title="Remover Flagelo"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Adicionar Flagelo */}
      {isAddFlageloOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            className="w-full max-w-md bg-bg-card border border-blood-red/40 rounded-sm p-6 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddFlageloOpen(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base"
            >
              ✕
            </button>

            <h4 className="text-lg font-gothic tracking-widest text-blood-red uppercase pb-2 border-b border-white/5 mb-4">
              Manifestar Flagelo
            </h4>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Nome do Flagelo
                </label>
                <input
                  type="text"
                  value={newFlageloNome}
                  onChange={(e) => setNewFlageloNome(e.target.value)}
                  placeholder="Ex: Descontrole Emocional, A Pele do Lobo..."
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-blood-red transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Efeito / Descrição
                </label>
                <textarea
                  value={newFlageloDesc}
                  onChange={(e) => setNewFlageloDesc(e.target.value)}
                  placeholder="Descreva as consequências do flagelo quando a Besta assume o controle..."
                  rows={3}
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-blood-red transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddFlageloOpen(false)}
                  className="px-3 py-1.5 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 rounded-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!newFlageloNome.trim()}
                  onClick={handleAddFlagelo}
                  className="px-4 py-1.5 text-xs uppercase font-data font-semibold bg-blood-red hover:bg-red-800 text-white rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
