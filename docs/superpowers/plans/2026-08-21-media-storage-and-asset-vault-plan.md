# Sistema de Mídia, Armazenamento Otimizado & Biblioteca de Ativos (Asset Vault) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar um sistema de upload, compressão client-side em WebP com crop interativo de janela livre, armazenamento no Neon Postgres (`sa-east-1`) com rota de streaming ultra-rápida em cache e uma Biblioteca de Ativos (Asset Vault) integrada à Ficha de Personagem e ao VTT do Narrador.

**Architecture:** O processamento e recorte de imagens ocorrem 100% no navegador via HTML5 Canvas e WebP (gerando payloads minúsculos de 30KB–90KB), evitando gargalos serverless na Vercel. Os binários WebP são persistidos na tabela isolada `media_assets` no Neon Postgres e servidos pelo endpoint público `/api/media/[id]` com cabeçalho `Cache-Control` imutável de 1 ano. A interface disponibiliza uma biblioteca unificada de ativos (Asset Vault) para reuso de imagens e controle transparente de cota.

**Tech Stack:** Next.js 15+ (App Router, Server Actions, Route Handlers), React 19, TypeScript, Drizzle ORM, Neon Serverless Postgres, Pusher Channels, Tailwind CSS v4, HTML5 Canvas API.

## Global Constraints

- **Respostas e Artefatos:** Todo o código, comentários e documentação devem seguir os padrões de design do ChronicleOS (Dark Gothic / Vampire Theme) e mensagens em português do Brasil (`pt-BR`).
- **Limite de Payload:** Todo upload enviado ao servidor deve ter sido previamente comprimido no cliente em WebP (< 500 KB).
- **Cache de Mídia:** Respostas da rota `/api/media/[id]` devem conter `Cache-Control: public, max-age=31536000, immutable` e `Content-Type: image/webp`.
- **Integridade Relacional:** Exclusão de campanha deve cascatear nas mídias associadas (`onDelete: cascade`).

---

### Task 1: Database Schema & Migration para `media_assets`

**Files:**
- Modify: `src/db/schema.ts:1-114`
- Modify: `src/db/index.ts` (se aplicável para exportar novas entidades)

**Interfaces:**
- Produces: Tabela Drizzle `mediaAssets` com campos `id`, `campaignId`, `userId`, `name`, `category`, `mimeType`, `data`, `sizeBytes`, `width`, `height`, `createdAt`.

- [ ] **Step 1: Adicionar a tabela `mediaAssets` no schema do Drizzle**

Em `src/db/schema.ts`:
```typescript
export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  category: text("category").$type<"avatar" | "scene" | "token" | "prop">().notNull(),
  mimeType: text("mime_type").default("image/webp").notNull(),
  data: text("data").notNull(), // Base64 do WebP comprimido
  sizeBytes: integer("size_bytes").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;
```

- [ ] **Step 2: Executar migração do schema no Neon Database**

Run in PowerShell:
```powershell
npx drizzle-kit push
```
Expected: Tabela `media_assets` criada com sucesso no Neon Postgres.

- [ ] **Step 3: Commit**

```powershell
git add src/db/schema.ts
git commit -m "feat(db): adiciona tabela media_assets para armazenamento otimizado de imagens"
```

---

### Task 2: Endpoint de Streaming de Mídia (`/api/media/[id]`)

**Files:**
- Create: `src/app/api/media/[id]/route.ts`

**Interfaces:**
- Consumes: UUID de mídia no parâmetro `params.id`.
- Produces: Resposta HTTP com payload binário `image/webp` e headers de cache de 1 ano.

- [ ] **Step 1: Implementar a Route Handler GET `/api/media/[id]`**

Em `src/app/api/media/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return new NextResponse("ID inválido", { status: 400 });
    }

    const [asset] = await db
      .select({
        data: mediaAssets.data,
        mimeType: mediaAssets.mimeType,
        sizeBytes: mediaAssets.sizeBytes,
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1);

    if (!asset || !asset.data) {
      return new NextResponse("Mídia não encontrada", { status: 404 });
    }

    // Extrair Base64 puro removendo prefixo Data URL se houver (ex: data:image/webp;base64,...)
    const base64Data = asset.data.includes(",")
      ? asset.data.split(",")[1]
      : asset.data;

    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType || "image/webp",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Erro ao servir mídia:", error);
    return new NextResponse("Erro interno ao carregar imagem", { status: 500 });
  }
}
```

- [ ] **Step 2: Testar a rota com ID inexistente**

Verificar se retorna 404 adequadamente.

- [ ] **Step 3: Commit**

