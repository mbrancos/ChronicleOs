"use server";

import { db } from "@/db";
import { campaigns, characters, xpLedgers } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";
import { CharacterSheetData } from "@/types/character";

// Função auxiliar para verificar se o usuário é o narrador da campanha
async function isNarratorOf(userId: string, campaignId: string): Promise<boolean> {
  const camp = await db
    .select({ narratorId: campaigns.narratorId })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);
  return camp.length > 0 && camp[0].narratorId === userId;
}

/**
 * Concede XP em massa para os jogadores ativos na sessão da crônica.
 */
export async function grantSessionXpAction(
  campaignId: string,
  baseXp: number,
  individualGrants: { characterId: string; totalXp: number; characterName: string }[],
  sessionTitle: string
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // 1. Validar que o usuário é o narrador
    const isNarrator = await isNarratorOf(session.user.id, campaignId);
    if (!isNarrator) {
      return { success: false, error: "Acesso negado: Apenas o Narrador da campanha pode distribuir XP." };
    }

    const trimmedTitle = sessionTitle.trim();
    if (!trimmedTitle) {
      return { success: false, error: "O título da sessão é obrigatório." };
    }

    // 2. Gravar os créditos em massa no banco de dados
    if (individualGrants && individualGrants.length > 0) {
      await db.transaction(async (tx) => {
        for (const grant of individualGrants) {
          await tx.insert(xpLedgers).values({
            characterId: grant.characterId,
            description: `Sessão: "${trimmedTitle}" - Crédito concedido pelo Narrador`,
            xpChange: grant.totalXp,
          });
        }
      });
    }

    // 3. Disparar evento WebSocket no Pusher para o ActionFeed
    try {
      const publicChannelName = `public-campaign-${campaignId}`;
      await pusherServer.trigger(publicChannelName, "xp-granted", {
        sessionTitle: trimmedTitle,
        baseXp,
        individualGrants,
      });
    } catch (pushErr) {
      console.error("Erro ao notificar Pusher (xp-granted):", pushErr);
    }

    revalidatePath(`/campanhas/${campaignId}/mesa`);
    revalidatePath(`/campanhas/${campaignId}/narrador`);

    return { success: true };
  } catch (err: any) {
    console.error("Erro em grantSessionXpAction:", err);
    return { success: false, error: err?.message || "Erro ao conceder XP da sessão." };
  }
}

/**
 * Registra a compra/evolução de uma característica por XP do personagem.
 */
