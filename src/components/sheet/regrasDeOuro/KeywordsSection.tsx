"use client";

import React, { useState } from "react";
import type { PalavraChaveItem, PalavraChaveGrau, RegrasDeOuroTalentos } from "@/types/systems/regrasDeOuro";
import type { RegrasDeOuroKeywordsAlloc } from "@/lib/systems/regrasDeOuro/rules";
import { KEYWORD_MODIFIERS, TALENTOS_META } from "@/lib/systems/regrasDeOuro/constants";
import GothicSelect from "@/components/common/GothicSelect";

interface KeywordsSectionProps {
  palavrasChave: PalavraChaveItem[];
  onChangeKeywords: (keywords: PalavraChaveItem[]) => void;
  onInvokeKeyword?: (kw: PalavraChaveItem) => void;
  disabled?: boolean;
  keywordsAlloc?: RegrasDeOuroKeywordsAlloc;
  isDraftMode?: boolean;
  etariaLabel?: string;
}

const GRAUS_ORDER: PalavraChaveGrau[] = [
  "fraco",
  "medio",
  "bom",
  "otimo",
  "excepcional",
  "extraordinario"
];

const SUGGESTED_KEYWORDS = [
  "Combate",
  "Sobrevivência",
  "Furtividade",
  "Sedução",
  "Intimidação",
  "Lábia",
  "Investigação",
  "Erudição",
  "Ocultismo",
  "Medicina",
  "Condução",
  "Mecânica",
  "Tecnologia",
  "Artimanha",
  "Liderança",
  "Táticas Militares",
  "Subterfúgio",
  "Finanças"
];

