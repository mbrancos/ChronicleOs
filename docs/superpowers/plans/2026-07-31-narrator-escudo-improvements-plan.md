# 📐 Plano de Implementação: Melhorias no Escudo do Narrador (Avatar, Gaveta & Edição Divina)

> **Para executores agentivos:** SUB-SKILL REQUERIDA: Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. As etapas usam a sintaxe de checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Exibir a foto do personagem e a identificação do jogador humano no card da antessala (`CharacterMiniCard`), e fazer o botão `ABRIR FICHA →` abrir a gaveta lateral (`SheetDrawer`) diretamente no Escudo do Narrador com a **Edição Divina ⚡** ativada.

**Arquitetura:** Atualizaremos a Server Action `getCampaignDashboard` para trazer o nome do jogador via `leftJoin` com a tabela `users`. O card `CharacterMiniCard` exibirá a foto de perfil (`avatarUrl`), o nome do usuário e disparará a gaveta lateral `SheetDrawer` em vez de redirecionar para fora da crônica.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Drizzle ORM, Tailwind CSS.

---

## 🎯 Atividades e Modificações Propostas

### 1. Server Action de Busca (`narratorActions.ts`)
#### [MODIFY] [narratorActions.ts](file:///d:/Etna/Projetos/ChronicleOS/src/app/actions/narratorActions.ts)
- Adicionar `leftJoin(users, eq(characters.userId, users.id))` na busca de personagens da campanha.
- Retornar o nome do usuário (`userName`) e o e-mail (`userEmail`) em cada registro da Coterie.

---

### 2. Card do Personagem (`CharacterMiniCard.tsx`)
#### [MODIFY] [CharacterMiniCard.tsx](file:///d:/Etna/Projetos/ChronicleOS/src/components/narrator/CharacterMiniCard.tsx)
- Adicionar renderização da foto de perfil (`avatarUrl` / `portrait_url`) em avatar circular gótico.
- Exibir de forma discreta o nome do jogador humano (`userName`).
- Receber o prop `onOpenSheet?: (character: any) => void`.
- Atualizar o acionador de `ABRIR FICHA →` para invocar `onOpenSheet` quando disponível.

---

### 3. Escudo do Narrador (`NarratorDashboardClient.tsx`)
#### [MODIFY] [NarratorDashboardClient.tsx](file:///d:/Etna/Projetos/ChronicleOS/src/components/narrator/NarratorDashboardClient.tsx)
- Importar `SheetDrawer` e `CharacterSheetClient`.
- Adicionar estados `isSheetDrawerOpen` e `selectedSheetChar`.
- Conectar o evento `onOpenSheet` dos mini cards para abrir a gaveta.
- Renderizar `SheetDrawer` com `CharacterSheetClient` passando `isStoryteller={true}` para habilitar a **Edição Divina ⚡**.

---

## 📋 Tarefas Detalhadas de Implementação

### Tarefa 1: Atualizar Server Action de Busca com `userName`
**Arquivos:**
- Modificar: `d:\Etna\Projetos\ChronicleOS\src\app\actions\narratorActions.ts`

**Interfaces:**
- Consumes: `users` table from `@/db/schema`
- Produces: `userName` e `userEmail` acoplados nos objetos de `players`.

- [ ] **Passo 1: Importar `users` de `@/db/schema` em `narratorActions.ts`**
- [ ] **Passo 2: Adicionar o `leftJoin` com a tabela `users` na busca `campaignCharacters`**
- [ ] **Passo 3: Mapear os objetos retornando `userName` e `userEmail`**
- [ ] **Passo 4: Validar compilação TypeScript com `npx tsc --noEmit`**

---

### Tarefa 2: Renderizar Avatar, Nome do Jogador e Callback de Gaveta em `CharacterMiniCard.tsx`
**Arquivos:**
- Modificar: `d:\Etna\Projetos\ChronicleOS\src\components\narrator\CharacterMiniCard.tsx`

**Interfaces:**
- Consumes: `character.userName`, `sheet.profile.avatarUrl`, `onOpenSheet`
- Produces: UI do card atualizada com avatar, nome do jogador humano e callback de abertura da gaveta.

- [ ] **Passo 1: Atualizar `CharacterMiniCardProps` para aceitar `onOpenSheet` e `userName`**
- [ ] **Passo 2: Adicionar componente de foto de perfil (avatar circular) no card**
- [ ] **Passo 3: Exibir rótulo discreto `Jogador: @${userName}` abaixo do nome do personagem**
- [ ] **Passo 4: Atualizar a ação do botão `ABRIR FICHA →` para disparar `onOpenSheet`**
- [ ] **Passo 5: Validar compilação TypeScript com `npx tsc --noEmit`**

---

### Tarefa 3: Integrar `SheetDrawer` e Edição Divina no Escudo do Narrador
**Arquivos:**
- Modificar: `d:\Etna\Projetos\ChronicleOS\src\components\narrator\NarratorDashboardClient.tsx`

**Interfaces:**
- Consumes: `SheetDrawer`, `CharacterSheetClient`, `isStoryteller={true}`
- Produces: Gaveta de ficha funcional na antessala com Edição Divina ativável.

- [ ] **Passo 1: Importar `SheetDrawer` e `CharacterSheetClient` em `NarratorDashboardClient.tsx`**
- [ ] **Passo 2: Criar os estados `isSheetDrawerOpen` e `selectedSheetChar`**
- [ ] **Passo 3: Passar `onOpenSheet` para os componentes `CharacterMiniCard`**
- [ ] **Passo 4: Renderizar `SheetDrawer` no rodapé da página com `isStoryteller={true}`**
- [ ] **Passo 5: Validar compilação TypeScript com `npx tsc --noEmit`**

---

## 🧪 Plano de Verificação

### Teste Estático
- Executar `npx tsc --noEmit` para garantir 0 erros de compilação.

### Teste de Interface
1. Acessar o Escudo do Narrador `/campanhas/[id]/narrador`.
2. Verificar se os cards exibem a foto de perfil do personagem e o nome do jogador humano.
3. Clicar em `ABRIR FICHA →` em um card de jogador.
4. Confirmar que a gaveta lateral `SheetDrawer` abre sem sair da página e sem recarregar a tela.
5. Verificar se o botão **`[ Edição Divina ⚡ ]`** aparece no cabeçalho fixo da ficha e permite alternar com sucesso.
