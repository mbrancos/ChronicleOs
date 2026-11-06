#!/usr/bin/env python3
"""
Script puramente em Python + Pillow (PIL) para cópia e recorte dos assets visuais do ChronicleOS.
Não requer dependências externas além de Pillow (PIL).
"""

import os
import shutil
from pathlib import Path
from PIL import Image, ImageDraw

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

    # 3. Recortar figura anatômica central
    print("3. Processando e recortando a figura anatômica central...")
    img = Image.open(DEST_VEINS).convert("RGBA")
    w, h = img.size

    # Recorte da silhueta completa (topo da cabeça até os pés)
    crop_left = int(w * 0.17)
    crop_top = int(h * 0.19)
    crop_right = int(w * 0.83)
    crop_bottom = int(h * 0.985)

    cropped = img.crop((crop_left, crop_top, crop_right, crop_bottom))
    cw, ch = cropped.size

    # Criar imagem final com fundo noir (#08080a)
    noir_bg = Image.new("RGBA", (cw, ch), (8, 8, 10, 255))

    # Criar máscara suave para atenuar as bordas laterais com caixas de texto
    mask = Image.new("L", (cw, ch), 0)
    draw = ImageDraw.Draw(mask)

    # Polígono aproximado do corpo humano (cabeça, ombros, braços, tronco, pernas)
    cx = cw / 2.0
    body_points = [
        # Cabeça / Pescoço
        (cx - cw * 0.12, 0),
        (cx + cw * 0.12, 0),
        (cx + cw * 0.18, ch * 0.10),
        # Ombros e braço direito (visão do observador)
        (cx + cw * 0.46, ch * 0.22),
        (cx + cw * 0.44, ch * 0.42), # Mão direita
        (cx + cw * 0.28, ch * 0.48),
        # Quadril e perna direita
        (cx + cw * 0.22, ch * 0.60),
        (cx + cw * 0.18, ch * 0.80),
        (cx + cw * 0.18, ch),        # Pés
        (cx - cw * 0.18, ch),        # Pés
        # Perna esquerda
        (cx - cw * 0.18, ch * 0.80),
        (cx - cw * 0.22, ch * 0.60),
        (cx - cw * 0.28, ch * 0.48),
        # Braço esquerdo e ombro
        (cx - cw * 0.44, ch * 0.42), # Mão esquerda
        (cx - cw * 0.46, ch * 0.22),
        (cx - cw * 0.18, ch * 0.10),
    ]

    draw.polygon(body_points, fill=255)

    # Suavizar as bordas da máscara com filtro gaussiano
    from PIL import ImageFilter
    mask_blurred = mask.filter(ImageFilter.GaussianBlur(radius=cw * 0.03))

    # Compor recorte sobre o fundo escuro
    final_img = Image.composite(cropped, noir_bg, mask_blurred)
    final_img.save(DEST_FIGURE, format="PNG", optimize=True)

    print(f"   -> Salvo com sucesso em: {DEST_FIGURE}")
    print("Processamento concluído com sucesso!")

if __name__ == "__main__":
    main()
