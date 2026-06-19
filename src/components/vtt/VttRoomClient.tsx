"use client";

import React, { useState } from "react";
import PlayerDock from "./PlayerDock";
import SheetDrawer from "./SheetDrawer";
import CharacterSheetClient from "@/components/sheet/CharacterSheetClient";

interface VttRoomClientProps {
  character: {
    id: string;
    campaignId: string;
    userId: string | null;
    name: string;
    type: "jogador" | "npc" | "coterie";
    sheetData: any;
  };
}

export default function VttRoomClient({ character }: VttRoomClientProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [localCharacter, setLocalCharacter] = useState(character);
  const [dicePool, setDicePool] = useState<Array<{ id: string, label: string, value: number }>>([]);

  const handleTraitClick = (trait: { id: string, label: string, value: number }) => {
    setDicePool(prev => {
      // Se o trait já estiver no array, removemos (comportamento de toggle)
      if (prev.some(p => p.id === trait.id)) {
        return prev.filter(p => p.id !== trait.id);
      }
      
      // Se não estiver:
      // Se o array tiver menos de 2 itens, adicionamos.
      if (prev.length < 2) {
        return [...prev, trait];
      }
      
      // Se já tiver 2 itens, substituímos o segundo item (índice 1)
      const newPool = [...prev];
      newPool[1] = trait;
      return newPool;
    });
  };

  const clearPool = () => {
    setDicePool([]);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-bg-main relative text-text-primary">
      
      {/* O PALCO (z-0) - BACKGROUND ATMOSFÉRICO */}
      <div 
        className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-burgundy/15 via-bg-main to-bg-main flex flex-col items-center justify-center select-none p-4"
        style={{ height: "calc(100vh - 5rem)" }} // Descontar a altura do dock (20 / h-20 = 5rem)
      >
        <div className="text-center space-y-4 max-w-lg">
          <h1 className="text-5xl sm:text-6xl font-gothic text-blood-red tracking-wider animate-pulse leading-none uppercase">
            A Mesa da Crônica
          </h1>
          <div className="h-0.5 w-32 bg-gold-accent/40 mx-auto" />
          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-gold-accent font-data font-semibold">
            Crônica ID: {character.campaignId}
          </p>
          <p className="text-xs sm:text-sm text-text-dim/80 font-reading italic leading-relaxed pt-2">
            "As sombras de Manaus se movem à espreita. O sangue sussurra segredos que a noite tenta apagar."
          </p>
        </div>
      </div>

      {/* DOCK DE CONTROLE (z-40) */}
      <PlayerDock 
        character={localCharacter} 
        onOpenSheet={() => setIsSheetOpen(true)} 
        dicePool={dicePool}
        clearPool={clearPool}
      />

      {/* GAVETA DA FICHA (z-50) */}
      <SheetDrawer isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
        <CharacterSheetClient
          characterId={character.id}
          campaignId={character.campaignId}
          initialData={localCharacter.sheetData}
          initialName={character.name}
          dicePool={dicePool}
          onTraitClick={handleTraitClick}
          onDataChange={(newData) => {
            setLocalCharacter(prev => ({
              ...prev,
              sheetData: newData
            }));

            // Sincronizar reativamente os valores da pool se houver alterações de nível na ficha
            setDicePool(currentPool => {
              return currentPool.map(item => {
                let newValue = item.value;
                
                const physical = (newData.attributes?.physical as unknown) as Record<string, number> | undefined;
                const social = (newData.attributes?.social as unknown) as Record<string, number> | undefined;
                const mental = (newData.attributes?.mental as unknown) as Record<string, number> | undefined;
                const skills = (newData.skills as unknown) as Record<string, number> | undefined;

                // Verificar se é atributo
                if (physical && physical[item.id] !== undefined) {
                  newValue = physical[item.id];
                } else if (social && social[item.id] !== undefined) {
                  newValue = social[item.id];
                } else if (mental && mental[item.id] !== undefined) {
                  newValue = mental[item.id];
                }
                // Verificar se é habilidade
                else if (skills && skills[item.id] !== undefined) {
                  newValue = skills[item.id];
                }
                // Verificar se é disciplina
                else {
                  const disc = newData.disciplines?.find((d: any) => d.id === item.id);
                  if (disc) {
                    newValue = disc.level;
                  }
                }
                return { ...item, value: newValue };
              });
            });
          }}
        />
      </SheetDrawer>
    </div>
  );
}
