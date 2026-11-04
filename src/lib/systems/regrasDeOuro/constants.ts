import { BodySectorId, PalavraChaveGrau, RegrasDeOuroTalentos, SectorDamage } from "@/types/systems/regrasDeOuro";

export interface ArchetypeDefinition {
  name: string;
  campoPessoal: number;
  virtudes: number;
}

export const ARCHETYPES_TABLE: Record<string, ArchetypeDefinition> = {
  "Arquiteto": { name: "Arquiteto", campoPessoal: 4, virtudes: 4 },
  "Autocrata": { name: "Autocrata", campoPessoal: 4, virtudes: 3 },
  "Autista": { name: "Autista", campoPessoal: 2, virtudes: 3 },
  "Bon Vivant": { name: "Bon Vivant", campoPessoal: 3, virtudes: 3 },
  "Caçador de Emoções": { name: "Caçador de Emoções", campoPessoal: 3, virtudes: 4 },
  "Carente": { name: "Carente", campoPessoal: 1, virtudes: 1 },
  "Cavaleiro": { name: "Cavaleiro", campoPessoal: 3, virtudes: 5 },
  "Competidor": { name: "Competidor", campoPessoal: 3, virtudes: 3 },
  "Confidente": { name: "Confidente", campoPessoal: 2, virtudes: 5 },
  "Conservador": { name: "Conservador", campoPessoal: 3, virtudes: 2 },
  "Crítico": { name: "Crítico", campoPessoal: 4, virtudes: 3 },
  "Criança": { name: "Criança", campoPessoal: 1, virtudes: 4 },
  "Conformista": { name: "Conformista", campoPessoal: 1, virtudes: 3 },
  "Diretor": { name: "Diretor", campoPessoal: 4, virtudes: 2 },
  "Esperto": { name: "Esperto", campoPessoal: 3, virtudes: 3 },
  "Excêntrico": { name: "Excêntrico", campoPessoal: 4, virtudes: 3 },
  "Fanático": { name: "Fanático", campoPessoal: 4, virtudes: 3 },
  "Galante": { name: "Galante", campoPessoal: 2, virtudes: 3 },
  "Honesto": { name: "Honesto", campoPessoal: 2, virtudes: 5 },
  "Juiz": { name: "Juiz", campoPessoal: 2, virtudes: 4 },
  "Manipulador": { name: "Manipulador", campoPessoal: 4, virtudes: 1 },
  "Masoquista": { name: "Masoquista", campoPessoal: 2, virtudes: 4 },
  "Mártir": { name: "Mártir", campoPessoal: 2, virtudes: 5 },
  "Mediador": { name: "Mediador", campoPessoal: 2, virtudes: 4 },
  "Otimista": { name: "Otimista", campoPessoal: 2, virtudes: 5 },
  "Parasita": { name: "Parasita", campoPessoal: 3, virtudes: 2 },
  "Pedagogo": { name: "Pedagogo", campoPessoal: 3, virtudes: 4 },
  "Penitente": { name: "Penitente", campoPessoal: 1, virtudes: 4 },
  "Perfeccionista": { name: "Perfeccionista", campoPessoal: 3, virtudes: 3 },
  "Planejador": { name: "Planejador", campoPessoal: 3, virtudes: 3 },
  "Poltrão": { name: "Poltrão", campoPessoal: 1, virtudes: 2 },
  "Ranzinza": { name: "Ranzinza", campoPessoal: 3, virtudes: 2 },
  "Rebelde": { name: "Rebelde", campoPessoal: 3, virtudes: 4 },
  "Samaritano": { name: "Samaritano", campoPessoal: 2, virtudes: 5 },
  "Sobrevivente": { name: "Sobrevivente", campoPessoal: 2, virtudes: 3 },
  "Solitário": { name: "Solitário", campoPessoal: 2, virtudes: 4 },
  "Tradicionalista": { name: "Tradicionalista", campoPessoal: 3, virtudes: 3 },
  "Valentão": { name: "Valentão", campoPessoal: 3, virtudes: 3 },
  "Vanguarda": { name: "Vanguarda", campoPessoal: 2, virtudes: 4 },
  "Visionário": { name: "Visionário", campoPessoal: 4, virtudes: 4 }
};

