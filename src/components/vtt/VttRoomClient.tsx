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

  return (
    <div className="w-screen h-screen overflow-hidden bg-bg-main relative text-text-primary">
      
      {/* O PALCO (z-0) - BACKGROUND ATMOSFÉRICO */}
      <div 
        className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-burgundy/15 via-bg-main to-bg-main flex flex-col items-center justify-center select-none p-4"
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
      />

      {/* GAVETA DA FICHA (z-50) */}
      <SheetDrawer isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
        <CharacterSheetClient
          characterId={character.id}
          campaignId={character.campaignId}
          initialData={localCharacter.sheetData}
          initialName={character.name}
          onDataChange={(newData) => setLocalCharacter(prev => ({
            ...prev,
            sheetData: newData
          }))}
        />
      </SheetDrawer>
    </div>
  );
}
