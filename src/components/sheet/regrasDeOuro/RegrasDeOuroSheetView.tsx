"use client";

import React, { useState } from "react";
import type {
  RegrasDeOuroSheetData,
  RegrasDeOuroTalentos,
  PalavraChaveItem,
  AnatomicalVitality,
  RegrasDeOuroDisciplinaAdquirida,
  RegrasDeOuroBesta,
  RegrasDeOuroTrilha,
  RegrasDeOuroVirtudes,
  BodySectorId,
} from "@/types/systems/regrasDeOuro";
import {
  ARCHETYPES_TABLE,
  CLANS_REGROURO,
  VITAE_BY_GENERATION,
} from "@/lib/systems/regrasDeOuro/constants";
import {
  calculateArchetypeBonuses,
  calculateInitialTrilha,
} from "@/lib/systems/regrasDeOuro/rules";
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
      // Parada de dados: Talento + modificador (padrão dif 6)
      onRollDice(Math.max(1, value), 6, `Teste de ${label}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-text-primary">
      {/* ======================================================== */}
      {/* 1. CABEÇALHO GÓTICO: CLÃ, ARQUÉTIPOS, GERAÇÃO & SANGUE */}
      {/* ======================================================== */}
      <div className="bg-bg-card border border-white/10 rounded-sm p-5 relative shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4 border-b border-white/10">
          {/* Coluna 1: Clã e Conceito */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] uppercase font-data tracking-widest text-text-muted block">
                Clã Vampírico
              </label>
              <select
                disabled={disabled}
                value={sheetData.cla}
                onChange={(e) => handleClanChange(e.target.value)}
                className="w-full bg-bg-input border border-white/10 rounded-xs px-2.5 py-1.5 text-xs font-gothic tracking-wider uppercase text-gold-accent focus:outline-none focus:border-gold-accent"
              >
                {clanNames.map((c) => (
                  <option key={c} value={c}>
                    {c} ({CLANS_REGROURO[c]?.nickname || ""})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-data tracking-widest text-text-muted block">
                Etária & Geração
              </label>
              <div className="flex gap-2">
                <select
                  disabled={disabled}
                  value={sheetData.etaria}
                  onChange={(e) => handleUpdate({ etaria: e.target.value as any })}
                  className="flex-1 bg-bg-input border border-white/10 rounded-xs px-2 py-1 text-xs text-text-primary focus:outline-none"
                >
                  <option value="neonato">Neonato (0-10 anos)</option>
                  <option value="neofito">Neófito (10-50 anos)</option>
                  <option value="ancilla">Ancilla (50+ anos)</option>
                </select>

                <select
                  disabled={disabled}
                  value={sheetData.geracao}
                  onChange={(e) => handleGenerationChange(Number(e.target.value))}
                  className="w-24 bg-bg-input border border-white/10 rounded-xs px-2 py-1 text-xs text-text-primary focus:outline-none"
                >
                  {[15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4].map((g) => (
                    <option key={g} value={g}>
                      {g}ª Ger.
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Coluna 2: Natureza e Máscara (40 Arquétipos) */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] uppercase font-data tracking-widest text-text-muted block">
                Natureza (Verdadeiro Eu)
              </label>
              <select
                disabled={disabled}
                value={sheetData.natureza}
                onChange={(e) => handleArchetypeChange("natureza", e.target.value)}
                className="w-full bg-bg-input border border-white/10 rounded-xs px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-gold-accent"
              >
                {archetypeNames.map((arc) => (
                  <option key={arc} value={arc}>
                    {arc} (CP: +{ARCHETYPES_TABLE[arc]?.campoPessoal}, Virt: +{ARCHETYPES_TABLE[arc]?.virtudes})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-data tracking-widest text-text-muted block">
                Máscara (Persona Social)
              </label>
              <select
                disabled={disabled}
                value={sheetData.mascara}
                onChange={(e) => handleArchetypeChange("mascara", e.target.value)}
                className="w-full bg-bg-input border border-white/10 rounded-xs px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-gold-accent"
              >
                {archetypeNames.map((arc) => (
                  <option key={arc} value={arc}>
                    {arc} (CP: +{ARCHETYPES_TABLE[arc]?.campoPessoal}, Virt: +{ARCHETYPES_TABLE[arc]?.virtudes})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coluna 3: Campo Pessoal & Virtudes */}
          <div className="space-y-2 bg-bg-input/30 p-2.5 rounded-xs border border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-data tracking-widest text-gold-accent font-semibold">
                Campo Pessoal
              </span>
              <span className="text-xs font-mono font-bold text-white bg-gold-accent/20 px-2 py-0.5 rounded-2xs border border-gold-accent/40">
                {sheetData.campoPessoal} / 10
              </span>
            </div>

            {/* Virtudes */}
            <div className="space-y-1 pt-1 border-t border-white/5 text-xs">
              {(["consciencia", "autocontrole", "coragem"] as Array<keyof RegrasDeOuroVirtudes>).map((v) => (
                <div key={v} className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-data text-text-muted capitalize">
                    {v === "consciencia" ? "Consciência" : v === "autocontrole" ? "Autocontrole" : "Coragem"}
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <button
                        key={dot}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleVirtudeChange(v, dot)}
                        className={`w-2.5 h-2.5 rounded-full border ${
                          sheetData.virtudes[v] >= dot
                            ? "bg-gold-accent border-gold-accent"
                            : "bg-transparent border-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna 4: Pontos de Sangue (Vitæ) */}
          <div className="space-y-2 bg-blood-red/10 p-2.5 rounded-xs border border-blood-red/30">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-data tracking-widest text-blood-red font-bold">
                Vitæ (Sangue)
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {sheetData.vitae.atual} / {sheetData.vitae.maximo}
              </span>
            </div>

            {/* Medidor visual de sangue */}
            <div className="w-full bg-black/50 h-3 rounded-2xs overflow-hidden border border-blood-red/40 flex">
              <div
                className="bg-blood-red transition-all duration-300 shadow-[0_0_8px_rgba(200,36,52,0.6)]"
                style={{
                  width: `${(sheetData.vitae.atual / sheetData.vitae.maximo) * 100}%`,
                }}
              />
            </div>

            <div className="flex justify-between items-center text-[9px] font-data text-text-muted">
              <span>Gasto/Turno: {sheetData.vitae.gastoPorTurno}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={disabled || sheetData.vitae.atual <= 0}
                  onClick={() => handleBloodSpend(-1)}
                  className="px-1.5 py-0.5 bg-blood-red/20 hover:bg-blood-red text-white rounded-2xs border border-blood-red/40 cursor-pointer disabled:opacity-30"
                  title="Gastar 1 Vitæ"
                >
                  -1
                </button>
                <button
                  type="button"
                  disabled={disabled || sheetData.vitae.atual >= sheetData.vitae.maximo}
                  onClick={() => handleBloodSpend(1)}
                  className="px-1.5 py-0.5 bg-blood-red/20 hover:bg-blood-red text-white rounded-2xs border border-blood-red/40 cursor-pointer disabled:opacity-30"
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
      {/* 2. ABAS DE NAVEGAÇÃO DA FICHA */}
      {/* ======================================================== */}
      <div className="flex border-b border-white/10 gap-1 overflow-x-auto pb-px">
        {[
          { key: "talentos", label: "Talentos & Vitalidade Anatômica", icon: "⚔️" },
          { key: "poderes", label: "Poderes & Palavras-Chave", icon: "🩸" },
          { key: "besta", label: "Guia da Besta & Trilha", icon: "👁️" },
          { key: "vantagens", label: "Vantagens & Antecedentes", icon: "📜" },
          { key: "inventario", label: "Inventário & Notas", icon: "🎒" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`px-4 py-2 text-xs uppercase font-data font-semibold tracking-wider transition-all cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap ${
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
        <div className="space-y-6">
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
                onRollDice(1, 6, `Invocação de Palavra-Chave: ${kw.nome}`);
              }
            }}
            disabled={disabled}
          />

          <DisciplinesTree
            disciplinas={sheetData.disciplinas as any}
            onChangeDisciplinas={(disc) => handleUpdate({ disciplinas: disc as any })}
            disabled={disabled}
          />
        </div>
      )}

      {/* ABA 3: Guia da Besta & Trilha */}
      {activeTab === "besta" && (
        <BestaPanel
          besta={{
            nivel: Math.max(1, 10 - sheetData.trilha.nivel),
            angstia: sheetData.besta.angstia,
            libido: sheetData.besta.libido,
            flagelos: (sheetData.besta.flagelos || []).map((f) => ({
              id: f.id,
              nome: f.nome,
              descricao: `Nível ${f.nivel}. Custo: ${f.custo} XP.`,
            })),
          }}
          trilha={{
            nome: sheetData.trilha.nome,
            nivel: sheetData.trilha.nivel,
            pecados: [
              "Assassinar inocente por mero capricho sádico.",
              "Alimentar-se até drenar mortal sem necessidade extrema.",
              "Causar dor atroz sem motivo ou justificativa.",
              "Roubar o sustento de quem nada tem.",
              "Ceder inteiramente ao frenesi da Besta.",
              "Trair a confiança de um aliado íntimo.",
              "Recusar auxílio a quem suplica socorro vital.",
              "Agredir mortal por pura frustração.",
              "Mentir para encobrir falta moral grave.",
              "Pensamentos vis de destruição gratuita.",
            ],
          }}
          onChangeBesta={(b) => {
            handleUpdate({
              besta: {
                ...sheetData.besta,
                angstia: b.angstia,
                libido: b.libido,
                flagelos: (b.flagelos || []).map((f: { id: string; nome: string }) => ({
                  id: f.id,
                  nome: f.nome,
                  nivel: 1,
                  custo: 0,
                })),
              },
            });
          }}
          onChangeTrilha={(t) => {
            handleUpdate({
              trilha: {
                nome: t.nome,
                nivel: t.nivel,
              },
            });
          }}
          disabled={disabled}
        />
      )}

      {/* ABA 4: Vantagens, Desvantagens e Paixões */}
      {activeTab === "vantagens" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Paixões */}
          <div className="bg-bg-card/70 border border-white/10 rounded-sm p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h4 className="text-xs font-gothic tracking-widest text-gold-accent uppercase">
                Paixões & Motivações
              </h4>
            </div>
            {sheetData.paixoes.map((p) => (
              <div key={p.id} className="p-2 bg-bg-input/40 rounded-xs flex justify-between items-center text-xs">
                <span className="font-data font-bold text-text-primary">{p.nome}</span>
                <span className="font-mono text-gold-accent">Nível {p.nivel}</span>
              </div>
            ))}
          </div>

          {/* Vantagens & Desvantagens */}
          <div className="bg-bg-card/70 border border-white/10 rounded-sm p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h4 className="text-xs font-gothic tracking-widest text-text-primary uppercase">
                Vantagens & Desvantagens
              </h4>
            </div>
            {sheetData.vantagens.length === 0 && sheetData.desvantagens.length === 0 ? (
              <p className="text-xs text-text-dim font-reading">
                Nenhum antecedente ou defeito cadastrado.
              </p>
            ) : (
              <div className="space-y-1">
                {sheetData.vantagens.map((v) => (
                  <div key={v.id} className="p-1.5 bg-green-950/20 border border-green-500/20 rounded-xs text-xs flex justify-between">
                    <span className="text-green-300 font-data">{v.nome}</span>
                    <span className="text-green-400 font-mono">+{v.custo} pts</span>
                  </div>
                ))}
                {sheetData.desvantagens.map((d) => (
                  <div key={d.id} className="p-1.5 bg-hunger-red/20 border border-hunger-red/20 rounded-xs text-xs flex justify-between">
                    <span className="text-hunger-red font-data">{d.nome}</span>
                    <span className="text-hunger-red font-mono">-{d.pontos} pts</span>
                  </div>
                ))}
              </div>
            )}
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
              className="w-full bg-bg-input border border-white/10 rounded-sm p-3 text-xs text-text-primary focus:outline-none focus:border-gold-accent transition-colors resize-y leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}
