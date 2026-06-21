"use server";

import { db } from "@/db";
import { characters, campaigns, users, xpLedgers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { CharacterSheetData } from "@/types/character";
import { auth } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";

// Função para buscar dados da ficha do banco
export async function getCharacterSheet(characterId: string) {
  try {
    // Valida se o ID fornecido é um formato UUID aceitável para o PostgreSQL
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido (não é um UUID válido)" };
    }

    const result = await db
      .select({ 
        sheetData: characters.sheetData,
        name: characters.name,
        status: characters.status,
        buildState: characters.buildState
      })
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "Personagem não encontrado no banco de dados" };
    }

    return { 
      success: true, 
      data: result[0].sheetData as CharacterSheetData | null,
      name: result[0].name,
      status: result[0].status,
      buildState: result[0].buildState
    };
  } catch (error: any) {
    console.error("Erro em getCharacterSheet:", error);
    return { success: false, error: error?.message || "Erro interno de banco de dados" };
  }
}

// Server Action para salvar a ficha no banco
export async function updateCharacterSheet(
  characterId: string,
  sheetData: CharacterSheetData,
  buildState?: any,
  status?: "DRAFT" | "READY" | "IN_PLAY"
) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido (não é um UUID válido)" };
    }

    // 1. Buscar o estado atual do personagem no banco para auditoria de XP
    const charResult = await db
      .select({
        status: characters.status,
        buildState: characters.buildState,
        campaignId: characters.campaignId,
      })
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const oldChar = charResult[0];
    const oldStatus = oldChar.status;
    const oldBuildState = oldChar.buildState;

    const clan = sheetData.profile?.clan || "Sem Clã";

    // 2. Montar o payload de atualização
    const updatePayload: any = { sheetData };
    if (sheetData.profile && sheetData.profile.name) {
      updatePayload.name = sheetData.profile.name.trim();
    }
    if (buildState !== undefined) {
      updatePayload.buildState = buildState;
    }
    if (status !== undefined) {
      updatePayload.status = status;
    }

    // 3. Executar o update
    await db
      .update(characters)
      .set(updatePayload)
      .where(eq(characters.id, characterId));

    // 4. Auditoria de XP baseada na transição de estados
    const targetStatus = status || oldStatus;

    if (oldStatus === "DRAFT" && targetStatus === "READY") {
      // Caso 1: Consolidação da criação do personagem (transição DRAFT -> READY)
      const spentXp = calculateSpentXp(clan, buildState || oldBuildState);
      if (spentXp > 0) {
        await db.insert(xpLedgers).values({
          characterId,
          description: "Gastos de criação inicial (Fechamento de Ficha)",
          xpChange: -spentXp,
        });
      }
    } else if (oldStatus !== "DRAFT" && buildState && oldBuildState) {
      // Caso 2: Auditoria de novas compras de XP em tempo real (para READY ou IN_PLAY)
      await auditXpChanges(characterId, oldBuildState, buildState, clan);
    }

    revalidatePath("/hub");
    if (oldChar.campaignId) {
      revalidatePath(`/campanhas/${oldChar.campaignId}/narrador`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erro em updateCharacterSheet:", error);
    return { success: false, error: error?.message || "Falha na sincronização com o banco" };
  }
}

// Server Action de exclusão de personagem
export async function deleteCharacterAction(characterId: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido." };
    }

    // 1. Buscar o personagem para validar autoria
    const charResult = await db
      .select({
        userId: characters.userId,
        campaignId: characters.campaignId,
      })
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const char = charResult[0];

    // Permissão: Apenas o jogador dono pode deletar seu próprio personagem permanentemente
    const isOwner = char.userId === session.user.id;

    if (!isOwner) {
      return { success: false, error: "Acesso negado: Você não possui autorização para remover este personagem." };
    }

    // 2. Deletar do banco
    await db.delete(characters).where(eq(characters.id, characterId));

    revalidatePath("/hub");
    if (char.campaignId) {
      revalidatePath(`/campanhas/${char.campaignId}/narrador`);
    }
    return { success: true };
  } catch (err: any) {
    console.error("Erro em deleteCharacterAction:", err);
    return { success: false, error: err?.message || "Falha ao excluir personagem." };
  }
}

