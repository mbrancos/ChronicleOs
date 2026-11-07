"use client";

import React, { useState } from "react";
import type { GuiaDaBestaData, RegrasDeOuroTrilha } from "@/types/systems/regrasDeOuro";
import {
  FLAGELOS_CATALOGO,
  PANIC_TABLE,
  SIMBOLISMOS_ARCANOS,
  calculateInitialFlageloPoints,
  type FlageloCanonico,
  type SimbolismoArcano,
} from "@/lib/systems/regrasDeOuro/constants";
import GothicSelect from "@/components/common/GothicSelect";
import SolidHeaderBanner from "@/components/common/SolidHeaderBanner";

interface BestaPanelProps {
  besta: GuiaDaBestaData;
  trilha: RegrasDeOuroTrilha;
  geracao?: number;
  etaria?: "neonato" | "neofito" | "ancilla";
  onChangeBesta: (besta: GuiaDaBestaData) => void;
  onChangeTrilha: (trilha: RegrasDeOuroTrilha) => void;
  disabled?: boolean;
  isDraftMode?: boolean;
}

export default function BestaPanel({
  besta,
  trilha,
  geracao = 13,
  etaria = "neonato",
  onChangeBesta,
  onChangeTrilha,
  disabled = false,
  isDraftMode = false,
}: BestaPanelProps) {
  const [panicRollResult, setPanicRollResult] = useState<{
    roll: number;
    effect: string;
    actionLostTurns?: number;
    isFaint?: boolean;
    peculiaridade?: boolean;
  } | null>(null);

  // Modais
  const [isAddFlageloOpen, setIsAddFlageloOpen] = useState(false);
  const [selectedCatalogFlagelo, setSelectedCatalogFlagelo] = useState<string>("");
  const [customFlageloNome, setCustomFlageloNome] = useState("");
  const [customFlageloDesc, setCustomFlageloDesc] = useState("");
  const [customFlageloCusto, setCustomFlageloCusto] = useState<number>(1);
  const [customFlageloTipo, setCustomFlageloTipo] = useState<"branco" | "vermelho">("branco");

  const [isAddPaixaoObscuraOpen, setIsAddPaixaoObscuraOpen] = useState(false);
  const [newPaixaoNome, setNewPaixaoNome] = useState("");
  const [newPaixaoEmocao, setNewPaixaoEmocao] = useState("");
  const [newPaixaoNivel, setNewPaixaoNivel] = useState(2);

  const [isAddGrilhaoObscuroOpen, setIsAddGrilhaoObscuroOpen] = useState(false);
  const [newGrilhaoNome, setNewGrilhaoNome] = useState("");
  const [newGrilhaoEmocao, setNewGrilhaoEmocao] = useState("");
  const [newGrilhaoNivel, setNewGrilhaoNivel] = useState(2);

  const [expandedSection, setExpandedSection] = useState<"evangelho" | "reliquias" | null>(null);

  // Angústia Permanente = 10 - Trilha
  const angustiaPermanente = Math.max(1, 10 - trilha.nivel);
  const pontosAngustia = besta.pontosAngustia ?? 0;
  const initialFlageloBudget = calculateInitialFlageloPoints(trilha.nivel, geracao, etaria);
  const spentFlageloPoints = (besta.flagelos || []).reduce((acc, f) => acc + (f.custo || 1), 0);
  const remainingFlagelos = initialFlageloBudget - spentFlageloPoints;

  const etariaKey = (etaria || "neonato") as "neonato" | "neofito" | "ancilla";
  const bestaPaixoesQuota = etariaKey === "ancilla" ? 10 : etariaKey === "neofito" ? 7 : 4;
  const spentPaixoesObscuras = (besta.paixoesObscuras || []).reduce((acc, p) => acc + (p.nivel || 0), 0);
  const remainingPaixoesObscuras = bestaPaixoesQuota - spentPaixoesObscuras;

  const bestaGrilhoesQuota = etariaKey === "ancilla" ? 10 : etariaKey === "neofito" ? 7 : 4;
  const spentGrilhoesObscuros = (besta.grilhoesObscuros || []).reduce((acc, g) => acc + (g.nivel || 0), 0);
  const remainingGrilhoesObscuros = bestaGrilhoesQuota - spentGrilhoesObscuros;

  // Simbolismo Arcano Atual
  const currentSimbolismoNome = besta.simbolismoArcano || "O Lobo";
  const currentSimbolismo =
    SIMBOLISMOS_ARCANOS.find((s) => s.nome === currentSimbolismoNome || s.id === currentSimbolismoNome) ||
    SIMBOLISMOS_ARCANOS[1];

  // Rolar teste de Pânico
  const handleRollPanic = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const matched = PANIC_TABLE.find((entry) => roll >= entry.minRoll) || PANIC_TABLE[PANIC_TABLE.length - 1];
    setPanicRollResult({
      roll,
      effect: matched.effect,
      actionLostTurns: matched.actionLostTurns,
      isFaint: matched.isFaint,
      peculiaridade: matched.peculiaridade,
    });
  };

  // Alterar Simbolismo
  const handleSelectSimbolismo = (nome: string) => {
    onChangeBesta({
      ...besta,
      simbolismoArcano: nome,
    });
  };

  // Adicionar Flagelo
  const handleAddFlagelo = () => {
    let nome = customFlageloNome.trim();
    let descricao = customFlageloDesc.trim();
    let custo = customFlageloCusto;
    let tipo = customFlageloTipo;

    if (selectedCatalogFlagelo) {
      const catalogItem = FLAGELOS_CATALOGO.find((f: FlageloCanonico) => f.nome === selectedCatalogFlagelo);
      if (catalogItem) {
        nome = catalogItem.nome;
        descricao = catalogItem.resumo;
        custo = catalogItem.custo;
        tipo = catalogItem.tipo;
      }
    }

    if (!nome) return;

    const newEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `flag-${Date.now()}`,
      nome,
      descricao: descricao || "Flagelo comportamental da Besta.",
      nivel: 1,
      custo,
      tipo,
    };

    onChangeBesta({
      ...besta,
      flagelos: [...(besta.flagelos || []), newEntry],
    });

    setSelectedCatalogFlagelo("");
    setCustomFlageloNome("");
    setCustomFlageloDesc("");
    setCustomFlageloCusto(1);
    setIsAddFlageloOpen(false);
  };

  const handleRemoveFlagelo = (id: string) => {
    onChangeBesta({
      ...besta,
      flagelos: (besta.flagelos || []).filter((f) => f.id !== id),
    });
  };

  // Paixões Obscuras
  const handleAddPaixaoObscura = () => {
    if (!newPaixaoNome.trim()) return;
    const newEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `po-${Date.now()}`,
      nome: newPaixaoNome.trim(),
      emocao: newPaixaoEmocao.trim() || undefined,
      nivel: newPaixaoNivel,
    };
    onChangeBesta({
      ...besta,
      paixoesObscuras: [...(besta.paixoesObscuras || []), newEntry],
    });
    setNewPaixaoNome("");
    setNewPaixaoEmocao("");
    setNewPaixaoNivel(2);
    setIsAddPaixaoObscuraOpen(false);
  };

  const handleRemovePaixaoObscura = (id: string) => {
    onChangeBesta({
      ...besta,
      paixoesObscuras: (besta.paixoesObscuras || []).filter((p) => p.id !== id),
    });
  };

  // Grilhões Obscuros
  const handleAddGrilhaoObscuro = () => {
    if (!newGrilhaoNome.trim()) return;
    const newEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `go-${Date.now()}`,
      nome: newGrilhaoNome.trim(),
      emocao: newGrilhaoEmocao.trim() || undefined,
      nivel: newGrilhaoNivel,
    };
    onChangeBesta({
      ...besta,
      grilhoesObscuros: [...(besta.grilhoesObscuros || []), newEntry],
    });
    setNewGrilhaoNome("");
    setNewGrilhaoEmocao("");
    setNewGrilhaoNivel(2);
    setIsAddGrilhaoObscuroOpen(false);
  };

  const handleRemoveGrilhaoObscuro = (id: string) => {
    onChangeBesta({
      ...besta,
      grilhoesObscuros: (besta.grilhoesObscuros || []).filter((g) => g.id !== id),
    });
  };

  return (
    <div className="space-y-5">
      {/* Banner Principal da Besta (The Beast Within) */}
      <div className="rounded-sm overflow-hidden border border-crimson-blood/40 shadow-[0_4px_24px_rgba(200,36,52,0.12)]">
        <SolidHeaderBanner
          title="THE BEAST WITHIN • O MONSTRO INTERIOR"
          subtitle="Angústia, Libido Reprimida e Flagelos da Besta"
          icon="💀"
          badge={`Angústia Perm: ${angustiaPermanente}`}
          variant="crimson"
          action={
            <button
              type="button"
              disabled={disabled}
              onClick={handleRollPanic}
              className="px-2.5 py-1 bg-crimson-blood text-white rounded-xs text-[10px] uppercase font-condensed font-bold tracking-wider hover:bg-crimson-blood/80 transition-all cursor-pointer shadow-[0_0_8px_rgba(200,36,52,0.4)] disabled:opacity-50"
            >
              🎲 Teste de Pânico
            </button>
          }
        />
      </div>

      {/* Grade com Trilha da Sabedoria e Medidores da Besta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Painel da Trilha de Sabedoria */}
        <div className="bg-bg-card/70 border border-gold-accent/30 rounded-sm p-4 relative shadow-[0_4px_16px_rgba(212,175,55,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gold-accent/20">
              <div>
                <h3 className="text-sm font-gothic tracking-widest text-gold-accent uppercase flex items-center gap-2">
                  <span>{trilha.nome || "Trilha de Sabedoria"}</span>
                </h3>
                <p className="text-[10px] text-text-dim font-reading">
                  Âncora moral que separa o monstro do predador lúcido.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-gold-accent">
                  Nível {trilha.nivel}
                </span>
              </div>
            </div>

            {/* Dots da Trilha (1 a 10) com Touch Target Generoso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-data tracking-wider text-text-muted">
                  Grau de Iluminação Moral (1 a 10)
                </span>
                <span className="text-[10px] font-mono text-gold-accent font-bold">
                  {trilha.nivel} / 10
                </span>
              </div>

              <div className="flex items-center gap-1 bg-black/30 p-2 rounded-xs border border-white/5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const filled = trilha.nivel >= num;
                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={disabled}
                      onClick={() => onChangeTrilha({ ...trilha, nivel: num })}
                      className="flex-1 p-1 cursor-pointer flex items-center justify-center disabled:cursor-not-allowed group"
                      title={`Trilha nível ${num}`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border transition-all block ${
                          filled
                            ? "bg-gold-accent border-gold-accent shadow-[0_0_6px_rgba(255,216,77,0.5)]"
                            : "bg-transparent border-white/20 group-hover:border-white/50"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Pecado do Nível Atual */}
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-xs mt-3">
                <span className="text-[9px] uppercase font-data tracking-widest text-gold-accent block mb-1">
                  Hierarquia de Pecados (Nível {trilha.nivel})
                </span>
                <p className="text-xs text-text-primary font-reading italic leading-relaxed">
                  {trilha.pecados?.[trilha.nivel - 1] ||
                    "Transgredir a dignidade moral e entregar-se aos impulsos primais."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-data text-text-dim">
            <span>Relação com a Besta:</span>
            <span className="font-mono text-gold-accent">
              Trilha ({trilha.nivel}) + Angústia Perm. ({angustiaPermanente}) = 10
            </span>
          </div>
        </div>

        {/* Medidores da Besta: Ângstia Permanente, Pontos Voláteis & Líbido */}
        <div className="bg-bg-card/70 border border-blood-red/30 rounded-sm p-4 relative shadow-[0_4px_16px_rgba(200,36,52,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-blood-red/20">
              <div>
                <h3 className="text-sm font-gothic tracking-widest text-blood-red uppercase flex items-center gap-2">
                  <span>Guia da Besta</span>
                  <span className="text-[10px] font-mono text-text-dim">
                    Angústia Perm: {angustiaPermanente}
                  </span>
                </h3>
                <p className="text-[10px] text-text-dim font-reading">
                  O adversário interior conduzido por outro jogador da crônica.
                </p>
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={handleRollPanic}
                className="px-2.5 py-1.5 bg-hunger-red/20 hover:bg-hunger-red/40 text-hunger-red border border-hunger-red/40 rounded-xs text-[10px] uppercase font-data font-bold tracking-wider transition-colors cursor-pointer shadow-[0_0_6px_rgba(230,36,36,0.2)] disabled:opacity-50 min-h-[36px]"
              >
                🎲 Teste de Pânico
              </button>
            </div>

            <div className="space-y-3">
              {/* Pontos de Angústia Volátil (0 a 10) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] uppercase font-data tracking-wider text-text-muted">
                    Pontos de Angústia Volátil ({pontosAngustia} / 10)
                  </span>
                  <span className="text-[9px] text-text-dim font-reading">
                    Reserva volátil para ativar Flagelos
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-black/30 p-2 rounded-xs border border-white/5">
                  {/* Botão Menos */}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() =>
                        onChangeBesta({
                          ...besta,
                          pontosAngustia: Math.max(0, pontosAngustia - 1),
                        })
                      }
                      className="w-5 h-5 flex items-center justify-center text-text-dim hover:text-white text-xs font-mono rounded-2xs hover:bg-white/10 cursor-pointer"
                    >
                      -
                    </button>
                  )}

                  {Array.from({ length: 10 }).map((_, idx) => {
                    const filled = pontosAngustia > idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          const next = idx + 1;
                          onChangeBesta({
                            ...besta,
                            pontosAngustia: pontosAngustia === next ? idx : next,
                          });
                        }}
                        className="flex-1 p-0.5 cursor-pointer flex items-center justify-center"
                        title={`Ponto de Angústia ${idx + 1}`}
                      >
                        <span
                          className={`w-full h-3 rounded-2xs border transition-all block ${
                            filled
                              ? "bg-blood-red border-blood-red shadow-[0_0_5px_rgba(200,36,52,0.6)]"
                              : "bg-transparent border-white/20 hover:border-white/40"
                          }`}
                        />
                      </button>
                    );
                  })}

                  {/* Botão Mais */}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() =>
                        onChangeBesta({
                          ...besta,
                          pontosAngustia: Math.min(10, pontosAngustia + 1),
                        })
                      }
                      className="w-5 h-5 flex items-center justify-center text-text-dim hover:text-white text-xs font-mono rounded-2xs hover:bg-white/10 cursor-pointer"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              {/* Medidor de Líbido (1 a 10) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] uppercase font-data tracking-wider text-text-muted">
                    Líbido ({besta.libido} / 10)
                  </span>
                  <span className="text-[9px] text-text-dim font-reading">
                    Fúria carnal e volúpia instintiva
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-black/30 p-2 rounded-xs border border-white/5">
                  {/* Botão Menos */}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() =>
                        onChangeBesta({
                          ...besta,
                          libido: Math.max(1, (besta.libido ?? 1) - 1),
                        })
                      }
                      className="w-5 h-5 flex items-center justify-center text-text-dim hover:text-white text-xs font-mono rounded-2xs hover:bg-white/10 cursor-pointer"
                    >
                      -
                    </button>
                  )}

                  {Array.from({ length: 10 }).map((_, idx) => {
                    const filled = (besta.libido ?? 1) > idx;
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
                        className="flex-1 p-0.5 cursor-pointer flex items-center justify-center"
                        title={`Líbido ${idx + 1}`}
                      >
                        <span
                          className={`w-full h-3 rounded-2xs border transition-all block ${
                            filled
                              ? "bg-purple-600 border-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]"
                              : "bg-transparent border-white/20 hover:border-white/40"
                          }`}
                        />
                      </button>
                    );
                  })}

                  {/* Botão Mais */}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() =>
                        onChangeBesta({
                          ...besta,
                          libido: Math.min(10, (besta.libido ?? 1) + 1),
                        })
                      }
                      className="w-5 h-5 flex items-center justify-center text-text-dim hover:text-white text-xs font-mono rounded-2xs hover:bg-white/10 cursor-pointer"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-data text-text-dim">
            <span>Parada de dados base da Besta:</span>
            <span className="font-mono text-blood-red font-bold">
              {angustiaPermanente} dados (vs Psique)
            </span>
          </div>
        </div>
      </div>

      {/* Simbolismo Arcano da Besta (Os 5 Arquétipos Arcanos do Guia) */}
      <div className="bg-bg-card/70 border border-blood-red/40 rounded-sm p-4 relative shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-white/10">
          <div>
            <span className="text-[9px] uppercase font-data tracking-widest text-blood-red block font-bold">
              Arquétipo Oculto da Fera
            </span>
            <h4 className="text-base font-gothic tracking-wider text-white uppercase flex items-center gap-2">
              <span>Simbolismo Arcano: {currentSimbolismo.nome}</span>
            </h4>
            <p className="text-[11px] text-text-dim font-reading">
              {currentSimbolismo.subtitulo}
            </p>
          </div>

          {/* Seletor Customizado do Simbolismo Arcano */}
          <div className="w-full sm:w-64">
            <GothicSelect
              variant="blood"
              value={currentSimbolismoNome}
              onChange={(val) => handleSelectSimbolismo(String(val))}
              options={SIMBOLISMOS_ARCANOS.map((s: SimbolismoArcano) => ({
                value: s.nome,
                label: s.nome,
                description: s.subtitulo,
              }))}
            />
          </div>
        </div>

        {/* Detalhes do Simbolismo */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-black/30 border border-white/5 rounded-xs space-y-1">
            <span className="text-[9px] uppercase font-data tracking-wider text-amber-400 block font-bold">
              Filosofia Predatória:
            </span>
            <p className="text-xs text-text-primary font-reading leading-relaxed">
              {currentSimbolismo.filosofia}
            </p>
          </div>

          <div className="p-3 bg-black/30 border border-green-500/20 rounded-xs space-y-1">
            <span className="text-[9px] uppercase font-data tracking-wider text-green-400 block font-bold">
              Vantagem Mecânica no Frenesi:
            </span>
            <p className="text-xs text-text-primary font-reading leading-relaxed">
              {currentSimbolismo.vantagem}
            </p>
          </div>

          <div className="p-3 bg-black/30 border border-blood-red/20 rounded-xs space-y-1">
            <span className="text-[9px] uppercase font-data tracking-wider text-hunger-red block font-bold">
              Desvantagem / Fraqueza:
            </span>
            <p className="text-xs text-text-primary font-reading leading-relaxed">
              {currentSimbolismo.desvantagem}
            </p>
          </div>
        </div>

        {/* Botão de Alternar Evangelho da Besta */}
        <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center">
          <button
            type="button"
            onClick={() => setExpandedSection(expandedSection === "evangelho" ? null : "evangelho")}
            className="text-[10px] uppercase font-data text-gold-accent hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>{expandedSection === "evangelho" ? "▼ Ocultar" : "▶ Ver"} O Evangelho de {currentSimbolismo.nome} ({currentSimbolismo.evangelho.length} Mandamentos)</span>
          </button>
        </div>

        {expandedSection === "evangelho" && (
          <div className="mt-3 p-3 bg-black/50 border border-gold-accent/20 rounded-xs space-y-2 animate-fade-in">
            <span className="text-[9px] uppercase font-data tracking-widest text-gold-accent block font-bold">
              Diretrizes para o Guia da Besta:
            </span>
            <ol className="list-decimal list-inside space-y-1 text-xs text-text-muted font-reading">
              {currentSimbolismo.evangelho.map((mandamento: string, idx: number) => (
                <li key={idx} className="leading-relaxed">
                  <span className="text-text-primary">{mandamento}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Seção Dupla: Paixões Obscuras e Grilhões Obscuros da Besta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Paixões Obscuras (Definidas pelo Guia da Besta) */}
        <div className="bg-bg-card/70 border border-white/10 rounded-sm p-4 relative">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
            <div>
              <h4 className="text-xs font-gothic tracking-widest text-blood-red uppercase flex flex-wrap items-center gap-2">
                <span>Paixões Obscuras</span>
                {isDraftMode && (
                  <span
                    className={`text-[10px] font-data px-2 py-0.5 rounded-xs border font-bold uppercase tracking-wider ${
                      remainingPaixoesObscuras === 0
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
                        : remainingPaixoesObscuras > 0
                        ? "bg-amber-950/60 border-amber-500/40 text-amber-400"
                        : "bg-red-950/60 border-red-500/40 text-red-400"
                    }`}
                  >
                    {remainingPaixoesObscuras === 0
                      ? "🟢 0 Rest. ✓"
                      : `${spentPaixoesObscuras}/${bestaPaixoesQuota} pts (${remainingPaixoesObscuras} rest.)`}
                  </span>
                )}
              </h4>
              <p className="text-[9px] text-text-dim font-reading">
                Desejos inconfessáveis e perversões conduzidas pelo Guia da Besta (Cota: {bestaPaixoesQuota} pts).
              </p>
            </div>

            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsAddPaixaoObscuraOpen(true)}
              className="px-2.5 py-1 bg-blood-red/20 hover:bg-blood-red text-white border border-blood-red/40 rounded-xs text-[10px] uppercase font-data tracking-wider transition-colors cursor-pointer"
            >
              + Adicionar
            </button>
          </div>

          {(!besta.paixoesObscuras || besta.paixoesObscuras.length === 0) ? (
            <p className="text-xs text-text-dim font-reading italic">
              Nenhuma paixão obscura estabelecida pelo Guia da Besta.
            </p>
          ) : (
            <div className="space-y-2">
              {besta.paixoesObscuras.map((po) => (
                <div
                  key={po.id}
                  className="p-2.5 bg-bg-input/50 border border-blood-red/20 rounded-xs flex justify-between items-center"
                >
                  <div>
                    <span className="text-xs font-data font-bold text-text-primary uppercase tracking-wide">
                      {po.nome}
                    </span>
                    {po.emocao && (
                      <span className="ml-1.5 text-[10px] text-text-dim font-reading italic">
                        / {po.emocao}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blood-red">
                      Nív. {po.nivel}
                    </span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemovePaixaoObscura(po.id)}
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

        {/* Grilhões Obscuros (Elos de Culpa, Rancor e Trauma) */}
        <div className="bg-bg-card/70 border border-white/10 rounded-sm p-4 relative">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
            <div>
              <h4 className="text-xs font-gothic tracking-widest text-hunger-red uppercase flex flex-wrap items-center gap-2">
                <span>Grilhões Obscuros</span>
                {isDraftMode && (
                  <span
                    className={`text-[10px] font-data px-2 py-0.5 rounded-xs border font-bold uppercase tracking-wider ${
                      remainingGrilhoesObscuros === 0
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
                        : remainingGrilhoesObscuros > 0
                        ? "bg-amber-950/60 border-amber-500/40 text-amber-400"
                        : "bg-red-950/60 border-red-500/40 text-red-400"
                    }`}
                  >
                    {remainingGrilhoesObscuros === 0
                      ? "🟢 0 Rest. ✓"
                      : `${spentGrilhoesObscuros}/${bestaGrilhoesQuota} pts (${remainingGrilhoesObscuros} rest.)`}
                  </span>
                )}
              </h4>
              <p className="text-[9px] text-text-dim font-reading">
                Entes ou locais que despertam rancor, amargura e culpa profunda (Cota: {bestaGrilhoesQuota} pts).
              </p>
            </div>

            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsAddGrilhaoObscuroOpen(true)}
              className="px-2.5 py-1 bg-hunger-red/20 hover:bg-hunger-red text-white border border-hunger-red/40 rounded-xs text-[10px] uppercase font-data tracking-wider transition-colors cursor-pointer"
            >
              + Adicionar
            </button>
          </div>

          {(!besta.grilhoesObscuros || besta.grilhoesObscuros.length === 0) ? (
            <p className="text-xs text-text-dim font-reading italic">
              Nenhum grilhão obscuro estabelecido pelo Guia da Besta.
            </p>
          ) : (
            <div className="space-y-2">
              {besta.grilhoesObscuros.map((go) => (
                <div
                  key={go.id}
                  className="p-2.5 bg-bg-input/50 border border-hunger-red/20 rounded-xs flex justify-between items-center"
                >
                  <div>
                    <span className="text-xs font-data font-bold text-text-primary uppercase tracking-wide">
                      {go.nome}
                    </span>
                    {go.emocao && (
                      <span className="ml-1.5 text-[10px] text-text-dim font-reading italic">
                        / {go.emocao}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-hunger-red">
                      Nív. {go.nivel}
                    </span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGrilhaoObscuro(go.id)}
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

      {/* Flagelos da Besta (Com Catálogo dos 13 Brancos e 25 Vermelhos) */}
      <div className="bg-bg-card/70 border border-white/10 rounded-sm p-4 relative">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3 pb-2 border-b border-white/10">
          <div>
            <h4 className="text-xs font-gothic tracking-widest text-text-primary uppercase flex flex-wrap items-center gap-2">
              <span>Flagelos da Besta</span>
              <span className="text-[10px] font-mono text-blood-red font-bold">
                ({spentFlageloPoints} / {initialFlageloBudget} pts gastos)
              </span>
              {isDraftMode && (
                <span
                  className={`text-[10px] font-data px-2 py-0.5 rounded-xs border font-bold uppercase tracking-wider ${
                    remainingFlagelos === 0
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
                      : remainingFlagelos > 0
                      ? "bg-amber-950/60 border-amber-500/40 text-amber-400"
                      : "bg-red-950/60 border-red-500/40 text-red-400"
                  }`}
                >
                  {remainingFlagelos === 0
                    ? "🟢 0 Rest. ✓"
                    : `${remainingFlagelos} ${remainingFlagelos === 1 ? "ponto rest." : "pontos rest."}`}
                </span>
              )}
            </h4>
            <p className="text-[10px] text-text-dim font-reading">
              Poderes psíquicos e sobrenaturais da Besta empregados contra a Psique (Orçamento: {initialFlageloBudget} pts).
            </p>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsAddFlageloOpen(true)}
            className="px-3 py-1.5 bg-blood-red/20 hover:bg-blood-red text-white border border-blood-red/40 rounded-xs text-[10px] uppercase font-data font-semibold tracking-wider transition-colors cursor-pointer self-start sm:self-auto min-h-[36px]"
          >
            + Adicionar Flagelo
          </button>
        </div>

        {(!besta.flagelos || besta.flagelos.length === 0) ? (
          <p className="text-xs text-text-dim font-reading italic">
            Nenhum flagelo ativo. Clique no botão acima para escolher entre os 38 Flagelos Oficiais.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {besta.flagelos.map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-xs border border-blood-red/20 bg-bg-input/50 flex justify-between items-start gap-2 hover:border-blood-red/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-data font-bold text-blood-red uppercase tracking-wider">
                      {f.nome}
                    </span>
                    <span
                      className={`text-[8px] font-mono uppercase px-1 py-0.2 rounded-2xs border ${
                        f.tipo === "vermelho"
                          ? "bg-blood-red/20 text-red-300 border-blood-red/40"
                          : "bg-white/10 text-white/80 border-white/20"
                      }`}
                    >
                      {f.tipo === "vermelho" ? "Vermelho" : "Branco"} • {f.custo} pt{f.custo > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted font-reading leading-relaxed">
                    {f.descricao}
                  </p>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFlagelo(f.id)}
                    className="text-text-dim hover:text-hunger-red text-sm font-bold cursor-pointer transition-colors p-1"
                    title="Remover Flagelo"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Adicionar Flagelo com Catálogo Oficial */}
      {isAddFlageloOpen && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsAddFlageloOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-bg-card border border-blood-red/40 rounded-sm p-6 relative shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddFlageloOpen(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base w-8 h-8 flex items-center justify-center rounded-xs hover:bg-white/10"
            >
              ✕
            </button>

            <div className="pb-2 border-b border-white/10">
              <h4 className="text-lg font-gothic tracking-widest text-blood-red uppercase">
                Manifestar Flagelo da Besta
              </h4>
              <p className="text-[11px] text-text-dim font-reading mt-0.5">
                Escolha do catálogo oficial dos 38 flagelos ou registre um poder customizado.
              </p>
            </div>

            <div className="space-y-4">
              {/* Seleção do Catálogo Oficial */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block mb-1">
                  Catálogo Oficial (13 Brancos & 25 Vermelhos)
                </label>
                <GothicSelect
                  variant="blood"
                  searchable
                  value={selectedCatalogFlagelo}
                  onChange={(val) => {
                    const strVal = String(val);
                    setSelectedCatalogFlagelo(strVal);
                    const found = FLAGELOS_CATALOGO.find((f: FlageloCanonico) => f.nome === strVal);
                    if (found) {
                      setCustomFlageloNome(found.nome);
                      setCustomFlageloDesc(found.resumo);
                      setCustomFlageloCusto(found.custo);
                      setCustomFlageloTipo(found.tipo);
                    }
                  }}
                  placeholder="Selecione um flagelo do catálogo..."
                  options={[
                    { value: "", label: "Criar Flagelo Personalizado / Manual" },
                    ...FLAGELOS_CATALOGO.map((f: FlageloCanonico) => ({
                      value: f.nome,
                      label: `${f.nome} (${f.custo} pt${f.custo > 1 ? "s" : ""})`,
                      description: f.resumo,
                      badge: f.tipo === "vermelho" ? "VERMELHO" : "BRANCO",
                    })),
                  ]}
                />
              </div>

              {/* Nome */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Nome do Flagelo
                </label>
                <input
                  type="text"
                  value={customFlageloNome}
                  onChange={(e) => setCustomFlageloNome(e.target.value)}
                  placeholder="Ex: Descontrole Emocional, A Pele do Lobo..."
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-blood-red transition-colors"
                />
              </div>

              {/* Custo e Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                    Custo em Pontos
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setCustomFlageloCusto(pts)}
                        className={`flex-1 py-1.5 rounded-xs border text-xs font-mono font-bold transition-all cursor-pointer ${
                          customFlageloCusto === pts
                            ? "bg-blood-red/30 border-blood-red text-white"
                            : "bg-bg-input border-white/10 text-text-muted"
                        }`}
                      >
                        {pts}p
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                    Tipo do Flagelo
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCustomFlageloTipo("branco")}
                      className={`py-1.5 rounded-xs border text-xs font-data uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                        customFlageloTipo === "branco"
                          ? "bg-white/20 border-white text-white"
                          : "bg-bg-input border-white/10 text-text-muted"
                      }`}
                    >
                      Branco
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomFlageloTipo("vermelho")}
                      className={`py-1.5 rounded-xs border text-xs font-data uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                        customFlageloTipo === "vermelho"
                          ? "bg-blood-red/30 border-blood-red text-white"
                          : "bg-bg-input border-white/10 text-text-muted"
                      }`}
                    >
                      Vermelho
                    </button>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Efeito / Descrição
                </label>
                <textarea
                  value={customFlageloDesc}
                  onChange={(e) => setCustomFlageloDesc(e.target.value)}
                  placeholder="Descreva as consequências do flagelo quando a Besta assume o controle..."
                  rows={2}
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-blood-red transition-colors resize-none"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddFlageloOpen(false)}
                  className="px-4 py-2 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 hover:border-white/30 rounded-xs transition-colors cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!customFlageloNome.trim()}
                  onClick={handleAddFlagelo}
                  className="px-5 py-2 text-xs uppercase font-data font-semibold bg-blood-red hover:bg-red-800 text-white rounded-xs transition-colors cursor-pointer shadow-[0_0_12px_rgba(200,36,52,0.4)] min-h-[40px] disabled:opacity-50"
                >
                  Confirmar Flagelo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Paixão Obscura */}
      {isAddPaixaoObscuraOpen && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsAddPaixaoObscuraOpen(false)}
        >
          <div
            className="w-full max-w-md bg-bg-card border border-blood-red/40 rounded-sm p-6 relative shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddPaixaoObscuraOpen(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base w-8 h-8 flex items-center justify-center rounded-xs hover:bg-white/10"
            >
              ✕
            </button>

            <h4 className="text-lg font-gothic tracking-widest text-blood-red uppercase pb-2 border-b border-white/10">
              Nova Paixão Obscura
            </h4>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Desejo Oculto / Alvo
                </label>
                <input
                  type="text"
                  value={newPaixaoNome}
                  onChange={(e) => setNewPaixaoNome(e.target.value)}
                  placeholder="Ex: Arruinar patrimônio da família, Humilhar o Príncipe..."
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-blood-red transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Sentimento / Motivação Oculta
                </label>
                <input
                  type="text"
                  value={newPaixaoEmocao}
                  onChange={(e) => setNewPaixaoEmocao(e.target.value)}
                  placeholder="Ex: Inveja, Vingança reprimida, Sadismo..."
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-blood-red transition-colors"
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
                          ? "bg-blood-red/30 border-blood-red text-white"
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
                  onClick={() => setIsAddPaixaoObscuraOpen(false)}
                  className="px-4 py-2 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 rounded-xs transition-colors cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!newPaixaoNome.trim()}
                  onClick={handleAddPaixaoObscura}
                  className="px-5 py-2 text-xs uppercase font-data font-semibold bg-blood-red hover:bg-red-800 text-white rounded-xs transition-colors cursor-pointer min-h-[40px] disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Grilhão Obscuro */}
      {isAddGrilhaoObscuroOpen && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsAddGrilhaoObscuroOpen(false)}
        >
          <div
            className="w-full max-w-md bg-bg-card border border-hunger-red/40 rounded-sm p-6 relative shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddGrilhaoObscuroOpen(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base w-8 h-8 flex items-center justify-center rounded-xs hover:bg-white/10"
            >
              ✕
            </button>

            <h4 className="text-lg font-gothic tracking-widest text-hunger-red uppercase pb-2 border-b border-white/10">
              Novo Grilhão Obscuro
            </h4>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Ente, Objeto ou Local
                </label>
                <input
                  type="text"
                  value={newGrilhaoNome}
                  onChange={(e) => setNewGrilhaoNome(e.target.value)}
                  placeholder="Ex: O túmulo do pai, A casa queimada, O rival da infância..."
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-hunger-red transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Sentimento Ancorado (Culpa, Pavor, Rancor)
                </label>
                <input
                  type="text"
                  value={newGrilhaoEmocao}
                  onChange={(e) => setNewGrilhaoEmocao(e.target.value)}
                  placeholder="Ex: Culpa amarga, Remorso, Ódio impotente..."
                  className="w-full bg-bg-input border border-white/10 rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-hunger-red transition-colors"
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
                          ? "bg-hunger-red/30 border-hunger-red text-white"
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
                  onClick={() => setIsAddGrilhaoObscuroOpen(false)}
                  className="px-4 py-2 text-xs uppercase font-data text-text-muted hover:text-white border border-white/10 rounded-xs transition-colors cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!newGrilhaoNome.trim()}
                  onClick={handleAddGrilhaoObscuro}
                  className="px-5 py-2 text-xs uppercase font-data font-semibold bg-hunger-red hover:bg-red-800 text-white rounded-xs transition-colors cursor-pointer min-h-[40px] disabled:opacity-50"
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