export async function spendCharacterXpAction(
  characterId: string,
  traitName: string,
  traitType: "attribute" | "skill" | "discipline" | "advantage" | "specialty" | "humanity" | "blood_potency",
  newLevel: number,
  costXp: number,
  justification: string
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // 1. Buscar o personagem
    const charResult = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const character = charResult[0];

    // 2. Validar se o usuário pode gastar (dono do char ou narrador)
    const isOwner = character.userId === session.user.id;
    let isNarrator = false;
    if (character.campaignId) {
      isNarrator = await isNarratorOf(session.user.id, character.campaignId);
    }

    if (!isOwner && !isNarrator) {
      return { success: false, error: "Acesso negado: Você não possui autorização para evoluir este personagem." };
    }

    if (!justification || justification.trim().length < 15) {
      return { success: false, error: "A justificativa narrativa é obrigatória (mínimo de 15 caracteres)." };
    }

    // 3. Verificar o saldo de XP atual
    const balanceResult = await db
      .select({ sum: sql<number>`sum(${xpLedgers.xpChange})` })
      .from(xpLedgers)
      .where(eq(xpLedgers.characterId, characterId));
    
    const currentBalance = Number(balanceResult[0]?.sum) || 0;
    if (currentBalance < costXp) {
      return { 
        success: false, 
        error: `Saldo de XP insuficiente. Saldo disponível: ${currentBalance} XP. Custo: ${costXp} XP.` 
      };
    }

    // 4. Modificar o sheetData e o buildState do personagem
    const sheetData = character.sheetData as CharacterSheetData;
    let buildState = (character.buildState as any) || {};

    let previousLevel = 0;

    if (traitType === "attribute") {
      if (sheetData.attributes.physical[traitName as keyof typeof sheetData.attributes.physical] !== undefined) {
        previousLevel = Number(sheetData.attributes.physical[traitName as keyof typeof sheetData.attributes.physical]) || 1;
        (sheetData.attributes.physical as any)[traitName] = newLevel;
      } else if (sheetData.attributes.social[traitName as keyof typeof sheetData.attributes.social] !== undefined) {
        previousLevel = Number(sheetData.attributes.social[traitName as keyof typeof sheetData.attributes.social]) || 1;
        (sheetData.attributes.social as any)[traitName] = newLevel;
      } else if (sheetData.attributes.mental[traitName as keyof typeof sheetData.attributes.mental] !== undefined) {
        previousLevel = Number(sheetData.attributes.mental[traitName as keyof typeof sheetData.attributes.mental]) || 1;
        (sheetData.attributes.mental as any)[traitName] = newLevel;
      } else {
        return { success: false, error: `Atributo inválido: ${traitName}` };
      }

      if (!buildState.attributes) buildState.attributes = {};
      if (!buildState.attributes[traitName]) {
        buildState.attributes[traitName] = { base: previousLevel, xp: 0 };
      }
      buildState.attributes[traitName].xp = (buildState.attributes[traitName].xp || 0) + (newLevel - previousLevel);

    } else if (traitType === "skill") {
      if (sheetData.skills[traitName as keyof typeof sheetData.skills] !== undefined) {
        previousLevel = Number(sheetData.skills[traitName as keyof typeof sheetData.skills]) || 0;
        (sheetData.skills as any)[traitName] = newLevel;
      } else {
        return { success: false, error: `Habilidade inválida: ${traitName}` };
      }

      if (!buildState.skills) buildState.skills = {};
      if (!buildState.skills[traitName]) {
        buildState.skills[traitName] = { base: previousLevel, xp: 0 };
      }
      buildState.skills[traitName].xp = (buildState.skills[traitName].xp || 0) + (newLevel - previousLevel);

    } else if (traitType === "discipline") {
      if (!sheetData.disciplines) sheetData.disciplines = [];
      const existingDisc = sheetData.disciplines.find(d => d.name.toLowerCase() === traitName.toLowerCase());
      if (existingDisc) {
        previousLevel = existingDisc.level;
        existingDisc.level = newLevel;
      } else {
        previousLevel = 0;
        sheetData.disciplines.push({
          id: `disc-${Date.now()}`,
          name: traitName,
          level: newLevel,
          powers: [],
        });
      }

      if (!buildState.disciplines) buildState.disciplines = {};
      if (!buildState.disciplines[traitName]) {
        buildState.disciplines[traitName] = { base: previousLevel, xp: 0 };
      }
      buildState.disciplines[traitName].xp = (buildState.disciplines[traitName].xp || 0) + (newLevel - previousLevel);

    } else if (traitType === "advantage") {
      if (!sheetData.advantages) sheetData.advantages = [];
      // traitName aqui representa o id ou nome da vantagem
      const existingAdv = sheetData.advantages.find(a => a.id === traitName || a.name.toLowerCase() === traitName.toLowerCase());
      let advId = traitName;
      if (existingAdv) {
        previousLevel = existingAdv.level;
        existingAdv.level = newLevel;
        advId = existingAdv.id;
      } else {
        previousLevel = 0;
        advId = `adv-${Date.now()}`;
        sheetData.advantages.push({
          id: advId,
          name: traitName,
          type: "merit",
          level: newLevel,
        });
      }

      if (!buildState.advantages) buildState.advantages = {};
      if (!buildState.advantages[advId]) {
        buildState.advantages[advId] = { base: previousLevel, xp: 0 };
      }
      buildState.advantages[advId].xp = (buildState.advantages[advId].xp || 0) + (newLevel - previousLevel);

    } else if (traitType === "humanity") {
      previousLevel = sheetData.status?.humanity || 7;
      if (sheetData.status) {
        sheetData.status.humanity = newLevel;
      }

      if (!buildState.status) buildState.status = {};
      if (!buildState.status.humanity) {
        buildState.status.humanity = { base: previousLevel, xp: 0 };
      }
      buildState.status.humanity.xp = (buildState.status.humanity.xp || 0) + (newLevel - previousLevel);

    } else if (traitType === "blood_potency") {
      previousLevel = sheetData.status?.blood_potency || 1;
      if (sheetData.status) {
        sheetData.status.blood_potency = newLevel;
      }

      if (!buildState.status) buildState.status = {};
      if (!buildState.status.blood_potency) {
        buildState.status.blood_potency = { base: previousLevel, xp: 0 };
      }
      buildState.status.blood_potency.xp = (buildState.status.blood_potency.xp || 0) + (newLevel - previousLevel);

    } else {
      return { success: false, error: `Tipo de característica inválido para evolução por XP: ${traitType}` };
    }

    // 5. Salvar a atualização no banco de dados e inserir o débito no xp_ledgers
    await db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({
          sheetData,
          buildState,
        })
        .where(eq(characters.id, characterId));

      await tx.insert(xpLedgers).values({
        characterId,
        description: `Evolução: Comprou ${traitName} (Nível ${newLevel})`,
        xpChange: -costXp,
        metadata: {
          trait: traitName,
          type: traitType,
          previousLevel,
          newLevel,
          xpCost: costXp,
        },
      });
    });

    revalidatePath("/hub");
    if (character.campaignId) {
      revalidatePath(`/campanhas/${character.campaignId}/mesa`);
      revalidatePath(`/campanhas/${character.campaignId}/narrador`);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Erro em spendCharacterXpAction:", err);
    return { success: false, error: err?.message || "Erro ao gastar XP." };
  }
}