export default function KeywordsSection({
  palavrasChave,
  onChangeKeywords,
  onInvokeKeyword,
  disabled = false,
  keywordsAlloc,
  isDraftMode = false,
  etariaLabel,
}: KeywordsSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState<PalavraChaveGrau>("bom");
  const [associatedTalent, setAssociatedTalent] = useState<keyof RegrasDeOuroTalentos | "">("");

  const getGradeStyle = (grade: PalavraChaveGrau) => {
    switch (grade) {
      case "fraco":
        return "bg-stone-900/60 text-stone-400 border-stone-600/40";
      case "medio":
        return "bg-stone-800/60 text-stone-200 border-white/20";
      case "bom":
        return "bg-blue-950/40 text-blue-300 border-blue-500/40";
      case "otimo":
        return "bg-amber-950/40 text-amber-300 border-amber-500/40";
      case "excepcional":
        return "bg-purple-950/50 text-purple-300 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.2)]";
      case "extraordinario":
        return "bg-rose-950/60 text-rose-300 border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]";
    }
  };

  const handleAddKeyword = () => {
    if (!newName.trim()) return;
    const newEntry: PalavraChaveItem = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `kw-${Date.now()}`,
      nome: newName.trim(),
      grau: newGrade,
      talentoAssociado: associatedTalent ? associatedTalent : undefined,
    };
    onChangeKeywords([...palavrasChave, newEntry]);
    setNewName("");
    setNewGrade("bom");
    setAssociatedTalent("");
    setIsAddModalOpen(false);
  };

  const handleRemoveKeyword = (id: string) => {
    onChangeKeywords(palavrasChave.filter((kw) => kw.id !== id));
  };

  const handleCycleGrade = (id: string, currentGrade: PalavraChaveGrau) => {
    const currentIndex = GRAUS_ORDER.indexOf(currentGrade);
    const nextGrade = GRAUS_ORDER[(currentIndex + 1) % GRAUS_ORDER.length];
    onChangeKeywords(
      palavrasChave.map((kw) => (kw.id === id ? { ...kw, grau: nextGrade } : kw))
    );
  };

  return (
    <div className="bg-bg-card/70 border border-white/10 rounded-sm p-4 relative shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
      {/* Cabeçalho da Seção */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
        <div>
          <h3 className="text-sm font-gothic tracking-widest text-gold-accent uppercase flex items-center gap-2">
            <span>Palavras-Chave</span>
            <span className="text-[10px] font-data text-text-dim lowercase tracking-normal font-normal">
              (Adjetivos que somam modificadores diretos à parada de dados)
            </span>
          </h3>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsAddModalOpen(true)}
          className="px-2.5 py-1 bg-gold-accent/15 hover:bg-gold-accent text-gold-accent hover:text-bg-main border border-gold-accent/40 rounded-xs text-[10px] uppercase font-data font-semibold tracking-wider transition-all cursor-pointer disabled:opacity-50"
        >
          + Adicionar Palavra-Chave
        </button>
      </div>

      {/* Dicas e Cotas na Criação (Modo Draft) */}
      {isDraftMode && keywordsAlloc && (
        <div className="mb-3 p-2.5 bg-black/50 border border-white/10 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-data px-2.5 py-0.5 rounded-xs border uppercase font-bold tracking-wider ${
                keywordsAlloc.bomRemaining === 0
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                  : keywordsAlloc.bomRemaining > 0
                  ? "bg-amber-950/60 border-amber-500/40 text-amber-400"
                  : "bg-red-950/60 border-red-500/40 text-red-400"
              }`}
            >
              Bom: {keywordsAlloc.bomAtuais} / {keywordsAlloc.bomPermitido}
              {keywordsAlloc.bomRemaining === 0 ? " ✓" : ` (${keywordsAlloc.bomRemaining} rest.)`}
            </span>
            <span
              className={`text-xs font-data px-2.5 py-0.5 rounded-xs border uppercase font-bold tracking-wider ${
                keywordsAlloc.otimoRemaining === 0
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                  : keywordsAlloc.otimoRemaining > 0
                  ? "bg-amber-950/60 border-amber-500/40 text-amber-400"
                  : "bg-red-950/60 border-red-500/40 text-red-400"
              }`}
            >
              Ótimo: {keywordsAlloc.otimoAtuais} / {keywordsAlloc.otimoBase}
              {keywordsAlloc.otimoRemaining === 0 ? " ✓" : ` (${keywordsAlloc.otimoRemaining} rest.)`}
            </span>
            <span className="text-xs font-data px-2.5 py-0.5 rounded-xs border border-stone-600/40 bg-stone-900/60 text-stone-400 uppercase font-bold tracking-wider">
              Fraco: {keywordsAlloc.fracosAtuais} (Base: {keywordsAlloc.fracoBase} | Extras: {keywordsAlloc.fracosExtras}/{keywordsAlloc.maxFracosExtras})
            </span>
          </div>
          <span className="text-[11px] font-data text-gold-accent/80 bg-gold-accent/10 border border-gold-accent/20 px-2 py-0.5 rounded-xs normal-case tracking-normal">
            💡 Câmbio: 1 Fraco extra = +2 Bom | 4 Bom = 1 Ótimo | 4 Ótimo = 1 Excepcional
          </span>
        </div>
      )}

      {/* Lista de Palavras-Chave */}
      {palavrasChave.length === 0 ? (
        <div
          onClick={() => !disabled && setIsAddModalOpen(true)}
          className="p-6 border border-dashed border-white/10 rounded-xs text-center cursor-pointer hover:border-gold-accent/40 transition-colors"
        >
          <p className="text-xs text-text-muted font-reading">
            Nenhuma Palavra-Chave forjada. Clique aqui para registrar especialidades, conceitos ou perícias de destaque.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {palavrasChave.map((kw) => {
            const modInfo = KEYWORD_MODIFIERS[kw.grau];
            const badgeStyle = getGradeStyle(kw.grau);

            return (
              <div
                key={kw.id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-sm border ${badgeStyle} transition-all`}
              >
                {/* Nome & Invocação */}
                <div
                  className="cursor-pointer select-none"
                  onClick={() => onInvokeKeyword?.(kw)}
                  title={`Invocar ${kw.nome} (${modInfo.label})`}
                >
                  <span className="text-xs font-data font-bold tracking-wider">
                    {kw.nome}
                  </span>
                  {kw.talentoAssociado && (
                    <span className="text-[9px] text-text-dim ml-1 font-reading">
                      [{kw.talentoAssociado}]
                    </span>
                  )}
                </div>

                {/* Badge de Grau Clicável */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleCycleGrade(kw.id, kw.grau)}
                  className="px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold uppercase tracking-wider bg-black/40 hover:bg-black/70 cursor-pointer transition-colors"
                  title="Clique para alternar o Grau"
                >
                  {modInfo.label}
                </button>

                {/* Botão de Excluir */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw.id)}
                    className="text-text-dim hover:text-hunger-red transition-colors text-xs font-bold leading-none cursor-pointer px-0.5"
                    title="Remover Palavra-Chave"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Adicionar Palavra-Chave */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-bg-card border border-gold-accent/40 rounded-sm p-6 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base"
            >
              ✕
            </button>

            <h4 className="text-lg font-gothic tracking-widest text-gold-accent uppercase pb-2 border-b border-white/5 mb-4">
              Atribuir Palavra-Chave
            </h4>

            <div className="space-y-4">
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Nome da Palavra-Chave
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Combate, Sobrevivência, Furtivo, Sedução..."
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-gold-accent transition-colors"
                />
              </div>

              {/* Grau */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Grau de Poder
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GRAUS_ORDER.map((grade) => {
                    const info = KEYWORD_MODIFIERS[grade];
                    const isSelected = newGrade === grade;
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => setNewGrade(grade)}
                        className={`p-2 rounded-xs border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-gold-accent/20 border-gold-accent text-white"
                            : "bg-bg-input border-white/10 text-text-muted hover:border-white/20"
                        }`}
                      >
                        <div className="text-xs font-mono font-bold capitalize">{grade}</div>
                        <div className="text-[10px] text-text-dim">{info.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Talento Associado Opcional */}
              {(newGrade === "excepcional" || newGrade === "extraordinario") && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-data text-amber-400 block">
                    Talento Bonificado (+1 ou +2 pontos permanentes)
                  </label>
                  <GothicSelect
                    variant="gold"
                    value={associatedTalent || ""}
                    onChange={(val) => setAssociatedTalent(val as keyof RegrasDeOuroTalentos)}
                    placeholder="Nenhum talento associado"
                    options={[
                      { value: "", label: "Nenhum talento associado" },
                      ...TALENTOS_META.map((t) => ({
                        value: t.key,
                        label: `${t.label} (${t.category === "fisico" ? "Físico" : "Mental"})`,
                        badge: t.category === "fisico" ? "FÍS" : "MEN",
                      })),
                    ]}
                  />
                </div>
              )}

              {/* Sugestões Rápidas */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Sugestões Rápidas do Livro
                </label>
                <div className="max-h-24 overflow-y-auto border border-white/5 rounded-xs p-2 bg-black/20 flex flex-wrap gap-1.5">
                  {SUGGESTED_KEYWORDS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setNewName(sug)}
                      className="px-2 py-0.5 rounded-xs text-[10px] font-data bg-white/5 hover:bg-gold-accent/20 hover:text-gold-accent border border-white/5 hover:border-gold-accent/30 text-text-muted transition-colors cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ações */}
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
                  disabled={!newName.trim()}
                  onClick={handleAddKeyword}
                  className="px-4 py-1.5 text-xs uppercase font-data font-semibold bg-gold-accent hover:bg-yellow-600 text-bg-main rounded-xs transition-colors cursor-pointer disabled:opacity-50"
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
