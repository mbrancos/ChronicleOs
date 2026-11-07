"use client";

import React from "react";
import type { AnatomicalVitality, BodySectorId } from "@/types/systems/regrasDeOuro";

interface AnatomicalSilhouetteSVGProps {
  vitality: AnatomicalVitality;
  hoveredSector: BodySectorId | null;
  selectedSector?: BodySectorId | null;
  onHoverSector: (sector: BodySectorId | null) => void;
  onSelectSector?: (sector: BodySectorId) => void;
  disabled?: boolean;
  className?: string;
}

// 9 Caminhos Vetoriais 1:1 Extraídos Diretamente da Arte (383 x 808 px)
const SECTOR_VECTORS: Record<BodySectorId, string> = {
  cabeca:
    "M 187.0 17.4 L 193.0 17.0 L 205.0 19.4 L 221.6 29.2 L 227.2 51.0 L 225.9 64.9 L 231.0 68.7 L 232.0 72.0 L 229.8 87.0 L 218.1 106.0 L 207.0 117.0 L 196.0 121.9 L 184.0 120.9 L 171.0 112.0 L 154.7 88.0 L 151.9 78.0 L 152.8 69.1 L 158.1 64.9 L 156.8 51.0 L 162.4 29.2 L 175.0 21.2 L 186.0 17.6 Z",
  pescoco:
    "M 163.6 105.2 L 177.0 118.0 L 190.0 123.1 L 199.0 122.2 L 205.0 119.3 L 220.8 105.3 L 221.1 107.9 L 217.1 115.0 L 219.7 130.0 L 223.0 134.4 L 233.8 141.9 L 224.0 147.3 L 206.0 152.3 L 184.0 153.0 L 171.0 150.9 L 151.2 143.3 L 150.7 140.8 L 161.0 134.4 L 164.7 129.0 L 166.9 115.0 L 162.9 107.9 L 163.2 105.3 Z",
  torax:
    "M 147.0 143.4 L 171.0 151.9 L 188.0 154.1 L 206.0 153.3 L 235.0 143.6 L 241.0 144.4 L 246.3 150.0 L 262.8 199.0 L 262.2 209.8 L 257.1 219.9 L 262.4 225.4 L 258.8 253.0 L 261.0 257.3 L 258.0 264.0 L 260.6 275.0 L 255.6 292.0 L 254.0 305.0 L 258.0 340.0 L 257.6 352.3 L 213.0 376.8 L 195.4 384.6 L 185.0 383.8 L 129.0 354.8 L 126.2 351.6 L 126.0 340.0 L 130.0 305.0 L 128.4 292.0 L 123.4 275.0 L 126.0 264.0 L 123.0 257.3 L 125.2 253.0 L 121.6 227.0 L 122.1 224.1 L 126.3 221.9 L 126.9 219.9 L 122.2 211.1 L 120.9 202.0 L 137.7 150.0 L 141.2 145.6 L 146.0 143.6 Z",
  braco_d:
    "M 135.7 149.8 L 121.0 196.0 L 115.0 203.0 L 111.3 217.0 L 113.6 232.0 L 111.4 241.0 L 109.2 275.0 L 105.1 295.0 L 104.7 309.0 L 99.9 329.0 L 74.6 385.8 L 70.0 387.7 L 56.0 384.1 L 52.3 381.6 L 52.0 365.0 L 61.7 306.0 L 75.0 275.0 L 77.7 243.0 L 83.4 226.0 L 81.0 213.0 L 81.0 202.0 L 84.1 185.0 L 90.3 170.0 L 96.0 163.9 L 110.0 154.9 L 124.0 153.9 L 135.2 149.7 Z",
  braco_e:
    "M 248.3 149.8 L 258.0 153.4 L 273.0 154.7 L 277.6 156.9 L 291.7 167.1 L 298.6 181.0 L 303.0 202.0 L 303.0 213.0 L 300.6 226.0 L 306.3 243.0 L 309.0 275.0 L 322.3 306.0 L 334.8 378.0 L 333.4 382.0 L 316.0 387.1 L 311.6 385.7 L 296.0 358.0 L 285.7 334.0 L 279.3 309.0 L 278.9 295.0 L 274.9 276.0 L 272.6 241.0 L 270.4 232.0 L 272.7 217.0 L 269.0 203.0 L 263.0 196.0 L 248.0 150.1 Z",
  mao_d:
    "M 51.2 384.6 L 71.0 388.8 L 72.8 391.0 L 69.2 404.0 L 70.0 422.0 L 65.4 460.8 L 63.2 460.8 L 62.2 459.0 L 62.0 444.0 L 60.8 441.2 L 59.0 440.8 L 57.6 443.0 L 53.4 470.6 L 52.2 471.4 L 50.4 470.0 L 50.8 453.0 L 49.0 451.2 L 46.8 454.0 L 43.4 469.0 L 41.6 472.8 L 40.2 473.2 L 39.0 471.0 L 39.0 465.0 L 41.8 446.0 L 40.8 443.4 L 38.6 444.0 L 31.8 465.0 L 29.6 466.4 L 28.0 462.0 L 35.2 425.0 L 32.0 424.4 L 26.0 429.8 L 16.4 433.8 L 23.8 420.0 L 25.0 415.4 L 38.8 401.2 L 44.8 398.0 L 50.6 385.2 Z",
  mao_e:
    "M 331.0 384.4 L 335.6 384.8 L 344.0 399.6 L 354.0 407.6 L 358.0 409.4 L 358.4 414.0 L 363.0 417.4 L 363.2 422.0 L 369.6 433.8 L 367.0 434.4 L 363.0 432.4 L 356.0 425.4 L 351.0 423.4 L 349.0 424.0 L 355.0 445.0 L 357.6 463.0 L 356.8 465.8 L 355.4 465.8 L 352.8 462.0 L 350.4 454.0 L 347.2 454.0 L 346.0 457.0 L 347.4 471.0 L 345.0 473.4 L 343.6 472.6 L 341.4 467.0 L 337.8 449.4 L 336.2 449.4 L 335.0 452.0 L 335.4 469.0 L 333.8 470.6 L 331.8 469.0 L 328.8 455.0 L 328.4 442.0 L 326.8 439.4 L 325.2 439.4 L 324.0 442.0 L 323.6 460.0 L 321.8 461.8 L 320.0 460.0 L 319.0 439.0 L 315.2 425.0 L 315.0 413.0 L 316.8 403.0 L 313.2 390.2 L 315.0 388.4 L 330.0 384.6 Z",
  perna_d:
    "M 125.9 355.6 L 130.0 356.2 L 184.0 384.2 L 187.9 389.1 L 180.7 427.0 L 176.0 469.0 L 177.9 515.0 L 177.0 560.0 L 169.6 599.0 L 174.0 630.0 L 174.0 645.0 L 164.3 722.0 L 168.4 742.0 L 166.4 758.0 L 168.3 770.0 L 163.7 778.0 L 161.9 788.7 L 153.9 798.4 L 150.0 799.6 L 132.0 796.9 L 123.0 793.0 L 120.6 788.9 L 139.3 761.1 L 140.4 756.0 L 139.0 746.0 L 141.0 733.0 L 137.3 708.0 L 125.3 655.0 L 123.0 636.0 L 124.6 612.0 L 129.0 589.0 L 130.0 552.0 L 119.4 513.0 L 115.0 483.0 L 115.0 412.0 L 119.7 380.0 L 125.2 355.9 Z",
  perna_e:
    "M 257.4 355.3 L 260.0 358.0 L 264.3 380.0 L 270.3 417.0 L 272.0 445.0 L 267.3 498.0 L 254.0 552.0 L 255.0 589.0 L 259.4 612.0 L 261.0 636.0 L 258.7 655.0 L 246.7 708.0 L 243.0 733.0 L 245.0 746.0 L 243.6 756.0 L 244.7 761.1 L 263.4 788.9 L 261.8 792.4 L 253.0 796.6 L 234.0 799.6 L 228.6 797.2 L 222.1 788.7 L 220.3 778.0 L 215.7 770.0 L 217.6 758.0 L 215.6 742.0 L 219.7 722.0 L 210.0 645.0 L 210.0 630.0 L 214.4 599.0 L 207.0 560.0 L 206.1 515.0 L 208.0 469.0 L 203.3 427.0 L 196.1 389.1 L 199.0 384.8 L 256.7 355.3 Z",
};

