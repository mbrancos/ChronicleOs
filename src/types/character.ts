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

export const DEFAULT_CHARACTER_DATA: CharacterSheetData = {
  profile: {
    portrait_url: "", // SVG fallback será usado
    concept: "Revolucionário Anarquista",
    clan: "Brujah",
    bane: "Fúria Rebelde (Subtrai dados de testes para resistir a frenesi de raiva)",
    predator_type: "Bagger (Ladrão de Sangue)",
    sire: "Dread",
    generation: 11
  },
  status: {
    hunger: 2,
    humanity: 7,
    stains: 1,
    blood_potency: 2,
    health: { max: 6, superficial: 2, aggravated: 0 },
    willpower: { max: 5, superficial: 1, aggravated: 0 },
    experience: { total: 45, spent: 30 }
  },
  attributes: {
    physical: { strength: 3, dexterity: 3, stamina: 4 },
    social: { charisma: 3, manipulation: 2, composure: 2 },
    mental: { intelligence: 2, wits: 3, resolve: 3 }
  },
  skills: {
    athletics: 2, brawl: 3, craft: 0, drive: 1, firearms: 2, melee: 3, larceny: 1, stealth: 2, survival: 1,
    animal_ken: 0, etiquette: 1, insight: 2, intimidation: 3, leadership: 2, performance: 0, persuasion: 2, streetwise: 3, subterfuge: 1,
    academics: 1, awareness: 2, finance: 0, investigation: 1, medicine: 0, occult: 1, politics: 2, science: 0, technology: 1
  },
  specialties: [
    { id: "s1", skill: "brawl", name: "Briga de Rua" },
    { id: "s2", skill: "melee", name: "Machados de Mão" },
    { id: "s3", skill: "streetwise", name: "Contatos com Traficantes" }
  ],
  disciplines: [
    {
      id: "d1",
      name: "Rapidez (Celerity)",
      level: 2,
      powers: ["Graça Felina (Cat's Grace)", "Julgamento Rápido (Rapid Reflexes)"]
    },
    {
      id: "d2",
      name: "Potência (Potence)",
      level: 2,
      powers: ["Corpo Letal (Lethal Body)", "Salto de Fé (Soaring Leap)"]
    },
    {
      id: "d3",
      name: "Presença (Presence)",
      level: 1,
      powers: ["Olhar Aterrorizante (Awe)"]
    }
  ],
  advantages: [
    {
      id: "a1",
      name: "Refúgio Seguro",
      type: "background",
      level: 2,
      description: "Galpão abandonado na zona industrial fortificado contra luz."
    },
    {
      id: "a2",
      name: "Recursos",
      type: "background",
      level: 1,
      description: "Pequeno fundo financeiro em dinheiro vivo não rastreável."
    },
    {
      id: "a3",
      name: "Sangue de Ferro",
      type: "merit",
      level: 3,
      description: "Excelente resistência física, reduz ferimentos de fontes específicas."
    },
    {
      id: "a4",
      name: "Viciado (Sangue Frio)",
      type: "flaw",
      level: 2,
      description: "Dificuldade em se alimentar de vítimas que não estejam sob estresse intenso."
    },
    {
      id: "a5",
      name: "Segredos da Camarilla de São Paulo",
      type: "loresheet",
      level: 2,
      description: "Conhecimento sobre os túneis ocultos dominados por Nosferatu na capital paulista."
    }
  ],
  macros: [
    {
      id: "m1",
      name: "Soco de Impacto",
      pool: ["strength", "brawl"],
      rouse_check: false
    },
    {
      id: "m2",
      name: "Golpe de Machado",
      pool: ["strength", "melee"],
      rouse_check: false
    },
    {
      id: "m3",
      name: "Coagir Capanga",
      pool: ["manipulation", "intimidation"],
      rouse_check: true
    },
    {
      id: "m4",
      name: "Furtividade nas Sombras",
      pool: ["dexterity", "stealth"],
      rouse_check: false
    }
  ],
  notes: "Marcus foi abraçado nas noites rebeldes da década de 90. Sua maldição de clã o faz explodir de raiva com frequência, mas ele mantém sua busca por justiça entre os anarquistas locais."
};

