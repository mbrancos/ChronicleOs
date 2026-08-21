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
    img.onerror = () => reject(new Error("Falha ao carregar imagem no navegador"));

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

  let targetWidth = Math.max(1, cropArea.width);
  let targetHeight = Math.max(1, cropArea.height);

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

  // Suavização de renderização de alta qualidade
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

  const base64Clean = webpDataUrl.split(",")[1] || webpDataUrl;
  const sizeBytes = Math.round((base64Clean.length * 3) / 4);

  return {
    base64: webpDataUrl,
    sizeBytes,
    width: targetWidth,
    height: targetHeight,
  };
}
