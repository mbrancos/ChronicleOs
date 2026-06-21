"use client";

import React from "react";
import { Specialty } from "@/types/character";

interface DotSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  allowZero?: boolean;
  specialties?: Specialty[];
  variant?: "gold" | "red";
  onLabelClick?: () => void;
  isSelected?: boolean;
  baseValue?: number;
  showXpDistinction?: boolean;
  disabled?: boolean;
}

export default function DotSlider({
  label,
  value,
  onChange,
  allowZero = false,
  specialties = [],
  variant = "gold",
  onLabelClick,
  isSelected = false,
  baseValue,
  showXpDistinction = false,
  disabled = false
}: DotSliderProps) {
  
  // A área inteira da linha tem altura física de 44px (h-11) para touch target ideal no mobile.
  // A área de bolinhas tem tamanho fixo de 110px de largura para evitar overflow em telas de 375px.
  const handleTouchOrClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    // Divide a largura em 5 partes
    let newValue = Math.ceil(percentage * 5);
    if (newValue < 0) newValue = 0;
    if (newValue > 5) newValue = 5;

    // Se permitir zero e clicar na primeira bolinha já ativa, permite zerar (0)
    if (allowZero && newValue === 1 && value === 1) {
      onChange(0);
    } else {
      onChange(newValue === 0 ? 1 : newValue); // se não permitir zero, o valor mínimo é 1
    }
  };

  const isRed = variant === "red";

  return (
    <div 
      className={`flex justify-between items-center h-11 border-b border-white/5 hover:bg-white/5 px-2 rounded-sm transition-colors group ${
        disabled ? "pointer-events-none" : ""
      }`}
      role="slider"
      aria-label={`${label}: ${value} de 5`}
      aria-valuemin={allowZero ? 0 : 1}
      aria-valuemax={5}
      aria-valuenow={value}
    >
      {/* NOME DA HABILIDADE / ATRIBUTO */}
      <div 
        className={`flex flex-col justify-center leading-none ${onLabelClick && !disabled ? "cursor-pointer select-none" : ""}`}
        onClick={onLabelClick && !disabled ? (e) => {
          e.stopPropagation();
          onLabelClick();
        } : undefined}
      >
        <span className={`font-data uppercase tracking-wider text-xs transition-colors ${
          isSelected 
            ? "text-hunger-red font-bold animate-pulse-subtle" 
            : "text-text-muted group-hover:text-text-primary"
        }`}>
          {label}
        </span>
        
        {/* ESPECIALIZAÇÃO SE HOUVER */}
        {specialties.length > 0 && (
          <span className="text-[9px] text-gold-accent italic tracking-wide font-sans leading-tight">
            ({specialties.map(s => s.name).join(", ")})
          </span>
        )}
      </div>

      {/* ÁREA INTERATIVA DO SLIDER (TOQUE CONTÍNUO DE LARGURA FIXA 110px) */}
      <div 
        onClick={disabled ? undefined : handleTouchOrClick}
        className={`flex items-center justify-between space-x-1.5 h-full px-2 ${
          disabled ? "cursor-default" : "cursor-pointer"
        }`}
        style={{ width: "110px" }}
      >
        {Array.from({ length: 5 }).map((_, idx) => {
          const isActive = idx < value;
          const isBase = baseValue !== undefined ? idx < baseValue : true;

          let activeClass = "";
          if (isActive) {
            if (isRed) {
              activeClass = "bg-hunger-red ring-1 ring-hunger-red/40 shadow-[0_0_8px_rgba(255,92,92,0.5)]";
            } else if (showXpDistinction && !isBase) {
              activeClass = "bg-yellow-400 ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(255,223,0,0.9)] animate-pulse-subtle";
            } else {
              activeClass = showXpDistinction 
                ? "bg-blood-red ring-1 ring-blood-red/45 shadow-[0_0_6px_rgba(200,36,52,0.6)]" 
                : "bg-gold-accent ring-1 ring-gold-accent/40 shadow-[0_0_8px_rgba(255,216,77,0.5)]";
            }
          } else {
            activeClass = "bg-bg-main border border-text-dim/80 hover:border-gold-accent";
          }

          return (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${activeClass}`}
            />
          );
        })}
      </div>

    </div>
  );
}
