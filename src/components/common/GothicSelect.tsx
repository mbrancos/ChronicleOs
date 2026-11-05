"use client";

import React, { useState, useRef, useEffect, useId } from "react";

export interface GothicSelectOption {
  value: string | number;
  label: string;
  description?: string;
  badge?: string;
}

export interface GothicSelectProps {
  options: Array<string | number | GothicSelectOption>;
  value?: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  variant?: "gold" | "blood" | "default";
  className?: string;
  dropdownClassName?: string;
  label?: string;
  id?: string;
}

export default function GothicSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione uma opção...",
  disabled = false,
  searchable = false,
  variant = "default",
  className = "",
  dropdownClassName = "",
  label,
  id: customId,
}: GothicSelectProps) {
  const generatedId = useId();
  const selectId = customId || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalização das opções
  const normalizedOptions: GothicSelectOption[] = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return opt;
    }
    return {
      value: opt,
      label: String(opt),
    };
  });

  // Fechar dropdown ao clicar fora ou pressionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Foco no input de busca ao abrir se searchable
  useEffect(() => {
    if (isOpen && (searchable || normalizedOptions.length > 8)) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, searchable, normalizedOptions.length]);

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Filtragem de busca
  const isSearchActive = searchable || normalizedOptions.length > 8;
  const filteredOptions = isSearchActive && searchQuery.trim()
    ? normalizedOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (opt.badge && opt.badge.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : normalizedOptions;

  const handleSelect = (optValue: string | number) => {
    onChange(optValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const borderVariantClass =
    variant === "blood"
      ? "focus-within:border-blood-red hover:border-blood-red/60"
      : variant === "gold"
      ? "focus-within:border-gold-accent hover:border-gold-accent/60"
      : "focus-within:border-white/40 hover:border-white/30";

  const activeBadgeColor =
    variant === "blood"
      ? "text-blood-red bg-blood-red/10 border-blood-red/30"
      : variant === "gold"
      ? "text-gold-accent bg-gold-accent/10 border-gold-accent/30"
      : "text-white/80 bg-white/10 border-white/20";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-[10px] uppercase tracking-widest font-data text-text-muted block mb-1"
        >
          {label}
        </label>
      )}

      {/* Botão de Trigger */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full bg-bg-input border border-white/10 rounded-xs px-3 py-2 text-left text-xs font-data flex items-center justify-between gap-2 transition-all cursor-pointer ${borderVariantClass} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${isOpen ? "ring-1 ring-white/10" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate flex-1">
          {selectedOption ? (
            <span
              className={`font-medium ${
                variant === "blood"
                  ? "text-red-300 font-gothic tracking-wider"
                  : variant === "gold"
                  ? "text-amber-300 font-gothic tracking-wider"
                  : "text-text-primary"
              }`}
            >
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-text-dim">{placeholder}</span>
          )}
        </span>

        {selectedOption?.badge && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-2xs border uppercase font-mono ${activeBadgeColor}`}>
            {selectedOption.badge}
          </span>
        )}

        <svg
          className={`w-3.5 h-3.5 text-text-dim transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-text-primary" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu Dropdown Flutuante */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-1 bg-bg-card/95 backdrop-blur-md border border-white/15 rounded-xs shadow-[0_8px_32px_rgba(0,0,0,0.85)] z-[100] max-h-64 flex flex-col animate-fade-in ${dropdownClassName}`}
          role="listbox"
        >
          {/* Caixa de Busca Integrada */}
          {isSearchActive && (
            <div className="p-2 border-b border-white/10 sticky top-0 bg-bg-card/95 z-10">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digitar para filtrar..."
                className="w-full bg-black/40 border border-white/10 rounded-xs px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-white/30 font-data"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Lista de Opções Rolável */}
          <div className="overflow-y-auto max-h-52 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-text-dim font-reading">
                Nenhuma opção encontrada.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center justify-between gap-2 min-h-[40px] cursor-pointer ${
                      isSelected
                        ? variant === "blood"
                          ? "bg-blood-red/20 text-white font-semibold border-l-2 border-blood-red"
                          : variant === "gold"
                          ? "bg-gold-accent/20 text-gold-accent font-semibold border-l-2 border-gold-accent"
                          : "bg-white/10 text-white font-semibold border-l-2 border-white/60"
                        : "text-text-muted hover:bg-white/5 hover:text-text-primary"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex flex-col truncate flex-1">
                      <span className="truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="text-[10px] text-text-dim font-reading truncate mt-0.5">
                          {opt.description}
                        </span>
                      )}
                    </div>

                    {opt.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-2xs border border-white/10 bg-white/5 text-text-dim font-mono shrink-0">
                        {opt.badge}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