export interface TalentoMeta {
  key: keyof RegrasDeOuroTalentos;
  label: string;
  category: "fisico" | "mental";
  description: string;
}

export const TALENTOS_META: TalentoMeta[] = [
  // Físicos
  { key: "forca", label: "Força", category: "fisico", description: "Potência muscular bruta e capacidade de carga/dano" },
  { key: "vigor", label: "Vigor", category: "fisico", description: "Resistência física, absorção de dano e vitalidade" },
  { key: "agilidade", label: "Agilidade", category: "fisico", description: "Coordenação sinestésica corporal, esquiva e acrobacia" },
  // Mentais
  { key: "destreza", label: "Destreza", category: "mental", description: "Controle motor meticuloso e exato das mãos" },
  { key: "aparencia", label: "Aparência", category: "mental", description: "Presença visual, atratividade e impacto estético" },
  { key: "social", label: "Social", category: "mental", description: "Inteligência interpessoal, oratória e manipulação" },
  { key: "emocional", label: "Emocional", category: "mental", description: "Inteligência intrapessoal, autocontrole e psique" },
  { key: "espacial", label: "Espacial", category: "mental", description: "Percepção sensorial, orientação e prontidão tática" },
  { key: "logica", label: "Lógica", category: "mental", description: "Raciocínio dedutivo, matemática e análise técnica" },
  { key: "linguistica", label: "Linguística", category: "mental", description: "Comunicação verbal, idiomas e erudição" },
  { key: "musical", label: "Musical", category: "mental", description: "Sensibilidade acústica, ritmo e percepção harmônica" },
  { key: "naturalista", label: "Naturalista", category: "mental", description: "Conexão biológica, animais e sobrevivência ecológica" }
];

export const KEYWORD_MODIFIERS: Record<PalavraChaveGrau, { modifier: number; label: string; xpCostBase: number; xpCostUpgrade: number }> = {
  fraco: { modifier: -2, label: "Fraco (-2)", xpCostBase: 0, xpCostUpgrade: 0 },
  medio: { modifier: 0, label: "Médio (+0)", xpCostBase: 0, xpCostUpgrade: 0 },
  bom: { modifier: 1, label: "Bom (+1)", xpCostBase: 10, xpCostUpgrade: 15 },
  otimo: { modifier: 2, label: "Ótimo (+2)", xpCostBase: 20, xpCostUpgrade: 5 },
  excepcional: { modifier: 3, label: "Excepcional (+3 / +1 Talento)", xpCostBase: 30, xpCostUpgrade: 10 },
  extraordinario: { modifier: 4, label: "Extraordinário (+4 / +2 Talento)", xpCostBase: 40, xpCostUpgrade: 10 }
};

export interface ClanDefinition {
  name: string;
  nickname: string;
  disciplines: string[];
  weakness: string;
}