```powershell
git add src/app/api/media/[id]/route.ts
git commit -m "feat(api): endpoint de streaming de midia /api/media/[id] com cache imutavel"
```

---

### Task 3: Utilitário de Processamento e Compressão WebP (`imageCompressor.ts`)

**Files:**
- Create: `src/lib/media/imageCompressor.ts`

**Interfaces:**
- Produces: Funções de carregamento de imagem, recorte e conversão para WebP de alta fidelidade com baixo peso.

- [ ] **Step 1: Criar o motor de compressão client-side**

Em `src/lib/media/imageCompressor.ts`:
```typescript
export interface CropArea {
  x: number;      // Posição X do corte em pixels naturais da imagem
  y: number;      // Posição Y do corte em pixels naturais da imagem
  width: number;  // Largura do corte em pixels naturais
  height: number; // Altura do corte em pixels naturais
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0 (default 0.82)
}

export const PRESET_AVATAR: CompressOptions = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.82,
};

export const PRESET_SCENE: CompressOptions = {
  maxWidth: 1280,
  maxHeight: 720,
  quality: 0.80,
};

export const PRESET_TOKEN_PROP: CompressOptions = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.82,
};

/**
 * Carrega um File ou DataURL em um objeto HTMLImageElement
 */
export function loadImageElement(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error("Falha ao carregar imagem no navegador"));

    if (typeof source === "string") {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Recorta e comprime a imagem utilizando o HTML5 Canvas, exportando em WebP
 */
export async function cropAndCompressToWebP(
  source: File | string,
  cropArea: CropArea,
  options: CompressOptions = PRESET_AVATAR
): Promise<{
  base64: string;
  sizeBytes: number;
  width: number;
  height: number;
}> {
  const img = await loadImageElement(source);

  // Calcular dimensões finais respeitando os limites máximos
  const maxWidth = options.maxWidth || 800;
  const maxHeight = options.maxHeight || 800;
  const quality = options.quality ?? 0.82;

  let targetWidth = cropArea.width;
  let targetHeight = cropArea.height;

  const scale = Math.min(maxWidth / targetWidth, maxHeight / targetHeight, 1);
  targetWidth = Math.round(targetWidth * scale);
  targetHeight = Math.round(targetHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Não foi possível inicializar o contexto Canvas 2D");
  }

  // Suavização de renderização
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Desenhar apenas o recorte desejado no canvas de saída
  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  // Exportar como WebP
  let webpDataUrl = canvas.toDataURL("image/webp", quality);

  // Fallback caso o navegador não suporte toDataURL WebP
  if (!webpDataUrl.startsWith("data:image/webp")) {
    webpDataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  const base64Clean = webpDataUrl.split(",")[1];
  const sizeBytes = Math.round((base64Clean.length * 3) / 4);

  return {
    base64: webpDataUrl,
    sizeBytes,
    width: targetWidth,
    height: targetHeight,
  };
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/lib/media/imageCompressor.ts
git commit -m "feat(media): utilitario client-side de recorte e compressao WebP em Canvas"
```

---

### Task 4: Componente de Modal de Recorte Interativo (`ImageCropModal.tsx`)

**Files:**
- Create: `src/components/common/ImageCropModal.tsx`

**Interfaces:**
- Consumes: Arquivo selecionado (`file`), preset de formato (`aspectRatio: "1:1" | "16:9" | "free"`), callback `onConfirm(result)` e `onCancel()`.
- Produces: Modal com janela de crop livre, alças nos cantos/bordas, preview ao vivo do peso em KB e compressão imediata.

- [ ] **Step 1: Criar o componente `ImageCropModal.tsx`**

Em `src/components/common/ImageCropModal.tsx`:
```tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cropAndCompressToWebP, CropArea, PRESET_AVATAR, PRESET_SCENE, PRESET_TOKEN_PROP } from "@/lib/media/imageCompressor";

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
  const [previewKbs, setPreviewKbs] = useState<number | null>(null);

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

    const targetRatio = aspectRatioType === "1:1" ? 1 : aspectRatioType === "16:9" ? 16 / 9 : nw / nh;
    const imgRatio = nw / nh;

    let initW = 80;
    let initH = 80;

    if (aspectRatioType === "1:1") {
      if (imgRatio > 1) {
        initH = 80;
        initW = (80 / imgRatio);
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

      // Manter proporção se não for free
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
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/common/ImageCropModal.tsx
git commit -m "feat(ui): modal interativo de recorte de imagem com janela livre e alcas de redimensionamento"
```

---

### Task 5: Server Actions de Mídia (`src/app/actions/mediaActions.ts`)

