# Refatoração de UI/UX da Barra do VTT e Fluxo Unificado de Upload no Asset Vault

Este plano implementa as diretrizes do **UI/UX Pro Max** para eliminar a poluição visual na barra superior do Tabuleiro VTT (`DirectorBoard`), unificar o botão de upload na Biblioteca de Ativos (`AssetVaultModal`) e permitir categorização e enquadramento dinâmico no modal de recorte (`ImageCropModal`).

---

## Proposta de Mudanças

### 1. `src/components/common/ImageCropModal.tsx`
- Adicionar seletor de proporção / categoria interativo dentro do modal:
  - **Avatar / Retrato (1:1)**
  - **Cenário / Telão (16:9)**
  - **Token / Item (Livre / 1:1)**
- Adicionar campo opcional de nome da mídia.
- Retornar `{ base64, sizeBytes, width, height, category, name }`.

### 2. `src/components/media/AssetVaultModal.tsx`
- Substituir os 2 botões de upload por **1 único botão `+ Subir Imagem`** com ícone SVG.
- Ao selecionar a imagem, abre o `ImageCropModal` dinâmico.
- Tratar o contexto de seleção (`contextTitle`, `targetCategory`) para que o clique em uma imagem aplique de forma transparente no destino (Cena, Fundo do Tabuleiro ou Ficha).

### 3. `src/components/vtt/DirectorBoard.tsx`
- **Remover totalmente os inputs manuais de URL e botões avulsos**.
- **Slot 1 (Projeção de Cena):**
  - Vazio: Botão minimalista gótico `🎭 Projetar Imagem`.
  - Ativo: Thumbnail + badge `AO VIVO` + botão `✕` para encerrar projeção.
- **Slot 2 (Fundo do Tabuleiro):**
  - Vazio: Botão minimalista gótico `🖼️ Fundo do Tabuleiro`.
  - Ativo: Mini thumbnail + botão `✕` para remover fundo.
- **Controle de Rodada:** `↺ Nova Rodada`.

---

## Plano de Verificação

### Testes Manuais & Validação
1. **Compilação:** Executar `npm run build` para garantir integridade de tipagem.
2. **Fluxo VTT:**
   - Clicar em `🎭 Projetar Imagem` -> abre o Vault -> selecionar ou subir imagem -> projeta no palco.
   - Clicar em `🖼️ Fundo do Tabuleiro` -> abre o Vault -> selecionar ou subir imagem -> altera fundo.
   - Clicar em `✕` em qualquer um -> remove o item de cena ou o fundo.
3. **Fluxo de Upload Unificado no Vault:**
   - Clicar em `+ Subir Imagem` -> selecionar arquivo -> alternar entre 1:1 e 16:9 no Crop -> salvar.
