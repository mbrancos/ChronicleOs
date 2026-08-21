# Especificação de Design: Sistema de Mídia, Armazenamento Otimizado & Biblioteca de Ativos (Asset Vault)

**Data:** 21 de Agosto de 2026  
**Status:** Aprovado para Implementação  
**Autor:** Pair Programming (Antigravity & Usuário)  
**Contexto:** ChronicleOS (Vampiro: A Máscara 5ª Edição - Next.js / Neon Postgres / Tailwind CSS)

---

## 1. Visão Geral e Objetivos

O objetivo deste sistema é permitir que **Narradores e Jogadores** armazenem, gerenciem e apliquem imagens de **Avatares de Personagens**, **Cenários do VTT** e **Tokens de Cena** de forma fluida, sem atritos e totalmente compatível com os limites gratuitos da **Vercel** e do **Neon Database** (região `sa-east-1` - São Paulo).

### Metas Principais:
1. **Compressão Client-Side & WebP:** Otimização obrigatória no navegador do usuário antes do envio, convertendo arquivos para `.webp` e reduzindo o peso médio de 5MB–10MB para **30KB–90KB**.
2. **Crop Box de Janela Livre:** Modal interativo de recorte que permite ao usuário posicionar, aumentar e diminuir livremente a caixa de corte sobre qualquer parte da imagem original (inclusive bordas extremas ou ilustrações panorâmicas de grupo).
3. **Tabela Dedicada de Mídia (`media_assets`) no Postgres:** Armazenamento isolado no banco de dados com rota de streaming `/api/media/[id]` e cabeçalhos de cache HTTP agressivo (`max-age=31536000, immutable`).
4. **Biblioteca de Mídia da Crônica (Asset Vault):** Painel no Storyteller Dashboard e na Mesa VTT para gerenciar a galeria de ativos com indicador de espaço utilizado e remoção com 1 clique.
5. **Integração Completa:** Ficha de Personagem (avatar), Mesa VTT (cenário/fundo) e Tokens.

---

## 2. Arquitetura de Dados & Modelo do Banco

### 2.1 Nova Tabela: `media_assets` (`src/db/schema.ts`)

