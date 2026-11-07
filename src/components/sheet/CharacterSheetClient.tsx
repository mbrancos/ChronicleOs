"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  CharacterSheetData, 
  RollMacro,
  DEFAULT_CHARACTER_DATA
} from "@/types/character";
import { useAutosave } from "@/hooks/useAutosave";
import { 
  updateCharacterSheet, 
  getCharacterXpLedger, 
  narratorOverrideSheetAction, 
  cleanupDraftXpLedgerAction 
} from "@/app/actions/characterActions";
import { rollRouseCheck } from "@/lib/vtt/BloodEngine";
import InventoryManager from "@/components/sheet/InventoryManager";
import MacroSection from "@/components/sheet/MacroSection";
import NotesSection from "@/components/sheet/NotesSection";
import XpDiarySection from "@/components/sheet/XpDiarySection";
import ImageCropModal, { CropResult } from "@/components/common/ImageCropModal";
import AssetVaultModal from "@/components/media/AssetVaultModal";
import { uploadMediaAssetAction, updateCharacterAvatarAction } from "@/app/actions/mediaActions";
import { useToast } from "@/context/ToastContext";
import type { SystemId, RegrasDeOuroSheetData } from "@/types/systems/regrasDeOuro";
import { createInitialRegrasDeOuroSheet } from "@/lib/systems/regrasDeOuro/rules";
import RegrasDeOuroSheetView from "@/components/sheet/regrasDeOuro/RegrasDeOuroSheetView";
import V5SheetView, { 
  V5_RECOMMENDED_MACROS, 
  executeSimulationRoll, 
  calculateBaseAndXp 
} from "@/components/sheet/V5SheetView";

// Helper de mesclagem recursiva para resiliência contra dados parciais no banco
function deepMerge<T extends object>(target: T, source: any): T {
  if (!source || typeof source !== "object") return target;
  if (!target || typeof target !== "object") return source;

  const output: any = Array.isArray(target) ? [...target] : { ...target };

  Object.keys(source).forEach((key) => {
    const targetVal = (target as any)[key];
    const sourceVal = source[key];

    if (sourceVal === undefined) return;

    if (
      targetVal &&
      typeof targetVal === "object" &&
      !Array.isArray(targetVal) &&
      sourceVal &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal)
    ) {
      output[key] = deepMerge(targetVal, sourceVal);
    } else {
      output[key] = sourceVal;
    }
  });

  return output;
}

interface CharacterSheetClientProps {
  characterId: string;
  campaignId: string | null;
  initialData: any;
  initialName?: string;
  systemId?: SystemId;
  onDataChange?: (data: any) => void;
  dicePool?: Array<{ id: string; label: string; value: number }>;
  onTraitClick?: (trait: { id: string; label: string; value: number }) => void;
  initialStatus?: "DRAFT" | "READY" | "IN_PLAY";
  initialBuildState?: any;
  characterType?: "jogador" | "npc" | "coterie";
  isStoryteller?: boolean;
  chronicle?: any;
  hideBackToHub?: boolean;
}

