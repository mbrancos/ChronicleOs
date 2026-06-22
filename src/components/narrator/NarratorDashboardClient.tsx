"use client";

import { useState } from "react";
import Link from "next/link";
import CharacterMiniCard from "./CharacterMiniCard";
import { createCharacterAction, updateCampaignSettingsAction } from "@/app/actions/hubActions";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  narratorId: string;
  status: "DRAFT" | "RECRUITING" | "IN_PROGRESS" | "PAUSED" | "ARCHIVED";
  powerLevel: "FLEDGLING" | "NEONATE" | "ANCILLAE";
  extraXp: number;
  allowedClans: string[] | null;
  rollEffectMode: "NONE" | "HORROR" | "COMEDY";
  comedyImageUrl: string | null;
}

interface Character {
  id: string;
  name: string;
  campaignId: string | null;
  type: string;
  sheetData: any;
  status?: "DRAFT" | "READY" | "IN_PLAY";
}

interface NarratorDashboardClientProps {
  campaign: Campaign;
  players: Character[];
  npcs: Character[];
}

export default function NarratorDashboardClient({
  campaign,
  players,
  npcs
}: NarratorDashboardClientProps) {
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
  const [campaignPowerLevel, setCampaignPowerLevel] = useState(campaign.powerLevel || "NEONATE");
  const [campaignExtraXp, setCampaignExtraXp] = useState(campaign.extraXp || 0);
  const [campaignAllowedClans, setCampaignAllowedClans] = useState<string[]>(
    campaign.allowedClans || [
      "Banu Haqim", "Brujah", "Gangrel", "Hecata", "Lasombra", "Malkaviano", "Malkavian", "Ministério", "Nosferatu", "Ravnos", "Salubri", "Toreador", "Tremere", "Tzimisce", "Ventrue", "Caitiff", "Sem Clã"
    ]
  );
  const [rollEffectMode, setRollEffectMode] = useState<"NONE" | "HORROR" | "COMEDY">(campaign.rollEffectMode || "HORROR");
  const [comedyImageUrl, setComedyImageUrl] = useState<string>(campaign.comedyImageUrl || "");
  const [isImageValid, setIsImageValid] = useState<boolean>(true);

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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rollEffectMode === "COMEDY" && (!comedyImageUrl.trim() || !isImageValid)) {
      return; // Trava de segurança extra
    }

    setLoading(true);
    setErrorMsg(null);

    const response = await updateCampaignSettingsAction(campaign.id, {
      status: campaignStatus,
      powerLevel: campaignPowerLevel,
      extraXp: Number(campaignExtraXp) || 0,
      allowedClans: campaignAllowedClans,
      rollEffectMode,
      comedyImageUrl: rollEffectMode === "COMEDY" ? comedyImageUrl : null,
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-gold-accent font-data font-bold border border-gold-accent/30 px-2 py-0.5 rounded-sm">
                Escudo do Narrador
              </span>
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
            className={`px-5 py-3 text-xs uppercase tracking-widest font-data font-bold transition-all duration-200 border-b-2 cursor-pointer ${
              activeTab === "players"
                ? "border-blood-red text-blood-red bg-white/5"
                : "border-transparent text-text-muted hover:text-text-primary hover:bg-white/2"
            }`}
          >
            Matilha (Jogadores) • {players.length}
          </button>
          <button
            onClick={() => setActiveTab("npcs")}
            className={`px-5 py-3 text-xs uppercase tracking-widest font-data font-bold transition-all duration-200 border-b-2 cursor-pointer ${
              activeTab === "npcs"
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
                  <p className="font-gothic text-lg text-text-primary tracking-wide">A matilha está dispersa nas sombras</p>
                  <p className="text-xs text-text-muted max-w-md pt-1 leading-relaxed">
                    Nenhum jogador se uniu a este templo ainda. Compartilhe o link de convite acima para invocar sua prole e iniciar a história.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {players.map(char => (
                    <CharacterMiniCard key={char.id} character={char} />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="space-y-6">
              
              {/* Cabeçalho da Seção NPC */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h2 className="text-sm font-data uppercase tracking-widest text-gold-accent font-bold">
                  Aliados, Antagonistas & Criaturas
                </h2>
                <button
                  onClick={() => {
                    setErrorMsg(null);
                    setIsNpcModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-gold-accent hover:bg-yellow-600 text-bg-main text-xs uppercase tracking-widest font-data font-bold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(255,216,77,0.25)]"
                >
                  + Novo Antagonista
                </button>
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
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-text-muted block">Nível de Poder (Criação)</label>
                <select
                  value={campaignPowerLevel}
                  onChange={(e) => setCampaignPowerLevel(e.target.value as any)}
                  className="w-full bg-bg-input border border-white/10 rounded-sm p-2 text-sm font-reading text-text-primary focus:border-blood-red outline-none transition-colors cursor-pointer"
                >
                  <option value="FLEDGLING" className="bg-bg-card text-text-primary">FLEDGLING (0 XP INICIAL)</option>
                  <option value="NEONATE" className="bg-bg-card text-text-primary">NEONATE (15 XP INICIAL)</option>
                  <option value="ANCILLAE" className="bg-bg-card text-text-primary">ANCILLAE (35 XP INICIAL)</option>
                </select>
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
    </main>
  );
}
