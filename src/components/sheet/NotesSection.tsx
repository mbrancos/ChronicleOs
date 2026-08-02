import React from "react";

interface NotesSectionProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  disabled?: boolean;
}

export const NotesSection: React.FC<NotesSectionProps> = React.memo(({
  notes,
  onNotesChange,
  disabled = false,
}) => {
  return (
    <section id="anotacoes" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 space-y-4">
      <div className="border-b border-white/5 pb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-gothic tracking-wider text-gold-accent uppercase flex items-center gap-2">
            <span>📜 Anotações do Narrador, Histórico & Pistas</span>
          </h3>
          <p className="text-xs text-text-muted font-reading">
            Espaço de escrita livre para a biografia do vampiro, contatos da cidade, diário de sessão e metas da crônica.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          value={notes || ""}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={disabled}
          className="w-full h-80 bg-bg-main/60 border border-white/10 rounded-sm p-4 text-sm font-reading text-text-primary focus:border-gold-accent outline-none resize-y transition-colors duration-150 disabled:opacity-60 leading-relaxed placeholder:text-text-dim/40 shadow-inner"
          placeholder="Escreva aqui o histórico do personagem, contatos importantes, segredos descobertos na crônica e anotações pessoais..."
        />
      </div>
    </section>
  );
});

NotesSection.displayName = "NotesSection";

export default NotesSection;
