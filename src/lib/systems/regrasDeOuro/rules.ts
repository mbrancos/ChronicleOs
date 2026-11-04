import {
  AnatomicalVitality,
  BodySectorId,
  PalavraChaveGrau,
  RegrasDeOuroSheetData,
  RegrasDeOuroTalentos,
  RegrasDeOuroVirtudes,
  SectorDamage
} from "../../../types/systems/regrasDeOuro";
import {
  ARCHETYPES_TABLE,
  INITIAL_ANATOMICAL_VITALITY,
  KEYWORD_MODIFIERS,
  PANIC_TABLE,
  VITAE_BY_GENERATION
} from "./constants";

export const VITAL_SECTORS: BodySectorId[] = ["cabeca", "pescoco", "torax"];

/**
 * Calcula o Campo Pessoal e os pontos de Virtudes a distribuir a partir dos Arquétipos de Natureza e Máscara.
 */
export function calculateArchetypeBonuses(natureza: string, mascara: string): { campoPessoal: number; pontosVirtudes: number } {
  const nat = ARCHETYPES_TABLE[natureza] || { campoPessoal: 2, virtudes: 3 };
  const mas = ARCHETYPES_TABLE[mascara] || { campoPessoal: 2, virtudes: 3 };
  return {
    campoPessoal: Math.min(10, Math.max(1, nat.campoPessoal + mas.campoPessoal)),
    pontosVirtudes: Math.max(0, nat.virtudes + mas.virtudes)
  };
}

/**
 * Calcula a Trilha de Iluminação inicial (Consciência + Autocontrole).
 */
export function calculateInitialTrilha(consciencia: number, autocontrole: number): number {
  return Math.min(10, Math.max(1, consciencia + autocontrole));
}

/**
 * Retorna o modificador numérico da Palavra-Chave na parada de teste (-2 a +4).
 */
export function getKeywordModifier(grau: PalavraChaveGrau): number {
  return KEYWORD_MODIFIERS[grau]?.modifier ?? 0;
}

/**
 * Calcula a penalidade de um setor com base nas caixas preenchidas.
 * Caixas normais/letais dão -1, -2, -3. O esgotamento de caixas letais/agravadas gera incapacitação (-99).
 */
export function calculateSectorPenalty(sector: SectorDamage): number {
  const totalDamage = sector.normal + sector.letal + sector.agravado;
  const totalCapacity = sector.maxNormal + sector.maxLetal + sector.maxAgravado;

  if (totalDamage >= totalCapacity || sector.agravado >= sector.maxAgravado) {
    return -99; // Incapacitado
  }

  // Se tiver sofrido danos graves, penaliza conforme severidade
  if (sector.agravado > 0 || sector.letal >= 2) {
    return -3;
  }
  if (sector.letal > 0 || sector.normal >= 3) {
    return -2;
  }
  if (sector.normal >= 1) {
    return -1;
  }
  return 0;
}

/**
 * Atualiza todas as penalidades da silhueta, propagando a pior penalidade de partes vitais (cabeça, pescoço, tórax) para o corpo inteiro.
 */
export function refreshAllPenalties(vitality: AnatomicalVitality): AnatomicalVitality {
  const updated: AnatomicalVitality = JSON.parse(JSON.stringify(vitality));

  // 1. Calcula penalidade local de cada membro
  for (const key of Object.keys(updated) as BodySectorId[]) {
    updated[key].penalty = calculateSectorPenalty(updated[key]);
  }

  // 2. Acha a pior penalidade entre as partes vitais
  let worstVitalPenalty = 0;
  for (const vSec of VITAL_SECTORS) {
    const pen = updated[vSec].penalty;
    if (pen === -99) {
      worstVitalPenalty = -99;
      break;
    }
    if (pen < worstVitalPenalty) {
      worstVitalPenalty = pen;
    }
  }

  // 3. Propaga a penalidade vital para todo o corpo
  if (worstVitalPenalty !== 0) {
    for (const key of Object.keys(updated) as BodySectorId[]) {
      if (worstVitalPenalty === -99) {
        updated[key].penalty = -99;
      } else if (updated[key].penalty > worstVitalPenalty) {
        updated[key].penalty = worstVitalPenalty;
      }
    }
  }

  return updated;
}

