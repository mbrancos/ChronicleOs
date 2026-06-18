"use client";

import { use, useState } from "react";
import { 
  CharacterSheetData, 
  Tracker, 
  Specialty, 
  Discipline, 
  Advantage, 
  RollMacro,
  CharacterSkills
} from "@/types/character";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    campaign_id: string;
    character_id: string;
  }>;
}

// MASSA DE DADOS MOCKADOS COMPLETA (BRUJAH DE 11ª GERAÇÃO)
const INITIAL_CHARACTER_DATA: CharacterSheetData = {
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

export default function CharacterPage({ params }: PageProps) {
  const { campaign_id, character_id } = use(params);

  // ESTADO LOCAL DA FICHA
  const [character, setCharacter] = useState<CharacterSheetData>(INITIAL_CHARACTER_DATA);
  const [activeTab, setActiveTab] = useState<"nucleo" | "sangue" | "vantagens" | "sistema">("nucleo");
  
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

  // 1. ATUALIZAÇÃO DOS TRACKERS DE DANO (Health & Willpower)
  const handleTrackerClick = (type: "health" | "willpower", idx: number) => {
    setCharacter(prev => {
      const tracker = { ...prev.status[type] };
      
      // Ciclo: Livre -> Superficial (1) -> Agravado (2) -> Livre (0)
      let currentType = 0;
      if (idx < tracker.superficial) {
        currentType = 1;
      } else if (idx < tracker.superficial + tracker.aggravated) {
        currentType = 2;
      }

      let nextType = (currentType + 1) % 3;

      // Recalcular contadores
      let newSuperficial = tracker.superficial;
      let newAggravated = tracker.aggravated;

      if (currentType === 1) {
        newSuperficial = Math.max(0, newSuperficial - 1);
        if (nextType === 2) newAggravated = Math.min(tracker.max, newAggravated + 1);
      } else if (currentType === 2) {
        newAggravated = Math.max(0, newAggravated - 1);
      } else {
        if (nextType === 1) newSuperficial = Math.min(tracker.max, newSuperficial + 1);
        else if (nextType === 2) newAggravated = Math.min(tracker.max, newAggravated + 1);
      }

      return {
        ...prev,
        status: {
          ...prev.status,
          [type]: {
            ...tracker,
            superficial: newSuperficial,
            aggravated: newAggravated
          }
        }
      };
    });
  };

  // 2. CONTROLE DE FOME (Hunger Tracker)
  const handleHungerClick = (level: number) => {
    setCharacter(prev => ({
      ...prev,
      status: {
        ...prev.status,
        hunger: prev.status.hunger === level ? Math.max(0, level - 1) : level
      }
    }));
  };

  // 3. CONTROLE DE HUMANIDADE E MÁCULAS (Humanity & Stains)
  const handleHumanityClick = (level: number) => {
    setCharacter(prev => ({
      ...prev,
      status: {
        ...prev.status,
        humanity: prev.status.humanity === level ? Math.max(0, level - 1) : level
      }
    }));
  };

  const handleStainsClick = (level: number) => {
    setCharacter(prev => ({
      ...prev,
      status: {
        ...prev.status,
        stains: prev.status.stains === level ? Math.max(0, level - 1) : level
      }
    }));
  };

  // 4. CONTROLE DE BOLINHAS (SLIDER DE ATRIBUTOS E HABILIDADES)
  const handleAttributeChange = (category: "physical" | "social" | "mental", attrName: string, value: number) => {
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

  const handleSkillChange = (skillName: keyof CharacterSkills, value: number) => {
    setCharacter(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillName]: value
      }
    }));
  };

  // 5. SIMULADOR DE ROLAGEM DE DADOS D10 GÓTICO (REGRAS V5)
  const triggerRoll = (macro: RollMacro) => {
    // 1. Calcular pool total do personagem baseado nas chaves
    let poolSize = 0;
    
    // Ler valores das chaves na ficha
    macro.pool.forEach(key => {
      // Buscar em atributos
      if (key in character.attributes.physical) {
        poolSize += (character.attributes.physical as any)[key];
      } else if (key in character.attributes.social) {
        poolSize += (character.attributes.social as any)[key];
      } else if (key in character.attributes.mental) {
        poolSize += (character.attributes.mental as any)[key];
      }
      // Buscar em habilidades
      else if (key in character.skills) {
        poolSize += (character.skills as any)[key];
      }
    });

    if (poolSize === 0) poolSize = 1; // Mínimo de 1 dado

    const hunger = character.status.hunger;
    const hungerDiceCount = Math.min(poolSize, hunger);
    const normalDiceCount = poolSize - hungerDiceCount;

    // Rolar dados
    const diceList: { type: "normal" | "hunger"; value: number }[] = [];
    
    for (let i = 0; i < normalDiceCount; i++) {
      diceList.push({ type: "normal", value: Math.floor(Math.random() * 10) + 1 });
    }
    for (let i = 0; i < hungerDiceCount; i++) {
      diceList.push({ type: "hunger", value: Math.floor(Math.random() * 10) + 1 });
    }

    // Contagem de sucessos (dado >= 6 é sucesso)
    let normalSuccesses = diceList.filter(d => d.value >= 6).length;
    
    // Contagem de dezes (Críticos)
    const normalTens = diceList.filter(d => d.type === "normal" && d.value === 10).length;
    const hungerTens = diceList.filter(d => d.type === "hunger" && d.value === 10).length;
    const totalTens = normalTens + hungerTens;

    // Pares de 10 geram 2 sucessos extras (crítico vale 4 sucessos ao todo por par)
    const criticalPairs = Math.floor(totalTens / 2);
    const extraSuccesses = criticalPairs * 2;
    const successes = normalSuccesses + extraSuccesses;

    // Condições especiais do V5
    const isCritical = criticalPairs > 0;
    const isMessianic = isCritical && hungerTens > 0;
    const isBestial = diceList.some(d => d.type === "hunger" && d.value === 1) && normalSuccesses === diceList.filter(d => d.value >= 6).length && successes < 1; 
    // Uma falha bestial ocorre quando a rolagem falha (zero sucessos após modificadores) E há um 1 nos dados de Fome.
    const isBestialFailure = diceList.some(d => d.type === "hunger" && d.value === 1) && successes === 0;

    // Se houve rouse check simulado, faz a rolagem sutil no log
    let rouseText = "";
    if (macro.rouse_check) {
      const rouseResult = Math.floor(Math.random() * 10) + 1;
      rouseText = rouseResult >= 6 
        ? " [Cheque de Despertar: Sucesso (Não aumentou Fome)]" 
        : " [Cheque de Despertar: Falha! (Fome aumenta)]";
    }

    setRollResult({
      macroName: macro.name + rouseText,
      totalPool: poolSize,
      successes,
      isCritical,
      isMessianic,
      isBestial: isBestialFailure,
      diceList
    });
  };

  return (
    <main className="min-h-screen bg-bg-main text-text-primary p-4 md:p-8 font-reading flex flex-col justify-start items-center">
      <div className="w-full max-w-6xl space-y-6">
        
        {/* NAV VOLTAR AO HUB */}
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
          <div className="text-xs uppercase tracking-wider text-blood-red font-gothic text-right">
            Crônica Ativa: {campaign_id.slice(0, 8)}
          </div>
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
              <div className="absolute inset-0 bg-gradient-to-t from-bg-main/80 via-transparent to-transparent flex items-end justify-center pb-1">
                <span className="text-[10px] uppercase tracking-wider text-text-muted">Marcus</span>
              </div>
            </div>
          </div>

          {/* DADOS DE PERFIL */}
          <div className="lg:col-span-4 space-y-2">
            <h1 className="text-4xl font-gothic tracking-wider text-blood-red leading-none">
              MARCUS VANE
            </h1>
            <p className="text-xs uppercase tracking-widest text-gold-accent font-data font-semibold">
              Clã {character.profile.clan} • {character.profile.concept}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-muted font-data uppercase pt-1">
              <div>Geração: <span className="text-text-primary">{character.profile.generation}ª</span></div>
              <div>Predador: <span className="text-text-primary">{character.profile.predator_type}</span></div>
              <div className="col-span-2 truncate">Sire: <span className="text-text-primary">{character.profile.sire}</span></div>
            </div>
          </div>

          {/* RASTREADORES RÁPIDOS DE ATRIBUTOS SOCIAIS / MORAIS DO V5 */}
          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
            
            {/* VITALIDADE (HEALTH) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-data uppercase font-semibold text-text-muted">
                <span>Vitalidade</span>
                <span className="text-[10px] text-text-dim font-normal">Clique para alternar (/ ou X)</span>
              </div>
              <div className="flex space-x-1.5 h-11 items-center">
                {Array.from({ length: character.status.health.max }).map((_, idx) => {
                  let char = "";
                  let colorClass = "border-text-muted text-text-primary bg-bg-input";
                  
                  if (idx < character.status.health.superficial) {
                    char = "/";
                    colorClass = "border-text-primary text-text-primary bg-bg-input";
                  } else if (idx < character.status.health.superficial + character.status.health.aggravated) {
                    char = "X";
                    colorClass = "border-deep-crimson text-hunger-red bg-deep-crimson/10 font-bold";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleTrackerClick("health", idx)}
                      className={`w-7 h-7 rounded-sm border flex items-center justify-center text-xs cursor-pointer focus:outline-none transition-all duration-150 hover:border-gold-accent ${colorClass}`}
                    >
                      {char}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FORÇA DE VONTADE (WILLPOWER) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-data uppercase font-semibold text-text-muted">
                <span>Força de Vontade</span>
                <span className="text-[10px] text-text-dim font-normal">Clique para alternar (/ ou X)</span>
              </div>
              <div className="flex space-x-1.5 h-11 items-center">
                {Array.from({ length: character.status.willpower.max }).map((_, idx) => {
                  let char = "";
                  let colorClass = "border-text-muted text-text-primary bg-bg-input";
                  
                  if (idx < character.status.willpower.superficial) {
                    char = "/";
                    colorClass = "border-willpower-blue text-willpower-blue bg-willpower-blue/5";
                  } else if (idx < character.status.willpower.superficial + character.status.willpower.aggravated) {
                    char = "X";
                    colorClass = "border-deep-crimson text-hunger-red bg-deep-crimson/15 font-bold";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleTrackerClick("willpower", idx)}
                      className={`w-7 h-7 rounded-sm border flex items-center justify-center text-xs cursor-pointer focus:outline-none transition-all duration-150 hover:border-gold-accent ${colorClass}`}
                    >
                      {char}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FOME (HUNGER TRACKER) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-data uppercase font-semibold text-text-muted">
                <span>Fome (Hunger)</span>
                <span className="text-[10px] text-hunger-red font-semibold">{character.status.hunger} / 5</span>
              </div>
              <div className="flex space-x-2 h-11 items-center">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const isActive = idx < character.status.hunger;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleHungerClick(idx + 1)}
                      className={`w-7 h-7 rounded-full border cursor-pointer flex items-center justify-center transition-all duration-150 focus:outline-none ${
                        isActive 
                          ? "bg-hunger-red border-hunger-red text-bg-main shadow-[0_0_8px_rgba(255,92,92,0.6)]" 
                          : "border-text-dim hover:border-hunger-red bg-bg-input"
                      }`}
                    >
                      {isActive && (
                        <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* HUMANIDADE & MÁCULAS (HUMANITY & STAINS) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-data uppercase font-semibold text-text-muted">
                <span>Humanidade & Máculas</span>
                <span className="text-[10px] text-gold-accent font-semibold">Hum: {character.status.humanity} | Mac: {character.status.stains}</span>
              </div>
              
              {/* TRILHA DE 10 CAIXAS PARA HUMANIDADE (ESQUERDA) E MÁCULAS (DIREITA) */}
              <div className="flex space-x-1 h-11 items-center">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const boxNum = idx + 1;
                  const isHumanity = boxNum <= character.status.humanity;
                  const isStain = boxNum > (10 - character.status.stains);
                  
                  let bgClass = "bg-bg-input border-text-dim hover:border-gold-accent";
                  let content = null;

                  if (isHumanity) {
                    bgClass = "bg-gold-accent border-gold-accent text-bg-main shadow-[0_0_6px_rgba(255,216,77,0.4)]";
                    content = <div className="w-1.5 h-1.5 rounded-full bg-bg-main" />;
                  } else if (isStain) {
                    bgClass = "bg-deep-crimson/30 border-blood-red text-blood-red animate-pulse";
                    content = <span className="text-[10px] font-bold">!</span>;
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (boxNum <= 5) {
                          handleHumanityClick(boxNum);
                        } else {
                          handleStainsClick(10 - boxNum + 1);
                        }
                      }}
                      className={`w-6 h-6 border rounded-sm flex items-center justify-center cursor-pointer transition-all duration-150 ${bgClass}`}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* EXIBIÇÃO DA MALDIÇÃO DO CLÃ */}
          {character.profile.bane && (
            <div className="absolute -bottom-3 right-4 bg-burgundy border border-blood-red px-3 py-0.5 rounded text-[10px] uppercase tracking-wider text-text-primary shadow-none">
              Maldição: {character.profile.bane}
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* NAVEGAÇÃO DE ABAS (TABS CUSTOMIZADAS REATIVAS) */}
        {/* ======================================================== */}
        <div className="flex space-x-2 border-b border-white/10 pb-px">
          {(["nucleo", "sangue", "vantagens", "sistema"] as const).map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setRollResult(null); // Limpar log de rolagem ao mudar aba
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
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* CONTEÚDO DAS ABAS */}
        {/* ======================================================== */}
        <section className="bg-bg-card border border-white/10 rounded-b p-6 min-h-[400px]">
          
          {/* TAB 1: NÚCLEO (ATRIBUTOS E HABILIDADES) */}
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
                      />
                    ))}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SANGUE (DISCIPLINAS E PODERES) */}
          {activeTab === "sangue" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-4">
                <h3 className="text-lg font-gothic tracking-wider text-blood-red uppercase">
                  Disciplinas Vampíricas (Poderes do Sangue)
                </h3>
                <span className="text-xs text-text-muted font-data uppercase">Potência do Sangue: {character.status.blood_potency}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {character.disciplines.map(disc => (
                  <div key={disc.id} className="bg-bg-main/30 border border-white/5 rounded-sm p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-gothic text-xl text-text-primary tracking-wide">{disc.name}</span>
                      
                      {/* LEITOR DE PONTOS DA DISCIPLINA */}
                      <div className="flex space-x-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-3 h-3 rounded-full ${
                              idx < disc.level ? "bg-blood-red ring-1 ring-blood-red/30 shadow-[0_0_6px_rgba(200,36,52,0.4)]" : "bg-bg-input border border-text-dim"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block">Poderes Adquiridos:</span>
                      {disc.powers.map((pow, pIdx) => (
                        <div key={pIdx} className="flex items-center space-x-2 text-sm text-text-primary font-reading pl-2 py-0.5 border-l border-blood-red/40 bg-white/5 rounded-r-sm">
                          <span className="text-blood-red font-bold select-none">•</span>
                          <span>{pow}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VANTAGENS (ANTECEDENTES, MERITS, LORESHEETS) */}
          {activeTab === "vantagens" && (
            <div className="space-y-6">
              <h3 className="text-lg font-gothic tracking-wider text-blood-red border-b border-white/5 pb-2 mb-4 uppercase">
                Vantagens, Qualidades, Defeitos & Fichas de Saber
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* ANTECEDENTES E QUALIDADES (BACKGROUNDS & MERITS) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-data uppercase tracking-wider text-gold-accent font-bold">Qualidades & Antecedentes</h4>
                  <div className="space-y-3">
                    {character.advantages.filter(a => a.type === "background" || a.type === "merit").map(adv => (
                      <div key={adv.id} className="bg-bg-main/30 border border-white/5 rounded-sm p-4 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-data font-semibold text-sm text-text-primary uppercase tracking-wide">
                            {adv.name} <span className="text-[10px] text-gold-accent font-normal italic">({adv.type === "background" ? "Antecedente" : "Qualidade"})</span>
                          </span>
                          <div className="flex space-x-1">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <div
                                key={idx}
                                className={`w-2.5 h-2.5 rounded-full ${
                                  idx < adv.level ? "bg-gold-accent" : "bg-bg-input border border-text-dim"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {adv.description && (
                          <p className="text-xs text-text-muted font-reading leading-relaxed">
                            {adv.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* DEFEITOS & LORESHEETS (FLAWS & LORESHEETS) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-data uppercase tracking-wider text-blood-red font-bold">Defeitos & Fichas de Saber</h4>
                  <div className="space-y-3">
                    {character.advantages.filter(a => a.type === "flaw" || a.type === "loresheet").map(adv => {
                      const isLoresheet = adv.type === "loresheet";
                      return (
                        <div key={adv.id} className="bg-bg-main/30 border border-white/5 rounded-sm p-4 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-data font-semibold text-sm text-text-primary uppercase tracking-wide">
                              {adv.name} <span className={`text-[10px] font-normal italic ${isLoresheet ? "text-gold-accent" : "text-hunger-red"}`}>
                                ({isLoresheet ? "Ficha de Saber" : "Defeito"})
                              </span>
                            </span>
                            <div className="flex space-x-1">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <div
                                  key={idx}
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    idx < adv.level 
                                      ? (isLoresheet ? "bg-gold-accent" : "bg-hunger-red shadow-[0_0_4px_rgba(255,92,92,0.4)]") 
                                      : "bg-bg-input border border-text-dim"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {adv.description && (
                            <p className="text-xs text-text-muted font-reading leading-relaxed">
                              {adv.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: SISTEMA (MACROS DE ROLAGEM E SIMULADOR) */}
          {activeTab === "sistema" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* COLUNA ESQUERDA: MACROS DE ATAQUE/TESTES */}
              <div className="lg:col-span-6 space-y-4">
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

                {/* BLOCO DE NOTAS */}
                <div className="space-y-2 pt-4">
                  <h4 className="text-xs font-data uppercase tracking-wider text-text-muted font-bold">Anotações do Narrador & Histórico</h4>
                  <textarea
                    value={character.notes}
                    onChange={(e) => setCharacter(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full h-32 bg-bg-main border border-white/10 rounded p-3 text-sm font-reading text-text-primary focus:border-gold-accent outline-none resize-none transition-colors duration-150"
                    placeholder="Histórico livre, anotações de NPCs e metas..."
                  />
                </div>
              </div>

              {/* COLUNA DIREITA: SIMULADOR DE ROLAGEM GÓTICA (INTERATIVO) */}
              <div className="lg:col-span-6 bg-bg-main border border-white/10 rounded-sm p-4 space-y-4 min-h-[300px] flex flex-col justify-between">
                
                {/* ESTADO INICIAL VAZIO */}
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
                  // RESULTADO DA ROLAGEM DE DADOS DO VAMPIRO
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

                    {/* DADOS ROLADOS GRAFICAMENTE */}
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

                    {/* TEXTO DE FEEDBACK CRÍTICO / BESTIAL */}
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
                
                {/* AVISO DO V5 */}
                <div className="text-[10px] text-text-dim border-t border-white/5 pt-3 leading-snug font-sans">
                  * A rolagens do V5 consideram sucessos dados de valor 6 ou maior. Pares de 10 geram sucessos críticos (+2 adicionais). Dados de Fome podem gerar falhas bestiais ou vitórias messiânicas.
                </div>

              </div>

            </div>
          )}

        </section>

      </div>
    </main>
  );
}

// ========================================================
// COMPONENTE AUXILIAR: DotSlider (SLIDER DE PONTOS COM CONTROLE DE OVERFLOW NO MOBILE)
// ========================================================
interface DotSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  allowZero?: boolean;
  specialties?: Specialty[];
}

function DotSlider({ label, value, onChange, allowZero = false, specialties = [] }: DotSliderProps) {
  
  // A área inteira da linha tem altura física de 44px (h-11) para touch target ideal no mobile
  // A área de bolinhas tem tamanho fixo de 110px de largura para evitar overflow em telas de 375px
  const handleTouchOrClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    // Divide a largura em 5 partes
    let newValue = Math.ceil(percentage * 5);
    if (newValue < 0) newValue = 0;
    if (newValue > 5) newValue = 5;

    // Se permitir zero e clicar na primeira bolinha já ativa, permite zerar
    if (allowZero && newValue === 1 && value === 1) {
      onChange(0);
    } else {
      onChange(newValue === 0 ? 1 : newValue); // se não permitir zero, o valor mínimo é 1
    }
  };

  return (
    <div className="flex justify-between items-center h-11 border-b border-white/5 hover:bg-white/5 px-2 rounded-sm transition-colors group">
      
      {/* NOME DA HABILIDADE / ATRIBUTO */}
      <div className="flex flex-col justify-center leading-none">
        <span className="font-data uppercase tracking-wider text-xs text-text-muted group-hover:text-text-primary transition-colors">
          {label}
        </span>
        
        {/* ESPECIALIZAÇÃO SE HOUVER */}
        {specialties.length > 0 && (
          <span className="text-[9px] text-gold-accent italic tracking-wide font-sans leading-tight">
            ({specialties.map(s => s.name).join(", ")})
          </span>
        )}
      </div>

      {/* ÁREA INTERATIVA DO SLIDER (TOQUE CONTÍNUO DE LARGURA FIXA 110px) */}
      <div 
        onClick={handleTouchOrClick}
        className="flex items-center justify-between space-x-1.5 cursor-pointer h-full px-2"
        style={{ width: "110px" }}
      >
        {Array.from({ length: 5 }).map((_, idx) => {
          const isActive = idx < value;
          return (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full transition-all duration-150 ${
                isActive 
                  ? "bg-gold-accent ring-1 ring-gold-accent/40 shadow-[0_0_8px_rgba(255,216,77,0.5)]" 
                  : "bg-bg-main border border-text-dim/80 hover:border-gold-accent"
              }`}
            />
          );
        })}
      </div>

    </div>
  );
}
