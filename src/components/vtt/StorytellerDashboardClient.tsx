"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ActionFeed, { RollItem } from "./ActionFeed";
import DirectorBoard from "./DirectorBoard";
import DamageModal from "./DamageModal";
import SheetDrawer from "./SheetDrawer";
import { useToast } from "@/context/ToastContext";
import CharacterSheetClient from "@/components/sheet/CharacterSheetClient";
import { TokenData } from "./Token";
import { getRecentRolls, saveRoll } from "@/app/actions/rolls";
import { getSceneTokens, createSceneToken, deleteSceneToken, toggleTokenAction, resetRound, updateTokenQuickHealth, updateSceneBackground, showSceneImageAction } from "@/app/actions/sceneActions";
import { getCampaignDashboard } from "@/app/actions/narratorActions";
import { updateCharacterSheet } from "@/app/actions/characterActions";
import { rollV5, rollRouseCheck } from "@/lib/vtt/BloodEngine";
import { characters } from "@/db/schema";
import { CharacterSheetData } from "@/types/character";
import Pusher from "pusher-js";
import { 
  grantSessionXpAction 
} from "@/app/actions/xpActions";
import RollEffects from "./RollEffects";
import { usePresence } from "@/hooks/usePresence";

type CampaignCharacter = typeof characters.$inferSelect;

interface StorytellerDashboardClientProps {
  campaign: {
    id: string;
    name: string;
    narratorId: string;
    description: string | null;
    rollEffectMode: "NONE" | "HORROR" | "COMEDY";
    comedyImageUrl: string | null;
  };
}

