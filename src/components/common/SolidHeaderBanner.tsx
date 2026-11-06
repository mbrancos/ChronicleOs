"use client";

import React from "react";

interface SolidHeaderBannerProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  action?: React.ReactNode;
  variant?: "noir" | "crimson";
  className?: string;
}

export default function SolidHeaderBanner({
  title,
  subtitle,
  icon,
  badge,
  action,
  variant = "noir",
  className = "",
}: SolidHeaderBannerProps) {
  const isCrimson = variant === "crimson";

  return (
    <div
      className={`w-full flex items-center justify-between px-3.5 py-2 bg-black border-b-2 ${
        isCrimson ? "border-crimson-blood shadow-[0_2px_12px_rgba(200,36,52,0.15)]" : "border-white/25"
      } ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Ícone em bloco invertido (Preto e Branco) */}
        {icon && (
          <div
            className={`w-5 h-5 flex-shrink-0 flex items-center justify-center text-xs font-mono font-bold ${
              isCrimson
                ? "bg-crimson-blood text-white shadow-[0_0_6px_rgba(200,36,52,0.6)]"
                : "bg-white text-black"
            }`}
          >
            {icon}
          </div>
        )}

        {/* Título Condensado em Caixa Alta */}
        <div className="flex items-baseline gap-2 min-w-0">
          <h3
            className={`text-sm sm:text-base font-condensed tracking-widest uppercase font-bold truncate ${
              isCrimson ? "text-white drop-shadow-[0_0_8px_rgba(200,36,52,0.4)]" : "text-white"
            }`}
          >
            {title}
          </h3>

          {subtitle && (
            <span className="text-[10px] font-mono text-noir-text-muted lowercase tracking-normal hidden md:inline truncate">
              {subtitle}
            </span>
          )}
        </div>

        {badge && (
          <span
            className={`px-1.5 py-0.5 text-[8px] uppercase tracking-widest font-mono font-bold rounded-2xs border ${
              isCrimson
                ? "bg-crimson-blood/20 text-crimson-blood border-crimson-blood/40"
                : "bg-white/10 text-white/90 border-white/20"
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Linha divisora central e Ações da Direita */}
      <div className="flex items-center gap-3">
        <div
          className={`hidden sm:block w-8 sm:w-16 h-px ${
            isCrimson ? "bg-crimson-blood/40" : "bg-white/15"
          }`}
        />
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