/**
 * Veta uma transação de gasto de XP feita por um jogador, restaurando o nível anterior da característica.
 */
export async function vetoXpSpendAction(ledgerId: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // 1. Buscar a transação do xp_ledgers
    const ledgerResult = await db
      .select()
      .from(xpLedgers)
      .where(eq(xpLedgers.id, ledgerId))
      .limit(1);

    if (ledgerResult.length === 0) {
      return { success: false, error: "Registro de transação de XP não encontrado." };
    }

    const txn = ledgerResult[0];

    // Somente gastos com metadados podem ser vetados
    if (txn.xpChange >= 0 || !txn.metadata) {
      return { success: false, error: "Apenas transações de gasto de XP contendo metadados podem ser vetadas." };
    }

    // 2. Buscar o personagem e a campanha associada para validar se o usuário é o narrador
    const charResult = await db
      .select({
        id: characters.id,
        campaignId: characters.campaignId,
        sheetData: characters.sheetData,
        buildState: characters.buildState,
      })
      .from(characters)
      .where(eq(characters.id, txn.characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem associado à transação não encontrado." };
    }

    const character = charResult[0];

    if (!character.campaignId) {
      return { success: false, error: "Este personagem não está associado a nenhuma crônica ativa." };
    }

    const isNarrator = await isNarratorOf(session.user.id, character.campaignId);
    if (!isNarrator) {
      return { success: false, error: "Acesso negado: Apenas o Narrador da campanha pode vetar compras de XP." };
    }

    // 3. Reverter no sheetData e no buildState
    const meta = txn.metadata as any;
    const traitType = meta.type;
    const traitName = meta.trait;
    const previousLevel = meta.previousLevel ?? 0;
    const xpCost = meta.xpCost ?? 0;

    const sheetData = character.sheetData as CharacterSheetData;
    let buildState = (character.buildState as any) || {};

    if (traitType === "attribute") {
      if (sheetData.attributes.physical[traitName as keyof typeof sheetData.attributes.physical] !== undefined) {
        (sheetData.attributes.physical as any)[traitName] = previousLevel;
      } else if (sheetData.attributes.social[traitName as keyof typeof sheetData.attributes.social] !== undefined) {
        (sheetData.attributes.social as any)[traitName] = previousLevel;
      } else if (sheetData.attributes.mental[traitName as keyof typeof sheetData.attributes.mental] !== undefined) {
        (sheetData.attributes.mental as any)[traitName] = previousLevel;
      }

      if (buildState.attributes && buildState.attributes[traitName]) {
        const diff = meta.newLevel - previousLevel;
        buildState.attributes[traitName].xp = Math.max(0, (buildState.attributes[traitName].xp || 0) - diff);
        if (buildState.attributes[traitName].xp === 0) {
          delete buildState.attributes[traitName];
        }
      }

    } else if (traitType === "skill") {
      if (sheetData.skills[traitName as keyof typeof sheetData.skills] !== undefined) {
        (sheetData.skills as any)[traitName] = previousLevel;
      }

      if (buildState.skills && buildState.skills[traitName]) {
        const diff = meta.newLevel - previousLevel;
        buildState.skills[traitName].xp = Math.max(0, (buildState.skills[traitName].xp || 0) - diff);
        if (buildState.skills[traitName].xp === 0) {
          delete buildState.skills[traitName];
        }
      }

    } else if (traitType === "discipline") {
      if (sheetData.disciplines) {
        const discIdx = sheetData.disciplines.findIndex(d => d.name.toLowerCase() === traitName.toLowerCase());
        if (discIdx !== -1) {
          if (previousLevel === 0) {
            sheetData.disciplines.splice(discIdx, 1);
          } else {
            sheetData.disciplines[discIdx].level = previousLevel;
          }
        }
      }

      if (buildState.disciplines && buildState.disciplines[traitName]) {
        const diff = meta.newLevel - previousLevel;
        buildState.disciplines[traitName].xp = Math.max(0, (buildState.disciplines[traitName].xp || 0) - diff);
        if (buildState.disciplines[traitName].xp === 0) {
          delete buildState.disciplines[traitName];
        }
      }

    } else if (traitType === "advantage") {
      if (sheetData.advantages) {
        const advIdx = sheetData.advantages.findIndex(a => a.id === traitName || a.name.toLowerCase() === traitName.toLowerCase());
        if (advIdx !== -1) {
          if (previousLevel === 0) {
            sheetData.advantages.splice(advIdx, 1);
          } else {
            sheetData.advantages[advIdx].level = previousLevel;
          }
        }
      }

      if (buildState.advantages && buildState.advantages[traitName]) {
        const diff = meta.newLevel - previousLevel;
        buildState.advantages[traitName].xp = Math.max(0, (buildState.advantages[traitName].xp || 0) - diff);
        if (buildState.advantages[traitName].xp === 0) {
          delete buildState.advantages[traitName];
        }
      }

    } else if (traitType === "humanity") {
      if (sheetData.status) {
        sheetData.status.humanity = previousLevel;
      }

      if (buildState.status && buildState.status.humanity) {
        const diff = meta.newLevel - previousLevel;
        buildState.status.humanity.xp = Math.max(0, (buildState.status.humanity.xp || 0) - diff);
        if (buildState.status.humanity.xp === 0) {
          delete buildState.status.humanity;
        }
      }

    } else if (traitType === "blood_potency") {
      if (sheetData.status) {
        sheetData.status.blood_potency = previousLevel;
      }

      if (buildState.status && buildState.status.blood_potency) {
        const diff = meta.newLevel - previousLevel;
        buildState.status.blood_potency.xp = Math.max(0, (buildState.status.blood_potency.xp || 0) - diff);
        if (buildState.status.blood_potency.xp === 0) {
          delete buildState.status.blood_potency;
        }
      }
    }

    // 4. Salvar as mudanças no banco e registrar a compensação positiva (reembolso) no extrato do jogador
    await db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({
          sheetData,
          buildState,
        })
        .where(eq(characters.id, character.id));

      await tx.insert(xpLedgers).values({
        characterId: character.id,
        description: `Reembolso: Compra de ${traitName} (Nível ${meta.newLevel}) vetada pelo Narrador`,
        xpChange: xpCost,
      });

      // Também removemos (ou mudamos a descrição) da transação vetada original para sabermos que ela foi vetada
      await tx
        .update(xpLedgers)
        .set({
          description: `[VETADO] ${txn.description}`,
        })
        .where(eq(xpLedgers.id, ledgerId));
    });

    revalidatePath("/hub");
    revalidatePath(`/campanhas/${character.campaignId}/mesa`);
    revalidatePath(`/campanhas/${character.campaignId}/narrador`);

    return { success: true };
  } catch (err: any) {
    console.error("Erro em vetoXpSpendAction:", err);
    return { success: false, error: err?.message || "Erro ao vetar compra de XP." };
  }
}

/**
 * Busca as compras de XP mais recentes feitas pelos jogadores desta campanha.
 */
export async function getRecentCampaignXpSpends(campaignId: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const isNarrator = await isNarratorOf(session.user.id, campaignId);
    if (!isNarrator) {
      return { success: false, error: "Acesso negado: Apenas o Narrador pode auditar as transações." };
    }

    const result = await db
      .select({
        id: xpLedgers.id,
        characterId: xpLedgers.characterId,
        characterName: characters.name,
        description: xpLedgers.description,
        xpChange: xpLedgers.xpChange,
        metadata: xpLedgers.metadata,
        createdAt: xpLedgers.createdAt,
      })
      .from(xpLedgers)
      .innerJoin(characters, eq(xpLedgers.characterId, characters.id))
      .where(
        sql`${characters.campaignId} = ${campaignId} AND ${xpLedgers.xpChange} < 0 AND ${xpLedgers.description} NOT LIKE '[VETADO]%'`
      )
      .orderBy(desc(xpLedgers.createdAt))
      .limit(30);

    return { success: true, data: result };
  } catch (err: any) {
    console.error("Erro em getRecentCampaignXpSpends:", err);
    return { success: false, error: err?.message || "Erro ao buscar auditoria de XP." };
  }
}
