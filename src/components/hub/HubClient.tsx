"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  createCampaignAction, 
  createCharacterAction, 
  signOutAction, 
  updateCampaignAction, 
  deleteCampaignAction 
} from "@/app/actions/hubActions";
import { 
  deleteCharacterAction, 
  duplicateCharacterAction, 
  transferCharacterAction 
} from "@/app/actions/characterActions";

interface NarratorCampaign {
  id: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "RECRUITING" | "IN_PROGRESS" | "PAUSED" | "ARCHIVED";
}

interface PlayerCampaign {
  id: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "RECRUITING" | "IN_PROGRESS" | "PAUSED" | "ARCHIVED";
  powerLevel: "FLEDGLING" | "NEONATE" | "ANCILLAE";
  narratorName: string;
  characterName: string;
  characterId: string;
}

interface Character {
  id: string;
  name: string;
  campaignId: string | null;
  campaignName: string | null;
  type: string;
  sheetData: any; // Ficha JSONB
}

interface HubClientProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  narratorCampaigns: NarratorCampaign[];
  playerCampaigns: PlayerCampaign[];
  characters: Character[];
}

export default function HubClient({ 
  user, 
  narratorCampaigns, 
  playerCampaigns, 
  characters 
}: HubClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  // Estado para aba ativa de campanhas
  const [activeCampaignTab, setActiveCampaignTab] = useState<"narrator" | "player">("narrator");

  // Controle de abertura dos modais
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  // Estados dos formulários de criação
  const [campaignName, setCampaignName] = useState("");
  const [campaignDesc, setCampaignDesc] = useState("");
  
  // Estado para feedback de cópia de convite
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Feedbacks visuais
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados para exclusão de personagens
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<{ id: string; name: string } | null>(null);

  // Estados para Edição de Crônica
  const [isEditCampaignModalOpen, setIsEditCampaignModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<NarratorCampaign | null>(null);
  const [editCampaignName, setEditCampaignName] = useState("");
  const [editCampaignDesc, setEditCampaignDesc] = useState("");

  // Estados para Exclusão de Crônica
  const [isDeleteCampaignModalOpen, setIsDeleteCampaignModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<NarratorCampaign | null>(null);

  // Estados para Transferência de Personagem
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [characterToTransfer, setCharacterToTransfer] = useState<{ id: string; name: string } | null>(null);
  const [transferEmail, setTransferEmail] = useState("");

  // Controle do Menu Kebab Ativo
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Toast Feedback
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Tratar erros de acesso negado vindos de redirecionamentos de rotas (mesa/ficha)
  useEffect(() => {
    if (errorParam === "acesso_negado") {
      showToast("Acesso Negado: Você não faz parte desta crônica ou não possui personagem nela! 🩸", "error");
      
      // Limpa os parâmetros da URL de forma segura no Next.js sem quebrar o histórico de navegação
      router.replace("/hub", { scroll: false });
    }
  }, [errorParam, router]);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // Fecha menus kebabs ao clicar fora
  useEffect(() => {
    const closeAllMenus = () => setActiveMenuId(null);
    window.addEventListener("click", closeAllMenus);
    return () => window.removeEventListener("click", closeAllMenus);
  }, []);

  const openDeleteConfirmModal = (char: { id: string; name: string }) => {
    setErrorMsg(null);
    setCharacterToDelete(char);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCharacter = async () => {
    if (!characterToDelete) return;
    setLoading(true);
    setErrorMsg(null);

    const response = await deleteCharacterAction(characterToDelete.id);

    if (response.success) {
      setIsDeleteModalOpen(false);
      setCharacterToDelete(null);
      showToast("Vampiro apagado nas cinzas com sucesso! 🩸");
    } else {
      setErrorMsg(response.error || "Erro ao excluir o personagem.");
    }
    setLoading(false);
  };

  const handleDuplicateCharacter = async (charId: string) => {
    setLoading(true);
    const response = await duplicateCharacterAction(charId);
    if (response.success) {
      showToast("Vampiro duplicado com sucesso no seu Cofre! 🩸");
    } else {
      showToast(response.error || "Erro ao duplicar personagem.", "error");
    }
    setLoading(false);
  };

  const openTransferModal = (char: { id: string; name: string }) => {
    setErrorMsg(null);
    setTransferEmail("");
    setCharacterToTransfer(char);
    setIsTransferModalOpen(true);
  };

  const handleTransferCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!characterToTransfer) return;
    setLoading(true);
    setErrorMsg(null);

    const response = await transferCharacterAction(characterToTransfer.id, transferEmail);

    if (response.success) {
      setIsTransferModalOpen(false);
      setCharacterToTransfer(null);
      showToast(`Vampiro transferido com sucesso para ${transferEmail}! 🩸`);
    } else {
      setErrorMsg(response.error || "Erro ao transferir personagem.");
    }
    setLoading(false);
  };

  const openEditCampaignModal = (camp: NarratorCampaign) => {
    setErrorMsg(null);
    setCampaignToEdit(camp);
    setEditCampaignName(camp.name);
    setEditCampaignDesc(camp.description || "");
    setIsEditCampaignModalOpen(true);
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignToEdit) return;
    setLoading(true);
    setErrorMsg(null);

    const response = await updateCampaignAction(campaignToEdit.id, editCampaignName, editCampaignDesc);

    if (response.success) {
      setIsEditCampaignModalOpen(false);
      setCampaignToEdit(null);
      showToast("Crônica atualizada com sucesso! 🩸");
    } else {
      setErrorMsg(response.error || "Erro ao editar crônica.");
    }
    setLoading(false);
  };

  const openDeleteCampaignConfirmModal = (camp: NarratorCampaign) => {
    setErrorMsg(null);
    setCampaignToDelete(camp);
    setIsDeleteCampaignModalOpen(true);
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    setLoading(true);
    setErrorMsg(null);

    const response = await deleteCampaignAction(campaignToDelete.id);

    if (response.success) {
      setIsDeleteCampaignModalOpen(false);
      setCampaignToDelete(null);
      showToast("Crônica banida para as sombras com sucesso! 🩸");
    } else {
      setErrorMsg(response.error || "Erro ao excluir crônica.");
    }
    setLoading(false);
  };

  // Função para copiar o link de convite da crônica
  const handleCopyInvite = (campaignId: string) => {
    if (typeof window !== "undefined") {
      const inviteUrl = `${window.location.origin}/convite/${campaignId}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopiedId(campaignId);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
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

  // Handler para criar personagem rapidamente no cofre e redirecionar
  const handleQuickCreateCharacter = async () => {
    setLoading(true);
    setErrorMsg(null);

    const response = await createCharacterAction("Novo Vampiro", null);

    if (response.success && response.characterId) {
      showToast("Vampiro forjado com sucesso! 🩸");
      router.push(`/campanhas/cofre/personagens/${response.characterId}`);
    } else {
      showToast(response.error || "Erro ao criar personagem.", "error");
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
          {/* SEÇÃO DE CRÔNICAS (NARRADOR E JOGADOR) */}
          {/* ========================================== */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b border-white/5 gap-3">
              {/* Abas Góticas */}
              <div className="flex space-x-1 font-data text-xs uppercase tracking-wider">
                <button
                  onClick={() => setActiveCampaignTab("narrator")}
                  className={`px-4 py-2 rounded-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeCampaignTab === "narrator"
                      ? "bg-blood-red/10 text-blood-red border border-blood-red/25 shadow-[0_0_10px_rgba(200,36,52,0.15)]"
                      : "text-text-dim hover:text-text-primary hover:bg-white/2"
                  }`}
                >
                  Crônicas que Narro ({narratorCampaigns.length})
                </button>
                <button
                  onClick={() => setActiveCampaignTab("player")}
                  className={`px-4 py-2 rounded-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeCampaignTab === "player"
                      ? "bg-gold-accent/10 text-gold-accent border border-gold-accent/25 shadow-[0_0_10px_rgba(255,216,77,0.1)]"
                      : "text-text-dim hover:text-text-primary hover:bg-white/2"
                  }`}
                >
                  Crônicas que Jogo ({playerCampaigns.length})
                </button>
              </div>

              {activeCampaignTab === "narrator" && (
                <button
                  onClick={() => {
                    setErrorMsg(null);
                    setIsCampaignModalOpen(true);
                  }}
                  className="px-3 py-1 bg-blood-red hover:bg-burgundy text-text-primary text-xs uppercase tracking-widest font-data font-semibold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(200,36,52,0.4)]"
                >
                  + Nova Crônica
                </button>
              )}
            </div>

            {/* ABA DO NARRADOR */}
            {activeCampaignTab === "narrator" && (
              narratorCampaigns.length === 0 ? (
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
                  {narratorCampaigns.map(camp => (
                    <div 
                      key={camp.id} 
                      className="bg-bg-card border border-white/10 hover:border-blood-red/50 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(139,0,0,0.12)] p-5 rounded-sm flex flex-col justify-between transition-all duration-200 gap-3 group relative pr-8"
                    >
                      <div>
                        <h3 className="text-2xl font-gothic tracking-wide text-blood-red group-hover:text-hunger-red transition-colors pr-6">
                          {camp.name.toUpperCase()}
                        </h3>
                        <p className="text-xs text-text-muted font-reading leading-relaxed line-clamp-2 pt-1.5">
                          {camp.description || "Nenhuma sinopse registrada para esta campanha nas sombras."}
                        </p>
                      </div>

                      <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1 font-data text-[10px]">
                        <span className="uppercase tracking-wider text-text-dim">
                          ID: {camp.id.slice(0, 8)}
                        </span>
                        <div className="flex items-center space-x-4">
                          <Link
                            href={`/campanhas/${camp.id}/narrador`}
                            className="text-xs uppercase tracking-widest font-bold text-gold-accent hover:text-white transition-colors"
                          >
                            Painel →
                          </Link>
                        </div>
                      </div>

                      {/* Botão Kebab para Opções da Crônica */}
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={(e) => toggleMenu(camp.id, e)}
                          className="text-text-dim hover:text-blood-red transition-colors cursor-pointer p-1 text-sm font-bold focus:outline-none"
                          title="Opções da Crônica"
                        >
                          ⋮
                        </button>
                        {activeMenuId === camp.id && (
                          <div 
                            className="absolute right-0 mt-1 w-44 bg-bg-card border border-white/15 rounded-sm shadow-2xl z-20 py-1 font-data text-[10px] uppercase tracking-wider text-left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              href={`/campanhas/${camp.id}/narrador`}
                              className="w-full text-left flex items-center px-4 py-2 hover:bg-white/5 hover:text-white text-text-muted transition-colors"
                            >
                              <svg className="w-3.5 h-3.5 mr-2 text-text-dim" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <rect width="20" height="14" x="2" y="3" rx="2" />
                                <path d="M12 17v4M8 21h8" />
                              </svg>
                              Narrador
                            </Link>
                            <button
                              onClick={() => {
                                handleCopyInvite(camp.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left flex items-center px-4 py-2 hover:bg-white/5 hover:text-gold-accent text-text-muted transition-colors cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 mr-2 text-text-dim" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                              </svg>
                              Convite
                            </button>
                            <button
                              onClick={() => {
                                openEditCampaignModal(camp);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left flex items-center px-4 py-2 hover:bg-white/5 hover:text-gold-accent text-text-muted transition-colors cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 mr-2 text-text-dim" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                              </svg>
                              Editar
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button
                              onClick={() => {
                                openDeleteCampaignConfirmModal(camp);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left flex items-center px-4 py-2 hover:bg-blood-red/10 hover:text-blood-red text-hunger-red/80 transition-colors cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 mr-2 text-hunger-red/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ABA DO JOGADOR */}
            {activeCampaignTab === "player" && (
              playerCampaigns.length === 0 ? (
                <div 
                  className="border border-dashed border-gold-accent/20 bg-bg-card/10 rounded-sm p-8 flex flex-col items-center justify-center text-center h-64"
                >
                  <svg className="w-12 h-12 text-gold-accent/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="font-gothic text-lg text-text-primary tracking-wide">Sem matilhas ativas</p>
                  <p className="text-xs text-text-muted max-w-xs pt-1">
                    Você não faz parte de nenhuma crônica como jogador no momento. Insira o link de convite enviado pelo seu Narrador.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {playerCampaigns.map(camp => {
                    const statusLabels: Record<string, { label: string; class: string }> = {
                      DRAFT: { label: "Rascunho", class: "bg-white/5 border-white/10 text-text-dim" },
                      RECRUITING: { label: "Recrutando", class: "bg-green-500/10 border-green-500/25 text-green-400" },
                      IN_PROGRESS: { label: "Em Jogo", class: "bg-blood-red/15 border-blood-red/35 text-blood-red animate-pulse" },
                      PAUSED: { label: "Pausada", class: "bg-amber-500/10 border-amber-500/25 text-amber-400" },
                      ARCHIVED: { label: "Arquivada", class: "bg-white/5 border-white/10 text-text-muted/65" }
                    };
                    const statusInfo = statusLabels[camp.status] || { label: camp.status, class: "bg-white/5 border-white/10" };

                    return (
                      <div 
                        key={camp.id} 
                        className="bg-bg-card border border-white/10 hover:border-gold-accent/50 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(212,175,55,0.08)] p-5 rounded-sm flex flex-col justify-between transition-all duration-200 gap-3 group relative"
                      >
                        <div className="flex justify-between items-start">
                          <div className="max-w-[70%]">
                            <h3 className="text-2xl font-gothic tracking-wide text-text-primary group-hover:text-gold-accent transition-colors truncate">
                              {camp.name.toUpperCase()}
                            </h3>
                            <p className="text-[9px] uppercase tracking-wider text-text-muted font-data pt-0.5">
                              Narrador: <span className="text-gold-accent font-semibold">{camp.narratorName}</span>
                            </p>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded-xs border text-[8px] uppercase font-bold tracking-wider font-data ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="bg-black/30 border border-white/5 rounded-xs p-2.5 flex justify-between items-center text-[10px]">
                          <div className="flex flex-col">
                            <span className="text-[8px] uppercase font-bold text-text-dim font-data">Membro Vinculado</span>
                            <span className="text-text-primary font-medium">{camp.characterName.toUpperCase()}</span>
                          </div>
                          <span className="text-[8px] uppercase font-bold font-data text-gold-accent bg-gold-accent/10 border border-gold-accent/20 px-2 py-0.5 rounded-xs">
                            {camp.powerLevel === "FLEDGLING" ? "Cria" : camp.powerLevel === "NEONATE" ? "Neófito" : "Ancila"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1 font-data text-[10px]">
                          <span className="uppercase tracking-wider text-text-dim">
                            ID: {camp.id.slice(0, 8)}
                          </span>
                          <Link
                            href={`/campanhas/${camp.id}/jogador`}
                            className="text-xs uppercase tracking-widest font-bold text-gold-accent hover:text-white transition-colors"
                          >
                            Entrar no Lobby →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
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
                  onClick={handleQuickCreateCharacter}
                  disabled={loading}
                  className="px-3 py-1 bg-gold-accent hover:bg-yellow-600 text-bg-main text-xs uppercase tracking-widest font-data font-semibold rounded-sm transition-all duration-200 cursor-pointer shadow-[0_0_6px_rgba(255,216,77,0.3)] disabled:opacity-50"
                >
                  {loading ? "Criando..." : "+ Novo Personagem"}
                </button>
              </div>
            </div>

            {characters.length === 0 ? (
              <div 
                onClick={handleQuickCreateCharacter}
                className="border border-dashed border-gold-accent/30 hover:border-gold-accent/60 bg-bg-card/20 rounded-sm p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 h-64 group"
              >
                <svg className="w-12 h-12 text-gold-accent/40 group-hover:text-gold-accent/75 transition-colors mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="font-gothic text-lg text-text-primary tracking-wide">Nenhum vampiro gerado</p>
                <p className="text-xs text-text-muted max-w-xs pt-1">
                  Nenhum membro ativo sob sua tutela. Clique aqui para forjar seu primeiro personagem.
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
                      className="bg-bg-card border border-white/10 hover:border-gold-accent/50 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(212,175,55,0.08)] p-5 rounded-sm flex items-center justify-between transition-all duration-200 group gap-4 relative pr-10"
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
                          Crônica: {char.campaignName || "Cofre (Sem Crônica)"}
                        </span>
                        <Link
                          href={`/campanhas/${char.campaignId || "cofre"}/personagens/${char.id}`}
                          className="text-xs uppercase tracking-widest font-data font-bold text-blood-red hover:text-white transition-colors"
                        >
                          Abrir Ficha →
                        </Link>
                      </div>

                      {/* Botão Kebab para Opções do Personagem */}
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={(e) => toggleMenu(char.id, e)}
                          className="text-text-dim hover:text-gold-accent transition-colors cursor-pointer p-1 text-sm font-bold focus:outline-none"
                          title="Opções do Vampiro"
                        >
                          ⋮
                        </button>
                        {activeMenuId === char.id && (
                          <div 
                            className="absolute right-0 mt-1 w-40 bg-bg-card border border-white/15 rounded-sm shadow-2xl z-20 py-1 font-data text-[10px] uppercase tracking-wider text-left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              href={`/campanhas/${char.campaignId || "cofre"}/personagens/${char.id}`}
                              className="w-full text-left flex items-center px-4 py-2 hover:bg-white/5 hover:text-white text-text-muted transition-colors"
                            >
                              <svg className="w-3.5 h-3.5 mr-2 text-text-dim" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                              </svg>
                              Abrir Ficha
                            </Link>
                            <button
                              onClick={async () => {
                                setActiveMenuId(null);
                                await handleDuplicateCharacter(char.id);
                              }}
                              className="w-full text-left flex items-center px-4 py-2 hover:bg-white/5 hover:text-gold-accent text-text-muted transition-colors cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 mr-2 text-text-dim" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                              </svg>
                              Duplicar
                            </button>
                            <button
                              onClick={() => {
                                openTransferModal(char);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left flex items-center px-4 py-2 hover:bg-white/5 hover:text-gold-accent text-text-muted transition-colors cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 mr-2 text-text-dim" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="m22 2-7 20-4-9-9-4Z M22 2 11 13" />
                              </svg>
                              Transferir
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button
                              onClick={() => {
                                openDeleteConfirmModal({ id: char.id, name: char.name });
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left flex items-center px-4 py-2 hover:bg-hunger-red/10 hover:text-hunger-red text-hunger-red/80 transition-colors cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 mr-2 text-hunger-red/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                              Excluir
                            </button>
                          </div>
                        )}
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
      {/* MODAL GÓTICO: CONFIRMAR EXCLUSÃO DE PERSONAGEM */}
      {/* ========================================== */}
      {isDeleteModalOpen && characterToDelete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div 
            className="w-full max-w-md bg-bg-card border border-hunger-red/40 rounded-sm p-6 relative shadow-[0_0_25px_rgba(230,36,36,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-gothic tracking-widest text-hunger-red uppercase pb-2 border-b border-white/5 mb-4">
              Destruir Criação
            </h3>

            <p className="text-sm text-text-muted leading-relaxed mb-6 font-reading">
              Você está prestes a apagar o personagem <span className="text-white font-semibold">{characterToDelete.name.toUpperCase()}</span> nas cinzas do tempo. Esta ação é irreversível e apagará todos os dados da ficha de forma permanente. Deseja prosseguir?
            </p>

            {errorMsg && (
              <div className="bg-hunger-red/10 border border-hunger-red text-hunger-red text-xs p-3 rounded-sm mb-4 font-data uppercase tracking-wider text-center">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setCharacterToDelete(null);
                }}
                className="px-4 py-2 border border-white/10 hover:border-white text-text-muted hover:text-white text-xs uppercase tracking-widest font-data transition-colors rounded-sm cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDeleteCharacter}
                className="px-5 py-2 bg-hunger-red hover:bg-red-800 text-white text-xs uppercase tracking-widest font-data font-bold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(230,36,36,0.4)] disabled:opacity-50"
              >
                {loading ? "Apagando..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL GÓTICO: TRANSFERIR PERSONAGEM */}
      {/* ========================================== */}
      {isTransferModalOpen && characterToTransfer && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div 
            className="w-full max-w-md bg-bg-card border border-gold-accent/40 rounded-sm p-6 relative shadow-[0_0_25px_rgba(255,216,77,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                setIsTransferModalOpen(false);
                setCharacterToTransfer(null);
              }}
              className="absolute top-4 right-4 text-text-muted hover:text-white text-lg font-data focus:outline-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-2xl font-gothic tracking-widest text-gold-accent uppercase pb-2 border-b border-white/5 mb-4">
              Transferir Pacto
            </h3>

            <p className="text-xs text-text-muted leading-relaxed mb-4 font-reading">
              Você está transferindo a posse de <span className="text-white font-semibold">{characterToTransfer.name.toUpperCase()}</span> para outro jogador. Ele será removido de sua crônica atual e enviado ao Cofre do destinatário.
            </p>

            {errorMsg && (
              <div className="bg-hunger-red/10 border border-hunger-red text-hunger-red text-xs p-3 rounded-sm mb-4 font-data uppercase tracking-wider text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleTransferCharacter} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">E-mail do Destinatário</label>
                <input
                  type="email"
                  required
                  placeholder="jogador@dominio.com"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  className="w-full bg-bg-input border border-white/10 rounded-sm p-2 text-sm font-reading text-text-primary focus:border-gold-accent outline-none transition-colors"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsTransferModalOpen(false);
                    setCharacterToTransfer(null);
                  }}
                  className="px-4 py-2 border border-white/10 hover:border-white text-text-muted hover:text-white text-xs uppercase tracking-widest font-data transition-colors rounded-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gold-accent hover:bg-yellow-600 text-bg-main text-xs uppercase tracking-widest font-data font-bold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(255,216,77,0.3)]"
                >
                  {loading ? "Transferindo..." : "Transferir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL GÓTICO: EDITAR CRÔNICA */}
      {/* ========================================== */}
      {isEditCampaignModalOpen && campaignToEdit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div 
            className="w-full max-w-md bg-bg-card border border-blood-red/40 rounded-sm p-6 relative shadow-[0_0_25px_rgba(200,36,52,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsEditCampaignModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white text-lg font-data focus:outline-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-2xl font-gothic tracking-widest text-blood-red uppercase pb-2 border-b border-white/5 mb-4">
              Reescrever Crônica
            </h3>

            {errorMsg && (
              <div className="bg-hunger-red/10 border border-hunger-red text-hunger-red text-xs p-3 rounded-sm mb-4 font-data uppercase tracking-wider">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUpdateCampaign} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">Nome da Crônica</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Noites Cariocas, Sangue em S.P."
                  value={editCampaignName}
                  onChange={(e) => setEditCampaignName(e.target.value)}
                  className="w-full bg-bg-input border border-white/10 rounded-sm p-2 text-sm font-reading text-text-primary focus:border-blood-red outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-data text-text-muted block">Sinopse / Descrição</label>
                <textarea
                  placeholder="Descreva a ambientação, o tom e os perigos que rondam a noite..."
                  value={editCampaignDesc}
                  onChange={(e) => setEditCampaignDesc(e.target.value)}
                  className="w-full h-24 bg-bg-input border border-white/10 rounded-sm p-2 text-sm font-reading text-text-primary focus:border-blood-red outline-none resize-none transition-colors"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditCampaignModalOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:border-white text-text-muted hover:text-white text-xs uppercase tracking-widest font-data transition-colors rounded-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blood-red hover:bg-burgundy text-white text-xs uppercase tracking-widest font-data font-bold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(200,36,52,0.4)]"
                >
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL GÓTICO: CONFIRMAR EXCLUSÃO DE CRÔNICA */}
      {/* ========================================== */}
      {isDeleteCampaignModalOpen && campaignToDelete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div 
            className="w-full max-w-md bg-bg-card border border-hunger-red/40 rounded-sm p-6 relative shadow-[0_0_25px_rgba(230,36,36,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-gothic tracking-widest text-hunger-red uppercase pb-2 border-b border-white/5 mb-4">
              Banir Crônica para as Sombras
            </h3>

            <p className="text-sm text-text-muted leading-relaxed mb-4 font-reading">
              Você está prestes a excluir permanentemente a crônica <span className="text-white font-semibold">{campaignToDelete.name.toUpperCase()}</span>.
            </p>

            <div className="p-3 bg-burgundy/10 border border-blood-red/30 rounded-sm mb-6 space-y-2 text-xs font-reading leading-normal">
              <p className="text-blood-red font-semibold uppercase tracking-wider">⚠️ Efeitos colaterais do ritual:</p>
              <ul className="list-disc pl-4 text-text-muted space-y-1">
                <li>As rolagens de dados e os tokens de cena serão deletados para sempre.</li>
                <li><span className="text-white font-semibold">Os vampiros dos jogadores estarão a salvo!</span> Eles voltarão intactos para os respectivos Cofres dos jogadores.</li>
              </ul>
            </div>

            {errorMsg && (
              <div className="bg-hunger-red/10 border border-hunger-red text-hunger-red text-xs p-3 rounded-sm mb-4 font-data uppercase tracking-wider text-center">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setIsDeleteCampaignModalOpen(false);
                  setCampaignToDelete(null);
                }}
                className="px-4 py-2 border border-white/10 hover:border-white text-text-muted hover:text-white text-xs uppercase tracking-widest font-data transition-colors rounded-sm cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDeleteCampaign}
                className="px-5 py-2 bg-hunger-red hover:bg-red-800 text-white text-xs uppercase tracking-widest font-data font-bold rounded-sm cursor-pointer transition-colors shadow-[0_0_6px_rgba(230,36,36,0.4)] disabled:opacity-50"
              >
                {loading ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 border rounded-sm shadow-xl font-data text-xs uppercase tracking-wider animate-slide-in ${
          toast.type === "success" 
            ? "bg-bg-card border-gold-accent text-gold-accent shadow-[0_0_12px_rgba(255,216,77,0.2)]" 
            : "bg-bg-card border-hunger-red text-hunger-red shadow-[0_0_12px_rgba(230,36,36,0.2)]"
        }`}>
          {toast.message}
        </div>
      )}
    </main>
  );
}
