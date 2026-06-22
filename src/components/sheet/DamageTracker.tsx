"use client";

import React, { useTransition } from "react";
import { Tracker } from "@/types/character";
import TrackerBoxes from "./TrackerBoxes";
import { setTrackerDamageAction } from "@/app/actions/damageActions";

interface DamageTrackerProps {
  characterId: string;
  label: string;
  value: Tracker;
  onChange: (val: Tracker) => void;
  variant: "health" | "willpower";
}

export default function DamageTracker({
  characterId,
  label,
  value,
  onChange,
  variant
}: DamageTrackerProps) {
  const { max, superficial, aggravated } = value;
  const [isPending, startTransition] = useTransition();

  const handleBoxClick = (idx: number) => {
    let newSuperficial = superficial;
    let newAggravated = aggravated;

    // Determina o estado da caixa baseando-se na ordem visual (Agravado -> Superficial -> Vazio)
    const isAggravated = idx < aggravated;
    const isSuperficial = !isAggravated && idx < aggravated + superficial;
    const isEmpty = !isAggravated && !isSuperficial;

    if (isEmpty) {
      // Intenção: Adicionar dano superficial (se houver espaço livre)
      if (superficial + aggravated < max) {
        newSuperficial += 1;
      }
    } else if (isSuperficial) {
      // Intenção: Piorar o dano de Superficial (/) para Agravado (X)
      if (superficial > 0) {
        newSuperficial = Math.max(0, newSuperficial - 1);
        newAggravated = Math.min(max, newAggravated + 1);
      }
    } else if (isAggravated) {
      // Intenção: Curar/remover dano agravado (X)
      if (newAggravated > 0) {
        newAggravated = Math.max(0, newAggravated - 1);
      }
    }

    // Disparar transição e chamada imediata ao banco para evitar race conditions do autosave da ficha
    startTransition(async () => {
      try {
        const res = await setTrackerDamageAction(
          characterId,
          variant,
          newSuperficial,
          newAggravated
        );
        if (res.success && res[variant]) {
          // Atualiza a ficha localmente de forma otimista após a confirmação do banco
          onChange(res[variant]);
        } else {
          console.error("Erro ao registrar alteração de dano no banco:", res.error);
        }
      } catch (err) {
        console.error("Erro inesperado na chamada de dano:", err);
      }
    });
  };

  return (
    <div className="space-y-1">
      {/* CADASTRAR ACESSIBILIDADE */}
      <div className="flex justify-between items-center text-xs font-data uppercase font-semibold text-text-muted">
        <span>{label}</span>
        <span className="text-[10px] text-text-dim font-normal select-none">
          {isPending ? "Sincronizando..." : "Clique para alterar ou curar"}
        </span>
      </div>

      <TrackerBoxes
        max={max}
        superficial={superficial}
        aggravated={aggravated}
        variant={variant}
        onBoxClick={handleBoxClick}
        disabled={isPending}
      />
    </div>
  );
}