// Mapeamento das 9 posições percentuais exatas dos nós do d10 na imagem (383 x 808)
const NODES_CONFIG: Record<
  BodySectorId,
  { pctX: number; pctY: number; label: string; name: string; isVital: boolean }
> = {
  cabeca: { pctX: 50.13, pctY: 5.57, label: "1", name: "Cabeça", isVital: true },
  pescoco: { pctX: 50.13, pctY: 16.83, label: "0", name: "Pescoço", isVital: true },
  torax: { pctX: 50.13, pctY: 34.65, label: "5•6", name: "Tórax", isVital: true },
  braco_d: { pctX: 24.02, pctY: 29.08, label: "2", name: "Braço D.", isVital: false },
  braco_e: { pctX: 76.24, pctY: 29.08, label: "9", name: "Braço E.", isVital: false },
  mao_d: { pctX: 13.58, pctY: 51.73, label: "3", name: "Mão D.", isVital: false },
  mao_e: { pctX: 86.68, pctY: 51.73, label: "8", name: "Mão E.", isVital: false },
  perna_d: { pctX: 39.69, pctY: 69.93, label: "4", name: "Perna D.", isVital: false },
  perna_e: { pctX: 60.57, pctY: 69.93, label: "7", name: "Perna E.", isVital: false },
};

