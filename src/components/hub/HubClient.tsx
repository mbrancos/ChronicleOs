"use client";

import { useState } from "react";
import Link from "next/link";
import { createCampaignAction } from "@/app/actions/campaignActions";
import { createCharacterAction } from "@/app/actions/characterActions";
import { signOutAction } from "@/app/actions/auth";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
}

interface Character {
  id: string;
  name: string;
  campaignId: string;
  type: string;
  sheetData: any; // Ficha JSONB
}

interface HubClientProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  campaigns: Campaign[];
  characters: Character[];
}

export default function HubClient({ user, campaigns, characters }: HubClientProps) {
  // Controle de abertura dos modais
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);

  // Estados dos formulários de criação
  const [campaignName, setCampaignName] = useState("");
  const [campaignDesc, setCampaignDesc] = useState("");
  
  const [characterName, setCharacterName] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  // Feedbacks visuais
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Abertura do modal de personagem resetando seleção
  const openCharacterModal = () => {
    if (campaigns.length > 0) {
      setSelectedCampaignId(campaigns[0].id);
      setIsCharacterModalOpen(true);
    }
  };

  // Handler para criar campanha
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const response = await createCampaignAction(campaignName, campaignDesc);

    if (response.success) {
      setCampaignName("");
      setCampaignDesc("");
      setIsCampaignModalOpen(false);
    } else {
      setErrorMsg(response.error || "Erro ao criar crônica.");
    }
    setLoading(false);
  };

  // Handler para criar personagem
  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!selectedCampaignId) {
      setErrorMsg("Selecione uma crônica para abrigar seu personagem.");
      setLoading(false);
      return;
    }

    const response = await createCharacterAction(characterName, selectedCampaignId);

    if (response.success) {
      setCharacterName("");
      setIsCharacterModalOpen(false);
    } else {
      setErrorMsg(response.error || "Erro ao criar personagem.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-bg-main text-text-primary p-4 md:p-8 font-reading flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-8">
        
        {/* CABEÇALHO SUPERIOR TEMÁTICO */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-white/10 gap-4">
          <div>
            <h1 className="text-4xl font-gothic tracking-widest text-blood-red">CHRONICLEOS</h1>
            <p className="text-xs uppercase tracking-widest text-text-muted font-data pt-1">
              Bem-vindo ao templo, <span className="text-gold-accent font-semibold">{user.name}</span>
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-xs font-data uppercase tracking-wider text-text-dim">
              Sessão: {user.email}
            </span>
            <button 
              onClick={async () => {
                await signOutAction();
              }}
              className="px-3 py-1 border border-white/10 hover:border-blood-red hover:text-hunger-red text-xs uppercase tracking-widest font-data transition-colors rounded-sm bg-bg-card/40 cursor-pointer"
            >
              Sair da Névoa
            </button>
          </div>
        </header>

        {/* GRADE PRINCIPAL DE CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ========================================== */}
          {/* SEÇÃO DO NARRADOR - MINHAS CRÔNICAS */}
          {/* ========================================== */}
          <section className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h2 className="text-xl font-gothic tracking-wider text-blood-red uppercase flex items-center gap-2">
                <span>Minhas Crônicas</span>
                <span className="text-xs font-data text-text-muted font-normal bg-white/5 px-2 py-0.5 rounded-full">
                  {campaigns.length}
                </span>
              </h2>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setIsCampaignModalOpen(true);
                }}
                className="px-3 py-1 bg-blood-red hover:bg-burgundy text-text-primary text-xs uppercase tracking-widest font-data font-semibold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(200,36,52,0.4)]"
              >
                + Nova Crônica
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div 
                onClick={() => {
                  setErrorMsg(null);
                  setIsCampaignModalOpen(true);
                }}
                className="border border-dashed border-blood-red/30 hover:border-blood-red/60 bg-bg-card/20 rounded-sm p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 h-64 group"
              >
                <svg className="w-12 h-12 text-blood-red/40 group-hover:text-blood-red/75 transition-colors mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="font-gothic text-lg text-text-primary tracking-wide">Seu grimório está silencioso</p>
                <p className="text-xs text-text-muted max-w-xs pt-1">
                  Nenhuma crônica ativa na névoa do tempo. Clique aqui para narrar uma nova história gótica.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {campaigns.map(camp => (
                  <div 
                    key={camp.id} 
                    className="bg-bg-card border border-white/10 hover:border-blood-red/40 p-5 rounded-sm flex flex-col justify-between transition-all duration-200 gap-3 group"
                  >
                    <div>
                      <h3 className="text-2xl font-gothic tracking-wide text-blood-red group-hover:text-hunger-red transition-colors">
                        {camp.name.toUpperCase()}
                      </h3>
                      <p className="text-xs text-text-muted font-reading leading-relaxed line-clamp-2 pt-1.5">
                        {camp.description || "Nenhuma sinopse registrada para esta campanha nas sombras."}
                      </p>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                      <span className="text-[10px] uppercase tracking-wider text-text-dim font-data">
                        ID: {camp.id.slice(0, 8)}
                      </span>
                      <Link
                        href={`/campanhas/${camp.id}/narrador`}
                        className="text-xs uppercase tracking-widest font-data font-bold text-gold-accent hover:text-white transition-colors"
                      >
                        Painel do Narrador →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ========================================== */}
          {/* SEÇÃO DO JOGADOR - MEUS PERSONAGENS */}
          {/* ========================================== */}
          <section className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h2 className="text-xl font-gothic tracking-wider text-gold-accent uppercase flex items-center gap-2">
                <span>Meus Personagens</span>
                <span className="text-xs font-data text-text-muted font-normal bg-white/5 px-2 py-0.5 rounded-full">
                  {characters.length}
                </span>
              </h2>
              
              <div className="relative group">
                <button
                  onClick={openCharacterModal}
                  disabled={campaigns.length === 0}
                  className={`px-3 py-1 text-xs uppercase tracking-widest font-data font-semibold rounded-sm transition-all duration-200 ${
                    campaigns.length === 0 
                      ? "bg-text-dim/20 text-text-dim border border-transparent cursor-not-allowed" 
                      : "bg-gold-accent hover:bg-yellow-600 text-bg-main cursor-pointer shadow-[0_0_6px_rgba(255,216,77,0.3)]"
                  }`}
                >
                  + Novo Personagem
                </button>
                {campaigns.length === 0 && (
                  <span className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-bg-card border border-gold-accent/40 text-[10px] text-gold-accent leading-normal rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-10 text-center font-data uppercase">
                    Crie uma crônica primeiro para poder abrigar um personagem.
                  </span>
                )}
              </div>
            </div>

            {characters.length === 0 ? (
              <div 
                onClick={campaigns.length > 0 ? openCharacterModal : undefined}
                className={`border border-dashed rounded-sm p-8 flex flex-col items-center justify-center text-center h-64 group transition-all duration-300 ${
                  campaigns.length === 0
                    ? "border-text-dim/20 bg-bg-card/5 cursor-not-allowed"
                    : "border-gold-accent/30 hover:border-gold-accent/60 bg-bg-card/20 cursor-pointer"
                }`}
              >
                <svg className={`w-12 h-12 mb-4 transition-colors ${
                  campaigns.length === 0 ? "text-text-dim/20" : "text-gold-accent/40 group-hover:text-gold-accent/75"
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="font-gothic text-lg text-text-primary tracking-wide">Nenhum vampiro gerado</p>
                <p className="text-xs text-text-muted max-w-xs pt-1">
                  {campaigns.length === 0 
                    ? "Consagre uma crônica no painel ao lado antes de dar origem a sua prole." 
                    : "Nenhum membro ativo sob sua tutela. Clique aqui para forjar seu primeiro personagem."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {characters.map(char => {
                  const clan = char.sheetData?.profile?.clan || "Vampiro";
                  const concept = char.sheetData?.profile?.concept || "Neófito";
                  
                  return (
                    <div 
                      key={char.id} 
                      className="bg-bg-card border border-white/10 hover:border-gold-accent/40 p-5 rounded-sm flex items-center justify-between transition-all duration-200 group gap-4"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Avatar temático minimalista */}
                        <div className="w-12 h-12 rounded-full bg-bg-main border border-gold-accent/30 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-gold-accent transition-colors">
                          <svg className="w-7 h-7 text-text-dim/40 group-hover:text-blood-red/40 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-gothic tracking-wide text-text-primary group-hover:text-gold-accent transition-colors">
                            {char.name.toUpperCase()}
                          </h3>
                          <p className="text-[10px] uppercase tracking-widest text-gold-accent font-data font-semibold">
                            Clã {clan} • {concept}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-[9px] uppercase tracking-wider text-text-dim font-data">
                          Crônica: {char.campaignId.slice(0, 8)}
                        </span>
                        <Link
                          href={`/campanhas/${char.campaignId}/personagens/${char.id}`}
                          className="text-xs uppercase tracking-widest font-data font-bold text-blood-red hover:text-white transition-colors"
                        >
                          Abrir Ficha →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>

      </div>

      {/* ========================================== */}
      {/* MODAL GÓTICO: INICIAR NOVA CRÔNICA */}
      {/* ========================================== */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div 
            className="w-full max-w-md bg-bg-card border border-blood-red/40 rounded-sm p-6 relative shadow-[0_0_25px_rgba(200,36,52,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão de Fechar */}
            <button 
              onClick={() => setIsCampaignModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white text-lg font-data focus:outline-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-2xl font-gothic tracking-widest text-blood-red uppercase pb-2 border-b border-white/5 mb-4">
              Consagrar Crônica
            </h3>

            {errorMsg && (
              <div className="bg-hunger-red/10 border border-hunger-red text-hunger-red text-xs p-3 rounded-sm mb-4 font-data uppercase tracking-wider">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">Nome da Crônica</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Noites Cariocas, Sangue em S.P."
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-bg-input border border-white/10 rounded-sm p-2 text-sm font-reading text-text-primary focus:border-blood-red outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">Sinopse / Descrição (Opcional)</label>
                <textarea
                  placeholder="Descreva a ambientação, o tom e os perigos que rondam a noite..."
                  value={campaignDesc}
                  onChange={(e) => setCampaignDesc(e.target.value)}
                  className="w-full h-24 bg-bg-input border border-white/10 rounded-sm p-2 text-sm font-reading text-text-primary focus:border-blood-red outline-none resize-none transition-colors"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:border-white text-text-muted hover:text-white text-xs uppercase tracking-widest font-data transition-colors rounded-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blood-red hover:bg-burgundy text-white text-xs uppercase tracking-widest font-data font-bold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(200,36,52,0.4)]"
                >
                  {loading ? "Consagrando..." : "Consagrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL GÓTICO: GERAR NOVO PERSONAGEM */}
      {/* ========================================== */}
      {isCharacterModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div 
            className="w-full max-w-md bg-bg-card border border-gold-accent/40 rounded-sm p-6 relative shadow-[0_0_25px_rgba(255,216,77,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão de Fechar */}
            <button 
              onClick={() => setIsCharacterModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white text-lg font-data focus:outline-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-2xl font-gothic tracking-widest text-gold-accent uppercase pb-2 border-b border-white/5 mb-4">
              Forjar Personagem
            </h3>

            {errorMsg && (
              <div className="bg-hunger-red/10 border border-hunger-red text-hunger-red text-xs p-3 rounded-sm mb-4 font-data uppercase tracking-wider">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCharacter} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">Nome do Vampiro</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Marcus Vane, Thomas Thorne"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full bg-bg-input border border-white/10 rounded-sm p-2 text-sm font-reading text-text-primary focus:border-gold-accent outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">Abrigado na Crônica</label>
                <select
                  required
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full bg-bg-input border border-white/10 rounded-sm p-2 text-sm font-reading text-text-primary focus:border-gold-accent outline-none transition-colors cursor-pointer"
                >
                  {campaigns.map(camp => (
                    <option key={camp.id} value={camp.id} className="bg-bg-card text-text-primary">
                      {camp.name.toUpperCase()} (ID: {camp.id.slice(0, 8)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCharacterModalOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:border-white text-text-muted hover:text-white text-xs uppercase tracking-widest font-data transition-colors rounded-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gold-accent hover:bg-yellow-600 text-bg-main text-xs uppercase tracking-widest font-data font-bold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(255,216,77,0.3)]"
                >
                  {loading ? "Gerando..." : "Gerar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
