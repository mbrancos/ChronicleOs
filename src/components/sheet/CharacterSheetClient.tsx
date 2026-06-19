"use client";

import { useState, useCallback, useRef } from "react";
import { 
  CharacterSheetData, 
  Tracker, 
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
import { updateCharacterSheet } from "@/app/actions/characterActions";
import InlineEdit from "@/components/sheet/InlineEdit";

const CLAN_OPTIONS = [
  "Brujah",
  "Gangrel",
  "Malkavian",
  "Nosferatu",
  "Toreador",
  "Tremere",
  "Ventrue",
  "Caitiff",
  "Sem Clã"
];

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

interface CharacterSheetClientProps {
  characterId: string;
  campaignId: string;
  initialData: CharacterSheetData | null;
  initialName?: string;
}

export default function CharacterSheetClient({
  characterId,
  campaignId,
  initialData,
  initialName = ""
}: CharacterSheetClientProps) {
  
  // ESTADO LOCAL DA FICHA (Mescla com os dados padrão Brujah se for novo personagem no banco)
  const [character, setCharacter] = useState<CharacterSheetData>(() => {
    const baseData = initialData ? deepMerge(DEFAULT_CHARACTER_DATA, initialData) : { ...DEFAULT_CHARACTER_DATA };
    if (baseData.profile) {
      // Sincronizar o nome público da tabela no profile do JSONB
      if (!baseData.profile.name || baseData.profile.name === "Marcus Vane") {
        baseData.profile.name = initialName || baseData.profile.name || "Marcus Vane";
      }
    }
    return baseData;
  });

  const [activeTab, setActiveTab] = useState<"nucleo" | "sangue" | "vantagens" | "sistema">("nucleo");
  
  // ESTADOS DO MINI-FORMULÁRIO DE ESPECIALIZAÇÕES (ABA NÚCLEO)
  const [selectedSkill, setSelectedSkill] = useState<keyof CharacterSkills | "">("");
  const [newSpecialtyName, setNewSpecialtyName] = useState("");
  
  // ESTADO DE SINCRONIZAÇÃO (Optimistic UI Autosave)
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // CALLBACK DE SALVAMENTO DEBOUNCED
  const triggerSave = useCallback(async (dataToSave: CharacterSheetData) => {
    // Cancelar qualquer timer anterior de esconder o status de "Salvo"
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }
    
    setSyncStatus("saving");
    
    const response = await updateCharacterSheet(characterId, dataToSave);
    
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

  // Alterações de Atributos
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

  // Alterações de Habilidades
  const handleSkillChange = (skillName: keyof CharacterSkills, value: number) => {
    setCharacter(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillName]: value
      }
    }));
  };

  // Alterações de Perfil (InlineEdit)
  const handleProfileChange = (field: keyof typeof character.profile, value: any) => {
    setCharacter(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }));
  };

  // ========================================================
  // CALLBACKS DE DISCIPLINAS E PODERES (ABA SANGUE)
  // ========================================================
  const handleAddDiscipline = () => {
    const newDisc: Discipline = {
      id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
      id: `adv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
      id: `spec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
    let poolSize = 0;
    
    macro.pool.forEach(key => {
      if (key in character.attributes.physical) {
        poolSize += (character.attributes.physical as any)[key];
      } else if (key in character.attributes.social) {
        poolSize += (character.attributes.social as any)[key];
      } else if (key in character.attributes.mental) {
        poolSize += (character.attributes.mental as any)[key];
      } else if (key in character.skills) {
        poolSize += (character.skills as any)[key];
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

    let normalSuccesses = diceList.filter(d => d.value >= 6).length;
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
    if (macro.rouse_check) {
      const rouseResult = Math.floor(Math.random() * 10) + 1;
      
      // Simulação visual do Rouse Check
      if (rouseResult < 6) {
        rouseText = " [Despertar: Falhou (Fome +1)]";
        // Atualiza a Fome no estado local (Optimistic UI)
        setCharacter(prev => ({
          ...prev,
          status: {
            ...prev.status,
            hunger: Math.min(5, prev.status.hunger + 1)
          }
        }));
      } else {
        rouseText = " [Despertar: Sucesso]";
      }
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
              Crônica Ativa: {campaignId.slice(0, 8)}
            </div>
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
              <div className="absolute inset-0 bg-linear-to-t from-bg-main/80 via-transparent to-transparent flex items-end justify-center pb-1">
                <span className="text-[10px] uppercase tracking-wider text-text-muted">Marcus</span>
              </div>
            </div>
          </div>

          {/* DADOS DE PERFIL */}
          <div className="lg:col-span-4 space-y-2 max-w-full">
            <h1 className="text-4xl font-gothic tracking-wider text-blood-red leading-none flex items-center gap-1">
              <InlineEdit
                value={character.profile.name || "Marcus Vane"}
                onChange={(val) => handleProfileChange("name", val)}
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
                className="text-gold-accent hover:bg-white/5 font-bold"
              />
              <span className="text-text-dim">•</span>
              <InlineEdit
                value={character.profile.concept}
                onChange={(val) => handleProfileChange("concept", val)}
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
                  className="text-text-primary hover:bg-white/5 font-bold"
                />
              </div>
              <div className="col-span-2 flex items-center gap-1 truncate">
                <span>Sire:</span>
                <InlineEdit
                  value={character.profile.sire}
                  onChange={(val) => handleProfileChange("sire", val)}
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
              onHumanityChange={(val) => setCharacter(prev => ({ ...prev, status: { ...prev.status, humanity: val } }))}
              onStainsChange={(val) => setCharacter(prev => ({ ...prev, status: { ...prev.status, stains: val } }))}
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
        <div className="flex space-x-2 border-b border-white/10 pb-px">
          {(["nucleo", "sangue", "vantagens", "sistema"] as const).map(tab => {
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
                      <button
                        onClick={() => handleDeleteSpecialty(spec.id)}
                        className="text-hunger-red hover:text-white cursor-pointer select-none text-[10px] font-bold"
                        title="Excluir Especialização"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {(!character.specialties || character.specialties.length === 0) && (
                    <span className="text-xs text-text-muted/60 italic font-reading">Nenhuma especialização cadastrada.</span>
                  )}
                </div>

                {/* MINI-FORMULÁRIO DE CADASTRO */}
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
                  <button
                    onClick={handleAddDiscipline}
                    className="text-xs uppercase tracking-wider font-bold text-gold-accent bg-burgundy/40 hover:bg-burgundy px-3 py-1 border border-blood-red/30 hover:border-blood-red rounded-sm transition-all duration-150 cursor-pointer shadow-none opacity-80 hover:opacity-100"
                  >
                    + Adicionar Disciplina
                  </button>
                </div>
                <div className="w-56 bg-bg-main/30 px-3 py-0.5 rounded border border-white/5">
                  <DotSlider
                    label="Potência do Sangue"
                    value={character.status.blood_potency}
                    onChange={(val) => setCharacter(prev => ({
                      ...prev,
                      status: { ...prev.status, blood_potency: val }
                    }))}
                    allowZero
                    variant="gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {character.disciplines.map(disc => (
                  <div key={disc.id} className="bg-bg-main/30 border border-white/5 rounded-sm p-4 space-y-3 relative group">
                    {/* BOTÃO EXCLUIR DISCIPLINA */}
                    <button
                      onClick={() => handleDeleteDiscipline(disc.id)}
                      className="absolute top-4 right-4 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer select-none"
                      title="Excluir Disciplina"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="flex justify-between items-center pr-6">
                      <InlineEdit
                        value={disc.name}
                        onChange={(val) => handleDisciplineNameChange(disc.id, val)}
                        placeholder="Nova Disciplina"
                        className="font-gothic text-xl text-text-primary tracking-wide"
                      />
                      
                      <div className="flex space-x-1 items-center h-6">
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const isActive = idx < disc.level;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleDisciplineLevelChange(disc.id, idx + 1)}
                              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 cursor-pointer ${
                                isActive 
                                  ? "bg-blood-red ring-1 ring-blood-red/30 shadow-[0_0_6px_rgba(200,36,52,0.4)]" 
                                  : "bg-bg-input border border-text-dim/80 hover:border-blood-red"
                              }`}
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
                                className="text-sm font-reading text-text-primary flex-1"
                              />
                            </div>
                            <button
                              onClick={() => handleDeletePower(disc.id, pIdx)}
                              className="text-text-muted/40 hover:text-hunger-red opacity-0 group-hover/power:opacity-100 transition-opacity duration-150 cursor-pointer pr-1 select-none text-[10px] font-bold"
                              title="Remover Poder"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleAddPower(disc.id)}
                        className="text-[10px] uppercase tracking-wider font-bold text-gold-accent/40 hover:text-gold-accent transition-colors duration-150 cursor-pointer pt-1.5 flex items-center space-x-1 select-none"
                      >
                        <span>+ Adicionar Poder</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VANTAGENS */}
          {activeTab === "vantagens" && (
            <div className="space-y-6">
              <h3 className="text-lg font-gothic tracking-wider text-blood-red border-b border-white/5 pb-2 mb-4 uppercase">
                Vantagens, Qualidades, Defeitos & Fichas de Saber
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* COLUNA 1: QUALIDADES & ANTECEDENTES */}
                <div className="space-y-4">
                  <h4 className="text-xs font-data uppercase tracking-wider text-gold-accent font-bold">Qualidades & Antecedentes</h4>
                  <div className="space-y-3">
                    {character.advantages.filter(a => a.type === "background" || a.type === "merit").map(adv => (
                      <div key={adv.id} className="bg-bg-main/30 border border-white/5 rounded-sm p-4 space-y-1.5 relative group">
                        {/* BOTÃO EXCLUIR VANTAGEM */}
                        <button
                          onClick={() => handleDeleteAdvantage(adv.id)}
                          className="absolute top-4 right-4 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer select-none"
                          title="Excluir Vantagem"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>

                        <div className="flex justify-between items-center pr-6 flex-wrap gap-2">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <InlineEdit
                              value={adv.name}
                              onChange={(val) => handleAdvantageNameChange(adv.id, val)}
                              placeholder="Nome da Vantagem"
                              className="font-data font-semibold text-sm text-text-primary uppercase tracking-wide"
                            />
                            <span className="text-[10px] text-gold-accent font-normal italic">
                              (
                              <InlineEdit
                                value={adv.type}
                                onChange={(val) => handleAdvantageTypeChange(adv.id, val as any)}
                                type="select"
                                options={["background", "merit"]}
                                className="hover:bg-white/5 text-[10px] text-gold-accent italic border-none py-0 px-0.5"
                              />
                              )
                            </span>
                          </div>
                          
                          <div className="flex space-x-1">
                            {Array.from({ length: 5 }).map((_, idx) => {
                              const isActive = idx < adv.level;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleAdvantageLevelChange(adv.id, idx + 1)}
                                  className={`w-3.5 h-3.5 rounded-full transition-all duration-150 cursor-pointer ${
                                    isActive ? "bg-gold-accent" : "bg-bg-input border border-text-dim"
                                  }`}
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
                          className="text-xs text-text-muted font-reading leading-relaxed w-full block"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleAddAdvantage("background")}
                    className="text-xs uppercase tracking-wider font-bold text-gold-accent/60 hover:text-gold-accent bg-white/5 hover:bg-white/10 px-3 py-2 rounded-sm border border-white/5 transition-all duration-150 cursor-pointer w-full mt-3 flex items-center justify-center select-none"
                  >
                    + Adicionar Qualidade / Antecedente
                  </button>
                </div>

                {/* COLUNA 2: DEFEITOS & FICHAS DE SABER */}
                <div className="space-y-4">
                  <h4 className="text-xs font-data uppercase tracking-wider text-blood-red font-bold">Defeitos & Fichas de Saber</h4>
                  <div className="space-y-3">
                    {character.advantages.filter(a => a.type === "flaw" || a.type === "loresheet").map(adv => {
                      const isLoresheet = adv.type === "loresheet";
                      return (
                        <div key={adv.id} className="bg-bg-main/30 border border-white/5 rounded-sm p-4 space-y-1.5 relative group">
                          {/* BOTÃO EXCLUIR VANTAGEM */}
                          <button
                            onClick={() => handleDeleteAdvantage(adv.id)}
                            className="absolute top-4 right-4 text-text-muted/40 hover:text-hunger-red opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer select-none"
                            title="Excluir Vantagem"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>

                          <div className="flex justify-between items-center pr-6 flex-wrap gap-2">
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <InlineEdit
                                value={adv.name}
                                onChange={(val) => handleAdvantageNameChange(adv.id, val)}
                                placeholder="Nome da Vantagem"
                                className="font-data font-semibold text-sm text-text-primary uppercase tracking-wide"
                              />
                              <span className={`text-[10px] font-normal italic ${isLoresheet ? "text-gold-accent" : "text-hunger-red"}`}>
                                (
                                <InlineEdit
                                  value={adv.type}
                                  onChange={(val) => handleAdvantageTypeChange(adv.id, val as any)}
                                  type="select"
                                  options={["flaw", "loresheet"]}
                                  className={`hover:bg-white/5 text-[10px] italic border-none py-0 px-0.5 ${isLoresheet ? "text-gold-accent" : "text-hunger-red"}`}
                                />
                                )
                              </span>
                            </div>
                            
                            <div className="flex space-x-1">
                              {Array.from({ length: 5 }).map((_, idx) => {
                                const isActive = idx < adv.level;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleAdvantageLevelChange(adv.id, idx + 1)}
                                    className={`w-3.5 h-3.5 rounded-full transition-all duration-150 cursor-pointer ${
                                      isActive 
                                        ? (isLoresheet ? "bg-gold-accent" : "bg-hunger-red shadow-[0_0_4px_rgba(255,92,92,0.4)]") 
                                        : "bg-bg-input border border-text-dim"
                                    }`}
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
                            className="text-xs text-text-muted font-reading leading-relaxed w-full block"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleAddAdvantage("flaw")}
                    className="text-xs uppercase tracking-wider font-bold text-blood-red/60 hover:text-blood-red bg-white/5 hover:bg-white/10 px-3 py-2 rounded-sm border border-white/5 transition-all duration-150 cursor-pointer w-full mt-3 flex items-center justify-center select-none"
                  >
                    + Adicionar Defeito / Ficha de Saber
                  </button>
                </div>

              </div>
            </div>
          )}

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
                    className="w-full h-32 bg-bg-main border border-white/10 rounded p-3 text-sm font-reading text-text-primary focus:border-gold-accent outline-none resize-none transition-colors duration-150"
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

        </section>

      </div>
    </main>
  );
}
