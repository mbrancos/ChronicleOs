"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { 
  CharacterSheetData, 
  Specialty, 
  Discipline, 
  Advantage, 
  RollMacro,
  CharacterSkills,
  DEFAULT_CHARACTER_DATA,
  getMaxHealth,
  getMaxWillpower,
  getPredatorSlug,
  PREDATOR_TYPES,
  DISCIPLINE_KEY_TO_NAME,
  PredatorSelections,
  AcquiredPower
} from "@/types/character";
import Link from "next/link";
import DotSlider from "@/components/sheet/DotSlider";
import DamageTracker from "@/components/sheet/DamageTracker";
import HumanityTracker from "@/components/sheet/HumanityTracker";
import { useAutosave } from "@/hooks/useAutosave";
import { updateCharacterSheet, getCharacterXpLedger, narratorOverrideSheetAction } from "@/app/actions/characterActions";
import { spendCharacterXpAction } from "@/app/actions/xpActions";
import { rollRouseCheck } from "@/lib/vtt/BloodEngine";
import InlineEdit from "@/components/sheet/InlineEdit";
import BloodPanel from "@/components/sheet/BloodPanel";
import InventoryManager from "@/components/sheet/InventoryManager";
import ConvictionsPanel from "@/components/sheet/ConvictionsPanel";
import { useToast } from "@/context/ToastContext";

const CLAN_OPTIONS = [
  "Banu Haqim",
  "Brujah",
  "Gangrel",
  "Hecata",
  "Lasombra",
  "Malkaviano",
  "Ministério",
  "Nosferatu",
  "Ravnos",
  "Salubri",
  "Toreador",
  "Tremere",
  "Tzimisce",
  "Ventrue",
  "Caitiff",
  "Sem Clã"
];

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

const CLAN_BANE_MAPPING: Record<string, string> = {
  "Banu Haqim": "Vício de Sangue: Quando o Banu Haqim prova o sangue de outro vampiro, corre o risco de entrar em frenesi de fome para consumi-lo por completo.",
  "Brujah": "Ira Violenta: Dificuldade aumentada para resistir ao Frenesi de Fúria.",
  "Gangrel": "Características Bestiais: Adquire traços animais temporários após um frenesi.",
  "Hecata": "O Beijo Doloroso: O Beijo do Hecata causa dor física terrível ao invés de êxtase em mortais.",
  "Lasombra": "Distorção da Imagem: Sua imagem em espelhos, câmeras e telas digitais é distorcida e possui falhas de funcionamento com tecnologias modernas.",
  "Malkaviano": "Delírio: Sofre de perturbações mentais ativas sob tensão.",
  "Malkavian": "Delírio: Sofre de perturbações mentais ativas sob tensão.",
  "Ministério": "Aversão à Luz: Recebe dano agravado extra sob a luz solar e sofre penalidades em áreas muito iluminadas.",
  "Nosferatu": "Aparência Repulsiva: Aparência monstruosa e deformada impossível de ocultar sem poderes.",
  "Ravnos": "Destino Condenado: Deve estar em constante movimento. Sofrerá danos se dormir no mesmo local por mais de uma noite.",
  "Salubri": "O Terceiro Olho: Possui um terceiro olho na testa que se abre e sangra ao usar poderes, e seu sangue é extremamente desejado por outros vampiros.",
  "Toreador": "Obsessão Estética: Distrai-se e fica paralisado diante de beleza extraordinária.",
  "Tremere": "Maldição do Sangue: Não podem criar laços de sangue normais com outros mortais/cainitas facilmente.",
  "Tzimisce": "Apego Territorial: Deve dormir cercado por terra de um lugar de importância pessoal (como terra de seu país natal).",
  "Ventrue": "Paladar Seletivo: Só conseguem se alimentar de um tipo específico de presa escolhido.",
  "Caitiff": "Sem Clã: Não possuem uma maldição de clã específica, mas pagam mais XP por disciplinas.",
  "Sem Clã": "Sem Clã: Sem maldição específica."
};

const PREDATOR_OPTIONS = [
  "Ladrão de Sangue",
  "Gato de Beco",
  "Cutelo",
  "Consensualista",
  "Fazendeiro",
  "Osíris",
  "Sandman",
  "Rainha da Cena",
  "Sereia"
];

// Dicionário de tradução de nomes técnicos para exibição
const TECHNICAL_NAMES: Record<string, string> = {
  // Atributos
  strength: "Força", dexterity: "Destreza", stamina: "Vigor",
  charisma: "Carisma", manipulation: "Manipulação", composure: "Autocontrole",
  intelligence: "Inteligência", wits: "Raciocínio", resolve: "Determinação",
  // Habilidades Físicas
  athletics: "Atletismo", brawl: "Briga", craft: "Ofícios", drive: "Condução",
  firearms: "Armas de Fogo", melee: "Armas Brancas", larceny: "Ladroagem",
  stealth: "Furtividade", survival: "Sobrevivência",
  // Habilidades Sociais
  animal_ken: "Empatia com Animais", etiquette: "Etiqueta", insight: "Sagacidade",
  intimidation: "Intimidação", leadership: "Liderança", performance: "Performance",
  persuasion: "Persuasão", streetwise: "Manha", subterfuge: "Subterfúgio",
  // Habilidades Mentais
  academics: "Erudição", awareness: "Percepção", finance: "Finanças",
  investigation: "Investigação", medicine: "Medicina", occult: "Ocultismo",
  politics: "Política", science: "Ciência", technology: "Tecnologia"
};

// Helper de mesclagem recursiva para garantir resiliência da ficha contra dados parciais no banco
function deepMerge<T extends object>(target: T, source: any): T {
  if (!source || typeof source !== "object") return target;
  const output = { ...target };
  Object.keys(target).forEach((key) => {
    const targetVal = (target as any)[key];
    const sourceVal = source[key];
    if (sourceVal === undefined) return;
    
    if (targetVal && typeof targetVal === "object" && !Array.isArray(targetVal)) {
      (output as any)[key] = deepMerge(targetVal, sourceVal);
    } else {
      (output as any)[key] = sourceVal;
    }
  });
  return output;
}

// Helper para gerar IDs aleatórios únicos e evitar Math.random no escopo do componente
function generateRandomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const V5_RECOMMENDED_MACROS: RollMacro[] = [
  { id: "preset_melee", name: "🗡️ Ataque Corpo a Corpo", pool: ["strength", "brawl"], rouse_check: false },
  { id: "preset_firearms", name: "🎯 Tiro de Precisão", pool: ["dexterity", "firearms"], rouse_check: false },
  { id: "preset_dodge", name: "🏃 Esquiva & Evasão", pool: ["dexterity", "athletics"], rouse_check: false },
  { id: "preset_perception", name: "👁️ Percepção Aguçada", pool: ["wits", "awareness"], rouse_check: false },
  { id: "preset_stealth", name: "👤 Furtividade", pool: ["dexterity", "stealth"], rouse_check: false },
];

// Simulador fora do escopo do componente para evitar funções impuras (Math.random) no render
function executeSimulationRoll(
  macro: RollMacro,
  character: CharacterSheetData
) {
  let poolSize = 0;
  
  const physical = character.attributes.physical as unknown as Record<string, number>;
  const social = character.attributes.social as unknown as Record<string, number>;
  const mental = character.attributes.mental as unknown as Record<string, number>;
  const skills = character.skills as unknown as Record<string, number>;

  macro.pool.forEach(key => {
    if (physical[key] !== undefined) {
      poolSize += physical[key];
    } else if (social[key] !== undefined) {
      poolSize += social[key];
    } else if (mental[key] !== undefined) {
      poolSize += mental[key];
    } else if (skills[key] !== undefined) {
      poolSize += skills[key];
    } else if (character.disciplines) {
      const disc = character.disciplines.find(
        d => d.id === key || d.name.toLowerCase() === key.toLowerCase() || DISCIPLINE_KEY_TO_NAME[key]?.toLowerCase() === d.name.toLowerCase()
      );
      if (disc) {
        poolSize += disc.level;
      }
    }
  });

  if (poolSize === 0) poolSize = 1;

  const hunger = character.status.hunger;
  const hungerDiceCount = Math.min(poolSize, hunger);
  const normalDiceCount = poolSize - hungerDiceCount;

  const diceList: { type: "normal" | "hunger"; value: number }[] = [];
  
  for (let i = 0; i < normalDiceCount; i++) {
    diceList.push({ type: "normal", value: Math.floor(Math.random() * 10) + 1 });
  }
  for (let i = 0; i < hungerDiceCount; i++) {
    diceList.push({ type: "hunger", value: Math.floor(Math.random() * 10) + 1 });
  }

  const normalSuccesses = diceList.filter(d => d.value >= 6).length;
  const normalTens = diceList.filter(d => d.type === "normal" && d.value === 10).length;
  const hungerTens = diceList.filter(d => d.type === "hunger" && d.value === 10).length;
  const totalTens = normalTens + hungerTens;

  const criticalPairs = Math.floor(totalTens / 2);
  const extraSuccesses = criticalPairs * 2;
  const successes = normalSuccesses + extraSuccesses;

  const isCritical = criticalPairs > 0;
  const isMessianic = isCritical && hungerTens > 0;
  const isBestialFailure = diceList.some(d => d.type === "hunger" && d.value === 1) && successes === 0;

  let rouseText = "";
  let shouldIncreaseHunger = false;
  if (macro.rouse_check) {
    const rouseResult = Math.floor(Math.random() * 10) + 1;
    
    if (rouseResult < 6) {
      rouseText = " [Despertar: Falhou (Fome +1)]";
      shouldIncreaseHunger = true;
    } else {
      rouseText = " [Despertar: Sucesso]";
    }
  }

  return {
    macroName: macro.name + rouseText,
    totalPool: poolSize,
    successes,
    isCritical,
    isMessianic,
    isBestial: isBestialFailure,
    diceList,
    shouldIncreaseHunger
  };
}

const POWER_LEVEL_OPTIONS = ["Cria", "Neófito", "Ancila"];

const PREDATOR_SPECIALTY_MAP: Record<string, { skill: keyof CharacterSkills; name: string }[]> = {
  "Sandman": [{ skill: "medicine", name: "Anestésicos" }, { skill: "stealth", name: "Invasão" }],
  "Gato de Beco": [{ skill: "brawl", name: "Agarrão" }, { skill: "intimidation", name: "Briga de Rua" }],
  "Consensualista": [{ skill: "medicine", name: "Coleta de Sangue" }, { skill: "persuasion", name: "Vitimização" }],
  "Ladrão de Sangue": [{ skill: "larceny", name: "Arrombamento" }, { skill: "streetwise", name: "Mercado Negro" }],
  "Cutelo": [{ skill: "persuasion", name: "Manipulação" }, { skill: "subterfuge", name: "Vida Dupla" }],
  "Fazendeiro": [{ skill: "animal_ken", name: "Cães" }, { skill: "survival", name: "Caça" }],
  "Osíris": [{ skill: "occult", name: "Rituais" }, { skill: "performance", name: "Atuação" }],
  "Rainha da Cena": [{ skill: "etiquette", name: "Cena Noturna" }, { skill: "streetwise", name: "Cena Noturna" }],
  "Sereia": [{ skill: "persuasion", name: "Sedução" }, { skill: "subterfuge", name: "Sedução" }],
  "Sanguessuga": [{ skill: "brawl", name: "Vampiros" }, { skill: "stealth", name: "Rastrear Vampiros" }],
};

const DISCIPLINE_OPTIONS = [
  "Animalismo",
  "Auspício",
  "Dominação",
  "Feitiçaria de Sangue",
  "Fortitude",
  "Metamorfose",
  "Oblivion",
  "Ofuscação",
  "Potência",
  "Presença",
  "Rapidez",
  "Alquimia de Sangue-Ralo"
];

const V5_ADVANTAGES_PRESETS = {
  merit: [
    "Aparência Impressionante",
    "Belo",
    "Linguística",
    "Sentidos Aguçados",
    "Resiliente",
    "Olhos de Gato",
    "Voz Cativante"
  ],
  background: [
    "Recursos",
    "Refúgio",
    "Aliados",
    "Contatos",
    "Status (Camarilla)",
    "Status (Anarquistas)",
    "Domínio",
    "Influência",
    "Massa de Sangue (Herd)"
  ],
  flaw: [
    "Feio",
    "Vício",
    "Inimigo",
    "Refúgio Assombrado",
    "Segredo Sombrio",
    "Estigma de Clã",
    "Estômago Fraco",
    "Analfabeto",
    "Proscrito"
  ],
  loresheet: [
    "Linhagem de Sangue",
    "Conhecimento da Seita",
    "Segredos Gehenna",
    "Lenda Urbana"
  ]
};

function getPowerLevelRules(concept: string) {
  const normalized = String(concept).toLowerCase().trim();
  if (normalized === "cria" || normalized === "fledgling") {
    return { name: "Cria", disciplines: 2, advantages: 7, bloodPotency: 0, maxDiscLevelInCreation: 2 };
  }
  if (normalized === "ancila" || normalized === "ancillae") {
    return { name: "Ancila", disciplines: 5, advantages: 9, bloodPotency: 2, maxDiscLevelInCreation: 3 };
  }
  // Padrão: Neófito / Neonate
  return { name: "Neófito", disciplines: 3, advantages: 7, bloodPotency: 1, maxDiscLevelInCreation: 2 };
}

function calculateBaseAndXp(charData: CharacterSheetData) {
  const clan = charData.profile?.clan || "Sem Clã";
  const clanDisciplines = CLAN_DISCIPLINE_MAPPING[clan] || [];
  const isCaitiffOrThin = clan === "Caitiff" || clan === "Sem Clã" || clan === "Sangue-Ralo";
  const rules = getPowerLevelRules(charData.profile?.concept || "Neófito");

  const predatorSlug = getPredatorSlug(charData.profile?.predator_type || "");
  const chosenDiscId = charData.predatorSelections?.chosenDiscipline;

  // --- ATRIBUTOS ---
  const allAttrs: { key: string; val: number }[] = [];
  if (charData.attributes) {
    if (charData.attributes.physical) {
      Object.entries(charData.attributes.physical).forEach(([k, v]) => allAttrs.push({ key: k, val: Number(v) || 1 }));
    }
    if (charData.attributes.social) {
      Object.entries(charData.attributes.social).forEach(([k, v]) => allAttrs.push({ key: k, val: Number(v) || 1 }));
    }
    if (charData.attributes.mental) {
      Object.entries(charData.attributes.mental).forEach(([k, v]) => allAttrs.push({ key: k, val: Number(v) || 1 }));
    }
  }
  // Ordenar de forma decrescente
  allAttrs.sort((a, b) => b.val - a.val);

  const idealAttrs = [4, 3, 3, 3, 2, 2, 2, 2, 1];
  const attributesBase: Record<string, number> = {};
  let attributeXpSpent = 0;

  allAttrs.forEach((attr, idx) => {
    const idealVal = idealAttrs[idx] || 1;
    const currentVal = attr.val;
    if (currentVal >= idealVal) {
      attributesBase[attr.key] = idealVal;
      for (let lvl = idealVal + 1; lvl <= currentVal; lvl++) {
        attributeXpSpent += lvl * 5;
      }
    } else {
      attributesBase[attr.key] = currentVal;
    }
  });

  // --- HABILIDADES ---
  const allSkills: { key: string; val: number }[] = [];
  if (charData.skills) {
    Object.entries(charData.skills).forEach(([k, v]) => {
      allSkills.push({ key: k, val: Number(v) || 0 });
    });
  }
  allSkills.sort((a, b) => b.val - a.val);

  const idealSkills = [4, 3, 3, 3, 2, 2, 2, 1, 1, 1];
  const skillsBase: Record<string, number> = {};
  let skillXpSpent = 0;

  allSkills.forEach((skill, idx) => {
    const idealVal = idealSkills[idx] || 0;
    const currentVal = skill.val;
    if (currentVal >= idealVal) {
      skillsBase[skill.key] = idealVal;
      for (let lvl = idealVal + 1; lvl <= currentVal; lvl++) {
        skillXpSpent += lvl * 3;
      }
    } else {
      skillsBase[skill.key] = currentVal;
    }
  });

  // --- DISCIPLINAS ---
  // Criar cópia rasa clonando os objetos de disciplinas
  const disciplinesList = charData.disciplines ? charData.disciplines.map(d => ({ ...d })) : [];
  
  if (predatorSlug && chosenDiscId) {
    const chosenDiscName = DISCIPLINE_KEY_TO_NAME[chosenDiscId];
    if (chosenDiscName) {
      const targetDisc = disciplinesList.find(d => 
        d.name.toLowerCase().includes(chosenDiscName.toLowerCase()) || 
        chosenDiscName.toLowerCase().includes(d.name.toLowerCase())
      );
      if (targetDisc && targetDisc.level > 0) {
        targetDisc.level -= 1;
      }
    }
  }

  const activeDiscs = disciplinesList.filter(d => d.level > 0);
  const sortedDiscs = [...activeDiscs].sort((a, b) => b.level - a.level);

  let remainingCreationDots = rules.disciplines;
  const maxBasePerDisc = rules.maxDiscLevelInCreation || (rules.disciplines === 5 ? 3 : 2);
  const disciplinesBase: Record<string, number> = {};
  let disciplineXpSpent = 0;

  sortedDiscs.forEach((disc) => {
    const isClanDisc = clanDisciplines.some(d => disc.name.toLowerCase().includes(d.split(" ")[0].toLowerCase()));
    
    let costMultiplier = 7;
    if (isCaitiffOrThin) {
      costMultiplier = 6;
    } else if (isClanDisc) {
      costMultiplier = 5;
    }

    const currentVal = disc.level;
    const baseAllocated = Math.min(currentVal, maxBasePerDisc, remainingCreationDots);
    disciplinesBase[disc.id] = baseAllocated;
    remainingCreationDots -= baseAllocated;

    for (let lvl = baseAllocated + 1; lvl <= currentVal; lvl++) {
      disciplineXpSpent += lvl * costMultiplier;
    }
  });

  // O disciplinesBase contém puramente a cota alocada dos pontos da criação (vermelhos)
  // O ponto bônus do predador (roxa) é mantido separado para não queimar o contador da criação base

  // --- VANTAGENS ---
  const positiveAdvantages = (charData.advantages || []).filter(
    a => a.type === "background" || a.type === "merit" || a.type === "loresheet"
  );
  const totalPositivePoints = positiveAdvantages.reduce((acc, a) => acc + a.level, 0);
  
  let advantagesXpSpent = 0;
  if (totalPositivePoints > rules.advantages) {
    advantagesXpSpent = (totalPositivePoints - rules.advantages) * 3;
  }

  // --- ESPECIALIZAÇÕES ---
  const predatorFreeSpec = predatorSlug ? 1 : 0;
  const freeSpecs = 1 + predatorFreeSpec;
  const totalSpecsCount = charData.specialties ? charData.specialties.length : 0;
  let specialtiesXpSpent = 0;
  if (totalSpecsCount > freeSpecs) {
    specialtiesXpSpent = (totalSpecsCount - freeSpecs) * 3;
  }

  const specialtiesBase: Record<string, boolean> = {};
  if (charData.specialties) {
    charData.specialties.forEach((spec, idx) => {
      specialtiesBase[spec.id] = idx < freeSpecs;
    });
  }

  // --- POTÊNCIA DE SANGUE ---
  const baseBloodPotency = rules.bloodPotency;
  const currentBloodPotency = charData.status?.blood_potency || baseBloodPotency;
  let bloodPotencyXpSpent = 0;
  if (currentBloodPotency > baseBloodPotency) {
    for (let lvl = baseBloodPotency + 1; lvl <= currentBloodPotency; lvl++) {
      bloodPotencyXpSpent += lvl * 10;
    }
  }

  // --- HUMANIDADE ---
  const currentHumanity = charData.status?.humanity || 7;
  let humanityXpSpent = 0;
  if (currentHumanity > 7) {
    for (let lvl = 8; lvl <= currentHumanity; lvl++) {
      humanityXpSpent += lvl * 10;
    }
  }

  const totalSpentXp = 
    attributeXpSpent + 
    skillXpSpent + 
    disciplineXpSpent + 
    advantagesXpSpent + 
    specialtiesXpSpent + 
    bloodPotencyXpSpent + 
    humanityXpSpent;

  const attrSumDistributed = Object.values(attributesBase).reduce((acc, v) => acc + v, 0);
  const skillSumDistributed = Object.values(skillsBase).reduce((acc, v) => acc + v, 0);
  const discSumDistributed = Object.values(disciplinesBase).reduce((acc, v) => acc + v, 0);

  const attributesRemaining = Math.max(0, 22 - attrSumDistributed);
  const skillsRemaining = Math.max(0, 20 - skillSumDistributed);
  const disciplinesRemaining = Math.max(0, rules.disciplines - discSumDistributed);
  const advantagesRemaining = Math.max(0, rules.advantages - totalPositivePoints);

  const isDraft = 
    attributesRemaining > 0 || 
    skillsRemaining > 0 || 
    disciplinesRemaining > 0 || 
    advantagesRemaining > 0;

  return {
    totalSpentXp,
    attributesBase,
    skillsBase,
    disciplinesBase,
    specialtiesBase,
    attributesRemaining,
    skillsRemaining,
    disciplinesRemaining,
    advantagesRemaining,
    isDraft
  };
}

