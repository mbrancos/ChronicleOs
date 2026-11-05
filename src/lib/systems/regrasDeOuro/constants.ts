import { BodySectorId, PalavraChaveGrau, RegrasDeOuroTalentos, SectorDamage } from "../../../types/systems/regrasDeOuro";

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
  "Salubri": {
    name: "Salubri",
    nickname: "Curandeiros / Ladrões de Alma",
    disciplines: ["Auspícios", "Fortitude", "Obeah"],
    weakness: "Terceiro olho na fronte. Se Trilha cair a 8 ou menor, perde uso de Obeah até restaurar a 10. Caçados pelos Tremere."
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

export const CLANS_REGROURO = CLANS_REGRAS_DE_OURO;
export const CLANS_DATA = CLANS_REGRAS_DE_OURO;

export interface SimbolismoArcano {
  id: string;
  nome: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  filosofia: string;
  frenesiSelvagem: string;
  frenesiRaposa: string;
  vantagem: string;
  desvantagem: string;
  evangelho: string[];
}

export const SIMBOLISMOS_ARCANOS: SimbolismoArcano[] = [
  {
    id: "cordeiro",
    nome: "O Cordeiro",
    titulo: "A Besta da Melancolia e Auto-Indulgência",
    subtitulo: "A Besta da Melancolia e Auto-Indulgência",
    descricao: "Prega a futilidade da existência e induz a Psique a se render pacificamente ou cometer suicídio.",
    filosofia: "Vê o mundo como um calvário injusto de dor e hipocrisia. Seu objetivo é convencer a Psique de que nada vale a pena e que ela deve se render ao descanso eterno da Besta.",
    frenesiSelvagem: "Devolve ao mundo o sofrimento com insultos, recriminações e destruição de quem lhe causou ressentimento.",
    frenesiRaposa: "Foge blasfemando e culpando tudo e todos em delírios paranóicos.",
    vantagem: "Se a fonte de provocação causar dano físico à Psique, esta sofre -2 dados de penalidade para resistir ao Frenesi.",
    desvantagem: "Não suporta dor física: ao receber 1 dano agravado ou choque elétrico, o Frenesi do Cordeiro cessa imediatamente.",
    evangelho: [
      "Quando as coisas parecerem ruins, mostre para a Psique como são ainda piores.",
      "Faça o personagem se decepcionar com as coisas amadas.",
      "Não machuque o corpo do personagem nem deixe que o machuquem.",
      "Torture e machuque a alma do personagem à vontade.",
      "Tente sempre convencer o personagem de que ele deve se entregar à Besta.",
      "Se a Psique resistir muito, induza-a ao suicídio.",
      "No Frenesi, leve sua vingança a tudo o que incomodou o personagem."
    ]
  },
  {
    id: "lobo",
    nome: "O Lobo",
    titulo: "A Besta da Violência e Crueldade",
    subtitulo: "A Besta da Violência e Crueldade",
    descricao: "Trata a Psique como uma fera a ser adestrada e uma arma afiada para despedaçar inimigos.",
    filosofia: "Vê o personagem como uma fera a ser adestrada e uma arma de abate contra o mundo. Empurra a Psique para sangue e brutalidade até aniquilar sua Trilha.",
    frenesiSelvagem: "Rápido, eficiente e quase mudo (rosnados e 'Morra!'). Neutraliza obstáculos sem hesitação e abate presas antes de se alimentar.",
    frenesiRaposa: "Se tiver a fonte do medo ao alcance, desfere um golpe de destruição no primeiro turno antes de fugir em velocidade máxima.",
    vantagem: "Durante o Frenesi, o dado do personagem nunca é inferior a 10 tanto em testes de Força quanto em Agilidade.",
    desvantagem: "Cessação rápida assim que a fonte de ira for destruída. Diante de fogo ou sol no Frenesi Selvagem, converte-se automaticamente em Frenesi Raposa.",
    evangelho: [
      "Trate o personagem como um animal; torne-o uma besta furiosa.",
      "Machuque e flagele o personagem para discipliná-lo, mas não o mate.",
      "Seja objetivo e leve a Psique a cometer violências cada vez maiores.",
      "Não dê oportunidades para a Psique ser gentil e civilizada.",
      "Durante o Frenesi Selvagem, não destrua nada que não tenha despertado sua ira."
    ]
  },
  {
    id: "cobra",
    nome: "A Cobra",
    titulo: "A Besta da Mentira, Suborno e Chantagem",
    subtitulo: "A Besta da Mentira, Suborno e Chantagem",
    descricao: "Mestra das traições que opera por lábia, barganha e ameaça no estilo de um poderoso chefão do crime.",
    filosofia: "Paciente, ardilosa e manipuladora. Age no estilo mafioso usando sucessivamente: lábia, suborno/barganha e ameaça/chantagem.",
    frenesiSelvagem: "Rufião sádico e falastrão: prefere humilhar publicamente e quebrar o amor-próprio do inimigo a matá-lo, revelando segredos da Psique.",
    frenesiRaposa: "Não foge em campo aberto: busca o esconderijo mais próximo, lacra-se e fica encolhida e paralisada até o fim da cena.",
    vantagem: "Se firmar acordo com a Psique, cumprir sua parte e a Psique recusar-se a cumprir os termos, ganha +2 XP.",
    desvantagem: "Se a Psique cumprir sua parte e a Cobra recusar-se a honrar o pacto, o Guia fica proibido de usar Flagelos por 2 sessões inteiras.",
    evangelho: [
      "Sempre tente primeiro levar a Psique na lábia.",
      "Na falha desta, tente o suborno e a barganha.",
      "Como último recurso, ameace no melhor estilo chefão do crime.",
      "No Frenesi Selvagem, não mate: humilhe e menospreze.",
      "Revele segredos da Psique em forma de lorotas e fanfarronices.",
      "No Frenesi Raposa, não fuja: esconda-se."
    ]
  },
  {
    id: "dragao",
    nome: "O Lagarto Alado (Dragão)",
    titulo: "A Besta da Arrogância Medieval",
    subtitulo: "A Besta da Arrogância Medieval",
    descricao: "Arrogante e metódico; ataca e destrói as pessoas e coisas que a Psique ama para forçar sua capitulação.",
    filosofia: "Arrogante e tirânico. Encara a Psique como um tolo cavaleiro medieval e ataca cirurgicamente as pessoas e coisas amadas para forçar sua rendição.",
    frenesiSelvagem: "Silencioso, frio e carniceiro. Foca no alvo ferindo entes queridos ao alcance; no Frenesi de Fome só cessa ao encher 100% de Vitæ.",
    frenesiRaposa: "Mudo e metódico; quebra obstáculos e fere entes queridos pelo caminho enquanto escapa.",
    vantagem: "Pode gastar XP para reduzir níveis de Grilhões ou Paixões negligenciados por mais de uma semana.",
    desvantagem: "Comprar novos Flagelos ou Paixões/Grilhões Obscuros custa 10 + o custo normal em XP.",
    evangelho: [
      "Não dê atenção nem se impressione com a Psique; vá direto ao que interessa.",
      "Faça a Psique destruir as coisas amadas com as próprias mãos.",
      "Trabalhe contra as Paixões dela e impeça-a de adquirir novas.",
      "Sempre ofereça a chance de a Psique se render e se entregar.",
      "Se a Psique se isolar dos amores, mate-os dentro do coração dela."
    ]
  },
  {
    id: "gato_preto",
    nome: "O Gato Preto",
    titulo: "A Besta Zombeteira e Boêmia",
    subtitulo: "A Besta Zombeteira e Boêmia",
    descricao: "O prazer antes do dever: joga uma mão de 7 males com 3 augúrios diários e exige tiradas de humor negro ao fim do Frenesi.",
    filosofia: "O prazer antes do dever. Sádico e espirituoso, trata o tormento da Psique como jogo: lista de 7 males e 3 augúrios diários de azar.",
    frenesiSelvagem: "Engenhoso e cruel; mata a vítima no último minuto do Frenesi e obrigatoriamente profere uma tirada sarcástica de humor negro.",
    frenesiRaposa: "Pragmático e direto: esconde-se e destrói o que cruzar seu caminho sem tiradas de humor.",
    vantagem: "Gato Preto em Frenesi recebe resultado 10 automático em Agilidade. Cumprir todos os 7 males concede +4 XP para a Besta e +4 XP para a Psique.",
    desvantagem: "Se encerrar Frenesi Selvagem sem soltar piada inteligente de humor negro, fica proibido de usar Flagelos até conseguir fazê-lo futuramente.",
    evangelho: [
      "Seja piadista, rufião e de um humor negro doentio.",
      "Na lista de males, escolha itens que arrastem a Psique para perda de Trilha.",
      "Nos Frenesis selvagens seja criativo, original e principalmente cruel.",
      "Nunca deixe escapar a oportunidade de uma tirada de efeito memorável."
    ]
  }
];

export type SimbolismoArcanoInfo = SimbolismoArcano;

export interface FlageloCanonico {
  nome: string;
  tipo: "branco" | "vermelho";
  custo: number;
  resumo: string;
}

export const FLAGELOS_CANONICOS: FlageloCanonico[] = [
  // Flagelos Brancos (Comuns a Mortais, Carniçais e Vampiros)
  { nome: "Murmúrios", tipo: "branco", custo: 1, resumo: "Sussurra diretamente na mente da Psique (1 frase por cena + 1 por resposta)." },
  { nome: "Autotraição", tipo: "branco", custo: 1, resumo: "Gasta 1 Angústia; se rolar menos que o teste da Psique em hesitação, provoca falha." },
  { nome: "Descontrole Emocional", tipo: "branco", custo: 2, resumo: "Gasta Trilha em Angústia para forçar o personagem a cometer ato em dilema extremo." },
  { nome: "Stress", tipo: "branco", custo: 1, resumo: "Oferece 1 ação física extra à Psique em risco; cada uso concede +1 Angústia à Besta." },
  { nome: "Ops! (Ato Falho)", tipo: "branco", custo: 2, resumo: "Gasta 1 Angústia para permutar dados mentais (trocar nomes, números, senhas)." },
  { nome: "Esquecimento", tipo: "branco", custo: 2, resumo: "Gasta Trilha em Angústia para provocar amnésia situacional de objetos ou códigos." },
  { nome: "Cama de Espinhos", tipo: "branco", custo: 3, resumo: "Invade os sonhos da Psique transformando-os em pesadelos aterrorizantes." },
  { nome: "Calmaria", tipo: "branco", custo: 3, resumo: "Permite conduzir o Frenesi com inteligência e calma tática aparente." },
  { nome: "Mal Reprimido", tipo: "branco", custo: 2, resumo: "Gasta pontos de Angústia volátil para elevar Angústia Permanente por 1 turno." },
  { nome: "Possessão", tipo: "branco", custo: 3, resumo: "Disputa Trilha vs Angústia ao fim do Frenesi; vitória reinicia Frenesi por 2 Angústia." },
  { nome: "Açoite", tipo: "branco", custo: 2, resumo: "Com 10 de Angústia, desfere chicotadas psicossomáticas dolorosas no corpo da Psique." },
  { nome: "Talentos Sombrios", tipo: "branco", custo: 2, resumo: "2 pts por nível (máx 6) em Talentos físicos/mentais ativos apenas no Frenesi." },
  { nome: "Rompante de Fúria", tipo: "branco", custo: 1, resumo: "Com 10 Angústia, gasta 1 ponto para assumir a voz por 1 turno e proferir xingamentos." },

  // Flagelos Vermelhos (Sobrenaturais e Exclusivos de Vampiros)
  { nome: "Exorcizar", tipo: "vermelho", custo: 3, resumo: "Drenar inocente reduz Angústia Permanente para 1; sem esse sangue, Besta ganha +2." },
  { nome: "Bainha das Gerações", tipo: "vermelho", custo: 1, resumo: "Flagelos ocultos que se destravam a cada geração reduzida por Diablerie." },
  { nome: "Delicatessen", tipo: "vermelho", custo: 1, resumo: "Sussurra desejo de beber sangue de alvos fascinantes; negação concede +2 Angústia." },
  { nome: "Vício de Sangue", tipo: "vermelho", custo: 3, resumo: "Gasta 1 Angústia para viciar a Psique no sabor de uma vítima específica." },
  { nome: "Pessimismo Sobrenatural", tipo: "vermelho", custo: 3, resumo: "Filtra percepções de disciplinas para revelar apenas o lado podre e vil do mundo." },
  { nome: "Insônia", tipo: "vermelho", custo: 2, resumo: "Impede o desligamento de disciplinas sensoriais ativas por minutos iguais à Angústia." },
  { nome: "Tortura Hedonista", tipo: "vermelho", custo: 3, resumo: "Transforma dor física em prazer sublime; penalidades de ferimento viram bônus." },
  { nome: "Partilhar o Pão", tipo: "vermelho", custo: 1, resumo: "Induz desejo predatório e sede de sangue em um animal próximo por uma cena." },
  { nome: "Olhos do Carrasco", tipo: "vermelho", custo: 1, resumo: "Mensagem corporal de ódio: +1 dado em intimidação, -2 dados em sociabilidade." },
  { nome: "Auréola de Moscas", tipo: "vermelho", custo: 2, resumo: "Convoca hordas de ratos, moscas e animais borralheiros num raio de 1 km." },
  { nome: "Mascarado", tipo: "vermelho", custo: 1, resumo: "Mostra a face da Besta no Frenesi, reduzindo Aparência até 0 ou -2." },
  { nome: "A Pele de Cordeiro", tipo: "vermelho", custo: 1, resumo: "Gasta 1 Angústia para suprimir sinais físicos evidentes de Frenesi perante mortais." },
  { nome: "A Pele do Lobo", tipo: "vermelho", custo: 4, resumo: "Trilha < 8 manifesta traços animais na carne (olhos amarelos, garras, orelhas)." },
  { nome: "Cria do Inferno", tipo: "vermelho", custo: 2, resumo: "Formas animais de Proteísmo/Serpentis tornam-se aberrações titânicas monstruosas." },
  { nome: "Cicatriz da Besta", tipo: "vermelho", custo: 1, resumo: "Crava marcas mutilantes no corpo durante o Frenesi que duram dias." },
  { nome: "Eclipse", tipo: "vermelho", custo: 3, resumo: "Gasta 1 Angústia para prender o vampiro na forma animal por mais 30 minutos." },
  { nome: "Pacto do Destino", tipo: "vermelho", custo: 2, resumo: "Guia dá 6 XP em troca de a Psique abdicar voluntariamente de 1 ponto de Trilha/Virtude." },
  { nome: "Aparência Alternativa", tipo: "vermelho", custo: 1, resumo: "No Frenesi, o vampiro assume as feições de outra pessoa inteiramente distinta." },
  { nome: "Espreita", tipo: "vermelho", custo: 4, resumo: "Obriga a Psique a rerolar um teste com Falha Crítica; Besta ganha +2 Angústia." },
  { nome: "Estigma", tipo: "vermelho", custo: 1, resumo: "Manifesta sinal da maldição divina na pele por uma cena (coroa de espinhos, sem sombra)." },
  { nome: "Senhor de Todas as Marés", tipo: "vermelho", custo: 3, resumo: "A Besta altera coincidências e memórias em troca da provação do Wasseil (frenesi bárbaro)." },
  { nome: "Febre Espiritual", tipo: "vermelho", custo: 2, resumo: "Gasta 1 Líbido: todos com Campo Pessoal menor que a Psique ganham +1 Angústia." },
  { nome: "Pedra Fundamental", tipo: "vermelho", custo: 2, resumo: "A permanência do cainita emana miasma que gera +2 Angústia diária nos habitantes locais." },
  { nome: "Cálice Amargo", tipo: "vermelho", custo: 2, resumo: "Bebe Angústia de vítimas com o sangue ou contamina sangue doado com sua Angústia." },
  { nome: "Relíquia Maculada", tipo: "vermelho", custo: 2, resumo: "Convoca arma forjada na Umbra durante o Frenesi com parada de ataque fixa em 10 dados." }
];

export const FLAGELOS_CATALOGO = FLAGELOS_CANONICOS;

export interface ReliquiaMaculada {
  nome: string;
  custo: number;
  dano: string;
  propriedade: string;
}

export const RELIQUIAS_MACULADAS: ReliquiaMaculada[] = [
  { nome: "Gancho de Açougueiro", custo: 2, dano: "Letal: Força / 2", propriedade: "Prende a carne; arrancar causa +1 dano letal adicional." },
  { nome: "Torniquete Alicate", custo: 2, dano: "Agravado: 2 pontos", propriedade: "Ignora 10 RD (exceto Fortitude); corta cabos e esmaga membros." },
  { nome: "Tesoura de Ossos", custo: 3, dano: "Agravado: 2 pontos", propriedade: "Dificuldade 6 Força para armar; fecha decepando ossos e ignorando RD." },
  { nome: "Foice de Duas Mãos", custo: 3, dano: "Letal ou Agravado: Força + Lâminas", propriedade: "Giro no pivô (-4 na parada) converte todo o dano em dano Agravado." },
  { nome: "Facão do Feitor", custo: 4, dano: "Letal convencional", propriedade: "Concede visão no escuro e eleva testes de Naturalista para 10 dados." },
  { nome: "Foice do Castigo", custo: 5, dano: "Sobrenatural", propriedade: "Ponta inferior decompõe matéria orgânica com 50 anos de erosão; ponta superior queima." }
];

export interface VantagemDefeitoCatalogItem {
  nome: string;
  categoria: "Físico" | "Mental" | "Social" | "Sobrenatural";
  pontos: number;
  tipo: "vantagem" | "desvantagem";
  resumo: string;
}

export const VANTAGENS_CATALOGO: VantagemDefeitoCatalogItem[] = [
  { nome: "Ambidestro", categoria: "Físico", pontos: 1, tipo: "vantagem", resumo: "Usa a mão inábil sem penalidades na dificuldade." },
  { nome: "Ingerir Comida", categoria: "Físico", pontos: 1, tipo: "vantagem", resumo: "Capaz de ingerir e saborear alimentos humanos para manter a Máscara." },
  { nome: "Sangue Amargo", categoria: "Físico", pontos: 1, tipo: "vantagem", resumo: "Seu sangue tem gosto horrível para outros vampiros." },
  { nome: "Rubor de Saúde", categoria: "Físico", pontos: 2, tipo: "vantagem", resumo: "Aparência viva e pele quente ao toque, facilitando misturar-se a mortais." },
  { nome: "Digestão Eficiente", categoria: "Físico", pontos: 3, tipo: "vantagem", resumo: "Ganha +1 Vitæ adicional a cada 2 Vitæ que beber." },
  { nome: "Corpo Grande", categoria: "Físico", pontos: 4, tipo: "vantagem", resumo: "Mede mais de 2m. RD 1 contra dano comum e limite máximo de Força/Vigor sobe para 6." },
  { nome: "Hipoalgia", categoria: "Físico", pontos: 3, tipo: "vantagem", resumo: "Penalidades de dano por ferimentos são reduzidas em +1." },
  { nome: "Sentidos Aguçados", categoria: "Mental", pontos: 1, tipo: "vantagem", resumo: "+1 dado em testes de percepção e vigilância envolvendo um dos 5 sentidos." },
  { nome: "Concentração", categoria: "Mental", pontos: 1, tipo: "vantagem", resumo: "Imune a penalidades causadas por distrações do ambiente externo." },
  { nome: "Senso do Tempo", categoria: "Mental", pontos: 1, tipo: "vantagem", resumo: "Capacidade inata de estimar a passagem das horas sem relógio." },
  { nome: "Memória Eidética", categoria: "Mental", pontos: 2, tipo: "vantagem", resumo: "Recorda-se com precisão cirúrgica de qualquer detalhe já visto ou lido." },
  { nome: "Calma sob Pressão", categoria: "Mental", pontos: 2, tipo: "vantagem", resumo: "+2 dados em Autocontrole em momentos de perigo agudo." },
  { nome: "Fisionomia Amigável", categoria: "Social", pontos: 1, tipo: "vantagem", resumo: "Rosto familiar: +2 em testes Sociais com estranhos no primeiro encontro." },
  { nome: "Empatia Animal", categoria: "Social", pontos: 1, tipo: "vantagem", resumo: "Animais comuns não entram em pânico imediatamente com sua presença." },
  { nome: "Lábia Natural", categoria: "Social", pontos: 2, tipo: "vantagem", resumo: "+1 dado em manobras de persuasão, sedução e negociação." },
  { nome: "Prestígio do Clã", categoria: "Social", pontos: 2, tipo: "vantagem", resumo: "Gera respeito e consideração espontânea entre membros do próprio clã." },
  { nome: "Disciplinado pelo Mestre", categoria: "Social", pontos: 3, tipo: "vantagem", resumo: "Respeito formal adquirido na sociedade cainita por linhagem notável." },
  { nome: "Aura Inofensiva", categoria: "Sobrenatural", pontos: 1, tipo: "vantagem", resumo: "Sua aura mística parece fraca e pacífica para leituras de Auspícios." },
  { nome: "Médium", categoria: "Sobrenatural", pontos: 2, tipo: "vantagem", resumo: "Capacidade inata de perceber e interagir com espíritos e aparições da Umbra." },
  { nome: "Resistência à Fé", categoria: "Sobrenatural", pontos: 3, tipo: "vantagem", resumo: "+2 dados para resistir aos efeitos de Fé Verdadeira." },
  { nome: "Imunidade ao Laço", categoria: "Sobrenatural", pontos: 4, tipo: "vantagem", resumo: "Imune à formação de Laço de Sangue por ingestão de Vitæ." }
];

export const DESVANTAGENS_CATALOGO: VantagemDefeitoCatalogItem[] = [
  { nome: "Deficiência Auditiva", categoria: "Físico", pontos: 1, tipo: "desvantagem", resumo: "Audição prejudicada: -2 em testes envolvendo ouvir ruídos." },
  { nome: "Visão Deficiente", categoria: "Físico", pontos: 2, tipo: "desvantagem", resumo: "Exige lentes corretivas; sem elas sofre -2 em testes visuais." },
  { nome: "Deformidade", categoria: "Físico", pontos: 3, tipo: "desvantagem", resumo: "Má-formação física severa que impõe penalidade de -2 em testes de Aparência." },
  { nome: "Mutilado", categoria: "Físico", pontos: 3, tipo: "desvantagem", resumo: "Ausência de um membro (braço ou perna); penalidades severas em mobilidade." },
  { nome: "Paraplégico", categoria: "Físico", pontos: 5, tipo: "desvantagem", resumo: "Incapaz de mover os membros inferiores sem assistência ou cadeira de rodas." },
  { nome: "Presas Rompas", categoria: "Físico", pontos: 1, tipo: "desvantagem", resumo: "Presas não retraem perfeitamente, exigindo cuidado para manter a Máscara." },
  { nome: "Monstruoso", categoria: "Físico", pontos: 4, tipo: "desvantagem", resumo: "Aparência zero e hedionda; causa repulsa imediata em mortais." },
  { nome: "Pesadelos", categoria: "Mental", pontos: 1, tipo: "desvantagem", resumo: "Sonhos aterrorizantes todas as noites; perde 1 dado de Força de Vontade pela manhã." },
  { nome: "Fobia", categoria: "Mental", pontos: 2, tipo: "desvantagem", resumo: "Pavor irracional de um estímulo comum (água, multidões, altura)." },
  { nome: "Cabeça-Quente", categoria: "Mental", pontos: 2, tipo: "desvantagem", resumo: "Irrita-se facilmente: -2 dados para resistir a provocações de Frenesi." },
  { nome: "Timidez Extrema", categoria: "Mental", pontos: 1, tipo: "desvantagem", resumo: "Dificuldade de se expressar em público: -1 dado em testes sociais abertos." },
  { nome: "Curiosidade Compulsiva", categoria: "Mental", pontos: 2, tipo: "desvantagem", resumo: "Incapaz de ignorar um mistério mesmo correndo risco evidente." },
  { nome: "Segredo Sombrio", categoria: "Social", pontos: 1, tipo: "desvantagem", resumo: "Possui um segredo que, se revelado, arruinaria seu status na cidade." },
  { nome: "Inimigo Jurado", categoria: "Social", pontos: 2, tipo: "desvantagem", resumo: "Um rival cainita ou caçador poderoso busca ativamente sua ruína." },
  { nome: "Caçado pela Segunda Inquisição", categoria: "Social", pontos: 4, tipo: "desvantagem", resumo: "Seu nome e rosto constam nos arquivos de agências mortais de caça." },
  { nome: "Reputação Infame", categoria: "Social", pontos: 2, tipo: "desvantagem", resumo: "Má fama entre os cainitas locais; -1 dado em encontros de Elysium." },
  { nome: "Toque do Diabo", categoria: "Sobrenatural", pontos: 1, tipo: "desvantagem", resumo: "Plantas murcham e animais fogem aterrorizados com seu toque." },
  { nome: "Aura Sombria", categoria: "Sobrenatural", pontos: 2, tipo: "desvantagem", resumo: "Sua aura astral denuncia culpa e malevolência constante." },
  { nome: "Vulnerabilidade à Prata", categoria: "Sobrenatural", pontos: 2, tipo: "desvantagem", resumo: "Prata causa dano agravado que não pode ser absorvido sem Fortitude." },
  { nome: "Presença Amaldiçoada", categoria: "Sobrenatural", pontos: 3, tipo: "desvantagem", resumo: "Manifestações fantasmagóricas e sussurros involuntários ao redor." }
];

export function calculateInitialFlageloPoints(
  trilhaNivel: number,
  geracao: number,
  etaria: "neonato" | "neofito" | "ancilla"
): number {
  const angustiaPerm = Math.max(1, 10 - trilhaNivel);
  const genBonus = Math.max(0, 13 - geracao);
  const etariaBonus = etaria === "ancilla" ? 3 : etaria === "neofito" ? 1 : 0;
  return angustiaPerm + genBonus + etariaBonus;
}

