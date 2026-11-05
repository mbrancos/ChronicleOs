"use client";

import React, { useState, useEffect } from "react";
import type {
  RegrasDeOuroDisciplina,
  SubNivelDisciplina,
  RitualTaumaturgicoEntry,
} from "@/types/systems/regrasDeOuro";
import GothicSelect from "@/components/common/GothicSelect";
import {
  DISCIPLINAS_CANONICAS_CATALOGO,
  CANONICAL_DISCIPLINES_LIST,
  SENDAS_TAUMATURGICAS,
  RITUAIS_TAUMATURGICOS_CATALOGO,
  generateCanonicalSubLevels,
  findCanonicalDiscipline,
  findCanonicalPower,
  isPlaceholderSubLevels,
} from "@/lib/systems/regrasDeOuro/disciplinesCatalog";

interface DisciplinesTreeProps {
  disciplinas: RegrasDeOuroDisciplina[];
  onChangeDisciplinas: (disciplinas: RegrasDeOuroDisciplina[]) => void;
  rituais?: RitualTaumaturgicoEntry[];
  onChangeRituais?: (rituais: RitualTaumaturgicoEntry[]) => void;
  disabled?: boolean;
}

export default function DisciplinesTree({
  disciplinas,
  onChangeDisciplinas,
  rituais = [],
  onChangeRituais,
  disabled = false,
}: DisciplinesTreeProps) {
  // Estado para Modal de Despertar Disciplina
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDisciplineName, setSelectedDisciplineName] = useState(CANONICAL_DISCIPLINES_LIST[0].nome);
  const [newDiscLevel, setNewDiscLevel] = useState(1);
  const [expandedDiscId, setExpandedDiscId] = useState<string | null>(null);

  // Estado para Edição de Poder / Sub-Nível
  const [editingPower, setEditingPower] = useState<{
    discId: string;
    discNome: string;
    sub: SubNivelDisciplina;
  } | null>(null);
  const [editPowerForm, setEditPowerForm] = useState({
    nome: "",
    descricao: "",
    ativo: true,
  });
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Estado para Criar Novo Aprimoramento Customizado
  const [addingCustomPowerToDiscId, setAddingCustomPowerToDiscId] = useState<string | null>(null);
  const [customPowerForm, setCustomPowerForm] = useState({
    codigo: "",
    nome: "",
    descricao: "",
  });

  // Estado para Rituais Taumatúrgicos
  const [isRitualModalOpen, setIsRitualModalOpen] = useState(false);
  const [selectedRitualCircle, setSelectedRitualCircle] = useState<number | 0>(0); // 0 = todos
  const [ritualSearchTerm, setRitualSearchTerm] = useState("");
  const [isCreatingCustomRitual, setIsCreatingCustomRitual] = useState(false);
  const [customRitualForm, setCustomRitualForm] = useState({
    nome: "",
    nivel: 1,
    descricao: "",
  });
  const [expandedRitualsSection, setExpandedRitualsSection] = useState(true);

  // Conjunto de disciplinas já manifestadas
  const existingNames = new Set(disciplinas.map((d) => d.nome.toLowerCase()));

  // -------------------------------------------------------------
  // AUTO-MIGRAÇÃO INTELIGENTE:
  // Se qualquer disciplina contiver textos genéricos placeholders
  // ("Poder Fundamental Círculo X" ou "Aprimoramento X.X") e pertencer
  // ao catálogo oficial de Regras de Ouro, substitui automaticamente
  // pelos dados e nomes oficiais canônicos do livro.
  // -------------------------------------------------------------
  useEffect(() => {
    let hasChanges = false;
    const migrated = disciplinas.map((disc) => {
      const canonical = findCanonicalDiscipline(disc.nome);
      // Só auto-migra se a disciplina for canônica e possuir placeholders antigos
      if (canonical && isPlaceholderSubLevels(disc.subNiveisAtivos)) {
        hasChanges = true;
        return {
          ...disc,
          subNiveisAtivos: generateCanonicalSubLevels(disc.nome, disc.nivel),
        };
      }
      return disc;
    });

    if (hasChanges) {
      onChangeDisciplinas(migrated);
    }
  }, [disciplinas, onChangeDisciplinas]);

  // -------------------------------------------------------------
  // Ações de Disciplina
  // -------------------------------------------------------------
  const handleAddDiscipline = () => {
    if (!selectedDisciplineName.trim()) return;
    const catalogItem = CANONICAL_DISCIPLINES_LIST.find((m) => m.nome === selectedDisciplineName);

    const newEntry: RegrasDeOuroDisciplina = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `disc-${Date.now()}`,
      nome: selectedDisciplineName.trim(),
      nivel: newDiscLevel,
      subNiveisAtivos: generateCanonicalSubLevels(selectedDisciplineName.trim(), newDiscLevel),
      descricao: catalogItem ? catalogItem.resumo : `Poderes arcanos de ${selectedDisciplineName.trim()}.`,
    };

    onChangeDisciplinas([...disciplinas, newEntry]);
    setIsAddModalOpen(false);
    setExpandedDiscId(newEntry.id);
  };

  const handleUpdateLevel = (id: string, newLevel: number) => {
    onChangeDisciplinas(
      disciplinas.map((d) => {
        if (d.id === id) {
          const clamped = Math.max(1, Math.min(5, newLevel));
          // Gera novos poderes canônicos, preservando edições customizadas feitas pelo jogador
          const canonical = generateCanonicalSubLevels(d.nome, clamped);
          const currentMap = new Map((d.subNiveisAtivos || []).map((s) => [s.codigo, s]));

          const merged = canonical.map((c) => {
            const existing = currentMap.get(c.codigo);
            if (existing && existing.customizado) {
              return existing;
            }
            return c;
          });

          // Mantém aprimoramentos customizados extras que o jogador tenha criado
          const customExtras = (d.subNiveisAtivos || []).filter(
            (s) => s.customizado && !canonical.some((c) => c.codigo === s.codigo)
          );

          return {
            ...d,
            nivel: clamped,
            subNiveisAtivos: [...merged, ...customExtras],
          };
        }
        return d;
      })
    );
  };

  const handleRemoveDiscipline = (id: string) => {
    onChangeDisciplinas(disciplinas.filter((d) => d.id !== id));
  };

  const handleSyncWithOfficialBook = (disc: RegrasDeOuroDisciplina) => {
    const canonical = generateCanonicalSubLevels(disc.nome, disc.nivel);
    onChangeDisciplinas(
      disciplinas.map((d) => {
        if (d.id === disc.id) {
          return {
            ...d,
            subNiveisAtivos: canonical,
          };
        }
        return d;
      })
    );
  };

  const handleChangeTaumaturgiaSenda = (discId: string, novaSenda: string) => {
    onChangeDisciplinas(
      disciplinas.map((d) => {
        if (d.id === discId) {
          return {
            ...d,
            nome: novaSenda,
            subNiveisAtivos: generateCanonicalSubLevels(novaSenda, d.nivel),
          };
        }
        return d;
      })
    );
  };

  // -------------------------------------------------------------
  // Edição de Poder
  // -------------------------------------------------------------
  const handleOpenEditPower = (discId: string, discNome: string, sub: SubNivelDisciplina) => {
    setEditingPower({ discId, discNome, sub });
    setEditPowerForm({
      nome: sub.nome,
      descricao: sub.descricao,
      ativo: sub.ativo,
    });
    setEditSuccessMsg(null);
  };

  const handleSavePowerEdit = () => {
    if (!editingPower) return;
    onChangeDisciplinas(
      disciplinas.map((d) => {
        if (d.id !== editingPower.discId) return d;
        const updatedSubs = (d.subNiveisAtivos || []).map((s) => {
          if (s.codigo === editingPower.sub.codigo) {
            return {
              ...s,
              nome: editPowerForm.nome.trim() || s.nome,
              descricao: editPowerForm.descricao.trim() || s.descricao,
              ativo: editPowerForm.ativo,
              customizado: true,
            };
          }
          return s;
        });
        return { ...d, subNiveisAtivos: updatedSubs };
      })
    );
    setEditingPower(null);
  };

  const handleRestoreOfficialPower = () => {
    if (!editingPower) return;
    const official = findCanonicalPower(editingPower.discNome, editingPower.sub.codigo);
    if (official) {
      setEditPowerForm((prev) => ({
        ...prev,
        nome: official.nome,
        descricao: official.descricao,
      }));
      setEditSuccessMsg("Texto oficial do livro restaurado.");
      setTimeout(() => setEditSuccessMsg(null), 3000);
    }
  };

  // -------------------------------------------------------------
  // Adição de Aprimoramento Customizado
  // -------------------------------------------------------------
  const handleSaveCustomPower = () => {
    if (!addingCustomPowerToDiscId || !customPowerForm.nome.trim()) return;

    onChangeDisciplinas(
      disciplinas.map((d) => {
        if (d.id !== addingCustomPowerToDiscId) return d;
        const newCode =
          customPowerForm.codigo.trim() ||
          `${d.nivel}.${(d.subNiveisAtivos?.length || 0) + 1}`;
        const newSub: SubNivelDisciplina = {
          codigo: newCode,
          nome: customPowerForm.nome.trim(),
          descricao: customPowerForm.descricao.trim() || "Aprimoramento customizado pela crônica.",
          ativo: true,
          customizado: true,
        };
        return {
          ...d,
          subNiveisAtivos: [...(d.subNiveisAtivos || []), newSub],
        };
      })
    );

    setAddingCustomPowerToDiscId(null);
    setCustomPowerForm({ codigo: "", nome: "", descricao: "" });
  };

  // -------------------------------------------------------------
  // Ações de Rituais Taumatúrgicos
  // -------------------------------------------------------------
  const handleAddCatalogRitual = (ritualDef: (typeof RITUAIS_TAUMATURGICOS_CATALOGO)[number]) => {
    if (!onChangeRituais) return;
    const exists = rituais.some((r) => r.nome.toLowerCase() === ritualDef.nome.toLowerCase());
    if (exists) return;

    const newRitual: RitualTaumaturgicoEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `rit-${Date.now()}`,
      nome: ritualDef.nome,
      nivel: ritualDef.nivel,
      descricao: ritualDef.descricao,
    };

    onChangeRituais([...rituais, newRitual]);
  };

  const handleCreateCustomRitual = () => {
    if (!onChangeRituais || !customRitualForm.nome.trim()) return;

    const newRitual: RitualTaumaturgicoEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `rit-${Date.now()}`,
      nome: customRitualForm.nome.trim(),
      nivel: customRitualForm.nivel,
      descricao: customRitualForm.descricao.trim() || "Ritual arcano desenvolvido pelo taumaturgo.",
      customizado: true,
    };

    onChangeRituais([...rituais, newRitual]);
    setIsCreatingCustomRitual(false);
    setCustomRitualForm({ nome: "", nivel: 1, descricao: "" });
  };

  const handleRemoveRitual = (ritualId: string) => {
    if (!onChangeRituais) return;
    onChangeRituais(rituais.filter((r) => r.id !== ritualId));
  };

  // Filtros de Rituais para o Modal
  const filteredCatalogRituals = RITUAIS_TAUMATURGICOS_CATALOGO.filter((r) => {
    const matchesCircle = selectedRitualCircle === 0 || r.nivel === selectedRitualCircle;
    const matchesSearch =
      ritualSearchTerm.trim() === "" ||
      r.nome.toLowerCase().includes(ritualSearchTerm.toLowerCase()) ||
      r.descricao.toLowerCase().includes(ritualSearchTerm.toLowerCase());
    return matchesCircle && matchesSearch;
  });

  const currentSelectedMeta = CANONICAL_DISCIPLINES_LIST.find((m) => m.nome === selectedDisciplineName);

  // Verifica se o personagem possui Taumaturgia ou Necromancia
  const hasBloodMagic = disciplinas.some(
    (d) =>
      d.nome.toLowerCase().includes("taumaturgia") ||
      d.nome.toLowerCase().includes("necromancia") ||
      d.nome.toLowerCase().includes("rego") ||
      d.nome.toLowerCase().includes("creo")
  );

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* SEÇÃO PRINCIPAL: DISCIPLINAS & CÍRCULOS DE SANGUE          */}
      {/* ========================================================= */}
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
              const firstAvailable = CANONICAL_DISCIPLINES_LIST.find(
                (m) => !existingNames.has(m.nome.toLowerCase())
              );
              if (firstAvailable) {
                setSelectedDisciplineName(firstAvailable.nome);
              }
              setIsAddModalOpen(true);
            }}
            className="px-3 py-1.5 bg-blood-red/20 hover:bg-blood-red text-white border border-blood-red/40 rounded-xs text-xs uppercase font-data font-semibold tracking-wider transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto min-h-[36px] flex items-center justify-center gap-1.5"
          >
            <span>+ Aprender Disciplina</span>
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
              const isTaumaturgia =
                disc.nome.toLowerCase() === "taumaturgia" ||
                disc.nome.toLowerCase().startsWith("taumaturgia:");

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
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                        <span className="text-sm font-gothic tracking-wider text-text-primary uppercase font-bold">
                          {disc.nome}
                        </span>
                        {isTaumaturgia && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-2xs bg-blood-red/20 text-blood-red border border-blood-red/30 w-fit">
                            Feitiçaria Hermética
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      {/* Botão Sincronizar com Manual Oficial */}
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleSyncWithOfficialBook(disc)}
                          className="px-2 py-1 bg-white/5 hover:bg-blood-red/20 text-text-dim hover:text-blood-red border border-white/10 rounded-xs text-[10px] uppercase font-data transition-colors cursor-pointer"
                          title="Restaurar todos os poderes e aprimoramentos para as descrições canônicas do livro"
                        >
                          ↻ Sincronizar
                        </button>
                      )}

                      {/* Stepper + Bolinhas de Nível (1 a 5) */}
                      <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-xs border border-white/5">
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => handleUpdateLevel(disc.id, disc.nivel - 1)}
                            disabled={disc.nivel <= 1}
                            className="w-7 h-7 sm:w-8 sm:h-8 min-w-[28px] min-h-[28px] flex items-center justify-center text-text-dim hover:text-white disabled:opacity-30 cursor-pointer font-mono text-xs rounded-2xs hover:bg-white/10 transition-colors"
                            title="Diminuir nível"
                          >
                            -
                          </button>
                        )}

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

                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => handleUpdateLevel(disc.id, disc.nivel + 1)}
                            disabled={disc.nivel >= 5}
                            className="w-7 h-7 sm:w-8 sm:h-8 min-w-[28px] min-h-[28px] flex items-center justify-center text-text-dim hover:text-white disabled:opacity-30 cursor-pointer font-mono text-xs rounded-2xs hover:bg-white/10 transition-colors"
                            title="Aumentar nível"
                          >
                            +
                          </button>
                        )}

                        <span className="ml-1 text-xs font-mono text-blood-red font-bold w-12 text-right">
                          Nív. {disc.nivel}
                        </span>
                      </div>

                      {/* Botão Remover */}
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

                  {/* Troca Rápida de Senda Taumatúrgica se for Taumaturgia */}
                  {isTaumaturgia && isExpanded && !disabled && (
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-data text-text-dim uppercase tracking-wider">
                        Senda / Trilha Hermética:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SENDAS_TAUMATURGICAS.map((senda) => {
                          const isCurrent = disc.nome === senda;
                          const shortName = senda.replace("Taumaturgia: ", "");
                          return (
                            <button
                              key={senda}
                              type="button"
                              onClick={() => handleChangeTaumaturgiaSenda(disc.id, senda)}
                              className={`text-[10px] px-2 py-0.5 rounded-2xs border font-data transition-all cursor-pointer ${
                                isCurrent
                                  ? "bg-blood-red text-white border-blood-red font-semibold shadow-[0_0_8px_rgba(200,36,52,0.5)]"
                                  : "bg-black/30 text-text-muted border-white/10 hover:border-white/30 hover:text-white"
                              }`}
                            >
                              {shortName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sub-níveis e Aprimoramentos Ativos */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-data tracking-widest text-gold-accent block">
                          Poderes & Aprimoramentos Desbloqueados:
                        </span>

                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => {
                              setAddingCustomPowerToDiscId(disc.id);
                              setCustomPowerForm({ codigo: "", nome: "", descricao: "" });
                            }}
                            className="text-[10px] uppercase font-data text-blood-red hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>+ Novo Aprimoramento</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {(disc.subNiveisAtivos || []).map((sub: SubNivelDisciplina) => (
                          <div
                            key={sub.codigo}
                            className={`p-2.5 bg-black/40 border rounded-xs space-y-1 transition-all ${
                              sub.ativo
                                ? "border-white/10 hover:border-blood-red/40"
                                : "border-white/5 opacity-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold text-blood-red">
                                  [{sub.codigo}]
                                </span>
                                {sub.customizado && (
                                  <span className="text-[8px] font-mono px-1 rounded-2xs bg-gold-accent/20 text-gold-accent border border-gold-accent/30">
                                    Editado
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {!disabled && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditPower(disc.id, disc.nome, sub)}
                                    className="text-[10px] text-text-dim hover:text-white p-0.5 rounded-2xs hover:bg-white/10 transition-colors cursor-pointer"
                                    title="Editar nome e descrição deste poder"
                                  >
                                    ✎
                                  </button>
                                )}
                                <span
                                  className={`text-[8px] font-data uppercase tracking-wider px-1 py-0.2 rounded-2xs border ${
                                    sub.ativo
                                      ? "text-green-400 bg-green-950/40 border-green-500/30"
                                      : "text-text-dim bg-white/5 border-white/10"
                                  }`}
                                >
                                  {sub.ativo ? "Ativo" : "Inativo"}
                                </span>
                              </div>
                            </div>

                            <div className="text-xs font-data font-semibold text-text-primary leading-tight">
                              {sub.nome}
                            </div>
                            <p className="text-[11px] text-text-muted font-reading leading-relaxed">
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
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO: RITUAIS DE FEITIÇARIA (TAUMATURGIA & NECROMANCIA)  */}
      {/* ========================================================= */}
      <div className="bg-bg-card/70 border border-white/10 rounded-sm p-4 relative shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3 pb-2 border-b border-white/10">
          <div
            className="cursor-pointer select-none flex items-center gap-2"
            onClick={() => setExpandedRitualsSection(!expandedRitualsSection)}
          >
            <span className="text-xs text-text-dim transition-transform duration-200">
              {expandedRitualsSection ? "▼" : "▶"}
            </span>
            <div>
              <h3 className="text-sm font-gothic tracking-widest text-blood-red uppercase flex items-center gap-2">
                <span>Rituais Herméticos & Arcanos</span>
                <span className="text-[10px] font-data text-text-dim font-normal lowercase tracking-normal">
                  (Círculos 1 a 5 de Taumaturgia & Necromancia)
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!disabled && onChangeRituais && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRitualCircle(0);
                  setRitualSearchTerm("");
                  setIsCreatingCustomRitual(false);
                  setIsRitualModalOpen(true);
                }}
                className="px-3 py-1.5 bg-blood-red/20 hover:bg-blood-red text-white border border-blood-red/40 rounded-xs text-xs uppercase font-data font-semibold tracking-wider transition-all cursor-pointer min-h-[36px] flex items-center justify-center gap-1.5"
              >
                <span>+ Aprender Ritual</span>
              </button>
            )}
          </div>
        </div>

        {expandedRitualsSection && (
          <div>
            {rituais.length === 0 ? (
              <div
                onClick={() => !disabled && onChangeRituais && setIsRitualModalOpen(true)}
                className="p-6 border border-dashed border-white/10 rounded-xs text-center cursor-pointer hover:border-blood-red/40 transition-colors"
              >
                <p className="text-xs text-text-muted font-reading">
                  Nenhum ritual arcano aprendido ainda. {hasBloodMagic ? "Clique para consultar os rituais oficiais da Biblioteca Hermética." : "Requer Taumaturgia ou Necromancia para canalização completa."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rituais.map((rit) => (
                  <div
                    key={rit.id}
                    className="p-3 bg-bg-input/40 border border-white/10 rounded-sm hover:border-blood-red/30 transition-all space-y-1.5 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-2xs bg-blood-red/20 text-blood-red border border-blood-red/30 font-bold">
                          Círculo {rit.nivel}
                        </span>
                        <span className="text-xs font-data font-bold text-text-primary uppercase">
                          {rit.nome}
                        </span>
                      </div>

                      {!disabled && onChangeRituais && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRitual(rit.id)}
                          className="text-text-dim hover:text-hunger-red text-xs font-bold cursor-pointer transition-colors p-1"
                          title="Esquecer Ritual"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-text-muted font-reading leading-relaxed">
                      {rit.descricao}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: DESPERTAR DISCIPLINA (CLICK ÚNICO, SEM RETENÇÃO)   */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-bg-card border border-blood-red/40 rounded-sm p-6 relative shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
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
                Escolha a disciplina canônica ou senda hermética para despertar os dons do Sangue.
              </p>
            </div>

            <div className="space-y-4">
              {/* Seletor Customizado Gótico com Busca e Click Único */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block mb-1">
                  Catálogo Canônico Oficial (19 Disciplinas + 5 Sendas de Taumaturgia)
                </label>
                <GothicSelect
                  variant="blood"
                  searchable
                  value={selectedDisciplineName}
                  onChange={(val) => setSelectedDisciplineName(String(val))}
                  options={CANONICAL_DISCIPLINES_LIST.map((m) => {
                    const isAlreadyAdded = existingNames.has(m.nome.toLowerCase());
                    const isTaum = m.categoria === "taumaturgia";
                    return {
                      value: m.nome,
                      label: m.nome,
                      description: m.resumo,
                      badge: isAlreadyAdded
                        ? "Já manifestada"
                        : isTaum
                        ? "Senda Taumatúrgica"
                        : undefined,
                    };
                  })}
                />

                {/* Card de Resumo da Disciplina Selecionada */}
                {currentSelectedMeta && (
                  <div className="mt-2.5 p-3 bg-black/40 border border-blood-red/20 rounded-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-data tracking-wider text-blood-red font-bold">
                        Natureza Arcana:
                      </span>
                      {currentSelectedMeta.categoria && (
                        <span className="text-[8px] uppercase font-mono px-1 rounded-2xs bg-white/5 text-text-dim">
                          {currentSelectedMeta.categoria}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-primary font-reading leading-relaxed">
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

      {/* ========================================================= */}
      {/* MODAL: EDITAR PODER / SUB-NÍVEL                           */}
      {/* ========================================================= */}
      {editingPower && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setEditingPower(null)}
        >
          <div
            className="w-full max-w-lg bg-bg-card border border-blood-red/40 rounded-sm p-6 relative shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEditingPower(null)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base w-8 h-8 flex items-center justify-center rounded-xs hover:bg-white/10"
              title="Fechar"
            >
              ✕
            </button>

            <div className="pb-2 border-b border-white/10">
              <span className="text-[10px] font-mono text-blood-red font-bold">
                [{editingPower.sub.codigo}] {editingPower.discNome}
              </span>
              <h4 className="text-base font-gothic tracking-widest text-text-primary uppercase">
                Editar Poder ou Aprimoramento
              </h4>
            </div>

            {editSuccessMsg && (
              <div className="p-2 bg-green-950/40 border border-green-500/30 text-green-400 text-xs font-data rounded-xs">
                {editSuccessMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block mb-1">
                  Nome do Poder
                </label>
                <input
                  type="text"
                  value={editPowerForm.nome}
                  onChange={(e) => setEditPowerForm({ ...editPowerForm, nome: e.target.value })}
                  className="w-full bg-bg-input border border-white/10 rounded-xs px-3 py-2 text-sm text-text-primary focus:border-blood-red outline-none"
                  placeholder="Nome do poder canônico ou customizado"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block mb-1">
                  Descrição Mecânica & Efeito
                </label>
                <textarea
                  rows={4}
                  value={editPowerForm.descricao}
                  onChange={(e) => setEditPowerForm({ ...editPowerForm, descricao: e.target.value })}
                  className="w-full bg-bg-input border border-white/10 rounded-xs px-3 py-2 text-xs text-text-primary focus:border-blood-red outline-none font-reading leading-relaxed"
                  placeholder="Descreva o efeito, custo de Vitæ, rolagem e limites do poder..."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-power-active"
                  checked={editPowerForm.ativo}
                  onChange={(e) => setEditPowerForm({ ...editPowerForm, ativo: e.target.checked })}
                  className="rounded-xs accent-blood-red cursor-pointer"
                />
                <label htmlFor="chk-power-active" className="text-xs font-data text-text-primary cursor-pointer">
                  Poder ativo e manifesto no personagem
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleRestoreOfficialPower}
                  className="w-full sm:w-auto px-3 py-2 text-xs uppercase font-data text-gold-accent hover:text-white border border-gold-accent/30 hover:border-gold-accent rounded-xs transition-colors cursor-pointer"
                  title="Recupera o texto canônico de 04-disciplinas-e-poderes.md para este código"
                >
                  ↻ Restaurar Texto Oficial
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingPower(null)}
                    className="px-4 py-2 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 rounded-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePowerEdit}
                    className="px-5 py-2 text-xs uppercase font-data font-semibold bg-blood-red hover:bg-red-800 text-white rounded-xs transition-colors cursor-pointer shadow-[0_0_10px_rgba(200,36,52,0.4)]"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CRIAR NOVO APRIMORAMENTO CUSTOMIZADO               */}
      {/* ========================================================= */}
      {addingCustomPowerToDiscId && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setAddingCustomPowerToDiscId(null)}
        >
          <div
            className="w-full max-w-lg bg-bg-card border border-blood-red/40 rounded-sm p-6 relative shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAddingCustomPowerToDiscId(null)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base w-8 h-8 flex items-center justify-center rounded-xs hover:bg-white/10"
              title="Fechar"
            >
              ✕
            </button>

            <div className="pb-2 border-b border-white/10">
              <h4 className="text-base font-gothic tracking-widest text-blood-red uppercase">
                Adicionar Novo Aprimoramento Customizado
              </h4>
              <p className="text-[11px] text-text-dim font-reading mt-0.5">
                Crie uma técnica pessoal, variação de linhagem ou poder experimental para esta disciplina.
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block mb-1">
                    Código (ex: 1.4)
                  </label>
                  <input
                    type="text"
                    value={customPowerForm.codigo}
                    onChange={(e) => setCustomPowerForm({ ...customPowerForm, codigo: e.target.value })}
                    className="w-full bg-bg-input border border-white/10 rounded-xs px-3 py-2 text-xs font-mono text-text-primary focus:border-blood-red outline-none"
                    placeholder="Auto"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block mb-1">
                    Nome da Técnica / Aprimoramento
                  </label>
                  <input
                    type="text"
                    value={customPowerForm.nome}
                    onChange={(e) => setCustomPowerForm({ ...customPowerForm, nome: e.target.value })}
                    className="w-full bg-bg-input border border-white/10 rounded-xs px-3 py-2 text-sm text-text-primary focus:border-blood-red outline-none"
                    placeholder="Ex: Garras Alquímicas, Toque Sombrio"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block mb-1">
                  Efeito Mecânico & Regras
                </label>
                <textarea
                  rows={4}
                  value={customPowerForm.descricao}
                  onChange={(e) => setCustomPowerForm({ ...customPowerForm, descricao: e.target.value })}
                  className="w-full bg-bg-input border border-white/10 rounded-xs px-3 py-2 text-xs text-text-primary focus:border-blood-red outline-none font-reading leading-relaxed"
                  placeholder="Descreva detalhadamente o efeito na crônica..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAddingCustomPowerToDiscId(null)}
                  className="px-4 py-2 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 rounded-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomPower}
                  className="px-5 py-2 text-xs uppercase font-data font-semibold bg-blood-red hover:bg-red-800 text-white rounded-xs transition-colors cursor-pointer shadow-[0_0_10px_rgba(200,36,52,0.4)]"
                >
                  Adicionar Aprimoramento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: APRENDER RITUAL TAUMATÚRGICO (CATÁLOGO CANÔNICO)   */}
      {/* ========================================================= */}
      {isRitualModalOpen && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsRitualModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-bg-card border border-blood-red/40 rounded-sm p-6 relative shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsRitualModalOpen(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base w-8 h-8 flex items-center justify-center rounded-xs hover:bg-white/10"
              title="Fechar"
            >
              ✕
            </button>

            <div className="pb-2 border-b border-white/10 flex-shrink-0">
              <h4 className="text-base font-gothic tracking-widest text-blood-red uppercase">
                Grimório de Rituais Taumatúrgicos (31 Rituais Oficiais)
              </h4>
              <p className="text-[11px] text-text-dim font-reading mt-0.5">
                Consulte e aprenda rituais arcanos de Nível 1 a 5 ou registre rituais autorais.
              </p>
            </div>

            {/* Alternador de Modo: Catálogo vs Criar Customizado */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsCreatingCustomRitual(false)}
                className={`px-3 py-1.5 rounded-xs text-xs font-data uppercase transition-colors cursor-pointer ${
                  !isCreatingCustomRitual
                    ? "bg-blood-red text-white font-semibold"
                    : "bg-white/5 text-text-muted hover:text-white"
                }`}
              >
                Biblioteca Canônica
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingCustomRitual(true)}
                className={`px-3 py-1.5 rounded-xs text-xs font-data uppercase transition-colors cursor-pointer ${
                  isCreatingCustomRitual
                    ? "bg-blood-red text-white font-semibold"
                    : "bg-white/5 text-text-muted hover:text-white"
                }`}
              >
                + Criar Ritual Autoral
              </button>
            </div>

            {isCreatingCustomRitual ? (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block mb-1">
                      Nome do Ritual
                    </label>
                    <input
                      type="text"
                      value={customRitualForm.nome}
                      onChange={(e) => setCustomRitualForm({ ...customRitualForm, nome: e.target.value })}
                      className="w-full bg-bg-input border border-white/10 rounded-xs px-3 py-2 text-sm text-text-primary focus:border-blood-red outline-none"
                      placeholder="Ex: Círculo de Sangue Negro"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block mb-1">
                      Círculo (1 a 5)
                    </label>
                    <select
                      value={customRitualForm.nivel}
                      onChange={(e) => setCustomRitualForm({ ...customRitualForm, nivel: Number(e.target.value) })}
                      className="w-full bg-bg-input border border-white/10 rounded-xs px-3 py-2 text-xs text-text-primary focus:border-blood-red outline-none"
                    >
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <option key={lvl} value={lvl} className="bg-bg-card">
                          Círculo {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block mb-1">
                    Componentes, Duração & Efeito Místico
                  </label>
                  <textarea
                    rows={4}
                    value={customRitualForm.descricao}
                    onChange={(e) => setCustomRitualForm({ ...customRitualForm, descricao: e.target.value })}
                    className="w-full bg-bg-input border border-white/10 rounded-xs px-3 py-2 text-xs text-text-primary focus:border-blood-red outline-none font-reading leading-relaxed"
                    placeholder="Descreva os ingredientes alquímicos, tempo de preparo e os efeitos..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsRitualModalOpen(false)}
                    className="px-4 py-2 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 rounded-xs transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCustomRitual}
                    className="px-5 py-2 text-xs uppercase font-data font-semibold bg-blood-red hover:bg-red-800 text-white rounded-xs transition-colors cursor-pointer shadow-[0_0_10px_rgba(200,36,52,0.4)]"
                  >
                    Aprender Ritual Autoral
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Filtros por Círculo e Busca */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      type="button"
                      onClick={() => setSelectedRitualCircle(0)}
                      className={`px-2.5 py-1 text-xs font-mono rounded-xs border transition-colors cursor-pointer whitespace-nowrap ${
                        selectedRitualCircle === 0
                          ? "bg-blood-red border-blood-red text-white"
                          : "bg-white/5 border-white/10 text-text-muted hover:text-white"
                      }`}
                    >
                      Todos
                    </button>
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSelectedRitualCircle(lvl)}
                        className={`px-2.5 py-1 text-xs font-mono rounded-xs border transition-colors cursor-pointer whitespace-nowrap ${
                          selectedRitualCircle === lvl
                            ? "bg-blood-red border-blood-red text-white"
                            : "bg-white/5 border-white/10 text-text-muted hover:text-white"
                        }`}
                      >
                        Nív. {lvl}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={ritualSearchTerm}
                    onChange={(e) => setRitualSearchTerm(e.target.value)}
                    placeholder="Buscar por nome ou efeito..."
                    className="flex-1 bg-bg-input border border-white/10 rounded-xs px-3 py-1 text-xs text-text-primary focus:border-blood-red outline-none min-h-[32px]"
                  />
                </div>

                {/* Lista de Rituais Canônicos */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[240px]">
                  {filteredCatalogRituals.length === 0 ? (
                    <div className="p-8 text-center text-text-muted text-xs font-reading">
                      Nenhum ritual encontrado com os filtros selecionados.
                    </div>
                  ) : (
                    filteredCatalogRituals.map((rDef) => {
                      const alreadyKnown = rituais.some(
                        (r) => r.nome.toLowerCase() === rDef.nome.toLowerCase()
                      );
                      return (
                        <div
                          key={rDef.id}
                          className="p-3 bg-black/40 border border-white/10 rounded-xs hover:border-blood-red/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-blood-red px-1 py-0.2 rounded-2xs bg-blood-red/10 border border-blood-red/20">
                                Círculo {rDef.nivel}
                              </span>
                              <span className="text-xs font-data font-bold text-text-primary">
                                {rDef.nome}
                              </span>
                            </div>
                            <p className="text-[11px] text-text-muted font-reading leading-relaxed">
                              {rDef.descricao}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={alreadyKnown}
                            onClick={() => handleAddCatalogRitual(rDef)}
                            className={`px-3 py-1.5 text-xs font-data uppercase tracking-wider rounded-xs border transition-colors cursor-pointer whitespace-nowrap self-end sm:self-auto min-h-[32px] ${
                              alreadyKnown
                                ? "bg-white/5 border-white/10 text-text-dim cursor-not-allowed"
                                : "bg-blood-red/20 hover:bg-blood-red text-white border-blood-red/40"
                            }`}
                          >
                            {alreadyKnown ? "Já Aprendido" : "+ Aprender"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-white/10 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsRitualModalOpen(false)}
                    className="px-4 py-2 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 rounded-xs transition-colors cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
