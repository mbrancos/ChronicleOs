"use client";

import React, { useEffect } from "react";

interface SheetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function SheetDrawer({ isOpen, onClose, children }: SheetDrawerProps) {
  
  // Impede o scroll da página de fundo quando a gaveta estiver aberta
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* BACKDROP OVERLAY (z-50) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 z-50 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* DRAWER CONTAINER (z-50) */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-4xl bg-bg-main border-l border-white/10 z-50 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* HEADER COM BOTÃO FECHAR */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-bg-card shrink-0 select-none">
          <span className="text-xs uppercase tracking-widest text-gold-accent font-data font-semibold">
            Ficha do Personagem
          </span>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors cursor-pointer text-xs uppercase tracking-wider font-bold select-none flex items-center space-x-1.5 focus:outline-none"
          >
            <span>Fechar</span>
            <span className="text-lg">✕</span>
          </button>
        </div>

        {/* CONTEÚDO (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto bg-bg-main">
          {children}
        </div>
      </div>
    </>
  );
}
