"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import PlayerDock from "./PlayerDock";
import SheetDrawer from "./SheetDrawer";
import CharacterSheetClient from "@/components/sheet/CharacterSheetClient";
import ActionFeed, { RollItem } from "./ActionFeed";
import DirectorBoard from "./DirectorBoard";
import { TokenData } from "./Token";
import { rollV5, rollRouseCheck } from "@/lib/vtt/BloodEngine";
import { saveRoll, getRecentRolls, executeWillpowerReroll } from "@/app/actions/rolls";
import { updateCharacterSheet } from "@/app/actions/characterActions";
import { getSceneTokens } from "@/app/actions/sceneActions";
import { CharacterSheetData } from "@/types/character";
import Pusher from "pusher-js";
import RollEffects from "./RollEffects";

interface VttRoomClientProps {
  character: {
    id: string;
    campaignId: string;
    userId: string | null;
    name: string;
    type: "jogador" | "npc" | "coterie";
    sheetData: CharacterSheetData;
    status: string;
    buildState: any;
  };
  campaignSettings?: {
    rollEffectMode: "NONE" | "HORROR" | "COMEDY";
    comedyImageUrl: string | null;
  };
}

export default function VttRoomClient({ character, campaignSettings }: VttRoomClientProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [localCharacter, setLocalCharacter] = useState(character);
  const [dicePool, setDicePool] = useState<Array<{ id: string, label: string, value: number }>>([]);
  const [rollsList, setRollsList] = useState<RollItem[]>([]);
  const [tokensList, setTokensList] = useState<TokenData[]>([]);
  const [isRerolling, setIsRerolling] = useState(false);
  const isFetching = useRef(false);
  const isFetchingTokens = useRef(false);

  // Carregar rolagens recentes e atualizar estado
  const fetchRecentRolls = useCallback(async () => {
    // Evitar requisições de polling redundantes se a aba estiver oculta
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }
    // Evitar requisições paralelas empilhadas se a anterior ainda estiver pendente no banco
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      const res = await getRecentRolls(character.campaignId);
      if (res.success && res.data) {
        setRollsList(res.data as RollItem[]);
      }
    } catch (err) {
      console.error("Erro ao buscar rolagens do banco:", err);
    } finally {
      isFetching.current = false;
    }
  }, [character.campaignId]);

  // Carregar tokens de cena visíveis (isVisible === true)
  const fetchSceneTokens = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }
    if (isFetchingTokens.current) return;

    try {
      isFetchingTokens.current = true;
      const res = await getSceneTokens(character.campaignId, false);
      if (res.success && res.data) {
        setTokensList(res.data as TokenData[]);
      }
    } catch (err) {
      console.error("Erro ao buscar tokens de cena para o jogador:", err);
    } finally {
      isFetchingTokens.current = false;
    }
  }, [character.campaignId]);

  // Configuração Geral das Escutas do Pusher (WebSocket) e Sincronizações Resilientes para Jogadores
  useEffect(() => {
    // 1. Carga Inicial de Dados (envolvido em microtask para evitar cascading renders no linter)
    Promise.resolve().then(() => {
      fetchRecentRolls();
      fetchSceneTokens();
    });

    // 2. Conectar Cliente Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: {
        endpoint: "/api/pusher/auth",
        transport: "ajax",
      },
    });

    const publicChannelName = `public-campaign-${character.campaignId}`;
    const publicChannel = pusher.subscribe(publicChannelName);

    // Handlers de atualização dos Tokens
    const handleTokenCreated = (token: TokenData) => {
      // Jogador comum só renderiza se estiver no Palco (isVisible === true)
      if (!token.isVisible) return;
      setTokensList((prev) => {
        if (prev.some((t) => t.id === token.id)) return prev;
        return [...prev, token];
      });
    };

    const handleTokenUpdated = (updatedToken: TokenData | (Partial<TokenData> & { id: string })) => {
      setTokensList((prev) => {
        // Se o token foi ocultado pelo Narrador (levado para os Bastidores)
        if (updatedToken.isVisible === false) {
          return prev.filter((t) => t.id !== updatedToken.id);
        }
        
        // Se o token já existia na lista do jogador, atualiza. Se não existia (estava invisível e agora ficou visível)
        const exists = prev.some((t) => t.id === updatedToken.id);
        if (exists) {
          return prev.map((t) => (t.id === updatedToken.id ? { ...t, ...updatedToken } : t));
        } else if (updatedToken.name) {
          // Só adiciona se o payload contiver dados completos (para evitar tokens quebrados)
          return [...prev, updatedToken as TokenData];
        }
        return prev;
      });
    };

    const handleTokenDeleted = (data: { id: string }) => {
      setTokensList((prev) => prev.filter((t) => t.id !== data.id));
    };

    const handleRoundReset = () => {
      setTokensList((prev) => prev.map((t) => ({ ...t, hasActed: false })));
    };

    // Registrar binds no canal público do jogador
    publicChannel.bind("token-created", handleTokenCreated);
    publicChannel.bind("token-updated", handleTokenUpdated);
    publicChannel.bind("token-deleted", handleTokenDeleted);
    publicChannel.bind("round-reset", handleRoundReset);

    // 3. Lógica de Resiliência: fetch pontual em reconexão ou foco ativo da aba do navegador
    const handleSync = () => {
      fetchRecentRolls();
      fetchSceneTokens();
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
      pusher.unsubscribe(publicChannelName);
      pusher.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [character.campaignId, fetchRecentRolls, fetchSceneTokens]);

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

  // Disparar rolagem padrão do V5
  const handleStandardRoll = async (totalPool: number, difficulty: number, poolName: string) => {
    const hunger = localCharacter.sheetData.status?.hunger ?? 2;
    const result = rollV5(totalPool, hunger, difficulty);

    const saveRes = await saveRoll(
      character.campaignId,
      character.id,
      character.name,
      poolName,
      result
    );

    if (saveRes.success) {
      // Atualizar o feed local imediatamente para resposta ágil
      fetchRecentRolls();
      clearPool();
    } else {
      console.error("Erro ao salvar rolagem padrão:", saveRes.error);
    }
  };

  // Disparar teste de despertar (Rouse Check)
  const handleRouseCheck = async () => {
    const result = rollRouseCheck();

    const saveRes = await saveRoll(
      character.campaignId,
      character.id,
      character.name,
      "Teste de Despertar",
      result
    );

    if (saveRes.success) {
      // Atualizar o feed local imediatamente
      fetchRecentRolls();
    } else {
      console.error("Erro ao salvar teste de despertar:", saveRes.error);
    }
  };

  // Disparar rerrolagem de Força de Vontade (Willpower Reroll)
  const handleWillpowerReroll = async (rollId: string, indices: number[]) => {
    const willpower = localCharacter.sheetData.status?.willpower;
    if (!willpower) {
      alert("Erro: Informações de Força de Vontade não encontradas na ficha.");
      return;
    }

    const superficial = willpower.superficial ?? 0;
    const aggravated = willpower.aggravated ?? 0;
    const max = willpower.max ?? 5;

    if (superficial + aggravated >= max) {
      alert("Força de Vontade insuficiente! Você não pode gastar Força de Vontade se todos os espaços de dano estiverem cheios.");
      return;
    }

    try {
      setIsRerolling(true);

      // 1. Executar a ação de rerrolagem no servidor
      const res = await executeWillpowerReroll(rollId, indices, character.id);
      if (!res.success) {
        alert(`Falha ao rerrolar: ${res.error}`);
        return;
      }

      // 2. Atualizar a Ficha local com 1 ponto de dano Superficial na Força de Vontade
      const updatedWillpower = {
        ...willpower,
        superficial: superficial + 1
      };

      const updatedSheetData = {
        ...localCharacter.sheetData,
        status: {
          ...localCharacter.sheetData.status,
          willpower: updatedWillpower
        }
      };

      // Atualiza o estado da sala (Optimistic UI)
      setLocalCharacter(prev => ({
        ...prev,
        sheetData: updatedSheetData
      }));

      // 3. Salvar no banco imediatamente (necessário pois a gaveta da ficha pode estar fechada)
      const saveRes = await updateCharacterSheet(character.id, updatedSheetData);
      if (!saveRes.success) {
        console.error("Falha ao persistir atualização de Força de Vontade no banco:", saveRes.error);
      }

      // 4. Atualizar rolagens na tela
      await fetchRecentRolls();
    } catch (err) {
      console.error("Erro na rerrolagem de Força de Vontade:", err);
      alert("Erro inesperado ao processar rerrolagem de Força de Vontade.");
    } finally {
      setIsRerolling(false);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-bg-main relative text-text-primary flex flex-col">
      {campaignSettings && (
        <RollEffects
          campaignId={character.campaignId}
          rollEffectMode={campaignSettings.rollEffectMode}
          comedyImageUrl={campaignSettings.comedyImageUrl}
          isStoryteller={false}
        />
      )}
      
      {/* AREA DE JOGO SUPERIOR (Sidebar + Mesa) */}
      <div className="flex flex-row flex-1 h-[calc(100vh-5rem)] w-full overflow-hidden">
        {/* FEED DE ROLAGENS MULTIPLAYER (Sidebar Esquerdo) */}
        <ActionFeed 
          rolls={rollsList} 
          campaignId={character.campaignId}
          localCharacterId={character.id}
          onReroll={handleWillpowerReroll}
          isRerolling={isRerolling}
        />

        {/* O TABULEIRO 2D (DirectorBoard em modo Jogador) */}
        <div className="flex-1 h-full relative flex items-center justify-center p-4">
          <DirectorBoard
            tokens={tokensList}
            isStoryteller={false}
            onDoubleClickToken={(charId) => {
              if (charId === character.id) {
                setIsSheetOpen(true);
              }
            }}
          />
        </div>
      </div>

      {/* DOCK DE CONTROLE (z-40) */}
      <PlayerDock 
        character={localCharacter} 
        onOpenSheet={() => setIsSheetOpen(true)} 
        dicePool={dicePool}
        clearPool={clearPool}
        onStandardRoll={handleStandardRoll}
        onRouseCheck={handleRouseCheck}
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
          initialStatus={localCharacter.status as "DRAFT" | "READY" | "IN_PLAY"}
          initialBuildState={localCharacter.buildState}
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
                  const disc = newData.disciplines?.find((d) => d.id === item.id);
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
