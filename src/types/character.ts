export interface CharacterProfile {
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
