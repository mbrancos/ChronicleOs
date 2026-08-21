"use server";

import { db } from "@/db";
import { mediaAssets, characters, campaigns } from "@/db/schema";
import { eq, desc, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(val?: string | null): val is string {
  return typeof val === "string" && UUID_REGEX.test(val);
}

export interface UploadMediaPayload {
  campaignId?: string | null;
  name: string;
  category: "avatar" | "scene" | "item" | "other";
  base64: string;
  sizeBytes: number;
  width: number;
  height: number;
  userId?: string | null;
}

/**
 * Salva uma nova mídia otimizada no banco
 */
export async function uploadMediaAssetAction(payload: UploadMediaPayload) {
  try {
    let resolvedUserId: string | null = null;

    try {
      const { data: session } = await auth.getSession();
      if (session?.user?.id && isValidUuid(session.user.id)) {
        resolvedUserId = session.user.id;
      }
    } catch {
      // Sessão opcional
    }

    if (!resolvedUserId && isValidUuid(payload.userId)) {
      resolvedUserId = payload.userId;
    }

    const resolvedCampaignId = isValidUuid(payload.campaignId) ? payload.campaignId : null;

    if (payload.sizeBytes > 800 * 1024) {
      return { success: false, error: "Tamanho de imagem excede o limite otimizado (máx 800 KB)." };
    }

    const [inserted] = await db
      .insert(mediaAssets)
      .values({
        campaignId: resolvedCampaignId,
        userId: resolvedUserId,
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
 * Lista todas as mídias da campanha (e avatares do usuário)
 */
export async function getCampaignMediaAssetsAction(campaignId?: string | null, userId?: string) {
  try {
    const validCampaignId = isValidUuid(campaignId) ? campaignId : null;
    let validUserId: string | null = null;

    if (isValidUuid(userId)) {
      validUserId = userId;
    } else {
      try {
        const { data: session } = await auth.getSession();
        if (session?.user?.id && isValidUuid(session.user.id)) {
          validUserId = session.user.id;
        }
      } catch {
        // Sessão opcional
      }
    }

    const conditions = [];
    if (validCampaignId) {
      conditions.push(eq(mediaAssets.campaignId, validCampaignId));
    }
    if (validUserId) {
      conditions.push(eq(mediaAssets.userId, validUserId));
    }

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
      .where(conditions.length > 0 ? or(...conditions) : undefined)
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
    if (!isValidUuid(mediaId)) {
      return { success: false, error: "ID de mídia inválido." };
    }
    await db.delete(mediaAssets).where(eq(mediaAssets.id, mediaId));
    if (campaignId && isValidUuid(campaignId)) {
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
    if (!isValidUuid(characterId)) {
      return { success: false, error: "ID de personagem inválido." };
    }

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
        portrait_url: avatarUrl,
      },
    };

    await db
      .update(characters)
      .set({ sheetData: updatedSheet })
      .where(eq(characters.id, characterId));

    if (character.campaignId) {
      revalidatePath(`/campanhas/${character.campaignId}/personagens/${characterId}`);
      revalidatePath(`/campanhas/${character.campaignId}/mesa`);
    }
    revalidatePath(`/cofre/personagens/${characterId}`);
    return { success: true, avatarUrl };
  } catch (error: any) {
    console.error("Erro ao atualizar avatar do personagem:", error);
    return { success: false, error: error?.message || "Falha ao atualizar avatar." };
  }
}

/**
 * Atualiza a categoria e/ou nome de uma mídia existente
 */
export async function updateMediaAssetCategoryAction(
  id: string,
  category: "avatar" | "scene" | "item" | "other",
  name?: string
) {
  try {
    if (!isValidUuid(id)) {
      return { success: false, error: "ID de mídia inválido." };
    }

    const updateData: any = { category };
    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    await db
      .update(mediaAssets)
      .set(updateData)
      .where(eq(mediaAssets.id, id));

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar categoria da mídia:", error);
    return { success: false, error: error?.message || "Falha ao atualizar categoria." };
  }
}
