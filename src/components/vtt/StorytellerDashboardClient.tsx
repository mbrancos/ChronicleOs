"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ActionFeed, { RollItem } from "./ActionFeed";
import DirectorBoard from "./DirectorBoard";
import SheetDrawer from "./SheetDrawer";
import CharacterSheetClient from "@/components/sheet/CharacterSheetClient";
import { TokenData } from "./Token";
import { getRecentRolls, saveRoll } from "@/app/actions/rolls";
import { getSceneTokens, createSceneToken, deleteSceneToken, toggleTokenAction, resetRound } from "@/app/actions/sceneActions";
import { getCampaignDashboard } from "@/app/actions/narratorActions";
import { updateCharacterSheet } from "@/app/actions/characterActions";
import { rollV5, rollRouseCheck } from "@/lib/vtt/BloodEngine";
import { characters } from "@/db/schema";
import { CharacterSheetData } from "@/types/character";

type CampaignCharacter = typeof characters.$inferSelect;

interface StorytellerDashboardClientProps {
  campaign: {
    id: string;
    name: string;
    narratorId: string;
    description: string | null;
  };
}

export default function StorytellerDashboardClient({ campaign }: StorytellerDashboardClientProps) {
  // Estados para rolagens e tokens
  const [rollsList, setRollsList] = useState<RollItem[]>([]);
  const [tokensList, setTokensList] = useState<TokenData[]>([]);
  
  // Personagens da campanha (Players e NPCs completos)
  const [playersList, setPlayersList] = useState<CampaignCharacter[]>([]);
  const [npcsList, setNpcsList] = useState<CampaignCharacter[]>([]);

  // Estado da Gaveta de Ficha
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  // Estados do Mini-Formulário de Figurante Rápido
  const [quickName, setQuickName] = useState("");
  const [quickPhysical, setQuickPhysical] = useState(4);
  const [quickSocial, setQuickSocial] = useState(4);
  const [quickHealth, setQuickHealth] = useState(4);

  // Estados do Dock do Narrador
  const [narratorPool, setNarratorPool] = useState(6);
  const [narratorDifficulty, setNarratorDifficulty] = useState(3);
  const [customActionName, setCustomActionName] = useState("");

  const isFetchingRolls = useRef(false);
  const isFetchingTokens = useRef(false);

  // 1. Polling de Rolagens Recentes
  const fetchRecentRolls = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (isFetchingRolls.current) return;

    try {
      isFetchingRolls.current = true;
      const res = await getRecentRolls(campaign.id);
      if (res.success && res.data) {
        setRollsList(res.data as RollItem[]);
      }
    } catch (err) {
      console.error("Erro ao buscar rolagens do Narrador:", err);
    } finally {
      isFetchingRolls.current = false;
    }
  }, [campaign.id]);

  // 2. Polling de Tokens de Cena
  const fetchSceneTokens = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (isFetchingTokens.current) return;

    try {
      isFetchingTokens.current = true;
      const res = await getSceneTokens(campaign.id, true);
      if (res.success && res.data) {
        setTokensList(res.data as TokenData[]);
      }
    } catch (err) {
      console.error("Erro ao buscar tokens de cena:", err);
    } finally {
      isFetchingTokens.current = false;
    }
  }, [campaign.id]);

  // 3. Buscar Personagens da Campanha (Players & NPCs completos)
  const fetchCampaignCharacters = useCallback(async () => {
    try {
      const res = await getCampaignDashboard(campaign.id);
      if (res.success && res.data) {
        setPlayersList(res.data.players || []);
        setNpcsList(res.data.npcs || []);
      }
    } catch (err) {
      console.error("Erro ao buscar personagens da campanha:", err);
    }
  }, [campaign.id]);

  // Configuração Geral dos Pollings
  useEffect(() => {
    // Carga inicial assíncrona
    Promise.resolve().then(() => {
      fetchRecentRolls();
      fetchSceneTokens();
      fetchCampaignCharacters();
    });

    const rollsInterval = setInterval(fetchRecentRolls, 2500);
    const tokensInterval = setInterval(fetchSceneTokens, 2500);
    // Personagens podem ter polling mais lento para economizar recursos (ex: a cada 8s)
    const charsInterval = setInterval(fetchCampaignCharacters, 8000);

    return () => {
      clearInterval(rollsInterval);
      clearInterval(tokensInterval);
      clearInterval(charsInterval);
    };
  }, [campaign.id, fetchRecentRolls, fetchSceneTokens, fetchCampaignCharacters]);

  // Ação: Adicionar Personagem da Campanha ao Tabuleiro
  const handleAddCharacterToBoard = async (char: CampaignCharacter) => {
    try {
      const isPlayer = char.type === "jogador";
      const tokenType = isPlayer ? "player" : "full_npc";
      
      // Criar nos bastidores (x:500, y:300, isVisible:false) por padrão
      const res = await createSceneToken(
        campaign.id,
        char.id,
        char.name,
        tokenType,
        500,
        300,
        false
      );

      if (res.success) {
        await fetchSceneTokens();
      } else {
        alert(`Erro ao adicionar personagem: ${res.error}`);
      }
    } catch (err) {
      console.error("Erro ao adicionar personagem ao tabuleiro:", err);
    }
  };

  // Ação: Criar Figurante Rápido (Quick NPC)
  const handleCreateQuickNPC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      alert("Por favor, informe o nome do figurante.");
      return;
    }

    try {
      const res = await createSceneToken(
        campaign.id,
        null, // sem character_id
        quickName,
        "quick_npc",
        500, // Centro X
        300, // Centro Y
        false, // Nos bastidores
        {
          physical: quickPhysical,
          social: quickSocial,
          health: quickHealth,
        }
      );

      if (res.success) {
        setQuickName("");
        await fetchSceneTokens();
      } else {
        alert(`Erro ao criar figurante: ${res.error}`);
      }
    } catch (err) {
      console.error("Erro ao criar figurante rápido:", err);
    }
  };

  // Ação: Remover Token do Tabuleiro
  const handleDeleteToken = async (tokenId: string) => {
    try {
      const res = await deleteSceneToken(tokenId);
      if (res.success) {
        setTokensList((prev) => prev.filter((t) => t.id !== tokenId));
      }
    } catch (err) {
      console.error("Erro ao remover token:", err);
    }
  };

  // Ação: Alternar estado de ação do token (hasActed)
  const handleToggleTokenActed = async (tokenId: string, hasActed: boolean) => {
    // Optimistic UI
    setTokensList((prev) =>
      prev.map((t) => (t.id === tokenId ? { ...t, hasActed } : t))
    );

    try {
      const res = await toggleTokenAction(tokenId, hasActed);
      if (!res.success) {
        console.error("Falha ao atualizar estado de ação do token:", res.error);
        await fetchSceneTokens();
      }
    } catch (err) {
      console.error("Erro ao chamar toggleTokenAction:", err);
      await fetchSceneTokens();
    }
  };

  // Ação: Reiniciar Rodada (hasActed = false para todos)
  const handleResetRound = async () => {
    // Optimistic UI
    setTokensList((prev) =>
      prev.map((t) => ({ ...t, hasActed: false }))
    );

    try {
      const res = await resetRound(campaign.id);
      if (!res.success) {
        console.error("Falha ao reiniciar rodada no banco:", res.error);
        await fetchSceneTokens();
      }
    } catch (err) {
      console.error("Erro ao chamar resetRound:", err);
      await fetchSceneTokens();
    }
  };

  // Ação: Duplo Clique para Abrir Ficha
  const handleDoubleClickToken = (characterId: string) => {
    setSelectedCharacterId(characterId);
    setIsSheetOpen(true);
  };

  // Ação: Rolagem Rápida do Popover de Figurante Rápido
  const handleQuickRollToken = async (
    tokenId: string,
    tokenName: string,
    statName: string,
    value: number,
    isSecret: boolean
  ) => {
    // Figurantes rolam com Fome = 0 e Dificuldade = 0 (mostra todos os sucessos puros)
    const result = rollV5(value, 0, 0);

    try {
      const res = await saveRoll(
        campaign.id,
        null, // não anexa ficha do jogador
        tokenName,
        `Teste de ${statName}`,
        result,
        isSecret
      );

      if (res.success) {
        await fetchRecentRolls();
      }
    } catch (err) {
      console.error("Erro ao executar rolagem de figurante rápido:", err);
    }
  };

  // Ação: Rolar Dados pelo Dock do Narrador
  const handleNarratorRoll = async (isSecret: boolean) => {
    // O Narrador rola sem Fome (Fome = 0)
    const result = rollV5(narratorPool, 0, narratorDifficulty);
    const label = customActionName.trim() || "Rolagem do Narrador";

    try {
      const res = await saveRoll(
        campaign.id,
        null,
        "Narrador",
        label,
        result,
        isSecret
      );

      if (res.success) {
        setCustomActionName("");
        await fetchRecentRolls();
      }
    } catch (err) {
      console.error("Erro ao realizar rolagem do Narrador:", err);
    }
  };

  // Ação: Rolar Teste de Despertar pelo Dock do Narrador
  const handleNarratorRouseCheck = async (isSecret: boolean) => {
    const result = rollRouseCheck();
    try {
      const res = await saveRoll(
        campaign.id,
        null,
        "Narrador",
        "Teste de Despertar (Narrador)",
        result,
        isSecret
      );

      if (res.success) {
        await fetchRecentRolls();
      }
    } catch (err) {
      console.error("Erro ao realizar Rouse Check do Narrador:", err);
    }
  };

  // Buscar ficha selecionada para o Drawer
  const getSelectedCharacterData = () => {
    if (!selectedCharacterId) return null;
    const char = [...playersList, ...npcsList].find((c) => c.id === selectedCharacterId);
    return char || null;
  };

  const selectedChar = getSelectedCharacterData();

  return (
    <div className="w-screen h-screen overflow-hidden bg-bg-main relative text-text-primary flex">
      {/* 1. MESA CENTRAL COM TABULEIRO 2D (DirectorBoard) */}
      <div className="flex-1 h-full relative flex items-center justify-center p-4">
        {/* Título de Contexto no topo central */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center select-none">
          <h1 className="text-xl font-gothic text-blood-red tracking-widest uppercase">
            Dashboard do Narrador
          </h1>
          <p className="text-[9px] uppercase tracking-widest text-gold-accent font-data font-semibold">
            {campaign.name}
          </p>
        </div>

        <DirectorBoard
          tokens={tokensList}
          isStoryteller={true}
          onDoubleClickToken={handleDoubleClickToken}
          onQuickRollToken={handleQuickRollToken}
          onDeleteToken={handleDeleteToken}
          onToggleTokenActed={handleToggleTokenActed}
          onResetRound={handleResetRound}
        />
      </div>

      {/* 2. FEED DE ROlagens MULTIPLAYER (flutua na esquerda) */}
      <ActionFeed rolls={rollsList} isStoryteller={true} />

      {/* 3. DOCK DO NARRADOR (inferior central) */}
      <div className="absolute bottom-4 left-80 right-88 flex justify-center z-40 pointer-events-none">
        <div className="pointer-events-auto w-[620px] bg-bg-card-dark/95 backdrop-blur-md border border-white/10 rounded-sm p-3 shadow-2xl flex items-center justify-between space-x-4 select-none">
          {/* Seletor de Pool de Dados */}
          <div className="flex flex-col space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-text-muted font-data font-bold">Pool de Dados</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setNarratorPool(Math.max(1, narratorPool - 1))}
                className="w-6 h-6 border border-white/10 hover:border-white/20 bg-white/5 rounded-xs flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center text-sm font-bold font-mono text-gold-accent">{narratorPool}</span>
              <button
                onClick={() => setNarratorPool(Math.min(20, narratorPool + 1))}
                className="w-6 h-6 border border-white/10 hover:border-white/20 bg-white/5 rounded-xs flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Seletor de Dificuldade */}
          <div className="flex flex-col space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-text-muted font-data font-bold">Dificuldade</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setNarratorDifficulty(Math.max(0, narratorDifficulty - 1))}
                className="w-6 h-6 border border-white/10 hover:border-white/20 bg-white/5 rounded-xs flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center text-sm font-bold font-mono text-gold-accent">{narratorDifficulty}</span>
              <button
                onClick={() => setNarratorDifficulty(Math.min(10, narratorDifficulty + 1))}
                className="w-6 h-6 border border-white/10 hover:border-white/20 bg-white/5 rounded-xs flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Nome da Ação Customizada */}
          <div className="flex-1 flex flex-col space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-text-muted font-data font-bold">Ação</span>
            <input
              type="text"
              value={customActionName}
              onChange={(e) => setCustomActionName(e.target.value)}
              placeholder="Ex: Ataque de Garra"
              className="px-2 py-1 text-xs border border-white/10 rounded-xs bg-black/45 focus:outline-none focus:border-gold-accent text-text-primary"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center space-x-2 pt-4">
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => handleNarratorRoll(false)}
                className="py-1 px-2.5 bg-linear-to-r from-red-700 to-burgundy hover:from-red-600 hover:to-red-700 text-white font-data font-bold text-[10px] uppercase tracking-wider rounded-xs transition-all shadow-md cursor-pointer"
              >
                Público
              </button>
              <button
                onClick={() => handleNarratorRoll(true)}
                className="py-1 px-2.5 bg-willpower-blue hover:bg-blue-600 text-white font-data font-bold text-[10px] uppercase tracking-wider rounded-xs transition-all shadow-md cursor-pointer"
              >
                Secreto
              </button>
            </div>

            <div className="flex flex-col space-y-1 border-l border-white/10 pl-2">
              <button
                onClick={() => handleNarratorRouseCheck(false)}
                className="py-1 px-2 bg-white/5 hover:bg-white/15 text-text-primary font-data font-bold text-[9px] uppercase tracking-wider rounded-xs transition-all cursor-pointer border border-white/10"
              >
                Despertar Púb.
              </button>
              <button
                onClick={() => handleNarratorRouseCheck(true)}
                className="py-1 px-2 bg-willpower-blue/20 hover:bg-willpower-blue/30 text-willpower-blue font-data font-bold text-[9px] uppercase tracking-wider rounded-xs transition-all cursor-pointer border border-willpower-blue/20"
              >
                Despertar Sec.
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BARRA LATERAL DIREITA DE GERENCIAMENTO (Fichas e Figurantes) */}
      <div className="w-80 h-full bg-bg-card-dark/95 backdrop-blur-md border-l border-white/10 flex flex-col z-35 select-none shrink-0 p-4 space-y-4 overflow-y-auto scrollbar-none">
        {/* Seção: Personagens da Crônica */}
        <div className="flex flex-col space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-gold-accent font-data font-bold border-b border-white/10 pb-1">
            Fichas da Crônica
          </span>

          {/* Jogadores */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-none">
            <span className="text-[9px] font-bold text-text-muted uppercase">Jogadores</span>
            {playersList.length === 0 ? (
              <div className="text-[10px] text-text-dim italic">Sem jogadores cadastrados.</div>
            ) : (
              playersList.map((p) => {
                const isOnBoard = tokensList.some((t) => t.characterId === p.id);
                return (
                  <div key={p.id} className="flex justify-between items-center bg-black/35 p-1.5 rounded-sm border border-white/5">
                    <span className="text-xs font-semibold truncate max-w-[130px]" title={p.name}>
                      {p.name}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleDoubleClickToken(p.id)}
                        className="text-[9px] text-text-muted hover:text-white uppercase font-bold cursor-pointer"
                      >
                        Ficha
                      </button>
                      <button
                        disabled={isOnBoard}
                        onClick={() => handleAddCharacterToBoard(p)}
                        className="text-[9px] text-gold-accent hover:text-amber-300 disabled:text-text-dim/40 uppercase font-bold cursor-pointer"
                      >
                        {isOnBoard ? "Em Jogo" : "+ Tabuleiro"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* NPCs Completos */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-none pt-2">
            <span className="text-[9px] font-bold text-text-muted uppercase">NPCs Completos</span>
            {npcsList.length === 0 ? (
              <div className="text-[10px] text-text-dim italic">Sem NPCs cadastrados.</div>
            ) : (
              npcsList.map((npc) => {
                const isOnBoard = tokensList.some((t) => t.characterId === npc.id);
                return (
                  <div key={npc.id} className="flex justify-between items-center bg-black/35 p-1.5 rounded-sm border border-white/5">
                    <span className="text-xs font-semibold truncate max-w-[130px]" title={npc.name}>
                      {npc.name}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleDoubleClickToken(npc.id)}
                        className="text-[9px] text-text-muted hover:text-white uppercase font-bold cursor-pointer"
                      >
                        Ficha
                      </button>
                      <button
                        disabled={isOnBoard}
                        onClick={() => handleAddCharacterToBoard(npc)}
                        className="text-[9px] text-gold-accent hover:text-amber-300 disabled:text-text-dim/40 uppercase font-bold cursor-pointer"
                      >
                        {isOnBoard ? "Em Jogo" : "+ Tabuleiro"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Seção: Criar Figurante Rápido (Quick NPC) */}
        <div className="flex flex-col space-y-2 pt-2 border-t border-white/10">
          <span className="text-[10px] uppercase tracking-widest text-gold-accent font-data font-bold">
            Novo Figurante Rápido
          </span>
          <form onSubmit={handleCreateQuickNPC} className="space-y-2.5 text-xs">
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] text-text-muted font-bold uppercase">Nome</label>
              <input
                type="text"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="Ex: Guarda do Porto"
                className="px-2 py-1 border border-white/10 rounded-xs bg-black/45 focus:outline-none focus:border-gold-accent text-text-primary"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col space-y-1">
                <label className="text-[8px] text-text-muted font-bold uppercase text-center">Físico</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quickPhysical}
                  onChange={(e) => setQuickPhysical(Number(e.target.value))}
                  className="px-1 py-1 text-center border border-white/10 rounded-xs bg-black/45 focus:outline-none focus:border-gold-accent text-text-primary font-mono font-bold"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[8px] text-text-muted font-bold uppercase text-center">Social</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quickSocial}
                  onChange={(e) => setQuickSocial(Number(e.target.value))}
                  className="px-1 py-1 text-center border border-white/10 rounded-xs bg-black/45 focus:outline-none focus:border-gold-accent text-text-primary font-mono font-bold"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[8px] text-text-muted font-bold uppercase text-center">Combate</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quickHealth}
                  onChange={(e) => setQuickHealth(Number(e.target.value))}
                  className="px-1 py-1 text-center border border-white/10 rounded-xs bg-black/45 focus:outline-none focus:border-gold-accent text-text-primary font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-1.5 py-1.5 bg-linear-to-r from-gold-accent to-amber-500 hover:from-amber-400 hover:to-gold-accent text-black font-data font-bold text-xs uppercase tracking-wider rounded-xs transition-all shadow-md cursor-pointer"
            >
              Criar no Tabuleiro
            </button>
          </form>
        </div>
      </div>

      {/* 5. GAVETA DE FICHA DO PERSONAGEM (Drawer) */}
      {selectedChar && (
        <SheetDrawer isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
          <CharacterSheetClient
            characterId={selectedChar.id}
            campaignId={campaign.id}
            initialData={selectedChar.sheetData as CharacterSheetData}
            initialName={selectedChar.name}
            dicePool={[]} // Narrador não usa pool de dados persistida na ficha
            onTraitClick={() => {}} // Narrador não acumula pool de traits
            onDataChange={async (newData) => {
              // Atualizar estado de personagens localmente de imediato
              const updateLocalList = (list: CampaignCharacter[]) =>
                list.map((c) => (c.id === selectedChar.id ? { ...c, sheetData: newData, name: newData.profile?.name || c.name } : c));
              
              if (selectedChar.type === "jogador") {
                setPlayersList(updateLocalList(playersList));
              } else {
                setNpcsList(updateLocalList(npcsList));
              }

              // Salvar no Neon DB via Server Action
              try {
                const res = await updateCharacterSheet(selectedChar.id, newData);
                if (!res.success) {
                  console.error("Falha ao salvar modificações da ficha pelo Narrador:", res.error);
                }
              } catch (err) {
                console.error("Erro ao chamar updateCharacterSheet pelo Narrador:", err);
              }
            }}
          />
        </SheetDrawer>
      )}
    </div>
  );
}
