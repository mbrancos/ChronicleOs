"use server";

import { db } from "@/db";
import { mediaAssets, characters, campaigns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface UploadMediaPayload {
  campaignId?: string | null;
  name: string;
  category: "avatar" | "scene" | "token" | "prop";
  base64: string;
  sizeBytes: number;
  width: number;
  height: number;
  userId: string;
}

/**
 * Salva uma nova mídia otimizada no banco
 */
export async function uploadMediaAssetAction(payload: UploadMediaPayload) {
  try {
    if (!payload.userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    if (payload.sizeBytes > 600 * 1024) {
      return { success: false, error: "Tamanho de imagem excede o limite otimizado (máx 600 KB)." };
    }

    const [inserted] = await db
      .insert(mediaAssets)
      .values({
        campaignId: payload.campaignId || null,
        userId: payload.userId,
        name: payload.name.trim() || `Imagem ${Date.now()}`,
        category: payload.category,
        mimeType: "image/webp",
        data: payload.base64,
        sizeBytes: payload.sizeBytes,
        width: payload.width,
        height: payload.height,
      })
      .returning({
        id: mediaAssets.id,
        name: mediaAssets.name,
        category: mediaAssets.category,
        sizeBytes: mediaAssets.sizeBytes,
      });

    return {
      success: true,
      data: {
        ...inserted,
        url: `/api/media/${inserted.id}`,
      },
    };
  } catch (error: any) {
    console.error("Erro ao fazer upload da mídia:", error);
    return { success: false, error: error?.message || "Falha ao salvar mídia." };
  }
}

/**
 * Lista todas as mídias da campanha (e avatares globais do usuário)
 */
export async function getCampaignMediaAssetsAction(campaignId?: string | null, userId?: string) {
  try {
    const assets = await db
      .select({
        id: mediaAssets.id,
        name: mediaAssets.name,
        category: mediaAssets.category,
        sizeBytes: mediaAssets.sizeBytes,
        width: mediaAssets.width,
        height: mediaAssets.height,
        createdAt: mediaAssets.createdAt,
      })
      .from(mediaAssets)
      .where(campaignId ? eq(mediaAssets.campaignId, campaignId) : undefined)
      .orderBy(desc(mediaAssets.createdAt));

    const totalBytes = assets.reduce((acc, curr) => acc + curr.sizeBytes, 0);

    return {
      success: true,
      data: {
        assets: assets.map((a) => ({ ...a, url: `/api/media/${a.id}` })),
        totalCount: assets.length,
        totalBytes,
      },
    };
  } catch (error: any) {
    console.error("Erro ao listar mídias da campanha:", error);
    return { success: false, error: error?.message || "Falha ao listar mídias." };
  }
}

/**
 * Deleta uma mídia do banco
 */
export async function deleteMediaAssetAction(mediaId: string, campaignId?: string) {
  try {
    await db.delete(mediaAssets).where(eq(mediaAssets.id, mediaId));
    if (campaignId) {
      revalidatePath(`/campanhas/${campaignId}/narrador`);
      revalidatePath(`/campanhas/${campaignId}/mesa`);
    }
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir mídia:", error);
    return { success: false, error: error?.message || "Falha ao excluir mídia." };
  }
}

/**
 * Vincula uma mídia ao avatar do personagem
 */
export async function updateCharacterAvatarAction(characterId: string, avatarUrl: string) {
  try {
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (!character) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const currentSheet = (character.sheetData as any) || {};
    const updatedSheet = {
      ...currentSheet,
      profile: {
        ...currentSheet.profile,
        avatarUrl,
      },
    };

    await db
      .update(characters)
      .set({ sheetData: updatedSheet })
      .where(eq(characters.id, characterId));

    if (character.campaignId) {
      revalidatePath(`/campanhas/${character.campaignId}/personagens/${characterId}`);
    }
    return { success: true, avatarUrl };
  } catch (error: any) {
    console.error("Erro ao atualizar avatar do personagem:", error);
    return { success: false, error: error?.message || "Falha ao atualizar avatar." };
  }
}
