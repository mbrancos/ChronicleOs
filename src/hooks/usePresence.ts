"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";

export function usePresence(campaignId: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!campaignId) return;

    // Inicializa o cliente do Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });

    const channelName = `presence-campaign-${campaignId}`;
    const channel = pusher.subscribe(channelName);

    // Evento de sucesso na inscrição: preenche os usuários online
    channel.bind("pusher:subscription_succeeded", (members: any) => {
      const ids: string[] = [];
      members.each((member: any) => {
        ids.push(member.id);
      });
      setOnlineUsers(ids);
    });

    // Evento de membro adicionado
    channel.bind("pusher:member_added", (member: any) => {
      setOnlineUsers((prev) => {
        if (prev.includes(member.id)) return prev;
        return [...prev, member.id];
      });
    });

    // Evento de membro removido
    channel.bind("pusher:member_removed", (member: any) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== member.id));
    });

    // Cleanup ao desmontar
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [campaignId]);

  return onlineUsers;
}
