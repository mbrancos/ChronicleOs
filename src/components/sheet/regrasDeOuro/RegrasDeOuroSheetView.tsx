"use client";

import React, { useState } from "react";
import type {
  RegrasDeOuroSheetData,
  RegrasDeOuroTalentos,
  PalavraChaveItem,
  AnatomicalVitality,
  RegrasDeOuroDisciplinaAdquirida,
  GuiaDaBestaData,
  RegrasDeOuroTrilha,
  RegrasDeOuroVirtudes,
  BodySectorId,
} from "@/types/systems/regrasDeOuro";
import {
  ARCHETYPES_TABLE,
  CLANS_REGROURO,
  VITAE_BY_GENERATION,
  VANTAGENS_CATALOGO,
  DESVANTAGENS_CATALOGO,
} from "@/lib/systems/regrasDeOuro/constants";
import {
  calculateArchetypeBonuses,
  calculateInitialTrilha,
} from "@/lib/systems/regrasDeOuro/rules";
import GothicSelect from "@/components/common/GothicSelect";
import TalentosGrid from "./TalentosGrid";
import KeywordsSection from "./KeywordsSection";
import AnatomicalHealthTracker from "./AnatomicalHealthTracker";
import BestaPanel from "./BestaPanel";
import DisciplinesTree from "./DisciplinesTree";

interface RegrasDeOuroSheetViewProps {
  sheetData: RegrasDeOuroSheetData;
  onUpdateSheet: (newData: RegrasDeOuroSheetData) => void;
  characterName: string;
  isNarrator?: boolean;
  disabled?: boolean;
  onRollDice?: (diceCount: number, difficulty: number, label: string) => void;
}

type TabKey = "talentos" | "poderes" | "besta" | "vantagens" | "inventario";

