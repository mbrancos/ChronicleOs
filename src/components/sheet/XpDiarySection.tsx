import React from "react";
import InlineEdit from "./InlineEdit";
import { CharacterSheetData } from "@/types/character";

interface XpDiarySectionProps {
  character: CharacterSheetData;
  onCharacterChange: (updater: (prev: CharacterSheetData) => CharacterSheetData) => void;
  xpLedger: any[];
  isLoadingLedger: boolean;
  isReadOnly: boolean;
}

export const XpDiarySection: React.FC<XpDiarySectionProps> = React.memo(({
  character,
  onCharacterChange,
  xpLedger,
  isLoadingLedger,
  isReadOnly,
}) => {
  const spentXp = character.status.experience.spent || 0;
  const totalXp = character.status.experience.total || 0;
  const balanceXp = totalXp - spentXp;

  return (
    <section id="xp_diary" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 scroll-mt-24 space-y-6">
      <div className="border-b border-white/5 pb-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-gothic tracking-wider text-blood-red uppercase flex items-center gap-2">
            <span>💎 Gestão Financeira & Livro-Razão de XP</span>
          </h3>
          <p className="text-xs text-text-muted font-reading">
            Histórico auditável completo de investimentos, concessões do Narrador e transações de experiência.
          </p>
        </div>
      </div>

      {/* CARD FINANCEIRO DE XP NO TOPO DO MÓDULO */}
      <div className="bg-bg-main/60 border border-gold-accent/30 rounded-sm p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-sm">
        {/* BLENDED ITEM 1: GASTO */}
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

        {/* BLENDED ITEM 2: TOTAL */}
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

        {/* BLENDED ITEM 3: SALDO DISPONÍVEL */}
        <div className="bg-black/30 border border-white/5 rounded-xs p-3 space-y-1">
          <span className="text-[10px] font-data uppercase tracking-wider text-text-muted font-bold block">
            Saldo Disponível
          </span>
          <div className="text-xl font-gothic font-bold text-emerald-400">
            {balanceXp >= 0 ? `+${balanceXp}` : balanceXp} <span className="text-xs font-data text-text-muted">pts</span>
          </div>
        </div>
      </div>

      {/* TABELA DE AUDITORIA COMPLETA */}
      <div className="space-y-3">
        <h4 className="text-xs font-data uppercase tracking-wider text-gold-accent font-bold">
          Histórico de Lançamentos de XP
        </h4>

        {isLoadingLedger ? (
          <div className="text-center py-12 text-text-muted animate-pulse font-data uppercase tracking-wider text-xs">
            Carregando diário de XP...
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
                  <th className="p-3 tracking-wider font-bold">Descrição da Alteração</th>
                  <th className="p-3 tracking-wider font-bold text-right">Lançamento (XP)</th>
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
                  return (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 text-text-muted whitespace-nowrap">{dateFormatted}</td>
                      <td className="p-3 text-text-primary font-reading normal-case">{item.description}</td>
                      <td className={`p-3 font-bold text-right text-sm ${isNegative ? "text-hunger-red" : "text-emerald-400"}`}>
                        {isNegative ? "" : "+"}{item.xpChange} XP
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
