"use client";

import React, { useState } from "react";
import type { RegrasDeOuroDisciplina, SubNivelDisciplina } from "@/types/systems/regrasDeOuro";

interface DisciplinesTreeProps {
  disciplinas: RegrasDeOuroDisciplina[];
  onChangeDisciplinas: (disciplinas: RegrasDeOuroDisciplina[]) => void;
  disabled?: boolean;
}

const CANONICAL_DISCIPLINE_NAMES = [
  "Animalismo",
  "Auspícios",
  "Celeridade / Rapidez",
  "Demência",
  "Dominação",
  "Fortitude",
  "Metamorfose / Proteísmo",
  "Necromancia",
  "Ofuscação",
  "Potência",
  "Presença",
  "Quimerismo",
  "Quietude",
  "Serpentis",
  "Taumaturgia",
  "Tenebrosidade",
  "Vicissitude",
  "Visceratika",
];

export default function DisciplinesTree({
  disciplinas,
  onChangeDisciplinas,
  disabled = false,
}: DisciplinesTreeProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDiscName, setNewDiscName] = useState(CANONICAL_DISCIPLINE_NAMES[0]);
  const [newDiscLevel, setNewDiscLevel] = useState(1);
  const [expandedDiscId, setExpandedDiscId] = useState<string | null>(null);

  const handleAddDiscipline = () => {
    if (!newDiscName.trim()) return;
    const newEntry: RegrasDeOuroDisciplina = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `disc-${Date.now()}`,
      nome: newDiscName.trim(),
      nivel: newDiscLevel,
      subNiveisAtivos: generateDefaultSubLevels(newDiscLevel),
      descricao: `Poderes arcanos de ${newDiscName.trim()}.`,
    };
    onChangeDisciplinas([...disciplinas, newEntry]);
    setIsAddModalOpen(false);
  };

  const handleUpdateLevel = (id: string, newLevel: number) => {
    onChangeDisciplinas(
      disciplinas.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            nivel: newLevel,
            subNiveisAtivos: generateDefaultSubLevels(newLevel),
          };
        }
        return d;
      })
    );
  };

  const handleRemoveDiscipline = (id: string) => {
    onChangeDisciplinas(disciplinas.filter((d) => d.id !== id));
  };

  const generateDefaultSubLevels = (level: number): SubNivelDisciplina[] => {
    const list: SubNivelDisciplina[] = [];
    for (let main = 1; main <= level; main++) {
      list.push({
        codigo: `${main}.0`,
        nome: `Poder Fundamental Nível ${main}`,
        descricao: `Efeito primário do círculo ${main}.`,
        ativo: true,
      });
      // Sub-níveis automáticos conforme manual Regras de Ouro 2.0
      list.push({
        codigo: `${main}.1`,
        nome: `Aprimoramento ${main}.1`,
        descricao: `Evolução técnica passiva desbloqueada sem custo extra de XP.`,
        ativo: true,
      });
      if (main >= 2) {
        list.push({
          codigo: `${main}.2`,
          nome: `Aprimoramento ${main}.2`,
          descricao: `Refinamento secundário disponível automaticamente.`,
          ativo: true,
        });
      }
    }
    return list;
  };

  return (
    <div className="bg-bg-card/70 border border-white/10 rounded-sm p-4 relative shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
        <div>
          <h3 className="text-sm font-gothic tracking-widest text-blood-red uppercase flex items-center gap-2">
            <span>Disciplinas & Círculos de Sangue</span>
            <span className="text-[10px] font-data text-text-dim font-normal lowercase tracking-normal">
              (Sub-níveis N.x ativam automaticamente ao evoluir)
            </span>
          </h3>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsAddModalOpen(true)}
          className="px-2.5 py-1 bg-blood-red/20 hover:bg-blood-red text-white border border-blood-red/40 rounded-xs text-[10px] uppercase font-data font-semibold tracking-wider transition-all cursor-pointer disabled:opacity-50"
        >
          + Aprender Disciplina
        </button>
      </div>

      {/* Lista de Disciplinas */}
      {disciplinas.length === 0 ? (
        <div
          onClick={() => !disabled && setIsAddModalOpen(true)}
          className="p-6 border border-dashed border-white/10 rounded-xs text-center cursor-pointer hover:border-blood-red/40 transition-colors"
        >
          <p className="text-xs text-text-muted font-reading">
            Nenhuma disciplina manifestada. Clique aqui para canalizar o poder do sangue de Caim.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {disciplinas.map((disc) => {
            const isExpanded = expandedDiscId === disc.id;
            return (
              <div
                key={disc.id}
                className="p-3 bg-bg-input/40 border border-white/10 rounded-sm hover:border-blood-red/40 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div
                    className="cursor-pointer select-none flex items-center gap-2"
                    onClick={() => setExpandedDiscId(isExpanded ? null : disc.id)}
                  >
                    <span className="text-xs text-text-dim transition-transform duration-200">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                    <span className="text-sm font-gothic tracking-wider text-text-primary uppercase font-bold">
                      {disc.nome}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Dots de Nível (1 a 5) */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleUpdateLevel(disc.id, lvl)}
                          className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                            disc.nivel >= lvl
                              ? "bg-blood-red border-blood-red shadow-[0_0_5px_rgba(200,36,52,0.5)]"
                              : "bg-transparent border-white/20 hover:border-white/40"
                          } disabled:cursor-not-allowed`}
                          title={`Nível ${lvl}`}
                        />
                      ))}
                      <span className="ml-1 text-xs font-mono text-blood-red font-bold">
                        Nív. {disc.nivel}
                      </span>
                    </div>

                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDiscipline(disc.id)}
                        className="text-text-dim hover:text-hunger-red text-xs font-bold cursor-pointer transition-colors px-1"
                        title="Esquecer Disciplina"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-níveis e Detalhes Expansíveis */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/5 space-y-2 animate-fade-in">
                    <span className="text-[10px] uppercase font-data tracking-widest text-gold-accent block">
                      Sub-Níveis e Aprimoramentos Ativos (Sem custo extra de XP):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {(disc.subNiveisAtivos || []).map((sub: SubNivelDisciplina) => (
                        <div
                          key={sub.codigo}
                          className="p-2 bg-black/40 border border-white/5 rounded-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-blood-red">
                              [{sub.codigo}]
                            </span>
                            <span className="text-[8px] font-data uppercase tracking-wider text-green-400 bg-green-950/40 px-1 py-0.2 rounded-2xs border border-green-500/30">
                              Ativo
                            </span>
                          </div>
                          <div className="text-xs font-data font-semibold text-text-primary">
                            {sub.nome}
                          </div>
                          <p className="text-[9px] text-text-muted font-reading leading-tight">
                            {sub.descricao}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Adicionar Disciplina */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            className="w-full max-w-md bg-bg-card border border-blood-red/40 rounded-sm p-6 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base"
            >
              ✕
            </button>

            <h4 className="text-lg font-gothic tracking-widest text-blood-red uppercase pb-2 border-b border-white/5 mb-4">
              Despertar Disciplina
            </h4>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Disciplina Canônica
                </label>
                <select
                  value={newDiscName}
                  onChange={(e) => setNewDiscName(e.target.value)}
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-blood-red transition-colors"
                >
                  {CANONICAL_DISCIPLINE_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Nível Inicial (1 a 5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewDiscLevel(lvl)}
                      className={`flex-1 py-1.5 rounded-xs border text-xs font-mono font-bold transition-all cursor-pointer ${
                        newDiscLevel === lvl
                          ? "bg-blood-red/30 border-blood-red text-white"
                          : "bg-bg-input border-white/10 text-text-muted"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 rounded-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddDiscipline}
                  className="px-4 py-1.5 text-xs uppercase font-data font-semibold bg-blood-red hover:bg-red-800 text-white rounded-xs transition-colors cursor-pointer"
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
