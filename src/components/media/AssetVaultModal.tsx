"use client";

import React, { useState, useEffect, useCallback } from "react";
import ImageCropModal from "@/components/common/ImageCropModal";
import { getCampaignMediaAssetsAction, uploadMediaAssetAction, deleteMediaAssetAction } from "@/app/actions/mediaActions";
import { useToast } from "@/context/ToastContext";

interface AssetVaultModalProps {
  campaignId?: string | null;
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (url: string) => void;
  targetCategory?: "avatar" | "scene" | "token" | "prop" | "all";
}

export default function AssetVaultModal({
  campaignId,
  userId = "user_default",
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
  const [cropCategory, setCropCategory] = useState<"avatar" | "scene" | "token" | "prop">("avatar");

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
    }
  }, [isOpen, fetchAssets]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, cat: "avatar" | "scene" | "token" | "prop") => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFileForCrop(e.target.files[0]);
      setCropCategory(cat);
      setIsCropOpen(true);
    }
    e.target.value = "";
  };

  const handleCroppedUpload = async (result: { base64: string; sizeBytes: number; width: number; height: number }) => {
    const uploadRes = await uploadMediaAssetAction({
      campaignId,
      userId,
      name: selectedFileForCrop?.name.replace(/\.[^/.]+$/, "") || "Mídia",
      category: cropCategory,
      base64: result.base64,
      sizeBytes: result.sizeBytes,
      width: result.width,
      height: result.height,
    });

    if (uploadRes.success && uploadRes.data) {
      showSuccess("Imagem otimizada e salva com sucesso!");
      await fetchAssets();
      if (onSelectImage) {
        onSelectImage(uploadRes.data.url);
        onClose();
      }
    } else {
      showError(uploadRes.error || "Falha ao salvar imagem.");
    }
  };

  const handleDelete = async (id: string) => {
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-fade-in">
      <div className="w-full max-w-4xl bg-bg-card-dark border border-white/10 rounded-sm shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Topo */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="text-gold-accent font-bold text-sm">🗂️</span>
            <h2 className="text-sm font-gothic tracking-widest text-text-primary uppercase font-bold">Biblioteca de Ativos da Crônica</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white text-xs cursor-pointer">✕</button>
        </div>

        {/* Barra de Ações & Abas */}
        <div className="px-5 py-2.5 border-b border-white/5 bg-black/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1">
            {["todos", "avatar", "scene", "token", "prop"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-[10px] font-data uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
                  activeTab === tab ? "bg-blood-red text-white font-bold" : "text-text-muted hover:text-white bg-white/5"
                }`}
              >
                {tab === "todos" ? "Todos" : tab === "avatar" ? "Avatares (1:1)" : tab === "scene" ? "Cenários (16:9)" : tab === "token" ? "Tokens" : "Props"}
              </button>
            ))}
          </div>

          {/* Botão de Upload com Dropdown rápido */}
          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 bg-linear-to-r from-gold-accent to-amber-500 hover:from-amber-400 hover:to-gold-accent text-black font-data font-bold text-[10px] uppercase tracking-wider rounded-xs cursor-pointer transition-all shadow-md">
              + Subir Avatar (1:1)
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "avatar")} />
            </label>
            <label className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-data font-bold text-[10px] uppercase tracking-wider rounded-xs cursor-pointer transition-all border border-white/15">
              + Subir Cenário (16:9)
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "scene")} />
            </label>
          </div>
        </div>

        {/* Grade de Imagens */}
        <div className="flex-1 p-5 overflow-y-auto min-h-60">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-text-dim text-xs">Carregando mídias...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-text-dim text-xs space-y-2">
              <span>Nenhuma imagem cadastrada nesta categoria.</span>
              <span className="text-[10px] text-text-muted">Faça upload de fotos para usar em fichas e no VTT.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative bg-black/40 border border-white/10 hover:border-gold-accent/60 rounded-xs overflow-hidden flex flex-col transition-all"
                >
                  <div className="w-full aspect-square bg-black flex items-center justify-center overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {onSelectImage && (
                      <button
                        onClick={() => {
                          onSelectImage(asset.url);
                          onClose();
                        }}
                        className="absolute inset-0 bg-blood-red/80 text-white font-data font-bold text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      >
                        Selecionar
                      </button>
                    )}
                  </div>
                  <div className="p-2 flex items-center justify-between text-[9px] font-data text-text-muted bg-bg-card-dark">
                    <span className="truncate max-w-22 font-bold text-text-primary" title={asset.name}>{asset.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span>{(asset.sizeBytes / 1024).toFixed(0)} KB</span>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="text-hunger-red hover:text-white transition-colors cursor-pointer"
                        title="Excluir imagem"
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

      {/* Modal de Crop */}
      <ImageCropModal
        isOpen={isCropOpen}
        file={selectedFileForCrop}
        aspectRatioType={cropCategory === "scene" ? "16:9" : "1:1"}
        title={cropCategory === "scene" ? "Enquadrar Cenário (16:9)" : "Enquadrar Avatar (1:1)"}
        onClose={() => setIsCropOpen(false)}
        onCropped={handleCroppedUpload}
      />
    </div>
  );
}
