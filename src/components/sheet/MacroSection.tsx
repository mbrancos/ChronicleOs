import React from "react";
import { CharacterSheetData, RollMacro } from "@/types/character";

interface MacroSectionProps {
  character: CharacterSheetData;
  status: "DRAFT" | "READY" | "IN_PLAY";
  isReadOnly: boolean;
  isOverrideActive: boolean;
  onRouseCheck: () => void;
  onExecuteMacro: (macro: RollMacro) => void;
  onAddMacro: () => void;
  onDeleteMacro: (id: string) => void;
  onApplyV5Presets: () => void;
  rollResult: {
    macroName: string;
    totalPool: number;
    successes: number;
    isCritical: boolean;
    isMessianic: boolean;
    isBestial: boolean;
    diceList: { type: "normal" | "hunger"; value: number }[];
  } | null;
  onClearRollResult: () => void;
}

const TECHNICAL_NAMES: Record<string, string> = {
  strength: "Força", dexterity: "Destreza", stamina: "Vigor",
  charisma: "Carisma", manipulation: "Manipulação", composure: "Autocontrole",
  intelligence: "Inteligência", wits: "Raciocínio", resolve: "Determinação",
  athletics: "Atletismo", brawl: "Briga", craft: "Ofícios", drive: "Condução",
  firearms: "Armas de Fogo", melee: "Armas Brancas", larceny: "Ladroagem",
  stealth: "Furtividade", survival: "Sobrevivência", animal_ken: "Empatia Anim.",
  etiquette: "Etiqueta", insight: "Sagacidade", intimidation: "Intimidação",
  leadership: "Liderança", performance: "Performance", persuasion: "Persuasão",
  streetwise: "Manha", subterfuge: "Subterfúgio", academics: "Erudição",
  awareness: "Percepção", finance: "Finanças", investigation: "Investigação",
  medicine: "Medicina", occult: "Ocultismo", politics: "Política",
  science: "Ciência", technology: "Tecnologia"
};

