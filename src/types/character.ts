export interface CharacterProfile {
  name?: string; // Nome editável do vampiro
  portrait_url?: string; // Para futura integração com upload ou links de imagens
  concept: string;
  clan: string;
  bane?: string; // A Maldição específica do Clã
  predator_type: string;
  sire: string;
  generation: number;
}

export interface Tracker {
  max: number;
  superficial: number;
  aggravated: number;
}

export interface Experience {
  total: number;
  spent: number;
}

// Rastreio de Máculas (Stains)
export interface CharacterStatus {
  hunger: number;
  humanity: number;
  stains: number; 
  blood_potency: number;
  health: Tracker;
  willpower: Tracker;
  experience: Experience;
}

export interface AttributesGroup {
  strength: number;
  dexterity: number;
  stamina: number;
}

export interface SocialAttributesGroup {
  charisma: number;
  manipulation: number;
  composure: number;
}

export interface MentalAttributesGroup {
  intelligence: number;
  wits: number;
  resolve: number;
}

export interface CharacterAttributes {
  physical: AttributesGroup;
  social: SocialAttributesGroup;
  mental: MentalAttributesGroup;
}

export interface CharacterSkills {
  // Físicas
  melee: number;
  firearms: number;
  athletics: number;
  brawl: number;
  drive: number;
  stealth: number;
  larceny: number;
  craft: number;
  survival: number;
  // Sociais
  animal_ken: number;
  etiquette: number;
  intimidation: number;
  leadership: number;
  streetwise: number;
  performance: number;
  persuasion: number;
  insight: number;
  subterfuge: number;
  // Mentais
  science: number;
  academics: number;
  finance: number;
  investigation: number;
  medicine: number;
  occult: number;
  awareness: number;
  politics: number;
  technology: number;
}

export interface Specialty {
  id: string;
  skill: keyof CharacterSkills; // Força o vínculo com uma habilidade existente
  name: string;
}

export interface AcquiredPower {
  id: string;
  name: string;
  level: number;
}

export interface Discipline {
  id: string;
  name: string;
  level: number;
  powers: AcquiredPower[];
}

export interface Advantage {
  id: string;
  name: string;
  type: "background" | "merit" | "flaw" | "loresheet";
  level: number;
  description?: string;
}

export interface RollMacro {
  id: string;
  name: string;
  pool: string[]; // Ex: ["strength", "melee"]
  rouse_check: boolean;
}

export interface PredatorSelections {
  chosenDiscipline?: string; // ID em inglês, ex: "potence", "celerity"
}

export const DISCIPLINE_KEY_TO_NAME: Record<string, string> = {
  animalism: "Animalismo",
  auspex: "Auspício",
  dominate: "Dominação",
  blood_sorcery: "Feitiçaria de Sangue",
  fortitude: "Fortitude",
  protean: "Metamorfose",
  oblivion: "Oblivion",
  obfuscate: "Ofuscação",
  potence: "Potência",
  presence: "Presença",
  celerity: "Rapidez",
  thin_blood_alchemy: "Alquimia de Sangue-Ralo"
};

export function getPredatorSlug(predatorType: string): string | null {
  if (!predatorType) return null;
  const p = predatorType.toLowerCase().trim();
  if (p.includes("alleycat")) return "alleycat";
  if (p.includes("bagger")) return "bagger";
  if (p.includes("cleaver")) return "cleaver";
  if (p.includes("consensualist")) return "consensualist";
  if (p.includes("farmer")) return "farmer";
  if (p.includes("osiris")) return "osiris";
  if (p.includes("sandman")) return "sandman";
  if (p.includes("scene queen")) return "scene_queen";
  if (p.includes("siren")) return "siren";
  return null;
}

export interface PredatorTypeRule {
  name: string;
  disciplines: string[]; // IDs das disciplinas elegíveis em inglês
}

