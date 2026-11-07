"use client";

import React, { useState, useEffect } from "react";
import {
  CharacterSheetData,
  Specialty,
  Discipline,
  Advantage,
  RollMacro,
  CharacterSkills,
  getMaxHealth,
  getMaxWillpower,
  getPredatorSlug,
  PREDATOR_TYPES,
  DISCIPLINE_KEY_TO_NAME,
  AcquiredPower
} from "@/types/character";
import DotSlider from "@/components/sheet/DotSlider";
import InlineEdit from "@/components/sheet/InlineEdit";
import AttributeGroup from "@/components/sheet/AttributeGroup";
import SkillGroup from "@/components/sheet/SkillGroup";
import ConvictionsPanel from "@/components/sheet/ConvictionsPanel";
import ProfileHeaderSection from "@/components/sheet/ProfileHeaderSection";
import CreationProgressHUD from "@/components/sheet/CreationProgressHUD";
import { updateCharacterSheet } from "@/app/actions/characterActions";
import { spendCharacterXpAction } from "@/app/actions/xpActions";
import { useToast } from "@/context/ToastContext";

export const CLAN_OPTIONS = [
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

export const CLAN_DISCIPLINE_MAPPING: Record<string, string[]> = {
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

export const CLAN_BANE_MAPPING: Record<string, string> = {
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

export const PREDATOR_OPTIONS = [
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

export const TECHNICAL_NAMES: Record<string, string> = {
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

export function generateRandomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const V5_RECOMMENDED_MACROS: RollMacro[] = [
  { id: "preset_melee", name: "🗡️ Ataque Corpo a Corpo", pool: ["strength", "brawl"], rouse_check: false },
  { id: "preset_firearms", name: "🎯 Tiro de Precisão", pool: ["dexterity", "firearms"], rouse_check: false },
  { id: "preset_dodge", name: "🏃 Esquiva & Evasão", pool: ["dexterity", "athletics"], rouse_check: false },
  { id: "preset_perception", name: "👁️ Percepção Aguçada", pool: ["wits", "awareness"], rouse_check: false },
  { id: "preset_stealth", name: "👤 Furtividade", pool: ["dexterity", "stealth"], rouse_check: false },
];

export function executeSimulationRoll(
  macro: RollMacro,
  character: CharacterSheetData
) {
  let poolSize = 0;
  
  const physical = character.attributes?.physical as unknown as Record<string, number> | undefined;
  const social = character.attributes?.social as unknown as Record<string, number> | undefined;
  const mental = character.attributes?.mental as unknown as Record<string, number> | undefined;
  const skills = character.skills as unknown as Record<string, number> | undefined;

  macro.pool.forEach(key => {
    if (physical && physical[key] !== undefined) {
      poolSize += physical[key];
    } else if (social && social[key] !== undefined) {
      poolSize += social[key];
    } else if (mental && mental[key] !== undefined) {
      poolSize += mental[key];
    } else if (skills && skills[key] !== undefined) {
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

  const hunger = character.status?.hunger || 0;
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

export const POWER_LEVEL_OPTIONS = ["Cria", "Neófito", "Ancila"];

export const PREDATOR_SPECIALTY_MAP: Record<string, { skill: keyof CharacterSkills; name: string }[]> = {
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

export const DISCIPLINE_OPTIONS = [
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

export const V5_ADVANTAGES_PRESETS = {
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

export function getPowerLevelRules(concept: string) {
  const normalized = String(concept).toLowerCase().trim();
  if (normalized === "cria" || normalized === "fledgling") {
    return { name: "Cria", disciplines: 2, advantages: 7, bloodPotency: 0, maxDiscLevelInCreation: 2 };
  }
  if (normalized === "ancila" || normalized === "ancillae") {
    return { name: "Ancila", disciplines: 5, advantages: 9, bloodPotency: 2, maxDiscLevelInCreation: 3 };
  }
  return { name: "Neófito", disciplines: 3, advantages: 7, bloodPotency: 1, maxDiscLevelInCreation: 2 };
}

export function calculateBaseAndXp(charData: CharacterSheetData) {
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

export interface V5SheetViewProps {
  character: CharacterSheetData;
  onUpdateCharacter: React.Dispatch<React.SetStateAction<CharacterSheetData>>;
  isStoryteller: boolean;
  disabled: boolean;
  isEvolvingMode: boolean;
  characterId?: string;
  onOpenAvatarModal?: () => void;
  characterType?: "jogador" | "npc" | "coterie";
  status?: "DRAFT" | "READY" | "IN_PLAY";
  isOverrideActive?: boolean;
  onToggleOverride?: () => void;
  dicePool?: Array<{ id: string; label: string; value: number }>;
  onTraitClick?: (trait: { id: string; label: string; value: number }) => void;
}

export default function V5SheetView({
  character,
  onUpdateCharacter,
  isStoryteller,
  disabled,
  isEvolvingMode,
  characterId = "",
  onOpenAvatarModal,
  characterType = "jogador",
  status = "DRAFT",
  isOverrideActive = false,
  onToggleOverride,
  dicePool = [],
  onTraitClick
}: V5SheetViewProps) {
  const { showSuccess, showWarning, showError } = useToast();

  const [activeAddPowerDiscId, setActiveAddPowerDiscId] = useState<string | null>(null);
  const [newPowerName, setNewPowerName] = useState("");
  const [newPowerLevel, setNewPowerLevel] = useState<number>(1);
  const [showV5Guide, setShowV5Guide] = useState(false);

  // Mini-formulário de Especializações
  const [selectedSkill, setSelectedSkill] = useState<keyof CharacterSkills | "">("");
  const [newSpecialtyName, setNewSpecialtyName] = useState("");
  const [specialtySource, setSpecialtySource] = useState<string>("1ª Grátis");

  // Modal de Evolução por XP
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

  // Modal do Predador
  const [isLocking, setIsLocking] = useState(false);

  // Cálculos dinâmicos de cotas e regras
  const alloc = calculateBaseAndXp(character);
  const rules = getPowerLevelRules(character.profile?.concept || "Neófito");

  const isReadOnly = disabled && !isOverrideActive;
  const isSheetDisabled = isReadOnly && !isEvolvingMode;

  // Sincronizar trilhas máximas de vitalidade e força de vontade
  useEffect(() => {
    const computedMaxHealth = getMaxHealth(character);
    const computedMaxWillpower = getMaxWillpower(character);

    if (
      computedMaxHealth !== character.status?.health?.max ||
      computedMaxWillpower !== character.status?.willpower?.max
    ) {
      onUpdateCharacter((prev) => ({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    character.attributes?.physical?.stamina,
    character.attributes?.social?.composure,
    character.attributes?.mental?.resolve,
    character.disciplines,
    character.status?.health?.max,
    character.status?.willpower?.max,
    onUpdateCharacter,
  ]);

  // Automação e Avanço de Cotas de Especialização
  useEffect(() => {
    if (status !== "DRAFT" || !character.skills) return;

    const has1st = (character.specialties || []).some(s => s.source === "1ª Grátis");
    const has2nd = (character.specialties || []).some(s => s.source === "2ª Grátis");
    const hasPred = (character.specialties || []).some(s => s.source === "Predador");

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

  // Modal de confirmação de evolução
  const openEvolutionConfirmModal = (
    traitName: string,
    traitType: "attribute" | "skill" | "discipline" | "advantage" | "humanity" | "blood_potency",
    newLevel: number,
    currentValue: number
  ) => {
    let costMultiplier = 5;
    if (traitType === "attribute") costMultiplier = 5;
    if (traitType === "skill") costMultiplier = 3;
    if (traitType === "discipline") {
      const clan = character.profile?.clan || "Sem Clã";
      const clanDisciplines = CLAN_DISCIPLINE_MAPPING[clan] || [];
      const isClanDisc = clanDisciplines.some(d => traitName.toLowerCase().includes(d.split(" ")[0].toLowerCase()));
      const isCaitiff = clan === "Caitiff" || clan === "Sem Clã";
      costMultiplier = isCaitiff ? 6 : (isClanDisc ? 5 : 7);
    }
    if (traitType === "advantage") costMultiplier = 3;
    if (traitType === "blood_potency" || traitType === "humanity") costMultiplier = 10;

    let totalCost = 0;
    for (let lvl = currentValue + 1; lvl <= newLevel; lvl++) {
      totalCost += lvl * costMultiplier;
    }

    setEvolutionTarget({
      traitName,
      traitType,
      newLevel,
      currentValue,
      costXp: totalCost
    });
    setEvolutionJustification("");
    setEvolutionError(null);
    setIsEvolutionModalOpen(true);
  };

  const handleConfirmEvolution = async () => {
    if (!evolutionTarget) return;
    if (evolutionJustification.trim().length < 15) {
      setEvolutionError("A justificativa narrativa deve ter no mínimo 15 caracteres.");
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
        showSuccess(`Evolução de ${TECHNICAL_NAMES[evolutionTarget.traitName] || evolutionTarget.traitName} confirmada!`);
        setIsEvolutionModalOpen(false);
        setEvolutionJustification("");
        setEvolutionTarget(null);

        // Atualizar o valor na ficha localmente
        if (evolutionTarget.traitType === "attribute") {
          onUpdateCharacter(prev => {
            const next = { ...prev };
            const attrKey = evolutionTarget.traitName;
            if ((next.attributes.physical as any)[attrKey] !== undefined) {
              (next.attributes.physical as any)[attrKey] = evolutionTarget.newLevel;
            } else if ((next.attributes.social as any)[attrKey] !== undefined) {
              (next.attributes.social as any)[attrKey] = evolutionTarget.newLevel;
            } else if ((next.attributes.mental as any)[attrKey] !== undefined) {
              (next.attributes.mental as any)[attrKey] = evolutionTarget.newLevel;
            }
            return next;
          });
        } else if (evolutionTarget.traitType === "skill") {
          onUpdateCharacter(prev => ({
            ...prev,
            skills: {
              ...prev.skills,
              [evolutionTarget.traitName]: evolutionTarget.newLevel
            }
          }));
        } else if (evolutionTarget.traitType === "discipline") {
          onUpdateCharacter(prev => ({
            ...prev,
            disciplines: prev.disciplines.map(d =>
              d.name.toLowerCase() === evolutionTarget.traitName.toLowerCase()
                ? { ...d, level: evolutionTarget.newLevel }
                : d
            )
          }));
        } else if (evolutionTarget.traitType === "blood_potency") {
          onUpdateCharacter(prev => ({
            ...prev,
            status: { ...prev.status, blood_potency: evolutionTarget.newLevel }
          }));
        } else if (evolutionTarget.traitType === "humanity") {
          onUpdateCharacter(prev => ({
            ...prev,
            status: { ...prev.status, humanity: evolutionTarget.newLevel }
          }));
        }
      } else {
        setEvolutionError(res.error || "Erro ao processar compra de evolução.");
      }
    } catch {
      setEvolutionError("Erro inesperado ao processar evolução.");
    } finally {
      setEvolutionLoading(false);
    }
  };

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
        }
      }
    }

    onUpdateCharacter((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [category]: {
          ...prev.attributes[category],
          [attrName]: value,
        },
      },
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
          Object.entries(character.skills).forEach(([k, v]) => allSkills.push({ key: k, val: Number(v) || 0 }));
        }
        const otherSkillsWith4OrMore = allSkills.filter(s => s.key !== skillName && s.val >= 4);
        if (otherSkillsWith4OrMore.length > 0) {
          showWarning(
            "Regra V5 - Habilidades: Na criação base, você só pode ter 1 Habilidade em nível 4. Distribua pontos em habilidades de nível menor!",
            "Cota de Habilidades V5"
          );
        }
      }
    }

    onUpdateCharacter((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillName]: value,
      },
    }));
  };

  // Disciplinas
  const handleAddDiscipline = () => {
    const newDisc: Discipline = {
      id: generateRandomId("disc"),
      name: "Nova Disciplina",
      level: 1,
      powers: []
    };
    onUpdateCharacter(prev => ({
      ...prev,
      disciplines: [...prev.disciplines, newDisc]
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

    onUpdateCharacter(prev => ({
      ...prev,
      disciplines: prev.disciplines.map(d => d.id === id ? { ...d, level } : d)
    }));
  };

  const handleDeleteDiscipline = (id: string) => {
    onUpdateCharacter(prev => ({
      ...prev,
      disciplines: prev.disciplines.filter(d => d.id !== id)
    }));
  };

  const handleAddPower = (disciplineId: string, name: string, level: number) => {
    onUpdateCharacter(prev => ({
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

  const handleDeletePower = (disciplineId: string, powerId: string) => {
    onUpdateCharacter(prev => ({
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

  const handleBloodPotencyChange = (val: number) => {
    if (status === "IN_PLAY" && isEvolvingMode && !isOverrideActive) {
      const currentVal = character.status.blood_potency;
      if (val <= currentVal) {
        showWarning("No Modo de Evolução, você apenas pode aumentar características por XP.", "Modo de Evolução");
        return;
      }
      openEvolutionConfirmModal("blood_potency", "blood_potency", val, currentVal);
      return;
    }
    onUpdateCharacter(prev => ({
      ...prev,
      status: { ...prev.status, blood_potency: val }
    }));
  };

  // Predador
  const handleSelectPredatorDiscipline = (discId: string) => {
    onUpdateCharacter(prev => {
      const prevDiscId = prev.predatorSelections?.chosenDiscipline;
      const selections = prev.predatorSelections || {};
      const newSelections = { ...selections, chosenDiscipline: discId };
      
      let updatedDisciplines = prev.disciplines.map(d => ({ ...d }));

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

      updatedDisciplines = updatedDisciplines.filter(d => d.level > 0);

      return {
        ...prev,
        predatorSelections: newSelections,
        disciplines: updatedDisciplines
      };
    });
  };

  // Especializações
  const handleAddSpecialty = () => {
    if (!selectedSkill || !newSpecialtyName.trim()) return;

    const skillLevel = character.skills ? Number(character.skills[selectedSkill]) || 0 : 0;
    const skillLabel = TECHNICAL_NAMES[selectedSkill] || selectedSkill;

    if (skillLevel < 1) {
      showWarning(
        `Regra V5: Especializações só podem ser associadas a Habilidades com no mínimo 1 ponto (nível 1+). A habilidade ${skillLabel} possui nível 0.`,
        "Habilidade Requer Nível 1+"
      );
      return;
    }

    if (specialtySource === "Hab. 4" && skillLevel < 4) {
      showWarning(
        `Regra V5: O motivo 'Hab. 4' é exclusivo para Habilidades que possuem 4 bolinhas. ${skillLabel} possui apenas ${skillLevel} ponto(s).`,
        "Cota de Nível 4"
      );
      return;
    }

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
    
    onUpdateCharacter(prev => ({
      ...prev,
      specialties: [...(prev.specialties || []), newSpec]
    }));
    
    setNewSpecialtyName("");
    setSelectedSkill("");
  };

  const handleDeleteSpecialty = (id: string) => {
    onUpdateCharacter(prev => ({
      ...prev,
      specialties: (prev.specialties || []).filter(s => s.id !== id)
    }));
  };

  // Vantagens
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
    onUpdateCharacter(prev => ({
      ...prev,
      advantages: [...prev.advantages, newAdv]
    }));
  };

  const handleAdvantageNameChange = (id: string, name: string) => {
    onUpdateCharacter(prev => ({
      ...prev,
      advantages: prev.advantages.map(a => a.id === id ? { ...a, name } : a)
    }));
  };

  const handleAdvantageDescriptionChange = (id: string, description: string) => {
    onUpdateCharacter(prev => ({
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

    onUpdateCharacter(prev => ({
      ...prev,
      advantages: prev.advantages.map(a => a.id === id ? { ...a, level } : a)
    }));
  };

  const handleDeleteAdvantage = (id: string) => {
    onUpdateCharacter(prev => ({
      ...prev,
      advantages: prev.advantages.filter(a => a.id !== id)
    }));
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO VAMPIRO (FOTO, DADOS BÁSICOS, VITALIDADE, FORÇA DE VONTADE, FOME, RESSONÂNCIA, HUMANIDADE) */}
      <ProfileHeaderSection
        characterId={characterId}
        character={character}
        status={status}
        isReadOnly={isSheetDisabled}
        onCharacterChange={onUpdateCharacter}
        onOpenAvatarModal={onOpenAvatarModal}
      />

      {/* BARRA DE PROGRESSO FLUTUANTE DA CRIAÇÃO (MODO DRAFT) */}
      {status === "DRAFT" && (
        <CreationProgressHUD
          attributesRemaining={alloc.attributesRemaining}
          skillsRemaining={alloc.skillsRemaining}
          disciplinesRemaining={alloc.disciplinesRemaining}
          advantagesRemaining={alloc.advantagesRemaining}
          hasPredator={Boolean(character.profile?.predator_type && character.profile?.predator_type !== "Nenhum")}
          isLocking={isLocking}
          onLockCharacter={async () => {
            setIsLocking(true);
            const res = await updateCharacterSheet(characterId, character, undefined, "READY");
            setIsLocking(false);
            if (res.success) {
              showSuccess("Ficha concluída e pronta no cofre!", "Criação Concluída");
            } else {
              showError("Erro ao trancar ficha: " + res.error);
            }
          }}
        />
      )}

      {/* SUB-MENU DE NAVEGAÇÃO DA FICHA V5 (SCROLL SUAVE) */}
      <div className="sticky top-0 z-20 bg-bg-main/95 backdrop-blur-md border-b border-white/10 py-2.5 flex items-center select-none shadow-md overflow-x-auto scrollbar-none gap-1.5 w-full">
        {(
          [
            { id: "atributos", label: "📊 Atributos" },
            { id: "habilidades", label: "🗡️ Habilidades" },
            { id: "especializacoes", label: "⭐ Especializações" },
            { id: "disciplinas", label: "🩸 Disciplinas" },
            { id: "conviccoes", label: "⚖️ Convicções" },
            { id: "vantagens", label: "🌟 Vantagens" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              const el = document.getElementById(item.id);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className="shrink-0 py-1 px-3 text-[10px] uppercase tracking-wider font-data font-semibold border border-white/10 hover:border-gold-accent/60 hover:text-gold-accent text-text-muted bg-black/40 rounded-xs transition-colors cursor-pointer"
          >
            {item.label}
          </button>
        ))}

        {isStoryteller && onToggleOverride && (
          <button
            type="button"
            onClick={onToggleOverride}
            className={`shrink-0 py-1 px-3 text-[10px] uppercase tracking-wider font-data font-bold border rounded-xs transition-all duration-150 cursor-pointer focus:outline-none ml-auto ${
              isOverrideActive
                ? "bg-gold-accent text-bg-main border-gold-accent shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                : "bg-black/40 border-white/10 hover:border-gold-accent hover:text-gold-accent text-text-muted"
            }`}
          >
            Edição Divina ⚡ {isOverrideActive ? "Ativa" : "Inativa"}
          </button>
        )}
      </div>

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
          <AttributeGroup
            title="Físicos"
            category="physical"
            attributes={character.attributes.physical}
            technicalNames={TECHNICAL_NAMES}
            attributesBase={alloc.attributesBase}
            dicePool={dicePool}
            onAttributeChange={handleAttributeChange}
            onTraitClick={onTraitClick}
            showXpDistinction={status !== "IN_PLAY"}
            disabled={isSheetDisabled}
          />
          <AttributeGroup
            title="Sociais"
            category="social"
            attributes={character.attributes.social}
            technicalNames={TECHNICAL_NAMES}
            attributesBase={alloc.attributesBase}
            dicePool={dicePool}
            onAttributeChange={handleAttributeChange}
            onTraitClick={onTraitClick}
            showXpDistinction={status !== "IN_PLAY"}
            disabled={isSheetDisabled}
          />
          <AttributeGroup
            title="Mentais"
            category="mental"
            attributes={character.attributes.mental}
            technicalNames={TECHNICAL_NAMES}
            attributesBase={alloc.attributesBase}
            dicePool={dicePool}
            onAttributeChange={handleAttributeChange}
            onTraitClick={onTraitClick}
            showXpDistinction={status !== "IN_PLAY"}
            disabled={isSheetDisabled}
          />
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
          <SkillGroup
            title="Físicas"
            skillKeys={["melee", "firearms", "athletics", "brawl", "drive", "stealth", "larceny", "craft", "survival"] as const}
            skills={character.skills}
            technicalNames={TECHNICAL_NAMES}
            specialties={character.specialties}
            skillsBase={alloc.skillsBase}
            dicePool={dicePool}
            onSkillChange={handleSkillChange}
            onTraitClick={onTraitClick}
            showXpDistinction={status !== "IN_PLAY"}
            disabled={isSheetDisabled}
          />
          <SkillGroup
            title="Sociais"
            skillKeys={["animal_ken", "etiquette", "intimidation", "leadership", "streetwise", "performance", "persuasion", "insight", "subterfuge"] as const}
            skills={character.skills}
            technicalNames={TECHNICAL_NAMES}
            specialties={character.specialties}
            skillsBase={alloc.skillsBase}
            dicePool={dicePool}
            onSkillChange={handleSkillChange}
            onTraitClick={onTraitClick}
            showXpDistinction={status !== "IN_PLAY"}
            disabled={isSheetDisabled}
          />
          <SkillGroup
            title="Mentais"
            skillKeys={["science", "academics", "finance", "investigation", "medicine", "occult", "awareness", "politics", "technology"] as const}
            skills={character.skills}
            technicalNames={TECHNICAL_NAMES}
            specialties={character.specialties}
            skillsBase={alloc.skillsBase}
            dicePool={dicePool}
            onSkillChange={handleSkillChange}
            onTraitClick={onTraitClick}
            showXpDistinction={status !== "IN_PLAY"}
            disabled={isSheetDisabled}
          />
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
                    type="button"
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

        {(status !== "IN_PLAY" || isOverrideActive) && (
          <div className="flex flex-wrap items-end gap-3 bg-bg-main/30 p-4 border border-white/5 rounded-sm max-w-3xl shadow-none">
            <div className="flex flex-col space-y-1 min-w-32.5">
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

            <div className="flex flex-col space-y-1 min-w-37.5">
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
                    if (lvl < 1) return false;

                    if (specialtySource === "Hab. 4") {
                      return lvl >= 4;
                    }

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

            <div className="flex flex-col space-y-1 flex-1 min-w-45">
              <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Nome da Especialização</label>
              <input
                type="text"
                placeholder="Ex: Pistolas, Briga de Rua, Invasão..."
                value={newSpecialtyName}
                onChange={(e) => setNewSpecialtyName(e.target.value)}
                className="bg-bg-input border border-white/10 text-text-primary text-xs p-2 rounded-sm outline-none focus:border-gold-accent h-9 font-reading"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <button
                type="button"
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
                type="button"
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

          const predatorRule = PREDATOR_TYPES[predatorSlug];
          if (!predatorRule) return null;

          const chosenDiscId = character.predatorSelections?.chosenDiscipline;

          return (
            <div className="bg-burgundy/30 border border-blood-red/40 rounded-sm p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div>
                  <h4 className="font-gothic uppercase tracking-wider text-gold-accent text-sm font-bold flex items-center space-x-2">
                    <span>🩸 Disciplina do Tipo de Predador:</span>
                    <span className="text-text-primary underline">{character.profile.predator_type}</span>
                  </h4>
                  <p className="text-[11px] text-text-muted font-reading mt-0.5">
                    O seu estilo de caça concede <strong>+1 ponto gratuito</strong> em uma das seguintes disciplinas.
                  </p>
                </div>
                {chosenDiscId && (
                  <span className="text-[10px] font-data bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-xs uppercase tracking-wider font-bold">
                    ✓ 1 Ponto Adicionado
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {predatorRule.disciplines.map(discKey => {
                  const discName = DISCIPLINE_KEY_TO_NAME[discKey] || discKey;
                  const isSelected = chosenDiscId === discKey;

                  return (
                    <button
                      key={discKey}
                      type="button"
                      disabled={isSheetDisabled}
                      onClick={() => handleSelectPredatorDiscipline(discKey)}
                      className={`px-3 py-1.5 rounded-sm border text-xs font-data uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center space-x-2 ${
                        isSelected
                          ? "bg-blood-red text-white border-gold-accent shadow-[0_0_10px_rgba(200,36,52,0.5)] font-bold scale-102"
                          : "bg-bg-main/60 border-white/10 text-text-muted hover:border-gold-accent/40 hover:text-gold-accent"
                      }`}
                    >
                      <span>{isSelected ? "🟣" : "⚪"}</span>
                      <span>{discName} (+1)</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* LISTAGEM DE DISCIPLINAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {character.disciplines.map((disc) => (
            <div key={disc.id} className="bg-bg-main/30 border border-white/5 rounded-sm p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <InlineEdit
                  value={disc.name}
                  onChange={(val) => {
                    onUpdateCharacter(prev => ({
                      ...prev,
                      disciplines: prev.disciplines.map(d => d.id === disc.id ? { ...d, name: val } : d)
                    }));
                  }}
                  placeholder="Nome da Disciplina"
                  datalistOptions={DISCIPLINE_OPTIONS}
                  disabled={isReadOnly}
                  className="font-gothic uppercase tracking-wider text-text-primary text-sm font-bold"
                />

                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const isActive = idx < disc.level;
                      const isBase = idx < (alloc.disciplinesBase[disc.id] || 0);
                      const isPredatorDot = character.predatorSelections?.chosenDiscipline &&
                        DISCIPLINE_KEY_TO_NAME[character.predatorSelections.chosenDiscipline]?.toLowerCase() === disc.name.toLowerCase() &&
                        idx === (alloc.disciplinesBase[disc.id] || 0);

                      let activeClass = "";
                      if (isActive) {
                        if (isReadOnly) {
                          activeClass = "bg-hunger-red ring-1 ring-hunger-red/40 shadow-[0_0_8px_rgba(255,92,92,0.5)]";
                        } else if (isPredatorDot) {
                          activeClass = "bg-purple-600 ring-1 ring-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.7)] animate-pulse-subtle";
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
                          type="button"
                          disabled={isSheetDisabled}
                          onClick={() => handleDisciplineLevelChange(disc.id, idx + 1)}
                          className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${isSheetDisabled ? "cursor-default" : "cursor-pointer"} ${activeClass}`}
                          title={`Nível ${idx + 1}`}
                        />
                      );
                    })}
                  </div>

                  {(status !== "IN_PLAY" || isOverrideActive) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDiscipline(disc.id)}
                      className="text-text-muted/40 hover:text-hunger-red transition-colors text-xs font-bold cursor-pointer"
                      title="Excluir Disciplina"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* LISTA DE PODERES ADQUIRIDOS */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-data uppercase tracking-wider text-text-muted block">Poderes Adquiridos:</span>
                {(disc.powers || []).map((power) => {
                  const pObj = typeof power === "string" ? { id: power, name: power, level: 1 } : power;
                  return (
                    <div key={pObj.id} className="flex justify-between items-center bg-black/30 px-2.5 py-1 rounded-xs border border-white/5 text-xs font-reading">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-blood-red font-bold">Nv.{pObj.level || 1}</span>
                        <span>{pObj.name}</span>
                      </div>
                      {(status !== "IN_PLAY" || isOverrideActive) && (
                        <button
                          type="button"
                          onClick={() => handleDeletePower(disc.id, pObj.id)}
                          className="text-text-muted/40 hover:text-hunger-red text-[10px] font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* ADICIONAR PODER */}
                {activeAddPowerDiscId === disc.id && (
                  <div className="p-3 bg-black/40 border border-blood-red/30 rounded-xs space-y-2 mt-2">
                    <input
                      type="text"
                      placeholder="Nome do Poder (Ex: Olhos da Besta)..."
                      value={newPowerName}
                      onChange={(e) => setNewPowerName(e.target.value)}
                      className="w-full bg-bg-input border border-white/10 text-xs p-1.5 rounded-xs outline-none focus:border-gold-accent font-reading text-text-primary"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">Nível do Poder:</span>
                      <div className="flex space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const lvl = i + 1;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setNewPowerLevel(lvl)}
                              className={`w-6 h-6 rounded-xs border text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                                newPowerLevel === lvl
                                  ? "bg-blood-red text-white border-blood-red"
                                  : "bg-bg-input border-white/10 text-text-muted hover:border-white/30"
                              }`}
                            >
                              {lvl}
                            </button>
                          );
                        })}
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
                        className="text-xs uppercase font-bold text-text-muted hover:text-white px-2 py-1 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={!newPowerName.trim()}
                        onClick={() => handleAddPower(disc.id, newPowerName.trim(), newPowerLevel)}
                        className="bg-burgundy border border-blood-red hover:bg-blood-red text-white text-xs px-3 py-1 rounded-xs font-data uppercase font-bold cursor-pointer disabled:opacity-40"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                )}

                {(status !== "IN_PLAY" || isOverrideActive) && activeAddPowerDiscId !== disc.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAddPowerDiscId(disc.id);
                      setNewPowerName("");
                      setNewPowerLevel(Math.max(1, disc.level));
                    }}
                    className="text-[10px] uppercase tracking-wider font-bold text-gold-accent/60 hover:text-gold-accent pt-1 block cursor-pointer transition-colors"
                  >
                    + Adicionar Poder
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 5: CONVICÇÕES E PILARES */}
      <section id="conviccoes" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 space-y-6">
        <ConvictionsPanel
          items={character.convictions}
          onChange={(newConvictions) => onUpdateCharacter(prev => ({ ...prev, convictions: newConvictions }))}
        />
      </section>

      {/* SEÇÃO 6: VANTAGENS E DEFEITOS */}
      <section id="vantagens" style={{ scrollMarginTop: "70px" }} className="bg-bg-card border border-white/10 rounded-sm p-6 space-y-6">
        {(() => {
          const positiveAdvantages = character.advantages.filter(a => a.type === "background" || a.type === "merit");
          const flaws = character.advantages.filter(a => a.type === "flaw");
          const loresheets = character.advantages.filter(a => a.type === "loresheet");

          const positiveWithSum = positiveAdvantages.map((adv, idx) => {
            const sumBefore = positiveAdvantages.slice(0, idx).reduce((acc, curr) => acc + curr.level, 0);
            return { ...adv, sumBefore };
          });
          const totalPositiveMeritsSum = positiveAdvantages.reduce((acc, curr) => acc + curr.level, 0);

          const loresheetsWithSum = loresheets.map((adv, idx) => {
            const sumBefore = totalPositiveMeritsSum + loresheets.slice(0, idx).reduce((acc, curr) => acc + curr.level, 0);
            return { ...adv, sumBefore };
          });

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
                    type="button"
                    onClick={() => setShowV5Guide(!showV5Guide)}
                    className="text-xs font-data text-gold-accent hover:text-white bg-burgundy/30 hover:bg-burgundy/80 border border-gold-accent/30 hover:border-gold-accent px-3 py-1 rounded-xs transition-all duration-150 cursor-pointer flex items-center space-x-1.5 select-none"
                  >
                    <span>📖 {showV5Guide ? "Ocultar Guia V5" : "Guia de Regras V5"}</span>
                  </button>
                </div>

                {showV5Guide && (
                  <div className="bg-bg-main/70 border border-gold-accent/40 p-4 rounded-sm space-y-3 text-xs font-reading text-text-primary mt-2">
                    <div className="flex justify-between items-center border-b border-gold-accent/20 pb-2">
                      <h4 className="font-gothic uppercase tracking-wider text-gold-accent font-bold text-sm">
                        📖 Guia Rápido de Vantagens & Defeitos (V5)
                      </h4>
                      <button 
                        type="button"
                        onClick={() => setShowV5Guide(false)}
                        className="text-text-muted hover:text-white font-bold text-xs cursor-pointer"
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
                          Defeitos <strong>NÃO descontam</strong> da cota de pontos positivos. O V5 exige cadastrar o número mínimo de defeitos para equilibrar a ficha.
                        </p>
                      </div>

                      <div className="space-y-1 bg-white/5 p-3 rounded-xs border border-white/5">
                        <span className="font-bold text-purple-400 block uppercase text-[10px] tracking-wider">👑 Limites Recomendados:</span>
                        <p className="text-text-muted leading-relaxed">
                          Recomenda-se no máximo <strong>3 pts</strong> por antecedente na criação padrão.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {status === "DRAFT" && characterType !== "npc" && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className={`text-xs font-data px-2.5 py-1 rounded-xs border uppercase font-bold tracking-wider ${
                      alloc.advantagesRemaining === 0
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                        : "bg-amber-950/60 border-amber-500/40 text-amber-400 animate-pulse"
                    }`}>
                      {alloc.advantagesRemaining === 0 ? "🟢 Vantagens: 0 Restantes (Concluído) ✓" : `🟡 Vantagens: ${alloc.advantagesRemaining} ${alloc.advantagesRemaining === 1 ? "ponto restante" : "pontos restantes"}`}
                    </span>

                    <span className={`text-xs font-data px-2.5 py-1 rounded-xs border uppercase font-bold tracking-wider ${
                      isFlawsComplete
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                        : "bg-amber-950/60 border-amber-500/40 text-amber-400 animate-pulse"
                    }`}>
                      {isFlawsComplete ? `🟢 Defeitos: ${totalFlawPoints}/${requiredFlaws} Pts (Cumprido) ✓` : `⚠️ Defeitos: ${totalFlawPoints}/${requiredFlaws} Pts (Faltam ${requiredFlaws - totalFlawPoints} pts)`}
                    </span>

                    <span className={`text-xs font-data px-2.5 py-1 rounded-xs border uppercase font-bold tracking-wider ${
                      loresheets.length > 0
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
                        : "bg-white/5 border-white/10 text-text-muted"
                    }`}>
                      {loresheets.length > 0 ? `📜 Ficha de Saber: 1/1 (Ativa) ✓` : `📜 Ficha de Saber: 0/1 (Opcional)`}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* QUALIDADES & ANTECEDENTES */}
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
                            type="button"
                            onClick={() => handleDeleteAdvantage(adv.id)}
                            className="absolute top-3 right-3 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-all cursor-pointer select-none"
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
                              className="font-bold text-xs text-text-primary hover:bg-white/5 cursor-pointer max-w-32.5"
                            />
                            <span className="text-[9px] uppercase tracking-wider text-text-muted">
                              {adv.type === "merit" ? "Qualidade" : "Antecedente"}
                            </span>
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
                                  type="button"
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
                      type="button"
                      onClick={() => handleAddAdvantage("merit")}
                      className="text-xs uppercase tracking-wider font-bold text-gold-accent bg-burgundy/40 hover:bg-burgundy px-3 py-2 rounded-sm border border-blood-red/30 hover:border-blood-red transition-all duration-150 cursor-pointer w-full mt-3 flex items-center justify-center select-none"
                    >
                      + Adicionar Qualidade / Antecedente
                    </button>
                  )}
                </div>

                {/* DEFEITOS */}
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
                            type="button"
                            onClick={() => handleDeleteAdvantage(adv.id)}
                            className="absolute top-3 right-3 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-all cursor-pointer select-none"
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
                              className="font-bold text-xs text-text-primary hover:bg-white/5 cursor-pointer max-w-32.5"
                            />
                            <span className="text-[9px] uppercase tracking-wider text-hunger-red font-semibold">
                              Defeito (Flaw)
                            </span>
                          </div>

                          <div className="flex space-x-1 items-center h-6">
                            {Array.from({ length: 5 }).map((_, idx) => {
                              const isActive = idx < adv.level;
                              const activeClass = isActive 
                                ? "bg-hunger-red ring-1 ring-hunger-red/40 shadow-[0_0_6px_rgba(239,68,68,0.5)]" 
                                : "bg-bg-input border border-text-dim/80 hover:border-blood-red";

                              return (
                                <button
                                  key={idx}
                                  type="button"
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
                      type="button"
                      onClick={() => handleAddAdvantage("flaw")}
                      className="text-xs uppercase tracking-wider font-bold text-blood-red/80 hover:text-white bg-deep-crimson/30 hover:bg-deep-crimson/80 px-3 py-2 rounded-sm border border-blood-red/30 transition-all duration-150 cursor-pointer w-full mt-3 flex items-center justify-center select-none"
                    >
                      + Adicionar Defeito
                    </button>
                  )}
                </div>

                {/* FICHA DE SABER */}
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
                            type="button"
                            onClick={() => handleDeleteAdvantage(adv.id)}
                            className="absolute top-3 right-3 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-all cursor-pointer select-none"
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
                              className="font-bold text-xs text-purple-200 hover:bg-white/5 cursor-pointer max-w-32.5"
                            />
                            <span className="text-[9px] uppercase tracking-wider text-purple-400">
                              Ficha de Saber (Loresheet)
                            </span>
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
                                  activeClass = "bg-purple-600 ring-2 ring-yellow-400 shadow-[0_0_10px_rgba(147,51,234,0.8)] animate-pulse-subtle";
                                }
                              } else {
                                activeClass = "bg-bg-input border border-text-dim/80 hover:border-purple-400";
                              }

                              return (
                                <button
                                  key={idx}
                                  type="button"
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
                      type="button"
                      onClick={() => handleAddAdvantage("loresheet")}
                      disabled={loresheets.length >= 1 && status === "DRAFT" && !isOverrideActive}
                      className="text-xs uppercase tracking-wider font-bold text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 disabled:opacity-40 disabled:hover:bg-purple-950/40 px-3 py-2 rounded-sm border border-purple-500/30 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed w-full mt-3 flex items-center justify-center select-none"
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
              type="button"
              onClick={async () => {
                const response = await updateCharacterSheet(characterId, character, undefined, "READY");
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
    </div>
  );
}