**Files:**
- Create: `src/app/actions/mediaActions.ts`

**Interfaces:**
- Produces: `uploadMediaAssetAction`, `getCampaignMediaAssetsAction`, `deleteMediaAssetAction`, `updateCharacterAvatarAction`.

- [ ] **Step 1: Criar Server Actions de persistência de mídia**

Em `src/app/actions/mediaActions.ts`:
```typescript
"use server";

import { db } from "@/db";
import { mediaAssets, characters, campaigns } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface UploadMediaPayload {
  campaignId?: string | null;
  name: string;
  category: "avatar" | "scene" | "token" | "prop";
  base64: string;
  sizeBytes: number;
  width: number;
  height: number;
  userId: string;
}

/**
 * Salva uma nova mídia otimizada no banco
 */
export async function uploadMediaAssetAction(payload: UploadMediaPayload) {
  try {
    if (!payload.userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    if (payload.sizeBytes > 600 * 1024) {
      return { success: false, error: "Tamanho de imagem excede o limite otimizado (máx 600 KB)." };
    }

    const [inserted] = await db
      .insert(mediaAssets)
      .values({
        campaignId: payload.campaignId || null,
        userId: payload.userId,
        name: payload.name.trim() || `Imagem ${Date.now()}`,
        category: payload.category,
        mimeType: "image/webp",
        data: payload.base64,
        sizeBytes: payload.sizeBytes,
        width: payload.width,
        height: payload.height,
      })
      .returning({
        id: mediaAssets.id,
        name: mediaAssets.name,
        category: mediaAssets.category,
        sizeBytes: mediaAssets.sizeBytes,
      });

    return {
      success: true,
      data: {
        ...inserted,
        url: `/api/media/${inserted.id}`,
      },
    };
  } catch (error: any) {
    console.error("Erro ao fazer upload da mídia:", error);
    return { success: false, error: error?.message || "Falha ao salvar mídia." };
  }
}

/**
 * Lista todas as mídias da campanha (e avatares globais do usuário)
 */
export async function getCampaignMediaAssetsAction(campaignId?: string | null, userId?: string) {
  try {
    const conditions = [];
    if (campaignId) conditions.push(eq(mediaAssets.campaignId, campaignId));
    if (userId) conditions.push(eq(mediaAssets.userId, userId));

    const assets = await db
      .select({
        id: mediaAssets.id,
        name: mediaAssets.name,
        category: mediaAssets.category,
        sizeBytes: mediaAssets.sizeBytes,
        width: mediaAssets.width,
        height: mediaAssets.height,
        createdAt: mediaAssets.createdAt,
      })
      .from(mediaAssets)
      .where(campaignId ? eq(mediaAssets.campaignId, campaignId) : undefined)
      .orderBy(desc(mediaAssets.createdAt));

    const totalBytes = assets.reduce((acc, curr) => acc + curr.sizeBytes, 0);

    return {
      success: true,
      data: {
        assets: assets.map((a) => ({ ...a, url: `/api/media/${a.id}` })),
        totalCount: assets.length,
        totalBytes,
      },
    };
  } catch (error: any) {
    console.error("Erro ao listar mídias da campanha:", error);
    return { success: false, error: error?.message || "Falha ao listar mídias." };
  }
}

/**
 * Deleta uma mídia do banco
 */
export async function deleteMediaAssetAction(mediaId: string, campaignId?: string) {
  try {
    await db.delete(mediaAssets).where(eq(mediaAssets.id, mediaId));
    if (campaignId) {
      revalidatePath(`/campanhas/${campaignId}/narrador`);
      revalidatePath(`/campanhas/${campaignId}/mesa`);
    }
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir mídia:", error);
    return { success: false, error: error?.message || "Falha ao excluir mídia." };
  }
}

/**
 * Vincula uma mídia ao avatar do personagem
 */
export async function updateCharacterAvatarAction(characterId: string, avatarUrl: string) {
  try {
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (!character) {
      return { success: false, error: "Personagem não encontrado." };
    }

    const currentSheet = (character.sheetData as any) || {};
    const updatedSheet = {
      ...currentSheet,
      profile: {
        ...currentSheet.profile,
        avatarUrl,
      },
    };

    await db
      .update(characters)
      .set({ sheetData: updatedSheet })
      .where(eq(characters.id, characterId));

    if (character.campaignId) {
      revalidatePath(`/campanhas/${character.campaignId}/personagens/${characterId}`);
    }
    return { success: true, avatarUrl };
  } catch (error: any) {
    console.error("Erro ao atualizar avatar do personagem:", error);
    return { success: false, error: error?.message || "Falha ao atualizar avatar." };
  }
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/app/actions/mediaActions.ts
git commit -m "feat(actions): server actions para upload, consulta, exclusao e vinculacao de midias"
```

