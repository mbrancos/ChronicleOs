import React, { useState } from "react";
import InlineEdit from "./InlineEdit";
import { CharacterSheetData } from "@/types/character";

interface XpDiarySectionProps {
  characterId: string;
  character: CharacterSheetData;
  status: "DRAFT" | "READY" | "IN_PLAY";
  onCharacterChange: (updater: (prev: CharacterSheetData) => CharacterSheetData) => void;
  xpLedger: Array<{
    id: string;
    createdAt: string | Date;
    description: string;
    xpChange: number;
    initialBalance?: number;
    finalBalance?: number;
    typeCategory?: "REWARD" | "EVOLUTION" | "ADJUSTMENT";
  }>;
  isLoadingLedger: boolean;
  isReadOnly: boolean;
  onCleanupDraftLedger?: () => Promise<void>;
}

export const XpDiarySection: React.FC<XpDiarySectionProps> = React.memo(({
  characterId,
  character,
  status,
  onCharacterChange,
  xpLedger,
  isLoadingLedger,
  isReadOnly,
  onCleanupDraftLedger,
}) => {
  const [isCleaning, setIsCleaning] = useState(false);

  // Fonte Única da Verdade: Derivar XP Total, XP Gasto e Saldo a partir das movimentações reais do extrato
  const positiveSum = xpLedger.reduce((acc, item) => acc + (item.xpChange > 0 ? item.xpChange : 0), 0);
  const negativeSum = xpLedger.reduce((acc, item) => acc + (item.xpChange < 0 ? Math.abs(item.xpChange) : 0), 0);

  // Se houver lançamentos no extrato, os cards derivam da matemática do extrato. Caso contrário, usam os valores armazenados.
  const totalXp = xpLedger.length > 0 ? positiveSum : (character.status.experience.total || 0);
  const spentXp = xpLedger.length > 0 ? negativeSum : (character.status.experience.spent || 0);
  const balanceXp = totalXp - spentXp;

  const hasLegacyDraftEntries = xpLedger.some(
    (item) =>
      item.description.toLowerCase().includes("criação") ||
      item.description.toLowerCase().includes("vantagem") ||
      item.description.toLowerCase().includes("criacão")
  );

  const handleCleanup = async () => {
    if (!onCleanupDraftLedger) return;
    setIsCleaning(true);
    try {
      await onCleanupDraftLedger();
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <section id="xp_diary" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 scroll-mt-24 space-y-6">
      <div className="border-b border-white/5 pb-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-gothic tracking-wider text-blood-red uppercase flex items-center gap-2">
            <span>💎 Gestão Financeira & Livro-Razão de XP</span>
          </h3>
          <p className="text-xs text-text-muted font-reading">
            Histórico auditável completo de investimentos, concessões do Narrador e transações de experiência estilo extrato bancário.
          </p>
        </div>

        {hasLegacyDraftEntries && onCleanupDraftLedger && (
          <button
            type="button"
            disabled={isCleaning}
            onClick={handleCleanup}
            className="text-xs font-data uppercase tracking-wider font-bold bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-sm transition-all cursor-pointer shadow-sm select-none flex items-center gap-1.5"
            title="Apaga os registros indevidos gerados automaticamente durante a fase de criação no Cofre"
          >
            <span>{isCleaning ? "Limpando..." : "🧹 Limpar Lançamentos de Rascunho"}</span>
          </button>
        )}
      </div>

      {/* BANNER EXPLICATIVO DE FASE DE CRIAÇÃO (COFRE) */}
      {status !== "IN_PLAY" && (
        <div className="bg-bg-main/60 border border-gold-accent/40 rounded-sm p-4 text-xs font-reading text-text-primary space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between font-gothic text-gold-accent uppercase font-bold text-sm">
            <span>📜 Ficha em Fase de Criação no Cofre</span>
            <span className="text-[10px] font-data bg-gold-accent/10 border border-gold-accent/30 text-gold-accent px-2 py-0.5 rounded-xs">
              Pontos Iniciais Gratuitos (0 XP)
            </span>
          </div>
          <p className="text-text-muted leading-relaxed">
            Os pontos distribuídos no esqueleto inicial do personagem (Atributos, Habilidades, Disciplinas e Vantagens da idade) pertencem à cota padrão do livro V5 e são <strong>100% gratuitos (0 XP)</strong>. O extrato de auditoria passará a registrar os prêmios de sessão e investimentos por XP assim que a ficha entrar em jogo na crônica!
          </p>
        </div>
      )}

      {/* CARD FINANCEIRO DE XP NO TOPO DO MÓDULO */}
      <div className="bg-bg-main/60 border border-gold-accent/30 rounded-sm p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-sm">
        {/* ITEM 1: GASTO */}
        <div className="bg-black/30 border border-white/5 rounded-xs p-3 space-y-1">
          <span className="text-[10px] font-data uppercase tracking-wider text-text-muted font-bold block">
            XP Gasto na Ficha
          </span>
          <div className="flex items-center text-xl font-gothic text-hunger-red">
            <InlineEdit
              value={String(spentXp)}
              onChange={(val) => {
                const num = Number(val) || 0;
                onCharacterChange((prev) => ({
                  ...prev,
                  status: {
                    ...prev.status,
                    experience: { ...prev.status.experience, spent: num }
                  }
                }));
              }}
              disabled={isReadOnly}
              className="font-bold text-xl text-hunger-red cursor-pointer"
            />
            <span className="text-xs font-data text-text-muted ml-1">pts</span>
          </div>
        </div>

        {/* ITEM 2: TOTAL */}
        <div className="bg-black/30 border border-white/5 rounded-xs p-3 space-y-1">
          <span className="text-[10px] font-data uppercase tracking-wider text-text-muted font-bold block">
            XP Total Adquirido
          </span>
          <div className="flex items-center text-xl font-gothic text-gold-accent">
            <InlineEdit
              value={String(totalXp)}
              onChange={(val) => {
                const num = Number(val) || 0;
                onCharacterChange((prev) => ({
                  ...prev,
                  status: {
                    ...prev.status,
                    experience: { ...prev.status.experience, total: num }
                  }
                }));
              }}
              disabled={isReadOnly}
              className="font-bold text-xl text-gold-accent cursor-pointer"
            />
            <span className="text-xs font-data text-text-muted ml-1">pts</span>
          </div>
        </div>

        {/* ITEM 3: SALDO DISPONÍVEL */}
        <div className="bg-black/30 border border-white/5 rounded-xs p-3 space-y-1">
          <span className="text-[10px] font-data uppercase tracking-wider text-text-muted font-bold block">
            Saldo Disponível
          </span>
          <div className="text-xl font-gothic font-bold text-emerald-400">
            {balanceXp >= 0 ? `+${balanceXp}` : balanceXp} <span className="text-xs font-data text-text-muted">pts</span>
          </div>
        </div>
      </div>

      {/* TABELA DE AUDITORIA NO FORMATO EXTRATO BANCÁRIO */}
      <div className="space-y-3">
        <h4 className="text-xs font-data uppercase tracking-wider text-gold-accent font-bold">
          Extrato de Saldo & Histórico de Auditoria
        </h4>

        {isLoadingLedger ? (
          <div className="text-center py-12 text-text-muted animate-pulse font-data uppercase tracking-wider text-xs">
            Carregando extrato de XP...
          </div>
        ) : xpLedger.length === 0 ? (
          <div className="text-center py-12 border border-white/5 bg-bg-main/20 rounded-sm text-text-dim/60 italic text-sm font-reading">
            Nenhum lançamento de XP registrado neste personagem até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/10 rounded-sm bg-bg-main/30 shadow-inner">
            <table className="w-full text-left border-collapse font-data text-xs uppercase">
              <thead>
                <tr className="border-b border-white/10 bg-bg-card-dark text-text-muted">
                  <th className="p-3 tracking-wider font-bold">Data / Hora</th>
                  <th className="p-3 tracking-wider font-bold">Tipo</th>
                  <th className="p-3 tracking-wider font-bold text-center">Saldo Inicial</th>
                  <th className="p-3 tracking-wider font-bold">Descrição da Alteração</th>
                  <th className="p-3 tracking-wider font-bold text-right">Lançamento (+/-)</th>
                  <th className="p-3 tracking-wider font-bold text-right">Saldo Final</th>
                </tr>
              </thead>
              <tbody>
                {xpLedger.map((item) => {
                  const dateFormatted = new Date(item.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                  const isNegative = item.xpChange < 0;

                  // Renderizar Tag de Categoria
                  let tagBadge = (
                    <span className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-wider">
                      🎁 Recompensa
                    </span>
                  );

                  if (item.typeCategory === "ADJUSTMENT") {
                    tagBadge = (
                      <span className="bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-wider">
                        ⚙️ Ajuste
                      </span>
                    );
                  } else if (item.typeCategory === "EVOLUTION" || isNegative) {
                    tagBadge = (
                      <span className="bg-rose-950/60 border border-rose-500/40 text-hunger-red text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-wider">
                        ⚔️ Evolução
                      </span>
                    );
                  }

                  const initialVal = item.initialBalance !== undefined ? item.initialBalance : "-";
                  const finalVal = item.finalBalance !== undefined ? item.finalBalance : "-";

                  return (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 text-text-muted whitespace-nowrap">{dateFormatted}</td>
                      <td className="p-3 whitespace-nowrap">{tagBadge}</td>
                      <td className="p-3 text-center text-text-muted font-bold">{initialVal} XP</td>
                      <td className="p-3 text-text-primary font-reading normal-case">{item.description}</td>
                      <td className={`p-3 font-bold text-right text-sm ${isNegative ? "text-hunger-red" : "text-emerald-400"}`}>
                        {isNegative ? "" : "+"}{item.xpChange} XP
                      </td>
                      <td className="p-3 font-bold text-right text-sm text-gold-accent whitespace-nowrap">
                        {finalVal} XP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
});

XpDiarySection.displayName = "XpDiarySection";

export default XpDiarySection;
