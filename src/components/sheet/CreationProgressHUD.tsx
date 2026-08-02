import React from "react";

interface CreationProgressHUDProps {
  attributesRemaining: number;
  skillsRemaining: number;
  disciplinesRemaining: number;
  advantagesRemaining: number;
  hasPredator: boolean;
  onLockCharacter: () => void;
  isLocking?: boolean;
}

export const CreationProgressHUD: React.FC<CreationProgressHUDProps> = React.memo(({
  attributesRemaining,
  skillsRemaining,
  disciplinesRemaining,
  advantagesRemaining,
  hasPredator,
  onLockCharacter,
  isLocking = false,
}) => {
  const isComplete =
    attributesRemaining === 0 &&
    skillsRemaining === 0 &&
    disciplinesRemaining === 0 &&
    advantagesRemaining === 0 &&
    hasPredator;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-bg-card/95 border border-gold-accent/40 rounded-full px-5 py-2.5 shadow-[0_0_25px_rgba(0,0,0,0.9)] backdrop-blur-md flex items-center gap-4 transition-all duration-300">
      <span className="text-[10px] font-data uppercase tracking-wider font-bold text-gold-accent hidden sm:inline border-r border-white/10 pr-3">
        📜 Cotas de Criação:
      </span>

      {/* PÍLULAS DE STATUS */}
      <div className="flex items-center gap-2 text-[10px] font-data uppercase">
        {/* ATRIBUTOS */}
        <span
          className={`px-2 py-0.5 rounded-xs font-bold transition-colors ${
            attributesRemaining === 0
              ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-400"
              : "bg-amber-950/60 border border-amber-500/40 text-amber-300"
          }`}
        >
          Atributos: {attributesRemaining === 0 ? "✓ OK" : `${attributesRemaining} pts`}
        </span>

        {/* HABILIDADES */}
        <span
          className={`px-2 py-0.5 rounded-xs font-bold transition-colors ${
            skillsRemaining === 0
              ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-400"
              : "bg-amber-950/60 border border-amber-500/40 text-amber-300"
          }`}
        >
          Habilidades: {skillsRemaining === 0 ? "✓ OK" : `${skillsRemaining} pts`}
        </span>

        {/* DISCIPLINAS */}
        <span
          className={`px-2 py-0.5 rounded-xs font-bold transition-colors ${
            disciplinesRemaining === 0
              ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-400"
              : "bg-amber-950/60 border border-amber-500/40 text-amber-300"
          }`}
        >
          Disciplinas: {disciplinesRemaining === 0 ? "✓ OK" : `${disciplinesRemaining} pts`}
        </span>

        {/* PREDADOR */}
        <span
          className={`px-2 py-0.5 rounded-xs font-bold transition-colors ${
            hasPredator
              ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-400"
              : "bg-amber-950/60 border border-amber-500/40 text-amber-300"
          }`}
        >
          Predador: {hasPredator ? "✓ OK" : "Pendente"}
        </span>

        {/* VANTAGENS */}
        <span
          className={`px-2 py-0.5 rounded-xs font-bold transition-colors ${
            advantagesRemaining === 0
              ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-400"
              : "bg-amber-950/60 border border-amber-500/40 text-amber-300"
          }`}
        >
          Vantagens: {advantagesRemaining === 0 ? "✓ OK" : `${advantagesRemaining} pts`}
        </span>
      </div>

      {/* BOTÃO DE CONCLUIR E TRANCAR */}
      {isComplete && (
        <button
          type="button"
          disabled={isLocking}
          onClick={onLockCharacter}
          className="ml-2 px-3 py-1 bg-gold-accent hover:bg-yellow-400 text-bg-main text-[10px] font-bold font-data uppercase tracking-wider rounded-full cursor-pointer shadow-lg animate-pulse transition-all"
        >
          {isLocking ? "Trancando..." : "Concluir Ficha 🔒"}
        </button>
      )}
    </div>
  );
});

CreationProgressHUD.displayName = "CreationProgressHUD";

export default CreationProgressHUD;
