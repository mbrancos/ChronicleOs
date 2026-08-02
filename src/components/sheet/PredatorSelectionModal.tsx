import React from "react";
import { DISCIPLINE_KEY_TO_NAME } from "@/types/character";

interface PredatorSelectionModalProps {
  isOpen: boolean;
  predatorName: string;
  disciplinesOptions: Array<{ id: string; name: string }>;
  chosenDiscipline: string;
  onSelectDiscipline: (discId: string) => void;
  onClose: () => void;
}

export const PredatorSelectionModal: React.FC<PredatorSelectionModalProps> = React.memo(({
  isOpen,
  predatorName,
  disciplinesOptions,
  chosenDiscipline,
  onSelectDiscipline,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-gold-accent/40 max-w-md w-full p-6 rounded-sm shadow-[0_0_30px_rgba(212,175,55,0.2)] space-y-4">
        <div className="border-b border-white/10 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-gothic tracking-wider text-gold-accent uppercase font-bold">
              🩸 Bônus do Predador: {predatorName}
            </h3>
            <p className="text-[10px] text-text-muted font-data uppercase">
              Escolha de Ponto de Disciplina Adicional
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-text-primary font-reading leading-relaxed">
          O estilo de caça <strong>{predatorName}</strong> concede 1 ponto bônus em uma de suas disciplinas temáticas. Selecione qual deseja aplicar ao seu esqueleto de criação:
        </p>

        {/* OPÇÕES DE DISCIPLINAS DO PREDADOR */}
        <div className="space-y-2 pt-2">
          {disciplinesOptions.map((disc) => {
            const isSelected = chosenDiscipline === disc.id;
            return (
              <button
                key={disc.id}
                type="button"
                onClick={() => onSelectDiscipline(disc.id)}
                className={`w-full p-3 rounded-xs border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gold-accent/20 border-gold-accent text-gold-accent shadow-[0_0_10px_rgba(212,175,55,0.25)]"
                    : "bg-black/40 border-white/10 text-text-primary hover:border-white/30"
                }`}
              >
                <span className="font-bold text-xs font-data uppercase tracking-wider">
                  +1 Ponto em {disc.name}
                </span>
                <span className="text-xs">{isSelected ? "✓ Selecionado" : "Selecionar"}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-blood-red hover:bg-burgundy text-white text-xs font-bold font-data uppercase tracking-wider rounded-xs cursor-pointer shadow-md transition-colors"
          >
            Confirmar Escolha
          </button>
        </div>
      </div>
    </div>
  );
});

PredatorSelectionModal.displayName = "PredatorSelectionModal";

export default PredatorSelectionModal;