// Server Action de duplicação de personagem
export async function duplicateCharacterAction(characterId: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido." };
    }

    // 1. Buscar o personagem original
    const charResult = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem original não encontrado." };
    }

    const originalChar = charResult[0];

    // Segurança: apenas o dono pode duplicar o personagem
    if (originalChar.userId !== session.user.id) {
      return { success: false, error: "Acesso negado: Você não é o proprietário deste personagem." };
    }

    // 2. Inserir clone no Cofre
    await db.insert(characters).values({
      name: `${originalChar.name} (Cópia)`,
      type: originalChar.type,
      userId: session.user.id,
      campaignId: null, // Forçado a ir para o Cofre
      sheetData: originalChar.sheetData,
    });

    revalidatePath("/hub");
    return { success: true };
  } catch (err: any) {
    console.error("Erro em duplicateCharacterAction:", err);
    return { success: false, error: err?.message || "Falha ao duplicar personagem." };
  }
}

// Server Action de transferência de personagem para outro jogador
export async function transferCharacterAction(characterId: string, targetUserEmail: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido." };
    }

    const emailTrimmed = targetUserEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      return { success: false, error: "O e-mail de destino é obrigatório." };
    }

    // 1. Buscar o personagem original
    const charResult = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const char = charResult[0];

    // Segurança: apenas o dono pode transferir o personagem
    if (char.userId !== session.user.id) {
      return { success: false, error: "Acesso negado: Você não é o proprietário deste personagem." };
    }

    // Evitar transferir para si mesmo
    if (session.user.email?.toLowerCase() === emailTrimmed) {
      return { success: false, error: "Você já é o proprietário deste personagem." };
    }

    // 2. Buscar o usuário de destino pelo e-mail
    const targetUserResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, emailTrimmed))
      .limit(1);

    if (targetUserResult.length === 0) {
      return { success: false, error: "Usuário destinatário não encontrado na base de dados." };
    }

    const targetUserId = targetUserResult[0].id;

    // 3. Atualizar o personagem: muda o dono e expulsa de qualquer crônica ativa (vai pro Cofre)
    await db
      .update(characters)
      .set({
        userId: targetUserId,
        campaignId: null, // Expulsa da crônica ativa
      })
      .where(eq(characters.id, characterId));

    revalidatePath("/hub");
    if (char.campaignId) {
      revalidatePath(`/campanhas/${char.campaignId}/narrador`);
    }
    return { success: true };
  } catch (err: any) {
    console.error("Erro em transferCharacterAction:", err);
    return { success: false, error: err?.message || "Falha ao transferir personagem." };
  }
}

// Server Action para associar um personagem livre do cofre a uma nova campanha (crônica)
export async function joinCampaignWithCharacterAction(characterId: string, campaignId: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId) || !uuidRegex.test(campaignId)) {
      return { success: false, error: "IDs fornecidos são inválidos." };
    }

    // 1. Verificar se a campanha existe e trazer dados de regras da crônica
    const campResult = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        powerLevel: campaigns.powerLevel,
        extraXp: campaigns.extraXp,
        allowedClans: campaigns.allowedClans,
      })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (campResult.length === 0) {
      return { success: false, error: "Crônica não encontrada." };
    }

    const campaign = campResult[0];

    // Restrição de Estado da Campanha: não pode entrar em campanhas arquivadas ou pausadas
    if (campaign.status === "ARCHIVED" || campaign.status === "PAUSED") {
      return { success: false, error: "Esta crônica está arquivada ou em hiato temporário." };
    }

    // 2. Buscar o personagem para validar posse e se ele está pronto no cofre
    const charResult = await db
      .select({ 
        userId: characters.userId, 
        campaignId: characters.campaignId,
        status: characters.status,
        buildState: characters.buildState,
        sheetData: characters.sheetData
      })
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const char = charResult[0];

    // Segurança: o usuário atual deve ser o dono do personagem
    if (char.userId !== session.user.id) {
      return { success: false, error: "Acesso negado: Você não é o proprietário deste personagem." };
    }

    // Segurança: o personagem deve estar no cofre (sem crônica ativa)
    if (char.campaignId) {
      return { success: false, error: "Este personagem já faz parte de outra crônica ativa." };
    }

    // Validação de Alfândega (Hard Lock) - O personagem precisa estar finalizado no cofre
    if (char.status !== "READY") {
      return { success: false, error: "Apenas vampiros com a criação básica finalizada (Pronto no Cofre) podem ingressar em crônicas." };
    }

    const sheetData = char.sheetData as any;
    const clan = sheetData?.profile?.clan || "Sem Clã";

    // A. Validação de Clãs Permitidos
    const allowedClans = campaign.allowedClans;
    if (allowedClans && allowedClans.length > 0 && !allowedClans.includes(clan)) {
      return { success: false, error: `O clã '${clan}' é banido pelo Narrador nesta crônica.` };
    }

    // B. Validação de Limites de XP
    const spentXp = calculateSpentXp(clan, char.buildState);
    const powerLevelXpMap = {
      FLEDGLING: 0,
      NEONATE: 15,
      ANCILLAE: 35,
    };
    const maxAllowedXp = (powerLevelXpMap[campaign.powerLevel] ?? 15) + (campaign.extraXp || 0);

    if (spentXp > maxAllowedXp) {
      return { 
        success: false, 
        error: `O personagem gastou ${spentXp} XP, mas o limite autorizado da crônica é ${maxAllowedXp} XP (${campaign.powerLevel} = ${powerLevelXpMap[campaign.powerLevel] ?? 15} XP + ${campaign.extraXp} XP extra). Reduza os pontos em excesso no seu Cofre antes de ingressar.`
      };
    }

    // 3. Atualizar o campaignId do personagem e seu status para 'IN_PLAY'
    await db
      .update(characters)
      .set({ 
        campaignId,
        status: "IN_PLAY" // Ficha trancada
      })
      .where(eq(characters.id, characterId));

    // Gravar log inicial de gastos de auditoria na crônica
    if (spentXp > 0) {
      await db.insert(xpLedgers).values({
        characterId,
        description: `Ingresso na Crônica '${campaign.name}' com gastos de criação`,
        xpChange: -spentXp,
      });
    }

    revalidatePath("/hub");
    revalidatePath(`/campanhas/${campaignId}/narrador`);
    return { success: true };
  } catch (err: any) {
    console.error("Erro em joinCampaignWithCharacterAction:", err);
    return { success: false, error: err?.message || "Falha ao entrar na crônica." };
  }
}

