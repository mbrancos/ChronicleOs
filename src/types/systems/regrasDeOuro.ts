export type SystemId = "v5" | "regras_de_ouro";

export interface RegrasDeOuroTalentos {
  // 3 Físicos (0 a 5)
  forca: number;
  vigor: number;
  agilidade: number;
  // 9 Mentais (0 a 5)
  destreza: number;
  aparencia: number; // Pode ser negativo para Nosferatu
  social: number;
  emocional: number;
  espacial: number;
  logica: number;
  linguistica: number;
  musical: number;
  naturalista: number;
}

export type PalavraChaveGrau = "fraco" | "medio" | "bom" | "otimo" | "excepcional" | "extraordinario";

export interface PalavraChaveItem {
  id: string;
  nome: string;
  grau: PalavraChaveGrau;
  talentoAssociado?: keyof RegrasDeOuroTalentos; // Para grau excepcional (+1 no talento) ou extraordinário (+2)
}

export interface RegrasDeOuroVirtudes {
  consciencia: number; // 1 a 5
  autocontrole: number; // 1 a 5
  coragem: number;     // 1 a 5
}

export type BodySectorId = 
  | "cabeca" | "pescoco" | "torax"
  | "braco_d" | "braco_e" | "mao_d" | "mao_e"
  | "perna_d" | "perna_e";

export interface SectorDamage {
  normal: number;    // Caixas de dano contusivo
  letal: number;     // Caixas de dano letal
  agravado: number;  // Caixas de dano agravado
  maxNormal: number; // Capacidade de caixas normais
  maxLetal: number;  // Capacidade de caixas letais
  maxAgravado: number; // Capacidade de caixas agravadas
  penalty: number;   // Penalidade atual (-1, -2, -3, ou -99 para incapacitado)
}

export type AnatomicalVitality = Record<BodySectorId, SectorDamage>;

export interface SubNivelDisciplina {
  codigo: string;
  nome: string;
  descricao: string;
  ativo: boolean;
}

export interface RegrasDeOuroDisciplinaAdquirida {
  id: string;
  nome: string; // Ex: "Celeridade"
  nivel: number; // 1 a 5
  subNiveisAtivos?: SubNivelDisciplina[];
  descricao?: string;
}

export type RegrasDeOuroDisciplina = RegrasDeOuroDisciplinaAdquirida;

export interface FlageloEntry {
  id: string;
  nome: string;
  descricao: string;
  nivel?: number;
  custo?: number;
}

export interface RegrasDeOuroBesta {
  nivel: number;
  angstia: number;
  libido: number;
  flagelos?: FlageloEntry[];
}

export interface RegrasDeOuroTrilha {
  nome: string;
  nivel: number;
  pecados?: string[];
}

export interface GuiaDaBestaData {
  angstia: number; // 1 a 10
  libido: number;  // 1 a 10
  paixoesObscuras: Array<{ id: string; nome: string; nivel: number }>;
  flagelos: Array<{ id: string; nome: string; nivel: number; custo: number }>;
  xpBesta: { total: number; gasto: number };
}

export interface RegrasDeOuroSheetData {
  systemId: "regras_de_ouro";
  etaria: "neonato" | "neofito" | "ancilla";
  natureza: string;
  mascara: string;
  cla: string;
  geracao: number; // 13 a 4
  campoPessoal: number; // 1 a 10 (derivado de Natureza + Máscara)
  trilha: {
    nome: string; // Ex: "Via Humanitatis"
    nivel: number; // 1 a 10 (Consciência + Autocontrole)
  };
  virtudes: RegrasDeOuroVirtudes;
  talentos: RegrasDeOuroTalentos;
  palavrasChave: PalavraChaveItem[];
  disciplinas: RegrasDeOuroDisciplinaAdquirida[];
  vitalidade: AnatomicalVitality;
  vitae: {
    atual: number;
    maximo: number;
    gastoPorTurno: number;
  };
  paixoes: Array<{ id: string; nome: string; nivel: number }>;
  vantagens: Array<{ id: string; nome: string; categoria: string; custo: number }>;
  desvantagens: Array<{ id: string; nome: string; categoria: string; pontos: number }>;
  peculiaridades: string[];
  besta: GuiaDaBestaData;
  inventory?: Array<{
    id: string;
    name: string;
    quantity: number;
    description?: string;
  }>;
  notes?: string;
}
