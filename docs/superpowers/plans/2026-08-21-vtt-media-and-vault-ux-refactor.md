# Plano: Gestão de Categorias, Tokens de Itens no VTT e Correção Geométrica do Crop

Este plano atende às solicitações do usuário e aplica as diretrizes de **UI/UX Pro Max**:
1. **Alteração Dinâmica de Categoria:** Permitir mudar a categoria de qualquer mídia existente na biblioteca sem re-upload.
2. **Padronização das Categorias:** `Avatar` (perfil), `Cenários` (ambientes), `Itens` (objetos), `Outros` (geral).
3. **Filtro Padrão:** O `AssetVaultModal` sempre abre na aba `Todos`.
4. **Itens no Tabuleiro VTT:** Adicionar imagem de itens como tokens no tabuleiro (arrastáveis, visíveis aos jogadores) com inspeção em tela cheia ao clicar.
5. **Correção do Recorte (Crop):** Corrigir o mapeamento do `cropBox` para ser relativo estritamente às dimensões da imagem, eliminando o erro de corte indesejado na projeção.

---

## Modificações

### 1. `src/db/schema.ts`
- Atualizar tipos de `mediaAssets.category` para `"avatar" | "scene" | "item" | "other"`.
- Atualizar `sceneTokens.type` para suportar `"item"`.

### 2. `src/app/actions/mediaActions.ts`
- Adicionar `updateMediaAssetCategoryAction(id, category, name)`.
- Atualizar `UploadMediaPayload` com as novas categorias.

### 3. `src/components/common/ImageCropModal.tsx`
- Corrigir o container para envolver a imagem diretamente (proporção 1:1 com o canvas).
- Atualizar seletores de categorias: `Avatar (1:1)`, `Cenário (16:9)`, `Item (Livre)`, `Outros (Livre)`.

### 4. `src/components/media/AssetVaultModal.tsx`
- Inicializar sempre com `activeTab = "todos"`.
- Abas: `Todos`, `Avatares (1:1)`, `Cenários (16:9)`, `Itens`, `Outros`.
- Seletor de categoria em cada card para alterar instantaneamente.
- Botão `🗡️ Colocar no Tabuleiro` para instanciar como Token de Item na cena.

### 5. `src/components/vtt/Token.tsx` & `DirectorBoard.tsx`
- Suporte a token de `type === "item"` com renderização da miniatura da imagem.
- Modal de ampliação em tela cheia ao clicar no item no tabuleiro (para jogadores e narrador).