// Server Action para Narrador destravar a edição de uma ficha de jogador (Anistia)
export async function anistiaCharacterAction(characterId: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido." };
    }

    // 1. Buscar o personagem e a campanha associada
    const charResult = await db
      .select({
        campaignId: characters.campaignId,
        status: characters.status,
      })
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (charResult.length === 0) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const char = charResult[0];
    if (!char.campaignId) {
      return { success: false, error: "Este personagem não está vinculado a nenhuma crônica." };
    }

    // 2. Verificar se o usuário autenticado é o Narrador da crônica
    const campResult = await db
      .select({ narratorId: campaigns.narratorId })
      .from(campaigns)
      .where(eq(campaigns.id, char.campaignId))
      .limit(1);

    if (campResult.length === 0) {
      return { success: false, error: "Crônica associada não encontrada." };
    }

    if (campResult[0].narratorId !== session.user.id) {
      return { success: false, error: "Acesso negado: Apenas o Narrador da crônica pode conceder anistia (destravar a edição)." };
    }

    // 3. Atualizar o status do personagem para 'READY' no banco, destravando a edição
    await db
      .update(characters)
      .set({ status: "READY" })
      .where(eq(characters.id, characterId));

    revalidatePath("/hub");
    revalidatePath(`/campanhas/${char.campaignId}/narrador`);
    return { success: true };
  } catch (err: any) {
    console.error("Erro em anistiaCharacterAction:", err);
    return { success: false, error: err?.message || "Falha ao destravar edição do personagem." };
  }
}

// Server Action para carregar o histórico de auditoria de XP de um personagem
export async function getCharacterXpLedger(characterId: string) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(characterId)) {
      return { success: false, error: "ID de personagem inválido." };
    }

    const ledger = await db
      .select()
      .from(xpLedgers)
      .where(eq(xpLedgers.characterId, characterId))
      .orderBy(desc(xpLedgers.createdAt));

    return { success: true, data: ledger };
  } catch (err: any) {
    console.error("Erro em getCharacterXpLedger:", err);
    return { success: false, error: err?.message || "Falha ao buscar histórico de XP." };
  }
}

// =========================================================================
// CONSTANTES E HELPERS DO MOTOR DE REGRAS V5 (BACKEND)
// =========================================================================

