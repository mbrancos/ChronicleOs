"use client";

import React, { useState, useEffect, useRef } from "react";
import Pusher, { Channel } from "pusher-js";
import RollLogItem from "./RollLogItem";
import { V5RollResult, RouseCheckResult } from "@/lib/vtt/BloodEngine";

export interface RollItem {
  id: string;
  campaignId: string;
  characterId: string | null;
  characterName: string;
  poolName: string;
  resultData: V5RollResult | RouseCheckResult;
  hungerDice: number;
  isRerolled: boolean;
  isSecret: boolean;
  createdAt: Date | string;
}

interface ActionFeedProps {
  rolls: RollItem[];
  campaignId: string;
  localCharacterId?: string;
  onReroll?: (rollId: string, indices: number[]) => Promise<void>;
  isRerolling?: boolean;
  isStoryteller?: boolean;
}

export default function ActionFeed({
  rolls,
  campaignId,
  localCharacterId,
  onReroll,
  isRerolling = false,
  isStoryteller = false,
}: ActionFeedProps) {
  const [localRolls, setLocalRolls] = useState<RollItem[]>(() => [...rolls].reverse());
  const [selectedDice, setSelectedDice] = useState<{ rollId: string; indices: number[] } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sincronizar rolagens iniciais do servidor invertendo a ordem para cronológica
  useEffect(() => {
    Promise.resolve().then(() => {
      setLocalRolls([...rolls].reverse());
    });
  }, [rolls]);

  // Auto-scroll para baixo a cada nova rolagem (com timeout curto para esperar atualização do DOM)
  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const timer = setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [localRolls]);

  // Conexão WebSocket do Pusher
  useEffect(() => {
    if (!campaignId) return;

    // Instanciar o Pusher Client
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: {
        endpoint: "/api/pusher/auth",
        transport: "ajax",
      },
    });

    const handleNewRoll = (newRoll: RollItem) => {
      setLocalRolls((prev) => {
        if (prev.some((r) => r.id === newRoll.id)) return prev;
        return [...prev, newRoll];
      });
    };

    const handleUpdateRoll = (data: { id: string; isRerolled: boolean }) => {
      setLocalRolls((prev) =>
        prev.map((r) => (r.id === data.id ? { ...r, isRerolled: data.isRerolled } : r))
      );
    };

    const handleXpGranted = (data: {
      sessionTitle: string;
      baseXp: number;
      individualGrants: { characterId: string; totalXp: number; characterName: string }[];
    }) => {
      const virtualRoll: RollItem = {
        id: `xp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        campaignId: campaignId,
        characterId: null,
        characterName: "Narrador",
        poolName: "Distribuição de XP",
        resultData: {
          type: "xp_grant",
          sessionTitle: data.sessionTitle,
          baseXp: data.baseXp,
          individualGrants: data.individualGrants,
        } as any,
        hungerDice: 0,
        isRerolled: false,
        isSecret: false,
        createdAt: new Date(),
      };
      setLocalRolls((prev) => [...prev, virtualRoll]);
    };

    const handleDamageApplied = (data: {
      characterId: string;
      characterName: string;
      trackType: "health" | "willpower";
      amount: number;
      damageType: "superficial" | "aggravated" | "override";
      newSuperficial: number;
      newAggravated: number;
      isCritical: boolean;
      createdAt: string | Date;
    }) => {
      const virtualRoll: RollItem = {
        id: `damage-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        campaignId: campaignId,
        characterId: data.characterId,
        characterName: data.characterName,
        poolName: "Registro de Dano",
        resultData: {
          type: "damage_log",
          trackType: data.trackType,
          amount: data.amount,
          damageType: data.damageType,
          newSuperficial: data.newSuperficial,
          newAggravated: data.newAggravated,
          isCritical: data.isCritical,
        } as any,
        hungerDice: 0,
        isRerolled: false,
        isSecret: false,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      };
      setLocalRolls((prev) => [...prev, virtualRoll]);
    };

    // 1. Assinar canal público
    const publicChannelName = `public-campaign-${campaignId}`;
    const publicChannel = pusher.subscribe(publicChannelName);
    publicChannel.bind("new-roll", handleNewRoll);
    publicChannel.bind("update-roll", handleUpdateRoll);
    publicChannel.bind("xp-granted", handleXpGranted);
    publicChannel.bind("damage-applied", handleDamageApplied);

    // 2. Se for Narrador, assinar canal privado
    let privateChannel: Channel | null = null;
    if (isStoryteller) {
      const privateChannelName = `private-gm-${campaignId}`;
      privateChannel = pusher.subscribe(privateChannelName);
      privateChannel.bind("new-roll", handleNewRoll);
      privateChannel.bind("update-roll", handleUpdateRoll);
      privateChannel.bind("damage-applied", handleDamageApplied);
    }

    return () => {
      publicChannel.unbind_all();
      pusher.unsubscribe(publicChannelName);
      if (privateChannel) {
        privateChannel.unbind_all();
        pusher.unsubscribe(privateChannel.name);
      }
      pusher.disconnect();
    };
  }, [campaignId, isStoryteller]);

  // Selecionar dados normais para Rerrolagem
  const handleSelectDie = (rollId: string, originalIdx: number) => {
    setSelectedDice((prev) => {
      if (!prev || prev.rollId !== rollId) {
        return { rollId, indices: [originalIdx] };
      }
      if (prev.indices.includes(originalIdx)) {
        const newIndices = prev.indices.filter((idx) => idx !== originalIdx);
        return newIndices.length === 0 ? null : { rollId, indices: newIndices };
      }
      if (prev.indices.length < 3) {
        return { rollId, indices: [...prev.indices, originalIdx] };
      }
      return prev;
    });
  };

  return (
    <div className="w-60 h-full bg-bg-card-dark/95 backdrop-blur-md border-r border-white/10 flex flex-col justify-end overflow-hidden z-30 shrink-0 p-4 select-none">
      {/* Container de scroll do histórico estilo chat */}
      <div
        ref={scrollRef}
        className="overflow-y-auto flex flex-col scrollbar-none pr-1.5 pb-2 h-full max-h-full space-y-2.5"
      >
        {localRolls.length === 0 ? (
          <div className="text-center py-4 bg-bg-card-dark/40 backdrop-blur-xs border border-white/5 rounded-sm p-4 text-[9px] uppercase tracking-widest text-text-dim/80 font-data select-none">
            Nenhum histórico nesta mesa
          </div>
        ) : (
          localRolls.map((roll) => (
            <div key={roll.id} className="flex flex-col space-y-1">
              <RollLogItem
                roll={roll}
                localCharacterId={localCharacterId}
                isStoryteller={isStoryteller}
                selectedDiceIndices={selectedDice?.rollId === roll.id ? selectedDice.indices : []}
                onSelectDie={handleSelectDie}
              />
              
              {/* Botão de Rerrolagem de Força de Vontade se houver dados selecionados */}
              {selectedDice?.rollId === roll.id && selectedDice.indices.length > 0 && (
                <button
                  disabled={isRerolling}
                  onClick={async () => {
                    if (onReroll) {
                      await onReroll(roll.id, selectedDice.indices);
                      setSelectedDice(null);
                    }
                  }}
                  className="w-full py-1 bg-linear-to-r from-gold-accent to-amber-500 hover:from-amber-400 hover:to-gold-accent disabled:from-gray-700 disabled:to-gray-800 disabled:text-text-dim text-black font-data font-bold text-[9px] uppercase tracking-wider rounded-xs transition-all duration-300 shadow-md cursor-pointer select-none"
                >
                  {isRerolling ? "Rerrolando..." : `Rerrolar ${selectedDice.indices.length} ${selectedDice.indices.length === 1 ? "Dado" : "Dados"} (1 FV)`}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
