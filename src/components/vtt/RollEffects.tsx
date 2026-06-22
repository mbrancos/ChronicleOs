"use client";

import React, { useState, useEffect, useRef } from "react";
import Pusher, { Channel } from "pusher-js";

interface RollItem {
  id: string;
  campaignId: string;
  characterId: string | null;
  characterName: string;
  poolName: string;
  resultData: any;
  hungerDice: number;
  isRerolled: boolean;
  isSecret: boolean;
  createdAt: Date | string;
}

interface RollEffectsProps {
  campaignId: string;
  rollEffectMode: "NONE" | "HORROR" | "COMEDY";
  comedyImageUrl: string | null;
  isStoryteller?: boolean;
}

export default function RollEffects({
  campaignId,
  rollEffectMode,
  comedyImageUrl,
  isStoryteller = false,
}: RollEffectsProps) {
  const [showHorror, setShowHorror] = useState(false);
  const [showComedy, setShowComedy] = useState(false);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const horrorDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const comedyDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs para ler sempre o valor mais atualizado das configurações sem re-assinar o Websocket
  const rollEffectModeRef = useRef(rollEffectMode);
  const comedyImageUrlRef = useRef(comedyImageUrl);

  useEffect(() => {
    rollEffectModeRef.current = rollEffectMode;
    comedyImageUrlRef.current = comedyImageUrl;
  }, [rollEffectMode, comedyImageUrl]);

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      if (horrorDurationTimeoutRef.current) clearTimeout(horrorDurationTimeoutRef.current);
      if (comedyDurationTimeoutRef.current) clearTimeout(comedyDurationTimeoutRef.current);
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
    };
  }, []);

  // Tocar áudio de forma segura contra a política de Autoplay
  const playAudio = async (src: string) => {
    // Parar áudio anterior se houver
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    try {
      const audio = new Audio(src);
      audio.volume = 0.5;
      activeAudioRef.current = audio;

      await audio.play();

      // Se for o áudio de horror (heartbeat), executa o fade out gradativo
      if (src.includes("heartbeat.mp3")) {
        fadeTimeoutRef.current = setTimeout(() => {
          let volume = 0.5;
          fadeIntervalRef.current = setInterval(() => {
            volume -= 0.05;
            if (volume <= 0) {
              audio.pause();
              if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current);
                fadeIntervalRef.current = null;
              }
            } else {
              audio.volume = Math.max(0, volume);
            }
          }, 400); // 400ms * 10 decrementos = 4 segundos de fade out
        }, 2000); // 2 segundos de pico de volume
      }
    } catch (error) {
      console.warn("Autoplay bloqueado pelo navegador para este usuário passivo.", error);
    }
  };

  // Disparar o efeito de acordo com a configuração atual do Ref
  const triggerEffect = () => {
    const currentMode = rollEffectModeRef.current;

    if (currentMode === "NONE") return;

    if (currentMode === "HORROR") {
      setShowHorror(true);
      playAudio("/audio/heartbeat.mp3");

      if (horrorDurationTimeoutRef.current) clearTimeout(horrorDurationTimeoutRef.current);
      horrorDurationTimeoutRef.current = setTimeout(() => {
        setShowHorror(false);
      }, 6000);
    } else if (currentMode === "COMEDY") {
      setShowComedy(true);
      playAudio("/audio/toasty.mp3");

      if (comedyDurationTimeoutRef.current) clearTimeout(comedyDurationTimeoutRef.current);
      comedyDurationTimeoutRef.current = setTimeout(() => {
        setShowComedy(false);
      }, 1500);
    }
  };

  // WebSocket com Pusher para ouvir novas rolagens em tempo real (assina apenas uma vez por canal)
  useEffect(() => {
    if (!campaignId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: {
        endpoint: "/api/pusher/auth",
        transport: "ajax",
      },
    });

    const handleNewRoll = (newRoll: RollItem) => {
      // Validar se é uma rolagem padrão do V5 e se resultou em Falha Bestial
      if (
        newRoll.resultData &&
        newRoll.resultData.type === "standard" &&
        newRoll.resultData.isBestialFailure === true
      ) {
        triggerEffect();
      }
    };

    // 1. Assinar canal público de rolagens
    const publicChannelName = `public-campaign-${campaignId}`;
    const publicChannel = pusher.subscribe(publicChannelName);
    publicChannel.bind("new-roll", handleNewRoll);

    // 2. Se for o Narrador, também escuta no canal privado para rolagens secretas críticas
    let privateChannel: Channel | null = null;
    if (isStoryteller) {
      const privateChannelName = `private-gm-${campaignId}`;
      privateChannel = pusher.subscribe(privateChannelName);
      privateChannel.bind("new-roll", handleNewRoll);
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

  return (
    <>
      {/* Estilos CSS Injetados para Animações Góticas & Cômicas */}
      <style jsx global>{`
        @keyframes horrorOverlayPulse {
          0% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.85;
          }
          100% {
            opacity: 0.3;
          }
        }

        @keyframes toastySlideInOut {
          0% {
            transform: translateX(110%);
          }
          15% {
            transform: translateX(0);
          }
          85% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(110%);
          }
        }

        .horror-active-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          pointer-events: none;
          background: radial-gradient(circle, transparent 25%, rgba(0, 0, 0, 0.5) 60%, rgba(130, 0, 0, 0.8) 85%, rgba(180, 0, 0, 0.95) 100%);
          box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.95), inset 0 0 180px rgba(180, 0, 0, 0.85);
          animation: horrorOverlayPulse 1.2s infinite ease-in-out;
        }

        .comedy-mascot-active {
          position: fixed;
          bottom: 16px;
          right: 16px;
          z-index: 9999;
          pointer-events: none;
          width: 140px;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: toastySlideInOut 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .comedy-mascot-active img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.6));
        }
      `}</style>

      {/* Overlay de Horror (Visão de Túnel Sangrenta Pulsante) */}
      {showHorror && <div className="horror-active-overlay" />}

      {/* Overlay de Alívio Cômico (Toasty do Mascote) */}
      {showComedy && comedyImageUrlRef.current && (
        <div className="comedy-mascot-active">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={comedyImageUrlRef.current} alt="Mascote Crônico" />
        </div>
      )}
    </>
  );
}