const TECHNICAL_NAMES: Record<string, string> = {
  strength: "Força", dexterity: "Destreza", stamina: "Vigor",
  charisma: "Carisma", manipulation: "Manipulação", composure: "Autocontrole",
  intelligence: "Inteligência", wits: "Raciocínio", resolve: "Determinação",
  athletics: "Esportes", brawl: "Briga", craft: "Ofícios", drive: "Condução",
  firearms: "Armas de Fogo", melee: "Armas Brancas", larceny: "Subterfúgio",
  stealth: "Furtividade", survival: "Sobrevivência",
  animal_ken: "Empatia com Animais", etiquette: "Etiqueta", insight: "Perspicácia",
  intimidation: "Intimidação", leadership: "Liderança", performance: "Performance",
  persuasion: "Persuasão", streetwise: "Manha", subterfuge: "Lábia",
  academics: "Acadêmicos", awareness: "Percepção", finance: "Finanças",
  investigation: "Investigação", medicine: "Medicina", occult: "Ocultismo",
  politics: "Política", science: "Ciência", technology: "Tecnologia"
};

const CLAN_DISCIPLINE_MAPPING: Record<string, string[]> = {
  "Banu Haqim": ["Feitiçaria de Sangue (Blood Sorcery)", "Rapidez (Celerity)", "Ofuscação (Obfuscate)"],
  "Brujah": ["Rapidez (Celerity)", "Potência (Potence)", "Presença (Presence)"],
  "Gangrel": ["Animalismo (Animalism)", "Fortitude", "Metamorfose (Protean)"],
  "Hecata": ["Auspício (Auspex)", "Fortitude", "Oblivion (Esquecimento)"],
  "Lasombra": ["Dominação (Dominate)", "Oblivion (Esquecimento)", "Potência (Potence)"],
  "Malkaviano": ["Auspício (Auspex)", "Ofuscação (Obfuscate)", "Dominação (Dominate)"],
  "Malkavian": ["Auspício (Auspex)", "Ofuscação (Obfuscate)", "Dominação (Dominate)"],
  "Ministério": ["Ofuscação (Obfuscate)", "Presença (Presence)", "Metamorfose (Protean)"],
  "Nosferatu": ["Animalismo (Animalism)", "Ofuscação (Obfuscate)", "Potência (Potence)"],
  "Ravnos": ["Animalismo (Animalism)", "Ofuscação (Obfuscate)", "Presença (Presence)"],
  "Salubri": ["Auspício (Auspex)", "Fortitude", "Presença (Presence)"],
  "Toreador": ["Auspício (Auspex)", "Rapidez (Celerity)", "Presença (Presence)"],
  "Tremere": ["Auspício (Auspex)", "Dominação (Dominate)", "Feitiçaria de Sangue (Blood Sorcery)"],
  "Tzimisce": ["Animalismo (Animalism)", "Dominação (Dominate)", "Metamorfose (Protean)"],
  "Ventrue": ["Dominação (Dominate)", "Fortitude", "Presença (Presence)"]
};

// Função para calcular o total de XP gasto a partir do buildState do V5
function calculateSpentXp(clan: string, buildState: any): number {
  if (!buildState) return 0;
  let totalXp = 0;

  const isCaitiffOrThin = clan === "Caitiff" || clan === "Sem Clã" || clan === "Sangue-Ralo";

  // 1. Atributos (Novo Nível * 5)
  if (buildState.attributes) {
    Object.values(buildState.attributes).forEach((attr: any) => {
      if (attr && attr.xp > 0) {
        const start = attr.base || 1;
        const end = start + attr.xp;
        for (let lvl = start + 1; lvl <= end; lvl++) {
          totalXp += lvl * 5;
        }
      }
    });
  }

  // 2. Habilidades (Novo Nível * 3)
  if (buildState.skills) {
    Object.values(buildState.skills).forEach((skill: any) => {
      if (skill && skill.xp > 0) {
        const start = skill.base || 0;
        const end = start + skill.xp;
        for (let lvl = start + 1; lvl <= end; lvl++) {
          totalXp += lvl * 3;
        }
      }
    });
  }

  // 3. Disciplinas
  if (buildState.disciplines) {
    const clanDisciplines = CLAN_DISCIPLINE_MAPPING[clan] || [];
    Object.entries(buildState.disciplines).forEach(([discName, points]: any) => {
      if (points && points.xp > 0) {
        const isClanDisc = clanDisciplines.some(d => discName.toLowerCase().includes(d.split(" ")[0].toLowerCase()));
        
        let costMultiplier = 7; // Fora do Clã
        if (isCaitiffOrThin) {
          costMultiplier = 6; // Caitiff qualquer disciplina
        } else if (isClanDisc) {
          costMultiplier = 5; // Disciplina de Clã
        }

        const start = points.base || 0;
        const end = start + points.xp;
        for (let lvl = start + 1; lvl <= end; lvl++) {
          totalXp += lvl * costMultiplier;
        }
      }
    });
  }

  // 4. Vantagens (3 XP por ponto de vantagem)
  if (buildState.advantages) {
    Object.values(buildState.advantages).forEach((points: any) => {
      if (points && points.xp > 0) {
        totalXp += points.xp * 3;
      }
    });
  }

  // 5. Especializações (3 XP cada)
  if (buildState.specialties && Array.isArray(buildState.specialties)) {
    buildState.specialties.forEach((spec: any) => {
      if (spec && spec.isXp) {
        totalXp += 3;
      }
    });
  }

  // 6. Potência de Sangue (Novo Nível * 10)
  if (buildState.blood_potency && buildState.blood_potency.xp > 0) {
    const start = buildState.blood_potency.base || 1;
    const end = start + buildState.blood_potency.xp;
    for (let lvl = start + 1; lvl <= end; lvl++) {
      totalXp += lvl * 10;
    }
  }

  // 7. Humanidade (Novo Nível * 10)
  if (buildState.humanity && buildState.humanity.xp > 0) {
    const start = buildState.humanity.base || 7;
    const end = start + buildState.humanity.xp;
    for (let lvl = start + 1; lvl <= end; lvl++) {
      totalXp += lvl * 10;
    }
  }

  return totalXp;
}

