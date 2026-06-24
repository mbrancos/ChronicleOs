"use client";

import React, { useState, useTransition } from "react";
import { applyDamageAction } from "@/app/actions/damageActions";
import { useToast } from "@/context/ToastContext";

interface DamageModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  onDamageApplied?: (
    trackType: "health" | "willpower",
    updatedData: { superficial: number; aggravated: number; max: number }
  ) => void;
}

export default function DamageModal({
  isOpen,
  onClose,
  characterId,
  characterName,
  onDamageApplied
}: DamageModalProps) {
  const { showError } = useToast();
  const [track, setTrack] = useState<"health" | "willpower">("health");
  const [operation, setOperation] = useState<"damage" | "heal">("damage");
  const [damageType, setDamageType] = useState<"superficial" | "aggravated">("superficial");
  const [quantity, setQuantity] = useState<number>(1);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    // Cura é quantidade negativa; dano é positiva
    const amount = operation === "heal" ? -quantity : quantity;

    startTransition(async () => {
      try {
        const res = await applyDamageAction(characterId, track, amount, damageType);
        if (res.success && res[track]) {
          if (onDamageApplied) {
            onDamageApplied(track, res[track]);
          }
          onClose();
        } else {
          showError(`Falha ao aplicar alteração: ${res.error}`, "Ajuste de Status");
        }
      } catch (err) {
        console.error("Erro no envio do modal de dano:", err);
        showError("Erro inesperado ao registrar alteração.", "Erro");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="w-[360px] bg-bg-card-dark border border-white/10 rounded-sm p-5 shadow-2xl flex flex-col space-y-4">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center border-b border-white/10 pb-2">
          <h3 className="text-sm font-gothic text-blood-red tracking-widest uppercase">
            Ajustar Trilha de Status
          </h3>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-text-muted hover:text-white text-[10px] uppercase tracking-wider font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Fechar [X]
          </button>
        </div>

        {/* Nome do Alvo */}
        <div className="text-[11px] uppercase tracking-widest text-gold-accent font-data font-semibold">
          Alvo: {characterName}
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Seleção de Trilha */}
          <div className="flex flex-col space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-text-muted font-bold font-data">Trilha</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTrack("health")}
                disabled={isPending}
                className={`py-1.5 font-data text-[10px] uppercase tracking-wider rounded-xs border transition-all cursor-pointer ${
                  track === "health"
                    ? "bg-blood-red/10 border-blood-red text-blood-red font-bold"
                    : "border-white/10 bg-white/5 text-text-muted hover:text-white"
                }`}
              >
                🩸 Vitalidade
              </button>
              <button
                type="button"
                onClick={() => setTrack("willpower")}
                disabled={isPending}
                className={`py-1.5 font-data text-[10px] uppercase tracking-wider rounded-xs border transition-all cursor-pointer ${
                  track === "willpower"
                    ? "bg-willpower-blue/10 border-willpower-blue text-willpower-blue font-bold"
                    : "border-white/10 bg-white/5 text-text-muted hover:text-white"
                }`}
              >
                🧠 Força de Vontade
              </button>
            </div>
          </div>

          {/* Operação: Dano ou Cura */}
          <div className="flex flex-col space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-text-muted font-bold font-data">Operação</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOperation("damage")}
                disabled={isPending}
                className={`py-1.5 font-data text-[10px] uppercase tracking-wider rounded-xs border transition-all cursor-pointer ${
                  operation === "damage"
                    ? "bg-hunger-red/20 border-hunger-red text-hunger-red font-bold"
                    : "border-white/10 bg-white/5 text-text-muted hover:text-white"
                }`}
              >
                Dano
              </button>
              <button
                type="button"
                onClick={() => setOperation("heal")}
                disabled={isPending}
                className={`py-1.5 font-data text-[10px] uppercase tracking-wider rounded-xs border transition-all cursor-pointer ${
                  operation === "heal"
                    ? "bg-green-600/20 border-green-600 text-green-500 font-bold"
                    : "border-white/10 bg-white/5 text-text-muted hover:text-white"
                }`}
              >
                Cura
              </button>
            </div>
          </div>

          {/* Tipo de Dano: Superficial ou Agravado */}
          <div className="flex flex-col space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-text-muted font-bold font-data">Tipo de Gravidade</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDamageType("superficial")}
                disabled={isPending}
                className={`py-1.5 font-data text-[10px] uppercase tracking-wider rounded-xs border transition-all cursor-pointer ${
                  damageType === "superficial"
                    ? "bg-white/10 border-white/30 text-white font-bold"
                    : "border-white/10 bg-black/35 text-text-muted hover:text-white"
                }`}
              >
                Superficial (/)
              </button>
              <button
                type="button"
                onClick={() => setDamageType("aggravated")}
                disabled={isPending}
                className={`py-1.5 font-data text-[10px] uppercase tracking-wider rounded-xs border transition-all cursor-pointer ${
                  damageType === "aggravated"
                    ? "bg-deep-crimson/20 border-deep-crimson text-hunger-red font-bold"
                    : "border-white/10 bg-black/35 text-text-muted hover:text-white"
                }`}
              >
                Agravado (X)
              </button>
            </div>
          </div>

          {/* Quantidade */}
          <div className="flex flex-col space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-text-muted font-bold font-data">Quantidade</label>
            <input
              type="number"
              min="1"
              max="10"
              value={quantity}
              disabled={isPending}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-2.5 py-1.5 border border-white/10 rounded-xs bg-black/45 focus:outline-none focus:border-gold-accent text-text-primary text-center font-mono font-bold"
            />
          </div>

          {/* Botão Principal de Envio */}
          <button
            type="submit"
            disabled={isPending}
            className={`w-full py-2 bg-linear-to-r from-red-700 to-burgundy hover:from-red-600 hover:to-red-700 text-white font-data font-bold text-xs uppercase tracking-wider rounded-xs transition-all shadow-md ${
              isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {isPending ? "Processando..." : "Confirmar Alteração"}
          </button>
        </form>
      </div>
    </div>
  );
}