export const CLANS_REGRAS_DE_OURO: Record<string, ClanDefinition> = {
  "Assamita": {
    name: "Assamita",
    nickname: "Assassinos",
    disciplines: ["Rapidez", "Ofuscação", "Quietus"],
    weakness: "1 dano letal automático na cabeça por Vitæ vampírica consumida. Dano agravado automático ao tentar Diablerie."
  },
  "Brujah": {
    name: "Brujah",
    nickname: "Ralé",
    disciplines: ["Celeridade", "Potência", "Presença"],
    weakness: "Inicia com Flagelos Descontrole Emocional e Rompante de Fúria. +2 dados para a Besta ao resistir a eles."
  },
  "Gangrel": {
    name: "Gangrel",
    nickname: "Forasteiros",
    disciplines: ["Animalismo", "Fortitude", "Proteísmo"],
    weakness: "Inicia com Flagelos A Pele do Lobo e Cria do Inferno. Adquire traços animalescos em frenesi."
  },
  "Gárgula": {
    name: "Gárgula",
    nickname: "Gárgulas",
    disciplines: ["Fortitude", "Potência", "Visceratika"],
    weakness: "Aparência fixa em 0. Campo Pessoal -1 na criação. -2 contra Dominação de Tremere."
  },
  "Giovanni": {
    name: "Giovanni",
    nickname: "Necromantes",
    disciplines: ["Dominação", "Necromancia", "Potência"],
    weakness: "O Beijo causa dano letal adicional de +1 na vítima. Inicia com Presença Sinistra e Reflexo da Morte."
  },
  "Lasombra Antitribu": {
    name: "Lasombra Antitribu",
    nickname: "Guardiões das Trevas",
    disciplines: ["Dominação", "Tenebrosidade", "Potência"],
    weakness: "Sem reflexo. Luz solar/fogo causam +1 de dano não absorvível e cura lenta de 1 por semana. Alvo primário do Sabá."
  },
  "Malkaviano": {
    name: "Malkaviano",
    nickname: "Lunáticos",
    disciplines: ["Auspícios", "Demência", "Ofuscação"],
    weakness: "Perturbação mental incurável obrigatória na criação (1 de 5pts, 2 de 3pts ou 4 de 2pts)."
  },
  "Nosferatu": {
    name: "Nosferatu",
    nickname: "Ratos de Esgoto",
    disciplines: ["Animalismo", "Ofuscação", "Potência"],
    weakness: "Aparência inicial 0 e níveis negativos permitidos. Mortais fazem Verificação de Pânico (dif 2 + |Aparência|)."
  },
  "Ravnos": {
    name: "Ravnos",
    nickname: "Enganadores",
    disciplines: ["Animalismo", "Quimerismo", "Fortitude"],
    weakness: "Escravos de seus vícios (Paixão de mentira, violência ou roubo nível 3). Teste contra dif 7 para resistir."
  },
  "Seguidores de Set": {
    name: "Seguidores de Set",
    nickname: "Setitas",
    disciplines: ["Ofuscação", "Presença", "Serpentis"],
    weakness: "Não absorve dano de luz do sol. Perde 1 dado em todas as ações quando exposto a luzes brilhantes intensas."
  },
  "Toreador": {
    name: "Toreador",
    nickname: "Degenerados",
    disciplines: ["Auspícios", "Rapidez", "Presença"],
    weakness: "Transe Estético: falha em Emocional + Autocontrole paralisa o vampiro diante de beleza sublime."
  },
  "Tremere": {
    name: "Tremere",
    nickname: "Feiticeiros",
    disciplines: ["Auspícios", "Dominação", "Taumaturgia"],
    weakness: "Laço de sangue piramidal: Paixão Devoção ao Clã nível 3 permanente. -2 no Campo Pessoal contra superiores Tremere."
  },
  "Tzimisce": {
    name: "Tzimisce",
    nickname: "Demônios",
    disciplines: ["Animalismo", "Auspícios", "Vicissitude"],
    weakness: "Sono diurno exige terra natal. Cada dia sem ela reduz todas as paradas pela metade cumulativamente."
  },
  "Ventrue": {
    name: "Ventrue",
    nickname: "Sangue Azul",
    disciplines: ["Dominação", "Fortitude", "Presença"],
    weakness: "Paladar rarefeito com 3 restrições. Vômito e 1 dano no tórax se consumir outro sangue mortal."
  },
  "Caitiff": {
    name: "Caitiff",
    nickname: "Refugos",
    disciplines: ["3 à escolha do jogador (1 física)"],
    weakness: "Sem proteção de clã. Disciplinas custam XP como 1 geração mais novos. Não pode escolher Ancilla."
  }
};