export default function StorytellerDashboardClient({ campaign }: StorytellerDashboardClientProps) {
  const { showSuccess, showError, showWarning } = useToast();
  // Estados para rolagens e tokens
  const [rollsList, setRollsList] = useState<RollItem[]>([]);
  const [tokensList, setTokensList] = useState<TokenData[]>([]);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const onlineUsers = usePresence(campaign.id);
  
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
  const [narratorDicePool, setNarratorDicePool] = useState<Array<{ id: string, label: string, value: number }>>([]);

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
  const [narratorHunger, setNarratorHunger] = useState(0);
  const [isRouseSelected, setIsRouseSelected] = useState(false);
  const [customActionName, setCustomActionName] = useState("");

  // Estados de XP (Fase 25)
  const [isXpModalOpen, setIsXpModalOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [baseXp, setBaseXp] = useState(2);
  const [individualXpData, setIndividualXpData] = useState<Record<string, { presence: boolean; desire: boolean; ambition: boolean; extra: number }>>({});

  // Estados para Rastreamento Dinâmico de Dano (Fase 28)
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [damageTargetId, setDamageTargetId] = useState<string | null>(null);
  const [damageTargetName, setDamageTargetName] = useState("");

  // Estados para Fundo de Cena (Issue 3)
  const [sceneBackground, setSceneBackground] = useState<string | null>(null);
  const [sceneBackgroundInput, setSceneBackgroundInput] = useState("");

  // Estados para Imagem de Cena (Issue 4)
  const [narratorImageInput, setNarratorImageInput] = useState("");
  const [isShowingSceneImage, setIsShowingSceneImage] = useState(false);
  const [currentSceneImage, setCurrentSceneImage] = useState<string | null>(null);

  const handleOpenDamageModal = useCallback((characterId: string, characterName: string) => {
    setDamageTargetId(characterId);
    setDamageTargetName(characterName);
    setIsDamageModalOpen(true);
  }, []);

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



  // Configuração Geral das Escutas do Pusher (WebSocket) e Sincronizações Resilientes
  useEffect(() => {
    // 1. Carga Inicial de Dados (envolvido em microtask para evitar cascading renders no linter)
    Promise.resolve().then(() => {
      fetchRecentRolls();
      fetchSceneTokens();
      fetchCampaignCharacters();
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

    const handleCharacterUpdated = (data: {
      characterId: string;
      sheetData: any;
      buildState: any;
      status: string;
      name: string;
    }) => {
      const updateList = (list: CampaignCharacter[]) =>
        list.map((c) =>
          c.id === data.characterId
            ? { ...c, sheetData: data.sheetData, buildState: data.buildState, status: data.status as any, name: data.name }
            : c
        );

      setPlayersList((prev) => updateList(prev));
      setNpcsList((prev) => updateList(prev));
    };

    // Registrar binds em ambos os canais (Público e Privado do Narrador)
    publicChannel.bind("token-created", handleTokenCreated);
    publicChannel.bind("token-updated", handleTokenUpdated);
    publicChannel.bind("token-deleted", handleTokenDeleted);
    publicChannel.bind("round-reset", handleRoundReset);
    publicChannel.bind("character-updated", handleCharacterUpdated);

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
        showError(`Erro ao adicionar personagem: ${res.error}`, "Adicionar Personagem");
      }
    } catch (err) {
      console.error("Erro ao adicionar personagem ao tabuleiro:", err);
    }
  };

  // Ação: Criar Figurante Rápido (Quick NPC)
  const handleCreateQuickNPC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      showWarning("Por favor, informe o nome do figurante.", "Campo Obrigatório");
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
        showError(`Erro ao criar figurante: ${res.error}`, "Criar Figurante");
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
  // Ação: Sincronizar status da ficha de personagens completos no banco com Optimistic UI + Debounce
  const handleUpdateCharacterStatus = useCallback((
    characterId: string,
    status: {
      health?: { max: number; superficial: number; aggravated: number };
      willpower?: { max: number; superficial: number; aggravated: number };
      hunger?: number;
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
        hunger: typeof status.hunger === "number" ? status.hunger : sheet.status?.hunger ?? 2,
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

  // Lógica de clique nos traits da ficha pelo Narrador (para rolagens)
  const handleNarratorTraitClick = (trait: { id: string, label: string, value: number }) => {
    setNarratorDicePool(prev => {
      let newPool = [];
      if (prev.some(p => p.id === trait.id)) {
        newPool = prev.filter(p => p.id !== trait.id);
      } else if (prev.length < 2) {
        newPool = [...prev, trait];
      } else {
        newPool = [...prev];
        newPool[1] = trait;
      }
      
      const sum = newPool.reduce((acc, curr) => acc + curr.value, 0);
      setNarratorPool(sum);
      setCustomActionName(newPool.map(p => p.label).join(" + "));
      
      return newPool;
    });
  };

  // Ação: Rolar Dados pelo Dock do Narrador
  const handleNarratorRoll = async (isSecret: boolean) => {
    // Se houver personagem selecionado na gaveta e traits na pool do Narrador, usar a Fome daquele personagem
    const selectedChar = [...playersList, ...npcsList].find((c) => c.id === selectedCharacterId);
    const sheetData = selectedChar?.sheetData as any;
    const hungerLevel = (selectedChar && narratorDicePool.length > 0)
      ? (sheetData?.status?.hunger ?? 0)
      : narratorHunger;

    const result = rollV5(narratorPool, hungerLevel, narratorDifficulty);
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
        setNarratorDicePool([]);
        setNarratorPool(6);
        setNarratorHunger(0);
        await fetchRecentRolls();
      }
    } catch (err) {
      console.error("Erro ao realizar rolagem do Narrador:", err);
    }
  };

  const handleRollClick = (isSecret: boolean) => {
    if (isRouseSelected) {
      handleNarratorRouseCheck(isSecret);
      setIsRouseSelected(false);
    } else {
      handleNarratorRoll(isSecret);
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
      <RollEffects
        campaignId={campaign.id}
        rollEffectMode={campaign.rollEffectMode}
        comedyImageUrl={campaign.comedyImageUrl}
        isStoryteller={true}
      />
      {/* 1. FEED DE ROLAGENS (Sidebar Esquerdo) */}
      <ActionFeed rolls={rollsList} campaignId={campaign.id} isStoryteller={true} />

      {/* 2. MESA CENTRAL COM TABULEIRO 2D (DirectorBoard) */}
      <div className="flex-1 h-full relative flex items-center justify-center p-4 min-w-0">
        {/* Botão de Retorno ao Painel */}
        <Link
          href={`/campanhas/${campaign.id}/narrador`}
          className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-black/60 hover:bg-black/80 border border-white/10 hover:border-blood-red text-text-dim hover:text-white text-[10px] font-data uppercase tracking-widest rounded-xs transition-all duration-200 cursor-pointer shadow-md flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Painel do Narrador
        </Link>
        {/* Título de Contexto no topo central */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center select-none">
          <h1 className="text-xl font-gothic text-blood-red tracking-widest uppercase">
            Dashboard do Narrador
          </h1>
          <p className="text-[9px] uppercase tracking-widest text-gold-accent font-data font-semibold">
            {campaign.name}
          </p>
        </div>

        {/* Botão de Toggle — slim vertical tab no canto direito da mesa */}
        <button
          onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          className="absolute top-1/2 -translate-y-1/2 right-0 z-20 w-5 h-16 bg-bg-card-dark/95 backdrop-blur-md border border-white/10 hover:border-gold-accent text-gold-accent hover:text-white font-mono font-bold text-[11px] rounded-l-sm transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center"
          title={isRightSidebarOpen ? "Ocultar Painel Lateral" : "Exibir Painel Lateral"}
          aria-label={isRightSidebarOpen ? "Ocultar Painel Lateral" : "Exibir Painel Lateral"}
        >
          {isRightSidebarOpen ? "❯" : "❮"}
        </button>

        <DirectorBoard
          tokens={tokensList}
          isStoryteller={true}
          campaignId={campaign.id}
          getCharacterSheetData={getCharacterSheetData}
          onDoubleClickToken={handleDoubleClickToken}
          onQuickRollToken={handleQuickRollToken}
          onDeleteToken={handleDeleteToken}
          onToggleTokenActed={handleToggleTokenActed}
          onUpdateQuickHealth={handleUpdateQuickHealth}
          onUpdateCharacterStatus={handleUpdateCharacterStatus}
          onResetRound={handleResetRound}
          onOpenDamageModal={handleOpenDamageModal}
          sceneBackground={sceneBackground}
          onChangeSceneBackground={setSceneBackground}
        />

        {/* 3. DOCK DO NARRADOR — slim, largura total da mesa central */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center z-40 pointer-events-none">
          <div className="pointer-events-auto w-full bg-bg-card-dark/98 backdrop-blur-md border-t border-white/8 py-1.5 px-6 shadow-2xl flex items-center justify-center gap-5 select-none">

            {/* Dados (Pool) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] uppercase tracking-wider text-text-muted font-data font-bold shrink-0">Dados</span>
              <button onClick={() => setNarratorPool(Math.max(1, narratorPool - 1))} className="w-5 h-5 border border-white/10 hover:border-white/25 bg-white/5 rounded-xs flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer">-</button>
              <span className="w-5 text-center text-sm font-bold font-mono text-gold-accent">{narratorPool}</span>
              <button onClick={() => setNarratorPool(Math.min(20, narratorPool + 1))} className="w-5 h-5 border border-white/10 hover:border-white/25 bg-white/5 rounded-xs flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer">+</button>
              {narratorDicePool.length > 0 && (
                <button
                  onClick={() => {
                    setNarratorDicePool([]);
                    setNarratorPool(6);
                    setNarratorHunger(0);
                    setCustomActionName("");
                  }}
                  className="ml-1 text-[8px] uppercase tracking-widest text-hunger-red hover:text-white font-data font-bold border border-hunger-red/35 hover:border-white px-1.5 py-0.5 rounded-xs bg-hunger-red/5 cursor-pointer transition-colors"
                  title="Limpar seleção da ficha"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="h-6 w-px bg-white/10 shrink-0" />

            {/* Dificuldade */}
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] uppercase tracking-wider text-text-muted font-data font-bold shrink-0">Dif.</span>
              <button onClick={() => setNarratorDifficulty(Math.max(0, narratorDifficulty - 1))} className="w-5 h-5 border border-white/10 hover:border-white/25 bg-white/5 rounded-xs flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer">-</button>
              <span className="w-5 text-center text-sm font-bold font-mono text-gold-accent">{narratorDifficulty}</span>
              <button onClick={() => setNarratorDifficulty(Math.min(10, narratorDifficulty + 1))} className="w-5 h-5 border border-white/10 hover:border-white/25 bg-white/5 rounded-xs flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer">+</button>
            </div>

            <div className="h-6 w-px bg-white/10 shrink-0" />

            {/* Fome */}
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] uppercase tracking-wider text-text-muted font-data font-bold shrink-0">Fome</span>
              <button onClick={() => setNarratorHunger(Math.max(0, narratorHunger - 1))} className="w-5 h-5 border border-white/10 hover:border-white/25 bg-white/5 rounded-xs flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer">-</button>
              <span className="w-5 text-center text-sm font-bold font-mono text-hunger-red">{narratorHunger}</span>
              <button onClick={() => setNarratorHunger(Math.min(5, narratorHunger + 1))} className="w-5 h-5 border border-white/10 hover:border-white/25 bg-white/5 rounded-xs flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer">+</button>
            </div>

            <div className="h-6 w-px bg-white/10 shrink-0" />

            {/* Ação */}
            <div className="flex items-center gap-1.5 flex-1 max-w-[220px]">
              <span className="text-[8px] uppercase tracking-wider text-text-muted font-data font-bold shrink-0">Ação</span>
              <input
                type="text"
                value={customActionName}
                onChange={(e) => setCustomActionName(e.target.value)}
                placeholder="Ex: Ataque de Garra"
                className="flex-1 px-2 py-0.5 text-[11px] border border-white/10 rounded-xs bg-black/45 focus:outline-none focus:border-gold-accent text-text-primary min-w-0"
              />
            </div>

            <div className="h-6 w-px bg-white/10 shrink-0" />

            {/* Botões de Rolagem */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleRollClick(false)} className="h-7 px-3 bg-linear-to-r from-red-700 to-burgundy hover:from-red-600 hover:to-red-700 text-white font-data font-bold text-[9px] uppercase tracking-wider rounded-xs transition-all shadow-md cursor-pointer">Público</button>
              <button onClick={() => handleRollClick(true)} className="h-7 px-3 bg-willpower-blue hover:bg-blue-600 text-white font-data font-bold text-[9px] uppercase tracking-wider rounded-xs transition-all shadow-md cursor-pointer">Secreto</button>
            </div>

            <div className="h-6 w-px bg-white/10 shrink-0" />

            {/* Despertar toggle */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsRouseSelected(!isRouseSelected)}
                className={`h-7 px-2.5 font-data font-bold text-[9px] uppercase tracking-wider rounded-xs transition-all cursor-pointer border ${
                  isRouseSelected
                    ? "bg-gold-accent border-gold-accent text-bg-main shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                    : "bg-white/5 border-white/10 hover:border-white/25 text-text-primary"
                }`}
              >
                Despertar 🩸
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 4. BARRA LATERAL DIREITA DE GERENCIAMENTO (Fichas e Figurantes) */}
      <div 
        className={`h-full bg-bg-card-dark/95 backdrop-blur-md flex flex-col z-35 select-none shrink-0 overflow-y-auto scrollbar-none transition-all duration-300 ease-in-out ${
          isRightSidebarOpen 
            ? "w-60 p-4 opacity-100 border-l border-white/10" 
            : "w-0 p-0 opacity-0 border-l-0 border-r-0 overflow-hidden pointer-events-none"
        }`}
      >
        {/* ===== SIDEBAR REORGANIZADO ===== */}
        {/* GRUPO 1: Personagens da Crônica */}
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
                const isOnline = p.userId && onlineUsers.includes(p.userId);
                return (
                  <div key={p.id} className="flex justify-between items-center bg-black/35 p-1.5 rounded-sm border border-white/5">
                    <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isOnline
                            ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)] animate-pulse"
                            : "bg-zinc-600"
                        }`}
                        title={isOnline ? "Online" : "Offline"}
                      />
                      <span className="text-xs font-semibold truncate max-w-[70px]" title={p.name}>{p.name}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button onClick={() => handleDoubleClickToken(p.id)} className="text-[9px] text-text-muted hover:text-white uppercase font-bold cursor-pointer">Ficha</button>
                      <button disabled={isOnBoard} onClick={() => handleAddCharacterToBoard(p)} className="text-[9px] text-gold-accent hover:text-amber-300 disabled:text-text-dim/40 uppercase font-bold cursor-pointer">
                        {isOnBoard ? "Em Jogo" : "+ Tabuleiro"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* NPCs Completos */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-none pt-1">
            <span className="text-[9px] font-bold text-text-muted uppercase">NPCs Completos</span>
            {npcsList.length === 0 ? (
              <div className="text-[10px] text-text-dim italic">Sem NPCs cadastrados.</div>
            ) : (
              npcsList.map((npc) => {
                const isOnBoard = tokensList.some((t) => t.characterId === npc.id);
                return (
                  <div key={npc.id} className="flex justify-between items-center bg-black/35 p-1.5 rounded-sm border border-white/5">
                    <span className="text-xs font-semibold truncate max-w-[85px]" title={npc.name}>{npc.name}</span>
                    <div className="flex items-center space-x-1.5">
                      <button onClick={() => handleDoubleClickToken(npc.id)} className="text-[9px] text-text-muted hover:text-white uppercase font-bold cursor-pointer">Ficha</button>
                      <button disabled={isOnBoard} onClick={() => handleAddCharacterToBoard(npc)} className="text-[9px] text-gold-accent hover:text-amber-300 disabled:text-text-dim/40 uppercase font-bold cursor-pointer">
                        {isOnBoard ? "Em Jogo" : "+ Tabuleiro"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* GRUPO 2: Figurante Rápido */}
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
                <input type="number" min="1" max="10" value={quickPhysical} onChange={(e) => setQuickPhysical(Number(e.target.value))} className="px-1 py-1 text-center border border-white/10 rounded-xs bg-black/45 focus:outline-none focus:border-gold-accent text-text-primary font-mono font-bold" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[8px] text-text-muted font-bold uppercase text-center">Social</label>
                <input type="number" min="1" max="10" value={quickSocial} onChange={(e) => setQuickSocial(Number(e.target.value))} className="px-1 py-1 text-center border border-white/10 rounded-xs bg-black/45 focus:outline-none focus:border-gold-accent text-text-primary font-mono font-bold" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[8px] text-text-muted font-bold uppercase text-center">Combate</label>
                <input type="number" min="1" max="10" value={quickHealth} onChange={(e) => setQuickHealth(Number(e.target.value))} className="px-1 py-1 text-center border border-white/10 rounded-xs bg-black/45 focus:outline-none focus:border-gold-accent text-text-primary font-mono font-bold" />
              </div>
            </div>
            <button type="submit" className="w-full mt-1.5 py-1.5 bg-linear-to-r from-gold-accent to-amber-500 hover:from-amber-400 hover:to-gold-accent text-black font-data font-bold text-xs uppercase tracking-wider rounded-xs transition-all shadow-md cursor-pointer">
              Criar no Tabuleiro
            </button>
          </form>
        </div>

        {/* GRUPO 4: Distribuir XP — sempre por último */}
        <div className="flex-1 flex flex-col justify-end pt-2">
          <div className="border-t border-white/10 pt-3">
            <button
              onClick={() => {
                const initialData: Record<string, any> = {};
                playersList.forEach(p => {
                  initialData[p.id] = { presence: true, desire: false, ambition: false, extra: 0 };
                });
                setIndividualXpData(initialData);
                setSessionTitle("");
                setBaseXp(2);
                setIsXpModalOpen(true);
              }}
              className="w-full py-2 bg-blood-red hover:bg-burgundy text-white font-data font-bold text-[10px] uppercase tracking-wider rounded-xs transition-colors shadow-md cursor-pointer border border-blood-red/20"
            >
              Distribuir XP da Sessão
            </button>
          </div>
        </div>
      </div>

      {/* 5. GAVETA DE FICHA DO PERSONAGEM (Drawer) */}
      {selectedChar && (
        <SheetDrawer isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
          <CharacterSheetClient
            characterId={selectedChar!.id}
            campaignId={campaign.id}
            initialData={selectedChar!.sheetData as CharacterSheetData}
            initialName={selectedChar!.name}
            dicePool={narratorDicePool}
            onTraitClick={handleNarratorTraitClick}
            initialStatus={selectedChar!.status as "DRAFT" | "READY" | "IN_PLAY" || "DRAFT"}
            initialBuildState={selectedChar!.buildState}
            characterType={selectedChar!.type}
            onDataChange={async (newData) => {
              // Atualizar estado de personagens localmente de imediato
              const updateLocalList = (list: CampaignCharacter[]) =>
                list.map((c) => (c.id === selectedChar!.id ? { ...c, sheetData: newData, name: newData.profile?.name || c.name } : c));
              
              if (selectedChar!.type === "jogador") {
                setPlayersList(updateLocalList(playersList));
              } else {
                setNpcsList(updateLocalList(npcsList));
              }

              // Salvar no Neon DB via Server Action
              try {
                const res = await updateCharacterSheet(selectedChar!.id, newData);
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
                      showWarning("Por favor, preencha o título da sessão.", "Campo Obrigatório");
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
                      showSuccess("XP da sessão distribuído com sucesso para todos os jogadores!", "Concessão de XP");
                      setIsXpModalOpen(false);
                    } else {
                      showError(`Erro ao distribuir XP: ${res.error}`, "Erro de XP");
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

      {isDamageModalOpen && damageTargetId && (
        <DamageModal
          isOpen={isDamageModalOpen}
          onClose={() => {
            setIsDamageModalOpen(false);
            setDamageTargetId(null);
          }}
          characterId={damageTargetId ?? ""}
          characterName={damageTargetName}
          onDamageApplied={async () => {
            await fetchCampaignCharacters();
            await fetchSceneTokens();
            await fetchRecentRolls();
          }}
        />
      )}
    </div>
  );
}