export default function AnatomicalSilhouetteSVG({
  vitality,
  hoveredSector,
  selectedSector,
  onHoverSector,
  onSelectSector,
  disabled = false,
  className = "",
}: AnatomicalSilhouetteSVGProps) {
  // Status de dano do setor
  const getNodeDamage = (sectorId: BodySectorId) => {
    const sec = vitality[sectorId];
    if (!sec) return "intact";
    if (sec.agravado > 0) return "aggravated";
    if (sec.letal > 0) return "lethal";
    if (sec.normal > 0) return "normal";
    return "intact";
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none w-full ${className}`}>
      {/* Contêiner da Figura com Proporção Ampla 383:808 */}
      <div className="relative w-full max-w-[280px] sm:max-w-[310px] md:max-w-[340px] aspect-[383/808] rounded-md overflow-hidden bg-gradient-to-b from-[#070709] via-[#0b0b10] to-[#050507] border border-white/10 shadow-[0_8px_35px_rgba(0,0,0,0.85)] flex items-center justify-center">
        
        {/* Glow de Fundo e Luz Carmesim Ambiental */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(200,36,52,0.18)_0%,rgba(10,10,14,0.4)_50%,transparent_80%)] pointer-events-none" />

        {/* Camada Vetorial SVG Unificada: Coordenadas 1:1 com a Arte (viewBox 0 0 383 808) */}
        <svg
          viewBox="0 0 383 808"
          className="absolute inset-0 w-full h-full filter drop-shadow-[0_0_15px_rgba(200,36,52,0.35)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="crimsonOutlineGlowUnified" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="4" result="blur1" />
              <feGaussianBlur stdDeviation="1.5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Imagem do Corpo Recortado */}
          <image
            href="/images/corpo-recortado.jpg"
            xlinkHref="/images/corpo-recortado.jpg"
            x="0"
            y="0"
            width="383"
            height="808"
            preserveAspectRatio="none"
            className="pointer-events-none"
          />

          {/* Linhas de Mira Anatômicas Sutis */}
          <g stroke="rgba(255,255,255,0.18)" strokeWidth="1.1" strokeDasharray="4 4" className="pointer-events-none">
            <line x1="192" y1="45" x2="40" y2="45" />
            <line x1="192" y1="136" x2="343" y2="136" />
            <line x1="92" y1="235" x2="20" y2="235" />
            <line x1="292" y1="235" x2="363" y2="235" />
            <line x1="52" y1="418" x2="10" y2="418" />
            <line x1="332" y1="418" x2="373" y2="418" />
            <line x1="152" y1="565" x2="35" y2="565" />
            <line x1="232" y1="565" x2="348" y2="565" />
          </g>

          {/* Os 9 Contornos Vetoriais 1:1 Clicáveis */}
          <g>
            {(Object.keys(SECTOR_VECTORS) as BodySectorId[]).map((secId) => {
              const isSelected = selectedSector === secId;
              const isHovered = hoveredSector === secId;
              const d = SECTOR_VECTORS[secId];

              let stroke = "transparent";
              let fill = "transparent";
              let strokeWidth = 2;
              let filter = undefined;

              if (isSelected) {
                stroke = "#ff2a2a";
                strokeWidth = 3.2;
                fill = "rgba(200, 36, 52, 0.22)";
                filter = "url(#crimsonOutlineGlowUnified)";
              } else if (isHovered && !disabled) {
                stroke = "rgba(255, 77, 90, 0.75)";
                strokeWidth = 2.4;
                fill = "rgba(200, 36, 52, 0.12)";
              }

              return (
                <path
                  key={secId}
                  d={d}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={filter}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled && onSelectSector) onSelectSector(secId);
                  }}
                  onMouseEnter={() => !disabled && onHoverSector(secId)}
                  onMouseLeave={() => !disabled && onHoverSector(null)}
                  className={`transition-all duration-200 ${
                    disabled ? "cursor-default" : "cursor-pointer"
                  }`}
                />
              );
            })}
          </g>
        </svg>

        {/* Camada dos 9 Nós Numéricos d10 */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {(Object.keys(NODES_CONFIG) as BodySectorId[]).map((secId) => {
            const node = NODES_CONFIG[secId];
            const dmg = getNodeDamage(secId);
            const isHovered = hoveredSector === secId;
            const isSelected = selectedSector === secId;

            let nodeColor = "bg-white text-black border-black/80 shadow-[0_0_8px_rgba(255,255,255,0.7)]";
            let pulseGlow = "";

            if (dmg === "aggravated") {
              nodeColor = "bg-purple-900 text-purple-100 border-purple-400 shadow-[0_0_14px_#c084fc]";
              pulseGlow = "animate-pulse";
            } else if (dmg === "lethal") {
              nodeColor = "bg-crimson-blood text-white border-white shadow-[0_0_12px_#ef4444]";
              pulseGlow = "animate-pulse";
            } else if (dmg === "normal") {
              nodeColor = "bg-amber-600 text-amber-100 border-amber-300 shadow-[0_0_10px_#f59e0b]";
            }

            if (isHovered || isSelected) {
              nodeColor =
                "bg-white text-black border-crimson-blood ring-2 ring-white scale-125 shadow-[0_0_16px_rgba(255,255,255,0.95)]";
            }

            return (
              <button
                key={secId}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled && onSelectSector) onSelectSector(secId);
                }}
                onMouseEnter={() => !disabled && onHoverSector(secId)}
                onMouseLeave={() => !disabled && onHoverSector(null)}
                style={{
                  left: `${node.pctX}%`,
                  top: `${node.pctY}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute pointer-events-auto w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center font-mono font-bold text-[11px] transition-all duration-200 ${nodeColor} ${pulseGlow} ${
                  disabled ? "cursor-default" : "cursor-pointer"
                }`}
                title={`${node.name} (d10 = ${node.label})`}
              >
                <span>{node.label}</span>
                {(isHovered || isSelected || dmg !== "intact") && (
                  <span className="absolute -inset-1 rounded-full border border-crimson-blood/70 animate-ping pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        {/* Efeito Vinheta Noir Suave nas Bordas */}
        <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-transparent to-black/70 pointer-events-none" />
      </div>
    </div>
  );
}
