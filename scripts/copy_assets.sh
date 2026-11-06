#!/bin/bash
# Script de automação para cópia e processamento dos assets do ChronicleOS

set -e

SRC_DIR="/home/moises/.gemini/antigravity/brain/401222b2-5cef-4c47-87c5-852c9df32505/.user_uploaded"
DEST_DIR="/media/moises/Acer/Etna/Projetos/ChronicleOS/public/images"

mkdir -p "$DEST_DIR"

echo "Copiando imagens originais..."
cp -v "$SRC_DIR/media_1793926513702_ad1dc2ef.jpg" "$DEST_DIR/veins-body.jpg"
cp -v "$SRC_DIR/media_1793926437945_46e7271e.jpg" "$DEST_DIR/neon-body.jpg"

echo "Executando recorte Pillow da figura anatômica..."
python3 /media/moises/Acer/Etna/Projetos/ChronicleOS/scripts/crop_veins_pillow.py

echo "Todos os assets foram copiados e processados com sucesso!"
