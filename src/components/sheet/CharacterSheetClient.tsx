"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { 
  CharacterSheetData, 
  Specialty, 
  Discipline, 
  Advantage, 
  RollMacro,
  CharacterSkills,
  DEFAULT_CHARACTER_DATA
} from "@/types/character";
import Link from "next/link";
import DotSlider from "@/components/sheet/DotSlider";
import DamageTracker from "@/components/sheet/DamageTracker";
import HumanityTracker from "@/components/sheet/HumanityTracker";
import { useAutosave } from "@/hooks/useAutosave";
import { updateCharacterSheet, getCharacterXpLedger } from "@/app/actions/characterActions";
import { spendCharacterXpAction } from "@/app/actions/xpActions";
import InlineEdit from "@/components/sheet/InlineEdit";

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
  "Bagger (Ladrão de Sangue)",
  "Alleycat (Gato de Beco)",
  "Cleaver (Cutelo)",
  "Consensualist (Consensualista)",
  "Farmer (Fazendeiro)",
  "Osiris",
  "Sandman",
  "Scene Queen (Rainha da Cena)",
  "Siren (Sereia)"
];

// Dicionário de tradução de nomes técnicos para exibição
const TECHNICAL_NAMES: Record<string, string> = {
  // Atributos
  strength: "Força", dexterity: "Destreza", stamina: "Vigor",
  charisma: "Carisma", manipulation: "Manipulação", composure: "Autocontrole",
  intelligence: "Inteligência", wits: "Raciocínio", resolve: "Determinação",
  // Habilidades Físicas
  athletics: "Esportes", brawl: "Briga", craft: "Ofícios", drive: "Condução",
  firearms: "Armas de Fogo", melee: "Armas Brancas", larceny: "Subterfúgio/Furto",
  stealth: "Furtividade", survival: "Sobrevivência",
  // Habilidades Sociais
  animal_ken: "Empatia com Animais", etiquette: "Etiqueta", insight: "Perspicácia",
  intimidation: "Intimidação", leadership: "Liderança", performance: "Performance",
  persuasion: "Persuasão", streetwise: "Manha", subterfuge: "Lábia",
  // Habilidades Mentais
  academics: "Acadêmicos", awareness: "Percepção", finance: "Finanças",
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

function calculateBaseAndXp(charData: CharacterSheetData) {
  const clan = charData.profile?.clan || "Sem Clã";
  const clanDisciplines = CLAN_DISCIPLINE_MAPPING[clan] || [];
  const isCaitiffOrThin = clan === "Caitiff" || clan === "Sem Clã" || clan === "Sangue-Ralo";

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
  const disciplinesList = charData.disciplines || [];
  const sortedDiscs = [...disciplinesList].sort((a, b) => b.level - a.level);

  const idealDiscs = [2, 1];
  const disciplinesBase: Record<string, number> = {};
  let disciplineXpSpent = 0;

  sortedDiscs.forEach((disc, idx) => {
    const idealVal = idealDiscs[idx] || 0;
    const currentVal = disc.level;
    
    const isClanDisc = clanDisciplines.some(d => disc.name.toLowerCase().includes(d.split(" ")[0].toLowerCase()));
    
    let costMultiplier = 7;
    if (isCaitiffOrThin) {
      costMultiplier = 6;
    } else if (isClanDisc) {
      costMultiplier = 5;
    }

    if (currentVal >= idealVal) {
      disciplinesBase[disc.id] = idealVal;
      for (let lvl = idealVal + 1; lvl <= currentVal; lvl++) {
        disciplineXpSpent += lvl * costMultiplier;
      }
    } else {
      disciplinesBase[disc.id] = currentVal;
    }
  });

  // --- VANTAGENS ---
  const positiveAdvantages = (charData.advantages || []).filter(
    a => a.type === "background" || a.type === "merit" || a.type === "loresheet"
  );
  const totalPositivePoints = positiveAdvantages.reduce((acc, a) => acc + a.level, 0);
  
  let advantagesXpSpent = 0;
  if (totalPositivePoints > 7) {
    advantagesXpSpent = (totalPositivePoints - 7) * 3;
  }

  // --- ESPECIALIZAÇÕES ---
  const totalSpecsCount = charData.specialties ? charData.specialties.length : 0;
  let specialtiesXpSpent = 0;
  if (totalSpecsCount > 1) {
    specialtiesXpSpent = (totalSpecsCount - 1) * 3;
  }

  const specialtiesBase: Record<string, boolean> = {};
  if (charData.specialties) {
    charData.specialties.forEach((spec, idx) => {
      specialtiesBase[spec.id] = idx === 0;
    });
  }

  // --- POTÊNCIA DE SANGUE ---
  const currentBloodPotency = charData.status?.blood_potency || 1;
  let bloodPotencyXpSpent = 0;
  if (currentBloodPotency > 1) {
    for (let lvl = 2; lvl <= currentBloodPotency; lvl++) {
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
  const disciplinesRemaining = Math.max(0, 3 - discSumDistributed);
  const advantagesRemaining = Math.max(0, 7 - totalPositivePoints);

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
  campaignId: string;
  initialData: CharacterSheetData | null;
  initialName?: string;
  onDataChange?: (data: CharacterSheetData) => void;
  dicePool?: Array<{ id: string, label: string, value: number }>;
  onTraitClick?: (trait: { id: string, label: string, value: number }) => void;
  initialStatus?: "DRAFT" | "READY" | "IN_PLAY";
  initialBuildState?: any;
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
  initialBuildState = {}
}: CharacterSheetClientProps) {
  
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

  // Histórico de transações de XP
  const [xpLedger, setXpLedger] = useState<any[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  const xpBalance = xpLedger.reduce((sum, item) => sum + (item.xpChange || 0), 0);

  // Estados de Evolução de XP (Fase 25)
  const [isEvolvingMode, setIsEvolvingMode] = useState(false);
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

  const [activeTab, setActiveTab] = useState<"nucleo" | "sangue" | "vantagens" | "sistema" | "xp_diary">("nucleo");

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
    const newBuildState = {
      attributes: {},
      skills: {},
      disciplines: {},
      advantages: {},
      specialties: character.specialties ? character.specialties.map(s => ({ id: s.id, name: s.name, skill: s.skill, isXp: !alloc.specialtiesBase[s.id] })) : [],
      blood_potency: { base: 1, xp: (character.status?.blood_potency || 1) > 1 ? (character.status?.blood_potency || 1) - 1 : 0 },
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
        if (currentPositiveSum > 7) {
          const excess = currentPositiveSum - 7;
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

  // CALLBACK DE SALVAMENTO DEBOUNCED
  const triggerSave = useCallback(async (dataToSave: CharacterSheetData) => {
    // Cancelar qualquer timer anterior de esconder o status de "Salvo"
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }
    
    setSyncStatus("saving");
    
    const response = await updateCharacterSheet(characterId, dataToSave, buildStateRef.current, statusRef.current);
    
    if (response.success) {
      setSyncStatus("saved");
      // Esconder o indicador após 2 segundos
      savedTimerRef.current = setTimeout(() => {
        setSyncStatus("idle");
      }, 2000);
    } else {
      setSyncStatus("error");
    }
  }, [characterId]);

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
    if (status === "IN_PLAY" && isEvolvingMode) {
      const currentVal = Number((character.attributes[category] as any)[attrName]) || 1;
      if (value <= currentVal) {
        alert("No Modo de Evolução, você apenas pode aumentar características por XP.");
        return;
      }
      openEvolutionConfirmModal(attrName, "attribute", value, currentVal);
      return;
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
    if (status === "IN_PLAY" && isEvolvingMode) {
      const currentVal = Number(character.skills[skillName]) || 0;
      if (value <= currentVal) {
        alert("No Modo de Evolução, você apenas pode aumentar características por XP.");
        return;
      }
      openEvolutionConfirmModal(skillName, "skill", value, currentVal);
      return;
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
    if (status === "IN_PLAY") {
      if (isEvolvingMode) {
        const currentVal = character.status.blood_potency || 1;
        if (val <= currentVal) {
          alert("No Modo de Evolução, você apenas pode aumentar características por XP.");
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
    if (status === "IN_PLAY") {
      if (isEvolvingMode) {
        const currentVal = character.status.humanity || 7;
        if (val <= currentVal) {
          alert("No Modo de Evolução, você apenas pode aumentar características por XP.");
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
        alert("Evolução aplicada com sucesso!");
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
    setCharacter(prev => {
      const updatedProfile = {
        ...prev.profile,
        [field]: value
      };
      let updatedDisciplines = prev.disciplines;
      
      if (field === "clan") {
        const newClan = String(value);
        updatedProfile.bane = CLAN_BANE_MAPPING[newClan] || "";
        
        const allowedDiscs = CLAN_DISCIPLINE_MAPPING[newClan] || [];
        if (allowedDiscs.length > 0) {
          updatedDisciplines = allowedDiscs.map((discName, index) => ({
            id: `disc_init_${index}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            name: discName,
            level: 1,
            powers: ["Poder Inicial"]
          }));
        } else {
          updatedDisciplines = [];
        }
      }
      
      return {
        ...prev,
        profile: updatedProfile,
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
      powers: ["Novo Poder"]
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
    if (status === "IN_PLAY" && isEvolvingMode) {
      const disc = character.disciplines.find(d => d.id === id);
      if (disc) {
        if (level <= disc.level) {
          alert("No Modo de Evolução, você apenas pode aumentar características por XP.");
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

  const handleAddPower = (disciplineId: string) => {
    setCharacter(prev => ({
      ...prev,
      disciplines: prev.disciplines.map(d => {
        if (d.id === disciplineId) {
          return {
            ...d,
            powers: [...d.powers, "Novo Poder"]
          };
        }
        return d;
      })
    }));
  };

  const handlePowerChange = (disciplineId: string, powerIdx: number, newText: string) => {
    setCharacter(prev => ({
      ...prev,
      disciplines: prev.disciplines.map(d => {
        if (d.id === disciplineId) {
          const updatedPowers = [...d.powers];
          updatedPowers[powerIdx] = newText;
          return { ...d, powers: updatedPowers };
        }
        return d;
      })
    }));
  };

  const handleDeletePower = (disciplineId: string, powerIdx: number) => {
    setCharacter(prev => ({
      ...prev,
      disciplines: prev.disciplines.map(d => {
        if (d.id === disciplineId) {
          return {
            ...d,
            powers: d.powers.filter((_, idx) => idx !== powerIdx)
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
    const isPositive = type === "background" || type === "merit";
    const newAdv: Advantage = {
      id: generateRandomId("adv"),
      name: isPositive ? "Nova Qualidade / Antecedente" : "Novo Defeito / Ficha de Saber",
      type,
      level: 1,
      description: "Descrição da vantagem..."
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
    if (status === "IN_PLAY" && isEvolvingMode) {
      const adv = character.advantages.find(a => a.id === id);
      if (adv) {
        if (level <= adv.level) {
          alert("No Modo de Evolução, você apenas pode aumentar características por XP.");
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
    
    const newSpec: Specialty = {
      id: generateRandomId("spec"),
      skill: selectedSkill,
      name: newSpecialtyName.trim()
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
          <Link 
            href="/hub" 
            className="flex items-center space-x-2 text-xs uppercase tracking-widest text-text-muted hover:text-gold-accent transition-colors font-data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Voltar ao Hub</span>
          </Link>

          {/* INDICADOR VISUAL DE AUTOSAVE DEBOUNCED */}
          <div className="flex items-center space-x-4 font-data text-xs">
            <div className="min-h-5 flex items-center">
              {syncStatus === "saving" && (
                <span className="text-text-muted uppercase tracking-wider animate-pulse flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-accent animate-ping mr-1" />
                  Salvando alterações...
                </span>
              )}
              {syncStatus === "saved" && (
                <span className="text-gold-accent uppercase tracking-wider font-semibold flex items-center">
                  ✓ Sincronizado
                </span>
              )}
              {syncStatus === "error" && (
                <span className="text-hunger-red uppercase tracking-wider font-semibold animate-bounce flex items-center">
                  ⚠️ Falha na sincronia (Banco offline)
                </span>
              )}
            </div>
            <div className="text-xs uppercase tracking-wider text-blood-red font-gothic text-right">
              {campaignId === "cofre" ? "Cofre (Sem Crônica) 🔒" : `Crônica Ativa: ${campaignId.slice(0, 8)}`}
            </div>
          </div>
        </div>

        {/* PAINEL DE STATUS DA CRIAÇÃO & CARTEIRA DE XP */}
        <div className="bg-bg-card border border-white/5 p-4 rounded-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs uppercase tracking-widest text-text-muted font-data font-bold">Estado da Ficha:</span>
            {status === "IN_PLAY" ? (
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
          
          {status === "DRAFT" && (
            <div className="flex flex-wrap items-center gap-4 text-xs font-data uppercase">
              <span className="text-text-muted">Faltam no Esqueleto:</span>
              {alloc.attributesRemaining > 0 && (
                <span className="text-amber-400">Atributos: {alloc.attributesRemaining}</span>
              )}
              {alloc.skillsRemaining > 0 && (
                <span className="text-amber-400">Habilidades: {alloc.skillsRemaining}</span>
              )}
              {alloc.disciplinesRemaining > 0 && (
                <span className="text-amber-400">Disciplinas: {alloc.disciplinesRemaining}</span>
              )}
              {alloc.advantagesRemaining > 0 && (
                <span className="text-amber-400">Vantagens: {alloc.advantagesRemaining}</span>
              )}
              {alloc.attributesRemaining === 0 && alloc.skillsRemaining === 0 && alloc.disciplinesRemaining === 0 && alloc.advantagesRemaining === 0 && (
                <span className="text-emerald-400">Tudo Distribuído!</span>
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
            <div className="flex items-center space-x-2 text-xs font-data uppercase">
              <span className="text-text-muted">XP Consumido em Compras:</span>
              <span className="text-gold-accent font-bold text-sm tracking-wider">{alloc.totalSpentXp} XP</span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* CABEÇALHO FIXO - DADOS DO VAMPIRO & TRACKERS RÁPIDOS */}
        {/* ======================================================== */}
        <section className="bg-bg-card border border-white/10 rounded-sm p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-none relative">
          
          {/* AVATAR DO VAMPIRO */}
          <div className="lg:col-span-2 flex justify-center">
            <div className="relative w-28 h-28 rounded-full border-2 border-gold-accent/40 bg-bg-main flex items-center justify-center overflow-hidden shadow-none group">
              <svg className="w-16 h-16 text-text-dim/40 group-hover:text-blood-red/40 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <div className="absolute inset-0 bg-linear-to-t from-bg-main/80 via-transparent to-transparent flex items-end justify-center pb-1">
                <span className="text-[10px] uppercase tracking-wider text-text-muted">
                  {character.profile.name?.split(" ")[0] || "Vampiro"}
                </span>
              </div>
            </div>
          </div>

          {/* DADOS DE PERFIL */}
          <div className="lg:col-span-4 space-y-2 max-w-full">
            <h1 className="text-4xl font-gothic tracking-wider text-blood-red leading-none flex items-center gap-1">
              <InlineEdit
                value={character.profile.name || "Novo Vampiro"}
                onChange={(val) => handleProfileChange("name", val)}
                disabled={status === "IN_PLAY"}
                className="text-4xl font-gothic tracking-wider text-blood-red hover:bg-white/5 uppercase"
              />
            </h1>
            <div className="text-xs uppercase tracking-widest text-gold-accent font-data font-semibold flex flex-wrap items-center gap-1.5 leading-none">
              <span className="text-text-muted">Clã</span>
              <InlineEdit
                value={character.profile.clan}
                onChange={(val) => handleProfileChange("clan", val)}
                type="select"
                options={CLAN_OPTIONS}
                disabled={status === "IN_PLAY"}
                className="text-gold-accent hover:bg-white/5 font-bold"
              />
              <span className="text-text-dim">•</span>
              <InlineEdit
                value={character.profile.concept}
                onChange={(val) => handleProfileChange("concept", val)}
                disabled={status === "IN_PLAY"}
                className="text-text-primary hover:bg-white/5 font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-muted font-data uppercase pt-1.5">
              <div className="flex items-center gap-1">
                <span>Geração:</span>
                <InlineEdit
                  value={String(character.profile.generation)}
                  onChange={(val) => handleProfileChange("generation", Number(val) || 11)}
                  type="number"
                  disabled={status === "IN_PLAY"}
                  className="text-text-primary hover:bg-white/5 font-bold"
                />
                <span>ª</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Predador:</span>
                <InlineEdit
                  value={character.profile.predator_type}
                  onChange={(val) => handleProfileChange("predator_type", val)}
                  type="select"
                  options={PREDATOR_OPTIONS}
                  disabled={status === "IN_PLAY"}
                  className="text-text-primary hover:bg-white/5 font-bold"
                />
              </div>
              <div className="col-span-2 flex items-center gap-1 truncate">
                <span>Sire:</span>
                <InlineEdit
                  value={character.profile.sire}
                  onChange={(val) => handleProfileChange("sire", val)}
                  disabled={status === "IN_PLAY"}
                  className="text-text-primary hover:bg-white/5 font-bold"
                />
              </div>
            </div>
          </div>

          {/* RASTREADORES RÁPIDOS MODULARIZADOS */}
          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
            
            {/* VITALIDADE (HEALTH) - DAMAGE TRACKER */}
            <DamageTracker 
              label="Vitalidade" 
              value={character.status.health} 
              onChange={(val) => setCharacter(prev => ({ ...prev, status: { ...prev.status, health: val } }))} 
              variant="health" 
            />

            {/* FORÇA DE VONTADE (WILLPOWER) - DAMAGE TRACKER */}
            <DamageTracker 
              label="Força de Vontade" 
              value={character.status.willpower} 
              onChange={(val) => setCharacter(prev => ({ ...prev, status: { ...prev.status, willpower: val } }))} 
              variant="willpower" 
            />

            {/* FOME (HUNGER) - DOT SLIDER EM RED */}
            <DotSlider
              label="Fome"
              value={character.status.hunger}
              onChange={(val) => setCharacter(prev => ({ ...prev, status: { ...prev.status, hunger: val } }))}
              allowZero
              variant="red"
            />

            {/* HUMANIDADE & MÁCULAS (HUMANITY & STAINS) - HUMANITY TRACKER */}
            <HumanityTracker
              humanity={character.status.humanity}
              stains={character.status.stains}
              onHumanityChange={handleHumanityChange}
              onStainsChange={(val) => setCharacter(prev => ({ ...prev, status: { ...prev.status, stains: val } }))}
              disabled={status === "IN_PLAY" && !isEvolvingMode}
            />

          </div>

          {/* EXIBIÇÃO DA MALDIÇÃO DO CLÃ */}
          {character.profile.bane && (
            <div className="absolute -bottom-3 right-4 bg-burgundy border border-blood-red px-3 py-0.5 rounded text-[10px] uppercase tracking-wider text-text-primary shadow-none">
              Maldição: {character.profile.bane}
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* NAVEGAÇÃO DE ABAS (TABS) */}
        {/* ======================================================== */}
        <div className="flex space-x-2 border-b border-white/10 pb-px flex-wrap gap-y-1">
          {(["nucleo", "sangue", "vantagens", "sistema", "xp_diary"] as const).map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setRollResult(null);
                }}
                className={`py-3 px-6 text-xs uppercase tracking-widest font-data font-bold transition-all duration-150 border-t-2 border-x border-b border-transparent rounded-t cursor-pointer -mb-px ${
                  isActive 
                    ? "bg-bg-card border-x-white/10 border-t-gold-accent border-b-bg-card text-gold-accent" 
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
                }`}
              >
                {tab === "nucleo" && "Núcleo (Ficha)"}
                {tab === "sangue" && "Sangue (Disciplinas)"}
                {tab === "vantagens" && "Vantagens"}
                {tab === "sistema" && "Sistema & Macros"}
                {tab === "xp_diary" && "Diário de XP 📜"}
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* CONTEÚDO DAS ABAS */}
        {/* ======================================================== */}
        <section className="bg-bg-card border border-white/10 rounded-b p-6 min-h-[400px]">
          
          {/* TAB 1: NÚCLEO */}
          {activeTab === "nucleo" && (
            <div className="space-y-8">
              
              {/* GRADE DE ATRIBUTOS */}
              <div>
                <h3 className="text-lg font-gothic tracking-wider text-blood-red border-b border-white/5 pb-2 mb-4 uppercase">
                  Atributos
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
                        disabled={status === "IN_PLAY" && !isEvolvingMode}
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
                        disabled={status === "IN_PLAY" && !isEvolvingMode}
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
                        disabled={status === "IN_PLAY" && !isEvolvingMode}
                      />
                    ))}
                  </div>

                </div>
              </div>

              {/* GRADE DE HABILIDADES */}
              <div>
                <h3 className="text-lg font-gothic tracking-wider text-blood-red border-b border-white/5 pb-2 mb-4 uppercase">
                  Habilidades & Especializações
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* HABILIDADES FÍSICAS */}
                  <div className="space-y-1 bg-bg-main/40 p-4 border border-white/5 rounded-sm">
                    <h4 className="text-xs font-data uppercase tracking-wider text-blood-red font-bold mb-2">Físicas</h4>
                    {(["athletics", "brawl", "craft", "drive", "firearms", "melee", "larceny", "stealth", "survival"] as const).map(skill => (
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
                        disabled={status === "IN_PLAY" && !isEvolvingMode}
                      />
                    ))}
                  </div>

                  {/* HABILIDADES SOCIAIS */}
                  <div className="space-y-1 bg-bg-main/40 p-4 border border-white/5 rounded-sm">
                    <h4 className="text-xs font-data uppercase tracking-wider text-blood-red font-bold mb-2">Sociais</h4>
                    {(["animal_ken", "etiquette", "insight", "intimidation", "leadership", "performance", "persuasion", "streetwise", "subterfuge"] as const).map(skill => (
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
                        disabled={status === "IN_PLAY" && !isEvolvingMode}
                      />
                    ))}
                  </div>

                  {/* HABILIDADES MENTAIS */}
                  <div className="space-y-1 bg-bg-main/40 p-4 border border-white/5 rounded-sm">
                    <h4 className="text-xs font-data uppercase tracking-wider text-blood-red font-bold mb-2">Mentais</h4>
                    {(["academics", "awareness", "finance", "investigation", "medicine", "occult", "politics", "science", "technology"] as const).map(skill => (
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
                        disabled={status === "IN_PLAY" && !isEvolvingMode}
                      />
                    ))}
                  </div>

                </div>
              </div>

              {/* SEÇÃO DE ESPECIALIZAÇÕES */}
              <div className="mt-8 pt-6 border-t border-white/10 space-y-4 shadow-none">
                <div>
                  <h3 className="text-lg font-gothic tracking-wider text-gold-accent uppercase">
                    Especializações de Habilidades
                  </h3>
                  <p className="text-xs text-text-muted font-reading">
                    Defina especializações para obter dados de bônus em testes específicos vinculados a Habilidades.
                  </p>
                </div>

                {/* LISTAGEM DE BADGES */}
                <div className="flex flex-wrap gap-2">
                  {character.specialties && character.specialties.map(spec => (
                    <span 
                      key={spec.id} 
                      className="bg-bg-main/60 border border-gold-accent/30 text-gold-accent text-xs px-3 py-1 rounded-sm flex items-center space-x-2 font-data uppercase tracking-wider shadow-none"
                    >
                      <span>
                        <strong className="text-text-primary mr-1">{TECHNICAL_NAMES[spec.skill] || spec.skill}:</strong> 
                        {spec.name}
                      </span>
                      {status !== "IN_PLAY" && (
                        <button
                          onClick={() => handleDeleteSpecialty(spec.id)}
                          className="text-hunger-red hover:text-white cursor-pointer select-none text-[10px] font-bold"
                          title="Excluir Especialização"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                  {(!character.specialties || character.specialties.length === 0) && (
                    <span className="text-xs text-text-muted/60 italic font-reading">Nenhuma especialização cadastrada.</span>
                  )}
                </div>

                {/* MINI-FORMULÁRIO DE CADASTRO */}
                {status !== "IN_PLAY" && (
                  <div className="flex flex-wrap items-center gap-3 bg-bg-main/30 p-4 border border-white/5 rounded-sm max-w-2xl shadow-none">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Habilidade Base</label>
                      <select
                        value={selectedSkill}
                        onChange={(e) => setSelectedSkill(e.target.value as keyof CharacterSkills)}
                        className="bg-bg-input border border-white/10 text-text-primary text-xs p-2 rounded-sm outline-none focus:border-gold-accent h-9"
                      >
                        <option value="" className="bg-bg-card">Selecione...</option>
                        {Object.entries(TECHNICAL_NAMES)
                          .filter(([key]) => ![
                            "strength", "dexterity", "stamina",
                            "charisma", "manipulation", "composure",
                            "intelligence", "wits", "resolve"
                          ].includes(key))
                          .map(([key, label]) => (
                            <option key={key} value={key} className="bg-bg-card">{label}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1 flex-1 min-w-[200px]">
                      <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Nome da Especialização</label>
                      <input
                        type="text"
                        placeholder="Ex: Briga de Rua, Machados..."
                        value={newSpecialtyName}
                        onChange={(e) => setNewSpecialtyName(e.target.value)}
                        className="bg-bg-input border border-white/10 text-text-primary text-xs p-2 rounded-sm outline-none focus:border-gold-accent h-9 font-reading"
                      />
                    </div>

                    <div className="flex flex-col space-y-1 pt-5">
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
              </div>

            </div>
          )}

          {/* TAB 2: SANGUE */}
          {activeTab === "sangue" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-white/5 pb-2 mb-4">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-gothic tracking-wider text-blood-red uppercase">
                    Disciplinas Vampíricas (Poderes do Sangue)
                  </h3>
                  {status !== "IN_PLAY" && (
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
                    allowZero
                    baseValue={1}
                    showXpDistinction={status !== "IN_PLAY"}
                    disabled={status === "IN_PLAY" && !isEvolvingMode}
                    variant="gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {character.disciplines.map(disc => (
                  <div key={disc.id} className="bg-bg-main/30 border border-white/5 rounded-sm p-4 space-y-3 relative group">
                    {/* BOTÃO EXCLUIR DISCIPLINA */}
                    {status !== "IN_PLAY" && (
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
                            disabled={status === "IN_PLAY"}
                            onClick={() => onTraitClick({ id: disc.id, label: disc.name, value: disc.level })}
                            className={`cursor-pointer select-none text-base transition-all duration-150 hover:scale-125 hover:text-hunger-red ${
                              dicePool.some(p => p.id === disc.id)
                                ? "text-hunger-red font-bold scale-115 animate-pulse"
                                : "text-text-muted hover:text-text-primary"
                            } ${status === "IN_PLAY" ? "pointer-events-none" : ""}`}
                            title="Selecionar para o Carrinho de Dados"
                          >
                            🎲
                          </button>
                        )}
                        <InlineEdit
                          value={disc.name}
                          onChange={(val) => handleDisciplineNameChange(disc.id, val)}
                          placeholder="Nova Disciplina"
                          disabled={status === "IN_PLAY"}
                          className="font-gothic text-xl text-text-primary tracking-wide"
                        />
                      </div>
                      
                      <div className="flex space-x-1 items-center h-6">
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const isActive = idx < disc.level;
                          const isBase = idx < (alloc.disciplinesBase[disc.id] || 0);
                          
                          let activeClass = "";
                          if (isActive) {
                            if (status === "IN_PLAY") {
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
                              disabled={status === "IN_PLAY" && !isEvolvingMode}
                              onClick={() => handleDisciplineLevelChange(disc.id, idx + 1)}
                              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${(status === "IN_PLAY" && !isEvolvingMode) ? "cursor-default" : "cursor-pointer"} ${activeClass}`}
                              title={`Nível ${idx + 1}`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block">Poderes Adquiridos:</span>
                      
                      <div className="space-y-1.5">
                        {disc.powers.map((pow, pIdx) => (
                          <div 
                            key={pIdx} 
                            className="flex items-center justify-between text-sm text-text-primary font-reading pl-2 py-0.5 border-l border-blood-red/40 bg-white/5 rounded-r-sm group/power"
                          >
                            <div className="flex items-center space-x-2 flex-1 mr-2">
                              <span className="text-blood-red font-bold select-none">•</span>
                              <InlineEdit
                                value={pow}
                                onChange={(val) => handlePowerChange(disc.id, pIdx, val)}
                                placeholder="Novo Poder"
                                disabled={status === "IN_PLAY"}
                                className="text-sm font-reading text-text-primary flex-1"
                              />
                            </div>
                            {status !== "IN_PLAY" && (
                              <button
                                onClick={() => handleDeletePower(disc.id, pIdx)}
                                className="text-text-muted/40 hover:text-hunger-red opacity-0 group-hover/power:opacity-100 transition-opacity duration-150 cursor-pointer pr-1 select-none text-[10px] font-bold"
                                title="Remover Poder"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {status !== "IN_PLAY" && (
                        <button
                          onClick={() => handleAddPower(disc.id)}
                          className="text-[10px] uppercase tracking-wider font-bold text-gold-accent/40 hover:text-gold-accent transition-colors duration-150 cursor-pointer pt-1.5 flex items-center space-x-1 select-none"
                        >
                          <span>+ Adicionar Poder</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VANTAGENS */}
          {activeTab === "vantagens" && (() => {
            const meritsAndBackgrounds = character.advantages.filter(a => a.type === "background" || a.type === "merit");
            const flawsAndLoresheets = character.advantages.filter(a => a.type === "flaw" || a.type === "loresheet");

            // Pré-calcular somas acumuladas de vantagens positivas da Coluna 1
            const meritsWithSum = meritsAndBackgrounds.map((adv, idx) => {
              const sumBefore = meritsAndBackgrounds.slice(0, idx).reduce((acc, curr) => acc + curr.level, 0);
              return { ...adv, sumBefore };
            });

            // Soma total da coluna 1
            const totalMeritsSum = meritsAndBackgrounds.reduce((acc, curr) => acc + curr.level, 0);

            // Pré-calcular a soma das loresheets para a Coluna 2
            const loresheets = flawsAndLoresheets.filter(a => a.type === "loresheet");
            
            // Lista unificada para a Coluna 2 com a soma acumulada de loresheets
            const flawsAndLoresheetsWithSum = flawsAndLoresheets.map(adv => {
              if (adv.type === "loresheet") {
                const idx = loresheets.findIndex(l => l.id === adv.id);
                const sumBefore = totalMeritsSum + loresheets.slice(0, idx).reduce((acc, curr) => acc + curr.level, 0);
                return { ...adv, sumBefore };
              }
              return { ...adv, sumBefore: 0 };
            });

            return (
              <div className="space-y-6">
                <h3 className="text-lg font-gothic tracking-wider text-blood-red border-b border-white/5 pb-2 mb-4 uppercase">
                  Vantagens, Qualidades, Defeitos & Fichas de Saber
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* COLUNA 1: QUALIDADES & ANTECEDENTES */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-data uppercase tracking-wider text-gold-accent font-bold">Qualidades & Antecedentes</h4>
                    <div className="space-y-3">
                      {meritsWithSum.map(adv => {
                        return (
                          <div key={adv.id} className="bg-bg-main/30 border border-white/5 rounded-sm p-4 space-y-1.5 relative group">
                            {/* BOTÃO EXCLUIR VANTAGEM */}
                            {status !== "IN_PLAY" && (
                              <button
                                onClick={() => handleDeleteAdvantage(adv.id)}
                                className="absolute top-4 right-4 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer select-none"
                                title="Excluir Vantagem"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}

                            <div className="flex justify-between items-center pr-6 flex-wrap gap-2">
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <InlineEdit
                                  value={adv.name}
                                  onChange={(val) => handleAdvantageNameChange(adv.id, val)}
                                  placeholder="Nome da Vantagem"
                                  disabled={status === "IN_PLAY"}
                                  className="font-data font-semibold text-sm text-text-primary uppercase tracking-wide"
                                />
                                <span className="text-[10px] text-gold-accent font-normal italic">
                                  (
                                  <InlineEdit
                                    value={adv.type}
                                    onChange={(val) => handleAdvantageTypeChange(adv.id, val as "background" | "merit" | "flaw" | "loresheet")}
                                    type="select"
                                    options={["background", "merit"]}
                                    disabled={status === "IN_PLAY"}
                                    className="hover:bg-white/5 text-[10px] text-gold-accent italic border-none py-0 px-0.5"
                                  />
                                  )
                                </span>
                              </div>
                              
                              <div className="flex space-x-1">
                                {Array.from({ length: 5 }).map((_, idx) => {
                                  const isActive = idx < adv.level;
                                  
                                  // Contabilidade acumulada de pontos base vs XP
                                  let isBasePoint = true;
                                  if (isActive) {
                                    const pointGlobalIndex = adv.sumBefore + idx + 1;
                                    isBasePoint = pointGlobalIndex <= 7;
                                  }

                                  let activeClass = "";
                                  if (isActive) {
                                    if (status === "IN_PLAY") {
                                      activeClass = "bg-hunger-red ring-1 ring-hunger-red/40 shadow-[0_0_8px_rgba(255,92,92,0.5)]";
                                    } else if (isBasePoint) {
                                      activeClass = "bg-gold-accent ring-1 ring-gold-accent/40 shadow-[0_0_8px_rgba(255,216,77,0.5)]";
                                    } else {
                                      activeClass = "bg-yellow-400 ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(255,223,0,0.9)] animate-pulse-subtle";
                                    }
                                  } else {
                                    activeClass = "bg-bg-input border border-text-dim hover:border-gold-accent";
                                  }

                                  return (
                                    <button
                                      key={idx}
                                      disabled={status === "IN_PLAY" && !isEvolvingMode}
                                      onClick={() => handleAdvantageLevelChange(adv.id, idx + 1)}
                                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${(status === "IN_PLAY" && !isEvolvingMode) ? "cursor-default" : "cursor-pointer"} ${activeClass}`}
                                      title={`Nível ${idx + 1}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                            
                            <InlineEdit
                              value={adv.description || ""}
                              onChange={(val) => handleAdvantageDescriptionChange(adv.id, val)}
                              placeholder="Adicionar descrição..."
                              disabled={status === "IN_PLAY"}
                              className="text-xs text-text-muted font-reading leading-relaxed w-full block"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {status !== "IN_PLAY" && (
                      <button
                        onClick={() => handleAddAdvantage("background")}
                        className="text-xs uppercase tracking-wider font-bold text-gold-accent/60 hover:text-gold-accent bg-white/5 hover:bg-white/10 px-3 py-2 rounded-sm border border-white/5 transition-all duration-150 cursor-pointer w-full mt-3 flex items-center justify-center select-none"
                      >
                        + Adicionar Qualidade / Antecedente
                      </button>
                    )}
                  </div>

                  {/* COLUNA 2: DEFEITOS & FICHAS DE SABER */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-data uppercase tracking-wider text-blood-red font-bold">Defeitos & Fichas de Saber</h4>
                    <div className="space-y-3">
                      {flawsAndLoresheetsWithSum.map(adv => {
                        const isLoresheet = adv.type === "loresheet";
                        return (
                          <div key={adv.id} className="bg-bg-main/30 border border-white/5 rounded-sm p-4 space-y-1.5 relative group">
                            {/* BOTÃO EXCLUIR VANTAGEM */}
                            {status !== "IN_PLAY" && (
                              <button
                                onClick={() => handleDeleteAdvantage(adv.id)}
                                className="absolute top-4 right-4 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer select-none"
                                title="Excluir Vantagem"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}

                            <div className="flex justify-between items-center pr-6 flex-wrap gap-2">
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <InlineEdit
                                  value={adv.name}
                                  onChange={(val) => handleAdvantageNameChange(adv.id, val)}
                                  placeholder="Nome da Vantagem"
                                  disabled={status === "IN_PLAY"}
                                  className="font-data font-semibold text-sm text-text-primary uppercase tracking-wide"
                                />
                                <span className={`text-[10px] font-normal italic ${isLoresheet ? "text-gold-accent" : "text-hunger-red"}`}>
                                  (
                                  <InlineEdit
                                    value={adv.type}
                                    onChange={(val) => handleAdvantageTypeChange(adv.id, val as "background" | "merit" | "flaw" | "loresheet")}
                                    type="select"
                                    options={["flaw", "loresheet"]}
                                    disabled={status === "IN_PLAY"}
                                    className={`hover:bg-white/5 text-[10px] italic border-none py-0 px-0.5 ${isLoresheet ? "text-gold-accent" : "text-hunger-red"}`}
                                  />
                                  )
                                </span>
                              </div>
                              
                              <div className="flex space-x-1">
                                {Array.from({ length: 5 }).map((_, idx) => {
                                  const isActive = idx < adv.level;
                                  
                                  let activeClass = "";
                                  if (isActive) {
                                    if (status === "IN_PLAY") {
                                      activeClass = "bg-hunger-red ring-1 ring-hunger-red/40 shadow-[0_0_8px_rgba(255,92,92,0.5)]";
                                    } else if (isLoresheet) {
                                      const pointGlobalIndex = adv.sumBefore + idx + 1;
                                      const isBasePoint = pointGlobalIndex <= 7;
                                      
                                      if (isBasePoint) {
                                        activeClass = "bg-gold-accent ring-1 ring-gold-accent/40 shadow-[0_0_8px_rgba(255,216,77,0.5)]";
                                      } else {
                                        activeClass = "bg-yellow-400 ring-2 ring-yellow-300 shadow-[0_0_12px_rgba(255,223,0,0.9)] animate-pulse-subtle";
                                      }
                                    } else {
                                      // Defeito (Flaw)
                                      activeClass = "bg-hunger-red shadow-[0_0_4px_rgba(255,92,92,0.4)]";
                                    }
                                  } else {
                                    activeClass = "bg-bg-input border border-text-dim";
                                  }

                                  return (
                                    <button
                                      key={idx}
                                      disabled={status === "IN_PLAY" && !isEvolvingMode}
                                      onClick={() => handleAdvantageLevelChange(adv.id, idx + 1)}
                                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${(status === "IN_PLAY" && !isEvolvingMode) ? "cursor-default" : "cursor-pointer"} ${activeClass}`}
                                      title={`Nível ${idx + 1}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                            
                            <InlineEdit
                              value={adv.description || ""}
                              onChange={(val) => handleAdvantageDescriptionChange(adv.id, val)}
                              placeholder="Adicionar descrição..."
                              disabled={status === "IN_PLAY"}
                              className="text-xs text-text-muted font-reading leading-relaxed w-full block"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {status !== "IN_PLAY" && (
                      <button
                        onClick={() => handleAddAdvantage("flaw")}
                        className="text-xs uppercase tracking-wider font-bold text-blood-red/60 hover:text-blood-red bg-white/5 hover:bg-white/10 px-3 py-2 rounded-sm border border-white/5 transition-all duration-150 cursor-pointer w-full mt-3 flex items-center justify-center select-none"
                      >
                        + Adicionar Defeito / Ficha de Saber
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })()}

          {/* TAB 4: SISTEMA */}
          {activeTab === "sistema" && (
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
                      disabled={status === "IN_PLAY"}
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
                      disabled={status === "IN_PLAY"}
                      className="font-bold text-gold-accent hover:bg-white/5 text-center w-12 border-b border-white/10"
                    />
                  </div>
                </div>

                <h3 className="text-sm font-data uppercase tracking-wider text-gold-accent font-semibold border-b border-white/5 pb-2">
                  Macros de Dados Disponíveis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {character.macros.map(mac => (
                    <button
                      key={mac.id}
                      onClick={() => triggerRoll(mac)}
                      className="bg-bg-main border border-blood-red/40 hover:border-blood-red hover:bg-burgundy/10 text-left p-3 rounded-sm cursor-pointer transition-all duration-150 group flex flex-col justify-between h-24 focus:outline-none focus:ring-1 focus:ring-gold-accent"
                    >
                      <div className="space-y-0.5">
                        <span className="font-data uppercase tracking-wider text-xs font-bold text-text-primary group-hover:text-gold-accent transition-colors">
                          {mac.name}
                        </span>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {mac.pool.map((p, pIdx) => (
                            <span key={pIdx} className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[8px] text-text-muted font-data uppercase">
                              {TECHNICAL_NAMES[p] || p}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center w-full text-[9px] uppercase tracking-wider font-semibold pt-2 border-t border-white/5 text-text-dim group-hover:text-text-muted transition-colors">
                        <span>Rolagem D10</span>
                        {mac.rouse_check && <span className="text-gold-accent">+ Despertar</span>}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-2 pt-4">
                  <h4 className="text-xs font-data uppercase tracking-wider text-text-muted font-bold">Anotações do Narrador & Histórico</h4>
                  <textarea
                    value={character.notes}
                    onChange={(e) => setCharacter(prev => ({ ...prev, notes: e.target.value }))}
                    disabled={status === "IN_PLAY"}
                    className="w-full h-32 bg-bg-main border border-white/10 rounded p-3 text-sm font-reading text-text-primary focus:border-gold-accent outline-none resize-none transition-colors duration-150 disabled:opacity-60"
                    placeholder="Histórico livre, anotações de NPCs e metas..."
                  />
                </div>
              </div>

              <div className="lg:col-span-6 bg-bg-main border border-white/10 rounded-sm p-4 space-y-4 min-h-[300px] flex flex-col justify-between">
                
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
          )}

          {/* TAB 5: DIÁRIO DE XP */}
          {activeTab === "xp_diary" && (
            <div className="space-y-6">
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
            </div>
          )}

        </section>

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
    </main>
  );
}
