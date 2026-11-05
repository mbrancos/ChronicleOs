"use client";

import React, { useState } from "react";
import type { RegrasDeOuroDisciplina, SubNivelDisciplina } from "@/types/systems/regrasDeOuro";
import GothicSelect from "@/components/common/GothicSelect";

interface DisciplinesTreeProps {
  disciplinas: RegrasDeOuroDisciplina[];
  onChangeDisciplinas: (disciplinas: RegrasDeOuroDisciplina[]) => void;
  disabled?: boolean;
}

interface DisciplineMeta {
  nome: string;
  resumo: string;
}

const CANONICAL_DISCIPLINE_METAS: DisciplineMeta[] = [
  { nome: "Animalismo", resumo: "Afinidade sobrenatural com feras e controle da Besta em si e em outros." },
  { nome: "Auspícios", resumo: "Sentidos aprimorados, percepção de auras, telepatia e clarividência." },
  { nome: "Celeridade / Rapidez", resumo: "Velocidade sobre-humana, reflexos relâmpago e ações adicionais." },
  { nome: "Demência", resumo: "Canalização da loucura mística para estilhaçar a psique de alvos." },
  { nome: "Dominação", resumo: "Controle mental absoluto e imposição irresistível da Vontade." },
  { nome: "Fortitude", resumo: "Resistência física invulnerável e absorção de danos letais e agravados." },
  { nome: "Metamorfose / Proteísmo", resumo: "Metamorfose em garras, névoa, formas animais e fusão com a terra." },
  { nome: "Necromancia", resumo: "Domínio sobre o mundo dos mortos, espectros e travessia da mortalha." },
  { nome: "Obeah", resumo: "Arte mística Salubri de cura espiritual, restauração de almas e apaziguamento." },
  { nome: "Ofuscação", resumo: "Camuflagem mística, invisibilidade e apagamento da presença." },
  { nome: "Potência", resumo: "Força física colossal capaz de esmagar concreto e romper blindagens." },
  { nome: "Presença", resumo: "Magnetismo sobrenatural, fascinação irresistível, pavor e comoção." },
  { nome: "Quimerismo", resumo: "Criação de ilusões hipnóticas que enganam todos os sentidos." },
  { nome: "Quietude", resumo: "Silêncio mortal e alquimia letal do sangue dos Banu Haqim." },
  { nome: "Serpentis", resumo: "Feitiçaria ofídia dos Setitas: hipnose serpentina, escamas e mumificação." },
  { nome: "Taumaturgia", resumo: "Magia de sangue hermética dos Tremere com rituais arcanos e sendas." },
  { nome: "Tenebrosidade", resumo: "Manipulação e invocação da escuridão tangível do Abismo." },
  { nome: "Vicissitude", resumo: "Escultura e transmutação da carne e ossos próprios e alheios." },
  { nome: "Visceratika", resumo: "Afinidade lítea dos Gárgulas, fusão com alvenaria e couraça de pedra." },
];