interface CharacterSheetClientProps {
  characterId: string;
  campaignId: string | null;
  initialData: CharacterSheetData | null;
  initialName?: string;
  onDataChange?: (data: CharacterSheetData) => void;
  dicePool?: Array<{ id: string, label: string, value: number }>;
  onTraitClick?: (trait: { id: string, label: string, value: number }) => void;
  initialStatus?: "DRAFT" | "READY" | "IN_PLAY";
  initialBuildState?: any;
  characterType?: "jogador" | "npc" | "coterie";
  isStoryteller?: boolean;
  chronicle?: any;
  hideBackToHub?: boolean;
}

export default function CharacterSheetClient({
  characterId,
  campaignId,
  initialData,
  initialName = "",
  onDataChange,
  dicePool = [],
  onTraitClick,
  initialStatus = "DRAFT",
  initialBuildState = {},
  characterType = "jogador",
  isStoryteller = false,
  chronicle,
  hideBackToHub = false
}: CharacterSheetClientProps) {
  const { showSuccess, showWarning, showError } = useToast();

  const [activeAddPowerDiscId, setActiveAddPowerDiscId] = useState<string | null>(null);
  const [newPowerName, setNewPowerName] = useState("");
  const [newPowerLevel, setNewPowerLevel] = useState<number>(1);
  const [showV5Guide, setShowV5Guide] = useState(false);
  
  // ESTADO LOCAL DA FICHA (Mescla com os dados padrão se for novo personagem no banco)
  const [character, setCharacter] = useState<CharacterSheetData>(() => {
    const baseData = initialData ? deepMerge(DEFAULT_CHARACTER_DATA, initialData) : { ...DEFAULT_CHARACTER_DATA };
    if (baseData.profile) {
      // Sincronizar o nome público da tabela no profile do JSONB
      if (!baseData.profile.name || baseData.profile.name === "Novo Vampiro") {
        baseData.profile.name = initialName || baseData.profile.name || "Novo Vampiro";
      }
    }
    return baseData;
  });

  const [status, setStatus] = useState<"DRAFT" | "READY" | "IN_PLAY">(initialStatus);
  const [buildState, setBuildState] = useState<any>(initialBuildState);

  // Estados para Modal de Avatar (Foto de Perfil)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [avatarImageError, setAvatarImageError] = useState(false);

  // Estado para Scrollspy de Navegação Fixa (Aba Ativa)
  const [activeTabId, setActiveTabId] = useState<string>("atributos");

  useEffect(() => {
    const sectionIds = ["atributos", "habilidades", "disciplinas", "conviccoes", "vantagens", "inventario", "macros", "xp_diary"];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 130;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveTabId(sectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Histórico de transações de XP
  const [xpLedger, setXpLedger] = useState<any[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  const xpBalance = xpLedger.reduce((sum, item) => sum + (item.xpChange || 0), 0);

  // Estados de Evolução de XP (Fase 25)
  const [isEvolvingMode, setIsEvolvingMode] = useState(false);
  const [isOverrideActive, setIsOverrideActive] = useState(false);

  const isReadOnly = status === "IN_PLAY" && !isOverrideActive;
  const isSheetDisabled = isReadOnly && !isEvolvingMode;
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
  const [evolutionTarget, setEvolutionTarget] = useState<{
    traitName: string;
    traitType: "attribute" | "skill" | "discipline" | "advantage" | "humanity" | "blood_potency";
    newLevel: number;
    currentValue: number;
    costXp: number;
  } | null>(null);
  const [evolutionJustification, setEvolutionJustification] = useState("");
  const [evolutionError, setEvolutionError] = useState<string | null>(null);
  const [evolutionLoading, setEvolutionLoading] = useState(false);

  const [prevWillpower, setPrevWillpower] = useState(initialData?.status?.willpower);

  // Sincronizar com mudanças de valor externas no render para evitar render em cascata
  if (initialData?.status?.willpower) {
    const newWill = initialData.status.willpower;
    if (
      !prevWillpower ||
      prevWillpower.superficial !== newWill.superficial ||
      prevWillpower.aggravated !== newWill.aggravated ||
      prevWillpower.max !== newWill.max
    ) {
      setPrevWillpower(newWill);
      setCharacter(prev => ({
        ...prev,
        status: {
          ...prev.status,
          willpower: newWill
        }
      }));
    }
  }

  // Rodar o cálculo do esqueleto base e XP a cada render/alteração
  const alloc = calculateBaseAndXp(character);
  const rules = getPowerLevelRules(character.profile?.concept || "Neófito");

  // Sincronizar o status calculado reativamente
  useEffect(() => {
    if (initialStatus === "IN_PLAY") {
      if (status !== "IN_PLAY") {
        setStatus("IN_PLAY");
      }
      return;
    }
    
    const calculatedStatus = alloc.isDraft ? "DRAFT" : "READY";
    if (status !== calculatedStatus) {
      setStatus(calculatedStatus);
    }
  }, [alloc.isDraft, initialStatus, status]);

  // Sincronizar o buildState calculado
  useEffect(() => {
    const rules = getPowerLevelRules(character.profile?.concept || "Neófito");
    const newBuildState = {
      attributes: {},
      skills: {},
      disciplines: {},
      advantages: {},
      specialties: character.specialties ? character.specialties.map(s => ({ id: s.id, name: s.name, skill: s.skill, isXp: !alloc.specialtiesBase[s.id] })) : [],
      blood_potency: { 
        base: rules.bloodPotency, 
        xp: (character.status?.blood_potency || rules.bloodPotency) > rules.bloodPotency 
          ? (character.status?.blood_potency || rules.bloodPotency) - rules.bloodPotency 
          : 0 
      },
      humanity: { base: 7, xp: (character.status?.humanity || 7) > 7 ? (character.status?.humanity || 7) - 7 : 0 }
    };
    
    // Preencher atributos
    Object.entries(character.attributes?.physical || {}).forEach(([key, val]) => {
      const base = alloc.attributesBase[key] || 1;
      (newBuildState.attributes as any)[key] = { base, xp: (val as number) - base };
    });
    Object.entries(character.attributes?.social || {}).forEach(([key, val]) => {
      const base = alloc.attributesBase[key] || 1;
      (newBuildState.attributes as any)[key] = { base, xp: (val as number) - base };
    });
    Object.entries(character.attributes?.mental || {}).forEach(([key, val]) => {
      const base = alloc.attributesBase[key] || 1;
      (newBuildState.attributes as any)[key] = { base, xp: (val as number) - base };
    });
    
    // Preencher habilidades
    Object.entries(character.skills || {}).forEach(([key, val]) => {
      const base = alloc.skillsBase[key] || 0;
      (newBuildState.skills as any)[key] = { base, xp: (val as number) - base };
    });
    
    // Preencher disciplinas
    character.disciplines.forEach(disc => {
      const base = alloc.disciplinesBase[disc.id] || 0;
      (newBuildState.disciplines as any)[disc.name] = { base, xp: disc.level - base };
    });
    
    // Preencher vantagens
    let currentPositiveSum = 0;
    character.advantages.forEach(adv => {
      const isPositive = adv.type === "background" || adv.type === "merit" || adv.type === "loresheet";
      if (isPositive) {
        currentPositiveSum += adv.level;
        if (currentPositiveSum > rules.advantages) {
          const excess = currentPositiveSum - rules.advantages;
          const base = adv.level - excess;
          (newBuildState.advantages as any)[adv.id] = { base: Math.max(0, base), xp: excess };
        } else {
          (newBuildState.advantages as any)[adv.id] = { base: adv.level, xp: 0 };
        }
      } else {
        (newBuildState.advantages as any)[adv.id] = { base: adv.level, xp: 0 };
      }
    });
    
    if (JSON.stringify(buildState) !== JSON.stringify(newBuildState)) {
      setBuildState(newBuildState);
    }
  }, [character, alloc, buildState]);

  // Carregar histórico de XP do banco ao abrir a aba "xp_diary"
  const fetchXpLedger = useCallback(async () => {
    setIsLoadingLedger(true);
    const res = await getCharacterXpLedger(characterId);
    if (res.success && res.data) {
      setXpLedger(res.data);
    }
    setIsLoadingLedger(false);
  }, [characterId, getCharacterXpLedger]);

  useEffect(() => {
    fetchXpLedger();
  }, [fetchXpLedger]);

  // ESTADOS DO MINI-FORMULÁRIO DE ESPECIALIZAÇÕES (ABA NÚCLEO)
  const [selectedSkill, setSelectedSkill] = useState<keyof CharacterSkills | "">("");
  const [newSpecialtyName, setNewSpecialtyName] = useState("");
  const [specialtySource, setSpecialtySource] = useState<string>("1ª Grátis");

  // ESTADOS DO GERENCIADOR DE MACROS (SEÇÃO 8)
  const [isCreatingMacro, setIsCreatingMacro] = useState(false);
  const [newMacroName, setNewMacroName] = useState("");
  const [selectedAttribute, setSelectedAttribute] = useState<string>("strength");
  const [selectedSkillOrDiscipline, setSelectedSkillOrDiscipline] = useState<string>("brawl");
  const [rouseCheckToggle, setRouseCheckToggle] = useState<boolean>(false);

  // Automação e Avanço de Cotas de Especialização
  useEffect(() => {
    if (status !== "DRAFT" || !character.skills) return;

    const has1st = (character.specialties || []).some(s => s.source === "1ª Grátis");
    const has2nd = (character.specialties || []).some(s => s.source === "2ª Grátis");
    const hasPred = (character.specialties || []).some(s => s.source === "Predador");

    // 1. Verificar se a cota atualmente selecionada está esgotada e avançar suavemente
    if (specialtySource === "1ª Grátis" && has1st) {
      if (!has2nd) {
        setSpecialtySource("2ª Grátis");
      } else if (!hasPred) {
        setSpecialtySource("Predador");
      } else {
        setSpecialtySource("Hab. 4");
      }
    } else if (specialtySource === "2ª Grátis" && has2nd) {
      if (!hasPred) {
        setSpecialtySource("Predador");
      } else {
        setSpecialtySource("Hab. 4");
      }
    } else if (specialtySource === "Predador" && hasPred) {
      setSpecialtySource("Hab. 4");
    }

    // 2. Verificar se existe alguma Habilidade com nível >= 4 sem especialização cadastrada
    const skillLevel4Entry = Object.entries(character.skills).find(([key, val]) => {
      if (Number(val) < 4) return false;
      const alreadyHasSpec = character.specialties?.some(s => s.skill === key && s.source === "Hab. 4");
      return !alreadyHasSpec;
    });

    if (skillLevel4Entry) {
      const [skillKey] = skillLevel4Entry;
      if (selectedSkill !== skillKey || specialtySource !== "Hab. 4") {
        setSelectedSkill(skillKey as keyof CharacterSkills);
        setSpecialtySource("Hab. 4");
      }
      return;
    }

    // 3. Se o jogador tiver um Predador selecionado e ainda não tiver cadastrado a especialização do Predador
    const predatorName = character.profile?.predator_type?.trim() || "";
    if (predatorName && PREDATOR_SPECIALTY_MAP[predatorName] && !hasPred) {
      const validChoice = PREDATOR_SPECIALTY_MAP[predatorName].find(opt => Number(character.skills[opt.skill]) >= 1);
      if (validChoice && (selectedSkill !== validChoice.skill || specialtySource !== "Predador")) {
        setSelectedSkill(validChoice.skill);
        setNewSpecialtyName(validChoice.name);
        setSpecialtySource("Predador");
      }
    }
  }, [character.skills, character.profile?.predator_type, character.specialties, status, specialtySource, selectedSkill]);
  
  // ESTADO DE SINCRONIZAÇÃO (Optimistic UI Autosave)
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const buildStateRef = useRef(buildState);
  const statusRef = useRef(status);

  useEffect(() => {
    buildStateRef.current = buildState;
  }, [buildState]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Sincronizar trilhas máximas de forma reativa quando atributos ou disciplinas mudam
  useEffect(() => {
    const computedMaxHealth = getMaxHealth(character);
    const computedMaxWillpower = getMaxWillpower(character);

    if (
      computedMaxHealth !== character.status.health.max ||
      computedMaxWillpower !== character.status.willpower.max
    ) {
      setCharacter((prev) => ({
        ...prev,
        status: {
          ...prev.status,
          health: {
            ...prev.status.health,
            max: computedMaxHealth,
          },
          willpower: {
            ...prev.status.willpower,
            max: computedMaxWillpower,
          },
        },
      }));
    }
  }, [
    character.attributes.physical.stamina,
    character.attributes.social.composure,
    character.attributes.mental.resolve,
    character.disciplines,
  ]);

  // CALLBACK DE SALVAMENTO DEBOUNCED
  const triggerSave = useCallback(async (dataToSave: CharacterSheetData) => {
    // Cancelar qualquer timer anterior de esconder o status de "Salvo"
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }
    
    setSyncStatus("saving");
    
    const response = isOverrideActive
      ? await narratorOverrideSheetAction(
          characterId,
          dataToSave,
          buildStateRef.current,
          statusRef.current,
          "Edição Divina: Alteração efetuada pelo Narrador"
        )
      : await updateCharacterSheet(characterId, dataToSave, buildStateRef.current, statusRef.current);
    
    if (response.success) {
      setSyncStatus("saved");
      // Esconder o indicador após 2 segundos
      savedTimerRef.current = setTimeout(() => {
        setSyncStatus("idle");
      }, 2000);
    } else {
      setSyncStatus("error");
    }
  }, [characterId, isOverrideActive]);

  // INVOCAR O HOOK DE AUTOSAVE DEBOUNCED (1000ms de delay)
  useAutosave(character, 1000, triggerSave);

  // Notificar pai sobre alterações do estado do personagem de forma segura sem loops infinitos
  const onDataChangeRef = useRef(onDataChange);
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    if (onDataChangeRef.current) {
      onDataChangeRef.current(character);
    }
  }, [character]);

  // ESTADO DO SIMULADOR DE DADOS
  const [rollResult, setRollResult] = useState<{
    macroName: string;
    totalPool: number;
    successes: number;
    isCritical: boolean;
    isMessianic: boolean;
    isBestial: boolean;
    diceList: { type: "normal" | "hunger"; value: number }[];
  } | null>(null);

  // Alterações de Atributos com interceptação de XP
  const handleAttributeChange = (category: "physical" | "social" | "mental", attrName: string, value: number) => {
    if (status === "IN_PLAY" && isEvolvingMode && !isOverrideActive) {
      const currentVal = Number((character.attributes[category] as any)[attrName]) || 1;
      if (value <= currentVal) {
        showWarning("No Modo de Evolução, você apenas pode aumentar características por XP.", "Modo de Evolução");
        return;
      }
      openEvolutionConfirmModal(attrName, "attribute", value, currentVal);
      return;
    }

    if (status === "DRAFT" && characterType !== "npc" && value >= 4) {
      const currentVal = Number((character.attributes[category] as any)[attrName]) || 1;
      if (value > currentVal) {
        const allAttrs: { key: string; val: number }[] = [];
        if (character.attributes.physical) {
          Object.entries(character.attributes.physical).forEach(([k, v]) => allAttrs.push({ key: k, val: Number(v) || 1 }));
        }
        if (character.attributes.social) {
          Object.entries(character.attributes.social).forEach(([k, v]) => allAttrs.push({ key: k, val: Number(v) || 1 }));
        }
        if (character.attributes.mental) {
          Object.entries(character.attributes.mental).forEach(([k, v]) => allAttrs.push({ key: k, val: Number(v) || 1 }));
        }

        const otherAttrsWith4OrMore = allAttrs.filter(a => a.key !== attrName && a.val >= 4);
        if (otherAttrsWith4OrMore.length > 0) {
          showWarning(
            "Regra V5 - Atributos: Na criação base, você só pode ter 1 Atributo em nível 4. Escolha um atributo em nível 1 ou 2 para receber seu último ponto!",
            "Cota de Atributos V5"
          );
          return;
        }
      }
    }

    setCharacter(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [category]: {
          ...prev.attributes[category],
          [attrName]: value
        }
      }
    }));
  };

  // Alterações de Habilidades com interceptação de XP
  const handleSkillChange = (skillName: keyof CharacterSkills, value: number) => {
    if (status === "IN_PLAY" && isEvolvingMode && !isOverrideActive) {
      const currentVal = Number(character.skills[skillName]) || 0;
      if (value <= currentVal) {
        showWarning("No Modo de Evolução, você apenas pode aumentar características por XP.", "Modo de Evolução");
        return;
      }
      openEvolutionConfirmModal(skillName, "skill", value, currentVal);
      return;
    }

    if (status === "DRAFT" && characterType !== "npc" && value >= 4) {
      const currentVal = Number(character.skills[skillName]) || 0;
      if (value > currentVal) {
        const allSkills: { key: string; val: number }[] = [];
        if (character.skills) {
          Object.entries(character.skills).forEach(([k, v]) => {
            allSkills.push({ key: k, val: Number(v) || 0 });
          });
        }

        const otherSkillsWith4OrMore = allSkills.filter(s => s.key !== skillName && s.val >= 4);
        if (otherSkillsWith4OrMore.length > 0) {
          showWarning(
            "Regra V5 - Habilidades: Na criação base, você só pode ter 1 Habilidade em nível 4. Escolha outra habilidade (em nível 1, 2 ou 3) para receber seus pontos!",
            "Cota de Habilidades V5"
          );
          return;
        }
      }
    }

    setCharacter(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillName]: value
      }
    }));
  };

  // Alterações específicas para Evolução por XP (Fase 25)
  const handleBloodPotencyChange = (val: number) => {
    if (status === "IN_PLAY" && !isOverrideActive) {
      if (isEvolvingMode) {
        const currentVal = character.status.blood_potency || 1;
        if (val <= currentVal) {
          showWarning("No Modo de Evolução, você apenas pode aumentar características por XP.", "Modo de Evolução");
          return;
        }
        openEvolutionConfirmModal("Potência de Sangue", "blood_potency", val, currentVal);
      }
      return;
    }

    setCharacter(prev => ({
      ...prev,
      status: { ...prev.status, blood_potency: val }
    }));
  };

  const handleHumanityChange = (val: number) => {
    if (status === "IN_PLAY" && !isOverrideActive) {
      if (isEvolvingMode) {
        const currentVal = character.status.humanity || 7;
        if (val <= currentVal) {
          showWarning("No Modo de Evolução, você apenas pode aumentar características por XP.", "Modo de Evolução");
          return;
        }
        openEvolutionConfirmModal("Humanidade", "humanity", val, currentVal);
      }
      return;
    }

    setCharacter(prev => ({
      ...prev,
      status: { ...prev.status, humanity: val }
    }));
  };

  const openEvolutionConfirmModal = (
    traitName: string,
    traitType: "attribute" | "skill" | "discipline" | "advantage" | "humanity" | "blood_potency",
    newLevel: number,
    currentValue: number
  ) => {
    let cost = 0;
    const clan = character.profile?.clan || "Sem Clã";
    const clanDisciplines = CLAN_DISCIPLINE_MAPPING[clan] || [];
    const isCaitiffOrThin = clan === "Caitiff" || clan === "Sem Clã" || clan === "Sangue-Ralo";

    if (traitType === "attribute") {
      for (let lvl = currentValue + 1; lvl <= newLevel; lvl++) {
        cost += lvl * 5;
      }
    } else if (traitType === "skill") {
      for (let lvl = currentValue + 1; lvl <= newLevel; lvl++) {
        cost += lvl * 3;
      }
    } else if (traitType === "discipline") {
      const isClanDisc = clanDisciplines.some(d => traitName.toLowerCase().includes(d.split(" ")[0].toLowerCase()));
      let costMultiplier = 7;
      if (isCaitiffOrThin) costMultiplier = 6;
      else if (isClanDisc) costMultiplier = 5;

      for (let lvl = currentValue + 1; lvl <= newLevel; lvl++) {
        cost += lvl * costMultiplier;
      }
    } else if (traitType === "advantage") {
      cost = (newLevel - currentValue) * 3;
    } else if (traitType === "humanity" || traitType === "blood_potency") {
      for (let lvl = currentValue + 1; lvl <= newLevel; lvl++) {
        cost += lvl * 10;
      }
    }

    setEvolutionTarget({
      traitName,
      traitType,
      newLevel,
      currentValue,
      costXp: cost,
    });
    setEvolutionJustification("");
    setEvolutionError(null);
    setIsEvolutionModalOpen(true);
  };

  const handleConfirmEvolution = async () => {
    if (!evolutionTarget) return;
    if (!evolutionJustification || evolutionJustification.trim().length < 15) {
      setEvolutionError("A justificativa deve ter pelo menos 15 caracteres.");
      return;
    }

    setEvolutionLoading(true);
    setEvolutionError(null);

    try {
      const res = await spendCharacterXpAction(
        characterId,
        evolutionTarget.traitName,
        evolutionTarget.traitType,
        evolutionTarget.newLevel,
        evolutionTarget.costXp,
        `Justificativa: ${evolutionJustification.trim()}`
      );

      if (res.success) {
        setIsEvolutionModalOpen(false);
        setIsEvolvingMode(false);
        
        // Atualizar estado local
        setCharacter(prev => {
          const newData = { ...prev };
          if (evolutionTarget.traitType === "attribute") {
            if (newData.attributes.physical[evolutionTarget.traitName as keyof typeof newData.attributes.physical] !== undefined) {
              (newData.attributes.physical as any)[evolutionTarget.traitName] = evolutionTarget.newLevel;
            } else if (newData.attributes.social[evolutionTarget.traitName as keyof typeof newData.attributes.social] !== undefined) {
              (newData.attributes.social as any)[evolutionTarget.traitName] = evolutionTarget.newLevel;
            } else if (newData.attributes.mental[evolutionTarget.traitName as keyof typeof newData.attributes.mental] !== undefined) {
              (newData.attributes.mental as any)[evolutionTarget.traitName] = evolutionTarget.newLevel;
            }
          } else if (evolutionTarget.traitType === "skill") {
            (newData.skills as any)[evolutionTarget.traitName] = evolutionTarget.newLevel;
          } else if (evolutionTarget.traitType === "discipline") {
            const d = newData.disciplines.find(x => x.name.toLowerCase() === evolutionTarget.traitName.toLowerCase());
            if (d) d.level = evolutionTarget.newLevel;
          } else if (evolutionTarget.traitType === "advantage") {
            const a = newData.advantages.find(x => x.id === evolutionTarget.traitName);
            if (a) a.level = evolutionTarget.newLevel;
          } else if (evolutionTarget.traitType === "humanity") {
            newData.status.humanity = evolutionTarget.newLevel;
          } else if (evolutionTarget.traitType === "blood_potency") {
            newData.status.blood_potency = evolutionTarget.newLevel;
          }
          return newData;
        });

        fetchXpLedger(); // Recarregar histórico
        showSuccess("Evolução aplicada com sucesso!", "Modo de Evolução");
      } else {
        setEvolutionError(res.error || "Ocorreu um erro ao evoluir.");
      }
    } catch (err: any) {
      setEvolutionError(err.message || "Erro ao conectar com o servidor.");
    } finally {
      setEvolutionLoading(false);
    }
  };

  // Alterações de Perfil (InlineEdit)
  const handleProfileChange = (field: keyof typeof character.profile, value: string | number) => {
    let finalValue = value;
    let autoAdjusted = false;
    let toastMessage = "";

    const currentConcept = field === "concept" ? String(value) : (character.profile.concept || "Neófito");
    const normalizedConcept = currentConcept.toLowerCase().trim();

    let genMin = 12;
    let genMax = 13;
    let genDefault = 12;
    let bpDefault = 1;
    let conceptLabel = "Neófito";

    if (normalizedConcept === "cria" || normalizedConcept === "fledgling") {
      genMin = 14;
      genMax = 16;
      genDefault = 14;
      bpDefault = 0;
      conceptLabel = "Cria";
    } else if (normalizedConcept === "ancila" || normalizedConcept === "ancillae") {
      genMin = 10;
      genMax = 11;
      genDefault = 10;
      bpDefault = 2;
      conceptLabel = "Ancila";
    }

    if (field === "generation") {
      const numGen = Number(value);
      if (numGen < genMin) {
        finalValue = genMin;
        autoAdjusted = true;
        toastMessage = `Geração ajustada para ${genMin}ª (limite oficial para ${conceptLabel} no V5).`;
      } else if (numGen > genMax) {
        finalValue = genMax;
        autoAdjusted = true;
        toastMessage = `Geração ajustada para ${genMax}ª (limite oficial para ${conceptLabel} no V5).`;
      }
    }

    if (autoAdjusted && toastMessage) {
      showWarning(toastMessage, "Regras de Geração");
    }

    setCharacter(prev => {
      const updatedProfile = {
        ...prev.profile,
        [field]: finalValue
      };

      let updatedBloodPotency = prev.status.blood_potency;
      if (field === "concept") {
        const currentGen = prev.profile.generation || 12;
        if (currentGen < genMin || currentGen > genMax) {
          updatedProfile.generation = genDefault;
        }
        updatedBloodPotency = Math.max(bpDefault, prev.status.blood_potency);
      }

      let updatedDisciplines = prev.disciplines;
      if (field === "clan") {
        const newClan = String(value);
        updatedProfile.bane = CLAN_BANE_MAPPING[newClan] || "";

        const allowedDiscs = CLAN_DISCIPLINE_MAPPING[newClan] || [];
        if (allowedDiscs.length > 0) {
          updatedDisciplines = allowedDiscs.map((discName, index) => ({
            id: `disc_init_${index}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            name: discName,
            level: 0,
            powers: []
          }));
        } else {
          updatedDisciplines = [];
        }
      }

      // Se mudar o predator_type, limpa as seleções anteriores do predador
      let newPredatorSelections = prev.predatorSelections || {};
      if (field === "predator_type") {
        newPredatorSelections = {};
        
        // Remove 1 ponto da disciplina que estava selecionada pelo predador anterior
        const prevPredatorSlug = getPredatorSlug(prev.profile.predator_type);
        const prevChosenDiscId = prev.predatorSelections?.chosenDiscipline;
        if (prevPredatorSlug && prevChosenDiscId) {
          const prevDiscName = DISCIPLINE_KEY_TO_NAME[prevChosenDiscId];
          if (prevDiscName) {
            updatedDisciplines = updatedDisciplines.map(d => {
              if (d.name.toLowerCase() === prevDiscName.toLowerCase()) {
                return { ...d, level: Math.max(0, d.level - 1) };
              }
              return d;
            }).filter(d => d.level > 0);
          }
        }
      }

      return {
        ...prev,
        profile: updatedProfile,
        disciplines: updatedDisciplines,
        predatorSelections: newPredatorSelections,
        status: {
          ...prev.status,
          blood_potency: updatedBloodPotency
        }
      };
    });
  };

  const handleSelectPredatorDiscipline = (discId: string) => {
    setCharacter(prev => {
      const prevDiscId = prev.predatorSelections?.chosenDiscipline;
      const selections = prev.predatorSelections || {};
      const newSelections = { ...selections, chosenDiscipline: discId };
      
      let updatedDisciplines = prev.disciplines.map(d => ({ ...d }));

      // 1. Remover o ponto da disciplina anterior se ela existir
      if (prevDiscId) {
        const prevDiscName = DISCIPLINE_KEY_TO_NAME[prevDiscId];
        if (prevDiscName) {
          const target = updatedDisciplines.find(d => 
            d.name.toLowerCase().includes(prevDiscName.toLowerCase()) || 
            prevDiscName.toLowerCase().includes(d.name.toLowerCase())
          );
          if (target) {
            target.level = Math.max(0, target.level - 1);
          }
        }
      }

      // 2. Adicionar o ponto na nova disciplina
      const newDiscName = DISCIPLINE_KEY_TO_NAME[discId];
      if (newDiscName) {
        const target = updatedDisciplines.find(d => 
          d.name.toLowerCase().includes(newDiscName.toLowerCase()) || 
          newDiscName.toLowerCase().includes(d.name.toLowerCase())
        );
        if (target) {
          target.level = Math.min(5, target.level + 1);
        } else {
          updatedDisciplines.push({
            id: generateRandomId("disc"),
            name: newDiscName,
            level: 1,
            powers: []
          });
        }
      }

      // Filtrar disciplinas que ficaram com nível 0
      updatedDisciplines = updatedDisciplines.filter(d => d.level > 0);

      return {
        ...prev,
        predatorSelections: newSelections,
        disciplines: updatedDisciplines
      };
    });
  };

  // ========================================================
  // CALLBACKS DE DISCIPLINAS E PODERES (ABA SANGUE)
  // ========================================================
  const handleAddDiscipline = () => {
    const newDisc: Discipline = {
      id: generateRandomId("disc"),
      name: "Nova Disciplina",
      level: 1,
      powers: []
    };
    setCharacter(prev => ({
      ...prev,
      disciplines: [...prev.disciplines, newDisc]
    }));
  };

  const handleDisciplineNameChange = (id: string, name: string) => {
    setCharacter(prev => ({
      ...prev,
      disciplines: prev.disciplines.map(d => d.id === id ? { ...d, name } : d)
    }));
  };

  const handleDisciplineLevelChange = (id: string, level: number) => {
    if (status === "IN_PLAY" && isEvolvingMode && !isOverrideActive) {
      const disc = character.disciplines.find(d => d.id === id);
      if (disc) {
        if (level <= disc.level) {
          showWarning("No Modo de Evolução, você apenas pode aumentar características por XP.", "Modo de Evolução");
          return;
        }
        openEvolutionConfirmModal(disc.name, "discipline", level, disc.level);
      }
      return;
    }

    setCharacter(prev => ({
      ...prev,
      disciplines: prev.disciplines.map(d => d.id === id ? { ...d, level } : d)
    }));
  };

  const handleDeleteDiscipline = (id: string) => {
    setCharacter(prev => ({
      ...prev,
      disciplines: prev.disciplines.filter(d => d.id !== id)
    }));
  };

  const handleAddPower = (disciplineId: string, name: string, level: number) => {
    setCharacter(prev => ({
      ...prev,
      disciplines: prev.disciplines.map(d => {
        if (d.id === disciplineId) {
          const normalized = (d.powers || []).map((p, idx) => {
            if (typeof p === "string") {
              return { id: `legacy-${idx}`, name: p, level: 1 };
            }
            return p;
          });
          const newPower: AcquiredPower = {
            id: generateRandomId("pow"),
            name,
            level
          };
          return {
            ...d,
            powers: [...normalized, newPower]
          };
        }
        return d;
      })
    }));

    setNewPowerName("");
    setNewPowerLevel(1);
    setActiveAddPowerDiscId(null);
  };

  const handlePowerChange = (disciplineId: string, powerId: string, newText: string) => {
    setCharacter(prev => ({
      ...prev,
      disciplines: prev.disciplines.map(d => {
        if (d.id === disciplineId) {
          const normalized = (d.powers || []).map((p, idx) => {
            if (typeof p === "string") {
              return { id: `legacy-${idx}`, name: p, level: 1 };
            }
            return p;
          });
          return {
            ...d,
            powers: normalized.map(p => p.id === powerId ? { ...p, name: newText } : p)
          };
        }
        return d;
      })
    }));
  };

  const handleDeletePower = (disciplineId: string, powerId: string) => {
    setCharacter(prev => ({
      ...prev,
      disciplines: prev.disciplines.map(d => {
        if (d.id === disciplineId) {
          const normalized = (d.powers || []).map((p, idx) => {
            if (typeof p === "string") {
              return { id: `legacy-${idx}`, name: p, level: 1 };
            }
            return p;
          });
          return {
            ...d,
            powers: normalized.filter(p => p.id !== powerId)
          };
        }
        return d;
      })
    }));
  };

  // ========================================================
  // CALLBACKS DE VANTAGENS (ABA VANTAGENS)
  // ========================================================
  const handleAddAdvantage = (type: "background" | "merit" | "flaw" | "loresheet") => {
    if (type === "loresheet") {
      const existingLoresheet = character.advantages.some(a => a.type === "loresheet");
      if (existingLoresheet && status === "DRAFT" && !isOverrideActive) {
        showWarning("Regra V5: É permitido selecionar apenas 1 Ficha de Saber durante a criação de personagem.", "Limite de Ficha de Saber");
        return;
      }
    }

    let defaultName = "Nova Qualidade / Antecedente";
    if (type === "flaw") defaultName = "Novo Defeito";
    if (type === "loresheet") defaultName = "Nova Ficha de Saber";
    if (type === "background") defaultName = "Novo Antecedente";

    const newAdv: Advantage = {
      id: generateRandomId("adv"),
      name: defaultName,
      type,
      level: 1,
      description: "Descrição..."
    };
    setCharacter(prev => ({
      ...prev,
      advantages: [...prev.advantages, newAdv]
    }));
  };

  const handleAdvantageNameChange = (id: string, name: string) => {
    setCharacter(prev => ({
      ...prev,
      advantages: prev.advantages.map(a => a.id === id ? { ...a, name } : a)
    }));
  };

  const handleAdvantageDescriptionChange = (id: string, description: string) => {
    setCharacter(prev => ({
      ...prev,
      advantages: prev.advantages.map(a => a.id === id ? { ...a, description } : a)
    }));
  };

  const handleAdvantageLevelChange = (id: string, level: number) => {
    if (status === "IN_PLAY" && isEvolvingMode && !isOverrideActive) {
      const adv = character.advantages.find(a => a.id === id);
      if (adv) {
        if (level <= adv.level) {
          showWarning("No Modo de Evolução, você apenas pode aumentar características por XP.", "Modo de Evolução");
          return;
        }
        openEvolutionConfirmModal(adv.id, "advantage", level, adv.level);
      }
      return;
    }

    setCharacter(prev => ({
      ...prev,
      advantages: prev.advantages.map(a => a.id === id ? { ...a, level } : a)
    }));
  };

  const handleAdvantageTypeChange = (id: string, type: "background" | "merit" | "flaw" | "loresheet") => {
    setCharacter(prev => ({
      ...prev,
      advantages: prev.advantages.map(a => a.id === id ? { ...a, type } : a)
    }));
  };

  const handleDeleteAdvantage = (id: string) => {
    setCharacter(prev => ({
      ...prev,
      advantages: prev.advantages.filter(a => a.id !== id)
    }));
  };

  // ========================================================
  // CALLBACKS DE ESPECIALIZAÇÕES (ABA NÚCLEO)
  // ========================================================
  const handleAddSpecialty = () => {
    if (!selectedSkill || !newSpecialtyName.trim()) return;

    const skillLevel = character.skills ? Number(character.skills[selectedSkill]) || 0 : 0;
    const skillLabel = TECHNICAL_NAMES[selectedSkill] || selectedSkill;

    // 1. REGRA V5: Mínimo 1 ponto na Habilidade Base
    if (skillLevel < 1) {
      showWarning(
        `Regra V5: Você não possui nenhum ponto em ${skillLabel}. É necessário ter pelo menos 1 ponto na Habilidade para adquirir uma Especialização.`,
        "Cota de Especializações"
      );
      return;
    }

    // 2. REGRA V5: Motivo "Hab. 4" exige nível 4 na habilidade
    if (specialtySource === "Hab. 4" && skillLevel < 4) {
      showWarning(
        `Regra V5: O motivo 'Hab. 4' é exclusivo para Habilidades que possuem 4 bolinhas. ${skillLabel} possui apenas ${skillLevel} ponto(s).`,
        "Cota de Nível 4"
      );
      return;
    }

    // 3. REGRA V5: Prevenção de duplicatas de nome na mesma Habilidade
    const normalizedName = newSpecialtyName.trim().toLowerCase();
    const isDuplicate = (character.specialties || []).some(
      s => s.skill === selectedSkill && s.name.trim().toLowerCase() === normalizedName
    );
    if (isDuplicate) {
      showWarning(
        `A especialização "${newSpecialtyName.trim()}" já está cadastrada para a habilidade ${skillLabel}.`,
        "Especialização Duplicada"
      );
      return;
    }

    // 4. REGRA V5: Prevenção de reuso do motivo "Hab. 4" na mesma Habilidade
    if (specialtySource === "Hab. 4") {
      const alreadyHasHab4 = (character.specialties || []).some(
        s => s.skill === selectedSkill && s.source === "Hab. 4"
      );
      if (alreadyHasHab4) {
        showWarning(
          `A habilidade ${skillLabel} já possui uma especialização cadastrada pelo motivo de Nível 4.`,
          "Cota de Nível 4 Excedida"
        );
        return;
      }
    }

    // 5. REGRA V5: Cota única para 1ª Grátis, 2ª Grátis e Predador
    const has1st = (character.specialties || []).some(s => s.source === "1ª Grátis");
    const has2nd = (character.specialties || []).some(s => s.source === "2ª Grátis");
    const hasPred = (character.specialties || []).some(s => s.source === "Predador");

    if (specialtySource === "1ª Grátis" && has1st) {
      showWarning("Você já utilizou o slot da 1ª Especialização Gratuita da criação.", "Cota Esgotada");
      return;
    }
    if (specialtySource === "2ª Grátis" && has2nd) {
      showWarning("Você já utilizou o slot da 2ª Especialização Gratuita da criação.", "Cota Esgotada");
      return;
    }
    if (specialtySource === "Predador" && hasPred) {
      showWarning("Você já utilizou o slot de Especialização Gratuita do Tipo de Predador.", "Cota Esgotada");
      return;
    }
    
    const newSpec: Specialty = {
      id: generateRandomId("spec"),
      skill: selectedSkill,
      name: newSpecialtyName.trim(),
      source: specialtySource || "1ª Grátis"
    };
    
    setCharacter(prev => ({
      ...prev,
      specialties: [...(prev.specialties || []), newSpec]
    }));
    
    setNewSpecialtyName("");
    setSelectedSkill("");
  };

  const handleDeleteSpecialty = (id: string) => {
    setCharacter(prev => ({
      ...prev,
      specialties: (prev.specialties || []).filter(s => s.id !== id)
    }));
  };

  // MANIPULADORES DA SEÇÃO 8 (ROUSE CHECK SOLO & GESTÃO DE MACROS)
  const handleRouseCheckSolo = () => {
    const result = rollRouseCheck();
    if (!result.isSuccess) {
      const nextHunger = Math.min(5, character.status.hunger + 1);
      setCharacter(prev => ({
        ...prev,
        status: {
          ...prev.status,
          hunger: nextHunger
        }
      }));
      showWarning(`🩸 A Besta exige mais Sangue! Fome aumentada para ${nextHunger}.`, "Teste de Despertar");
    } else {
      showSuccess(`🩸 O Sangue respondeu ao seu chamado! Fome mantida em ${character.status.hunger}.`, "Teste de Despertar");
    }

    setRollResult({
      macroName: "🩸 Teste de Despertar (Rouse Check)",
      totalPool: 1,
      successes: result.isSuccess ? 1 : 0,
      isCritical: false,
      isMessianic: false,
      isBestial: false,
      diceList: [{ type: "hunger", value: result.dieResult }]
    });
  };

  const handleGeneratePresets = () => {
    let addedCount = 0;
    setCharacter(prev => {
      const existingIds = new Set((prev.macros || []).map(m => m.id));
      const existingPoolKeys = new Set((prev.macros || []).map(m => m.pool.slice().sort().join("_")));
      
      const newPresets = V5_RECOMMENDED_MACROS.filter(preset => {
        const poolKey = preset.pool.slice().sort().join("_");
        return !existingIds.has(preset.id) && !existingPoolKeys.has(poolKey);
      });

      addedCount = newPresets.length;
      if (newPresets.length === 0) {
        return prev;
      }

      return {
        ...prev,
        macros: [...(prev.macros || []), ...newPresets]
      };
    });

    if (addedCount === 0) {
      showWarning("Todas as macros recomendadas V5 já foram adicionadas à ficha.");
    } else {
      showSuccess(`${addedCount} preset(s) recomendado(s) V5 adicionado(s) com sucesso!`);
    }
  };

  const handleSaveMacro = () => {
    if (!newMacroName.trim()) {
      showWarning("Por favor, informe o nome da macro.");
      return;
    }
    if (!selectedAttribute || !selectedSkillOrDiscipline) {
      showWarning("Selecione um Atributo e uma Habilidade/Disciplina.");
      return;
    }

    const newMac: RollMacro = {
      id: generateRandomId("mac"),
      name: newMacroName.trim(),
      pool: [selectedAttribute, selectedSkillOrDiscipline],
      rouse_check: rouseCheckToggle
    };

    setCharacter(prev => ({
      ...prev,
      macros: [...(prev.macros || []), newMac]
    }));

    showSuccess(`Macro "${newMac.name}" criada com sucesso!`);
    setNewMacroName("");
    setRouseCheckToggle(false);
    setIsCreatingMacro(false);
  };

  const handleDeleteMacro = (id: string) => {
    setCharacter(prev => ({
      ...prev,
      macros: (prev.macros || []).filter(m => m.id !== id)
    }));
    showSuccess("Macro removida com sucesso.");
  };

  // SIMULADOR DE ROLAGEM DE DADOS D10 GÓTICO (REGRAS V5)
  const triggerRoll = (macro: RollMacro) => {
    const result = executeSimulationRoll(macro, character);
    
    if (result.shouldIncreaseHunger) {
      setCharacter(prev => ({
        ...prev,
        status: {
          ...prev.status,
          hunger: Math.min(5, prev.status.hunger + 1)
        }
      }));
    }

    setRollResult({
      macroName: result.macroName,
      totalPool: result.totalPool,
      successes: result.successes,
      isCritical: result.isCritical,
      isMessianic: result.isMessianic,
      isBestial: result.isBestial,
      diceList: result.diceList
    });
  };

  return (
    <main className="min-h-screen bg-bg-main text-text-primary p-4 md:p-8 font-reading flex flex-col justify-start items-center">
      <div className="w-full max-w-6xl space-y-6">
        
        {isEvolvingMode && (
          <div className="bg-hunger-red/10 border border-hunger-red/40 p-4 rounded-xs text-xs font-data uppercase text-hunger-red tracking-wider flex items-center justify-between shadow-[0_0_10px_rgba(200,36,52,0.15)] animate-pulse-subtle">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-hunger-red animate-ping" />
              <span><strong>Modo de Evolução Ativo:</strong> Clique em uma bolinha (Atributo, Habilidade, Disciplina, Potência de Sangue ou Humanidade) para aumentá-la usando seu XP.</span>
            </div>
            <button
              onClick={() => setIsEvolvingMode(false)}
              className="text-[10px] text-text-muted hover:text-hunger-red font-bold tracking-widest transition-colors cursor-pointer"
            >
              Sair
            </button>
          </div>
        )}
        
        {/* NAV VOLTAR AO HUB E FEEDBACK DE AUTOSAVE */}
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          {!hideBackToHub && !isStoryteller ? (
            <Link 
              href="/hub" 
              className="flex items-center space-x-2 text-xs uppercase tracking-widest text-text-muted hover:text-gold-accent transition-colors font-data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Voltar ao Hub</span>
            </Link>
          ) : (
            <div />
          )}

          {/* INDICADOR VISUAL DE AUTOSAVE DEBOUNCED */}
          <div className="flex items-center space-x-4 font-data text-xs select-none">
            <div className="min-h-6 flex items-center animate-fade-in">
              {syncStatus === "saving" && (
                <span className="text-text-muted uppercase tracking-wider flex items-center space-x-1.5 text-[10px]">
                  <svg className="animate-spin h-3.5 w-3.5 text-gold-accent shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Salvando alterações...</span>
                </span>
              )}
              {syncStatus === "saved" && (
                <span className="text-gold-accent uppercase tracking-wider font-semibold flex items-center space-x-1.5 text-[10px]">
                  <svg className="w-3.5 h-3.5 text-gold-accent shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Nuvem Sincronizada</span>
                </span>
              )}
              {syncStatus === "error" && (
                <span className="text-hunger-red uppercase tracking-wider font-semibold animate-bounce flex items-center space-x-1.5 text-[10px]">
                  <svg className="w-3.5 h-3.5 text-hunger-red shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Erro ao Salvar</span>
                </span>
              )}
            </div>
            <div className="text-xs uppercase tracking-wider text-blood-red font-gothic text-right">
              {!campaignId || campaignId === "cofre" ? "Cofre (Sem Crônica) 🔒" : chronicle?.name ? `Crônica: ${chronicle.name}` : `Crônica Ativa: ${campaignId.slice(0, 8)}`}
            </div>
          </div>
        </div>

        {/* PAINEL DE STATUS DA CRIAÇÃO & CARTEIRA DE XP */}
        <div className="bg-bg-card border border-white/5 p-4 rounded-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs uppercase tracking-widest text-text-muted font-data font-bold">Estado da Ficha:</span>
            {characterType === "npc" ? (
              <span className="px-2.5 py-1 bg-gold-accent/15 border border-gold-accent/40 text-gold-accent text-xs font-bold font-data uppercase tracking-wider rounded-xs flex items-center gap-1.5 shadow-[0_0_8px_rgba(255,216,77,0.15)]">
                <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse" />
                Antagonista / NPC (Edição Livre) 🛡️
              </span>
            ) : status === "IN_PLAY" ? (
              <span className="px-2.5 py-1 bg-burgundy/40 border border-blood-red text-hunger-red text-xs font-bold font-data uppercase tracking-wider rounded-xs shadow-[0_0_8px_rgba(200,36,52,0.3)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-hunger-red animate-pulse" />
                Em Jogo (Ficha Trancada) 🩸
              </span>
            ) : status === "READY" ? (
              <span className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-bold font-data uppercase tracking-wider rounded-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Pronto no Cofre 🔒
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-950/40 border border-amber-500/40 text-amber-400 text-xs font-bold font-data uppercase tracking-wider rounded-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Criando (Rascunho) 🔧
              </span>
            )}
          </div>
          
          {status === "DRAFT" && characterType !== "npc" && (
            <div className="flex flex-wrap items-center gap-4 text-xs font-data uppercase">
              {alloc.attributesRemaining === 0 && alloc.skillsRemaining === 0 && alloc.disciplinesRemaining === 0 && alloc.advantagesRemaining === 0 ? (
                <span className="text-emerald-400">Tudo Distribuído! ✓</span>
              ) : (
                <span className="text-amber-400">Distribua os pontos restantes do esqueleto nas seções abaixo</span>
              )}
            </div>
          )}
          
          {status === "IN_PLAY" && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-xs font-data uppercase">
                <span className="text-text-muted">Saldo de XP Disponível:</span>
                <span className="text-emerald-400 font-bold text-sm tracking-wider">{xpBalance} XP</span>
              </div>
              {xpBalance > 0 && (
                <button
                  onClick={() => setIsEvolvingMode(!isEvolvingMode)}
                  className={`px-3 py-1 text-xs font-bold font-data uppercase tracking-wider rounded-xs border transition-all duration-150 cursor-pointer ${
                    isEvolvingMode
                      ? "bg-hunger-red/20 border-hunger-red text-hunger-red shadow-[0_0_8px_rgba(200,36,52,0.3)] animate-pulse"
                      : "bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40 hover:border-emerald-400"
                  }`}
                >
                  {isEvolvingMode ? "Cancelar Evolução" : "Evoluir Personagem (XP)"}
                </button>
              )}
            </div>
          )}
           {status === "READY" && (
            <div className="flex items-center gap-4 text-xs font-data uppercase">
              <div className="flex items-center space-x-2">
                <span className="text-text-muted">XP Consumido em Compras:</span>
                <span className="text-gold-accent font-bold text-sm tracking-wider">{alloc.totalSpentXp} XP</span>
              </div>
              {campaignId && campaignId !== "cofre" && characterType === "jogador" && (
                <button
                  onClick={async () => {
                    setStatus("IN_PLAY");
                    const response = await updateCharacterSheet(characterId, character, buildStateRef.current, "IN_PLAY");
                    if (response.success) {
                      showSuccess("Ficha concluída e trancada para a crônica!", "Pronto para Jogar");
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    } else {
                      showError("Erro ao trancar ficha: " + response.error);
                    }
                  }}
                  className="px-3 py-1 bg-blood-red hover:bg-burgundy text-white text-[10px] font-bold font-data uppercase tracking-wider rounded-xs cursor-pointer shadow-md transition-colors"
                >
                  Confirmar Alterações & Voltar ao Jogo 🔒
                </button>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* CABEÇALHO FIXO - DADOS DO VAMPIRO & TRACKERS RÁPIDOS */}
        {/* ======================================================== */}
        <section id="sec-profile" className="bg-bg-card/90 border border-gold-accent/25 rounded-sm p-6 shadow-[0_0_30px_rgba(0,0,0,0.85)] relative overflow-hidden backdrop-blur-md space-y-5">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* PRIMEIRO TERÇO (5 COLS): FOTO + DADOS DE PERFIL DO VAMPIRO */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* AVATAR DO VAMPIRO (INTERATIVO) */}
              <div className="shrink-0">
                <div 
                  onClick={() => {
                    if (!isReadOnly) {
                      setAvatarUrlInput(character.profile.avatarUrl || character.profile.portrait_url || "");
                      setIsAvatarModalOpen(true);
                    }
                  }}
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-gold-accent/50 ring-2 ring-gold-accent/20 ring-offset-2 ring-offset-bg-card bg-bg-main flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.15)] group transition-all duration-300 ${
                    !isReadOnly ? "cursor-pointer hover:border-gold-accent hover:scale-105 hover:shadow-[0_0_25px_rgba(212,175,55,0.35)]" : ""
                  }`}
                  title={!isReadOnly ? "Clique para alterar a foto de perfil do personagem" : ""}
                >
                  {(character.profile.avatarUrl || character.profile.portrait_url) && !avatarImageError ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={character.profile.avatarUrl || character.profile.portrait_url} 
                      alt={character.profile.name || "Vampiro"} 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      onError={() => setAvatarImageError(true)}
                    />
                  ) : (
                    <svg className="w-12 h-12 text-text-dim/40 group-hover:text-gold-accent/60 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}

                  {!isReadOnly && (
                    <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-gold-accent font-data text-[9px] uppercase font-bold tracking-wider">
                      <span className="text-sm mb-0.5">📷</span>
                      <span>Alterar Foto</span>
                    </div>
                  )}
                </div>
              </div>

              {/* DADOS DE PERFIL */}
              <div className="space-y-3 flex-1 min-w-0 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-gothic tracking-wider text-blood-red leading-none flex items-center justify-center sm:justify-start gap-1">
                  <InlineEdit
                    value={character.profile.name || "Novo Vampiro"}
                    onChange={(val) => handleProfileChange("name", val)}
                    disabled={isReadOnly}
                    className="text-2xl sm:text-3xl font-gothic tracking-wider text-blood-red hover:bg-white/5 uppercase truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                </h1>

                {/* GRID MODULAR DE METADADOS DO PERFIL */}
                <div className="grid grid-cols-2 gap-2 text-xs font-data uppercase">
                  <div className="bg-black/40 border border-white/10 hover:border-gold-accent/40 rounded-xs px-2.5 py-1.5 flex items-center gap-1.5 transition-colors">
                    <span className="text-text-muted text-[10px]">Clã:</span>
                    <InlineEdit
                      value={character.profile.clan}
                      onChange={(val) => handleProfileChange("clan", val)}
                      type="select"
                      options={CLAN_OPTIONS}
                      disabled={isReadOnly}
                      className="text-gold-accent font-bold hover:bg-white/5 truncate"
                    />
                  </div>

                  <div className="bg-black/40 border border-white/10 hover:border-gold-accent/40 rounded-xs px-2.5 py-1.5 flex items-center gap-1.5 transition-colors">
                    <span className="text-text-muted text-[10px]">Idade:</span>
                    <InlineEdit
                      value={character.profile.concept || "Neófito"}
                      onChange={(val) => handleProfileChange("concept", val)}
                      type="select"
                      options={POWER_LEVEL_OPTIONS}
                      disabled={isReadOnly}
                      className="text-text-primary font-bold hover:bg-white/5 truncate"
                    />
                  </div>

                  <div className="bg-black/40 border border-white/10 hover:border-gold-accent/40 rounded-xs px-2.5 py-1.5 flex items-center gap-1.5 transition-colors">
                    <span className="text-text-muted text-[10px]">Geração:</span>
                    <InlineEdit
                      value={String(character.profile.generation)}
                      onChange={(val) => handleProfileChange("generation", Number(val) || 11)}
                      type="number"
                      disabled={isReadOnly}
                      className="text-text-primary font-bold hover:bg-white/5 w-8"
                    />
                    <span className="text-[10px] text-text-dim">ª</span>
                  </div>

                  <div className="bg-black/40 border border-white/10 hover:border-gold-accent/40 rounded-xs px-2.5 py-1.5 flex items-center gap-1.5 transition-colors">
                    <span className="text-text-muted text-[10px]">Predador:</span>
                    <InlineEdit
                      value={character.profile.predator_type}
                      onChange={(val) => handleProfileChange("predator_type", val)}
                      type="select"
                      options={PREDATOR_OPTIONS}
                      disabled={isReadOnly}
                      className="text-text-primary font-bold hover:bg-white/5 truncate"
                    />
                  </div>

                  <div className="col-span-2 bg-black/40 border border-white/10 hover:border-gold-accent/40 rounded-xs px-2.5 py-1.5 flex items-center gap-1.5 transition-colors">
                    <span className="text-text-muted text-[10px]">Senhor:</span>
                    <InlineEdit
                      value={character.profile.sire}
                      onChange={(val) => handleProfileChange("sire", val)}
                      disabled={isReadOnly}
                      className="text-text-primary font-bold hover:bg-white/5 truncate"
                    />
                  </div>
                </div>

                {/* CARD EXPLICATIVO DAS REGRAS V5 PARA O NÍVEL DE PODER */}
                {(() => {
                  const rules = getPowerLevelRules(character.profile.concept || "Neófito");
                  return (
                    <div className="p-2.5 bg-amber-950/20 border border-amber-600/30 rounded-xs text-[10px] font-data text-amber-300 leading-tight">
                      <span className="text-amber-400 font-bold uppercase tracking-wider block mb-0.5">
                        💡 Regra V5 - Idade ({rules.name}):
                      </span>
                      <span>
                        Atributos (13 pts) e Habilidades (20 pts) padrão. Nível <strong className="text-amber-200">{rules.name}</strong> concede: <strong>Potência de Sangue {rules.bloodPotency}</strong>, <strong>{rules.disciplines} bolinhas de Disciplinas</strong> e <strong>{rules.advantages} pts de Vantagens</strong>.
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* SEGUNDO TERÇO (7 COLS): RASTREADORES RÁPIDOS MODULARIZADOS */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-3.5 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
              
              {/* LINHA 1: VITALIDADE (HEALTH) & FORÇA DE VONTADE (WILLPOWER) */}
              <div className="bg-black/30 border border-white/10 rounded-xs p-3 flex flex-col justify-between">
                <DamageTracker 
                  characterId={characterId}
                  label="Vitalidade" 
                  value={character.status.health} 
                  onChange={(val) => setCharacter(prev => ({ ...prev, status: { ...prev.status, health: val } }))} 
                  variant="health" 
                />
              </div>

              <div className="bg-black/30 border border-white/10 rounded-xs p-3 flex flex-col justify-between">
                <DamageTracker 
                  characterId={characterId}
                  label="Força de Vontade" 
                  value={character.status.willpower} 
                  onChange={(val) => setCharacter(prev => ({ ...prev, status: { ...prev.status, willpower: val } }))} 
                  variant="willpower" 
                />
              </div>

              {/* LINHA 2: FOME & RESSONÂNCIA */}
              <div className="bg-black/30 border border-white/10 rounded-xs p-3 flex flex-col justify-between">
                <DotSlider
                  label="Fome"
                  value={character.status.hunger}
                  onChange={(val) => setCharacter(prev => ({ ...prev, status: { ...prev.status, hunger: val } }))}
                  allowZero
                  variant="red"
                />
              </div>

              <BloodPanel
                value={character.bloodState}
                onChange={(newBloodState) => setCharacter(prev => ({ ...prev, bloodState: newBloodState }))}
                disabled={isSheetDisabled}
              />

              {/* LINHA 3: BÚSSOLA MORAL & MÁCULAS (LARGURA TOTAL 2 COLUNAS) */}
              <div className="md:col-span-2 bg-black/30 border border-white/10 rounded-xs p-3.5">
                <HumanityTracker
                  characterId={characterId}
                  humanity={character.status.humanity}
                  stains={character.status.stains}
                  onHumanityChange={handleHumanityChange}
                  onStainsChange={(val) => setCharacter(prev => ({ ...prev, status: { ...prev.status, stains: val } }))}
                  disabled={isSheetDisabled}
                />
              </div>

            </div>
          </div>

          {/* EXIBIÇÃO DA MALDIÇÃO DO CLÃ (FOOTER ELEGANTE DA SEÇÃO) */}
          {character.profile.bane && (
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-data">
              <span className="text-blood-red font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 font-gothic">
                <span>🩸 Maldição do Clã ({character.profile.clan || "Vampiro"}):</span>
              </span>
              <span className="text-text-primary font-reading text-xs bg-burgundy/25 border border-blood-red/30 px-3 py-1.5 rounded-xs w-full sm:w-auto flex-1 leading-relaxed">
                {character.profile.bane}
              </span>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* MENU DE NAVEGAÇÃO FIXO (STICKY HEADER) */}
        {/* ======================================================== */}
        <div className="sticky top-0 z-30 bg-bg-main/95 backdrop-blur-md border-b border-white/10 py-3 flex items-center select-none pl-2 shadow-md pr-4 overflow-x-auto md:overflow-x-visible scrollbar-none flex-row flex-nowrap md:flex-wrap space-x-1.5 gap-y-0 md:gap-y-1.5 w-full">
          {(
            [
              { id: "sec-profile", label: "👤 Perfil" },
              { id: "atributos", label: "📊 Atributos" },
              { id: "habilidades", label: "🗡️ Habilidades" },
              { id: "disciplinas", label: "🩸 Disciplinas" },
              { id: "conviccoes", label: "⚖️ Convicções" },
              { id: "vantagens", label: "⭐ Vantagens" },
              { id: "inventario", label: "🎒 Inventário" },
              { id: "macros", label: "📜 Macros" },
              { id: "xp_diary", label: "💎 Diário de XP" },
            ] as const
          ).map((item) => {
            const isActive = activeTabId === item.id || (item.id === "atributos" && activeTabId === "sec-profile");
            return (
              <button
                key={item.id}
                onClick={() => {
                  setRollResult(null);
                  setActiveTabId(item.id);
                  const el = document.getElementById(item.id);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className={`shrink-0 py-1.5 px-3.5 text-[10px] uppercase tracking-widest font-data font-bold border transition-all duration-200 cursor-pointer focus:outline-none rounded-sm ${
                  isActive
                    ? "bg-gold-accent/20 border-gold-accent text-gold-accent shadow-[0_0_10px_rgba(212,175,55,0.25)] scale-102 font-extrabold"
                    : "border-white/10 hover:border-gold-accent/60 hover:text-gold-accent text-text-muted bg-black/45"
                }`}
              >
                {item.label}
              </button>
            );
          })}
          {isStoryteller && (
            <button
              onClick={() => {
                setIsOverrideActive(prev => {
                  const newVal = !prev;
                  if (newVal) {
                    showSuccess("Edição Divina Ativada! Modificações de bolinhas, disciplinas e vantagens salvarão imediatamente de graça.");
                  } else {
                    showWarning("Edição Divina Desativada. A ficha voltou ao comportamento padrão.");
                  }
                  return newVal;
                });
              }}
              className={`shrink-0 py-1.5 px-4 text-[10px] uppercase tracking-widest font-data font-bold border rounded-sm transition-all duration-150 cursor-pointer focus:outline-none md:ml-auto ${
                isOverrideActive
                  ? "bg-gold-accent text-bg-main border-gold-accent shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                  : "bg-black/45 border-white/10 hover:border-gold-accent hover:text-gold-accent text-text-muted"
              }`}
            >
              Edição Divina ⚡ {isOverrideActive ? "Ativa" : "Inativa"}
            </button>
          )}
        </div>

        {/* ======================================================== */}
        {/* CONTEÚDO DA FICHA (SINGLE PAGE) */}
        {/* ======================================================== */}
        <div className="space-y-8 pb-16">
          
          {/* SEÇÃO 1: ATRIBUTOS */}
          <section id="atributos" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 space-y-6">
            <h3 className="text-lg font-gothic tracking-wider text-blood-red border-b border-white/5 pb-2 uppercase flex flex-wrap items-center gap-3">
              <span>Atributos</span>
              {status === "DRAFT" && characterType !== "npc" && (
                <>
                  <span className={`text-xs font-data px-2.5 py-0.5 rounded-xs border uppercase font-bold tracking-wider ${
                    alloc.attributesRemaining === 0
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                      : "bg-amber-950/60 border-amber-500/40 text-amber-400 animate-pulse"
                  }`}>
                    {alloc.attributesRemaining === 0 ? "🟢 0 Restantes (Concluído) ✓" : `🟡 ${alloc.attributesRemaining} ${alloc.attributesRemaining === 1 ? "ponto restante" : "pontos restantes"}`}
                  </span>
                  <span 
                    className="text-[11px] font-data text-gold-accent/80 bg-gold-accent/10 border border-gold-accent/20 px-2 py-0.5 rounded-xs normal-case tracking-normal cursor-help"
                    title="Regra V5 de Criação: Cota oficial de 22 pontos distribuídos em 1x(4), 3x(3), 4x(2), 1x(1)."
                  >
                    💡 Esquema V5: 1x(4) | 3x(3) | 4x(2) | 1x(1)
                  </span>
                </>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* FÍSICOS */}
              <div className="space-y-1 bg-bg-main/40 p-4 border border-white/5 rounded-sm">
                <h4 className="text-xs font-data uppercase tracking-wider text-gold-accent font-bold mb-2">Físicos</h4>
                {Object.entries(character.attributes.physical).map(([key, val]) => (
                  <DotSlider 
                    key={key}
                    label={TECHNICAL_NAMES[key] || key}
                    value={val}
                    onChange={(newVal) => handleAttributeChange("physical", key, newVal)}
                    isSelected={dicePool.some(p => p.id === key)}
                    onLabelClick={onTraitClick ? () => onTraitClick({ id: key, label: TECHNICAL_NAMES[key] || key, value: val }) : undefined}
                    baseValue={alloc.attributesBase[key]}
                    showXpDistinction={status !== "IN_PLAY"}
                    disabled={isSheetDisabled}
                  />
                ))}
              </div>

              {/* SOCIAIS */}
              <div className="space-y-1 bg-bg-main/40 p-4 border border-white/5 rounded-sm">
                <h4 className="text-xs font-data uppercase tracking-wider text-gold-accent font-bold mb-2">Sociais</h4>
                {Object.entries(character.attributes.social).map(([key, val]) => (
                  <DotSlider 
                    key={key}
                    label={TECHNICAL_NAMES[key] || key}
                    value={val}
                    onChange={(newVal) => handleAttributeChange("social", key, newVal)}
                    isSelected={dicePool.some(p => p.id === key)}
                    onLabelClick={onTraitClick ? () => onTraitClick({ id: key, label: TECHNICAL_NAMES[key] || key, value: val }) : undefined}
                    baseValue={alloc.attributesBase[key]}
                    showXpDistinction={status !== "IN_PLAY"}
                    disabled={isSheetDisabled}
                  />
                ))}
              </div>

              {/* MENTAIS */}
              <div className="space-y-1 bg-bg-main/40 p-4 border border-white/5 rounded-sm">
                <h4 className="text-xs font-data uppercase tracking-wider text-gold-accent font-bold mb-2">Mentais</h4>
                {Object.entries(character.attributes.mental).map(([key, val]) => (
                  <DotSlider 
                    key={key}
                    label={TECHNICAL_NAMES[key] || key}
                    value={val}
                    onChange={(newVal) => handleAttributeChange("mental", key, newVal)}
                    isSelected={dicePool.some(p => p.id === key)}
                    onLabelClick={onTraitClick ? () => onTraitClick({ id: key, label: TECHNICAL_NAMES[key] || key, value: val }) : undefined}
                    baseValue={alloc.attributesBase[key]}
                    showXpDistinction={status !== "IN_PLAY"}
                    disabled={isSheetDisabled}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: HABILIDADES */}
          <section id="habilidades" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 space-y-6">
            <h3 className="text-lg font-gothic tracking-wider text-blood-red border-b border-white/5 pb-2 uppercase flex flex-wrap items-center gap-3">
              <span>Habilidades</span>
              {status === "DRAFT" && characterType !== "npc" && (
                <>
                  <span className={`text-xs font-data px-2.5 py-0.5 rounded-xs border uppercase font-bold tracking-wider ${
                    alloc.skillsRemaining === 0
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                      : "bg-amber-950/60 border-amber-500/40 text-amber-400 animate-pulse"
                  }`}>
                    {alloc.skillsRemaining === 0 ? "🟢 0 Restantes (Concluído) ✓" : `🟡 ${alloc.skillsRemaining} ${alloc.skillsRemaining === 1 ? "ponto restante" : "pontos restantes"}`}
                  </span>
                  <span 
                    className="text-[11px] font-data text-gold-accent/80 bg-gold-accent/10 border border-gold-accent/20 px-2 py-0.5 rounded-xs normal-case tracking-normal cursor-help"
                    title="Regra V5 de Criação: Cota oficial de 20 pontos distribuídos em 1x(4), 3x(3), 3x(2), 3x(1)."
                  >
                    💡 Esquema V5: 1x(4) | 3x(3) | 3x(2) | 3x(1)
                  </span>
                </>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* HABILIDADES FÍSICAS */}
              <div className="space-y-1 bg-bg-main/40 p-4 border border-white/5 rounded-sm">
                <h4 className="text-xs font-data uppercase tracking-wider text-blood-red font-bold mb-2">Físicas</h4>
                {(["melee", "firearms", "athletics", "brawl", "drive", "stealth", "larceny", "craft", "survival"] as const).map(skill => (
                  <DotSlider 
                    key={skill}
                    label={TECHNICAL_NAMES[skill] || skill}
                    value={character.skills[skill]}
                    onChange={(newVal) => handleSkillChange(skill, newVal)}
                    specialties={character.specialties.filter(s => s.skill === skill)}
                    allowZero
                    isSelected={dicePool.some(p => p.id === skill)}
                    onLabelClick={onTraitClick ? () => onTraitClick({ id: skill, label: TECHNICAL_NAMES[skill] || skill, value: character.skills[skill] }) : undefined}
                    baseValue={alloc.skillsBase[skill]}
                    showXpDistinction={status !== "IN_PLAY"}
                    disabled={isSheetDisabled}
                  />
                ))}
              </div>

              {/* HABILIDADES SOCIAIS */}
              <div className="space-y-1 bg-bg-main/40 p-4 border border-white/5 rounded-sm">
                <h4 className="text-xs font-data uppercase tracking-wider text-blood-red font-bold mb-2">Sociais</h4>
                {(["animal_ken", "etiquette", "intimidation", "leadership", "streetwise", "performance", "persuasion", "insight", "subterfuge"] as const).map(skill => (
                  <DotSlider 
                    key={skill}
                    label={TECHNICAL_NAMES[skill] || skill}
                    value={character.skills[skill]}
                    onChange={(newVal) => handleSkillChange(skill, newVal)}
                    specialties={character.specialties.filter(s => s.skill === skill)}
                    allowZero
                    isSelected={dicePool.some(p => p.id === skill)}
                    onLabelClick={onTraitClick ? () => onTraitClick({ id: skill, label: TECHNICAL_NAMES[skill] || skill, value: character.skills[skill] }) : undefined}
                    baseValue={alloc.skillsBase[skill]}
                    showXpDistinction={status !== "IN_PLAY"}
                    disabled={isSheetDisabled}
                  />
                ))}
              </div>

              {/* HABILIDADES MENTAIS */}
              <div className="space-y-1 bg-bg-main/40 p-4 border border-white/5 rounded-sm">
                <h4 className="text-xs font-data uppercase tracking-wider text-blood-red font-bold mb-2">Mentais</h4>
                {(["science", "academics", "finance", "investigation", "medicine", "occult", "awareness", "politics", "technology"] as const).map(skill => (
                  <DotSlider 
                    key={skill}
                    label={TECHNICAL_NAMES[skill] || skill}
                    value={character.skills[skill]}
                    onChange={(newVal) => handleSkillChange(skill, newVal)}
                    specialties={character.specialties.filter(s => s.skill === skill)}
                    allowZero
                    isSelected={dicePool.some(p => p.id === skill)}
                    onLabelClick={onTraitClick ? () => onTraitClick({ id: skill, label: TECHNICAL_NAMES[skill] || skill, value: character.skills[skill] }) : undefined}
                    baseValue={alloc.skillsBase[skill]}
                    showXpDistinction={status !== "IN_PLAY"}
                    disabled={isSheetDisabled}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* SEÇÃO 3: ESPECIALIZAÇÕES */}
          <section id="especializacoes" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 space-y-6">
            <div>
              <h3 className="text-lg font-gothic tracking-wider text-gold-accent uppercase">
                Especializações de Habilidades
              </h3>
              <p className="text-xs text-text-muted font-reading">
                Defina especializações para obter dados de bônus (+1 dado) em testes específicos vinculados a Habilidades.
              </p>
            </div>

            {/* LISTAGEM DE BADGES */}
            <div className="flex flex-wrap gap-2">
              {character.specialties && character.specialties.map(spec => {
                let sourceBadge = null;
                const source = spec.source || "1ª Grátis";
                if (source === "1ª Grátis" || source === "2ª Grátis") {
                  sourceBadge = <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 uppercase tracking-wider">{source}</span>;
                } else if (source === "Predador") {
                  sourceBadge = <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-deep-crimson/80 border border-blood-red/40 text-blood-red uppercase tracking-wider">Predador</span>;
                } else if (source === "Hab. 4") {
                  sourceBadge = <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-amber-950/80 border border-amber-500/40 text-amber-300 uppercase tracking-wider">Hab. 4</span>;
                } else if (source === "Por XP") {
                  sourceBadge = <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-blue-950/80 border border-blue-500/40 text-blue-300 uppercase tracking-wider">Por XP</span>;
                } else {
                  sourceBadge = <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-white/10 border border-white/20 text-text-muted uppercase tracking-wider">{source.substring(0, 10)}</span>;
                }

                return (
                  <span 
                    key={spec.id} 
                    className="bg-bg-main/60 border border-gold-accent/30 text-gold-accent text-xs px-2.5 py-1 rounded-sm flex items-center space-x-2 font-data uppercase tracking-wider shadow-none"
                  >
                    {sourceBadge}
                    <span>
                      <strong className="text-text-primary mr-1">{TECHNICAL_NAMES[spec.skill] || spec.skill}:</strong> 
                      {spec.name}
                    </span>
                    {(status !== "IN_PLAY" || isOverrideActive) && (
                      <button
                        onClick={() => handleDeleteSpecialty(spec.id)}
                        className="text-hunger-red hover:text-white cursor-pointer select-none text-[10px] font-bold ml-1"
                        title="Excluir Especialização"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                );
              })}
              {(!character.specialties || character.specialties.length === 0) && (
                <span className="text-xs text-text-muted/60 italic font-reading">Nenhuma especialização cadastrada.</span>
              )}
            </div>

            {/* MINI-FORMULÁRIO DE CADASTRO COM 2 DROPDOWNS + 1 INPUT */}
            {(status !== "IN_PLAY" || isOverrideActive) && (
              <div className="flex flex-wrap items-end gap-3 bg-bg-main/30 p-4 border border-white/5 rounded-sm max-w-3xl shadow-none">
                {/* DROPDOWN 1: MOTIVO / ORIGEM */}
                <div className="flex flex-col space-y-1 min-w-[130px]">
                  <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Motivo / Origem</label>
                  <select
                    value={specialtySource}
                    onChange={(e) => setSpecialtySource(e.target.value)}
                    className="bg-bg-input border border-white/10 text-text-primary text-xs p-2 rounded-sm outline-none focus:border-gold-accent h-9 cursor-pointer"
                  >
                    {!character.specialties?.some(s => s.source === "1ª Grátis") && (
                      <option value="1ª Grátis" className="bg-bg-card">🟢 1ª Grátis</option>
                    )}
                    {!character.specialties?.some(s => s.source === "2ª Grátis") && (
                      <option value="2ª Grátis" className="bg-bg-card">🟢 2ª Grátis</option>
                    )}
                    {!character.specialties?.some(s => s.source === "Predador") && (
                      <option value="Predador" className="bg-bg-card">🩸 Predador</option>
                    )}
                    <option value="Hab. 4" className="bg-bg-card">⭐ Hab. 4</option>
                    <option value="Por XP" className="bg-bg-card">💎 Por XP (3pts)</option>
                  </select>
                </div>

                {/* DROPDOWN 2: HABILIDADE BASE */}
                <div className="flex flex-col space-y-1 min-w-[150px]">
                  <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Habilidade Base</label>
                  <select
                    value={selectedSkill}
                    onChange={(e) => {
                      const newSkill = e.target.value as keyof CharacterSkills | "";
                      setSelectedSkill(newSkill);
                      if (newSkill && character.skills && Number(character.skills[newSkill]) >= 4) {
                        setSpecialtySource("Hab. 4");
                      }
                    }}
                    className="bg-bg-input border border-white/10 text-text-primary text-xs p-2 rounded-sm outline-none focus:border-gold-accent h-9 cursor-pointer"
                  >
                    <option value="" className="bg-bg-card">Selecione...</option>
                    {Object.entries(TECHNICAL_NAMES)
                      .filter(([key]) => {
                        const isAttribute = [
                          "strength", "dexterity", "stamina",
                          "charisma", "manipulation", "composure",
                          "intelligence", "wits", "resolve"
                        ].includes(key);
                        if (isAttribute) return false;

                        const lvl = character.skills ? Number(character.skills[key as keyof CharacterSkills]) || 0 : 0;

                        // REGRA V5: Habilidade Base PRECISA ter pelo menos 1 ponto (lvl >= 1)
                        if (lvl < 1) return false;

                        // Se o motivo for "Hab. 4", exibe apenas Habilidades com lvl >= 4
                        if (specialtySource === "Hab. 4") {
                          return lvl >= 4;
                        }

                        // Se o motivo for "Predador", exibe apenas as Habilidades elegíveis do Predador ativo
                        if (specialtySource === "Predador") {
                          const predatorName = character.profile?.predator_type?.trim() || "";
                          const allowedOpts = PREDATOR_SPECIALTY_MAP[predatorName] || [];
                          return allowedOpts.some(opt => opt.skill === key);
                        }

                        return true;
                      })
                      .map(([key, label]) => {
                        const lvl = character.skills ? Number(character.skills[key as keyof CharacterSkills]) || 0 : 0;
                        return (
                          <option key={key} value={key} className="bg-bg-card">
                            {label} ({lvl})
                          </option>
                        );
                      })
                    }
                  </select>
                </div>

                {/* INPUT 3: NOME DA ESPECIALIZAÇÃO */}
                <div className="flex flex-col space-y-1 flex-1 min-w-[180px]">
                  <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Nome da Especialização</label>
                  <input
                    type="text"
                    placeholder="Ex: Pistolas, Briga de Rua, Invasão..."
                    value={newSpecialtyName}
                    onChange={(e) => setNewSpecialtyName(e.target.value)}
                    className="bg-bg-input border border-white/10 text-text-primary text-xs p-2 rounded-sm outline-none focus:border-gold-accent h-9 font-reading"
                  />
                </div>

                {/* BOTÃO ADICIONAR */}
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={handleAddSpecialty}
                    disabled={!selectedSkill || !newSpecialtyName.trim()}
                    className="bg-burgundy border border-blood-red hover:bg-blood-red text-text-primary disabled:opacity-40 disabled:hover:bg-burgundy text-xs px-4 rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed font-data uppercase font-bold h-9 flex items-center justify-center select-none"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* SEÇÃO 4: DISCIPLINAS */}
          <section id="disciplinas" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-white/5 pb-2">
              <div className="flex items-center flex-wrap gap-3">
                <h3 className="text-lg font-gothic tracking-wider text-blood-red uppercase flex items-center space-x-2">
                  <span>Disciplinas Vampíricas (Poderes do Sangue)</span>
                </h3>
                {status === "DRAFT" && characterType !== "npc" && (
                  <span className={`text-xs font-data px-2.5 py-0.5 rounded-xs border uppercase font-bold tracking-wider ${
                    alloc.disciplinesRemaining === 0
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                      : "bg-amber-950/60 border-amber-500/40 text-amber-400 animate-pulse"
                  }`}>
                    {alloc.disciplinesRemaining === 0 ? "🟢 0 Restantes (Concluído) ✓" : `🟡 ${alloc.disciplinesRemaining} ${alloc.disciplinesRemaining === 1 ? "ponto restante" : "pontos restantes"}`}
                  </span>
                )}
                {(status !== "IN_PLAY" || isOverrideActive) && (
                  <button
                    onClick={handleAddDiscipline}
                    className="text-xs uppercase tracking-wider font-bold text-gold-accent bg-burgundy/40 hover:bg-burgundy px-3 py-1 border border-blood-red/30 hover:border-blood-red rounded-sm transition-all duration-150 cursor-pointer shadow-none opacity-80 hover:opacity-100"
                  >
                    + Adicionar Disciplina
                  </button>
                )}
              </div>
              <div className="w-56 bg-bg-main/30 px-3 py-0.5 rounded border border-white/5">
                <DotSlider
                  label="Potência do Sangue"
                  value={character.status.blood_potency}
                  onChange={handleBloodPotencyChange}
                  allowZero={rules.bloodPotency === 0}
                  baseValue={rules.bloodPotency}
                  showXpDistinction={status !== "IN_PLAY"}
                  disabled={isSheetDisabled}
                  variant="gold"
                />
              </div>
            </div>

            {/* BANNER CONTEXTUAL DE LEMBRETE DA RESSONÂNCIA E BÔNUS DE DISCIPLINAS */}
            {(() => {
              const currentRes = character.bloodState?.resonance || "Vazio";
              const currentDyscrasia = character.bloodState?.dyscrasia || "";

              const resonanceBonusMap: Record<string, { bonus: string; color: string }> = {
                "Colérico": { bonus: "+1 dado em Potência e Celeridade", color: "text-red-400 border-red-500/40 bg-red-950/30" },
                "Sanguíneo": { bonus: "+1 dado em Presença e Feitiçaria de Sangue", color: "text-amber-400 border-amber-500/40 bg-amber-950/30" },
                "Melancólico": { bonus: "+1 dado em Auspício e Ofuscação", color: "text-purple-400 border-purple-500/40 bg-purple-950/30" },
                "Fleumático": { bonus: "+1 dado em Fortitude e Dominação", color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/30" },
                "Animal": { bonus: "+1 dado em Metamorfose e Animalismo", color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/30" }
              };

              const info = resonanceBonusMap[currentRes];

              return (
                <div className={`p-3 rounded border font-data text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm ${info ? info.color : "bg-white/5 border-white/10 text-text-muted"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🩸</span>
                    <span className="font-bold uppercase tracking-wider">
                      Ressonância Ativa: <span className="underline">{currentRes}</span>
                    </span>
                    {info && (
                      <span className="font-semibold text-[11px] opacity-90">
                        ({info.bonus})
                      </span>
                    )}
                  </div>
                  {currentDyscrasia.trim() && (
                    <div className="text-[11px] bg-black/40 px-2.5 py-1 rounded border border-white/10 text-gold-accent font-reading">
                      ✨ <strong className="font-data uppercase tracking-wider">Discrasi:</strong> {currentDyscrasia}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* BANNER INTERATIVO DE ESCOLHA DO PREDADOR */}
            {status !== "IN_PLAY" && character.profile.predator_type && (() => {
              const predatorSlug = getPredatorSlug(character.profile.predator_type);
              if (!predatorSlug) return null;
              const rule = PREDATOR_TYPES[predatorSlug];
              if (!rule) return null;

              const chosenDiscId = character.predatorSelections?.chosenDiscipline;
              const hasRemaining = !chosenDiscId;

              return (
                <div className="rounded border border-yellow-600/40 bg-yellow-950/20 p-4 text-sm text-yellow-400">
                  <div className="flex items-center justify-between font-bold uppercase tracking-wider">
                    <span>⚡ Bônus de Predador: {rule.name}</span>
                    {hasRemaining ? (
                      <span className="animate-pulse text-xs text-yellow-500 font-semibold bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">
                        [ Escolha 1 ponto de Disciplina ]
                      </span>
                    ) : (
                      <span className="text-xs text-green-400 font-semibold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                        [ ✓ Escolha Concluída ]
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rule.disciplines.map(discId => {
                      const isSelected = chosenDiscId === discId;
                      const discName = DISCIPLINE_KEY_TO_NAME[discId] || discId;
                      return (
                        <button
                          key={discId}
                          type="button"
                          onClick={() => handleSelectPredatorDiscipline(discId)}
                          className={`px-3 py-1.5 text-xs rounded border font-data uppercase tracking-wider transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-purple-900/60 border-purple-500 text-purple-200 font-bold shadow-[0_0_8px_rgba(147,51,234,0.4)]" 
                              : "bg-bg-main/50 border-white/10 hover:border-yellow-500 text-text-muted hover:text-text-primary"
                          }`}
                        >
                          +1 {discName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {character.disciplines.map(disc => (
                <div key={disc.id} className="bg-bg-main/30 border border-white/5 rounded-sm p-4 space-y-3 relative group">
                  {/* BOTÃO EXCLUIR DISCIPLINA */}
                  {(status !== "IN_PLAY" || isOverrideActive) && (
                    <button
                      onClick={() => handleDeleteDiscipline(disc.id)}
                      className="absolute top-4 right-4 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer select-none"
                      title="Excluir Disciplina"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  <div className="flex justify-between items-center pr-6">
                    <div className="flex items-center space-x-2">
                      {onTraitClick && (
                        <button
                          onClick={() => onTraitClick({ id: disc.id, label: disc.name, value: disc.level })}
                          className={`cursor-pointer select-none text-base transition-all duration-150 hover:scale-125 hover:text-hunger-red ${
                            dicePool.some(p => p.id === disc.id)
                              ? "text-hunger-red font-bold scale-115 animate-pulse"
                              : "text-text-muted hover:text-text-primary"
                          }`}
                          title="Selecionar para o Carrinho de Dados"
                        >
                          🎲
                        </button>
                      )}
                      <InlineEdit
                        value={disc.name}
                        onChange={(val) => handleDisciplineNameChange(disc.id, val)}
                        placeholder="Nova Disciplina"
                        type="select"
                        options={DISCIPLINE_OPTIONS}
                        disabled={isReadOnly}
                        className="font-gothic text-xl text-text-primary tracking-wide hover:bg-white/5 cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex space-x-1 items-center h-6">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const isActive = idx < disc.level;
                        const isBase = idx < (alloc.disciplinesBase[disc.id] || 0);
                        
                        // Lógica da bolinha roxa do predador para as disciplinas
                        const predatorSlug = getPredatorSlug(character.profile.predator_type);
                        const chosenDiscId = character.predatorSelections?.chosenDiscipline;
                        const chosenDiscName = chosenDiscId ? DISCIPLINE_KEY_TO_NAME[chosenDiscId] : null;
                        
                        const isPredatorDisc = chosenDiscName && (
                          disc.name.toLowerCase().includes(chosenDiscName.toLowerCase()) ||
                          chosenDiscName.toLowerCase().includes(disc.name.toLowerCase())
                        );
                        const isPredatorDot = isPredatorDisc && isActive && idx >= (disc.level - 1) && idx < disc.level;
                        
                        let activeClass = "";
                        if (isActive) {
                          if (isPredatorDot) {
                            activeClass = "bg-purple-600 border border-purple-400 shadow-[0_0_8px_rgba(147,51,234,0.7)] animate-pulse-subtle";
                          } else if (isReadOnly) {
                            activeClass = "bg-hunger-red ring-1 ring-hunger-red/40 shadow-[0_0_8px_rgba(255,92,92,0.5)]";
                          } else if (isBase) {
                            activeClass = "bg-blood-red ring-1 ring-blood-red/45 shadow-[0_0_6px_rgba(200,36,52,0.6)]";
                          } else {
                            activeClass = "bg-yellow-400 ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(255,223,0,0.9)] animate-pulse-subtle";
                          }
                        } else {
                          activeClass = "bg-bg-input border border-text-dim/80 hover:border-blood-red";
                        }
                        
                        return (
                          <button
                            key={idx}
                            disabled={isSheetDisabled}
                            onClick={() => handleDisciplineLevelChange(disc.id, idx + 1)}
                            className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${isSheetDisabled ? "cursor-default" : "cursor-pointer"} ${activeClass}`}
                            title={`Nível ${idx + 1}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block">Poderes Adquiridos:</span>
                    
                    <div className="space-y-1.5">
                      {(() => {
                        const normalizedPowers = (disc.powers || []).map((p, idx) => {
                          if (typeof p === "string") {
                            return { id: `legacy-${idx}`, name: p, level: 1 };
                          }
                          return p;
                        });
                        
                        const sortedPowers = [...normalizedPowers].sort((a, b) => a.level - b.level);
                        
                        return sortedPowers.map((pow) => (
                          <div 
                            key={pow.id} 
                            className="flex items-center justify-between text-sm text-text-primary font-reading pl-2 py-0.5 border-l border-blood-red/40 bg-white/5 rounded-r-sm group/power"
                          >
                            <div className="flex items-center space-x-2 flex-1 mr-2">
                              <span className="bg-blood-red/10 border border-blood-red/20 text-hunger-red text-[10px] px-1.5 py-0.5 rounded font-data font-bold select-none">
                                Nível {pow.level}
                              </span>
                              <InlineEdit
                                value={pow.name}
                                onChange={(val) => handlePowerChange(disc.id, pow.id, val)}
                                placeholder="Novo Poder"
                                disabled={isReadOnly}
                                className="text-sm font-reading text-text-primary flex-1"
                              />
                            </div>
                            {(status !== "IN_PLAY" || isOverrideActive) && (
                              <button
                                onClick={() => handleDeletePower(disc.id, pow.id)}
                                className="text-text-muted/40 hover:text-hunger-red opacity-0 group-hover/power:opacity-100 transition-opacity duration-150 cursor-pointer pr-1 select-none text-[10px] font-bold"
                                title="Remover Poder"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ));
                      })()}
                    </div>

                    {/* MINI-FORMULÁRIO INLINE PARA ADIÇÃO DE PODER */}
                    {activeAddPowerDiscId === disc.id && (
                      <div className="bg-bg-main/30 border border-white/5 p-3 rounded-sm space-y-3 mt-2 shadow-none">
                        <div className="text-[10px] uppercase font-bold text-yellow-500 tracking-wider">Novo Poder de {disc.name}</div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <input
                            type="text"
                            placeholder="Nome do Poder (Ex: Ampliar Sentidos...)"
                            value={newPowerName}
                            onChange={(e) => setNewPowerName(e.target.value)}
                            className="bg-bg-input border border-white/10 text-text-primary text-xs p-2 rounded-sm outline-none focus:border-gold-accent flex-1 h-9 font-reading"
                          />
                          <div className="flex items-center space-x-2">
                            <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Nível:</label>
                            <select
                              value={newPowerLevel}
                              onChange={(e) => setNewPowerLevel(Number(e.target.value))}
                              className="bg-bg-input border border-white/10 text-text-primary text-xs p-2 rounded-sm outline-none focus:border-gold-accent h-9"
                            >
                              {Array.from({ length: isOverrideActive ? 5 : disc.level }).map((_, idx) => (
                                <option key={idx + 1} value={idx + 1} className="bg-bg-card">
                                  {idx + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAddPowerDiscId(null);
                              setNewPowerName("");
                              setNewPowerLevel(1);
                            }}
                            className="text-xs uppercase tracking-wider font-bold text-text-muted hover:text-white px-3 py-1.5 transition-colors cursor-pointer select-none"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={!newPowerName.trim()}
                            onClick={() => handleAddPower(disc.id, newPowerName.trim(), newPowerLevel)}
                            className="bg-burgundy border border-blood-red hover:bg-blood-red text-text-primary disabled:opacity-40 disabled:hover:bg-burgundy text-xs px-4 py-1.5 rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed font-data uppercase font-bold select-none h-8 flex items-center justify-center"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    )}

                    {(status !== "IN_PLAY" || isOverrideActive) && (() => {
                      const isLimitReached = (disc.powers || []).length >= disc.level;
                      const isBypassed = isOverrideActive || chronicle?.systemRules?.allowExtraPowersWithoutDots;
                      const isDisabled = isLimitReached && !isBypassed;
                      
                      if (activeAddPowerDiscId === disc.id) return null;

                      return (
                        <button
                          onClick={() => {
                            setActiveAddPowerDiscId(disc.id);
                            setNewPowerName("");
                            setNewPowerLevel(isOverrideActive ? 1 : Math.max(1, disc.level));
                          }}
                          disabled={isDisabled}
                          className={`text-[10px] uppercase tracking-wider font-bold transition-colors duration-150 pt-1.5 flex items-center space-x-1 select-none ${
                            isDisabled 
                              ? "text-text-muted/20 cursor-not-allowed" 
                              : "text-gold-accent/40 hover:text-gold-accent cursor-pointer"
                          }`}
                          title={isDisabled ? "Limite de poderes atingido para o nível atual de bolinhas." : "Adicionar novo poder"}
                        >
                          <span>+ Adicionar Poder</span>
                          {isDisabled && (
                            <span className="text-[9px] text-hunger-red/70 font-reading tracking-normal ml-1">
                              (limite atingido: {disc.level} bolinhas)
                            </span>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SEÇÃO 5: CONVICÇÕES E PILARES */}
          <section id="conviccoes" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 space-y-6">
            <ConvictionsPanel
              items={character.convictions}
              onChange={(newConvictions) => setCharacter(prev => ({ ...prev, convictions: newConvictions }))}
            />
          </section>

          {/* SEÇÃO 6: VANTAGENS E DEFEITOS */}
          <section id="vantagens" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 space-y-6">
            {(() => {
              const positiveAdvantages = character.advantages.filter(a => a.type === "background" || a.type === "merit");
              const flaws = character.advantages.filter(a => a.type === "flaw");
              const loresheets = character.advantages.filter(a => a.type === "loresheet");

              // Soma acumulada de vantagens positivas (Qualidades & Antecedentes)
              const positiveWithSum = positiveAdvantages.map((adv, idx) => {
                const sumBefore = positiveAdvantages.slice(0, idx).reduce((acc, curr) => acc + curr.level, 0);
                return { ...adv, sumBefore };
              });
              const totalPositiveMeritsSum = positiveAdvantages.reduce((acc, curr) => acc + curr.level, 0);

              // Soma acumulada das Loresheets (que consomem da mesma cota positiva)
              const loresheetsWithSum = loresheets.map((adv, idx) => {
                const sumBefore = totalPositiveMeritsSum + loresheets.slice(0, idx).reduce((acc, curr) => acc + curr.level, 0);
                return { ...adv, sumBefore };
              });

              // Regras por Nível de Poder (Cria / Neófito / Ancila)
              const requiredFlaws = rules.name === "Ancila" ? 4 : 2;
              const totalFlawPoints = flaws.reduce((acc, curr) => acc + curr.level, 0);
              const isFlawsComplete = totalFlawPoints >= requiredFlaws;

              return (
                <>
                  <div className="border-b border-white/5 pb-3 space-y-2">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <h3 className="text-lg font-gothic tracking-wider text-blood-red uppercase flex flex-wrap items-center gap-3">
                        <span>Vantagens, Qualidades, Defeitos & Fichas de Saber</span>
                      </h3>
                      <button
                        onClick={() => setShowV5Guide(!showV5Guide)}
                        className="text-xs font-data text-gold-accent hover:text-white bg-burgundy/30 hover:bg-burgundy/80 border border-gold-accent/30 hover:border-gold-accent px-3 py-1 rounded-xs transition-all duration-150 cursor-pointer flex items-center space-x-1.5 select-none"
                      >
                        <span>📖 {showV5Guide ? "Ocultar Guia V5" : "Guia de Regras V5"}</span>
                      </button>
                    </div>
                    
                    {/* CARD RETRÁTIL DE REGRAS V5 */}
                    {showV5Guide && (
                      <div className="bg-bg-main/70 border border-gold-accent/40 p-4 rounded-sm space-y-3 text-xs font-reading text-text-primary animate-fadeIn mt-2 shadow-[0_0_12px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-between items-center border-b border-gold-accent/20 pb-2">
                          <h4 className="font-gothic uppercase tracking-wider text-gold-accent font-bold flex items-center space-x-1.5 text-sm">
                            <span>📖 Guia Rápido de Vantagens & Defeitos (V5)</span>
                          </h4>
                          <button 
                            onClick={() => setShowV5Guide(false)}
                            className="text-text-muted hover:text-white font-bold text-xs cursor-pointer select-none"
                          >
                            ✕ Fechar
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="space-y-1 bg-white/5 p-3 rounded-xs border border-white/5">
                            <span className="font-bold text-gold-accent block uppercase text-[10px] tracking-wider">🌟 Cotas por Idade:</span>
                            <ul className="list-disc list-inside space-y-1 text-text-muted leading-relaxed">
                              <li><strong className="text-text-primary">Ancila:</strong> 9 pts Vantagens + 4 pts Defeitos</li>
                              <li><strong className="text-text-primary">Neófito:</strong> 7 pts Vantagens + 2 pts Defeitos</li>
                              <li><strong className="text-text-primary">Cria:</strong> 7 pts Vantagens + 2 pts Defeitos</li>
                            </ul>
                          </div>

                          <div className="space-y-1 bg-white/5 p-3 rounded-xs border border-white/5">
                            <span className="font-bold text-blood-red block uppercase text-[10px] tracking-wider">🩸 Defeitos Obrigatórios:</span>
                            <p className="text-text-muted leading-relaxed">
                              Defeitos <strong>NÃO descontam</strong> da cota de 9 (ou 7) pontos positivos. O V5 exige cadastrar o número mínimo de defeitos para equilibrar a ficha.
                            </p>
                          </div>

                          <div className="space-y-1 bg-white/5 p-3 rounded-xs border border-white/5">
                            <span className="font-bold text-purple-400 block uppercase text-[10px] tracking-wider">👑 Limites Recomendados:</span>
                            <p className="text-text-muted leading-relaxed">
                              Recomenda-se no máximo <strong>3 pts</strong> por antecedente na criação padrão. Pontos 4 e 5 indicam cargos lendários (ex: <i>Príncipe ou Primogênito</i>).
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3 CONTADORES SEPARADOS E CLAROS NO CABEÇALHO */}
                    {status === "DRAFT" && characterType !== "npc" && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* CONTADOR 1: VANTAGENS POSITIVAS */}
                        <span className={`text-xs font-data px-2.5 py-1 rounded-xs border uppercase font-bold tracking-wider flex items-center space-x-1 ${
                          alloc.advantagesRemaining === 0
                            ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                            : "bg-amber-950/60 border-amber-500/40 text-amber-400 animate-pulse"
                        }`}>
                          <span>{alloc.advantagesRemaining === 0 ? "🟢 Vantagens: 0 Restantes (Concluído) ✓" : `🟡 Vantagens: ${alloc.advantagesRemaining} ${alloc.advantagesRemaining === 1 ? "ponto restante" : "pontos restantes"}`}</span>
                        </span>

                        {/* CONTADOR 2: DEFEITOS OBRIGATÓRIOS */}
                        <span className={`text-xs font-data px-2.5 py-1 rounded-xs border uppercase font-bold tracking-wider flex items-center space-x-1 ${
                          isFlawsComplete
                            ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                            : "bg-amber-950/60 border-amber-500/40 text-amber-400 animate-pulse"
                        }`}>
                          <span>{isFlawsComplete ? `🟢 Defeitos: ${totalFlawPoints}/${requiredFlaws} Pts (Cumprido) ✓` : `⚠️ Defeitos: ${totalFlawPoints}/${requiredFlaws} Pts (Faltam ${requiredFlaws - totalFlawPoints} pts)`}</span>
                        </span>

                        {/* CONTADOR 3: FICHA DE SABER */}
                        <span className={`text-xs font-data px-2.5 py-1 rounded-xs border uppercase font-bold tracking-wider ${
                          loresheets.length > 0
                            ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
                            : "bg-white/5 border-white/10 text-text-muted"
                        }`}>
                          <span>{loresheets.length > 0 ? `📜 Ficha de Saber: 1/1 (Ativa) ✓` : `📜 Ficha de Saber: 0/1 (Opcional)`}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* BLOCO / COLUNA 1: QUALIDADES & ANTECEDENTES */}
                    <div className="space-y-4 bg-bg-main/20 p-4 border border-white/5 rounded-sm">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-xs font-data uppercase tracking-wider text-gold-accent font-bold">
                          Qualidades & Antecedentes
                        </h4>
                        <span className="text-[10px] text-text-muted font-reading">
                          ({alloc.advantagesRemaining} pts cota)
                        </span>
                      </div>

                      <div className="space-y-3">
                        {positiveWithSum.map(adv => (
                          <div key={adv.id} className="bg-bg-main/40 p-3 border border-white/5 rounded-sm relative group">
                            {(status !== "IN_PLAY" || isOverrideActive) && (
                              <button
                                onClick={() => handleDeleteAdvantage(adv.id)}
                                className="absolute top-3 right-3 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer select-none"
                                title="Excluir"
                              >
                                ✕
                              </button>
                            )}

                            <div className="flex justify-between items-center mb-1 pr-6">
                              <div className="flex flex-col space-y-0.5">
                                <InlineEdit
                                  value={adv.name}
                                  onChange={(val) => handleAdvantageNameChange(adv.id, val)}
                                  placeholder="Nova Vantagem"
                                  datalistOptions={[...V5_ADVANTAGES_PRESETS.merit, ...V5_ADVANTAGES_PRESETS.background]}
                                  disabled={isReadOnly}
                                  className="font-bold text-xs text-text-primary hover:bg-white/5 cursor-pointer max-w-[130px]"
                                />
                                <div className="flex items-center space-x-1.5 flex-wrap">
                                  <span className="text-[9px] uppercase tracking-wider text-text-muted">
                                    {adv.type === "merit" ? "Qualidade" : "Antecedente"}
                                  </span>
                                  {adv.level >= 4 && (
                                    <span 
                                      className="text-[9px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1 py-0 rounded-xs tracking-wider select-none cursor-help"
                                      title="Nota V5: Limite de criação padrão para Neófitos é 3 pts. Níveis 4-5 representam liderança regional (ex: Príncipe/Primogênito). Verifique com seu Narrador."
                                    >
                                      👑 Lendário
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex space-x-1 items-center h-6">
                                {Array.from({ length: 5 }).map((_, idx) => {
                                  const isActive = idx < adv.level;
                                  const isBase = idx < (rules.advantages - adv.sumBefore);
                                  
                                  let activeClass = "";
                                  if (isActive) {
                                    if (isReadOnly) {
                                      activeClass = "bg-hunger-red ring-1 ring-hunger-red/40 shadow-[0_0_8px_rgba(255,92,92,0.5)]";
                                    } else if (isBase) {
                                      activeClass = "bg-blood-red ring-1 ring-blood-red/45 shadow-[0_0_6px_rgba(200,36,52,0.6)]";
                                    } else {
                                      activeClass = "bg-yellow-400 ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(255,223,0,0.9)] animate-pulse-subtle";
                                    }
                                  } else {
                                    activeClass = "bg-bg-input border border-text-dim/80 hover:border-blood-red";
                                  }

                                  return (
                                    <button
                                      key={idx}
                                      disabled={isSheetDisabled}
                                      onClick={() => handleAdvantageLevelChange(adv.id, idx + 1)}
                                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${isSheetDisabled ? "cursor-default" : "cursor-pointer"} ${activeClass}`}
                                      title={`Nível ${idx + 1}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                            
                            <InlineEdit
                              value={adv.description || ""}
                              onChange={(val) => handleAdvantageDescriptionChange(adv.id, val)}
                              placeholder="Descrição..."
                              disabled={isReadOnly}
                              className="text-xs text-text-muted font-reading leading-relaxed w-full block"
                            />
                          </div>
                        ))}
                        {positiveWithSum.length === 0 && (
                          <div className="text-xs text-text-muted/60 italic font-reading py-2">Nenhuma qualidade ou antecedente adicionado.</div>
                        )}
                      </div>

                      {(status !== "IN_PLAY" || isOverrideActive) && (
                        <button
                          onClick={() => handleAddAdvantage("merit")}
                          className="text-xs uppercase tracking-wider font-bold text-gold-accent bg-burgundy/40 hover:bg-burgundy px-3 py-2 rounded-sm border border-blood-red/30 hover:border-blood-red transition-all duration-150 cursor-pointer w-full mt-3 flex items-center justify-center select-none"
                        >
                          + Adicionar Qualidade / Antecedente
                        </button>
                      )}
                    </div>

                    {/* BLOCO / COLUNA 2: DEFEITOS OBRIGATÓRIOS */}
                    <div className="space-y-4 bg-bg-main/20 p-4 border border-white/5 rounded-sm">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-xs font-data uppercase tracking-wider text-blood-red font-bold flex items-center space-x-1">
                          <span>Defeitos Obrigatórios</span>
                        </h4>
                        <span className="text-[10px] text-text-muted font-reading">
                          ({totalFlawPoints}/{requiredFlaws} pts)
                        </span>
                      </div>

                      <div className="space-y-3">
                        {flaws.map(adv => (
                          <div key={adv.id} className="bg-bg-main/40 p-3 border border-white/5 rounded-sm relative group">
                            {(status !== "IN_PLAY" || isOverrideActive) && (
                              <button
                                onClick={() => handleDeleteAdvantage(adv.id)}
                                className="absolute top-3 right-3 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer select-none"
                                title="Excluir"
                              >
                                ✕
                              </button>
                            )}

                            <div className="flex justify-between items-center mb-1 pr-6">
                              <div className="flex flex-col space-y-0.5">
                                <InlineEdit
                                  value={adv.name}
                                  onChange={(val) => handleAdvantageNameChange(adv.id, val)}
                                  placeholder="Novo Defeito"
                                  datalistOptions={V5_ADVANTAGES_PRESETS.flaw}
                                  disabled={isReadOnly}
                                  className="font-bold text-xs text-text-primary hover:bg-white/5 cursor-pointer max-w-[130px]"
                                />
                                <span className="text-[9px] uppercase tracking-wider text-hunger-red font-semibold">
                                  Defeito (Flaw)
                                </span>
                              </div>

                              <div className="flex space-x-1 items-center h-6">
                                {Array.from({ length: 5 }).map((_, idx) => {
                                  const isActive = idx < adv.level;
                                  let activeClass = isActive 
                                    ? "bg-hunger-red ring-1 ring-hunger-red/40 shadow-[0_0_6px_rgba(239,68,68,0.5)]" 
                                    : "bg-bg-input border border-text-dim/80 hover:border-blood-red";

                                  return (
                                    <button
                                      key={idx}
                                      disabled={isSheetDisabled}
                                      onClick={() => handleAdvantageLevelChange(adv.id, idx + 1)}
                                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${isSheetDisabled ? "cursor-default" : "cursor-pointer"} ${activeClass}`}
                                      title={`Nível ${idx + 1}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                            
                            <InlineEdit
                              value={adv.description || ""}
                              onChange={(val) => handleAdvantageDescriptionChange(adv.id, val)}
                              placeholder="Descrição do defeito..."
                              disabled={isReadOnly}
                              className="text-xs text-text-muted font-reading leading-relaxed w-full block"
                            />
                          </div>
                        ))}
                        {flaws.length === 0 && (
                          <div className="text-xs text-amber-400/80 italic font-reading py-2">
                            ⚠️ Exige pelo menos {requiredFlaws} pts em Defeitos.
                          </div>
                        )}
                      </div>

                      {(status !== "IN_PLAY" || isOverrideActive) && (
                        <button
                          onClick={() => handleAddAdvantage("flaw")}
                          className="text-xs uppercase tracking-wider font-bold text-blood-red/80 hover:text-white bg-deep-crimson/30 hover:bg-deep-crimson/80 px-3 py-2 rounded-sm border border-blood-red/30 transition-all duration-150 cursor-pointer w-full mt-3 flex items-center justify-center select-none"
                        >
                          + Adicionar Defeito
                        </button>
                      )}
                    </div>

                    {/* BLOCO / COLUNA 3: FICHA DE SABER (LORESHEET) */}
                    <div className="space-y-4 bg-bg-main/20 p-4 border border-white/5 rounded-sm">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-xs font-data uppercase tracking-wider text-purple-400 font-bold">
                          Ficha de Saber (Loresheet)
                        </h4>
                        <span className="text-[10px] text-text-muted font-reading">
                          ({loresheets.length}/1 máx)
                        </span>
                      </div>

                      <div className="space-y-3">
                        {loresheetsWithSum.map(adv => (
                          <div key={adv.id} className="bg-bg-main/40 p-3 border border-purple-500/20 rounded-sm relative group">
                            {(status !== "IN_PLAY" || isOverrideActive) && (
                              <button
                                onClick={() => handleDeleteAdvantage(adv.id)}
                                className="absolute top-3 right-3 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer select-none"
                                title="Excluir"
                              >
                                ✕
                              </button>
                            )}

                            <div className="flex justify-between items-center mb-1 pr-6">
                              <div className="flex flex-col space-y-0.5">
                                <InlineEdit
                                  value={adv.name}
                                  onChange={(val) => handleAdvantageNameChange(adv.id, val)}
                                  placeholder="Nova Ficha de Saber"
                                  datalistOptions={V5_ADVANTAGES_PRESETS.loresheet}
                                  disabled={isReadOnly}
                                  className="font-bold text-xs text-purple-200 hover:bg-white/5 cursor-pointer max-w-[130px]"
                                />
                                <div className="flex items-center space-x-1.5 flex-wrap">
                                  <span className="text-[9px] uppercase tracking-wider text-purple-400">
                                    Ficha de Saber (Loresheet)
                                  </span>
                                  {adv.level >= 4 && (
                                    <span 
                                      className="text-[9px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1 py-0 rounded-xs tracking-wider select-none cursor-help"
                                      title="Nota V5: Limite de criação padrão para Neófitos é 3 pts. Níveis 4-5 representam liderança regional (ex: Príncipe/Primogênito). Verifique com seu Narrador."
                                    >
                                      👑 Lendário
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex space-x-1 items-center h-6">
                                {Array.from({ length: 5 }).map((_, idx) => {
                                  const isActive = idx < adv.level;
                                  const isBase = idx < (rules.advantages - adv.sumBefore);
                                  
                                  let activeClass = "";
                                  if (isActive) {
                                    if (isReadOnly) {
                                      activeClass = "bg-purple-600 ring-1 ring-purple-400 shadow-[0_0_8px_rgba(147,51,234,0.5)]";
                                    } else if (isBase) {
                                      activeClass = "bg-purple-600 ring-1 ring-purple-400 shadow-[0_0_6px_rgba(147,51,234,0.6)]";
                                    } else {
                                      activeClass = "bg-yellow-400 ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(255,223,0,0.9)] animate-pulse-subtle";
                                    }
                                  } else {
                                    activeClass = "bg-bg-input border border-text-dim/80 hover:border-purple-400";
                                  }

                                  return (
                                    <button
                                      key={idx}
                                      disabled={isSheetDisabled}
                                      onClick={() => handleAdvantageLevelChange(adv.id, idx + 1)}
                                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${isSheetDisabled ? "cursor-default" : "cursor-pointer"} ${activeClass}`}
                                      title={`Nível ${idx + 1}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                            
                            <InlineEdit
                              value={adv.description || ""}
                              onChange={(val) => handleAdvantageDescriptionChange(adv.id, val)}
                              placeholder="Descrição da Ficha..."
                              disabled={isReadOnly}
                              className="text-xs text-text-muted font-reading leading-relaxed w-full block"
                            />
                          </div>
                        ))}
                        {loresheets.length === 0 && (
                          <div className="text-xs text-text-muted/60 italic font-reading py-2">Nenhuma Ficha de Saber selecionada (opcional).</div>
                        )}
                      </div>

                      {(status !== "IN_PLAY" || isOverrideActive) && (
                        <button
                          onClick={() => handleAddAdvantage("loresheet")}
                          disabled={loresheets.length >= 1 && status === "DRAFT" && !isOverrideActive}
                          className="text-xs uppercase tracking-wider font-bold text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 disabled:opacity-40 disabled:hover:bg-purple-950/40 px-3 py-2 rounded-sm border border-purple-500/30 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed w-full mt-3 flex items-center justify-center select-none"
                          title={loresheets.length >= 1 ? "Regra V5: É permitido selecionar apenas 1 Ficha de Saber na criação." : "Adicionar Ficha de Saber"}
                        >
                          + Adicionar Ficha de Saber
                        </button>
                      )}
                    </div>

                  </div>
                </>
              );
            })()}
          </section>

          {/* SEÇÃO 7: INVENTÁRIO */}
          <section id="inventario" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 scroll-mt-24">
            <InventoryManager
              items={character.inventory}
              onChange={(newInventory) => setCharacter(prev => ({ ...prev, inventory: newInventory }))}
            />
          </section>

          {/* SEÇÃO 8: SISTEMA E MACROS */}
          <section id="macros" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 scroll-mt-24 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-6 space-y-4">
                {/* GESTÃO DE EXPERIÊNCIA (XP) */}
                <div className="bg-bg-main/30 border border-white/5 rounded-sm p-4 flex justify-between items-center shadow-none">
                  <div>
                    <h4 className="text-xs font-data uppercase tracking-wider text-gold-accent font-bold">Pontos de Experiência (XP)</h4>
                    <p className="text-[10px] text-text-muted font-reading">Clique nos números para editar o gasto e o total.</p>
                  </div>
                  <div className="flex items-center space-x-2 font-data text-sm">
                    <span className="text-text-muted">Gasto:</span>
                    <InlineEdit
                      value={String(character.status.experience.spent)}
                      onChange={(val) => setCharacter(prev => ({
                        ...prev,
                        status: {
                          ...prev.status,
                          experience: { ...prev.status.experience, spent: Math.max(0, Number(val) || 0) }
                        }
                      }))}
                      type="number"
                      disabled={isReadOnly}
                      className="font-bold text-blood-red hover:bg-white/5 text-center w-12 border-b border-white/10"
                    />
                    <span className="text-text-muted">/</span>
                    <span className="text-text-muted">Total:</span>
                    <InlineEdit
                      value={String(character.status.experience.total)}
                      onChange={(val) => setCharacter(prev => ({
                        ...prev,
                        status: {
                          ...prev.status,
                          experience: { ...prev.status.experience, total: Math.max(0, Number(val) || 0) }
                        }
                      }))}
                      type="number"
                      disabled={isReadOnly}
                      className="font-bold text-gold-accent hover:bg-white/5 text-center w-12 border-b border-white/10"
                    />
                  </div>
                </div>

                {/* BOTÃO DEDICADO DE ROUSE CHECK */}
                <div className="bg-deep-crimson/20 border border-blood-red/40 rounded-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_15px_rgba(200,36,52,0.15)]">
                  <div>
                    <h4 className="text-xs font-data uppercase tracking-wider text-blood-red font-bold flex items-center gap-1.5">
                      <span>🩸</span>
                      <span>Teste de Despertar (Rouse Check 1d10)</span>
                    </h4>
                    <p className="text-[10px] text-text-muted font-reading">
                      Rola o 1d10 de Fome. Se tirar 1 a 5, aumenta a Fome da ficha automaticamente (+1).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRouseCheckSolo}
                    className="shrink-0 bg-deep-crimson/80 border border-blood-red text-white hover:bg-blood-red font-bold text-xs uppercase px-4 py-2.5 rounded-sm shadow-[0_0_10px_rgba(200,36,52,0.4)] flex items-center justify-center space-x-2 cursor-pointer transition-all duration-150 active:scale-95 select-none"
                  >
                    <span>🩸</span>
                    <span>Rolar Rouse Check</span>
                  </button>
                </div>

                {/* CABEÇALHO DE MACROS & BOTÕES DE AÇÃO */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-2 gap-2">
                  <h3 className="text-sm font-data uppercase tracking-wider text-gold-accent font-semibold">
                    Macros de Dados Disponíveis
                  </h3>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleGeneratePresets}
                      className="text-[10px] uppercase font-bold tracking-wider text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 px-2.5 py-1.5 rounded-sm transition-all duration-150 cursor-pointer flex items-center gap-1"
                      title="Preencher com 1-clique as 5 macros essenciais V5 (Ataque, Tiro, Esquiva, Percepção e Furtividade)"
                    >
                      <span>⚡ Presets V5</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCreatingMacro(!isCreatingMacro)}
                      className="text-[10px] uppercase font-bold tracking-wider text-gold-accent bg-gold-accent/10 hover:bg-gold-accent/20 border border-gold-accent/40 px-2.5 py-1.5 rounded-sm transition-all duration-150 cursor-pointer flex items-center gap-1"
                    >
                      <span>{isCreatingMacro ? "✕ Cancelar" : "+ Criar Macro"}</span>
                    </button>
                  </div>
                </div>

                {/* FORMULÁRIO INLINE DE CRIAÇÃO DE MACRO */}
                {isCreatingMacro && (
                  <div className="bg-bg-main/60 border border-gold-accent/30 p-4 rounded-sm space-y-3 animate-fade-in">
                    <h4 className="text-xs font-data uppercase tracking-wider text-gold-accent font-bold">
                      Nova Macro de Rolagem
                    </h4>
                    
                    <div className="space-y-2 font-data text-xs">
                      <div>
                        <label className="text-[10px] uppercase text-text-muted block mb-1">Nome da Macro</label>
                        <input
                          type="text"
                          placeholder="Ex: Golpe de Espada, Encantar Multidão..."
                          value={newMacroName}
                          onChange={(e) => setNewMacroName(e.target.value)}
                          className="w-full bg-bg-input border border-white/10 rounded p-2 text-text-primary outline-none focus:border-gold-accent font-reading text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase text-text-muted block mb-1">1º Dado (Atributo)</label>
                          <select
                            value={selectedAttribute}
                            onChange={(e) => setSelectedAttribute(e.target.value)}
                            className="w-full bg-bg-input border border-white/10 rounded p-2 text-text-primary outline-none focus:border-gold-accent font-reading text-xs cursor-pointer"
                          >
                            <optgroup label="Físicos">
                              <option value="strength">Força</option>
                              <option value="dexterity">Destreza</option>
                              <option value="stamina">Vigor</option>
                            </optgroup>
                            <optgroup label="Sociais">
                              <option value="charisma">Carisma</option>
                              <option value="manipulation">Manipulação</option>
                              <option value="composure">Autocontrole</option>
                            </optgroup>
                            <optgroup label="Mentais">
                              <option value="intelligence">Inteligência</option>
                              <option value="wits">Raciocínio</option>
                              <option value="resolve">Determinação</option>
                            </optgroup>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase text-text-muted block mb-1">2º Dado (Habilidade / Disciplina)</label>
                          <select
                            value={selectedSkillOrDiscipline}
                            onChange={(e) => setSelectedSkillOrDiscipline(e.target.value)}
                            className="w-full bg-bg-input border border-white/10 rounded p-2 text-text-primary outline-none focus:border-gold-accent font-reading text-xs cursor-pointer"
                          >
                            <optgroup label="Habilidades Físicas">
                              <option value="athletics">Atletismo</option>
                              <option value="brawl">Briga</option>
                              <option value="craft">Ofícios</option>
                              <option value="drive">Condução</option>
                              <option value="firearms">Armas de Fogo</option>
                              <option value="melee">Armas Brancas</option>
                              <option value="larceny">Ladroagem</option>
                              <option value="stealth">Furtividade</option>
                              <option value="survival">Sobrevivência</option>
                            </optgroup>
                            <optgroup label="Habilidades Sociais">
                              <option value="animal_ken">Empatia com Animais</option>
                              <option value="etiquette">Etiqueta</option>
                              <option value="insight">Sagacidade</option>
                              <option value="intimidation">Intimidação</option>
                              <option value="leadership">Liderança</option>
                              <option value="performance">Performance</option>
                              <option value="persuasion">Persuasão</option>
                              <option value="streetwise">Manha</option>
                              <option value="subterfuge">Subterfúgio</option>
                            </optgroup>
                            <optgroup label="Habilidades Mentais">
                              <option value="academics">Erudição</option>
                              <option value="awareness">Percepção</option>
                              <option value="finance">Finanças</option>
                              <option value="investigation">Investigação</option>
                              <option value="medicine">Medicina</option>
                              <option value="occult">Ocultismo</option>
                              <option value="politics">Política</option>
                              <option value="science">Ciência</option>
                              <option value="technology">Tecnologia</option>
                            </optgroup>
                            {character.disciplines && character.disciplines.length > 0 && (
                              <optgroup label="Disciplinas Ativas">
                                {character.disciplines.map(d => (
                                  <option key={d.id} value={d.id}>{d.name} (Nv {d.level})</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="checkbox"
                          id="rouse_check_toggle"
                          checked={rouseCheckToggle}
                          onChange={(e) => setRouseCheckToggle(e.target.checked)}
                          className="w-4 h-4 accent-blood-red cursor-pointer"
                        />
                        <label htmlFor="rouse_check_toggle" className="text-xs text-text-primary cursor-pointer select-none">
                          Exigir Teste de Despertar (Rouse Check) nesta macro
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setIsCreatingMacro(false)}
                        className="px-3 py-1.5 border border-white/10 text-text-muted hover:text-white text-xs font-data uppercase tracking-wider rounded-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveMacro}
                        className="px-4 py-1.5 bg-burgundy border border-blood-red text-white text-xs font-bold font-data uppercase tracking-wider rounded-xs hover:bg-blood-red transition-all duration-150 cursor-pointer shadow-md"
                      >
                        Salvar Macro
                      </button>
                    </div>
                  </div>
                )}

                {/* GRADE DE MACROS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {character.macros.map(mac => (
                    <div
                      key={mac.id}
                      className="bg-bg-main border border-blood-red/40 hover:border-blood-red hover:bg-burgundy/10 p-3 rounded-sm transition-all duration-150 group flex flex-col justify-between h-24 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteMacro(mac.id)}
                        className="absolute top-2 right-2 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer p-1 text-xs select-none"
                        title="Excluir Macro"
                      >
                        ✕
                      </button>

                      <div 
                        onClick={() => triggerRoll(mac)}
                        className="space-y-0.5 cursor-pointer pr-5"
                      >
                        <span className="font-data uppercase tracking-wider text-xs font-bold text-text-primary group-hover:text-gold-accent transition-colors block truncate">
                          {mac.name}
                        </span>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {mac.pool.map((p, pIdx) => (
                            <span key={pIdx} className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[8px] text-text-muted font-data uppercase">
                              {TECHNICAL_NAMES[p] || (character.disciplines?.find(d => d.id === p)?.name) || p}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div 
                        onClick={() => triggerRoll(mac)}
                        className="flex justify-between items-center w-full text-[9px] uppercase tracking-wider font-semibold pt-2 border-t border-white/5 text-text-dim group-hover:text-text-muted transition-colors cursor-pointer select-none"
                      >
                        <span>Rolagem D10</span>
                        {mac.rouse_check && <span className="text-gold-accent font-bold">🩸 + Despertar</span>}
                      </div>
                    </div>
                  ))}
                  {character.macros.length === 0 && (
                    <div className="col-span-full text-center py-6 border border-dashed border-white/10 rounded-sm text-xs text-text-muted italic">
                      Nenhuma macro criada. Clique no botão acima para adicionar presets V5 ou criar uma macro personalizada.
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4">
                  <h4 className="text-xs font-data uppercase tracking-wider text-text-muted font-bold">Anotações do Narrador & Histórico</h4>
                  <textarea
                    value={character.notes}
                    onChange={(e) => setCharacter(prev => ({ ...prev, notes: e.target.value }))}
                    disabled={isReadOnly}
                    className="w-full h-32 bg-bg-main border border-white/10 rounded p-3 text-sm font-reading text-text-primary focus:border-gold-accent outline-none resize-none transition-colors duration-150 disabled:opacity-60"
                    placeholder="Histórico livre, anotações de NPCs e metas..."
                  />
                </div>
              </div>

              <div className="lg:col-span-6 bg-bg-main border border-white/10 rounded-sm p-4 space-y-4 min-h-75 flex flex-col justify-between">
                
                {!rollResult ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2 text-text-dim">
                    <svg className="w-12 h-12 text-text-dim/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="font-data uppercase tracking-wider text-xs">Aguardando Rolagem</p>
                    <p className="text-xs font-reading max-w-xs">Clique em qualquer uma das macros à esquerda para disparar a rolagem de dados com base na matemática de Fome e Atributos.</p>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1">
                    <div className="border-b border-white/10 pb-2 flex justify-between items-center">
                      <span className="font-data uppercase tracking-wider text-xs text-gold-accent font-bold">
                        Resultado da Ação
                      </span>
                      <button 
                        onClick={() => setRollResult(null)}
                        className="text-[10px] uppercase tracking-widest text-text-muted hover:text-white cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-gothic text-2xl text-blood-red tracking-wide uppercase leading-none">
                        {rollResult.macroName}
                      </h4>
                      <p className="text-xs text-text-muted font-data uppercase">
                        Pool Sorteado: {rollResult.totalPool} Dados • Sucessos Totais: <span className="text-text-primary font-bold">{rollResult.successes}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 py-3 bg-bg-card/40 p-3 border border-white/5 rounded-sm">
                      {rollResult.diceList.map((d, dIdx) => {
                        const isHunger = d.type === "hunger";
                        const isTen = d.value === 10;
                        const isOne = d.value === 1;
                        
                        let bgStyle = "bg-bg-main border-blood-red text-text-primary";
                        let ringStyle = "";

                        if (isHunger) {
                          bgStyle = "bg-hunger-red border-white text-bg-main font-bold";
                          if (isTen) ringStyle = "ring-2 ring-gold-accent shadow-[0_0_10px_rgba(255,216,77,0.8)]";
                          else if (isOne) ringStyle = "ring-2 ring-deep-crimson shadow-[0_0_10px_rgba(128,0,8,0.8)] animate-pulse";
                        } else {
                          if (isTen) {
                            bgStyle = "bg-gold-accent border-gold-accent text-bg-main font-bold";
                            ringStyle = "ring-2 ring-gold-accent/40 shadow-[0_0_8px_rgba(255,216,77,0.5)]";
                          }
                        }

                        return (
                          <div
                            key={dIdx}
                            className={`w-9 h-9 border rounded-sm flex items-center justify-center font-data text-sm tracking-tighter ${bgStyle} ${ringStyle}`}
                          >
                            {isTen ? "10" : d.value}
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-2">
                      {rollResult.isMessianic && (
                        <div className="p-3 bg-gold-accent/10 border border-gold-accent/40 rounded-sm text-xs text-gold-accent font-reading">
                          <strong>Crítico Messiânico (Messianic Critical)!</strong> O Sangue atendeu ao seu comando com força irresistível. Um sucesso espetacular com consequências dramáticas atreladas ao seu clã.
                        </div>
                      )}
                      {rollResult.isBestial && (
                        <div className="p-3 bg-deep-crimson/10 border border-deep-crimson/40 rounded-sm text-xs text-hunger-red font-reading">
                          <strong>Falha Bestial (Bestial Failure)!</strong> Seus instintos monstruosos afloraram. Você falhou na ação e a Besta tomou o controle parcial de sua mente ou atitudes temporariamente.
                        </div>
                      )}
                      {!rollResult.isMessianic && rollResult.isCritical && (
                        <div className="p-3 bg-bg-card border border-gold-accent/20 rounded-sm text-xs text-gold-accent font-reading">
                          <strong>Sucesso Crítico!</strong> Resultados excepcionais alcançados.
                        </div>
                      )}
                      {rollResult.successes > 0 && !rollResult.isMessianic && !rollResult.isBestial && (
                        <div className="p-3 bg-bg-card border border-white/10 rounded-sm text-xs text-text-muted font-reading">
                          A ação obteve <strong>{rollResult.successes}</strong> sucesso(s).
                        </div>
                      )}
                      {rollResult.successes === 0 && !rollResult.isBestial && (
                        <div className="p-3 bg-deep-crimson/5 border border-deep-crimson/10 rounded-sm text-xs text-text-dim font-reading">
                          A rolagem falhou. Nenhum sucesso foi obtido.
                        </div>
                      )}
                    </div>

                  </div>
                )}
                
                <div className="text-[10px] text-text-dim border-t border-white/5 pt-3 leading-snug font-sans">
                  * A rolagens do V5 consideram sucessos dados de valor 6 ou maior. Pares de 10 geram sucessos críticos (+2 adicionais). Dados de Fome podem gerar falhas bestiais ou vitórias messiânicas.
                </div>

              </div>

            </div>
          </section>

          {/* SEÇÃO 9: DIÁRIO DE XP */}
          <section id="xp_diary" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 scroll-mt-24 space-y-6">
            <div>
              <h3 className="text-lg font-gothic tracking-wider text-blood-red uppercase">
                Livro-Razão de Auditoria de Experiência (XP)
              </h3>
              <p className="text-xs text-text-muted font-reading">
                Registro histórico completo de todos os gastos, devoluções e transações financeiras de pontos de XP deste personagem na crônica.
              </p>
            </div>
            
            {isLoadingLedger ? (
              <div className="text-center py-12 text-text-muted animate-pulse font-data uppercase tracking-wider text-xs">
                Carregando diário de XP...
              </div>
            ) : xpLedger.length === 0 ? (
              <div className="text-center py-12 border border-white/5 bg-bg-main/20 rounded-sm text-text-dim/60 italic text-sm font-reading">
                Nenhum lançamento de XP registrado neste personagem até o momento.
              </div>
            ) : (
              <div className="overflow-x-auto border border-white/10 rounded-sm bg-bg-main/30">
                <table className="w-full text-left border-collapse font-data text-xs uppercase">
                  <thead>
                    <tr className="border-b border-white/10 bg-bg-card-dark text-text-muted">
                      <th className="p-3 tracking-wider font-bold">Data / Hora</th>
                      <th className="p-3 tracking-wider font-bold">Descrição da Alteração</th>
                      <th className="p-3 tracking-wider font-bold text-right">Lançamento (XP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {xpLedger.map((item) => {
                      const dateFormatted = new Date(item.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                      const isNegative = item.xpChange < 0;
                      return (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 text-text-muted whitespace-nowrap">{dateFormatted}</td>
                          <td className="p-3 text-text-primary font-reading normal-case">{item.description}</td>
                          <td className={`p-3 font-bold text-right text-sm ${isNegative ? "text-hunger-red" : "text-emerald-400"}`}>
                            {isNegative ? "" : "+"}{item.xpChange} XP
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </div>

      {/* MODAL GÓTICO DE CONFIRMAÇÃO DE EVOLUÇÃO POR XP */}
      {isEvolutionModalOpen && evolutionTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-blood-red/45 max-w-md w-full p-6 rounded-sm shadow-[0_0_20px_rgba(139,0,0,0.25)] space-y-4">
            <div className="border-b border-white/10 pb-2">
              <h3 className="text-lg font-gothic tracking-wider text-blood-red uppercase">
                Confirmar Evolução por XP
              </h3>
              <p className="text-[10px] text-text-muted font-data uppercase">
                Gasto Auditável de Pontos
              </p>
            </div>

            <div className="bg-bg-main/50 p-3 rounded border border-white/5 space-y-2 text-xs font-reading">
              <div className="flex justify-between">
                <span className="text-text-muted">Característica:</span>
                <span className="text-text-primary font-bold uppercase tracking-wider">
                  {TECHNICAL_NAMES[evolutionTarget.traitName] || evolutionTarget.traitName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Transição de Nível:</span>
                <span className="text-text-primary">
                  {evolutionTarget.currentValue} ➔ <strong className="text-gold-accent">{evolutionTarget.newLevel}</strong>
                </span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2 font-data">
                <span className="text-text-muted">Custo de XP:</span>
                <span className="text-hunger-red font-bold">{evolutionTarget.costXp} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Saldo Atual:</span>
                <span className="text-emerald-400 font-bold">{xpBalance} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Saldo Pós-Compra:</span>
                <span className="text-text-primary font-bold">{xpBalance - evolutionTarget.costXp} XP</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-text-muted font-data uppercase tracking-wider block font-bold">
                Justificativa Narrativa (Mínimo de 15 caracteres)
              </label>
              <textarea
                value={evolutionJustification}
                onChange={(e) => {
                  setEvolutionJustification(e.target.value);
                  if (evolutionError && e.target.value.trim().length >= 15) {
                    setEvolutionError(null);
                  }
                }}
                disabled={evolutionLoading}
                placeholder="Ex: Treinei combate nas docas com Thomas durante o hiato da coterie (mínimo de 15 caracteres)..."
                className="w-full h-24 bg-bg-main border border-white/10 rounded p-2.5 text-xs font-reading text-text-primary focus:border-blood-red outline-none resize-none transition-colors duration-150 disabled:opacity-50"
              />
              <span className="text-[10px] text-text-dim text-right block">
                Caracteres: {evolutionJustification.length} / 15
              </span>
            </div>

            {evolutionError && (
              <div className="p-2.5 bg-hunger-red/10 border border-hunger-red/30 rounded-xs text-xs text-hunger-red font-reading">
                ⚠️ {evolutionError}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEvolutionModalOpen(false)}
                disabled={evolutionLoading}
                className="px-4 py-2 border border-white/10 rounded-sm text-xs font-data uppercase tracking-wider text-text-muted hover:text-white transition-colors cursor-pointer disabled:cursor-not-allowed select-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmEvolution}
                disabled={evolutionLoading || evolutionJustification.trim().length < 15}
                className="px-4 py-2 bg-burgundy border border-blood-red text-text-primary disabled:opacity-40 disabled:hover:bg-burgundy text-xs font-bold font-data uppercase tracking-wider rounded-sm hover:bg-blood-red transition-all duration-150 shadow-[0_0_8px_rgba(200,36,52,0.2)] cursor-pointer disabled:cursor-not-allowed select-none"
              >
                {evolutionLoading ? "Evoluindo..." : "Confirmar Evolução"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DOCK FLUTUANTE DE PROGRESSO DA FICHA (CRIAÇÃO) */}
      {status === "DRAFT" && characterType !== "npc" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-bg-card-dark/95 border border-gold-accent/40 rounded-full px-5 py-2.5 shadow-[0_0_25px_rgba(0,0,0,0.9)] backdrop-blur-md flex items-center gap-4 text-xs font-data select-none max-w-[95vw] overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-3 shrink-0">
            <span className={alloc.attributesRemaining === 0 ? "text-emerald-400 font-bold flex items-center gap-1" : "text-amber-400 flex items-center gap-1"}>
              Atributos {alloc.attributesRemaining === 0 ? "✓" : `(${alloc.attributesRemaining})`}
            </span>
            <span className="text-white/20">•</span>
            <span className={alloc.skillsRemaining === 0 ? "text-emerald-400 font-bold flex items-center gap-1" : "text-amber-400 flex items-center gap-1"}>
              Habilidades {alloc.skillsRemaining === 0 ? "✓" : `(${alloc.skillsRemaining})`}
            </span>
            <span className="text-white/20">•</span>
            <span className={alloc.disciplinesRemaining === 0 ? "text-emerald-400 font-bold flex items-center gap-1" : "text-amber-400 flex items-center gap-1"}>
              Disciplinas {alloc.disciplinesRemaining === 0 ? "✓" : `(${alloc.disciplinesRemaining})`}
            </span>
            <span className="text-white/20">•</span>
            <span className={alloc.advantagesRemaining === 0 ? "text-emerald-400 font-bold flex items-center gap-1" : "text-amber-400 flex items-center gap-1"}>
              Vantagens {alloc.advantagesRemaining === 0 ? "✓" : `(${alloc.advantagesRemaining})`}
            </span>
          </div>

          {alloc.attributesRemaining === 0 && alloc.skillsRemaining === 0 && alloc.disciplinesRemaining === 0 && alloc.advantagesRemaining === 0 && (
            <button
              onClick={async () => {
                setStatus("READY");
                const response = await updateCharacterSheet(characterId, character, buildStateRef.current, "READY");
                if (response.success) {
                  showSuccess("Ficha concluída com sucesso e guardada no cofre!", "Personagem Concluído");
                } else {
                  showError("Erro ao concluir ficha: " + response.error);
                }
              }}
              className="shrink-0 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider rounded-full shadow-[0_0_12px_rgba(52,211,153,0.4)] transition-all duration-200 cursor-pointer animate-bounce flex items-center gap-1.5"
            >
              <span>Concluir Ficha</span>
              <span>🎯</span>
            </button>
          )}
        </div>
      )}

      {/* MODAL GÓTICO DE ALTERAÇÃO DA FOTO DE PERFIL */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-bg-card border border-gold-accent/40 max-w-md w-full p-6 rounded-sm shadow-[0_0_30px_rgba(0,0,0,0.9)] space-y-4 font-data">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-gothic tracking-wider text-gold-accent uppercase flex items-center gap-2">
                <span>📷 Alterar Foto do Personagem</span>
              </h3>
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="text-text-muted hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-text-muted font-bold block">
                Link/URL da Imagem (JPEG, PNG, WebP)
              </label>
              <input 
                type="text"
                placeholder="https://exemplo.com/minha-foto.png"
                value={avatarUrlInput}
                onChange={(e) => {
                  setAvatarUrlInput(e.target.value);
                  setAvatarImageError(false);
                }}
                className="w-full bg-bg-input border border-white/15 text-text-primary text-xs p-2.5 rounded-sm outline-none focus:border-gold-accent font-reading"
              />

              {/* PRÉ-VISUALIZAÇÃO DA FOTO */}
              <div className="pt-2 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase text-text-dim mb-2">Pré-visualização:</span>
                <div className="w-24 h-24 rounded-full border-2 border-gold-accent/40 bg-black overflow-hidden flex items-center justify-center shadow-inner">
                  {avatarUrlInput.trim() && !avatarImageError ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={avatarUrlInput.trim()} 
                      alt="Preview Avatar"
                      className="w-full h-full object-cover object-center"
                      onError={() => setAvatarImageError(true)}
                    />
                  ) : (
                    <div className="text-center p-2">
                      <span className="text-xs text-text-dim">
                        {avatarImageError ? "⚠️ Link inválido ou bloqueado (CORS)" : "Nenhuma foto"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              {(character.profile.avatarUrl || character.profile.portrait_url) ? (
                <button
                  type="button"
                  onClick={() => {
                    handleProfileChange("avatarUrl", "");
                    handleProfileChange("portrait_url", "");
                    setAvatarUrlInput("");
                    setAvatarImageError(false);
                    setIsAvatarModalOpen(false);
                    showSuccess("Foto de perfil removida com sucesso!");
                  }}
                  className="px-3 py-1.5 border border-hunger-red/40 text-hunger-red hover:bg-hunger-red/10 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                >
                  Remover Foto
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="px-3 py-1.5 border border-white/10 text-text-muted hover:text-white text-xs uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = avatarUrlInput.trim();
                    handleProfileChange("avatarUrl", trimmed);
                    handleProfileChange("portrait_url", trimmed);
                    setAvatarImageError(false);
                    setIsAvatarModalOpen(false);
                    showSuccess("Foto de perfil atualizada com sucesso!");
                  }}
                  className="px-4 py-1.5 bg-burgundy border border-blood-red text-white text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-blood-red transition-colors cursor-pointer shadow-md"
                >
                  Salvar Foto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