export default function CharacterSheetClient({
  characterId,
  campaignId,
  initialData,
  initialName = "",
  systemId,
  onDataChange,
  dicePool = [],
  onTraitClick,
  initialStatus = "DRAFT",
  initialBuildState = {},
  characterType = "jogador",
  isStoryteller = false,
  chronicle,
  hideBackToHub = false
}: CharacterSheetClientProps) {
  const { showSuccess, showWarning, showError } = useToast();

  // Detecção Multi-Sistema
  const isRegrasDeOuro = systemId === "regras_de_ouro" || (initialData as any)?.systemId === "regras_de_ouro";

  // Estado da Ficha V5
  const [character, setCharacter] = useState<CharacterSheetData>(() => {
    const baseData = initialData ? deepMerge(DEFAULT_CHARACTER_DATA, initialData) : { ...DEFAULT_CHARACTER_DATA };
    if (baseData.profile) {
      if (!baseData.profile.name || baseData.profile.name === "Novo Vampiro") {
        baseData.profile.name = initialName || baseData.profile.name || "Novo Vampiro";
      }
    }
    return baseData;
  });

  // Estado da Ficha Regras de Ouro 2.0
  const [regrasDeOuroData, setRegrasDeOuroData] = useState<RegrasDeOuroSheetData>(() => {
    if ((initialData as any)?.systemId === "regras_de_ouro") {
      return initialData as RegrasDeOuroSheetData;
    }
    return createInitialRegrasDeOuroSheet({ name: initialName });
  });

  // Estados Globais de Ciclo de Vida
  const [status, setStatus] = useState<"DRAFT" | "READY" | "IN_PLAY">(initialStatus);
  const [buildState, setBuildState] = useState<any>(initialBuildState);
  const [activeTabId, setActiveTabId] = useState<string>("ficha");
  const [isEvolvingMode, setIsEvolvingMode] = useState(false);
  const [isOverrideActive, setIsOverrideActive] = useState(false);

  // Estados para Modal de Avatar e Crop
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [avatarImageError, setAvatarImageError] = useState(false);
  const [selectedFileForCrop, setSelectedFileForCrop] = useState<File | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // Histórico de transações de XP
  const [xpLedger, setXpLedger] = useState<any[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const xpBalance = xpLedger.reduce((sum, item) => sum + (item.xpChange || 0), 0);

  // Estado de Sincronização e Autosave
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

  // Cálculo V5 de esqueleto base
  const alloc = calculateBaseAndXp(character);

  useEffect(() => {
    if (initialStatus === "IN_PLAY") {
      if (status !== "IN_PLAY") {
        setStatus("IN_PLAY");
      }
      return;
    }
    if (!isRegrasDeOuro) {
      const calculatedStatus = alloc.isDraft ? "DRAFT" : "READY";
      if (status !== calculatedStatus) {
        setStatus(calculatedStatus);
      }
    }
  }, [alloc.isDraft, initialStatus, isRegrasDeOuro, status]);

  // Autosave debounced para Regras de Ouro
  useAutosave(regrasDeOuroData, 1000, async (dataToSave) => {
    if (!isRegrasDeOuro) return;
    setSyncStatus("saving");
    const response = await updateCharacterSheet(characterId, dataToSave as any, buildStateRef.current, statusRef.current);
    if (response.success) {
      setSyncStatus("saved");
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => {
        setSyncStatus("idle");
      }, 2000);
    } else {
      setSyncStatus("error");
    }
  });

  // Autosave debounced para Vampiro V5
  useAutosave(character, 1000, async (dataToSave) => {
    if (isRegrasDeOuro) return;
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setSyncStatus("saving");
    const response = isOverrideActive
      ? await narratorOverrideSheetAction(
          characterId,
          dataToSave,
          buildStateRef.current,
          statusRef.current,
          "Edição Divina: Alteração efetuada pelo Narrador"
        )
      : await updateCharacterSheet(characterId, dataToSave, buildStateRef.current, statusRef.current);

    if (response.success) {
      setSyncStatus("saved");
      savedTimerRef.current = setTimeout(() => {
        setSyncStatus("idle");
      }, 2000);
    } else {
      setSyncStatus("error");
    }
  });

  // Notificar pai sobre alterações do estado do personagem
  const onDataChangeRef = useRef(onDataChange);
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    if (onDataChangeRef.current) {
      onDataChangeRef.current(isRegrasDeOuro ? regrasDeOuroData : character);
    }
  }, [character, regrasDeOuroData, isRegrasDeOuro]);

  // Carregar histórico de XP do banco ao abrir a aba "xp_diary"
  const fetchXpLedger = useCallback(async () => {
    setIsLoadingLedger(true);
    const res = await getCharacterXpLedger(characterId);
    if (res.success && res.data) {
      const hasDraftEntries = res.data.some(
        (item: any) =>
          item.description.toLowerCase().includes("criação") ||
          item.description.toLowerCase().includes("vantagem") ||
          item.description.toLowerCase().includes("criacão")
      );
      if (status !== "IN_PLAY" && hasDraftEntries) {
        await cleanupDraftXpLedgerAction(characterId);
        const cleanRes = await getCharacterXpLedger(characterId);
        if (cleanRes.success && cleanRes.data) {
          setXpLedger(cleanRes.data);
        }
      } else {
        setXpLedger(res.data);
      }
    }
    setIsLoadingLedger(false);
  }, [characterId, status]);

  useEffect(() => {
    fetchXpLedger();
  }, [fetchXpLedger]);

  // Simulador de Rolagem e Macros
  const [rollResult, setRollResult] = useState<{
    macroName: string;
    totalPool: number;
    successes: number;
    isCritical: boolean;
    isMessianic: boolean;
    isBestial: boolean;
    diceList: { type: "normal" | "hunger"; value: number }[];
  } | null>(null);

  const [isCreatingMacro, setIsCreatingMacro] = useState(false);

  const triggerRoll = (macro: RollMacro) => {
    const result = executeSimulationRoll(macro, character);
    
    if (result.shouldIncreaseHunger) {
      setCharacter(prev => ({
        ...prev,
        status: {
          ...prev.status,
          hunger: Math.min(5, (prev.status?.hunger || 0) + 1)
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

  const handleV5Roll = (diceCount: number, hungerCount: number, poolName: string) => {
    const diceList: { type: "normal" | "hunger"; value: number }[] = [];
    const hungerDice = Math.min(diceCount, Math.max(0, hungerCount));
    const normalDice = Math.max(0, diceCount - hungerDice);

    for (let i = 0; i < normalDice; i++) {
      diceList.push({ type: "normal", value: Math.floor(Math.random() * 10) + 1 });
    }
    for (let i = 0; i < hungerDice; i++) {
      diceList.push({ type: "hunger", value: Math.floor(Math.random() * 10) + 1 });
    }

    const normalSuccesses = diceList.filter(d => d.value >= 6).length;
    const normalTens = diceList.filter(d => d.type === "normal" && d.value === 10).length;
    const hungerTens = diceList.filter(d => d.type === "hunger" && d.value === 10).length;
    const totalTens = normalTens + hungerTens;
    const criticalPairs = Math.floor(totalTens / 2);
    const extraSuccesses = criticalPairs * 2;
    const successes = normalSuccesses + extraSuccesses;

    setRollResult({
      macroName: poolName,
      totalPool: diceCount,
      successes,
      isCritical: criticalPairs > 0,
      isMessianic: criticalPairs > 0 && hungerTens > 0,
      isBestial: diceList.some(d => d.type === "hunger" && d.value === 1) && successes === 0,
      diceList
    });
  };

  const handleRegrasDeOuroRoll = (diceCount: number, difficulty: number, label: string) => {
    const diceList: { type: "normal"; value: number }[] = [];
    for (let i = 0; i < diceCount; i++) {
      diceList.push({ type: "normal", value: Math.floor(Math.random() * 10) + 1 });
    }
    const successes = diceList.filter((d) => d.value >= difficulty).length;
    const tens = diceList.filter((d) => d.value === 10).length;
    const ones = diceList.filter((d) => d.value === 1).length;

    setRollResult({
      macroName: `${label} (Dif. ${difficulty})`,
      totalPool: diceCount,
      successes,
      isCritical: tens >= 2,
      isMessianic: false,
      isBestial: ones > successes && successes === 0,
      diceList,
    });
  };

  const handleRouseCheckSolo = () => {
    const result = rollRouseCheck();
    if (!result.isSuccess) {
      const nextHunger = Math.min(5, (character.status?.hunger || 0) + 1);
      setCharacter(prev => ({
        ...prev,
        status: {
          ...prev.status,
          hunger: nextHunger
        }
      }));
      showWarning(`🩸 A Besta exige mais Sangue! Fome aumentada para ${nextHunger}.`, "Teste de Despertar");
    } else {
      showSuccess(`🩸 O Sangue respondeu ao seu chamado! Fome mantida em ${character.status?.hunger || 0}.`, "Teste de Despertar");
    }

    setRollResult({
      macroName: "🩸 Teste de Despertar (Rouse Check)",
      totalPool: 1,
      successes: result.isSuccess ? 1 : 0,
      isCritical: false,
      isMessianic: false,
      isBestial: false,
      diceList: [{ type: "hunger", value: result.dieResult }]
    });
  };

  const handleGeneratePresets = () => {
    let addedCount = 0;
    setCharacter(prev => {
      const existingIds = new Set((prev.macros || []).map(m => m.id));
      const existingPoolKeys = new Set((prev.macros || []).map(m => m.pool.slice().sort().join("_")));
      
      const newPresets = V5_RECOMMENDED_MACROS.filter(preset => {
        const poolKey = preset.pool.slice().sort().join("_");
        return !existingIds.has(preset.id) && !existingPoolKeys.has(poolKey);
      });

      addedCount = newPresets.length;
      if (newPresets.length === 0) {
        return prev;
      }

      return {
        ...prev,
        macros: [...(prev.macros || []), ...newPresets]
      };
    });

    if (addedCount === 0) {
      showWarning("Todas as macros recomendadas V5 já foram adicionadas à ficha.");
    } else {
      showSuccess(`${addedCount} preset(s) recomendado(s) V5 adicionado(s) com sucesso!`);
    }
  };

  const handleDeleteMacro = (id: string) => {
    setCharacter(prev => ({
      ...prev,
      macros: (prev.macros || []).filter(m => m.id !== id)
    }));
    showSuccess("Macro removida com sucesso.");
  };

  // Upload e seleção de avatar
  const handleAvatarCropUpload = async (result: CropResult) => {
    try {
      const uploadRes = await uploadMediaAssetAction({
        campaignId: campaignId || null,
        name: result.name || `Avatar - ${character.profile?.name || initialName || "Personagem"}`,
        category: result.category || "avatar",
        base64: result.base64,
        sizeBytes: result.sizeBytes,
        width: result.width,
        height: result.height,
      });

      if (uploadRes.success && uploadRes.data) {
        const url = uploadRes.data.url;
        setCharacter(prev => ({
          ...prev,
          profile: { ...prev.profile, avatarUrl: url, portrait_url: url }
        }));
        setAvatarUrlInput(url);
        setAvatarImageError(false);
        setIsAvatarModalOpen(false);

        if (characterId) {
          await updateCharacterAvatarAction(characterId, url);
        }

        showSuccess("Avatar otimizado e atualizado com sucesso!");
      } else {
        showError(uploadRes.error || "Falha ao salvar avatar.");
      }
    } catch (err) {
      console.error("Erro ao subir avatar:", err);
      showError("Erro inesperado ao salvar avatar.");
    }
  };

  return (
    <main className="min-h-screen bg-bg-main text-text-primary p-4 md:p-8 font-reading flex flex-col justify-start items-center">
      <div className="w-full max-w-6xl space-y-6">
        
        {/* NAV VOLTAR AO HUB E FEEDBACK DE AUTOSAVE */}
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          {!hideBackToHub && !isStoryteller ? (
            <Link 
              href="/hub" 
              className="flex items-center space-x-2 text-xs uppercase tracking-widest text-text-muted hover:text-gold-accent transition-colors font-data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Voltar ao Hub</span>
            </Link>
          ) : (
            <div />
          )}

          {/* INDICADOR VISUAL DE AUTOSAVE DEBOUNCED */}
          <div className="flex items-center space-x-4 font-data text-xs select-none">
            <div className="min-h-6 flex items-center animate-fade-in">
              {syncStatus === "saving" && (
                <span className="text-text-muted uppercase tracking-wider flex items-center space-x-1.5 text-[10px]">
                  <svg className="animate-spin h-3.5 w-3.5 text-gold-accent shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Salvando alterações...</span>
                </span>
              )}
              {syncStatus === "saved" && (
                <span className="text-gold-accent uppercase tracking-wider font-semibold flex items-center space-x-1.5 text-[10px]">
                  <svg className="w-3.5 h-3.5 text-gold-accent shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Nuvem Sincronizada</span>
                </span>
              )}
              {syncStatus === "error" && (
                <span className="text-hunger-red uppercase tracking-wider font-semibold animate-bounce flex items-center space-x-1.5 text-[10px]">
                  <svg className="w-3.5 h-3.5 text-hunger-red shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Erro ao Salvar</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isRegrasDeOuro && (
                <span className="px-2 py-0.5 rounded-xs text-[10px] uppercase tracking-wider font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40">
                  Regras de Ouro 2.0
                </span>
              )}
              <div className="text-xs uppercase tracking-wider text-blood-red font-gothic text-right">
                {!campaignId || campaignId === "cofre" ? "Cofre (Sem Crônica) 🔒" : chronicle?.name ? `Crônica: ${chronicle.name}` : `Crônica Ativa`}
              </div>
            </div>
          </div>
        </div>

        {/* PAINEL DE STATUS DA CRIAÇÃO & CARTEIRA DE XP */}
        <div className="bg-bg-card border border-white/5 p-4 rounded-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs uppercase tracking-widest text-text-muted font-data font-bold">Estado da Ficha:</span>
            {characterType === "npc" ? (
              <span className="px-2.5 py-1 bg-gold-accent/15 border border-gold-accent/40 text-gold-accent text-xs font-bold font-data uppercase tracking-wider rounded-xs flex items-center gap-1.5 shadow-[0_0_8px_rgba(255,216,77,0.15)]">
                <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse" />
                Antagonista / NPC (Edição Livre) 🛡️
              </span>
            ) : status === "IN_PLAY" ? (
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
          
          {status === "IN_PLAY" && !isRegrasDeOuro && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-xs font-data uppercase">
                <span className="text-text-muted">Saldo de XP Disponível:</span>
                <span className="text-emerald-400 font-bold text-sm tracking-wider">{xpBalance} XP</span>
              </div>
              {xpBalance > 0 && (
                <button
                  type="button"
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
          {status === "READY" && campaignId && campaignId !== "cofre" && characterType === "jogador" && (
            <button
              type="button"
              onClick={async () => {
                setStatus("IN_PLAY");
                const response = await updateCharacterSheet(characterId, (isRegrasDeOuro ? regrasDeOuroData : character) as any, buildStateRef.current, "IN_PLAY");
                if (response.success) {
                  showSuccess("Ficha concluída e trancada para a crônica!", "Pronto para Jogar");
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                } else {
                  showError("Erro ao trancar ficha: " + response.error);
                }
              }}
              className="px-3 py-1 bg-blood-red hover:bg-burgundy text-white text-[10px] font-bold font-data uppercase tracking-wider rounded-xs cursor-pointer shadow-md transition-colors"
            >
              Confirmar Alterações & Voltar ao Jogo 🔒
            </button>
          )}
        </div>

        {/* ======================================================== */}
        {/* BARRA DE ABAS PRINCIPAL (ORQUESTRADOR POLIMÓRFICO) */}
        {/* ======================================================== */}
        <div className="sticky top-0 z-30 bg-bg-main/95 backdrop-blur-md border-b border-white/10 py-3 flex items-center select-none shadow-md overflow-x-auto scrollbar-none flex-row flex-nowrap md:flex-wrap space-x-1.5 gap-y-1.5 w-full">
          {(
            [
              { id: "ficha", label: "🩸 Ficha" },
              { id: "biografia", label: "📜 Biografia & Anotações" },
              { id: "inventario", label: "🎒 Inventário" },
              { id: "macros", label: "🎲 Rolagens & Macros" },
              { id: "xp_diary", label: "💎 Diário de XP" },
            ] as const
          ).map((item) => {
            const isActive = activeTabId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setRollResult(null);
                  setActiveTabId(item.id);
                }}
                className={`shrink-0 py-1.5 px-3.5 text-[10px] uppercase tracking-widest font-data font-bold border transition-all duration-200 cursor-pointer focus:outline-none rounded-sm ${
                  isActive
                    ? "bg-gold-accent/20 border-gold-accent text-gold-accent shadow-[0_0_10px_rgba(212,175,55,0.25)] scale-102 font-extrabold"
                    : "border-white/10 hover:border-gold-accent/60 hover:text-gold-accent text-text-muted bg-black/45"
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {isStoryteller && (
            <button
              type="button"
              onClick={() => {
                setIsOverrideActive(prev => {
                  const newVal = !prev;
                  if (newVal) {
                    showSuccess("Edição Divina Ativada! Modificações de bolinhas, disciplinas e vantagens salvarão imediatamente de graça.");
                  } else {
                    showWarning("Edição Divina Desativada. A ficha voltou ao comportamento padrão.");
                  }
                  return newVal;
                });
              }}
              className={`shrink-0 py-1.5 px-4 text-[10px] uppercase tracking-widest font-data font-bold border rounded-sm transition-all duration-150 cursor-pointer focus:outline-none md:ml-auto ${
                isOverrideActive
                  ? "bg-gold-accent text-bg-main border-gold-accent shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                  : "bg-black/45 border-white/10 hover:border-gold-accent hover:text-gold-accent text-text-muted"
              }`}
            >
              Edição Divina ⚡ {isOverrideActive ? "Ativa" : "Inativa"}
            </button>
          )}
        </div>

        {/* ======================================================== */}
        {/* CONTEÚDO DAS ABAS */}
        {/* ======================================================== */}
        <div className="pb-16 space-y-6">
          
          {/* ABA 1: FICHA POLIMÓRFICA (REGRAS DE OURO vs V5) */}
          {activeTabId === "ficha" && (
            isRegrasDeOuro ? (
              <RegrasDeOuroSheetView
                sheetData={regrasDeOuroData}
                onUpdateSheet={setRegrasDeOuroData}
                characterName={initialName || "Novo Vampiro"}
                isNarrator={isStoryteller}
                disabled={status === "IN_PLAY" && !isStoryteller}
                onRollDice={handleRegrasDeOuroRoll}
              />
            ) : (
              <V5SheetView
                character={character}
                onUpdateCharacter={setCharacter}
                isStoryteller={isStoryteller}
                disabled={status === "IN_PLAY" && !isStoryteller}
                isEvolvingMode={isEvolvingMode}
                onToggleEvolvingMode={() => setIsEvolvingMode(!isEvolvingMode)}
                chronicle={chronicle}
                campaignId={campaignId}
                onRollDice={handleV5Roll}
                characterId={characterId}
                onOpenAvatarModal={() => {
                  setAvatarUrlInput(character.profile?.avatarUrl || character.profile?.portrait_url || "");
                  setIsAvatarModalOpen(true);
                }}
                characterType={characterType}
                status={status}
                isOverrideActive={isOverrideActive}
                onToggleOverride={() => setIsOverrideActive(prev => !prev)}
                dicePool={dicePool}
                onTraitClick={onTraitClick}
              />
            )
          )}

          {/* ABA 2: BIOGRAFIA & ANOTAÇÕES */}
          {(activeTabId === "biografia" || activeTabId === "anotacoes") && (
            <NotesSection
              notes={isRegrasDeOuro ? (regrasDeOuroData.notes || "") : (character.notes || "")}
              onNotesChange={(val) => {
                if (isRegrasDeOuro) {
                  setRegrasDeOuroData(prev => ({ ...prev, notes: val }));
                } else {
                  setCharacter(prev => ({ ...prev, notes: val }));
                }
              }}
              disabled={status === "IN_PLAY" && !isStoryteller && !isOverrideActive}
            />
          )}

          {/* ABA 3: INVENTÁRIO */}
          {activeTabId === "inventario" && (
            <div className="bg-bg-card border border-white/10 rounded-sm p-6">
              <InventoryManager
                items={isRegrasDeOuro ? (regrasDeOuroData.inventory as any) : character.inventory}
                onChange={(newItems) => {
                  if (isRegrasDeOuro) {
                    setRegrasDeOuroData(prev => ({ ...prev, inventory: newItems as any }));
                  } else {
                    setCharacter(prev => ({ ...prev, inventory: newItems }));
                  }
                }}
                disabled={status === "IN_PLAY" && !isStoryteller && !isOverrideActive}
              />
            </div>
          )}

          {/* ABA 4: ROLAGENS & MACROS */}
          {activeTabId === "macros" && (
            <MacroSection
              character={character}
              status={status}
              isReadOnly={status === "IN_PLAY" && !isStoryteller && !isOverrideActive}
              isOverrideActive={isOverrideActive}
              onRouseCheck={handleRouseCheckSolo}
              onExecuteMacro={triggerRoll}
              onAddMacro={() => setIsCreatingMacro(!isCreatingMacro)}
              onDeleteMacro={handleDeleteMacro}
              onApplyV5Presets={handleGeneratePresets}
              rollResult={rollResult}
              onClearRollResult={() => setRollResult(null)}
            />
          )}

          {/* ABA 5: DIÁRIO DE XP */}
          {activeTabId === "xp_diary" && (
            <XpDiarySection
              characterId={characterId}
              character={character}
              status={status}
              onCharacterChange={setCharacter}
              xpLedger={xpLedger}
              isLoadingLedger={isLoadingLedger}
              isReadOnly={status === "IN_PLAY" && !isStoryteller && !isOverrideActive}
              onCleanupDraftLedger={async () => {
                const res = await cleanupDraftXpLedgerAction(characterId);
                if (res.success) {
                  showSuccess("Lançamentos de rascunho limpos com sucesso!", "Diário de XP Atualizado");
                  fetchXpLedger();
                } else {
                  showError("Erro ao limpar histórico: " + res.error);
                }
              }}
            />
          )}

        </div>
      </div>

      {/* MODAL COMPARTILHADO DE ROLAGEM DE DADOS */}
      {rollResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-bg-card border border-gold-accent/40 rounded-sm p-6 relative shadow-[0_0_25px_rgba(212,175,55,0.2)]">
            <button
              type="button"
              onClick={() => setRollResult(null)}
              className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors cursor-pointer text-base"
            >
              ✕
            </button>
            <h4 className="text-sm font-gothic tracking-widest text-gold-accent uppercase pb-2 border-b border-white/5 mb-3">
              {rollResult.macroName}
            </h4>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs uppercase font-data text-text-muted">Sucessos:</span>
              <span className="text-2xl font-mono font-bold text-gold-accent">{rollResult.successes}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 my-3 p-2 bg-black/30 rounded-xs border border-white/5">
              {rollResult.diceList.map((d, i) => (
                <span
                  key={i}
                  className={`w-7 h-7 rounded-xs border flex items-center justify-center font-mono font-bold text-xs ${
                    d.value >= 6 ? "bg-gold-accent/20 border-gold-accent text-gold-accent" : "bg-bg-input border-white/10 text-text-muted"
                  }`}
                >
                  {d.value}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRollResult(null)}
              className="w-full py-1.5 bg-white/10 hover:bg-white/20 text-xs uppercase font-data tracking-wider rounded-xs cursor-pointer transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE ALTERAÇÃO DA FOTO DE PERFIL */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-bg-card border border-gold-accent/40 max-w-md w-full p-6 rounded-sm shadow-[0_0_30px_rgba(0,0,0,0.9)] space-y-4 font-data">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-gothic tracking-wider text-gold-accent uppercase flex items-center gap-2">
                <span>📷 Alterar Foto do Personagem</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="text-text-muted hover:text-white transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex flex-col items-center justify-center p-3 bg-linear-to-b from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 border border-gold-accent/30 rounded-xs cursor-pointer text-center transition-all group shadow-sm">
                <span className="text-lg mb-1 group-hover:scale-110 transition-transform">✂️</span>
                <span className="text-[10px] font-bold text-gold-accent uppercase tracking-wider">Subir & Recortar</span>
                <span className="text-[8px] text-text-dim mt-0.5">Enquadrar rosto (1:1 WebP)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFileForCrop(e.target.files[0]);
                      setIsCropOpen(true);
                    }
                    e.target.value = "";
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setIsVaultOpen(true)}
                className="flex flex-col items-center justify-center p-3 bg-linear-to-b from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 border border-white/15 hover:border-gold-accent/40 rounded-xs cursor-pointer text-center transition-all group shadow-sm"
              >
                <span className="text-lg mb-1 group-hover:scale-110 transition-transform">🗂️</span>
                <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">Biblioteca da Mesa</span>
                <span className="text-[8px] text-text-dim mt-0.5">Escolher mídia salva</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-white/10"></div>
              <span className="shrink mx-2 text-[9px] uppercase tracking-widest text-text-muted font-bold">ou link externo</span>
              <div className="grow border-t border-white/10"></div>
            </div>

            <div className="space-y-2">
              <input 
                type="text"
                placeholder="https://exemplo.com/minha-foto.png"
                value={avatarUrlInput}
                onChange={(e) => {
                  setAvatarUrlInput(e.target.value);
                  setAvatarImageError(false);
                }}
                className="w-full bg-bg-input border border-white/15 text-text-primary text-xs p-2 rounded-xs outline-none focus:border-gold-accent font-reading"
              />

              <div className="pt-2 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full border-2 border-gold-accent/40 bg-black overflow-hidden flex items-center justify-center shadow-inner">
                  {avatarUrlInput.trim() && !avatarImageError ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={avatarUrlInput.trim()} 
                      alt="Preview Avatar"
                      className="w-full h-full object-cover object-center"
                      onError={() => setAvatarImageError(true)}
                    />
                  ) : (
                    <div className="text-center p-2">
                      <span className="text-[10px] text-text-dim">
                        {avatarImageError ? "⚠️ Link inválido" : "Sem foto"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              {(character.profile?.avatarUrl || character.profile?.portrait_url) ? (
                <button
                  type="button"
                  onClick={() => {
                    setCharacter(prev => ({
                      ...prev,
                      profile: { ...prev.profile, avatarUrl: "", portrait_url: "" }
                    }));
                    setAvatarUrlInput("");
                    setAvatarImageError(false);
                    setIsAvatarModalOpen(false);
                    showSuccess("Foto de perfil removida com sucesso!");
                  }}
                  className="px-2.5 py-1 border border-hunger-red/40 text-hunger-red hover:bg-hunger-red/10 text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                >
                  Remover
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="px-3 py-1 border border-white/10 text-text-muted hover:text-white text-[10px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = avatarUrlInput.trim();
                    setCharacter(prev => ({
                      ...prev,
                      profile: { ...prev.profile, avatarUrl: trimmed, portrait_url: trimmed }
                    }));
                    setAvatarImageError(false);
                    setIsAvatarModalOpen(false);
                    showSuccess("Foto de perfil atualizada com sucesso!");
                  }}
                  className="px-3 py-1 bg-burgundy border border-blood-red text-white text-[10px] font-bold uppercase tracking-wider rounded-xs hover:bg-blood-red transition-colors cursor-pointer shadow-md"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CROP DE AVATAR */}
      <ImageCropModal
        isOpen={isCropOpen}
        file={selectedFileForCrop}
        aspectRatioType="1:1"
        title="Enquadrar Rosto do Vampiro (1:1)"
        onClose={() => setIsCropOpen(false)}
        onCropped={handleAvatarCropUpload}
      />

      {/* MODAL DO ASSET VAULT */}
      <AssetVaultModal
        isOpen={isVaultOpen}
        campaignId={campaignId}
        targetCategory="avatar"
        onClose={() => setIsVaultOpen(false)}
        onSelectImage={async (url) => {
          setCharacter(prev => ({
            ...prev,
            profile: { ...prev.profile, avatarUrl: url, portrait_url: url }
          }));
          setAvatarUrlInput(url);
          setAvatarImageError(false);
          setIsAvatarModalOpen(false);
          if (characterId) {
            await updateCharacterAvatarAction(characterId, url);
          }
          showSuccess("Avatar atualizado da biblioteca!");
        }}
      />
    </main>
  );
}