export const PREDATOR_TYPES: Record<string, PredatorTypeRule> = {
  alleycat: { name: "Alleycat (Gato de Beco)", disciplines: ["potence", "celerity"] },
  bagger: { name: "Bagger (Ladrão de Sangue)", disciplines: ["obfuscate", "blood_sorcery", "oblivion"] },
  cleaver: { name: "Cleaver (Cutelo)", disciplines: ["dominate", "animalism"] },
  consensualist: { name: "Consensualist (Consensualista)", disciplines: ["auspex", "fortitude"] },
  farmer: { name: "Farmer (Fazendeiro)", disciplines: ["animalism", "protean"] },
  osiris: { name: "Osiris", disciplines: ["blood_sorcery", "presence"] },
  sandman: { name: "Sandman", disciplines: ["auspex", "obfuscate"] },
  scene_queen: { name: "Scene Queen (Rainha da Cena)", disciplines: ["dominate", "potence"] },
  siren: { name: "Siren (Sereia)", disciplines: ["presence", "fortitude"] },
};

export interface CharacterSheetData {
  profile: CharacterProfile;
  status: CharacterStatus;
  attributes: CharacterAttributes;
  skills: CharacterSkills;
  specialties: Specialty[]; // Especializações de habilidades
  disciplines: Discipline[];
  advantages: Advantage[];
  macros: RollMacro[];
  notes: string;
  inventory: Array<{
    id: string;
    name: string;
    effect: string;
    description: string;
  }>;
  bloodState: {
    resonance: string;
    dyscrasia: string;
  };
  convictions: Array<{
    id: string;
    conviction: string;
    touchstone: string;
    isAlive: boolean;
  }>;
  predatorSelections?: PredatorSelections;
}

export const DEFAULT_CHARACTER_DATA: CharacterSheetData = {
  profile: {
    name: "Novo Vampiro",
    portrait_url: "", // SVG fallback será usado
    concept: "Neófito",
    clan: "Sem Clã",
    bane: "",
    predator_type: "Nenhum",
    sire: "",
    generation: 13
  },
  predatorSelections: {},
  status: {
    hunger: 1,
    humanity: 7,
    stains: 0,
    blood_potency: 1,
    health: { max: 4, superficial: 0, aggravated: 0 },
    willpower: { max: 3, superficial: 0, aggravated: 0 },
    experience: { total: 0, spent: 0 }
  },
  attributes: {
    physical: { strength: 1, dexterity: 1, stamina: 1 },
    social: { charisma: 1, manipulation: 1, composure: 1 },
    mental: { intelligence: 1, wits: 1, resolve: 1 }
  },
  skills: {
    melee: 0, firearms: 0, athletics: 0, brawl: 0, drive: 0, stealth: 0, larceny: 0, craft: 0, survival: 0,
    animal_ken: 0, etiquette: 0, intimidation: 0, leadership: 0, streetwise: 0, performance: 0, persuasion: 0, insight: 0, subterfuge: 0,
    science: 0, academics: 0, finance: 0, investigation: 0, medicine: 0, occult: 0, awareness: 0, politics: 0, technology: 0
  },
  specialties: [],
  disciplines: [],
  advantages: [],
  macros: [
    {
      id: "m1",
      name: "Ataque Físico (Briga)",
      pool: ["strength", "brawl"],
      rouse_check: false
    },
    {
      id: "m2",
      name: "Furtividade",
      pool: ["dexterity", "stealth"],
      rouse_check: false
    },
    {
      id: "m3",
      name: "Percepção",
      pool: ["wits", "awareness"],
      rouse_check: false
    }
  ],
  notes: "",
  inventory: [],
  bloodState: {
    resonance: "Vazio",
    dyscrasia: ""
  },
  convictions: []
};

export function getMaxHealth(sheet: CharacterSheetData): number {
  const stamina = Number(sheet.attributes?.physical?.stamina) || 1;
  let max = stamina + 3;

  // Verificar se o personagem tem a disciplina Fortitude e o poder Resiliência (ou Resilience)
  const fortitude = sheet.disciplines?.find(
    (d) => d.name.toLowerCase().includes("fortitude")
  );
  if (fortitude) {
    const hasResilience = fortitude.powers?.some((p) => {
      const powerName = typeof p === "string" ? p : p.name;
      return powerName.toLowerCase().includes("resili") || powerName.toLowerCase().includes("resilience");
    });
    if (hasResilience) {
      max += fortitude.level;
    }
  }

  return max;
}

export function getMaxWillpower(sheet: CharacterSheetData): number {
  const composure = Number(sheet.attributes?.social?.composure) || 1;
  const resolve = Number(sheet.attributes?.mental?.resolve) || 1;
  return composure + resolve;
}