export const INITIAL_ANATOMICAL_VITALITY: Record<BodySectorId, SectorDamage> = {
  cabeca: { normal: 0, letal: 0, agravado: 0, maxNormal: 2, maxLetal: 2, maxAgravado: 2, penalty: 0 },
  pescoco: { normal: 0, letal: 0, agravado: 0, maxNormal: 1, maxLetal: 1, maxAgravado: 1, penalty: 0 },
  torax: { normal: 0, letal: 0, agravado: 0, maxNormal: 4, maxLetal: 4, maxAgravado: 4, penalty: 0 },
  braco_d: { normal: 0, letal: 0, agravado: 0, maxNormal: 3, maxLetal: 3, maxAgravado: 3, penalty: 0 },
  braco_e: { normal: 0, letal: 0, agravado: 0, maxNormal: 3, maxLetal: 3, maxAgravado: 3, penalty: 0 },
  mao_d: { normal: 0, letal: 0, agravado: 0, maxNormal: 2, maxLetal: 2, maxAgravado: 2, penalty: 0 },
  mao_e: { normal: 0, letal: 0, agravado: 0, maxNormal: 2, maxLetal: 2, maxAgravado: 2, penalty: 0 },
  perna_d: { normal: 0, letal: 0, agravado: 0, maxNormal: 3, maxLetal: 3, maxAgravado: 3, penalty: 0 },
  perna_e: { normal: 0, letal: 0, agravado: 0, maxNormal: 3, maxLetal: 3, maxAgravado: 3, penalty: 0 }
};

export const PANIC_TABLE: Array<{ minRoll: number; effect: string; actionLostTurns?: number; isFaint?: boolean; peculiaridade?: boolean }> = [
  { minRoll: 15, effect: "Atônito. Perde a ação por 1 turno.", actionLostTurns: 1 },
  { minRoll: 14, effect: "Atordoado. Perde a ação por 2 turnos.", actionLostTurns: 2 },
  { minRoll: 13, effect: "Acesso de vômito / náusea violenta. Perde a ação por 5 turnos.", actionLostTurns: 5 },
  { minRoll: 12, effect: "Atônito e adquire uma Peculiaridade psicológica temporária.", actionLostTurns: 1, peculiaridade: true },
  { minRoll: 11, effect: "Atordoado e adquire uma Peculiaridade.", actionLostTurns: 2, peculiaridade: true },
  { minRoll: 10, effect: "Acesso de vômito e adquire uma Peculiaridade permanente.", actionLostTurns: 5, peculiaridade: true },
  { minRoll: 9, effect: "Desmaia imediatamente por 1d10 minutos.", isFaint: true },
  { minRoll: 8, effect: "Desmaio grave por 2d10 minutos; sofre 1 ponto de dano letal no tórax.", isFaint: true },
  { minRoll: 1, effect: "Estado de choque profundo. Desmaio por 4d10 minutos e sequela mental.", isFaint: true }
];

export const VITAE_BY_GENERATION: Record<number, { maxVitae: number; spendPerTurn: number }> = {
  15: { maxVitae: 6, spendPerTurn: 1 },
  14: { maxVitae: 8, spendPerTurn: 1 },
  13: { maxVitae: 10, spendPerTurn: 1 },
  12: { maxVitae: 11, spendPerTurn: 1 },
  11: { maxVitae: 12, spendPerTurn: 1 },
  10: { maxVitae: 13, spendPerTurn: 1 },
  9: { maxVitae: 14, spendPerTurn: 2 },
  8: { maxVitae: 15, spendPerTurn: 3 },
  7: { maxVitae: 20, spendPerTurn: 4 },
  6: { maxVitae: 30, spendPerTurn: 6 },
  5: { maxVitae: 40, spendPerTurn: 8 },
  4: { maxVitae: 50, spendPerTurn: 10 }
};