export default function DisciplinesTree({
  disciplinas,
  onChangeDisciplinas,
  disabled = false,
}: DisciplinesTreeProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDisciplineName, setSelectedDisciplineName] = useState(CANONICAL_DISCIPLINE_METAS[0].nome);
  const [newDiscLevel, setNewDiscLevel] = useState(1);
  const [expandedDiscId, setExpandedDiscId] = useState<string | null>(null);

  const existingNames = new Set(disciplinas.map((d) => d.nome.toLowerCase()));

  const handleAddDiscipline = () => {
    if (!selectedDisciplineName.trim()) return;
    const meta = CANONICAL_DISCIPLINE_METAS.find((m) => m.nome === selectedDisciplineName);

    const newEntry: RegrasDeOuroDisciplina = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `disc-${Date.now()}`,
      nome: selectedDisciplineName.trim(),
      nivel: newDiscLevel,
      subNiveisAtivos: generateDefaultSubLevels(newDiscLevel),
      descricao: meta ? meta.resumo : `Poderes arcanos de ${selectedDisciplineName.trim()}.`,
    };

    onChangeDisciplinas([...disciplinas, newEntry]);
    setIsAddModalOpen(false);
  };

  const handleUpdateLevel = (id: string, newLevel: number) => {
    onChangeDisciplinas(
      disciplinas.map((d) => {
        if (d.id === id) {
          const clamped = Math.max(1, Math.min(5, newLevel));
          return {
            ...d,
            nivel: clamped,
            subNiveisAtivos: generateDefaultSubLevels(clamped),
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
        nome: `Poder Fundamental Círculo ${main}`,
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

  const currentSelectedMeta = CANONICAL_DISCIPLINE_METAS.find((m) => m.nome === selectedDisciplineName);

  return (
    <div className="bg-bg-card/70 border border-white/10 rounded-sm p-4 relative shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3 pb-2 border-b border-white/10">
        <div>
          <h3 className="text-sm font-gothic tracking-widest text-blood-red uppercase flex items-center gap-2">
            <span>Disciplinas & Círculos de Sangue</span>
            <span className="text-[10px] font-data text-text-dim font-normal lowercase tracking-normal">
              (Sub-níveis ativam automaticamente ao evoluir)
            </span>
          </h3>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            // Seleciona a primeira disciplina que ainda não foi adicionada
            const firstAvailable = CANONICAL_DISCIPLINE_METAS.find((m) => !existingNames.has(m.nome.toLowerCase()));
            if (firstAvailable) {
              setSelectedDisciplineName(firstAvailable.nome);
            }
            setIsAddModalOpen(true);
          }}
          className="px-3 py-1.5 bg-blood-red/20 hover:bg-blood-red text-white border border-blood-red/40 rounded-xs text-xs uppercase font-data font-semibold tracking-wider transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto min-h-[36px] flex items-center justify-center"
        >
          + Aprender Disciplina
        </button>
      </div>

      {/* Lista de Disciplinas */}
      {disciplinas.length === 0 ? (
        <div
          onClick={() => !disabled && setIsAddModalOpen(true)}
          className="p-8 border border-dashed border-white/10 rounded-xs text-center cursor-pointer hover:border-blood-red/40 transition-colors"
        >
          <p className="text-xs text-text-muted font-reading">
            Nenhuma disciplina manifestada. Toque aqui para canalizar o poder do sangue de Caim.
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div
                    className="cursor-pointer select-none flex items-center gap-2 flex-1"
                    onClick={() => setExpandedDiscId(isExpanded ? null : disc.id)}
                  >
                    <span className="text-xs text-text-dim transition-transform duration-200">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                    <span className="text-sm font-gothic tracking-wider text-text-primary uppercase font-bold">
                      {disc.nome}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    {/* Stepper + Bolinhas de Nível com Área de Toque Generosa (Mobile-Friendly) */}
                    <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-xs border border-white/5">
                      {/* Botão Decrementar */}
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleUpdateLevel(disc.id, disc.nivel - 1)}
                          disabled={disc.nivel <= 1}
                          className="w-6 h-6 flex items-center justify-center text-text-dim hover:text-white disabled:opacity-30 cursor-pointer font-mono text-xs rounded-2xs hover:bg-white/10 transition-colors"
                          title="Diminuir nível"
                        >
                          -
                        </button>
                      )}

                      {/* 5 Bolinhas Clicáveis com touch target expandido */}
                      {[1, 2, 3, 4, 5].map((lvl) => {
                        const filled = disc.nivel >= lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleUpdateLevel(disc.id, lvl)}
                            className="p-1 cursor-pointer flex items-center justify-center disabled:cursor-not-allowed"
                            title={`Nível ${lvl}`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full border transition-all block ${
                                filled
                                  ? "bg-blood-red border-blood-red shadow-[0_0_6px_rgba(200,36,52,0.6)]"
                                  : "bg-transparent border-white/20 hover:border-white/50"
                              }`}
                            />
                          </button>
                        );
                      })}

                      {/* Botão Incrementar */}
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleUpdateLevel(disc.id, disc.nivel + 1)}
                          disabled={disc.nivel >= 5}
                          className="w-6 h-6 flex items-center justify-center text-text-dim hover:text-white disabled:opacity-30 cursor-pointer font-mono text-xs rounded-2xs hover:bg-white/10 transition-colors"
                          title="Aumentar nível"
                        >
                          +
                        </button>
                      )}

                      <span className="ml-1 text-xs font-mono text-blood-red font-bold w-12 text-right">
                        Nív. {disc.nivel}
                      </span>
                    </div>

                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDiscipline(disc.id)}
                        className="text-text-dim hover:text-hunger-red text-sm font-bold cursor-pointer transition-colors p-1.5 hover:bg-white/5 rounded-xs"
                        title="Esquecer Disciplina"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-níveis e Detalhes Expansíveis */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/5 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-data tracking-widest text-gold-accent block">
                        Sub-Níveis e Aprimoramentos Ativos (Sem custo extra de XP):
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {(disc.subNiveisAtivos || []).map((sub: SubNivelDisciplina) => (
                        <div
                          key={sub.codigo}
                          className="p-2.5 bg-black/40 border border-white/5 rounded-xs space-y-1 hover:border-white/10 transition-colors"
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
                          <p className="text-[10px] text-text-muted font-reading leading-relaxed">
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

      {/* Modal Despertar Disciplina (Click-to-Select, Busca Instantânea, Sem bug de segurar botão) */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-bg-card border border-blood-red/40 rounded-sm p-6 relative shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base w-8 h-8 flex items-center justify-center rounded-xs hover:bg-white/10"
              title="Fechar"
            >
              ✕
            </button>

            <div className="pb-3 border-b border-white/10">
              <h4 className="text-lg font-gothic tracking-widest text-blood-red uppercase">
                Despertar Disciplina
              </h4>
              <p className="text-[11px] text-text-dim font-reading mt-0.5">
                Escolha a disciplina canônica para despertar os dons do Sangue.
              </p>
            </div>

            <div className="space-y-4">
              {/* Seletor Customizado Gótico com Busca e Click Único */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block mb-1">
                  Disciplina Canônica (19 Disciplinas Oficiais)
                </label>
                <GothicSelect
                  variant="blood"
                  searchable
                  value={selectedDisciplineName}
                  onChange={(val) => setSelectedDisciplineName(String(val))}
                  options={CANONICAL_DISCIPLINE_METAS.map((m) => {
                    const isAlreadyAdded = existingNames.has(m.nome.toLowerCase());
                    return {
                      value: m.nome,
                      label: m.nome,
                      description: m.resumo,
                      badge: isAlreadyAdded ? "Já manifestada" : undefined,
                    };
                  })}
                />

                {/* Card de Resumo da Disciplina Selecionada */}
                {currentSelectedMeta && (
                  <div className="mt-2.5 p-3 bg-black/40 border border-blood-red/20 rounded-xs">
                    <span className="text-[9px] uppercase font-data tracking-wider text-blood-red block font-bold">
                      Efeito e Natureza Arcana:
                    </span>
                    <p className="text-xs text-text-primary font-reading mt-0.5 leading-relaxed">
                      {currentSelectedMeta.resumo}
                    </p>
                  </div>
                )}
              </div>

              {/* Nível Inicial (1 a 5) com Touch Target Grande */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Nível Inicial (1 a 5 Círculos)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewDiscLevel(lvl)}
                      className={`h-11 rounded-xs border text-sm font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                        newDiscLevel === lvl
                          ? "bg-blood-red/30 border-blood-red text-white shadow-[0_0_10px_rgba(200,36,52,0.4)]"
                          : "bg-bg-input border-white/10 text-text-muted hover:border-white/30 hover:text-white"
                      }`}
                    >
                      <span>{lvl}</span>
                      <span className="text-[9px] font-data uppercase tracking-normal opacity-70">
                        {lvl === 1 ? "Início" : `Círculo ${lvl}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 hover:border-white/30 rounded-xs transition-colors cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddDiscipline}
                  className="px-5 py-2 text-xs uppercase font-data font-semibold bg-blood-red hover:bg-red-800 text-white rounded-xs transition-colors cursor-pointer shadow-[0_0_12px_rgba(200,36,52,0.4)] min-h-[40px] flex items-center justify-center gap-1.5"
                >
                  <span>Confirmar & Despertar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