export default function RegrasDeOuroSheetView({
  sheetData,
  onUpdateSheet,
  characterName,
  isNarrator = false,
  disabled = false,
  onRollDice,
}: RegrasDeOuroSheetViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("talentos");

  // Modais de Vantagens, Paixões e Grilhões
  const [isAddPaixaoOpen, setIsAddPaixaoOpen] = useState(false);
  const [newPaixaoNome, setNewPaixaoNome] = useState("");
  const [newPaixaoEmocao, setNewPaixaoEmocao] = useState("");
  const [newPaixaoNivel, setNewPaixaoNivel] = useState(3);

  const [isAddGrilhaoOpen, setIsAddGrilhaoOpen] = useState(false);
  const [newGrilhaoNome, setNewGrilhaoNome] = useState("");
  const [newGrilhaoEmocao, setNewGrilhaoEmocao] = useState("");
  const [newGrilhaoNivel, setNewGrilhaoNivel] = useState(3);

  const [isAddTraitOpen, setIsAddTraitOpen] = useState<"vantagem" | "desvantagem" | null>(null);
  const [selectedTraitCatalog, setSelectedTraitCatalog] = useState("");
  const [customTraitNome, setCustomTraitNome] = useState("");
  const [customTraitCategoria, setCustomTraitCategoria] = useState("Físico");
  const [customTraitPontos, setCustomTraitPontos] = useState(1);

  // Arquétipos e Clãs disponíveis
  const archetypeNames = Object.keys(ARCHETYPES_TABLE);
  const clanNames = Object.keys(CLANS_REGROURO);

  // Clã atual e fraqueza
  const currentClanDef = CLANS_REGROURO[sheetData.cla] || CLANS_REGROURO["Brujah"];

  // Manipuladores de alteração
  const handleUpdate = (partial: Partial<RegrasDeOuroSheetData>) => {
    onUpdateSheet({ ...sheetData, ...partial });
  };

  const handleArchetypeChange = (field: "natureza" | "mascara", value: string) => {
    const updated = { ...sheetData, [field]: value };
    const { campoPessoal } = calculateArchetypeBonuses(
      field === "natureza" ? value : sheetData.natureza,
      field === "mascara" ? value : sheetData.mascara
    );
    updated.campoPessoal = campoPessoal;
    onUpdateSheet(updated);
  };

  const handleClanChange = (newClan: string) => {
    onUpdateSheet({ ...sheetData, cla: newClan });
  };

  const handleGenerationChange = (gen: number) => {
    const vitaeConfig = VITAE_BY_GENERATION[gen] || { maxVitae: 10, spendPerTurn: 1 };
    onUpdateSheet({
      ...sheetData,
      geracao: gen,
      vitae: {
        atual: Math.min(sheetData.vitae.atual, vitaeConfig.maxVitae),
        maximo: vitaeConfig.maxVitae,
        gastoPorTurno: vitaeConfig.spendPerTurn,
      },
    });
  };

  const handleVirtudeChange = (virtude: keyof RegrasDeOuroVirtudes, value: number) => {
    const newVirtudes = { ...sheetData.virtudes, [virtude]: value };
    const newTrilhaNivel = calculateInitialTrilha(newVirtudes.consciencia, newVirtudes.autocontrole);
    onUpdateSheet({
      ...sheetData,
      virtudes: newVirtudes,
      trilha: {
        ...sheetData.trilha,
        nivel: newTrilhaNivel,
      },
    });
  };

  const handleBloodSpend = (delta: number) => {
    const next = Math.max(0, Math.min(sheetData.vitae.maximo, sheetData.vitae.atual + delta));
    handleUpdate({
      vitae: {
        ...sheetData.vitae,
        atual: next,
      },
    });
  };

  // Rolagem de teste de talento
  const handleRollTalento = (key: keyof RegrasDeOuroTalentos, label: string, value: number) => {
    if (onRollDice) {
      onRollDice(Math.max(1, value), 6, `Teste de ${label}`);
    }
  };

  // Paixões da Psique
  const handleAddPaixao = () => {
    if (!newPaixaoNome.trim()) return;
    const newEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}`,
      nome: newPaixaoNome.trim(),
      emocao: newPaixaoEmocao.trim() || undefined,
      nivel: newPaixaoNivel,
    };
    handleUpdate({
      paixoes: [...(sheetData.paixoes || []), newEntry],
    });
    setNewPaixaoNome("");
    setNewPaixaoEmocao("");
    setNewPaixaoNivel(3);
    setIsAddPaixaoOpen(false);
  };

  const handleRemovePaixao = (id: string) => {
    handleUpdate({
      paixoes: (sheetData.paixoes || []).filter((p) => p.id !== id),
    });
  };

  // Grilhões da Psique
  const handleAddGrilhao = () => {
    if (!newGrilhaoNome.trim()) return;
    const newEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `g-${Date.now()}`,
      nome: newGrilhaoNome.trim(),
      emocao: newGrilhaoEmocao.trim() || undefined,
      nivel: newGrilhaoNivel,
    };
    handleUpdate({
      grilhoes: [...(sheetData.grilhoes || []), newEntry],
    });
    setNewGrilhaoNome("");
    setNewGrilhaoEmocao("");
    setNewGrilhaoNivel(3);
    setIsAddGrilhaoOpen(false);
  };

  const handleRemoveGrilhao = (id: string) => {
    handleUpdate({
      grilhoes: (sheetData.grilhoes || []).filter((g) => g.id !== id),
    });
  };

  // Vantagens e Desvantagens
  const handleAddTrait = () => {
    if (!isAddTraitOpen) return;
    let nome = customTraitNome.trim();
    let categoria = customTraitCategoria;
    let pontos = customTraitPontos;

    if (selectedTraitCatalog) {
      const catalog = isAddTraitOpen === "vantagem" ? VANTAGENS_CATALOGO : DESVANTAGENS_CATALOGO;
      const found = catalog.find((item) => item.nome === selectedTraitCatalog);
      if (found) {
        nome = found.nome;
        categoria = found.categoria;
        pontos = found.pontos;
      }
    }

    if (!nome) return;

    if (isAddTraitOpen === "vantagem") {
      const newEntry = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `vant-${Date.now()}`,
        nome,
        categoria,
        custo: pontos,
      };
      handleUpdate({
        vantagens: [...(sheetData.vantagens || []), newEntry],
      });
    } else {
      const newEntry = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `desv-${Date.now()}`,
        nome,
        categoria,
        pontos,
      };
      handleUpdate({
        desvantagens: [...(sheetData.desvantagens || []), newEntry],
      });
    }

    setSelectedTraitCatalog("");
    setCustomTraitNome("");
    setCustomTraitPontos(1);
    setIsAddTraitOpen(null);
  };

  const handleRemoveTrait = (id: string, type: "vantagem" | "desvantagem") => {
    if (type === "vantagem") {
      handleUpdate({
        vantagens: (sheetData.vantagens || []).filter((v) => v.id !== id),
      });
    } else {
      handleUpdate({
        desvantagens: (sheetData.desvantagens || []).filter((d) => d.id !== id),
      });
    }
  };

  const totalPontosPaixoes = (sheetData.paixoes || []).reduce((acc, p) => acc + (p.nivel || 1), 0);
  const totalPontosGrilhoes = (sheetData.grilhoes || []).reduce((acc, g) => acc + (g.nivel || 1), 0);

  return (
    <div className="space-y-3">
      {/* ======================================================== */}
      {/* 1. CABEÇALHO DO CAINITA (Com Dropdowns Góticos Customizados) */}
      {/* ======================================================== */}
      <div className="bg-bg-card border border-white/10 rounded-sm p-3.5 relative shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pb-3 border-b border-white/10">
          {/* Coluna 1: Clã e Conceito */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] uppercase font-data tracking-widest text-text-muted block mb-1">
                Clã Vampírico
              </label>
              <GothicSelect
                variant="gold"
                disabled={disabled}
                value={sheetData.cla}
                onChange={(val) => handleClanChange(String(val))}
                options={clanNames.map((c) => ({
                  value: c,
                  label: `${c} (${CLANS_REGROURO[c]?.nickname || ""})`,
                  description: CLANS_REGROURO[c]?.weakness,
                  badge: CLANS_REGROURO[c]?.disciplines?.slice(0, 2).join("/"),
                }))}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-data tracking-widest text-text-muted block mb-1">
                Etária & Geração
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <GothicSelect
                    disabled={disabled}
                    value={sheetData.etaria}
                    onChange={(val) => handleUpdate({ etaria: val as any })}
                    options={[
                      { value: "neonato", label: "Neonato (0-10a)" },
                      { value: "neofito", label: "Neófito (10-50a)" },
                      { value: "ancilla", label: "Ancilla (50+a)" },
                    ]}
                  />
                </div>

                <div className="w-28">
                  <GothicSelect
                    disabled={disabled}
                    value={sheetData.geracao}
                    onChange={(val) => handleGenerationChange(Number(val))}
                    options={[15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4].map((g) => ({
                      value: g,
                      label: `${g}ª Ger.`,
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 2: Natureza e Máscara (40 Arquétipos com Busca Instantânea) */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] uppercase font-data tracking-widest text-text-muted block mb-1">
                Natureza (Verdadeiro Eu)
              </label>
              <GothicSelect
                searchable
                variant="gold"
                disabled={disabled}
                value={sheetData.natureza}
                onChange={(val) => handleArchetypeChange("natureza", String(val))}
                options={archetypeNames.map((arc) => ({
                  value: arc,
                  label: arc,
                  description: `Campo Pessoal: +${ARCHETYPES_TABLE[arc]?.campoPessoal} | Virtudes: +${ARCHETYPES_TABLE[arc]?.virtudes}`,
                  badge: `CP +${ARCHETYPES_TABLE[arc]?.campoPessoal}`,
                }))}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-data tracking-widest text-text-muted block mb-1">
                Máscara (Persona Social)
              </label>
              <GothicSelect
                searchable
                variant="gold"
                disabled={disabled}
                value={sheetData.mascara}
                onChange={(val) => handleArchetypeChange("mascara", String(val))}
                options={archetypeNames.map((arc) => ({
                  value: arc,
                  label: arc,
                  description: `Campo Pessoal: +${ARCHETYPES_TABLE[arc]?.campoPessoal} | Virtudes: +${ARCHETYPES_TABLE[arc]?.virtudes}`,
                  badge: `CP +${ARCHETYPES_TABLE[arc]?.campoPessoal}`,
                }))}
              />
            </div>
          </div>

          {/* Coluna 3: Campo Pessoal & Virtudes */}
          <div className="space-y-2 bg-bg-input/30 p-2.5 rounded-xs border border-white/5">
            <div className="flex justify-between items-center pb-1 border-b border-white/5">
              <span className="text-[10px] uppercase font-data tracking-wider text-text-muted">
                Campo Pessoal (CP):
              </span>
              <span className="text-base font-mono font-bold text-gold-accent">
                {sheetData.campoPessoal}
              </span>
            </div>

            {/* Três Virtudes: Consciência, Autocontrole, Coragem */}
            <div className="space-y-1">
              {[
                { key: "consciencia", label: "Consciência", val: sheetData.virtudes.consciencia },
                { key: "autocontrole", label: "Autocontrole", val: sheetData.virtudes.autocontrole },
                { key: "coragem", label: "Coragem", val: sheetData.virtudes.coragem },
              ].map(({ key, label, val }) => (
                <div key={key} className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-data text-text-muted uppercase">{label}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleVirtudeChange(key as keyof RegrasDeOuroVirtudes, num)}
                        className={`w-2.5 h-2.5 rounded-full border transition-all cursor-pointer ${
                          val >= num
                            ? "bg-gold-accent border-gold-accent shadow-[0_0_4px_rgba(255,216,77,0.4)]"
                            : "bg-transparent border-white/20 hover:border-white/50"
                        } disabled:cursor-not-allowed`}
                        title={`${label}: ${num}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna 4: Reserva de Vitæ e Gasto/Turno */}
          <div className="space-y-2 bg-bg-input/30 p-2.5 rounded-xs border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-1 border-b border-white/5">
                <span className="text-[10px] uppercase font-data tracking-wider text-text-muted">
                  Reserva de Vitæ:
                </span>
                <span className="text-base font-mono font-bold text-blood-red">
                  {sheetData.vitae.atual} / {sheetData.vitae.maximo}
                </span>
              </div>
              <span className="text-[9px] text-text-dim font-reading block mt-0.5">
                Gasto máximo por turno: {sheetData.vitae.gastoPorTurno} Vitæ
              </span>
            </div>

            {/* Botões Rápidos de Sangue */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] uppercase font-data text-text-muted">Manipular Sangue:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={disabled || sheetData.vitae.atual <= 0}
                  onClick={() => handleBloodSpend(-1)}
                  className="px-2 py-1 bg-blood-red/20 hover:bg-blood-red text-white rounded-xs border border-blood-red/40 cursor-pointer disabled:opacity-30 text-xs font-mono font-bold min-h-[32px] flex items-center justify-center"
                  title="Gastar 1 Vitæ"
                >
                  -1
                </button>
                <button
                  type="button"
                  disabled={disabled || sheetData.vitae.atual >= sheetData.vitae.maximo}
                  onClick={() => handleBloodSpend(1)}
                  className="px-2 py-1 bg-blood-red/20 hover:bg-blood-red text-white rounded-xs border border-blood-red/40 cursor-pointer disabled:opacity-30 text-xs font-mono font-bold min-h-[32px] flex items-center justify-center"
                  title="Alimentar-se / Ganhar 1 Vitæ"
                >
                  +1
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fraqueza Canônica do Clã */}
        <div className="mt-3 p-2 bg-black/40 rounded-xs border border-white/5 flex items-start gap-2">
          <span className="text-[10px] uppercase font-data tracking-wider text-blood-red font-bold shrink-0 mt-0.5">
            Fraqueza de {currentClanDef.name}:
          </span>
          <p className="text-[11px] text-text-dim font-reading leading-relaxed">
            {currentClanDef.weakness}
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ABAS DE NAVEGAÇÃO DA FICHA (Mobile-First / Scroll Suave) */}
      {/* ======================================================== */}
      <div className="flex border-b border-white/10 gap-1 overflow-x-auto pb-px scrollbar-none">
        {[
          { key: "talentos", label: "Talentos & Anatomia", icon: "⚔️" },
          { key: "poderes", label: "Disciplinas & Palavras-Chave", icon: "🩸" },
          { key: "besta", label: "Guia da Besta & Trilha", icon: "👁️" },
          { key: "vantagens", label: "Motivações & Vantagens", icon: "📜" },
          { key: "inventario", label: "Inventário & Notas", icon: "🎒" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`px-4 py-2.5 text-xs uppercase font-data font-semibold tracking-wider transition-all cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap min-h-[44px] ${
                isActive
                  ? "border-gold-accent text-gold-accent bg-white/5"
                  : "border-transparent text-text-muted hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 3. CONTEÚDO DAS ABAS */}
      {/* ======================================================== */}

      {/* ABA 1: Talentos & Vitalidade Anatômica */}
      {activeTab === "talentos" && (
        <div className="space-y-3">
          <TalentosGrid
            talentos={sheetData.talentos}
            onChangeTalento={(key, val) => {
              handleUpdate({
                talentos: { ...sheetData.talentos, [key]: val },
              });
            }}
            onRollTalento={handleRollTalento}
            disabled={disabled}
          />

          <AnatomicalHealthTracker
            vitality={sheetData.vitalidade}
            currentBlood={sheetData.vitae.atual}
            maxBlood={sheetData.vitae.maximo}
            onChangeVitality={(newVit) => handleUpdate({ vitalidade: newVit })}
            onChangeBlood={(newBlood) => {
              handleUpdate({
                vitae: { ...sheetData.vitae, atual: newBlood },
              });
            }}
            disabled={disabled}
          />
        </div>
      )}

      {/* ABA 2: Poderes & Palavras-Chave */}
      {activeTab === "poderes" && (
        <div className="space-y-6">
          <KeywordsSection
            palavrasChave={sheetData.palavrasChave}
            onChangeKeywords={(kw) => handleUpdate({ palavrasChave: kw })}
            onInvokeKeyword={(kw) => {
              if (onRollDice) {
                onRollDice(4, 6, `Invocação da Palavra-Chave: ${kw.nome} (${kw.grau.toUpperCase()})`);
              }
            }}
            disabled={disabled}
          />

          <DisciplinesTree
            disciplinas={sheetData.disciplinas}
            onChangeDisciplinas={(disc) => handleUpdate({ disciplinas: disc })}
            rituais={sheetData.rituais || []}
            onChangeRituais={(rit) => handleUpdate({ rituais: rit })}
            disabled={disabled}
          />
        </div>
      )}

      {/* ABA 3: Guia da Besta & Trilha */}
      {activeTab === "besta" && (
        <BestaPanel
          besta={sheetData.besta}
          trilha={sheetData.trilha}
          geracao={sheetData.geracao}
          etaria={sheetData.etaria}
          onChangeBesta={(b) => handleUpdate({ besta: b })}
          onChangeTrilha={(t) =>
            handleUpdate({
              trilha: {
                nome: t.nome,
                nivel: t.nivel,
              },
            })
          }
          disabled={disabled}
        />
      )}

      {/* ABA 4: Motivações da Psique (Paixões & Grilhões) e Vantagens/Defeitos */}
      {activeTab === "vantagens" && (
        <div className="space-y-6">
          {/* Seção Superior: Motivações da Psique (Paixões e Grilhões - Módulo 08) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Paixões da Psique (7 pontos na criação) */}
            <div className="bg-bg-card/70 border border-gold-accent/30 rounded-sm p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gold-accent/20">
                <div>
                  <h4 className="text-xs font-gothic tracking-widest text-gold-accent uppercase flex items-center gap-1.5">
                    <span>Paixões da Psique</span>
                    <span className="text-[10px] font-mono text-text-dim">
                      ({totalPontosPaixoes} / 7 pts recomendados)
                    </span>
                  </h4>
                  <p className="text-[9px] text-text-dim font-reading">
                    Projetos e ideais que justificam a imortalidade.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setIsAddPaixaoOpen(true)}
                  className="px-2.5 py-1 bg-gold-accent/20 hover:bg-gold-accent text-gold-accent hover:text-black border border-gold-accent/40 rounded-xs text-[10px] uppercase font-data font-semibold tracking-wider transition-colors cursor-pointer"
                >
                  + Adicionar
                </button>
              </div>

              {(!sheetData.paixoes || sheetData.paixoes.length === 0) ? (
                <p className="text-xs text-text-dim font-reading italic">
                  Nenhuma paixão ativa. A Psique corre risco iminente de tédio e entrega à Besta.
                </p>
              ) : (
                <div className="space-y-2">
                  {sheetData.paixoes.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-bg-input/40 border border-white/5 rounded-xs flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-data font-bold text-text-primary uppercase tracking-wide">
                          {p.nome}
                        </span>
                        {p.emocao && (
                          <span className="ml-1.5 text-[10px] text-text-dim font-reading italic">
                            / {p.emocao}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gold-accent font-bold">Nível {p.nivel}</span>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => handleRemovePaixao(p.id)}
                            className="text-text-dim hover:text-hunger-red text-xs font-bold cursor-pointer transition-colors px-1"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grilhões da Psique (7 pontos na criação) */}
            <div className="bg-bg-card/70 border border-gold-accent/30 rounded-sm p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gold-accent/20">
                <div>
                  <h4 className="text-xs font-gothic tracking-widest text-gold-accent uppercase flex items-center gap-1.5">
                    <span>Grilhões da Psique</span>
                    <span className="text-[10px] font-mono text-text-dim">
                      ({totalPontosGrilhoes} / 7 pts recomendados)
                    </span>
                  </h4>
                  <p className="text-[9px] text-text-dim font-reading">
                    Entes, relíquias ou locais amados que ancoram a humanidade.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setIsAddGrilhaoOpen(true)}
                  className="px-2.5 py-1 bg-gold-accent/20 hover:bg-gold-accent text-gold-accent hover:text-black border border-gold-accent/40 rounded-xs text-[10px] uppercase font-data font-semibold tracking-wider transition-colors cursor-pointer"
                >
                  + Adicionar
                </button>
              </div>

              {(!sheetData.grilhoes || sheetData.grilhoes.length === 0) ? (
                <p className="text-xs text-text-dim font-reading italic">
                  Nenhum grilhão ativo. Sem laços com o passado mortal, a Besta sussurra mais alto.
                </p>
              ) : (
                <div className="space-y-2">
                  {sheetData.grilhoes.map((g) => (
                    <div
                      key={g.id}
                      className="p-2.5 bg-bg-input/40 border border-white/5 rounded-xs flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-data font-bold text-text-primary uppercase tracking-wide">
                          {g.nome}
                        </span>
                        {g.emocao && (
                          <span className="ml-1.5 text-[10px] text-text-dim font-reading italic">
                            / {g.emocao}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gold-accent font-bold">Nível {g.nivel}</span>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGrilhao(g.id)}
                            className="text-text-dim hover:text-hunger-red text-xs font-bold cursor-pointer transition-colors px-1"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Seção Inferior: Vantagens e Defeitos (Módulo 05) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vantagens */}
            <div className="bg-bg-card/70 border border-white/10 rounded-sm p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <div>
                  <h4 className="text-xs font-gothic tracking-widest text-green-400 uppercase">
                    Vantagens & Méritos
                  </h4>
                  <p className="text-[9px] text-text-dim font-reading">
                    Dons físicos, mentais, sociais ou sobrenaturais adquiridos.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setSelectedTraitCatalog("");
                    setCustomTraitNome("");
                    setCustomTraitPontos(1);
                    setIsAddTraitOpen("vantagem");
                  }}
                  className="px-2.5 py-1 bg-green-950/40 hover:bg-green-900 text-green-300 border border-green-500/40 rounded-xs text-[10px] uppercase font-data tracking-wider transition-colors cursor-pointer"
                >
                  + Adicionar
                </button>
              </div>

              {(!sheetData.vantagens || sheetData.vantagens.length === 0) ? (
                <p className="text-xs text-text-dim font-reading italic">
                  Nenhuma vantagem registrada.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {sheetData.vantagens.map((v) => (
                    <div
                      key={v.id}
                      className="p-2 bg-green-950/20 border border-green-500/20 rounded-xs text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="text-green-300 font-data font-semibold">{v.nome}</span>
                        <span className="ml-2 text-[9px] text-text-dim uppercase font-mono">[{v.categoria}]</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-mono font-bold">+{v.custo} pt{v.custo > 1 ? "s" : ""}</span>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTrait(v.id, "vantagem")}
                            className="text-text-dim hover:text-hunger-red text-xs font-bold cursor-pointer transition-colors px-1"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desvantagens */}
            <div className="bg-bg-card/70 border border-white/10 rounded-sm p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <div>
                  <h4 className="text-xs font-gothic tracking-widest text-hunger-red uppercase">
                    Desvantagens & Defeitos
                  </h4>
                  <p className="text-[9px] text-text-dim font-reading">
                    Sequelas e perdições que concedem pontos adicionais.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setSelectedTraitCatalog("");
                    setCustomTraitNome("");
                    setCustomTraitPontos(1);
                    setIsAddTraitOpen("desvantagem");
                  }}
                  className="px-2.5 py-1 bg-hunger-red/20 hover:bg-hunger-red text-white border border-hunger-red/40 rounded-xs text-[10px] uppercase font-data tracking-wider transition-colors cursor-pointer"
                >
                  + Adicionar
                </button>
              </div>

              {(!sheetData.desvantagens || sheetData.desvantagens.length === 0) ? (
                <p className="text-xs text-text-dim font-reading italic">
                  Nenhuma desvantagem registrada.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {sheetData.desvantagens.map((d) => (
                    <div
                      key={d.id}
                      className="p-2 bg-hunger-red/20 border border-hunger-red/20 rounded-xs text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="text-hunger-red font-data font-semibold">{d.nome}</span>
                        <span className="ml-2 text-[9px] text-text-dim uppercase font-mono">[{d.categoria}]</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-hunger-red font-mono font-bold">-{d.pontos} pt{d.pontos > 1 ? "s" : ""}</span>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTrait(d.id, "desvantagem")}
                            className="text-text-dim hover:text-hunger-red text-xs font-bold cursor-pointer transition-colors px-1"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 5: Inventário & Notas */}
      {activeTab === "inventario" && (
        <div className="space-y-4">
          <div className="bg-bg-card/70 border border-white/10 rounded-sm p-4 space-y-2">
            <h4 className="text-xs font-gothic tracking-widest text-text-primary uppercase pb-2 border-b border-white/10">
              Crônicas, Segredos & Anotações
            </h4>
            <textarea
              disabled={disabled}
              value={sheetData.notes || ""}
              onChange={(e) => handleUpdate({ notes: e.target.value })}
              placeholder="Escreva aqui anotações sobre contatos, dívidas de sangue, refúgios secretos..."
              rows={8}
              className="w-full bg-bg-input border border-white/10 rounded-sm p-3 text-xs text-text-primary focus:outline-none focus:border-gold-accent transition-colors resize-y leading-relaxed font-reading"
            />
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR PAIXÃO DA PSIQUE */}
      {isAddPaixaoOpen && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsAddPaixaoOpen(false)}
        >
          <div
            className="w-full max-w-md bg-bg-card border border-gold-accent/40 rounded-sm p-6 relative shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddPaixaoOpen(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base w-8 h-8 flex items-center justify-center rounded-xs hover:bg-white/10"
            >
              ✕
            </button>

            <h4 className="text-lg font-gothic tracking-widest text-gold-accent uppercase pb-2 border-b border-white/10">
              Registrar Paixão da Psique
            </h4>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Desejo, Projeto ou Razão de Viver
                </label>
                <input
                  type="text"
                  value={newPaixaoNome}
                  onChange={(e) => setNewPaixaoNome(e.target.value)}
                  placeholder="Ex: Proteger os inocentes, Destruir o Príncipe, Dominar a bolsa..."
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-gold-accent transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Sentimento Ancorado (Amor, Justiça, Ambição)
                </label>
                <input
                  type="text"
                  value={newPaixaoEmocao}
                  onChange={(e) => setNewPaixaoEmocao(e.target.value)}
                  placeholder="Ex: Ambição nobre, Fidelidade, Devoção..."
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-gold-accent transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Intensidade (1 a 5)
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewPaixaoNivel(lvl)}
                      className={`py-1.5 rounded-xs border text-xs font-mono font-bold transition-all cursor-pointer ${
                        newPaixaoNivel === lvl
                          ? "bg-gold-accent/30 border-gold-accent text-white"
                          : "bg-bg-input border-white/10 text-text-muted"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddPaixaoOpen(false)}
                  className="px-4 py-2 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 rounded-xs transition-colors cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!newPaixaoNome.trim()}
                  onClick={handleAddPaixao}
                  className="px-5 py-2 text-xs uppercase font-data font-semibold bg-gold-accent hover:bg-amber-400 text-black rounded-xs transition-colors cursor-pointer min-h-[40px] disabled:opacity-50"
                >
                  Confirmar Paixão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR GRILHÃO DA PSIQUE */}
      {isAddGrilhaoOpen && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsAddGrilhaoOpen(false)}
        >
          <div
            className="w-full max-w-md bg-bg-card border border-gold-accent/40 rounded-sm p-6 relative shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddGrilhaoOpen(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base w-8 h-8 flex items-center justify-center rounded-xs hover:bg-white/10"
            >
              ✕
            </button>

            <h4 className="text-lg font-gothic tracking-widest text-gold-accent uppercase pb-2 border-b border-white/10">
              Registrar Grilhão da Psique
            </h4>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Pessoa, Animal, Objeto ou Local Querido
                </label>
                <input
                  type="text"
                  value={newGrilhaoNome}
                  onChange={(e) => setNewGrilhaoNome(e.target.value)}
                  placeholder="Ex: Minha filha mortal, O relógio do pai, Meu refúgio de infância..."
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-gold-accent transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Sentimento Ancorado (Amor, Gratidão, Saudade)
                </label>
                <input
                  type="text"
                  value={newGrilhaoEmocao}
                  onChange={(e) => setNewGrilhaoEmocao(e.target.value)}
                  placeholder="Ex: Amor protetor, Saudade, Devoção sincera..."
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-gold-accent transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Intensidade (1 a 5)
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewGrilhaoNivel(lvl)}
                      className={`py-1.5 rounded-xs border text-xs font-mono font-bold transition-all cursor-pointer ${
                        newGrilhaoNivel === lvl
                          ? "bg-gold-accent/30 border-gold-accent text-white"
                          : "bg-bg-input border-white/10 text-text-muted"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddGrilhaoOpen(false)}
                  className="px-4 py-2 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 rounded-xs transition-colors cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!newGrilhaoNome.trim()}
                  onClick={handleAddGrilhao}
                  className="px-5 py-2 text-xs uppercase font-data font-semibold bg-gold-accent hover:bg-amber-400 text-black rounded-xs transition-colors cursor-pointer min-h-[40px] disabled:opacity-50"
                >
                  Confirmar Grilhão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR VANTAGEM OU DESVANTAGEM (Com Catálogo do Módulo 05) */}
      {isAddTraitOpen && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsAddTraitOpen(null)}
        >
          <div
            className={`w-full max-w-lg bg-bg-card border rounded-sm p-6 relative shadow-2xl space-y-4 ${
              isAddTraitOpen === "vantagem" ? "border-green-500/40" : "border-hunger-red/40"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddTraitOpen(null)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base w-8 h-8 flex items-center justify-center rounded-xs hover:bg-white/10"
            >
              ✕
            </button>

            <h4
              className={`text-lg font-gothic tracking-widest uppercase pb-2 border-b border-white/10 ${
                isAddTraitOpen === "vantagem" ? "text-green-400" : "text-hunger-red"
              }`}
            >
              {isAddTraitOpen === "vantagem" ? "Adicionar Vantagem" : "Adicionar Desvantagem"}
            </h4>

            <div className="space-y-4">
              {/* Catálogo Oficial */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block mb-1">
                  Catálogo Oficial (Módulo 05)
                </label>
                <GothicSelect
                  searchable
                  variant={isAddTraitOpen === "vantagem" ? "gold" : "blood"}
                  value={selectedTraitCatalog}
                  onChange={(val) => {
                    const strVal = String(val);
                    setSelectedTraitCatalog(strVal);
                    const catalog = isAddTraitOpen === "vantagem" ? VANTAGENS_CATALOGO : DESVANTAGENS_CATALOGO;
                    const found = catalog.find((item) => item.nome === strVal);
                    if (found) {
                      setCustomTraitNome(found.nome);
                      setCustomTraitCategoria(found.categoria);
                      setCustomTraitPontos(found.pontos);
                    }
                  }}
                  placeholder="Selecione do catálogo ou crie manual..."
                  options={[
                    { value: "", label: "Personalizada / Entrada Manual" },
                    ...(isAddTraitOpen === "vantagem" ? VANTAGENS_CATALOGO : DESVANTAGENS_CATALOGO).map((item) => ({
                      value: item.nome,
                      label: `${item.nome} (${item.pontos} pt${item.pontos > 1 ? "s" : ""})`,
                      description: item.resumo,
                      badge: item.categoria,
                    })),
                  ]}
                />
              </div>

              {/* Nome */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Nome
                </label>
                <input
                  type="text"
                  value={customTraitNome}
                  onChange={(e) => setCustomTraitNome(e.target.value)}
                  placeholder="Nome da característica..."
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-white/40 transition-colors"
                />
              </div>

              {/* Categoria e Pontos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                    Categoria
                  </label>
                  <GothicSelect
                    value={customTraitCategoria}
                    onChange={(val) => setCustomTraitCategoria(String(val))}
                    options={["Físico", "Mental", "Social", "Sobrenatural"]}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                    Pontos (1 a 5)
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setCustomTraitPontos(pts)}
                        className={`flex-1 py-1.5 rounded-xs border text-xs font-mono font-bold transition-all cursor-pointer ${
                          customTraitPontos === pts
                            ? isAddTraitOpen === "vantagem"
                              ? "bg-green-600/30 border-green-500 text-white"
                              : "bg-hunger-red/30 border-hunger-red text-white"
                            : "bg-bg-input border-white/10 text-text-muted"
                        }`}
                      >
                        {pts}p
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddTraitOpen(null)}
                  className="px-4 py-2 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 rounded-xs transition-colors cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!customTraitNome.trim()}
                  onClick={handleAddTrait}
                  className={`px-5 py-2 text-xs uppercase font-data font-semibold text-white rounded-xs transition-colors cursor-pointer min-h-[40px] disabled:opacity-50 ${
                    isAddTraitOpen === "vantagem"
                      ? "bg-green-700 hover:bg-green-600"
                      : "bg-hunger-red hover:bg-red-800"
                  }`}
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
