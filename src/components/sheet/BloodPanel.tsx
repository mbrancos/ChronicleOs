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
    <div className="bg-bg-card/35 border border-white/5 rounded-sm p-3 space-y-2.5 transition-all duration-300 hover:border-white/10">
      <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
        <div className="flex items-center space-x-1.5">
          <svg className="w-3.5 h-3.5 text-blood-red shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
          <h3 className="font-data text-xs uppercase tracking-wider text-text-muted font-semibold">
            Ressonância
          </h3>
        </div>
        {resonance !== "Vazio" && (
          <span className="text-[10px] font-data font-bold text-blood-red bg-blood-red/10 border border-blood-red/30 px-1.5 py-0.5 rounded-xs uppercase">
            Ativa
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* Dropdown de humor / ressonância */}
        <div className="flex flex-col space-y-1">
          <label className="text-[9px] text-text-muted uppercase tracking-wider font-semibold font-data">
            Humor da Vítima
          </label>
          <select
            value={resonance}
            disabled={disabled}
            onChange={(e) => handleResonanceChange(e.target.value)}
            className="bg-bg-input border border-white/10 text-text-primary text-xs px-2 rounded-xs outline-none focus:border-blood-red/60 transition-all duration-150 h-8 font-reading cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
          >
            {RESONANCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-card text-text-primary">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Input de Discrasi */}
        <div className="flex flex-col space-y-1">
          <label className="text-[9px] text-text-muted uppercase tracking-wider font-semibold font-data">
            Discrasi (Bônus Temporário)
          </label>
          <input
            type="text"
            value={localDyscrasia}
            disabled={disabled}
            placeholder={disabled ? "Sem discrasi ativa." : "Ex: +1 dado em Dominação..."}
            onChange={(e) => setLocalDyscrasia(e.target.value)}
            onBlur={handleDyscrasiaBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleDyscrasiaBlur();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="bg-bg-input border border-white/10 text-text-primary text-xs px-2 rounded-xs outline-none focus:border-blood-red/60 transition-all duration-150 h-8 font-reading placeholder:text-text-dim/40 disabled:opacity-55 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