```typescript
export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id, { onDelete: "cascade" }), // Nulo se for avatar pessoal de cofre
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(), // Nome de exibição (ex: "Julian - Retrato.webp")
  category: text("category").$type<"avatar" | "scene" | "token" | "prop">().notNull(),
  mimeType: text("mime_type").default("image/webp").notNull(),
  data: text("data").notNull(), // Base64 comprimido do WebP (data url ou raw base64)
  sizeBytes: integer("size_bytes").notNull(), // Tamanho em bytes para auditoria de cota
  width: integer("width").notNull(), // Largura final em pixels
  height: integer("height").notNull(), // Altura final em pixels
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

### 2.2 Endpoint de Streaming de Mídia: `src/app/api/media/[id]/route.ts`

- **Rota:** `GET /api/media/[id]`
- **Comportamento:**
  1. Busca o registro `mediaAssets` pelo UUID.
  2. Converte a string Base64 para `Buffer` binário.
  3. Retorna a resposta HTTP com os cabeçalhos:
     - `Content-Type: image/webp`
     - `Content-Length: <sizeBytes>`
     - `Cache-Control: public, max-age=31536000, immutable`
- **Impacto de Performance:** O browser e o CDN fazem cache da imagem. Requisições repetidas não batem no banco Neon nem consomem cota de transferência (Egress).

---

## 3. Motor de Recorte & Compressão no Cliente

### 3.1 Utilitário: `src/lib/media/imageCompressor.ts`

- **Funções:**
  - `cropAndCompressToWebP(imageSource: HTMLImageElement | string, cropBox: CropArea, options: CompressOptions): Promise<{ base64: string, sizeBytes: number, width: number, height: number }>`
- **Presets de Otimização:**
  - **Avatar / Token (1:1):** `maxWidth: 400`, `maxHeight: 400`, `quality: 0.82` (peso médio: ~25–45 KB).
  - **Cenário / Background (16:9):** `maxWidth: 1280`, `maxHeight: 720`, `quality: 0.80` (peso médio: ~70–120 KB).
  - **Item / Prop (Livre/1:1):** `maxWidth: 600`, `maxHeight: 600`, `quality: 0.80` (peso médio: ~35–60 KB).

### 3.2 Componente: `src/components/common/ImageCropModal.tsx`

- **Recursos de UX:**
  - Carregamento de imagem local via `Drag & Drop` ou seletor de arquivos (`<input type="file" accept="image/*">`).
  - **Visualizador Panorâmico:** A imagem inteira é mostrada no container com camada semitransparente escurecida.
  - **Crop Box Interativo:**
    - Moldura de seleção arrastável com 8 alças (cantos e laterais).
    - Trava de aspect ratio configurável (1:1 fixo para avatares, 16:9 para cenários ou livre).
    - Permite alcançar as bordas extremas da imagem sem travamentos.
  - **Pré-visualização Dinâmica:** Exibe o tamanho estimado em KB antes de salvar.
  - **Botões de Ação:** "Cancelar" e "🩸 Salvar & Aplicar".

---

## 4. Server Actions de Mídia (`src/app/actions/mediaActions.ts`)

1. **`uploadMediaAssetAction(payload)`**:
   - Valida autenticação do usuário.
   - Insere registro em `media_assets`.
   - Retorna `{ success: true, mediaId: string, url: "/api/media/[id]" }`.
2. **`getCampaignMediaAssetsAction(campaignId)`**:
   - Retorna lista de todas as mídias da campanha agrupadas por categoria, incluindo contagem total e soma de bytes utilizados.
3. **`deleteMediaAssetAction(mediaId)`**:
   - Valida se o usuário é o criador da mídia ou o Narrador da campanha.
   - Remove o registro de `media_assets`.
4. **`updateCharacterAvatarAction(characterId, mediaUrl)`**:
   - Atualiza `sheetData.profile.avatarUrl` na tabela `characters`.
5. **`updateSceneBackgroundAction(campaignId, mediaUrl)`**:
   - Atualiza a imagem ativa de cena e fundo da campanha via Pusher e Postgres.

---

## 5. Componentes de Interface & Integrações

### 5.1 Biblioteca de Mídia (Asset Vault Modal): `src/components/media/AssetVaultModal.tsx`
- Modal acessível no Narrator Dashboard e no VTT Storyteller Dashboard.
- **Abas:** `Todos`, `Avatares (1:1)`, `Cenários (16:9)`, `Itens/Tokens`.
- **Card de Mídia:** Miniatura, nome, peso (KB), data, botão de copiar URL e botão de exclusão.
- **Barra de Cota:** Indicador textual de espaço consumido (ex: *"18 mídias • 1.4 MB de 512 MB"*).
- **Ação Rápida:** Botão para aplicar como cenário ativo da mesa em 1 clique.

### 5.2 Atualização na Ficha do Personagem (`ProfileHeaderSection.tsx`)
- Ao clicar no avatar do personagem:
  - Opção 1: Subir nova imagem com o modal de recorte.
  - Opção 2: Selecionar imagem já salva na biblioteca da crônica.
  - Opção 3: Inserir link de URL externa manual.

### 5.3 Atualização no VTT (`DirectorBoard.tsx` & `StorytellerDashboardClient.tsx`)
- O botão de alterar Cenário / Fundo de Cena abre a galeria visual com miniaturas salvas, além de permitir o upload instantâneo de novos cenários recortados em 16:9.

---

## 6. Plano de Verificação e Segurança

1. **Validação de Tipos:** Apenas tipos MIME de imagem válidos são aceitos.
2. **Sanitização de Payload:** O payload Base64 é validado no servidor quanto ao tamanho máximo permitido (< 500 KB após compressão).
3. **Controle de Acesso:** Apenas membros autenticados da campanha podem acessar mídias vinculadas a ela.
4. **Teste End-to-End de Upload:**
   - Upload de foto 4K vertical com recorte de rosto no canto lateral para Avatar (1:1).
   - Upload de imagem panorâmica para Cenário de Mesa (16:9).
   - Verificação do peso final no banco (< 60 KB) e renderização na rota `/api/media/[id]`.
   - Teste de exclusão de mídia e atualização da cota.
