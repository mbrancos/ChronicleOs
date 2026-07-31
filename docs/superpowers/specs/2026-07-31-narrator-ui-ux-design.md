# 📐 Especificação de Design: Melhorias no Escudo do Narrador (Avatar, Gaveta Lateral & Edição Divina)

**Data:** 31/07/2026  
**Status:** Aprovado  
**Escopo:** Atualização do Escudo do Narrador (`NarratorDashboardClient.tsx`), Card do Personagem (`CharacterMiniCard.tsx`), Server Action de Busca (`narratorActions.ts`) e integração da Gaveta de Ficha (`SheetDrawer`) com Edição Divina ⚡.

---

## 🎯 Objetivos do Ajuste

1. **Avatar + Identificação do Jogador:** Exibir a foto do personagem e o nome do jogador humano dono da ficha no card da antessala.
2. **Navegação em Gaveta Lateral (`SheetDrawer`):** Substituir o redirecionamento de página inteira por uma gaveta lateral deslizante na antessala, impedindo o recarregamento e saídas acidentais para o Hub.
3. **Edição Divina ⚡ Habilitada:** Permitir que o Narrador ative a Edição Divina ⚡ ao visualizar qualquer ficha pela gaveta na antessala.

---

## 🛠️ Detalhamento das Alterações

### 1. 🔍 Server Action `getCampaignDashboard` (`src/app/actions/narratorActions.ts`)
- Realizar um `leftJoin` entre a tabela `characters` e a tabela `users` (`eq(characters.userId, users.id)`).
- Retornar o nome do usuário (`userName`) e o e-mail (`userEmail`) em cada objeto de personagem da Coterie.

---

### 2. 🃏 Card do Personagem (`src/components/narrator/CharacterMiniCard.tsx`)
- **Avatar do Personagem:** Renderizar foto de perfil (`sheet.profile.avatarUrl` ou `sheet.profile.portrait_url`) em miniatura circular com borda gótica ao lado do nome do vampiro.
- **Identificação do Jogador Humano:** Exibir rótulo discreto contendo o nome do usuário/jogador dono da ficha (ex: `Jogador: @Moises` ou `Sem Jogador / NPC`).
- **Ação `ABRIR FICHA →`:**
  - Adicionar a prop callback `onOpenSheet?: (character: Character) => void`.
  - Ao ser clicado na antessala, aciona a abertura da gaveta lateral em vez de redirecionar para a página cheia.

---

### 3. 📜 Escudo do Narrador & Gaveta de Ficha (`src/components/narrator/NarratorDashboardClient.tsx`)
- Adicionar os estados `isSheetDrawerOpen` (boolean) e `selectedSheetChar` (`Character | null`).
- Renderizar o componente `SheetDrawer` no rodapé da página.
- Dentro da gaveta, instanciar o `CharacterSheetClient` passando os props:
  - `characterId={selectedSheetChar.id}`
  - `campaignId={campaign.id}`
  - `initialData={selectedSheetChar.sheetData}`
  - `initialName={selectedSheetChar.name}`
  - `initialStatus={selectedSheetChar.status}`
  - `characterType={selectedSheetChar.type}`
  - `isStoryteller={true}` (Libera o botão **`[ Edição Divina ⚡ ]`**)
  - `chronicle={campaign}`

---

## 🧪 Plano de Verificação

1. **Compilação:** Executar `npx tsc --noEmit` para garantir zero erros TypeScript.
2. **Antessala:** Abrir a antessala `/campanhas/[id]/narrador` no navegador e verificar:
   - Exibição da foto do personagem e do nome do jogador no card.
   - Clique em `ABRIR FICHA →` abre a gaveta deslizante sem mudar de rota nem voltar ao Hub.
   - Presença do botão `[ Edição Divina ⚡ ]` no menu fixo da ficha dentro da gaveta.
