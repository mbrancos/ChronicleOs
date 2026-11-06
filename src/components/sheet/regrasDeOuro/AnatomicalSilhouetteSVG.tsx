"use client";

import React, { useState } from "react";
import type { AnatomicalVitality, BodySectorId } from "@/types/systems/regrasDeOuro";

interface AnatomicalSilhouetteSVGProps {
  vitality: AnatomicalVitality;
  selectedSector: BodySectorId;
  onSelectSector: (sector: BodySectorId) => void;
  disabled?: boolean;
}

export default function AnatomicalSilhouetteSVG({
  vitality,
  selectedSector,
  onSelectSector,
  disabled = false,
}: AnatomicalSilhouetteSVGProps) {
  const [hoveredSector, setHoveredSector] = useState<BodySectorId | null>(null);

  // Determina a cor de preenchimento e contorno baseado no dano do setor
  const getSectorStyle = (sectorId: BodySectorId) => {
    const sector = vitality[sectorId];
    const isSelected = selectedSector === sectorId;
    const isHovered = hoveredSector === sectorId;

    if (!sector) {
      return {
        fill: "rgba(255, 255, 255, 0.05)",
        stroke: "rgba(255, 255, 255, 0.3)",
        strokeWidth: 1.5,
      };
    }

    let fillColor = "rgba(18, 18, 22, 0.75)"; // Fundo padrão intacto
    let strokeColor = "rgba(255, 255, 255, 0.35)";
    let filter = undefined;

    if (sector.agravado > 0) {
      fillColor = "rgba(128, 0, 8, 0.65)"; // Vermelho profundo agravado
      strokeColor = "#ff4d5a";
      filter = "drop-shadow(0px 0px 6px rgba(200, 36, 52, 0.8))";
    } else if (sector.letal > 0) {
      fillColor = "rgba(200, 36, 52, 0.45)"; // Carmesim letal
      strokeColor = "#c82434";
      filter = "drop-shadow(0px 0px 4px rgba(200, 36, 52, 0.5))";
    } else if (sector.normal > 0) {
      fillColor = "rgba(217, 119, 6, 0.35)"; // Âmbar contusivo
      strokeColor = "#f59e0b";
    }

    if (isSelected) {
      strokeColor = "#ffffff";
      filter = "drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.9))";
    } else if (isHovered && !disabled) {
      strokeColor = "#ffd84d";
    }

    return {
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: isSelected ? 2.5 : isHovered ? 2 : 1.5,
      filter,
      cursor: disabled ? "default" : "pointer",
      transition: "all 0.2s ease-in-out",
    };
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-4 bg-noir-card border border-white/10 rounded-sm">
      {/* Título decorativo em tarja minimalista */}
      <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-crimson-blood rounded-full animate-pulse" />
          <span className="text-[11px] font-condensed tracking-widest uppercase text-white font-bold">
            DIAGRAMA ANATÔMICO • 9 SETORES
          </span>
        </div>
        <span className="text-[9px] font-mono text-noir-text-muted">
          Clique no membro para examinar
        </span>
      </div>

      {/* SVG da Silhueta Humanoide */}
      <svg
        viewBox="0 0 300 480"
        className="w-full max-w-[260px] h-auto select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="anatomyGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c82434" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Halo de fundo atmosférico */}
        <circle cx="150" cy="240" r="140" fill="url(#anatomyGlow)" />

        {/* Linhas de grade técnica médica de fundo */}
        <line x1="150" y1="20" x2="150" y2="460" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
        <line x1="40" y1="120" x2="260" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
        <line x1="40" y1="240" x2="260" y2="240" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
        <line x1="40" y1="360" x2="260" y2="360" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

        {/* 1. CABEÇA */}
        <path
          d="M 150 25 C 132 25, 126 42, 126 58 C 126 78, 138 92, 150 94 C 162 92, 174 78, 174 58 C 174 42, 168 25, 150 25 Z"
          style={getSectorStyle("cabeca")}
          onClick={() => !disabled && onSelectSector("cabeca")}
          onMouseEnter={() => setHoveredSector("cabeca")}
          onMouseLeave={() => setHoveredSector(null)}
        />
        <text x="150" y="62" textAnchor="middle" className="text-[9px] font-mono font-bold fill-white/80 pointer-events-none">
          I
        </text>

        {/* 2. PESCOÇO */}
        <path
          d="M 141 94 L 140 114 L 160 114 L 159 94 Z"
          style={getSectorStyle("pescoco")}
          onClick={() => !disabled && onSelectSector("pescoco")}
          onMouseEnter={() => setHoveredSector("pescoco")}
          onMouseLeave={() => setHoveredSector(null)}
        />
        <text x="150" y="107" textAnchor="middle" className="text-[7px] font-mono fill-white/80 pointer-events-none">
          II
        </text>

        {/* 3. TÓRAX / TRONCO */}
        <path
          d="M 130 115 L 170 115 L 180 145 L 172 230 L 128 230 L 120 145 Z"
          style={getSectorStyle("torax")}
          onClick={() => !disabled && onSelectSector("torax")}
          onMouseEnter={() => setHoveredSector("torax")}
          onMouseLeave={() => setHoveredSector(null)}
        />
        <text x="150" y="175" textAnchor="middle" className="text-[12px] font-mono font-bold fill-white/90 pointer-events-none">
          III
        </text>

        {/* 4. BRAÇO DIREITO (lado esquerdo da tela) */}
        <path
          d="M 118 118 L 96 135 L 82 205 L 98 212 L 115 152 Z"
          style={getSectorStyle("braco_d")}
          onClick={() => !disabled && onSelectSector("braco_d")}
          onMouseEnter={() => setHoveredSector("braco_d")}
          onMouseLeave={() => setHoveredSector(null)}
        />
        <text x="98" y="170" textAnchor="middle" className="text-[8px] font-mono fill-white/80 pointer-events-none">
          IV
        </text>

        {/* 5. BRAÇO ESQUERDO (lado direito da tela) */}
        <path
          d="M 182 118 L 204 135 L 218 205 L 202 212 L 185 152 Z"
          style={getSectorStyle("braco_e")}
          onClick={() => !disabled && onSelectSector("braco_e")}
          onMouseEnter={() => setHoveredSector("braco_e")}
          onMouseLeave={() => setHoveredSector(null)}
        />
        <text x="202" y="170" textAnchor="middle" className="text-[8px] font-mono fill-white/80 pointer-events-none">
          V
        </text>

        {/* 6. MÃO DIREITA */}
        <path
          d="M 80 208 L 68 245 C 68 252, 85 252, 88 245 L 98 214 Z"
          style={getSectorStyle("mao_d")}
          onClick={() => !disabled && onSelectSector("mao_d")}
          onMouseEnter={() => setHoveredSector("mao_d")}
          onMouseLeave={() => setHoveredSector(null)}
        />
        <text x="80" y="235" textAnchor="middle" className="text-[7px] font-mono fill-white/80 pointer-events-none">
          VI
        </text>

        {/* 7. MÃO ESQUERDA */}
        <path
          d="M 220 208 L 232 245 C 232 252, 215 252, 212 245 L 202 214 Z"
          style={getSectorStyle("mao_e")}
          onClick={() => !disabled && onSelectSector("mao_e")}
          onMouseEnter={() => setHoveredSector("mao_e")}
          onMouseLeave={() => setHoveredSector(null)}
        />
        <text x="220" y="235" textAnchor="middle" className="text-[7px] font-mono fill-white/80 pointer-events-none">
          VII
        </text>

        {/* 8. PERNA DIREITA */}
        <path
          d="M 130 234 L 148 234 L 142 360 L 132 440 L 114 440 L 118 350 L 126 270 Z"
          style={getSectorStyle("perna_d")}
          onClick={() => !disabled && onSelectSector("perna_d")}
          onMouseEnter={() => setHoveredSector("perna_d")}
          onMouseLeave={() => setHoveredSector(null)}
        />
        <text x="132" y="340" textAnchor="middle" className="text-[9px] font-mono fill-white/80 pointer-events-none">
          VIII
        </text>

        {/* 9. PERNA ESQUERDA */}
        <path
          d="M 170 234 L 152 234 L 158 360 L 168 440 L 186 440 L 182 350 L 174 270 Z"
          style={getSectorStyle("perna_e")}
          onClick={() => !disabled && onSelectSector("perna_e")}
          onMouseEnter={() => setHoveredSector("perna_e")}
          onMouseLeave={() => setHoveredSector(null)}
        />
        <text x="168" y="340" textAnchor="middle" className="text-[9px] font-mono fill-white/80 pointer-events-none">
          IX
        </text>
      </svg>

      {/* Legenda rápida */}
      <div className="flex items-center gap-3 mt-3 text-[9px] font-mono text-noir-text-secondary">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-amber-500/40 border border-amber-500 rounded-2xs" />
          Contusivo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-crimson-blood/50 border border-crimson-blood rounded-2xs" />
          Letal
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-crimson-aggravated/70 border border-red-400 rounded-2xs shadow-[0_0_4px_#c82434]" />
          Agravado
        </span>
      </div>
    </div>
  );
}
