"use client";

import React, { useState, useRef, useEffect } from "react";
import { cropAndCompressToWebP, CropArea, PRESET_AVATAR, PRESET_SCENE } from "@/lib/media/imageCompressor";

interface ImageCropModalProps {
  file: File | string | null;
  aspectRatioType?: "1:1" | "16:9" | "free";
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  onCropped: (result: { base64: string; sizeBytes: number; width: number; height: number }) => void;
}

export default function ImageCropModal({
  file,
  aspectRatioType = "1:1",
  title = "Enquadrar & Otimizar Imagem",
  isOpen,
  onClose,
  onCropped,
}: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Posição e dimensões da caixa de crop em porcentagem (0 a 100%)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef<string | null>(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, boxX: 0, boxY: 0, boxW: 0, boxH: 0 });

  // Carregar imagem
  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      return;
    }
    if (typeof file === "string") {
      setImageSrc(file);
    } else {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  // Inicializar proporção do Crop Box
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNaturalSize({ width: nw, height: nh });

    const imgRatio = nw / nh;
    let initW = 80;
    let initH = 80;

    if (aspectRatioType === "1:1") {
      if (imgRatio > 1) {
        initH = 80;
        initW = 80 / imgRatio;
      } else {
        initW = 80;
        initH = 80 * imgRatio;
      }
    } else if (aspectRatioType === "16:9") {
      initW = 90;
      initH = (90 / (16 / 9)) * imgRatio;
    }

    setCropBox({
      x: Math.max(0, (100 - initW) / 2),
      y: Math.max(0, (100 - initH) / 2),
      width: Math.min(100, initW),
      height: Math.min(100, initH),
    });
  };

  // Handlers de Arrastar e Redimensionar Crop Box
  const handlePointerDownDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      boxX: cropBox.x,
      boxY: cropBox.y,
      boxW: cropBox.width,
      boxH: cropBox.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerDownResize = (handle: string, e: React.PointerEvent) => {
    e.stopPropagation();
    isResizingRef.current = handle;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      boxX: cropBox.x,
      boxY: cropBox.y,
      boxW: cropBox.width,
      boxH: cropBox.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStartRef.current.mouseY) / rect.height) * 100;

    if (isDraggingRef.current) {
      const newX = Math.max(0, Math.min(100 - cropBox.width, dragStartRef.current.boxX + deltaXPercent));
      const newY = Math.max(0, Math.min(100 - cropBox.height, dragStartRef.current.boxY + deltaYPercent));
      setCropBox((prev) => ({ ...prev, x: newX, y: newY }));
    } else if (isResizingRef.current) {
      const handle = isResizingRef.current;
      let newW = dragStartRef.current.boxW;
      let newH = dragStartRef.current.boxH;
      let newX = dragStartRef.current.boxX;
      let newY = dragStartRef.current.boxY;

      if (handle.includes("r")) {
        newW = Math.max(10, Math.min(100 - newX, dragStartRef.current.boxW + deltaXPercent));
      }
      if (handle.includes("b")) {
        newH = Math.max(10, Math.min(100 - newY, dragStartRef.current.boxH + deltaYPercent));
      }
      if (handle.includes("l")) {
        const potentialW = dragStartRef.current.boxW - deltaXPercent;
        if (potentialW >= 10 && dragStartRef.current.boxX + deltaXPercent >= 0) {
          newW = potentialW;
          newX = dragStartRef.current.boxX + deltaXPercent;
        }
      }
      if (handle.includes("t")) {
        const potentialH = dragStartRef.current.boxH - deltaYPercent;
        if (potentialH >= 10 && dragStartRef.current.boxY + deltaYPercent >= 0) {
          newH = potentialH;
          newY = dragStartRef.current.boxY + deltaYPercent;
        }
      }

      // Manter proporção se for 1:1
      if (aspectRatioType === "1:1" && naturalSize.width && naturalSize.height) {
        const imgRatio = naturalSize.width / naturalSize.height;
        newH = newW * imgRatio;
        if (newY + newH > 100) {
          newH = 100 - newY;
          newW = newH / imgRatio;
        }
      }

      setCropBox({ x: newX, y: newY, width: newW, height: newH });
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    isResizingRef.current = null;
  };

  // Confirmar Crop e Comprimir
  const handleConfirm = async () => {
    if (!imageSrc || !naturalSize.width || !naturalSize.height) return;

    try {
      setIsProcessing(true);
      const pixelCrop: CropArea = {
        x: Math.round((cropBox.x / 100) * naturalSize.width),
        y: Math.round((cropBox.y / 100) * naturalSize.height),
        width: Math.round((cropBox.width / 100) * naturalSize.width),
        height: Math.round((cropBox.height / 100) * naturalSize.height),
      };

      const preset = aspectRatioType === "16:9" ? PRESET_SCENE : PRESET_AVATAR;
      const result = await cropAndCompressToWebP(imageSrc, pixelCrop, preset);
      onCropped(result);
      onClose();
    } catch (err) {
      console.error("Erro ao recortar imagem:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <div className="w-full max-w-2xl bg-bg-card-dark border border-white/10 rounded-sm shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="text-blood-red font-bold text-sm">✂️</span>
            <h3 className="text-xs font-gothic tracking-widest text-text-primary uppercase font-bold">{title}</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white text-xs cursor-pointer">✕</button>
        </div>

        {/* Viewport de Recorte */}
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full h-96 bg-black/90 flex items-center justify-center overflow-hidden touch-none"
        >
          {/* Imagem Original de Fundo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Upload"
            onLoad={handleImageLoaded}
            className="max-h-full max-w-full object-contain pointer-events-none opacity-40 select-none"
          />

          {/* Máscara Iluminada do Crop Box */}
          <div
            onPointerDown={handlePointerDownDrag}
            style={{
              left: `${cropBox.x}%`,
              top: `${cropBox.y}%`,
              width: `${cropBox.width}%`,
              height: `${cropBox.height}%`,
            }}
            className={`absolute border-2 border-gold-accent bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] cursor-move ${
              aspectRatioType === "1:1" ? "rounded-full" : "rounded-xs"
            }`}
          >
            {/* Alças de Redimensionamento */}
            <div onPointerDown={(e) => handlePointerDownResize("tl", e)} className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-gold-accent rounded-full cursor-nwse-resize border border-black" />
            <div onPointerDown={(e) => handlePointerDownResize("tr", e)} className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gold-accent rounded-full cursor-nesw-resize border border-black" />
            <div onPointerDown={(e) => handlePointerDownResize("bl", e)} className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-gold-accent rounded-full cursor-nesw-resize border border-black" />
            <div onPointerDown={(e) => handlePointerDownResize("br", e)} className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-gold-accent rounded-full cursor-nwse-resize border border-black" />
          </div>
        </div>

        {/* Barra Inferior com Informações e Ações */}
        <div className="px-4 py-3 bg-black/40 border-t border-white/10 flex items-center justify-between">
          <div className="text-[10px] text-text-muted font-data">
            Formato: <span className="text-gold-accent font-bold uppercase">{aspectRatioType} WebP</span> • Otimização automática
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-text-muted hover:text-white border border-white/10 hover:border-white/25 rounded-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider bg-blood-red hover:bg-burgundy text-white rounded-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 border border-blood-red/30"
            >
              {isProcessing ? "Otimizando..." : "🩸 Salvar & Aplicar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
