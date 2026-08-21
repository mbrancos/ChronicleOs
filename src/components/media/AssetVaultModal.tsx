"use client";

import React, { useState, useEffect, useCallback } from "react";
import ImageCropModal, { CropResult } from "@/components/common/ImageCropModal";
import { getCampaignMediaAssetsAction, uploadMediaAssetAction, deleteMediaAssetAction } from "@/app/actions/mediaActions";
import { useToast } from "@/context/ToastContext";

interface AssetVaultModalProps {
  campaignId?: string | null;
  userId?: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (url: string) => void;
  targetCategory?: "avatar" | "scene" | "token" | "prop" | "all";
}

export default function AssetVaultModal({
  campaignId,
  userId,
  title = "Biblioteca de Ativos da Crônica",
  isOpen,
  onClose,
  onSelectImage,
  targetCategory = "all",
}: AssetVaultModalProps) {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<string>(targetCategory === "all" ? "todos" : targetCategory);
  const [assets, setAssets] = useState<any[]>([]);
  const [totalBytes, setTotalBytes] = useState(0);
  const [loading, setLoading] = useState(false);

  // Estados para Crop Modal interno
  const [selectedFileForCrop, setSelectedFileForCrop] = useState<File | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const res = await getCampaignMediaAssetsAction(campaignId, userId);
    if (res.success && res.data) {
      setAssets(res.data.assets);
      setTotalBytes(res.data.totalBytes);
    }
    setLoading(false);
  }, [campaignId, userId]);

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
      setActiveTab(targetCategory === "all" ? "todos" : targetCategory);
    }
  }, [isOpen, fetchAssets, targetCategory]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFileForCrop(e.target.files[0]);
      setIsCropOpen(true);
    }
    e.target.value = "";
  };

  const handleCroppedUpload = async (result: CropResult) => {
    const uploadRes = await uploadMediaAssetAction({
      campaignId,
      name: result.name,
      category: result.category,
      base64: result.base64,
      sizeBytes: result.sizeBytes,
      width: result.width,
      height: result.height,
    });

    if (uploadRes.success && uploadRes.data) {
      showSuccess("Imagem otimizada e salva na biblioteca!");
      await fetchAssets();
      if (onSelectImage) {
        onSelectImage(uploadRes.data.url);
        onClose();
      }
    } else {
      showError(uploadRes.error || "Falha ao salvar imagem.");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Deseja realmente excluir esta imagem da biblioteca?")) return;
    const res = await deleteMediaAssetAction(id, campaignId || undefined);
    if (res.success) {
      showSuccess("Imagem excluída.");
      await fetchAssets();
    } else {
      showError(res.error || "Falha ao excluir.");
    }
  };

  const filteredAssets = activeTab === "todos" ? assets : assets.filter((a) => a.category === activeTab);
  const formattedMb = (totalBytes / (1024 * 1024)).toFixed(2);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-fade-in">
      <div className="w-full max-w-4xl bg-bg-card-dark border border-gold-accent/30 rounded-sm shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Topo */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="text-gold-accent font-bold text-sm">🗂️</span>
            <h2 className="text-xs font-gothic tracking-widest text-text-primary uppercase font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white text-xs cursor-pointer">✕</button>
        </div>

        {/* Barra de Ações & Abas */}
        <div className="px-5 py-2.5 border-b border-white/5 bg-black/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 flex-wrap">
            {[
              { id: "todos", label: "Todos" },
              { id: "avatar", label: "Avatares (1:1)" },
              { id: "scene", label: "Cenários (16:9)" },
              { id: "token", label: "Tokens" },
              { id: "prop", label: "Props / Itens" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-[10px] font-data uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-blood-red text-white font-bold"
                    : "text-text-muted hover:text-white bg-white/5 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Botão Único de Upload */}
          <label className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blood-red hover:bg-burgundy text-white font-data font-bold text-[10px] uppercase tracking-wider rounded-xs cursor-pointer transition-all shadow-md border border-blood-red/40 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Subir Nova Imagem</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </label>
        </div>

        {/* Grade de Imagens */}
        <div className="flex-1 p-5 overflow-y-auto min-h-60">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-text-dim text-xs">Carregando mídias...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-text-dim text-xs space-y-3">
              <span className="text-lg opacity-40">🖼️</span>
              <span>Nenhuma imagem cadastrada nesta categoria.</span>
              <label className="px-3 py-1 bg-white/10 hover:bg-white/20 text-gold-accent font-data font-bold text-[10px] uppercase tracking-wider rounded-xs cursor-pointer transition-all border border-white/10">
                + Subir Primeira Imagem
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    if (onSelectImage) {
                      onSelectImage(asset.url);
                      onClose();
                    }
                  }}
                  className={`group relative bg-black/40 border border-white/10 hover:border-gold-accent/70 rounded-xs overflow-hidden flex flex-col transition-all duration-200 ${
                    onSelectImage ? "cursor-pointer hover:shadow-[0_0_15px_rgba(212,175,55,0.2)]" : ""
                  }`}
                >
                  <div className="w-full aspect-square bg-black flex items-center justify-center overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Overlay de Seleção */}
                    {onSelectImage && (
                      <div className="absolute inset-0 bg-blood-red/80 text-white font-data font-bold text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        ✓ Selecionar
                      </div>
                    )}
                  </div>
                  <div className="p-2 flex items-center justify-between text-[9px] font-data text-text-muted bg-bg-card-dark border-t border-white/5">
                    <span className="truncate max-w-22 font-bold text-text-primary" title={asset.name}>
                      {asset.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span>{(asset.sizeBytes / 1024).toFixed(0)} KB</span>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(asset.id, e)}
                        className="text-hunger-red/70 hover:text-hunger-red transition-colors cursor-pointer p-0.5"
                        title="Excluir imagem da biblioteca"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé com Indicador de Cota */}
        <div className="px-5 py-2.5 bg-black/40 border-t border-white/10 flex items-center justify-between text-[10px] font-data text-text-muted">
          <div>
            Armazenamento: <span className="text-gold-accent font-bold">{assets.length} imagens</span> ({formattedMb} MB consumidos de 512 MB disponíveis no Neon)
          </div>
          <button onClick={onClose} className="px-4 py-1 bg-white/5 hover:bg-white/15 text-text-primary uppercase font-bold text-[9px] rounded-xs cursor-pointer">
            Fechar
          </button>
        </div>
      </div>

      {/* Modal de Crop Único e Flexível */}
      <ImageCropModal
        isOpen={isCropOpen}
        file={selectedFileForCrop}
        initialCategory={
          activeTab === "scene"
            ? "scene"
            : activeTab === "avatar"
            ? "avatar"
            : activeTab === "token"
            ? "token"
            : "avatar"
        }
        aspectRatioType={activeTab === "scene" ? "16:9" : "1:1"}
        title="Enquadrar & Categorizar Mídia"
        onClose={() => setIsCropOpen(false)}
        onCropped={handleCroppedUpload}
      />
    </div>
  );
}
