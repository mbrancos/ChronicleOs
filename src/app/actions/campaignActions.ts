"use server";

import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function createCampaignAction(name: string, description?: string) {
  try {
    // 1. Obter sessão do usuário logado
    const { data: session } = await auth.getSession();
    
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: "O nome da crônica é obrigatório." };
    }

    const userId = session.user.id;

    // 2. Inserir a nova campanha no banco
    await db.insert(campaigns).values({
      name: trimmedName,
      description: description?.trim() || null,
      narratorId: userId,
    });

    // 3. Revalidar o path do hub para atualizar os dados
    revalidatePath("/hub");

    return { success: true };
  } catch (error: any) {
    console.error("Erro em createCampaignAction:", error);
    return { success: false, error: error?.message || "Erro ao criar a crônica." };
  }
}