export const MacroSection: React.FC<MacroSectionProps> = React.memo(({
  character,
  status,
  isReadOnly,
  isOverrideActive,
  onRouseCheck,
  onExecuteMacro,
  onAddMacro,
  onDeleteMacro,
  onApplyV5Presets,
  rollResult,
  onClearRollResult,
}) => {
  return (
    <section id="macros" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 space-y-6">
      <div className="border-b border-white/5 pb-2">
        <h3 className="text-lg font-gothic tracking-wider text-blood-red uppercase flex items-center gap-2">
          <span>🎲 Rolagens de Dados & Ações Rápidas</span>
        </h3>
        <p className="text-xs text-text-muted font-reading">
          Atalhos de rolagens com matemática automatizada de Fome, Atributos e Habilidades V5.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA (65%): ROUSE CHECK + MACROS */}
        <div className="lg:col-span-8 space-y-6">
          {/* BANNER COMPACTO DE ROUSE CHECK */}
          <div className="bg-gradient-to-r from-deep-crimson/30 via-bg-main/60 to-bg-main/40 border border-blood-red/40 rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-data font-bold uppercase tracking-wider text-blood-red flex items-center gap-1.5">
                🩸 Teste de Despertar (Rouse Check 1d10)
              </span>
              <p className="text-xs text-text-muted font-reading leading-relaxed">
                Rola 1d10 de Fome. Em caso de falha (1 a 5), aumenta a Fome da ficha automaticamente (+1).
              </p>
            </div>
            <button
              type="button"
              onClick={onRouseCheck}
              className="bg-deep-crimson hover:bg-blood-red text-white text-xs font-data uppercase tracking-wider font-bold px-4 py-2.5 rounded-sm border border-blood-red/60 transition-all cursor-pointer shrink-0 shadow-[0_0_10px_rgba(200,36,52,0.3)] hover:scale-102 select-none"
            >
              🩸 Rolar Rouse Check
            </button>
          </div>

          {/* CABEÇALHO E GRID DE MACROS */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-data uppercase tracking-wider text-gold-accent font-bold">
                Macros de Dados Disponíveis ({character.macros?.length || 0})
              </h4>
              {(status !== "IN_PLAY" || isOverrideActive) && (
                <div className="flex items-center space-x-2">
                  {(!character.macros || character.macros.length === 0) && (
                    <button
                      type="button"
                      onClick={onApplyV5Presets}
                      className="text-xs uppercase font-data font-bold text-gold-accent hover:text-white bg-gold-accent/10 hover:bg-gold-accent/30 px-3 py-1.5 rounded-sm border border-gold-accent/30 transition-all cursor-pointer select-none"
                    >
                      ⚡ Presets V5
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onAddMacro}
                    className="text-xs uppercase font-data font-bold text-blood-red hover:text-white bg-deep-crimson/30 hover:bg-deep-crimson/80 px-3 py-1.5 rounded-sm border border-blood-red/30 transition-all cursor-pointer select-none"
                  >
                    + Criar Macro
                  </button>
                </div>
              )}
            </div>

            {(!character.macros || character.macros.length === 0) ? (
              <div className="text-center py-8 border border-white/5 bg-bg-main/20 rounded-sm text-text-muted text-xs font-reading italic">
                Nenhuma macro criada. Clique em <strong className="text-gold-accent">⚡ Presets V5</strong> para carregar as macros recomendadas.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {character.macros.map((macro) => (
                  <div
                    key={macro.id}
                    className="bg-bg-main/50 border border-white/10 hover:border-gold-accent/40 rounded-sm p-3.5 space-y-2 relative group transition-all duration-150"
                  >
                    {(status !== "IN_PLAY" || isOverrideActive) && (
                      <button
                        type="button"
                        onClick={() => onDeleteMacro(macro.id)}
                        className="absolute top-2 right-2 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer select-none"
                        title="Excluir Macro"
                      >
                        ✕
                      </button>
                    )}

                    <div className="flex flex-col space-y-1">
                      <span className="font-gothic text-base text-text-primary uppercase tracking-wide">
                        {macro.name}
                      </span>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {macro.pool.map((p, pIdx) => (
                          <span key={pIdx} className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-text-muted font-data uppercase">
                            {TECHNICAL_NAMES[p] || (character.disciplines?.find(d => d.id === p)?.name) || p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onExecuteMacro(macro)}
                      className="w-full mt-1 bg-bg-card hover:bg-gold-accent/20 border border-white/10 hover:border-gold-accent/50 text-gold-accent text-xs font-data uppercase tracking-wider py-1.5 rounded-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 select-none"
                    >
                      <span>🎲 Rolar d10</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA (35%): HUD COMPACTO DE RESULTADO DA ROLAGEM */}
        <div className="lg:col-span-4 bg-bg-main border border-white/10 rounded-sm p-4 flex flex-col justify-between min-h-[260px] max-h-[420px] shadow-inner">
          {!rollResult ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2 text-text-dim">
              <svg className="w-10 h-10 text-text-dim/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="font-data uppercase tracking-wider text-xs">Aguardando Rolagem</p>
              <p className="text-[11px] font-reading text-text-muted leading-relaxed">
                Clique nas macros para disparar a rolagem automatizada com os dados de Fome.
              </p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div className="border-b border-white/10 pb-1.5 flex justify-between items-center">
                <span className="font-data uppercase tracking-wider text-xs text-gold-accent font-bold">
                  Resultado da Ação
                </span>
                <button
                  type="button"
                  onClick={onClearRollResult}
                  className="text-[10px] uppercase tracking-widest text-text-muted hover:text-white cursor-pointer"
                >
                  Limpar
                </button>
              </div>

              <div className="space-y-0.5">
                <h4 className="font-gothic text-xl text-blood-red tracking-wide uppercase leading-none">
                  {rollResult.macroName}
                </h4>
                <p className="text-[11px] text-text-muted font-data uppercase">
                  Pool: {rollResult.totalPool} Dados • Sucessos: <span className="text-text-primary font-bold">{rollResult.successes}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 py-2 bg-bg-card/40 p-2 border border-white/5 rounded-sm">
                {rollResult.diceList.map((d, dIdx) => {
                  const isHunger = d.type === "hunger";
                  const isTen = d.value === 10;
                  const isOne = d.value === 1;

                  let bgStyle = "bg-bg-main border-blood-red text-text-primary";
                  let ringStyle = "";

                  if (isHunger) {
                    bgStyle = "bg-hunger-red border-white text-bg-main font-bold";
                    if (isTen) ringStyle = "ring-2 ring-gold-accent shadow-[0_0_10px_rgba(255,216,77,0.8)]";
                    else if (isOne) ringStyle = "ring-2 ring-deep-crimson shadow-[0_0_10px_rgba(128,0,8,0.8)] animate-pulse";
                  } else {
                    if (isTen) {
                      bgStyle = "bg-gold-accent border-gold-accent text-bg-main font-bold";
                      ringStyle = "ring-2 ring-gold-accent/40 shadow-[0_0_8px_rgba(255,216,77,0.5)]";
                    }
                  }

                  return (
                    <div
                      key={dIdx}
                      className={`w-8 h-8 border rounded-sm flex items-center justify-center font-data text-xs tracking-tighter ${bgStyle} ${ringStyle}`}
                    >
                      {isTen ? "10" : d.value}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1 text-[11px]">
                {rollResult.isMessianic && (
                  <div className="p-2 bg-gold-accent/10 border border-gold-accent/40 rounded-sm text-gold-accent font-reading">
                    <strong>Crítico Messiânico!</strong> Sucesso espetacular com consequências dramáticas de clã.
                  </div>
                )}
                {rollResult.isBestial && (
                  <div className="p-2 bg-deep-crimson/10 border border-deep-crimson/40 rounded-sm text-hunger-red font-reading">
                    <strong>Falha Bestial!</strong> A Besta tomou o controle parcial da ação.
                  </div>
                )}
                {!rollResult.isMessianic && rollResult.isCritical && (
                  <div className="p-2 bg-bg-card border border-gold-accent/20 rounded-sm text-gold-accent font-reading">
                    <strong>Sucesso Crítico!</strong> Resultados excepcionais.
                  </div>
                )}
                {rollResult.successes > 0 && !rollResult.isMessianic && !rollResult.isBestial && (
                  <div className="p-2 bg-bg-card border border-white/10 rounded-sm text-text-muted font-reading">
                    Ação bem-sucedida: <strong>{rollResult.successes}</strong> sucesso(s).
                  </div>
                )}
                {rollResult.successes === 0 && !rollResult.isBestial && (
                  <div className="p-2 bg-deep-crimson/5 border border-deep-crimson/10 rounded-sm text-text-dim font-reading">
                    A rolagem falhou. 0 sucessos.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-[9px] text-text-dim border-t border-white/5 pt-2 leading-snug font-sans shrink-0">
            * V5: dados 6+ são sucessos. Pares de 10 geram críticos (+2). Dados de Fome geram vitórias messiânicas ou falhas bestiais.
          </div>
        </div>
      </div>
    </section>
  );
});

MacroSection.displayName = "MacroSection";

export default MacroSection;
