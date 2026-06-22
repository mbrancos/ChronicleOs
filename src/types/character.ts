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
  athletics: number;
  brawl: number;
  craft: number;
  drive: number;
  firearms: number;
  melee: number;
  larceny: number;
  stealth: number;
  survival: number;
  // Sociais
  animal_ken: number;
  etiquette: number;
  insight: number;
  intimidation: number;
  leadership: number;
  performance: number;
  persuasion: number;
  streetwise: number;
  subterfuge: number;
  // Mentais
  academics: number;
  awareness: number;
  finance: number;
  investigation: number;
  medicine: number;
  occult: number;
  politics: number;
  science: number;
  technology: number;
}

export interface Specialty {
  id: string;
  skill: keyof CharacterSkills; // Força o vínculo com uma habilidade existente
  name: string;
}

export interface Discipline {
  id: string;
  name: string;
  level: number;
  powers: string[];
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
    athletics: 0, brawl: 0, craft: 0, drive: 0, firearms: 0, melee: 0, larceny: 0, stealth: 0, survival: 0,
    animal_ken: 0, etiquette: 0, insight: 0, intimidation: 0, leadership: 0, performance: 0, persuasion: 0, streetwise: 0, subterfuge: 0,
    academics: 0, awareness: 0, finance: 0, investigation: 0, medicine: 0, occult: 0, politics: 0, science: 0, technology: 0
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
  notes: ""
};

export function getMaxHealth(sheet: CharacterSheetData): number {
  const stamina = Number(sheet.attributes?.physical?.stamina) || 1;
  let max = stamina + 3;

  // Verificar se o personagem tem a disciplina Fortitude e o poder Resiliência (ou Resilience)
  const fortitude = sheet.disciplines?.find(
    (d) => d.name.toLowerCase().includes("fortitude")
  );
  if (fortitude) {
    const hasResilience = fortitude.powers?.some(
      (p) => p.toLowerCase().includes("resili") || p.toLowerCase().includes("resilience")
    );
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