/**
 * Aplica dano a um dos 9 setores com transbordamento automático (Normal -> Letal -> Agravado).
 */
export function applyAnatomicalDamage(
  vitality: AnatomicalVitality,
  sectorId: BodySectorId,
  damageType: "normal" | "letal" | "agravado",
  amount: number
): AnatomicalVitality {
  if (amount <= 0) return vitality;
  const result: AnatomicalVitality = JSON.parse(JSON.stringify(vitality));
  const sector = result[sectorId];

  let remaining = amount;

  if (damageType === "normal") {
    const availableNormal = Math.max(0, sector.maxNormal - sector.normal);
    const fillNormal = Math.min(availableNormal, remaining);
    sector.normal += fillNormal;
    remaining -= fillNormal;

    // Transborda para letal
    if (remaining > 0) {
      const availableLetal = Math.max(0, sector.maxLetal - sector.letal);
      const fillLetal = Math.min(availableLetal, remaining);
      sector.letal += fillLetal;
      remaining -= fillLetal;
    }

    // Transborda para agravado
    if (remaining > 0) {
      sector.agravado = Math.min(sector.maxAgravado, sector.agravado + remaining);
    }
  } else if (damageType === "letal") {
    const availableLetal = Math.max(0, sector.maxLetal - sector.letal);
    const fillLetal = Math.min(availableLetal, remaining);
    sector.letal += fillLetal;
    remaining -= fillLetal;

    // Transborda para agravado
    if (remaining > 0) {
      sector.agravado = Math.min(sector.maxAgravado, sector.agravado + remaining);
    }
  } else if (damageType === "agravado") {
    sector.agravado = Math.min(sector.maxAgravado, sector.agravado + remaining);
  }

  return refreshAllPenalties(result);
}

/**
 * Cura ferimentos no setor indicado e recalcula o custo em Vitæ.
 */
export function healSectorDamage(
  vitality: AnatomicalVitality,
  sectorId: BodySectorId,
  healType: "normal_all" | "letal_one" | "agravado_one"
): { vitality: AnatomicalVitality; vitaeCost: number } {
  const result: AnatomicalVitality = JSON.parse(JSON.stringify(vitality));
  const sector = result[sectorId];
  let vitaeCost = 0;

  if (healType === "normal_all" && sector.normal > 0) {
    sector.normal = 0;
    vitaeCost = 1; // 1 Vitæ limpa todo dano normal daquele setor
  } else if (healType === "letal_one" && sector.letal > 0) {
    sector.letal -= 1;
    vitaeCost = 1; // 1 Vitæ por ponto letal
  } else if (healType === "agravado_one" && sector.agravado > 0) {
    sector.agravado -= 1;
    vitaeCost = 1; // 1 Vitæ por ponto agravado
  }

  return {
    vitality: refreshAllPenalties(result),
    vitaeCost
  };
}

/**
 * Tabela matemática oficial de cálculo de custo em XP (Página 108).
 */
export function calculateXpCost(
  trait:
    | "talento"
    | "trilha"
    | "virtude"
    | "campo_pessoal"
    | "disciplina_nova"
    | "disciplina_nivel"
    | "palavra_chave_upgrade"
    | "paixao"
    | "paixao_obscura"
    | "flagelo",
  targetLevel: number,
  generation: number,
  isClanDiscipline: boolean = false,
  palavraChaveGrau?: PalavraChaveGrau,
  flageloBaseCost?: number,
  conscienciaLevel?: number
): number {
  switch (trait) {
    case "talento":
      // 8 + nível a se comprar
      return 8 + targetLevel;

    case "trilha":
      // 10 - nível de Consciência
      return Math.max(1, 10 - (conscienciaLevel ?? 1));

    case "virtude":
      // 4 + nível a se comprar
      return 4 + targetLevel;

    case "campo_pessoal":
      // 8 + nível a se comprar
      return 8 + targetLevel;

    case "disciplina_nova": {
      // Geração do vampiro em pontos (com bônus de clã de 2 gerações mais antigo)
      const effectiveGen = isClanDiscipline ? Math.max(4, generation - 2) : generation;
      return effectiveGen;
    }

    case "disciplina_nivel": {
      // nível atual x Geração do vampiro (com clã calculando 2 gerações mais antigo)
      const currentLevel = Math.max(1, targetLevel - 1);
      const effectiveGen = isClanDiscipline ? Math.max(4, generation - 2) : generation;
      return currentLevel * effectiveGen;
    }

    case "palavra_chave_upgrade": {
      if (!palavraChaveGrau) return 10;
      return KEYWORD_MODIFIERS[palavraChaveGrau]?.xpCostUpgrade ?? 10;
    }

    case "paixao":
    case "paixao_obscura":
      return targetLevel + 8;

    case "flagelo":
      return (flageloBaseCost ?? 1) + 8;

    default:
      return 10;
  }
}

