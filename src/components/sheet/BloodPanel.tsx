"use client";

import { useState, useEffect } from "react";

interface BloodState {
  resonance: string;
  dyscrasia: string;
}

interface BloodPanelProps {
  value?: BloodState;
  onChange: (newValue: BloodState) => void;
  disabled?: boolean;
}

const RESONANCE_OPTIONS = [
  { value: "Vazio", label: "Vazio (Sem Ressonância) ⚪" },
  { value: "Colérico", label: "Colérico (Ira, Paixão) 🩸🔥" },
  { value: "Sanguíneo", label: "Sanguíneo (Desejo, Entusiasmo) 🩸✨" },
  { value: "Melancólico", label: "Melancólico (Tristeza, Pavor) 🩸🌑" },
  { value: "Fleumático", label: "Fleumático (Frieza, Apatia) 🩸❄️" },
  { value: "Animal", label: "Animal (Feral, Instintivo) 🐾" }
];

export default function BloodPanel({ value, onChange, disabled = false }: BloodPanelProps) {
  const resonance = value?.resonance || "Vazio";
  const dyscrasia = value?.dyscrasia || "";

  // Estado local para a discrasi para evitar o bug de perda de foco devido a autosaves contínuos
  const [localDyscrasia, setLocalDyscrasia] = useState(dyscrasia);

  // Manter o estado local sincronizado caso a ficha mude externamente
  useEffect(() => {
    setLocalDyscrasia(dyscrasia);
  }, [dyscrasia]);

  const handleResonanceChange = (newResonance: string) => {
    onChange({
      resonance: newResonance,
      dyscrasia
    });
  };

  const handleDyscrasiaBlur = () => {
    if (localDyscrasia !== dyscrasia) {
      onChange({
        resonance,
        dyscrasia: localDyscrasia
      });
    }
  };

  return (
    <div className="bg-bg-main/40 border border-blood-red/20 rounded-sm p-5 space-y-4 shadow-[0_0_15px_rgba(139,0,0,0.08)] relative overflow-hidden group hover:border-blood-red/40 transition-all duration-300">
      {/* Brilho gótico de fundo */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blood-red/5 rounded-full blur-2xl group-hover:bg-blood-red/10 transition-all duration-300 pointer-events-none" />

      <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
        <svg className="w-4 h-4 text-blood-red shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
        <h3 className="font-gothic text-base uppercase tracking-wider text-blood-red font-bold">
          Fisiologia do Sangue (Ressonância)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dropdown de humor / ressonância */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold font-data">
            Ressonância Atual (Humor da Vítima)
          </label>
          <select
            value={resonance}
            disabled={disabled}
            onChange={(e) => handleResonanceChange(e.target.value)}
            className="bg-bg-input border border-white/10 text-text-primary text-xs p-2.5 rounded-sm outline-none focus:border-blood-red/60 focus:ring-1 focus:ring-blood-red/30 transition-all duration-150 h-10 font-reading cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
          >
            {RESONANCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-card text-text-primary">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Input/Textarea de Discrasi */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold font-data">
            Discrasi (Bônus Temporário de Sangue)
          </label>
          <input
            type="text"
            value={localDyscrasia}
            disabled={disabled}
            placeholder={disabled ? "Sem discrasi ativa." : "Ex: +1 dado em Dominação contra mortais..."}
            onChange={(e) => setLocalDyscrasia(e.target.value)}
            onBlur={handleDyscrasiaBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleDyscrasiaBlur();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="bg-bg-input border border-white/10 text-text-primary text-xs p-2.5 rounded-sm outline-none focus:border-blood-red/60 focus:ring-1 focus:ring-blood-red/30 transition-all duration-150 h-10 font-reading placeholder:text-text-dim/40 disabled:opacity-55 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <p className="text-[10px] text-text-muted/70 font-reading leading-relaxed">
        * A Ressonância e a Discrasi representam os efeitos e bônus temporários concedidos ao se alimentar de sangue com estados emocionais intensificados. As alterações são sincronizadas automaticamente na nuvem.
      </p>
    </div>
  );
}
