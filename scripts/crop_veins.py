#!/usr/bin/env python3
"""
Script para cópia e processamento dos assets visuais do ChronicleOS:
1. Copia as imagens originais para public/images/
2. Recorta e isola a figura anatômica central de veins-body.jpg com fundo escuro limpo.
"""

import os
import shutil
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps
import numpy as np

PROJECT_ROOT = Path("/media/moises/Acer/Etna/Projetos/ChronicleOS")
IMAGES_DIR = PROJECT_ROOT / "public" / "images"

SRC_VEINS = Path("/home/moises/.gemini/antigravity/brain/401222b2-5cef-4c47-87c5-852c9df32505/.user_uploaded/media_1793926513702_ad1dc2ef.jpg")
SRC_NEON = Path("/home/moises/.gemini/antigravity/brain/401222b2-5cef-4c47-87c5-852c9df32505/.user_uploaded/media_1793926437945_46e7271e.jpg")

DEST_VEINS = IMAGES_DIR / "veins-body.jpg"
DEST_NEON = IMAGES_DIR / "neon-body.jpg"
DEST_FIGURE = IMAGES_DIR / "anatomical-veins-figure.png"

def main():
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Copiar as imagens fonte
    print("1. Copiando veins-body.jpg...")
    shutil.copy2(SRC_VEINS, DEST_VEINS)
    print(f"   -> Salvo em: {DEST_VEINS}")

    print("2. Copiando neon-body.jpg...")
    shutil.copy2(SRC_NEON, DEST_NEON)
    print(f"   -> Salvo em: {DEST_NEON}")

    # 3. Processar a figura anatômica central
    print("3. Processando e recortando a figura anatômica central...")
    img = Image.open(DEST_VEINS).convert("RGBA")
    w, h = img.size
    print(f"   Dimensões originais: {w}x{h}")

    # Coordenadas da figura humana central (cabeça até pés, ponta dos dedos)
    # Cabeça inicia logo abaixo da moldura de Pescoço/Cabeça (~20% da altura)
    # Pés terminam próximo ao final (~98% da altura)
    # Braços e mãos se estendem de ~18% a ~82% da largura
    crop_left = int(w * 0.17)
    crop_top = int(h * 0.19)
    crop_right = int(w * 0.83)
    crop_bottom = int(h * 0.985)

    cropped = img.crop((crop_left, crop_top, crop_right, crop_bottom))
    cw, ch = cropped.size
    print(f"   Dimensões do recorte: {cw}x{ch}")

    # Criar versão com fundo escuro limpo (Noir Profundo: #08080a)
    # Converter para array numpy para isolar a figura dos resquícios laterais de caixas de texto
    arr = np.array(cropped)
    r = arr[:, :, 0].astype(float)
    g = arr[:, :, 1].astype(float)
    b = arr[:, :, 2].astype(float)

    # Identificar áreas de pergaminho/fundo bege (geralmente r > 100, g > 80, b > 50 e r ~ g)
    # E áreas fora do corpo humano central
    # Criar uma máscara suave onde o corpo com as veias vermelhas e músculos é preservado
    # Fundo escuro limpo Noir Carmesim (#08080a)
    noir_bg = np.zeros_like(arr)
    noir_bg[:, :, 0] = 8   # R
    noir_bg[:, :, 1] = 8   # G
    noir_bg[:, :, 2] = 10  # B
    noir_bg[:, :, 3] = 255 # A

    # Máscara elíptica/suave para atenuar as bordas laterais onde ficam as caixas de dano e traços
    y_coords, x_coords = np.ogrid[:ch, :cw]
    cx = cw / 2.0
    
    # Tolerância lateral: corpo é mais largo nos braços e mais fino nas pernas
    # Criamos um perfil de largura baseado na altura
    half_width = np.full(ch, cw * 0.46)
    
    # Pernas (metade inferior) são mais estreitas no centro
    legs_start = int(ch * 0.58)
    half_width[legs_start:] = np.linspace(cw * 0.30, cw * 0.22, ch - legs_start)
    
    # Cabeça e pescoço (topo 15%)
    head_end = int(ch * 0.15)
    half_width[:head_end] = np.linspace(cw * 0.18, cw * 0.35, head_end)

    # Criar máscara de transição suave
    dist_from_center = np.abs(x_coords - cx)
    mask = dist_from_center <= half_width[:, None]
    
    # Para as laterais fora do corpo central, esmaecer para o fundo escuro
    edge_feather = cw * 0.04
    feather_dist = np.clip((half_width[:, None] - dist_from_center) / edge_feather, 0.0, 1.0)
    
    # Mistura: onde a máscara é 1, mantém a imagem anatômica; fora, vai para o fundo noir
    # Também escurecer tons claros de pergaminho de fundo
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    # Onde for pergaminho claro de fundo (fora das veias vermelhas)
    is_red = (r > (g + 15)) & (r > (b + 15))
    
    # Combinar a imagem final
    result = arr.copy()
    # Aplicar escurecimento de vinheta nas bordas para limpar molduras
    for c in range(3):
        result[:, :, c] = (arr[:, :, c] * feather_dist + noir_bg[:, :, c] * (1.0 - feather_dist)).astype(np.uint8)

    final_img = Image.fromarray(result, "RGBA")
    final_img.save(DEST_FIGURE, format="PNG", optimize=True)
    print(f"   -> Figura anatômica salva com sucesso em: {DEST_FIGURE}")
    print("Concluído!")

if __name__ == "__main__":
    main()