// Algoritmo de auditoria de XP em tempo real comparando oldBuildState e newBuildState
async function auditXpChanges(characterId: string, oldBuildState: any, newBuildState: any, clan: string) {
  if (!oldBuildState || !newBuildState) return;

  const clanDisciplines = CLAN_DISCIPLINE_MAPPING[clan] || [];
  const isCaitiffOrThin = clan === "Caitiff" || clan === "Sem Clã" || clan === "Sangue-Ralo";

  const changes: { description: string; xpChange: number }[] = [];

  // A. Comparar Atributos
  if (oldBuildState.attributes && newBuildState.attributes) {
    Object.keys(newBuildState.attributes).forEach(key => {
      const oldVal = oldBuildState.attributes[key] || { base: 1, xp: 0 };
      const newVal = newBuildState.attributes[key] || { base: 1, xp: 0 };
      const label = TECHNICAL_NAMES[key] || key;

      const oldXp = oldVal.xp || 0;
      const newXp = newVal.xp || 0;

      if (newXp > oldXp) {
        for (let lvl = (oldVal.base + oldXp) + 1; lvl <= (newVal.base + newXp); lvl++) {
          changes.push({ description: `Comprou Atributo ${label} ${lvl} com XP`, xpChange: -(lvl * 5) });
        }
      } else if (newXp < oldXp) {
        for (let lvl = (newVal.base + newXp) + 1; lvl <= (oldVal.base + oldXp); lvl++) {
          changes.push({ description: `Cancelou compra de Atributo ${label} ${lvl}`, xpChange: (lvl * 5) });
        }
      }
    });
  }

  // B. Comparar Habilidades
  if (oldBuildState.skills && newBuildState.skills) {
    Object.keys(newBuildState.skills).forEach(key => {
      const oldVal = oldBuildState.skills[key] || { base: 0, xp: 0 };
      const newVal = newBuildState.skills[key] || { base: 0, xp: 0 };
      const label = TECHNICAL_NAMES[key] || key;

      const oldXp = oldVal.xp || 0;
      const newXp = newVal.xp || 0;

      if (newXp > oldXp) {
        for (let lvl = (oldVal.base + oldXp) + 1; lvl <= (newVal.base + newXp); lvl++) {
          changes.push({ description: `Comprou Habilidade ${label} ${lvl} com XP`, xpChange: -(lvl * 3) });
        }
      } else if (newXp < oldXp) {
        for (let lvl = (newVal.base + newXp) + 1; lvl <= (oldVal.base + oldXp); lvl++) {
          changes.push({ description: `Cancelou compra de Habilidade ${label} ${lvl}`, xpChange: (lvl * 3) });
        }
      }
    });
  }

  // C. Comparar Disciplinas
  if (oldBuildState.disciplines && newBuildState.disciplines) {
    // Mesclar as disciplinas de ambas as listas para auditoria
    const allDiscs = new Set([...Object.keys(oldBuildState.disciplines), ...Object.keys(newBuildState.disciplines)]);
    
    allDiscs.forEach(discName => {
      const oldVal = oldBuildState.disciplines[discName] || { base: 0, xp: 0 };
      const newVal = newBuildState.disciplines[discName] || { base: 0, xp: 0 };

      const isClanDisc = clanDisciplines.some(d => discName.toLowerCase().includes(d.split(" ")[0].toLowerCase()));
      let costMultiplier = 7;
      if (isCaitiffOrThin) costMultiplier = 6;
      else if (isClanDisc) costMultiplier = 5;

      const oldXp = oldVal.xp || 0;
      const newXp = newVal.xp || 0;

      if (newXp > oldXp) {
        for (let lvl = (oldVal.base + oldXp) + 1; lvl <= (newVal.base + newXp); lvl++) {
          changes.push({ description: `Comprou Disciplina ${discName} ${lvl} com XP`, xpChange: -(lvl * costMultiplier) });
        }
      } else if (newXp < oldXp) {
        for (let lvl = (newVal.base + newXp) + 1; lvl <= (oldVal.base + oldXp); lvl++) {
          changes.push({ description: `Cancelou compra de Disciplina ${discName} ${lvl}`, xpChange: (lvl * costMultiplier) });
        }
      }
    });
  }

  // D. Comparar Vantagens
  if (oldBuildState.advantages && newBuildState.advantages) {
    const allAdvs = new Set([...Object.keys(oldBuildState.advantages), ...Object.keys(newBuildState.advantages)]);
    allAdvs.forEach(advId => {
      const oldVal = oldBuildState.advantages[advId] || { base: 0, xp: 0 };
      const newVal = newBuildState.advantages[advId] || { base: 0, xp: 0 };

      const oldXp = oldVal.xp || 0;
      const newXp = newVal.xp || 0;

      if (newXp !== oldXp) {
        changes.push({
          description: `Ajuste em Vantagem/Defeito com XP`,
          xpChange: -(newXp - oldXp) * 3,
        });
      }
    });
  }

  // E. Comparar Especializações (3 XP cada)
  const oldSpecs = oldBuildState.specialties || [];
  const newSpecs = newBuildState.specialties || [];
  const addedSpecs = newSpecs.filter((ns: any) => ns.isXp && !oldSpecs.some((os: any) => os.id === ns.id));
  const removedSpecs = oldSpecs.filter((os: any) => os.isXp && !newSpecs.some((ns: any) => ns.id === os.id));

  addedSpecs.forEach((s: any) => {
    changes.push({ description: `Adicionou Especialização: ${s.name}`, xpChange: -3 });
  });
  removedSpecs.forEach((s: any) => {
    changes.push({ description: `Removeu Especialização: ${s.name}`, xpChange: 3 });
  });

  // F. Comparar Potência de Sangue (Novo Nível * 10)
  if (oldBuildState.blood_potency && newBuildState.blood_potency) {
    const oldVal = oldBuildState.blood_potency;
    const newVal = newBuildState.blood_potency;
    const oldXp = oldVal.xp || 0;
    const newXp = newVal.xp || 0;
    if (newXp > oldXp) {
      for (let lvl = (oldVal.base + oldXp) + 1; lvl <= (newVal.base + newXp); lvl++) {
        changes.push({ description: `Comprou Potência de Sangue ${lvl} com XP`, xpChange: -(lvl * 10) });
      }
    } else if (newXp < oldXp) {
      for (let lvl = (newVal.base + newXp) + 1; lvl <= (oldVal.base + oldXp); lvl++) {
        changes.push({ description: `Cancelou compra de Potência de Sangue ${lvl}`, xpChange: (lvl * 10) });
      }
    }
  }

  // G. Comparar Humanidade (Novo Nível * 10)
  if (oldBuildState.humanity && newBuildState.humanity) {
    const oldVal = oldBuildState.humanity;
    const newVal = newBuildState.humanity;
    const oldXp = oldVal.xp || 0;
    const newXp = newVal.xp || 0;
    if (newXp > oldXp) {
      for (let lvl = (oldVal.base + oldXp) + 1; lvl <= (newVal.base + newXp); lvl++) {
        changes.push({ description: `Comprou Humanidade ${lvl} com XP`, xpChange: -(lvl * 10) });
      }
    } else if (newXp < oldXp) {
      for (let lvl = (newVal.base + newXp) + 1; lvl <= (oldVal.base + oldXp); lvl++) {
        changes.push({ description: `Cancelou compra de Humanidade ${lvl}`, xpChange: (lvl * 10) });
      }
    }
  }

  // Inserir os lançamentos no banco de forma agrupada
  if (changes.length > 0) {
    await db.insert(xpLedgers).values(
      changes.map(c => ({
        characterId,
        description: c.description,
        xpChange: c.xpChange,
      }))
    );
  }
}