/**
 * Consulta o efeito de Pânico em função da rolagem d10 + Emocional.
 */
export function getPanicResult(d10Roll: number, emocional: number) {
  const score = d10Roll + emocional;
  const match = PANIC_TABLE.find((entry) => score >= entry.minRoll);
  return match || PANIC_TABLE[PANIC_TABLE.length - 1];
}

/**
 * Cria o esqueleto padrão completo de uma nova ficha em Regras de Ouro 2.0.
 */
export function createInitialRegrasDeOuroSheet(profile?: {
  name?: string;
  concept?: string;
  cla?: string;
  etaria?: "neonato" | "neofito" | "ancilla";
  natureza?: string;
  mascara?: string;
  geracao?: number;
}): RegrasDeOuroSheetData {
  const etaria = profile?.etaria || "neonato";
  const natureza = profile?.natureza || "Sobrevivente";
  const mascara = profile?.mascara || "Solitário";
  const cla = profile?.cla || "Brujah";
  const geracao = profile?.geracao || 13;

  const { campoPessoal } = calculateArchetypeBonuses(natureza, mascara);

  const initialVirtudes: RegrasDeOuroVirtudes = {
    consciencia: 2,
    autocontrole: 2,
    coragem: 2
  };

  const initialTrilha = calculateInitialTrilha(initialVirtudes.consciencia, initialVirtudes.autocontrole);
  const vitaeConfig = VITAE_BY_GENERATION[geracao] || { maxVitae: 10, spendPerTurn: 1 };

  const initialTalentos: RegrasDeOuroTalentos = {
    forca: 1,
    vigor: 1,
    agilidade: 1,
    destreza: 1,
    aparencia: 1,
    social: 1,
    emocional: 1,
    espacial: 1,
    logica: 1,
    linguistica: 1,
    musical: 1,
    naturalista: 1
  };

  return {
    systemId: "regras_de_ouro",
    etaria,
    natureza,
    mascara,
    cla,
    geracao,
    campoPessoal,
    trilha: {
      nome: "Via Humanitatis",
      nivel: initialTrilha
    },
    virtudes: initialVirtudes,
    talentos: initialTalentos,
    palavrasChave: [
      { id: "pk1", nome: "Combate", grau: "bom" },
      { id: "pk2", nome: "Sobrevivência", grau: "bom" },
      { id: "pk3", nome: "Furtividade", grau: "otimo" }
    ],
    disciplinas: [],
    vitalidade: JSON.parse(JSON.stringify(INITIAL_ANATOMICAL_VITALITY)),
    vitae: {
      atual: vitaeConfig.maxVitae,
      maximo: vitaeConfig.maxVitae,
      gastoPorTurno: vitaeConfig.spendPerTurn
    },
    paixoes: [
      { id: "p1", nome: "Sobreviver à noite", nivel: 3 }
    ],
    vantagens: [],
    desvantagens: [],
    peculiaridades: [],
    besta: {
      angstia: 3,
      libido: 1,
      paixoesObscuras: [
        { id: "po1", nome: "Fúria destrutiva", nivel: 2 }
      ],
      flagelos: [],
      xpBesta: { total: 0, gasto: 0 }
    },
    inventory: [],
    notes: ""
  };
}
