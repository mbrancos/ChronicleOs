import React from "react";
import InlineEdit from "./InlineEdit";
import DamageTracker from "./DamageTracker";
import HumanityTracker from "./HumanityTracker";
import { CharacterSheetData } from "@/types/character";

interface ProfileHeaderSectionProps {
  characterId: string;
  character: CharacterSheetData;
  status: "DRAFT" | "READY" | "IN_PLAY";
  isReadOnly: boolean;
  onCharacterChange: (updater: (prev: CharacterSheetData) => CharacterSheetData) => void;
  onOpenAvatarModal?: () => void;
}

export const ProfileHeaderSection: React.FC<ProfileHeaderSectionProps> = React.memo(({
  characterId,
  character,
  status,
  isReadOnly,
  onCharacterChange,
  onOpenAvatarModal,
}) => {
  const clan = character.profile?.clan || "Sem Clã";
  const concept = character.profile?.concept || "Neófito";
  const predator = character.profile?.predator_type || "Nenhum";

  return (
    <section id="sec-profile" className="bg-bg-card/90 border border-gold-accent/25 rounded-sm p-5 shadow-[0_0_30px_rgba(0,0,0,0.85)] relative overflow-hidden backdrop-blur-md space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* TERÇO 1 (5 COLS): FOTO + DADOS DE PERFIL */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* AVATAR DO VAMPIRO */}
          <div className="shrink-0">
            <div 
              onClick={!isReadOnly ? onOpenAvatarModal : undefined}
              className={`w-24 h-24 rounded-full border-2 border-gold-accent/50 bg-black/60 overflow-hidden relative shadow-lg group transition-all duration-300 ${
                !isReadOnly ? "cursor-pointer hover:border-gold-accent hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]" : ""
              }`}
            >
              {(character.profile?.avatarUrl || character.profile?.portrait_url) ? (
                <img 
                  src={character.profile.avatarUrl || character.profile.portrait_url} 
                  alt={character.profile?.name || "Vampiro"} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-text-dim group-hover:text-gold-accent">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {!isReadOnly && (
                    <span className="text-[9px] font-data uppercase tracking-wider text-gold-accent opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1">
                      Alterar
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* DADOS NOMINAIS */}
          <div className="flex-1 space-y-2 text-center sm:text-left w-full">
            <div className="space-y-1">
              <span className="text-[10px] font-data uppercase tracking-wider text-text-muted font-bold block">
                Nome do Personagem
              </span>
              <h1 className="text-xl sm:text-2xl font-gothic text-blood-red tracking-wide font-bold">
                <InlineEdit
                  value={character.profile?.name || "Novo Vampiro"}
                  onChange={(val) =>
                    onCharacterChange((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, name: val }
                    }))
                  }
                  disabled={isReadOnly}
                  className="text-xl sm:text-2xl font-gothic text-blood-red tracking-wide font-bold"
                />
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-data uppercase pt-1">
              <div>
                <span className="text-text-muted text-[10px] block font-bold">Clã:</span>
                <span className="text-gold-accent font-bold">{clan}</span>
              </div>
              <div>
                <span className="text-text-muted text-[10px] block font-bold">Idade / Conceito:</span>
                <span className="text-text-primary">{concept}</span>
              </div>
              <div>
                <span className="text-text-muted text-[10px] block font-bold">Geração:</span>
                <span className="text-text-primary">{character.profile?.generation || "12ª"}</span>
              </div>
              <div>
                <span className="text-text-muted text-[10px] block font-bold">Predador:</span>
                <span className="text-emerald-400 font-bold">{predator}</span>
              </div>
            </div>
          </div>
        </div>

        {/* TERÇO 2 (4 COLS): TRACKERS RÁPIDOS DE VITALIDADE & FORÇA DE VONTADE */}
        <div className="lg:col-span-4 space-y-3 bg-black/40 border border-white/5 rounded-xs p-3.5">
          <span className="text-[10px] font-data font-bold uppercase tracking-wider text-blood-red block border-b border-white/5 pb-1">
            🩸 Recursos Vitais
          </span>

          {/* VITALIDADE */}
          <div className="space-y-1">
            <DamageTracker 
              characterId={characterId}
              label="Vitalidade" 
              value={character.status.health} 
              onChange={(val) => onCharacterChange(prev => ({ ...prev, status: { ...prev.status, health: val } }))} 
              variant="health" 
            />
          </div>

          {/* FORÇA DE VONTADE */}
          <div className="space-y-1 pt-1">
            <DamageTracker 
              characterId={characterId}
              label="Força de Vontade" 
              value={character.status.willpower} 
              onChange={(val) => onCharacterChange(prev => ({ ...prev, status: { ...prev.status, willpower: val } }))} 
              variant="willpower" 
            />
          </div>
        </div>

        {/* TERÇO 3 (3 COLS): BÚSSOLA MORAL & HUMANIDADE */}
        <div className="lg:col-span-3 space-y-3 bg-black/40 border border-white/5 rounded-xs p-3.5 flex flex-col justify-between">
          <HumanityTracker
            characterId={characterId}
            humanity={character.status?.humanity || 7}
            stains={character.status?.stains || 0}
            onHumanityChange={(val) => onCharacterChange(prev => ({ ...prev, status: { ...prev.status, humanity: val } }))}
            onStainsChange={(val) => onCharacterChange(prev => ({ ...prev, status: { ...prev.status, stains: val } }))}
            disabled={isReadOnly}
          />
        </div>
      </div>
    </section>
  );
});

ProfileHeaderSection.displayName = "ProfileHeaderSection";

export default ProfileHeaderSection;
