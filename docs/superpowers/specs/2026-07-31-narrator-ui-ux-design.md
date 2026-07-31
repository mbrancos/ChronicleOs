# 📐 Especificação de Design: Redesign de UI/UX da Experiência do Narrador (Antessala & Mesa VTT)

**Data:** 31/07/2026  
**Status:** Aprovado  
**Escopo:** Refatoração visual e de usabilidade do Escudo do Narrador / Antessala (`NarratorDashboardClient.tsx`), Card do Personagem (`CharacterMiniCard.tsx`), Mesa de Jogo VTT (`StorytellerDashboardClient.tsx`), e atualização do `docs/design-system.md`.

---

## 🎯 Visão Geral do Redesign

O objetivo desta refatoração é proporcionar ao Narrador uma experiência limpa, gótica e ágil para gerenciar crônicas e conduzir sessões ao vivo no **ChronicleOS**. 

---

## 🏛️ 1. Antessala da Crônica & Escudo do Narrador (`NarratorDashboardClient.tsx`)

### Layout e Cabeçalho Superior
- **Design Gótico Glassmorphic:** Cabeçalho com fundo escuro translúcido (`bg-bg-card/90 backdrop-blur-md`), bordas finas em `border-white/10`.
- **Identificação da Crônica:** Título principal usando a fonte gótica (`font-gothic text-3xl text-blood-red`), badge indicativa `ESCUDO DO NARRADOR` em dourado e controle rápido de sessão (`Sessão #X` com botões `[-]` e `[+]`).
- **Barra Principal de Ações:**
  - `[ 🩸 ABRIR MESA DE JOGO ]`: Botão vermelho primário com efeito hover brilhante.
  - `[ ⚙️ CONFIGURAÇÕES ]`: Abre o modal de Regras da Casa (Homebrews) e multiplicador de XP.
  - `[ 🔗 COPIAR CONVITE ]`: Botão com feedback visual imediato de cópia (`Copiado! ✓`).
  - `[ RETORNAR AO HUB ]`: Atalho para voltar ao Hub de Campanhas.
- **Navegação Tabulada Ativa:** Abas com contadores numéricos luminosos:
  - `Coterie (Jogadores) • N`
  - `Antagonistas (NPCs) • N`

---

## 🃏 2. Redesign do Card de Personagem (`CharacterMiniCard.tsx`)

### Estrutura Visual do Card:
- **Foto de Perfil & Identificação do Jogador:**
  - Avatar circular/retangular do personagem com moldura gótica e fallback suave caso não possua foto.
  - **Identificação do Jogador:** Exibição discreta do nome do usuário/jogador (ex: `Jogador: @moises` ou `Dono: @nome`) para fácil identificação do Narrador.
  - **Presença em Tempo Real:** Ponto esmeralda pulsante indicando se o jogador está com o ChronicleOS aberto e conectado na mesa.
- **Trackers Vitais Resumidos (Sem atalhos de rolagem poluídos):**
  - **Fome:** 5 marcadores visuais de Fome em vermelho (`color-hunger-red`).
  - **Vitalidade (Saúde):** Mini-trilha de 10 caixas exibindo Danos Superficiais (`/`) e Agravados (`X`).
  - **Força de Vontade:** Mini-trilha exibindo os estados de dano na força de vontade.
  - **Humanidade:** Trilhas numéricas com marcadores dourados (`color-gold-accent`).
- **Ações de Gestão no Card:**
  - Botão de trava/destrava da ficha `[ DESTRAVAR 🔓 / TRAVAR 🔒 ]`.
  - Botão principal `[ ABRIR FICHA → ]` que dispara a gaveta lateral `SheetDrawer` para inspeção ou **Edição Divina**.

---

## 🎲 3. Mesa de Jogo VTT do Narrador (`StorytellerDashboardClient.tsx`)

### Layout e Dock Fixo na Base:
- **Palco da Cena:** Área central de bastidores e palco da cena com seletores de URL de Imagem de Cena e Fundo de Cenário.
- **Dock Fixo Inferior (`fixed bottom-0 left-0 right-0 w-full`):**
  - Barra de controle contínua ancorada na base da tela (`bg-bg-card-dark border-t border-white/10 p-3`).
  - Seletores de dados: `DADOS [- 6 +]`, `DIFICULDADE [- 3 +]`, `FOME [- 0 +]`, Input de Ação (`Ação...`).
  - Botões de Rolagem:
    - `[ PÚBLICO ]`: Dispara rolagem pública para toda a mesa.
    - `[ SECRETO ]`: Dispara rolagem oculta marcada com a badge `Escudo do Mestre 🛡️`.
    - `[ 🩸 DESPERTAR ]`: Botão vermelho carmesim para Rouse Check direto.
- **Gaveta Lateral de Fichas (`SheetDrawer`):** Desliza pela direita permitindo consultar qualquer ficha de jogador ou NPC sem cobrir o dock fixo ou fechar a mesa.

---

## 🧪 Plano de Verificação

1. **TypeScript Check:** Executar `npx tsc --noEmit` para validar ausência de erros de tipagem.
2. **Verificação de UI na Antessala:** Testar a renderização dos cards com avatar, nome do jogador discreto e contadores vitais.
3. **Verificação no VTT:** Testar o dock fixo na base, abertura do drawer de fichas e exibição de imagens de cena.
4. **Documentação:** Atualizar `docs/design-system.md` e `docs/CHANGELOG.md`.
