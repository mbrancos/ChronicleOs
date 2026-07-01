"use client";

import { useState } from "react";
import Link from "next/link";
import CharacterMiniCard from "./CharacterMiniCard";
import { createCharacterAction, updateCampaignSettingsAction, updateCampaignSessionAction } from "@/app/actions/hubActions";
import { usePresence } from "@/hooks/usePresence";
import { ChronicleSystemRules, DEFAULT_CHRONICLE_RULES } from "@/db/schema";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  narratorId: string;
  status: "DRAFT" | "RECRUITING" | "IN_PROGRESS" | "PAUSED" | "ARCHIVED";
  powerLevel: string;
  extraXp: number;
  allowedClans: string[] | null;
  tenets?: string[];
  currentSession: number;
  rollEffectMode: "NONE" | "HORROR" | "COMEDY";
  comedyImageUrl: string | null;
  systemRules: ChronicleSystemRules | null;
}

interface Character {
  id: string;
  name: string;
  campaignId: string | null;
  type: string;
  sheetData: any;
  status?: "DRAFT" | "READY" | "IN_PLAY";
  userId?: string | null;
}

interface NarratorDashboardClientProps {
  campaign: Campaign;
  players: Character[];
  npcs: Character[];
  vaultCharacters?: Character[];
}

export default function NarratorDashboardClient({
  campaign,
  players,
  npcs,
  vaultCharacters = []
}: NarratorDashboardClientProps) {
  const onlineUsers = usePresence(campaign.id);
  const [activeTab, setActiveTab] = useState<"players" | "npcs">("players");

  // Estados para cópia do convite
  const [copied, setCopied] = useState(false);

  // Estados para modal de NPC
  const [isNpcModalOpen, setIsNpcModalOpen] = useState(false);
  const [npcName, setNpcName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados para modal de configurações da campanha
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState(campaign.status || "RECRUITING");
  const [campaignPowerLevels, setCampaignPowerLevels] = useState<string[]>(() => {
    if (!campaign.powerLevel) return ["FLEDGLING", "NEONATE", "ANCILLAE"];
    return campaign.powerLevel.split(",");
  });

  // Estados para modal de Puxar do Cofre
  const [isPullModalOpen, setIsPullModalOpen] = useState(false);
  const [selectedVaultCharIds, setSelectedVaultCharIds] = useState<string[]>([]);
  const [pullLoading, setPullLoading] = useState(false);
  const [campaignExtraXp, setCampaignExtraXp] = useState(campaign.extraXp || 0);
  const [campaignAllowedClans, setCampaignAllowedClans] = useState<string[]>(
    campaign.allowedClans || [
      "Banu Haqim", "Brujah", "Gangrel", "Hecata", "Lasombra", "Malkaviano", "Malkavian", "Ministério", "Nosferatu", "Ravnos", "Salubri", "Toreador", "Tremere", "Tzimisce", "Ventrue", "Caitiff", "Sem Clã"
    ]
  );
  const [campaignTenets, setCampaignTenets] = useState<string[]>(campaign.tenets || []);
  const [newTenet, setNewTenet] = useState("");
  const [campaignSession, setCampaignSession] = useState(campaign.currentSession || 1);
  const [rollEffectMode, setRollEffectMode] = useState<"NONE" | "HORROR" | "COMEDY">(campaign.rollEffectMode || "HORROR");
  const [comedyImageUrl, setComedyImageUrl] = useState<string>(campaign.comedyImageUrl || "");
  const [isImageValid, setIsImageValid] = useState<boolean>(true);

  const [systemRules, setSystemRules] = useState<ChronicleSystemRules>(() => {
    return campaign.systemRules || DEFAULT_CHRONICLE_RULES;
  });

  const sanitizeImageUrl = (url: string): string => {
    if (!url) return "";
    const driveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(driveRegex);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawUrl = e.target.value;
    const sanitized = sanitizeImageUrl(rawUrl);
    setComedyImageUrl(sanitized);
    if (sanitized.trim() === "") {
      setIsImageValid(false);
    } else {
      setIsImageValid(true);
    }
  };

  const handleImageLoad = () => {
    setIsImageValid(true);
  };

  const handleImageError = () => {
    setIsImageValid(false);
  };

  const handleAddTenet = () => {
    const trimmed = newTenet.trim();
    if (trimmed && !campaignTenets.includes(trimmed)) {
      setCampaignTenets([...campaignTenets, trimmed]);
      setNewTenet("");
    }
  };

  const handleRemoveTenet = (indexToRemove: number) => {
    setCampaignTenets(campaignTenets.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rollEffectMode === "COMEDY" && (!comedyImageUrl.trim() || !isImageValid)) {
      return; // Trava de segurança extra
    }

    setLoading(true);
    setErrorMsg(null);

    const response = await updateCampaignSettingsAction(campaign.id, {
      status: campaignStatus,
      powerLevel: campaignPowerLevels.join(","),
      extraXp: Number(campaignExtraXp) || 0,
      allowedClans: campaignAllowedClans,
      tenets: campaignTenets,
      currentSession: Number(campaignSession) || 1,
      rollEffectMode,
      comedyImageUrl: rollEffectMode === "COMEDY" ? comedyImageUrl : null,
      systemRules,
    });

    if (response.success) {
      setIsSettingsModalOpen(false);
      window.location.reload();
    } else {
      setErrorMsg(response.error || "Erro ao salvar configurações.");
    }
    setLoading(false);
  };

  const handleToggleClan = (clan: string) => {
    setCampaignAllowedClans(prev =>
      prev.includes(clan) ? prev.filter(c => c !== clan) : [...prev, clan]
    );
  };

  const handleCopyInvite = () => {
    if (typeof window !== "undefined") {
      const inviteUrl = `${window.location.origin}/convite/${campaign.id}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateNpc = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = npcName.trim();
    if (!name) {
      setErrorMsg("O nome do antagonista é obrigatório.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const response = await createCharacterAction(name, campaign.id, "npc");

    if (response.success) {
      setNpcName("");
      setIsNpcModalOpen(false);
    } else {
      setErrorMsg(response.error || "Erro ao criar antagonista.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-bg-main text-text-primary p-4 md:p-8 font-reading flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-8">

        {/* CABEÇALHO DO ESCUDO */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-white/10 gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest text-gold-accent font-data font-bold border border-gold-accent/30 px-2 py-0.5 rounded-sm">
                Escudo do Narrador
              </span>

              {/* Relógio da Crônica */}
              <div className="flex items-center gap-1.5 border border-blood-red/30 bg-blood-red/5 px-2 py-0.5 rounded-sm">
                <span className="text-[9px] uppercase tracking-wider text-blood-red font-data font-bold">
                  Sessão {String(campaign.currentSession).padStart(2, "0")}
                </span>
                <div className="h-2.5 w-px bg-blood-red/20 mx-0.5" />
                <button
                  onClick={async () => {
                    const newSess = campaign.currentSession + 1;
                    const res = await updateCampaignSessionAction(campaign.id, newSess);
                    if (res.success) {
                      window.location.reload();
                    }
                  }}
                  className="text-[9px] font-bold text-text-muted hover:text-gold-accent transition-colors font-mono px-0.5 cursor-pointer"
                  title="Avançar Sessão"
                >
                  +
                </button>
                <button
                  onClick={async () => {
                    const newSess = campaign.currentSession - 1;
                    if (newSess >= 1) {
                      const res = await updateCampaignSessionAction(campaign.id, newSess);
                      if (res.success) {
                        window.location.reload();
                      }
                    }
                  }}
                  disabled={campaign.currentSession <= 1}
                  className="text-[9px] font-bold text-text-muted hover:text-gold-accent disabled:text-text-dim/20 disabled:hover:text-text-dim/20 disabled:cursor-not-allowed transition-colors font-mono px-0.5 cursor-pointer"
                  title="Retroceder Sessão"
                >
                  -
                </button>
              </div>
            </div>
            <h1 className="text-4xl font-gothic tracking-widest text-blood-red pt-2 uppercase">
              {campaign.name}
            </h1>
            <p className="text-xs text-text-muted font-reading pt-1 leading-relaxed max-w-2xl">
              {campaign.description || "Nenhuma sinopse registrada para esta campanha nas sombras."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/campanhas/${campaign.id}/mesa`}
              className="px-4 py-1.5 bg-blood-red hover:bg-burgundy text-white text-xs uppercase tracking-widest font-data font-bold rounded-sm cursor-pointer transition-colors shadow-[0_0_8px_rgba(200,36,52,0.4)] flex items-center gap-1.5"
            >
              🦇 Abrir Mesa de Jogo
            </Link>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-3.5 py-1.5 border border-white/10 hover:border-gold-accent text-xs uppercase tracking-widest font-data text-text-muted hover:text-white transition-all duration-200 rounded-sm bg-bg-card/45 cursor-pointer"
            >
              Configurações ⚙️
            </button>
            <button
              onClick={handleCopyInvite}
              className="px-3.5 py-1.5 border border-white/10 hover:border-gold-accent text-xs uppercase tracking-widest font-data text-text-muted hover:text-white transition-all duration-200 rounded-sm bg-bg-card/45 cursor-pointer"
            >
              {copied ? "Link Copiado! 🩸" : "Copiar Convite 🔗"}
            </button>
            <Link
              href="/hub"
              className="px-3.5 py-1.5 border border-white/10 hover:border-blood-red text-xs uppercase tracking-widest font-data text-text-dim hover:text-hunger-red transition-all duration-200 rounded-sm bg-bg-card/20 cursor-pointer"
            >
              Retornar ao Hub
            </Link>
          </div>
        </header>

        {/* NAVEGAÇÃO DE ABAS TÁTICAS */}
        <div className="flex border-b border-white/5 gap-2">
          <button
            onClick={() => setActiveTab("players")}
            className={`px-5 py-3 text-xs uppercase tracking-widest font-data font-bold transition-all duration-200 border-b-2 cursor-pointer ${activeTab === "players"
                ? "border-blood-red text-blood-red bg-white/5"
                : "border-transparent text-text-muted hover:text-text-primary hover:bg-white/2"
              }`}
          >
            Coterie (Jogadores) • {players.length}
          </button>
          <button
            onClick={() => setActiveTab("npcs")}
            className={`px-5 py-3 text-xs uppercase tracking-widest font-data font-bold transition-all duration-200 border-b-2 cursor-pointer ${activeTab === "npcs"
                ? "border-gold-accent text-gold-accent bg-white/5"
                : "border-transparent text-text-muted hover:text-text-primary hover:bg-white/2"
              }`}
          >
            Antagonistas (NPCs) • {npcs.length}
          </button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div>
          {activeTab === "players" ? (
            <section className="space-y-4">
              {players.length === 0 ? (
                <div className="border border-dashed border-white/10 bg-bg-card/10 rounded-sm p-12 flex flex-col items-center justify-center text-center h-72">
                  <svg className="w-12 h-12 text-text-dim/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="font-gothic text-lg text-text-primary tracking-wide">A Coterie está dispersa nas sombras</p>
                  <p className="text-xs text-text-muted max-w-md pt-1 leading-relaxed">
                    Nenhum jogador se uniu a este templo ainda. Compartilhe o link de convite acima para invocar sua prole e iniciar a história.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {players.map(char => (
                    <CharacterMiniCard
                      key={char.id}
                      character={char}
                      isOnline={char.userId ? onlineUsers.includes(char.userId) : false}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="space-y-6">

              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h2 className="text-sm font-data uppercase tracking-widest text-gold-accent font-bold">
                  Aliados, Antagonistas & Criaturas
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedVaultCharIds([]);
                      setErrorMsg(null);
                      setIsPullModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 border border-gold-accent/40 hover:border-gold-accent text-gold-accent hover:text-white text-xs uppercase tracking-widest font-data font-bold rounded-sm cursor-pointer transition-colors"
                  >
                    Puxar do Cofre 📥
                  </button>
                  <button
                    onClick={() => {
                      setErrorMsg(null);
                      setIsNpcModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-gold-accent hover:bg-yellow-600 text-bg-main text-xs uppercase tracking-widest font-data font-bold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(255,216,77,0.25)]"
                  >
                    + Novo Personagem
                  </button>
                </div>
              </div>

              {npcs.length === 0 ? (
                <div
                  onClick={() => {
                    setErrorMsg(null);
                    setIsNpcModalOpen(true);
                  }}
                  className="border border-dashed border-gold-accent/20 hover:border-gold-accent/40 bg-bg-card/10 rounded-sm p-12 flex flex-col items-center justify-center text-center h-72 cursor-pointer transition-all duration-200 group"
                >
                  <svg className="w-12 h-12 text-gold-accent/30 group-hover:text-gold-accent/60 transition-colors mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="font-gothic text-lg text-text-primary tracking-wide">Nenhuma ameaça oculta</p>
                  <p className="text-xs text-text-muted max-w-md pt-1 leading-relaxed">
                    Você não registrou antagonistas, caçadores ou NPCs para esta crônica. Clique aqui para dar origem a um novo perigo oculto.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {npcs.map(char => (
                    <CharacterMiniCard key={char.id} character={char} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

      </div>

      {/* ========================================== */}
      {/* MODAL GÓTICO: CRIAR NOVO ANTAGONISTA */}
      {/* ========================================== */}
      {isNpcModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            className="w-full max-w-md bg-bg-card border border-gold-accent/40 rounded-sm p-6 relative shadow-[0_0_25px_rgba(255,216,77,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão de Fechar */}
            <button
              onClick={() => setIsNpcModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white text-lg font-data focus:outline-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-2xl font-gothic tracking-widest text-gold-accent uppercase pb-2 border-b border-white/5 mb-4">
              Forjar Antagonista
            </h3>

            {errorMsg && (
              <div className="bg-hunger-red/10 border border-hunger-red text-hunger-red text-xs p-3 rounded-sm mb-4 font-data uppercase tracking-wider text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateNpc} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">
                  Nome do NPC / Antagonista
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Xerife Sullivan, Inquisidor Thorne"
                  value={npcName}
                  onChange={(e) => setNpcName(e.target.value)}
                  className="w-full bg-bg-input border border-white/10 rounded-sm p-2.5 text-sm font-reading text-text-primary focus:border-gold-accent outline-none transition-colors"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNpcModalOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:border-white text-text-muted hover:text-white text-xs uppercase tracking-widest font-data transition-colors rounded-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gold-accent hover:bg-yellow-600 text-bg-main text-xs uppercase tracking-widest font-data font-bold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(255,216,77,0.3)]"
                >
                  {loading ? "Criando..." : "Criar NPC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================== */}
      {/* MODAL GÓTICO: CONFIGURAÇÕES DA CRÔNICA */}
      {/* ========================================== */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            className="w-full max-w-lg bg-bg-card border border-blood-red/40 rounded-sm p-6 relative shadow-[0_0_25px_rgba(200,36,52,0.15)] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsSettingsModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white text-lg font-data focus:outline-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-2xl font-gothic tracking-widest text-blood-red uppercase pb-2 border-b border-white/5 mb-4">
              Configurações da Crônica
            </h3>

            {errorMsg && (
              <div className="bg-hunger-red/10 border border-hunger-red text-hunger-red text-xs p-3 rounded-sm mb-4 font-data uppercase tracking-wider text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 font-data text-xs">

              {/* Status da Campanha */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted block">Status da Crônica</label>
                <select
                  value={campaignStatus}
                  onChange={(e) => setCampaignStatus(e.target.value as any)}
                  className="w-full bg-bg-input border border-white/10 rounded-sm p-2 text-sm font-reading text-text-primary focus:border-blood-red outline-none transition-colors cursor-pointer"
                >
                  <option value="DRAFT" className="bg-bg-card text-text-primary">RASCUNHO (FECHADA)</option>
                  <option value="RECRUITING" className="bg-bg-card text-text-primary">RECRUTAMENTO (ABERTA)</option>
                  <option value="IN_PROGRESS" className="bg-bg-card text-text-primary">EM ANDAMENTO (BLOQUEADA)</option>
                  <option value="PAUSED" className="bg-bg-card text-text-primary">HIATO (PAUSADA)</option>
                  <option value="ARCHIVED" className="bg-bg-card text-text-primary">CONCLUÍDA (ARQUIVADA)</option>
                </select>
              </div>

              {/* Nível de Poder V5 */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-text-muted block">Níveis de Poder Permitidos (Criação)</label>
                <div className="flex flex-wrap gap-4 bg-bg-main/50 p-3 border border-white/5 rounded-sm">
                  {[
                    { val: "FLEDGLING", label: "Cria (0 XP)" },
                    { val: "NEONATE", label: "Neófito (15 XP)" },
                    { val: "ANCILLAE", label: "Ancila (35 XP)" },
                  ].map(lvl => (
                    <label key={lvl.val} className="flex items-center space-x-2 cursor-pointer py-1 font-sans text-xs">
                      <input
                        type="checkbox"
                        checked={campaignPowerLevels.includes(lvl.val)}
                        onChange={() => {
                          setCampaignPowerLevels(prev => {
                            const next = prev.includes(lvl.val)
                              ? prev.filter(v => v !== lvl.val)
                              : [...prev, lvl.val];
                            return next.length > 0 ? next : prev;
                          });
                        }}
                        className="accent-blood-red rounded-xs border-white/10"
                      />
                      <span className="text-text-primary font-medium">{lvl.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* XP Adicional */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted block">XP Extra Concedido (Criação)</label>
                <input
                  type="number"
                  min="0"
                  value={campaignExtraXp}
                  onChange={(e) => setCampaignExtraXp(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-bg-input border border-white/10 rounded-sm p-2 text-sm font-reading text-text-primary focus:border-blood-red outline-none transition-colors"
                />
              </div>

              {/* Sessão Atual */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted block">Sessão Atual</label>
                <input
                  type="number"
                  min="1"
                  value={campaignSession}
                  onChange={(e) => setCampaignSession(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-bg-input border border-white/10 rounded-sm p-2 text-sm font-reading text-text-primary focus:border-blood-red outline-none transition-colors"
                />
              </div>

              {/* Clãs Permitidos */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-text-muted block">Clãs Permitidos</label>
                <div className="grid grid-cols-2 gap-2 bg-bg-main/50 p-3 border border-white/5 rounded-sm max-h-60 overflow-y-auto">
                  {[
                    "Banu Haqim", "Brujah", "Gangrel", "Hecata", "Lasombra", "Malkaviano", "Malkavian", "Ministério", "Nosferatu", "Ravnos", "Salubri", "Toreador", "Tremere", "Tzimisce", "Ventrue", "Caitiff", "Sem Clã"
                  ].map(clan => (
                    <label key={clan} className="flex items-center space-x-2 cursor-pointer py-1 font-sans text-xs">
                      <input
                        type="checkbox"
                        checked={campaignAllowedClans.includes(clan)}
                        onChange={() => handleToggleClan(clan)}
                        className="accent-blood-red rounded-xs border-white/10"
                      />
                      <span className="text-text-primary font-medium">{clan}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Princípios da Crônica (Tenets) */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="text-[10px] uppercase tracking-widest text-text-muted block">
                  Princípios da Crônica (Chronicle Tenets)
                </label>
                <p className="text-[9px] text-text-dim leading-normal font-sans">
                  Diretrizes morais comuns a todos os personagens. Transgredir estes princípios gera Máculas.
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTenet}
                    onChange={(e) => setNewTenet(e.target.value)}
                    placeholder="Ex: Não matarás inocentes"
                    className="flex-1 bg-bg-input border border-white/10 rounded-sm p-2 text-xs font-reading text-text-primary focus:border-blood-red outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTenet();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTenet}
                    className="px-3 bg-blood-red hover:bg-burgundy text-white text-xs uppercase tracking-widest font-bold rounded-sm transition-colors cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  {campaignTenets.map((tenet, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-bg-main/40 border border-white/5 p-2 rounded-xs text-xs"
                    >
                      <span className="text-text-primary font-reading italic">“{tenet}”</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTenet(idx)}
                        className="text-hunger-red hover:text-red-500 font-bold px-1.5 uppercase font-data text-[10px] tracking-wider cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                  {campaignTenets.length === 0 && (
                    <span className="text-[10px] text-text-dim/60 italic block text-center py-2 bg-black/15 rounded-xs border border-dashed border-white/5">
                      Nenhum princípio moral definido para esta crônica.
                    </span>
                  )}
                </div>
              </div>

              {/* Regras da Casa (Homebrews) */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <span className="text-[10px] uppercase tracking-widest text-text-muted block">
                  Regras da Casa (Homebrews)
                </span>
                
                <div className="space-y-3 p-3 bg-black/20 border border-white/5 rounded-sm">
                  
                  {/* Toggle 1: Flexibilidade de Sangue */}
                  <label className="flex items-start justify-between cursor-pointer group">
                    <div className="max-w-[80%] pr-4 font-sans">
                      <span className="block text-xs font-semibold text-text-primary group-hover:text-blood-red transition-colors">
                        ⚡ Permitir Flexibilidade de Sangue
                      </span>
                      <span className="block text-[9px] text-text-dim mt-0.5 leading-normal">
                        Permite que os jogadores comprem múltiplos poderes de nível baixo sem precisar subir o nível de bolinhas da Disciplina.
                      </span>
                    </div>
                    <div className="relative flex items-center h-5 mt-1 select-none">
                      <input 
                        type="checkbox" 
                        className="peer sr-only"
                        checked={systemRules.allowExtraPowersWithoutDots}
                        onChange={(e) => setSystemRules(prev => ({ ...prev, allowExtraPowersWithoutDots: e.target.checked }))}
                      />
                      <div className="w-8 h-4 bg-white/10 rounded-full peer-checked:bg-blood-red transition-colors border border-white/5 peer-checked:border-red-500 flex items-center">
                         <div className={`w-3 h-3 bg-text-muted rounded-full transition-all ${systemRules.allowExtraPowersWithoutDots ? 'translate-x-4 bg-white' : 'translate-x-0.5'}`} />
                      </div>
                    </div>
                  </label>

                  {/* Toggle 2: Automação de Humanidade */}
                  <label className="flex items-start justify-between cursor-pointer group">
                    <div className="max-w-[80%] pr-4 font-sans">
                      <span className="block text-xs font-semibold text-text-primary group-hover:text-blood-red transition-colors">
                        🩸 Julgamento do Sangue Automático
                      </span>
                      <span className="block text-[9px] text-text-dim mt-0.5 leading-normal">
                        Aplica imediatamente as alterações e bônus de Humanidade concedidas pelo Tipo de Predador selecionado na ficha de criação.
                      </span>
                    </div>
                    <div className="relative flex items-center h-5 mt-1 select-none">
                      <input 
                        type="checkbox" 
                        className="peer sr-only"
                        checked={systemRules.freeHumanityAjustOnPredator}
                        onChange={(e) => setSystemRules(prev => ({ ...prev, freeHumanityAjustOnPredator: e.target.checked }))}
                      />
                      <div className="w-8 h-4 bg-white/10 rounded-full peer-checked:bg-blood-red transition-colors border border-white/5 peer-checked:border-red-500 flex items-center">
                         <div className={`w-3 h-3 bg-text-muted rounded-full transition-all ${systemRules.freeHumanityAjustOnPredator ? 'translate-x-4 bg-white' : 'translate-x-0.5'}`} />
                      </div>
                    </div>
                  </label>

                  {/* Toggle 3: Automação de Disciplinas de Predador */}
                  <label className="flex items-start justify-between cursor-pointer group">
                    <div className="max-w-[80%] pr-4 font-sans">
                      <span className="block text-xs font-semibold text-text-primary group-hover:text-blood-red transition-colors">
                        ✨ Automação de Escolha de Predador
                      </span>
                      <span className="block text-[9px] text-text-dim mt-0.5 leading-normal">
                        Exibe o banner interativo na seção de disciplinas para o jogador alocar o ponto de bônus do seu Tipo de Predador.
                      </span>
                    </div>
                    <div className="relative flex items-center h-5 mt-1 select-none">
                      <input 
                        type="checkbox" 
                        className="peer sr-only"
                        checked={systemRules.autoAlocatePredatorDisciplines}
                        onChange={(e) => setSystemRules(prev => ({ ...prev, autoAlocatePredatorDisciplines: e.target.checked }))}
                      />
                      <div className="w-8 h-4 bg-white/10 rounded-full peer-checked:bg-blood-red transition-colors border border-white/5 peer-checked:border-red-500 flex items-center">
                         <div className={`w-3 h-3 bg-text-muted rounded-full transition-all ${systemRules.autoAlocatePredatorDisciplines ? 'translate-x-4 bg-white' : 'translate-x-0.5'}`} />
                      </div>
                    </div>
                  </label>

                  {/* Multiplicador de XP com Cast Numérico Estrito */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="max-w-[70%] pr-4 font-sans">
                      <span className="block text-xs font-semibold text-text-primary">
                        📈 Multiplicador de XP de Sessão
                      </span>
                      <span className="block text-[9px] text-text-dim mt-0.5 leading-normal">
                        Multiplica o total de XP distribuído pelo Narrador no final da sessão (Limitado de 1x a 5x).
                      </span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={1}
                      value={systemRules.xpMultiplier || 1}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 1 : Number(e.target.value);
                        setSystemRules(prev => ({ ...prev, xpMultiplier: Math.max(1, Math.min(5, val)) }));
                      }}
                      className="w-16 bg-bg-input border border-white/10 rounded-sm p-1.5 text-xs text-center font-mono text-text-primary focus:border-blood-red outline-none"
                    />
                  </div>

                </div>
              </div>

              {/* Efeitos de Mesa */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[10px] uppercase tracking-widest text-text-muted block">Efeitos de Mesa</span>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-text-muted block">Modo de Efeito Audiovisual</label>
                  <select
                    value={rollEffectMode}
                    onChange={(e) => {
                      const val = e.target.value as "NONE" | "HORROR" | "COMEDY";
                      setRollEffectMode(val);
                      if (val !== "COMEDY") {
                        setIsImageValid(true);
                      } else {
                        setIsImageValid(comedyImageUrl.trim() !== "");
                      }
                    }}
                    className="w-full bg-bg-input border border-white/10 rounded-sm p-2 text-sm font-reading text-text-primary focus:border-blood-red outline-none transition-colors cursor-pointer"
                  >
                    <option value="NONE" className="bg-bg-card text-text-primary">NENHUM</option>
                    <option value="HORROR" className="bg-bg-card text-text-primary">SOMBRIO / HORROR (ARRASTAMENTO CARDÍACO)</option>
                    <option value="COMEDY" className="bg-bg-card text-text-primary">ALÍVIO CÔMICO (TOASTY DO MASCOTE)</option>
                  </select>
                </div>

                {rollEffectMode === "COMEDY" && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-text-muted block">
                        URL do Mascote (Link Direto PNG)
                      </label>
                      <input
                        type="url"
                        required={rollEffectMode === "COMEDY"}
                        placeholder="https://i.imgur.com/exemplo.png"
                        value={comedyImageUrl}
                        onChange={handleImageUrlChange}
                        className="w-full bg-bg-input border border-white/10 rounded-sm p-2 text-sm font-reading text-text-primary focus:border-blood-red outline-none transition-colors"
                      />
                      <p className="text-[9px] text-text-dim leading-normal font-sans pt-1">
                        ⚠️ <strong>Atenção aos &quot;Falsos PNGs&quot;</strong>: Use links diretos terminados em <code>.png</code>. Recomendamos links diretos do Discord ou Imgur. Links de páginas normais do Pinterest ou Google Imagens possuem bloqueio de exibição (CORS) e falharão no preview.
                      </p>
                    </div>

                    <div className="flex items-start space-x-4 bg-black/20 p-2.5 border border-white/5 rounded-sm">
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-text-muted font-bold block">Preview</span>
                        <div className="bg-gray-900 h-32 w-32 border border-white/10 rounded-sm flex items-center justify-center overflow-hidden relative">
                          {comedyImageUrl.trim() ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={comedyImageUrl}
                              alt="Mascote Preview"
                              onLoad={handleImageLoad}
                              onError={handleImageError}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-[9px] text-text-dim italic">Sem Imagem</span>
                          )}
                        </div>
                      </div>

                      {!isImageValid && comedyImageUrl.trim() !== "" && (
                        <div className="flex-1 text-hunger-red text-[10px] font-sans leading-relaxed self-center bg-hunger-red/10 border border-hunger-red/35 p-2.5 rounded-xs">
                          ❌ <strong>Erro de Renderização:</strong> A URL fornecida é inválida ou possui bloqueio de proteção/CORS. O botão de salvar permanecerá desativado até que uma imagem válida seja renderizada no preview.
                        </div>
                      )}
                      {rollEffectMode === "COMEDY" && !comedyImageUrl.trim() && (
                        <div className="flex-1 text-yellow-500 text-[10px] font-sans leading-relaxed self-center bg-yellow-500/10 border border-yellow-500/35 p-2.5 rounded-xs">
                          ⚠️ <strong>Campo Obrigatório:</strong> Por favor, informe uma URL de imagem válida para o mascote no modo Alívio Cômico.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botões do Modal */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:border-white text-text-muted hover:text-white text-xs uppercase tracking-widest transition-colors rounded-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || (rollEffectMode === "COMEDY" && (!comedyImageUrl.trim() || !isImageValid))}
                  className="px-5 py-2 bg-blood-red hover:bg-burgundy disabled:bg-gray-800 disabled:text-text-dim disabled:border-transparent disabled:cursor-not-allowed text-white text-xs uppercase tracking-widest font-bold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(200,36,52,0.4)]"
                >
                  {loading ? "Salvando..." : "Salvar Configurações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL GÓTICO: PUXAR PERSONAGENS DO COFRE */}
      {/* ========================================== */}
      {isPullModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            className="w-full max-w-lg bg-bg-card border border-gold-accent/40 rounded-sm p-6 relative shadow-[0_0_25px_rgba(255,216,77,0.1)] max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão de Fechar */}
            <button
              onClick={() => setIsPullModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white text-lg font-data focus:outline-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-2xl font-gothic tracking-widest text-gold-accent uppercase pb-2 border-b border-white/5 mb-4 shrink-0">
              Puxar Membros do Cofre
            </h3>

            {errorMsg && (
              <div className="bg-hunger-red/10 border border-hunger-red text-hunger-red text-xs p-3 rounded-sm mb-4 font-data uppercase tracking-wider text-center shrink-0">
                {errorMsg}
              </div>
            )}

            <p className="text-xs text-text-dim leading-relaxed mb-4 shrink-0">
              Selecione personagens do seu cofre para torná-los Antagonistas/NPCs ativos desta crônica. Eles serão transferidos para esta campanha.
            </p>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-4 min-h-[200px] border border-white/5 bg-black/25 p-3 rounded-sm">
              {!vaultCharacters || vaultCharacters.length === 0 ? (
                <p className="text-xs text-text-muted italic text-center py-8">
                  Nenhum personagem disponível no cofre (sem crônica associada).
                </p>
              ) : (
                vaultCharacters.map(char => {
                  const clan = char.sheetData?.profile?.clan || "Sem Clã";
                  const concept = char.sheetData?.profile?.concept || "Conceito não definido";
                  const isChecked = selectedVaultCharIds.includes(char.id);

                  return (
                    <label
                      key={char.id}
                      className={`flex items-center justify-between p-3 rounded-sm border cursor-pointer transition-all duration-200 ${
                        isChecked
                          ? "bg-gold-accent/5 border-gold-accent/50 shadow-[0_0_10px_rgba(255,216,77,0.05)]"
                          : "bg-bg-card border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedVaultCharIds(prev =>
                              prev.includes(char.id)
                                ? prev.filter(id => id !== char.id)
                                : [...prev, char.id]
                            );
                          }}
                          className="accent-gold-accent rounded-xs cursor-pointer border-white/10 animate-fade-in"
                        />
                        <div>
                          <span className="text-sm font-gothic tracking-wide text-text-primary block uppercase">
                            {char.name}
                          </span>
                          <span className="text-[10px] text-text-dim uppercase tracking-wider font-data">
                            Clã {clan} • Conceito: {concept}
                          </span>
                        </div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded-xs border text-[8px] uppercase tracking-wider font-bold font-data ${char.type === "npc" ? "bg-hunger-red/10 text-hunger-red border border-hunger-red/25" : "bg-gold-accent/10 text-gold-accent border border-gold-accent/25"}`}>
                        {char.type === "npc" ? "NPC" : "Jogador"}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-2 shrink-0 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsPullModalOpen(false)}
                className="px-4 py-2 border border-white/10 hover:border-white text-text-muted hover:text-white text-xs uppercase tracking-widest font-data transition-colors rounded-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (selectedVaultCharIds.length === 0) return;
                  setPullLoading(true);
                  setErrorMsg(null);
                  const { pullCharactersToCampaignAsNpcAction } = await import("@/app/actions/characterActions");
                  const response = await pullCharactersToCampaignAsNpcAction(selectedVaultCharIds, campaign.id);
                  if (response.success) {
                    setIsPullModalOpen(false);
                    window.location.reload();
                  } else {
                    setErrorMsg(response.error || "Erro ao importar NPCs.");
                    setPullLoading(false);
                  }
                }}
                disabled={pullLoading || selectedVaultCharIds.length === 0}
                className="px-5 py-2 bg-gold-accent hover:bg-yellow-600 text-bg-main text-xs uppercase tracking-widest font-data font-bold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(255,216,77,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pullLoading ? "Importando..." : "Importar NPCs"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