---

### Task 6: Componente da Biblioteca de Mídia (`AssetVaultModal.tsx`)

**Files:**
- Create: `src/components/media/AssetVaultModal.tsx`

**Interfaces:**
- Consumes: `campaignId`, `userId`, callback `onSelectImage(url: string)` (opcional), `isOpen`, `onClose`.
- Produces: Modal com abas por categoria, barra de cota, preview de imagens, upload direto com crop integrado e exclusão de itens.

- [ ] **Step 1: Criar o componente `AssetVaultModal.tsx`**

Em `src/components/media/AssetVaultModal.tsx`:
```tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import ImageCropModal from "@/components/common/ImageCropModal";
import { getCampaignMediaAssetsAction, uploadMediaAssetAction, deleteMediaAssetAction } from "@/app/actions/mediaActions";
import { useToast } from "@/context/ToastContext";

interface AssetVaultModalProps {
  campaignId?: string | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (url: string) => void;
  targetCategory?: "avatar" | "scene" | "token" | "prop" | "all";
}

export default function AssetVaultModal({
  campaignId,
  userId,
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
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/media/AssetVaultModal.tsx
git commit -m "feat(ui): biblioteca de ativos AssetVaultModal com galeria, cota e crop integrado"
```

---

### Task 7: Integração na Ficha do Personagem (`ProfileHeaderSection.tsx`)

**Files:**
- Modify: `src/components/sheet/ProfileHeaderSection.tsx`
- Modify: `src/components/sheet/CharacterSheetClient.tsx`

**Interfaces:**
- Consumes: `avatarUrl` existente, callbacks de atualização de avatar.
- Produces: Botão interativo no avatar do personagem abrindo o seletor com 3 opções: Subir Foto com Recorte, Escolher do Vault da Crônica, ou Inserir URL manual.

- [ ] **Step 1: Integrar o seletor de avatar no `ProfileHeaderSection.tsx`**

Adicionar modal/menu flutuante para escolha de avatar com Crop e Vault.

- [ ] **Step 2: Conectar ao `updateCharacterAvatarAction` no `CharacterSheetClient.tsx`**

- [ ] **Step 3: Commit**

```powershell
git add src/components/sheet/ProfileHeaderSection.tsx src/components/sheet/CharacterSheetClient.tsx
git commit -m "feat(sheet): integracao de upload de avatar com crop e galeria na ficha de personagem"
```

---

### Task 8: Integração no VTT & Storyteller Dashboard (`DirectorBoard.tsx`)

**Files:**
- Modify: `src/components/vtt/DirectorBoard.tsx`
- Modify: `src/components/vtt/StorytellerDashboardClient.tsx`

**Interfaces:**
- Consumes: Biblioteca de Mídias da crônica para seleção rápida de cenários e fundos do VTT.
- Produces: Botão "Galeria de Cenas" na barra do mestre abrindo o `AssetVaultModal` para projetar cenários em 1 clique.

- [ ] **Step 1: Integrar o `AssetVaultModal` no `DirectorBoard.tsx` e `StorytellerDashboardClient.tsx`**

- [ ] **Step 2: Testar a projeção de cenas em tempo real via Pusher**

- [ ] **Step 3: Commit**

```powershell
git add src/components/vtt/DirectorBoard.tsx src/components/vtt/StorytellerDashboardClient.tsx
git commit -m "feat(vtt): seletor rapido de cenarios da galeria de ativos no VTT do narrador"
```

---

## 7. Plano de Verificação e Testes

### Testes Automatizados & Build
- `npm run lint` — Verificar integridade de tipagem e regras do linter.
- `npm run build` — Validar build de produção do Next.js sem erros de tipagem.

### Testes Manuais End-to-End
1. **Upload & Crop de Avatar (1:1):**
   - Subir imagem de 5MB vertical.
   - Posicionar a janela de crop no canto da foto.
   - Confirmar e verificar se o peso final no banco ficou < 45 KB e a imagem renderizou perfeitamente na ficha.
2. **Upload & Crop de Cenário (16:9):**
   - Subir imagem horizontal panorâmica.
   - Recortar em 16:9 e aplicar como cenário ativo do VTT.
   - Verificar atualização no tabuleiro do narrador e nos jogadores via Pusher.
3. **Gerenciamento no Asset Vault:**
   - Abrir o Asset Vault, conferir o cálculo de bytes/MB consumidos.
   - Excluir uma mídia e verificar a atualização instantânea.
