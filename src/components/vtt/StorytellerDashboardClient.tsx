"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ActionFeed, { RollItem } from "./ActionFeed";
import DirectorBoard from "./DirectorBoard";
import SheetDrawer from "./SheetDrawer";
import CharacterSheetClient from "@/components/sheet/CharacterSheetClient";
import { TokenData } from "./Token";
import { getRecentRolls, saveRoll } from "@/app/actions/rolls";
import { getSceneTokens, createSceneToken, deleteSceneToken, toggleTokenAction, resetRound, updateTokenQuickHealth } from "@/app/actions/sceneActions";
import { getCampaignDashboard } from "@/app/actions/narratorActions";
import { updateCharacterSheet } from "@/app/actions/characterActions";
import { rollV5, rollRouseCheck } from "@/lib/vtt/BloodEngine";
import { characters } from "@/db/schema";
import { CharacterSheetData } from "@/types/character";
import Pusher from "pusher-js";
import { 
  grantSessionXpAction, 
  vetoXpSpendAction, 
  getRecentCampaignXpSpends 
} from "@/app/actions/xpActions";

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
  
  // Referências para gerenciar debounces de chamadas assíncronas ao banco de dados por token/ficha
  const quickHealthDebounceRefs = useRef<{ [tokenId: string]: NodeJS.Timeout }>({});
  const charStatusDebounceRefs = useRef<{ [characterId: string]: NodeJS.Timeout }>({});

  // Limpar timeouts pendentes no unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(quickHealthDebounceRefs.current).forEach(clearTimeout);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(charStatusDebounceRefs.current).forEach(clearTimeout);
    };
  }, []);
  
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

  // Estados de XP (Fase 25)
  const [isXpModalOpen, setIsXpModalOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [baseXp, setBaseXp] = useState(2);
  const [individualXpData, setIndividualXpData] = useState<Record<string, { presence: boolean; desire: boolean; ambition: boolean; extra: number }>>({});
  const [recentXpSpends, setRecentXpSpends] = useState<any[]>([]);

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

  // 4. Buscar Gastos Recentes de XP
  const fetchRecentXpSpends = useCallback(async () => {
    try {
      const res = await getRecentCampaignXpSpends(campaign.id);
      if (res.success && res.data) {
        setRecentXpSpends(res.data);
      }
    } catch (err) {
      console.error("Erro ao buscar gastos recentes de XP:", err);
    }
  }, [campaign.id]);

  // Configuração Geral das Escutas do Pusher (WebSocket) e Sincronizações Resilientes
  useEffect(() => {
    // 1. Carga Inicial de Dados (envolvido em microtask para evitar cascading renders no linter)
    Promise.resolve().then(() => {
      fetchRecentRolls();
      fetchSceneTokens();
      fetchCampaignCharacters();
      fetchRecentXpSpends();
    });

    // 2. Conectar Cliente Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: {
        endpoint: "/api/pusher/auth",
        transport: "ajax",
      },
    });

    const publicChannelName = `public-campaign-${campaign.id}`;
    const privateChannelName = `private-gm-${campaign.id}`;

    const publicChannel = pusher.subscribe(publicChannelName);
    const privateChannel = pusher.subscribe(privateChannelName);

    // Handlers de atualização dos Tokens
    const handleTokenCreated = (token: TokenData) => {
      setTokensList((prev) => {
        if (prev.some((t) => t.id === token.id)) return prev;
        return [...prev, token];
      });
    };

    const handleTokenUpdated = (updatedToken: TokenData | (Partial<TokenData> & { id: string })) => {
      setTokensList((prev) =>
        prev.map((t) => (t.id === updatedToken.id ? { ...t, ...updatedToken } : t))
      );
    };

    const handleTokenDeleted = (data: { id: string }) => {
      setTokensList((prev) => prev.filter((t) => t.id !== data.id));
    };

    const handleRoundReset = () => {
      setTokensList((prev) => prev.map((t) => ({ ...t, hasActed: false })));
    };

    // Registrar binds em ambos os canais (Público e Privado do Narrador)
    publicChannel.bind("token-created", handleTokenCreated);
    publicChannel.bind("token-updated", handleTokenUpdated);
    publicChannel.bind("token-deleted", handleTokenDeleted);
    publicChannel.bind("round-reset", handleRoundReset);

    privateChannel.bind("token-created", handleTokenCreated);
    privateChannel.bind("token-updated", handleTokenUpdated);
    privateChannel.bind("token-deleted", handleTokenDeleted);
    privateChannel.bind("round-reset", handleRoundReset);

    // 3. Lógica de Resiliência: fetch pontual em reconexão ou foco ativo da aba do navegador
    const handleSync = () => {
      fetchRecentRolls();
      fetchSceneTokens();
      fetchCampaignCharacters();
    };

    pusher.connection.bind("connected", handleSync);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleSync();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      publicChannel.unbind_all();
      privateChannel.unbind_all();
      pusher.unsubscribe(publicChannelName);
      pusher.unsubscribe(privateChannelName);
      pusher.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
          combat: quickHealth,
          health: {
            max: 5,
            superficial: 0,
            aggravated: 0,
          },
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

  // Busca dados da ficha do personagem localmente a partir de playersList ou npcsList
  const getCharacterSheetData = useCallback((characterId: string): CharacterSheetData | null => {
    const char = playersList.find((p) => p.id === characterId) || npcsList.find((n) => n.id === characterId);
    return char ? (char.sheetData as CharacterSheetData) : null;
  }, [playersList, npcsList]);

  // Ação: Sincronizar saúde de Quick NPCs (figurantes rápidos) no banco com Optimistic UI + Debounce
  const handleUpdateQuickHealth = useCallback((
    tokenId: string,
    health: { max: number; superficial: number; aggravated: number }
  ) => {
    // 1. Optimistic UI local nos tokens
    setTokensList((prev) =>
      prev.map((t) => {
        if (t.id === tokenId && t.quickStats) {
          return {
            ...t,
            quickStats: {
              ...t.quickStats,
              health,
            },
          };
        }
        return t;
      })
    );

    // 2. Cancelar debounce anterior para esse token
    if (quickHealthDebounceRefs.current[tokenId]) {
      clearTimeout(quickHealthDebounceRefs.current[tokenId]);
    }

    // 3. Agendar a chamada da Server Action com debounce de 800ms
    quickHealthDebounceRefs.current[tokenId] = setTimeout(async () => {
      try {
        const res = await updateTokenQuickHealth(tokenId, health);
        if (!res.success) {
          console.error("Erro ao sincronizar vida do figurante:", res.error);
        }
      } catch (err) {
        console.error("Falha ao salvar vida do figurante:", err);
      } finally {
        delete quickHealthDebounceRefs.current[tokenId];
      }
    }, 800);
  }, []);

  // Ação: Sincronizar status da ficha de personagens completos no banco com Optimistic UI + Debounce
  const handleUpdateCharacterStatus = useCallback((
    characterId: string,
    status: {
      health?: { max: number; superficial: number; aggravated: number };
      willpower?: { max: number; superficial: number; aggravated: number };
    }
  ) => {
    // 1. Encontrar o personagem nas listas e clonar seu sheetData
    const isPlayer = playersList.some((p) => p.id === characterId);
    const targetList = isPlayer ? playersList : npcsList;
    const char = targetList.find((c) => c.id === characterId);
    if (!char) return;

    const sheet = char.sheetData as CharacterSheetData;
    const updatedSheetData: CharacterSheetData = {
      ...sheet,
      status: {
        ...sheet.status,
        health: status.health ? { ...sheet.status.health, ...status.health } : sheet.status.health,
        willpower: status.willpower ? { ...sheet.status.willpower, ...status.willpower } : sheet.status.willpower,
      },
    };

    // 2. Optimistic UI local nas listas correspondentes
    if (isPlayer) {
      setPlayersList((prev) =>
        prev.map((p) => (p.id === characterId ? { ...p, sheetData: updatedSheetData } : p))
      );
    } else {
      setNpcsList((prev) =>
        prev.map((n) => (n.id === characterId ? { ...n, sheetData: updatedSheetData } : n))
      );
    }

    // 3. Cancelar debounce anterior para esse personagem
    if (charStatusDebounceRefs.current[characterId]) {
      clearTimeout(charStatusDebounceRefs.current[characterId]);
    }

    // 4. Agendar a chamada da Server Action com debounce de 800ms
    charStatusDebounceRefs.current[characterId] = setTimeout(async () => {
      try {
        const res = await updateCharacterSheet(characterId, updatedSheetData);
        if (!res.success) {
          console.error("Erro ao sincronizar ficha de personagem:", res.error);
        }
      } catch (err) {
        console.error("Falha ao salvar dados de personagem:", err);
      } finally {
        delete charStatusDebounceRefs.current[characterId];
      }
    }, 800);
  }, [playersList, npcsList]);

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
          getCharacterSheetData={getCharacterSheetData}
          onDoubleClickToken={handleDoubleClickToken}
          onQuickRollToken={handleQuickRollToken}
          onDeleteToken={handleDeleteToken}
          onToggleTokenActed={handleToggleTokenActed}
          onUpdateQuickHealth={handleUpdateQuickHealth}
          onUpdateCharacterStatus={handleUpdateCharacterStatus}
          onResetRound={handleResetRound}
        />
      </div>

      {/* 2. FEED DE ROlagens MULTIPLAYER (flutua na esquerda) */}
      <ActionFeed rolls={rollsList} campaignId={campaign.id} isStoryteller={true} />

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

      {/* Distribuição e Auditoria de XP (Fase 25) */}
        <div className="flex flex-col space-y-2 pt-2 border-t border-white/10">
          <button
            onClick={() => {
              // Inicializar dados de XP para cada jogador
              const initialData: Record<string, any> = {};
              playersList.forEach(p => {
                initialData[p.id] = { presence: true, desire: false, ambition: false, extra: 0 };
              });
              setIndividualXpData(initialData);
              setSessionTitle("");
              setBaseXp(2);
              setIsXpModalOpen(true);
            }}
            className="w-full py-1.5 bg-blood-red hover:bg-burgundy text-white font-data font-bold text-[10px] uppercase tracking-wider rounded-xs transition-colors shadow-md cursor-pointer border border-blood-red/20"
          >
            Distribuir XP da Sessão
          </button>
        </div>

        <div className="flex flex-col space-y-2 pt-2 border-t border-white/10">
          <span className="text-[10px] uppercase tracking-widest text-gold-accent font-data font-bold">
            Auditoria Recente de XP
          </span>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none pr-1">
            {recentXpSpends.length === 0 ? (
              <div className="text-[9px] text-text-dim/60 italic">Nenhuma compra recente.</div>
            ) : (
              recentXpSpends.map((spend) => (
                <div key={spend.id} className="bg-black/35 border border-white/5 p-2 rounded-xs flex flex-col space-y-1 text-[10px]">
                  <div className="flex justify-between items-center font-bold text-text-primary">
                    <span className="truncate max-w-[120px]">{spend.characterName}</span>
                    <span className="text-hunger-red font-mono font-bold">{spend.xpChange} XP</span>
                  </div>
                  <div className="text-[9px] text-text-muted">
                    {spend.description}
                  </div>
                  {spend.metadata && (
                    <div className="text-[8px] text-amber-500/80 font-semibold uppercase tracking-wider">
                      Item: {spend.metadata.trait} ({spend.metadata.previousLevel} → {spend.metadata.newLevel})
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      if (confirm(`Tem certeza que deseja VETAR a compra de "${spend.metadata?.trait}" do personagem ${spend.characterName}? Isso irá reverter a pontuação na ficha e reembolsar o XP ao jogador.`)) {
                        const res = await vetoXpSpendAction(spend.id);
                        if (res.success) {
                          alert("Compra vetada e XP reembolsado com sucesso!");
                          fetchRecentXpSpends();
                          fetchCampaignCharacters(); // Recarregar fichas no drawer/lista
                        } else {
                          alert(`Erro ao vetar: ${res.error}`);
                        }
                      }
                    }}
                    className="w-full mt-1 py-0.5 border border-hunger-red/35 hover:bg-hunger-red/10 text-hunger-red font-data font-bold text-[8px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                  >
                    Vetar Compra
                  </button>
                </div>
              ))
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
            initialStatus={selectedChar.status as "DRAFT" | "READY" | "IN_PLAY" || "DRAFT"}
            initialBuildState={selectedChar.buildState}
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

      {/* MODAL DE DISTRIBUIÇÃO DE XP (FASE 25) */}
      {isXpModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-[500px] bg-bg-card-dark border border-white/10 rounded-sm p-5 shadow-2xl flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h2 className="text-base font-gothic text-blood-red tracking-widest uppercase">
                Distribuir XP da Sessão
              </h2>
              <button
                onClick={() => setIsXpModalOpen(false)}
                className="text-text-muted hover:text-white text-xs cursor-pointer uppercase font-bold"
              >
                Fechar [X]
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex flex-col space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Título da Sessão</label>
                <input
                  type="text"
                  placeholder="Ex: Sessão 12 - A Emboscada no Porto"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="px-2.5 py-2 border border-white/10 rounded-xs bg-black/45 focus:outline-none focus:border-blood-red text-text-primary"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-text-muted font-bold">XP Base da Mesa</label>
                <input
                  type="number"
                  min="0"
                  value={baseXp}
                  onChange={(e) => setBaseXp(Math.max(0, Number(e.target.value) || 0))}
                  className="px-2.5 py-2 border border-white/10 rounded-xs bg-black/45 focus:outline-none focus:border-blood-red text-text-primary font-mono font-bold"
                />
              </div>

              <div className="space-y-2 border-t border-white/10 pt-3">
                <label className="text-[9px] uppercase tracking-widest text-text-muted font-bold block mb-1">
                  Créditos Individuais (Jogadores)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {playersList.length === 0 ? (
                    <div className="text-[10px] text-text-dim italic">Nenhum jogador ativo para receber XP.</div>
                  ) : (
                    playersList.map((p) => {
                      const data = individualXpData[p.id] || { presence: true, desire: false, ambition: false, extra: 0 };
                      const totalXp = baseXp + (data.presence ? 1 : 0) + (data.desire ? 1 : 0) + (data.ambition ? 1 : 0) + (Number(data.extra) || 0);
                      
                      return (
                        <div key={p.id} className="bg-black/35 border border-white/5 p-2 rounded-xs flex flex-col space-y-1.5">
                          <div className="flex justify-between items-center font-bold text-text-primary">
                            <span>{p.name}</span>
                            <span className="text-amber-400 font-mono text-[11px]">Total: +{totalXp} XP</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-[9px] text-text-muted font-sans">
                            <label className="flex items-center space-x-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={data.presence}
                                onChange={(e) => setIndividualXpData(prev => ({
                                  ...prev,
                                  [p.id]: { ...prev[p.id], presence: e.target.checked }
                                }))}
                                className="accent-blood-red"
                              />
                              <span>Presença (+1)</span>
                            </label>
                            
                            <label className="flex items-center space-x-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={data.desire}
                                onChange={(e) => setIndividualXpData(prev => ({
                                  ...prev,
                                  [p.id]: { ...prev[p.id], desire: e.target.checked }
                                }))}
                                className="accent-blood-red"
                              />
                              <span>Desejo (+1)</span>
                            </label>
                            
                            <label className="flex items-center space-x-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={data.ambition}
                                onChange={(e) => setIndividualXpData(prev => ({
                                  ...prev,
                                  [p.id]: { ...prev[p.id], ambition: e.target.checked }
                                }))}
                                className="accent-blood-red"
                              />
                              <span>Ambição (+1)</span>
                            </label>
                          </div>

                          <div className="flex items-center space-x-2 pt-1">
                            <span className="text-[8px] text-text-muted uppercase">Extra Individual:</span>
                            <input
                              type="number"
                              min="0"
                              value={data.extra}
                              onChange={(e) => setIndividualXpData(prev => ({
                                ...prev,
                                [p.id]: { ...prev[p.id], extra: Math.max(0, Number(e.target.value) || 0) }
                              }))}
                              className="w-16 px-1.5 py-0.5 border border-white/10 rounded-xs bg-black/45 focus:outline-none text-[10px] text-text-primary text-center font-mono"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsXpModalOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:border-white text-text-muted hover:text-white text-[10px] uppercase tracking-wider transition-colors rounded-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!sessionTitle.trim()) {
                      alert("Por favor, preencha o título da sessão.");
                      return;
                    }
                    
                    const grants = playersList.map(p => {
                      const data = individualXpData[p.id] || { presence: false, desire: false, ambition: false, extra: 0 };
                      const totalXp = baseXp + (data.presence ? 1 : 0) + (data.desire ? 1 : 0) + (data.ambition ? 1 : 0) + (Number(data.extra) || 0);
                      return {
                        characterId: p.id,
                        characterName: p.name,
                        totalXp,
                      };
                    });

                    const res = await grantSessionXpAction(campaign.id, baseXp, grants, sessionTitle);
                    if (res.success) {
                      alert("XP da sessão distribuído com sucesso para todos os jogadores!");
                      setIsXpModalOpen(false);
                      fetchRecentXpSpends();
                    } else {
                      alert(`Erro ao distribuir XP: ${res.error}`);
                    }
                  }}
                  disabled={playersList.length === 0}
                  className="px-5 py-2 bg-blood-red hover:bg-burgundy text-white text-[10px] uppercase tracking-wider font-bold rounded-sm cursor-pointer transition-colors shadow-md disabled:bg-gray-700 disabled:cursor-not-allowed"
                >
                  Conceder XP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
