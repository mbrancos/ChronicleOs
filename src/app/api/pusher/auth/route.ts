import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { eq } from "drizzle-orm";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    // 1. Obter a sessão do Neon Auth
    const { data: sessionData } = await auth.getSession();
    if (!sessionData?.user) {
      return new Response("Não autorizado", { status: 401 });
    }

    // 2. Extrair parâmetros da requisição (Pusher envia como Form Data por padrão, mas pode ser JSON)
    let socketId = "";
    let channelName = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      socketId = body.socket_id || "";
      channelName = body.channel_name || "";
    } else {
      const formData = await req.formData();
      socketId = formData.get("socket_id") as string || "";
      channelName = formData.get("channel_name") as string || "";
    }

    if (!socketId || !channelName) {
      return new Response("Parâmetros inválidos", { status: 400 });
    }

    // 3. Se for o canal privado do Narrador, validar permissões de Narrador no banco
    if (channelName.startsWith("private-gm-")) {
      const campaignId = channelName.replace("private-gm-", "");
      
      if (!uuidRegex.test(campaignId)) {
        return new Response("ID de campanha inválido", { status: 400 });
      }

      // Buscar campanha para validar se o usuário é o narrador
      const campaignResult = await db
        .select({ narratorId: campaigns.narratorId })
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1);

      if (campaignResult.length === 0) {
        return new Response("Campanha não encontrada", { status: 404 });
      }

      const campaign = campaignResult[0];
      if (campaign.narratorId !== sessionData.user.id) {
        return new Response("Acesso negado: Você não é o Narrador desta crônica", { status: 403 });
      }
    }

    // 4. Se passou pela segurança, autoriza o canal no Pusher
    const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: sessionData.user.id,
      user_info: {
        name: sessionData.user.name || "Usuário",
        email: sessionData.user.email || "",
      },
    });

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Erro na autenticação do Pusher:", error);
    return new Response("Erro interno do servidor", { status: 500 });
  }
}
