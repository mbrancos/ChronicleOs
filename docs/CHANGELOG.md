# Changelog - ChronicleOS

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo. O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [0.18.0] - 2026-06-20

### Adicionado
- **Rastreamento Simples de Turnos (Combate Narrativo - Fase 18):**
  - Coluna `hasActed` (boolean, default false) na tabela `scene_tokens` no Neon Database via Drizzle.
  - Server Action `toggleTokenAction(tokenId, hasActed)` para marcar/desmarcar ações de forma persistente no banco de dados.
  - Server Action `resetRound(campaignId)` para limpar reativamente e em lote o status de ação de todos os tokens da crônica.
  - Mini-botão de Check (`✔️`) gótico e translúcido posicionado no canto superior esquerdo (`-top-2 -left-2`) do medalhão, visível apenas ao Narrador, para controle instantâneo de turnos.
  - Filtro visual premium de escala de cinza (`grayscale-[0.8]`) e opacidade reduzida a `70%` no Palco para destacar instantaneamente os tokens inativos que já agiram.
  - Controle de opacidade inteligente nos Bastidores: fixado em `50%` quando o token inativo estiver fora do Palco para garantir que o Narrador continue a vê-lo claramente.
  - Botão de controle flutuante `[ 🔄 Nova Rodada ]` no canto superior direito (`absolute top-4 right-4 z-40`) do tabuleiro, visível apenas ao Narrador, com modal de confirmação antes do reset em lote.
  - Sincronização multiplayer transparente: o status de inatividade (`hasActed`) é retransmitido automaticamente a toda a mesa (jogadores comuns) via polling reativo a cada 2.5s.

## [0.17.0] - 2026-06-20

### Adicionado
- **Dashboard do Narrador (Storyteller Mode - Fase 17):**
  - Criação da tabela `scene_tokens` no banco de dados para gerenciar os tokens ativos na mesa.
  - Implementação das Server Actions de cena em `sceneActions.ts`: `getSceneTokens`, `createSceneToken`, `updateTokenPosition` e `deleteSceneToken`.
  - Controle de Rota Assimétrica em `/mesa/page.tsx` para carregar `StorytellerDashboardClient` para o Narrador (independente de possuir ficha) e `VttRoomClient` para jogadores.
  - Implementação do Quadro Interativo 2D (`DirectorBoard.tsx`) com demarcação do "Palco" (800x400px) e área externa de "Bastidores", com arrasto suave de tokens via Pointer Events.
  - Mecanismo de Fog of War: Jogadores só visualizam tokens do Palco (`isVisible === true`), enquanto o Narrador visualiza todos (tokens em Bastidores aparecem com 50% de opacidade).
  - Componente de Token circular (`Token.tsx`) com bordas coloridas indicando tipo (Jogador: Dourado, NPC: Vermelho, Figurante Rápido: Azul).
  - Popover de rolagens rápidas para Figurantes Rápidos (`quick_npc`), permitindo rolar status Físico, Social e Combate de forma Pública ou Secreta (Fome 0).
  - Dock Exclusivo de Narrador para rolagens customizadas livres (públicas/secretas) de dados normais ou testes de despertar (Rouse Checks).
  - Gaveta lateral direita na tela do Narrador exibindo fichas cadastradas da crônica para rápida inserção em cena e mini-formulário de criação de Figurantes Rápidos.
  - Integração do histórico de rolagens com suporte a Rolagens Secretas (`isSecret`), ofuscando dados e pools para jogadores (exibindo placeholders "?") e mantendo visualização transparente para o Narrador.

### Corrigido
- **Otimização de Estado no Tabuleiro 2D:**
  - Sincronização da posição dos tokens durante a renderização (React State Sync) em vez de efeitos assíncronos no `DirectorBoard` para eliminar cascading renders e avisos do linter.
  - Remoção de variáveis não-utilizadas no componente de Token e tipagem estrita via Drizzle (`typeof characters.$inferSelect`) de jogadores no client do Narrador para remover o tipo `any` e passar no linter de desenvolvimento.

## [0.16.0] - 2026-06-20

### Adicionado
- **Rerrolagem de Força de Vontade (Willpower Reroll - Fase 16):**
  - Coluna `isRerolled` na tabela `rolls` do banco de dados (Neon DB via Drizzle) para gerenciar o estado do teste original.
  - Função lógica `rerollV5` em `BloodEngine.ts` que permite a substituição de 1 a 3 dados normais mantendo os dados de fome intactos e recalculando a rolagem total.
  - Server Action `executeWillpowerReroll` em `rolls.ts` executando transações atômicas para atualizar o teste original e salvar a nova rolagem de rerrolagem.
  - Interface interativa no `<DiceVisualizer>` com suporte a cliques, efeito de hover e bordas douradas ativas nos dados normais selecionados.
  - Botão de ação premium `"Rerrolar X Dados (1 FV)"` no rodapé dos cards elegíveis do `<ActionFeed>`.
  - Tratamento de opacidade e visual translúcido reativo nos cards de rolagem já rerrolados com inclusão de badge azul `"Rerrolado 🌀"`.
  - Validação mecânica impeditiva no VTT bloqueando a rerrolagem caso a Força de Vontade do personagem esteja completamente danificada.
  - Persistência imediata do dano de Força de Vontade na ficha através do disparo direto de `updateCharacterSheet` ao realizar a ação de rerrolagem.

### Corrigido
- **Sincronização e Ciclos de Renderização (React 19 / Next.js 16):**
  - Implementação de `useCallback` e execução de polling em microtask queue (`Promise.resolve().then(...)`) no `<VttRoomClient>` para evitar cascading renders.
  - Substituição dos ganchos de sincronia de `useEffect` em `<InlineEdit>` e `<CharacterSheetClient>` por sincronizações síncronas de propriedades diretamente na fase de renderização (React State Sync).
  - Remoção de casts genéricos `as any` e tipagem estrita de props e parâmetros para sanar avisos e erros do compilador TypeScript e do linter ESLint.

---

## [0.15.0] - 2026-06-20

### Adicionado
- **Histórico Multiplayer em Tempo Real (Feed de Ações):**
  - Tabela `rolls` no Neon Database via Drizzle para persistência.
  - Server Actions `saveRoll` e `getRecentRolls` para salvar e obter as rolagens.
  - Componente `<ActionFeed>` na lateral esquerda com cards translúcidos dark-morphism e animação de entrada `slide-in` a partir da esquerda.
  - Polling periódico de 2.5s no `<VttRoomClient>` para sincronização em tempo real entre jogadores na mesa.
- **Visualizador Imersivo de Dados V5:**
  - Componente `<DiceVisualizer>` com renderização estilizada: dados normais (pretos/cinzas com destaque dourado para 10, branco para sucessos 6-9) e dados de fome (vermelhos com destaque dourado pulsante para 10, vermelho alarmante para 1, normal para falhas).
  - Suporte a Teste de Despertar (Rouse Check), exibindo 1 único dado com indicação reativa sobre alteração de Fome.

### Corrigido
- **Serialização de Server Actions:**
  - Conversão do campo `createdAt` (instância de `Date`) para string ISO em `getRecentRolls` para evitar a falha de serialização do Next.js 16 que gerava o erro `"An unexpected response was received from the server"` no console.
- **Proteção do Polling contra Esgotamento de Conexões (Neon DB):**
  - Implementado lock de requisições concorrentes (`isFetching` ref) e check de visibilidade da aba (`document.visibilityState !== "visible"`) no polling do `<VttRoomClient>` para blindar o pool de conexões contra sobrecarga no Neon PostgreSQL em desenvolvimento e produção.

---

## [0.14.0] - 2026-06-20

### Adicionado
- **O Motor de Regras V5 (BloodEngine):**
  - Módulo utilitário `src/lib/vtt/BloodEngine.ts` com funções `rollV5` e `rollRouseCheck`.
  - Tratamento de parada total com floor de 1, divisão de dados normais e dados de fome, cálculo de sucessos básicos e bônus por par de 10 (+2 sucessos adicionais por par).
  - Regra de Crítico Messiânico (par de 10 contendo dado de fome) e Falha Bestial corrigida (sucessos < dificuldade alvo e dado de fome resultando em 1).
- **Steppers de Modificadores e Dificuldade no Dock:**
  - Steppers `MOD [-] +0 [+]` e `DIF [-] 0 [+]` dourado no `PlayerDock.tsx` para permitir que o jogador configure a dificuldade do teste e bônus situacionais antes de disparar.
  - Botão de Despertar `[ 🩸 Despertar ]` integrado ao dock para rolar Testes de Despertar instantaneamente.

---

## [0.13.0] - 2026-06-19

### Adicionado
- **Carrinho de Dados (Interface de Seleção de Pool no VTT):**
  - Estado global `dicePool` no `VttRoomClient.tsx` com lógica de toggle e limite estrito de 2 slots (Atributo + Habilidade/Disciplina), seguindo o sistema V5.
  - Extensão do componente `DotSlider.tsx` com as props opcionais `onLabelClick` e `isSelected` para permitir interatividade de seleção nos rótulos de atributos e habilidades.
  - Destaque visual animado (vermelho fome + `animate-pulse-subtle`) nos labels selecionados na ficha reativa.
  - Ícone de dado `🎲` ao lado dos títulos de disciplinas na aba Sangue, resolvendo o conflito de clique com a edição inline.
  - Painel central dinâmico no `PlayerDock.tsx` com mini-badges das seleções (`Nome (Valor)`), botão de limpeza `✕` e botão primário **"ROLAR X DADOS"** com cálculo reativo da soma.
  - Animação CSS customizada `pulse-subtle` no `globals.css` para micro-animações premium no carrinho.

### Modificado
- **Sincronização Reativa dos Valores da Pool:**
  - O `VttRoomClient.tsx` agora sincroniza automaticamente os valores numéricos dos traços selecionados no carrinho quando o jogador altera níveis de atributos, habilidades ou disciplinas na ficha.
  - Correção de loop infinito de renderização no `CharacterSheetClient.tsx` ao usar `useRef` para estabilizar o callback `onDataChange`.
- **Melhorias de Lint e Qualidade:**
  - Correção de `min-h-[1.25rem]` para `min-h-5` no `InlineEdit.tsx`.
  - Correção de underscore desnecessário na classe CSS radial-gradient do `VttRoomClient.tsx`.

---

## [0.12.0] - 2026-06-19

### Adicionado
- **Fundação do VTT - A Mesa da Crônica (/campanhas/[campaign_id]/mesa):**
  - Criação do Server Component `/mesa/page.tsx` com validação de UUID de campanha e trava de segurança integrada ao Neon Auth. Caso o usuário não tenha um personagem associado a essa crônica específica, é redirecionado para o Hub.
  - Criação do componente cliente `SheetDrawer.tsx` (Gaveta deslizante à direita com largura máxima de 4xl, backdrop clicável com desfoque `backdrop-blur-xs` e botão de fechar).
  - Criação do componente cliente `PlayerDock.tsx` (Barra inferior de controle contendo avatar, nome, botão para abrir ficha, medidores compactos de Fome e medidores de danos Superficiais/Agravados representados visualmente por `╱` e `✕` no rodapé).
  - Criação do componente cliente `VttRoomClient.tsx` (Orquestrador da Mesa que une o Palco escuro atmosférico com o PlayerDock e o SheetDrawer).

### Modificado
- **Callback de Sincronia Client-side:**
  - Atualização do componente `CharacterSheetClient.tsx` para aceitar a prop opcional `onDataChange` e disparar um `useEffect` quando o estado do personagem for modificado. Isto permite atualizar instantaneamente os medidores vitais do Dock no VTT sem latência ou requisições de rede extras.

---

## [0.11.0] - 2026-06-19

### Adicionado
- **CRUD e Interatividade Dinâmica de Ficha (Abas Sangue, Vantagens e Núcleo):**
  - Implementação de criação (+ Adicionar) e exclusão (lixeira) de Disciplinas e Poderes na aba **Sangue**, integradas de forma reativa ao Autosave.
  - Implementação de criação e exclusão de Qualidades, Defeitos, Antecedentes e Fichas de Saber na aba **Vantagens**.
  - Adição de seção de Especializações na aba **Núcleo**, listando as especializações como badges interativos com botão de remoção rápida "✕" e mini-formulário para adicionar novas especializações vinculadas a Habilidades específicas.
  - Adição de bloco reativo de Pontos de Experiência (XP Gasto / XP Total) na aba **Sistema**, integrando los campos com o componente de edição inline `InlineEdit` com validação de número e persistência de dados.

### Modificado
- **Potência do Sangue Clicável:**
  - Substituição da exibição de texto estática da Potência do Sangue por um seletor `DotSlider` interativo na aba **Sangue**, com controle reativo e persistência de 0 a 5 bolinhas.
- **Proteção Contra o "Vazio Inalcançável":**
  - Reforço do componente `InlineEdit` para forçar `min-w-[60px]` e `min-h-[1.25rem]` no elemento `span` físico de clique, com fallbacks visuais limpos em baixa opacidade (`text-text-muted/40 italic`) caso o usuário apague e salve valores nulos.

---

## [0.10.0] - 2026-06-19

### Adicionado
- **Edição Invisível estilo Notion:**
  - Criação do componente cliente reusável `InlineEdit.tsx` sob `src/components/sheet/` permitindo alteração instantânea de texto e seletores sem alterar o layout das informações na tela.
  - Mapeamento estático e dinâmico de opções para os seletores de Clã e Tipo de Predador.
  - Implementação de novo estado no `CharacterProfile` de tipos para suportar e manipular a propriedade `name`.
- **Exclusão de Fichas (Hub):**
  - Implementação do modal gótico "Destruir Criação" para confirmação segura de exclusão de fichas.
  - Adição da Server Action `deleteCharacterAction` em `src/app/actions/characterActions.ts` para exclusão de personagens no Drizzle.

### Modificado
- **Refatoração da Ficha Reativa:**
  - Substituição da renderização estática do Cabeçalho Fixo (Nome, Clã, Conceito, Geração, Predador, Sire) por campos de edição invisível `InlineEdit` conectados ao autosave.
  - Atualização do Server Component `/personagens/[character_id]/page.tsx` para passar a propriedade `name` na inicialização.
  - Atualização da Server Action `updateCharacterSheet` para sincronizar a coluna pública `name` do banco automaticamente com a edição inline.
- **Lixeira nos Cards do Hub:**
  - Inserção do botão de lixeira no card do HubClient, com efeito de hover reativo (`opacity-0 group-hover:opacity-100`).

---

## [0.9.0] - 2026-06-19

### Adicionado
- **O Escudo do Narrador (Dashboard da Crônica):**
  - Criação da Server Action `getCampaignDashboard` em `src/app/actions/narratorActions.ts` para carregar a campanha e seus respectivos personagens de forma isolada e segura.
  - Criação do componente cliente `CharacterMiniCard.tsx` sob `src/components/narrator/` para exibição tática compacta e somente-leitura dos status vitais (Fome, Vitalidade, Força de Vontade) de cada personagem.
  - Criação do componente cliente `NarratorDashboardClient.tsx` sob `src/components/narrator/` contendo layout em abas (Matilha e Antagonistas), botão de cópia de convite em tempo real e formulário gótico para criação de NPCs.

### Modificado
- **Segurança Severa e Trava de Acesso:**
  - Atualização da rota `/campanhas/[campaign_id]/narrador/page.tsx` para validar a propriedade `narratorId` no servidor. Usuários não autorizados (jogadores comuns) são chutados silenciosamente de volta para `/hub`.
- **Suporte de Criação de NPCs:**
  - Ajuste na Server Action `createCharacterAction` em `src/app/actions/hubActions.ts` para aceitar opcionalmente o tipo `"npc"`, salvando o personagem no Drizzle com `userId: null` e revalidando a rota do painel do Narrador.
- **Classes Literais do Tailwind:**
  - Correção na lógica de cores do `CharacterMiniCard` para usar classes de bordas e textos literais do Tailwind, permitindo a extração correta pelo compilador estático do framework.

---

## [0.8.0] - 2026-06-19

### Adicionado
- **Sistema de Convites Mágicos e Onboarding:**
  - Criação do Server Component `/convite/[campaign_id]/page.tsx` para tratamento de parâmetros assíncronos (Next.js 15), validação de UUID no Drizzle Postgres e redirecionamento dinâmico.
  - Criação do Client Component `InviteClient.tsx` sob `src/components/invite/` com interface premium temática gótica para adesão à crônica e criação de personagem.
  - Tela 404 gótica customizada para convites corrompidos ou inexistentes ("O convite se desfez na névoa...").

### Modificado
- **Redirecionamento Inteligente com callbackUrl:**
  - Adaptação das Server Actions de login e cadastro em `src/app/actions/auth.ts` para ler o campo `callbackUrl` e redirecionar o usuário após a autenticação.
  - Refatoração de `src/app/page.tsx` (Login) e `src/app/cadastro/page.tsx` (Cadastro) sob blocos `<Suspense>` para leitura de searchParams segura do App Router.
  - Repasse do `callbackUrl` por inputs ocultos nos formulários de autenticação e nos links alternadores de tela.
- **Botão de Cópia de Convite no Hub:**
  - Adição do botão "Copiar Convite" na lista de crônicas do Narrador no [HubClient.tsx](file:///d:/Etna/Projetos/ChronicleOS/src/components/hub/HubClient.tsx) usando Clipboard API.
  - Implementação de feedback visual reativo temporário ("Copiado! 🩸") de 2 segundos para o ID da crônica copiada.
- **Retorno do ID de Criação do Personagem:**
  - Ajuste na Server Action `createCharacterAction` em `src/app/actions/hubActions.ts` para retornar o ID gerado usando a cláusula `.returning()` do Drizzle.

---

## [0.7.0] - 2026-06-18

### Adicionado
- **Server Actions de Criação de Entidades:**
  - Criação do arquivo `src/app/actions/campaignActions.ts` contendo a ação `createCampaignAction` para inserir novas crônicas e disparar a revalidação de dados em tela.
  - Adição da Server Action `createCharacterAction` em `src/app/actions/characterActions.ts` para criar novos personagens a partir de uma campanha associada, inicializando com o objeto `DEFAULT_CHARACTER_DATA`.
- **Painel de Controle Centralizado do Hub:**
  - Desenvolvimento do Client Component `HubClient.tsx` sob `src/components/hub/` com estética gótica em tons de vermelho sangue e dourado.
  - Implementação de Empty States poéticos para listas de crônicas e fichas.
  - Modais interativos de criação de Campanhas e Personagens, acionando as Server Actions correspondentes.

### Modificado
- **Arquitetura de Rota do Hub:**
  - Refatoração de `src/app/hub/page.tsx` para se tornar um Server Component puro que busca campanhas e personagens do banco via Drizzle e injeta como props no `HubClient`.
  - Configuração de `export const dynamic = "force-dynamic"` na página do Hub para assegurar o funcionamento da verificação de sessão (cookies) sem emitir avisos durante a geração de build estático.
- **Trava de Segurança Relacional (FK):**
  - Implementação de trava de validação lógica no botão "Novo Personagem" do Hub, bloqueando a criação caso o usuário não possua campanhas cadastradas para evitar erros de restrição de chave estrangeira no banco de dados.
- **Centralização de Constantes de Ficha:**
  - Migração de `DEFAULT_CHARACTER_DATA` de `CharacterSheetClient.tsx` para `src/types/character.ts` a fim de compartilhá-la de forma limpa entre o lado do cliente e o lado do servidor.
- **Correção de Classe do Tailwind:**
  - Substituição da classe legada `flex-shrink-0` por `shrink-0` no avatar de personagens do HubClient.tsx para sanar o warning da IDE.
- **Resiliência da Ficha (Deep Merge):**
  - Implementação do helper `deepMerge` na inicialização do estado de [CharacterSheetClient.tsx](file:///d:/Etna/Projetos/ChronicleOS/src/components/sheet/CharacterSheetClient.tsx) para evitar quebras de runtime (`TypeError`) caso os personagens possuam dados parciais ou desatualizados salvos no banco.
- **Resolução de Hydration Mismatch:**
  - Adição de `suppressHydrationWarning` no layout raiz [layout.tsx](file:///d:/Etna/Projetos/ChronicleOS/src/app/layout.tsx) para tolerar extensões do browser do usuário que modificam tags superiores (`<html>` ou `<body>`).
- **Correção da Rota de Logout (Sign-Out):**
  - Criação da Server Action `signOutAction` em [auth.ts](file:///d:/Etna/Projetos/ChronicleOS/src/app/actions/auth.ts) utilizando o método `auth.signOut` do Neon Auth com cookies e headers passados por meio de `fetchOptions.headers` para garantir a conformidade de tipos do TypeScript e a exclusão da sessão no servidor.
  - Substituição da tag `<a>` com requisição GET em `HubClient.tsx` por um `<button>` associado à nova Server Action de logout.

---

## [0.6.0] - 2026-06-18

### Adicionado
- **Persistência Assíncrona no Neon Database:**
  - Criação do arquivo `src/app/actions/characterActions.ts` contendo as Server Actions `getCharacterSheet` e `updateCharacterSheet` para carregamento e salvamento atômico do JSONB da ficha no banco de dados Neon.
  - Validação robusta de UUID via regex nas Server Actions para garantir que apenas IDs de personagens válidos façam queries no PostgreSQL.
- **Autosave Debounced:**
  - Criação do hook customizado `useAutosave.ts` em `src/hooks/` com debounce de 1000ms.
  - Utilização de `useRef` para encapsular a referência de `onSave` e do valor atual da ficha, isolando-a de renderizações cíclicas causadas por troca de abas ou outros estados locais da UI (evitando loops infinitos e vazamentos de memória).

### Modificado
- **Arquitetura Server/Client Component da Rota de Personagem:**
  - Refatoração de `src/app/campanhas/[campaign_id]/personagens/[character_id]/page.tsx` para se tornar um Server Component puro, realizando a busca de dados no servidor e passando-os para o cliente.
  - Criação de `src/components/sheet/CharacterSheetClient.tsx` para gerenciar toda a lógica interativa da interface da ficha no lado do cliente.
- **Indicador Visual de Sincronia:**
  - Implementação de um status de sincronização (`syncStatus`) exibido discretamente no cabeçalho fixo, transitando de forma limpa entre inativo, "Salvando alterações...", "✓ Sincronizado" e "⚠️ Falha na sincronia".
- **Resiliência de Tipagem no Next.js:**
  - Correção na atribuição de dados iniciais no Server Component de `page.tsx` para garantir que `initialData` não seja `undefined` e passe na verificação estrita do compilador TypeScript.

---

## [0.5.0] - 2026-06-18

### Adicionado
- **Componentes Modulares de Interface da Ficha:**
  - Criação do componente `DotSlider.tsx` sob `src/components/sheet/` para controle de bolinhas em ouro/vermelho com prevenção de overflow e touch target de 44px.
  - Criação do componente `DamageTracker.tsx` sob `src/components/sheet/` com lógica de clique por valor (anti-teleporte) e suporte a variantes de vitalidade e força de vontade.
  - Criação do componente `HumanityTracker.tsx` sob `src/components/sheet/` para rastreamento da trilha de 10 caixas combinando humanidade e máculas com feedback de degeneração moral.

### Modificado
- **Clean Code no Componente Principal da Ficha:**
  - Atualização de [page.tsx](file:///d:/Etna/Projetos/ChronicleOS/src/app/campanhas/[campaign_id]/personagens/[character_id]/page.tsx) para integrar as instâncias dos novos componentes modulares.
  - Remoção de lógicas inlined complexas de rotação de danos, trilhas e definições locais inlined de componentes auxiliares.

---

## [0.4.0] - 2026-06-18

### Adicionado
- **Motor de Tipagem do Vampiro V5:**
  - Criação do arquivo `src/types/character.ts` tipando estritamente a ficha de personagem JSONB com perfis, trackers, especializações de habilidades, disciplinas, vantagens, loresheets e macros.
- **Interface de Ficha Reativa Completa:**
  - Criação da página de exibição e controle da ficha de personagem em `src/app/campanhas/[campaign_id]/personagens/[character_id]/page.tsx` usando dados mockados baseados nas regras do Demiplane Nexus.
  - **Cabeçalho Fixo:** Exibição do avatar SVG, perfil detalhado com Bane e marcadores rápidos de Vitalidade, Força de Vontade, Fome, Humanidade e Máculas (Stains) interativos com rotação de estado.
  - **Tabs de Navegação Customizadas:** Abas reativas para Núcleo, Sangue, Vantagens e Sistema com visual gótico e transições suaves.
  - **Aba Núcleo com Prevenção de Overflow:** Componente `DotSlider` com largura máxima de `110px` e touch target vertical de `44px` para prevenir overflow horizontal em viewports móveis de `375px`.
  - **Simulador de Rolagem Gótico (V5):** Simulador interativo que calcula pools dinâmicos, separa dados normais e de fome, e resolve sucessos, falhas bestiais e críticos messiânicos graficamente na tela com logs temáticos.

---

## [0.3.0] - 2026-06-18

### Adicionado
- **Fontes Góticas Oficiais do Demiplane:**
  - Inclusão dos arquivos físicos das fontes `Gin`, `GoodOT`, `GoodOT-CondBold` e `Taroca` na pasta `public/fonts/`.
  - Configuração do carregamento local via `next/font/local` no [layout.tsx](file:///d:/Etna/Projetos/ChronicleOS/src/app/layout.tsx).
- **Estilização de Autenticação Gótica:**
  - Aplicação do visual gótico de alto contraste na página de Login (`src/app/page.tsx`) e Cadastro (`src/app/cadastro/page.tsx`) com foco temático em vermelho sangue e dourado.

### Modificado
- **Caminho e Otimização de Fontes:**
  - Configuração no [layout.tsx](file:///d:/Etna/Projetos/ChronicleOS/src/app/layout.tsx) para carregar `Barlow` e `Nunito` via Google Fonts (`next/font/google`).
  - Atualização dos caminhos de fontes góticas para apontar para a pasta `/public`.
- **Tema Global no Tailwind CSS v4:**
  - Correção de sintaxe no arquivo [globals.css](file:///d:/Etna/Projetos/ChronicleOS/src/app/globals.css) removendo a diretiva inline do bloco `@theme`.
  - Mapeamento das variáveis de cores e fontes oficiais góticas e de dados.
- **Documentação de Design:**
  - Atualização do [design-system.md](file:///d:/Etna/Projetos/ChronicleOS/docs/design-system.md) documentando a localização física de fontes e a regra de prevenção de overflow no mobile para os seletores de bolinha (dots) usando a lógica de Slider Contínuo (Opção B) com área de toque vertical de 44px.

### Corrigido
- **Materialização de Tabelas no Banco de Dados (Neon):**
  - Sincronização inicial do banco de dados executando `npx drizzle-kit push` para materializar as tabelas `users`, `campaigns` e `characters` diretamente no Neon Database com base nas credenciais corrigidas.

---

## [0.2.0] - 2026-06-18

### Adicionado
- **Integração do Neon Auth:**
  - Instalação e configuração do SDK oficial `@neondatabase/auth` (baseado em Better Auth/Clerk).
  - Inicialização do SDK no servidor através do arquivo `src/lib/auth/server.ts`.
  - Rota de API catch-all em `src/app/api/auth/[...path]/route.ts` para lidar com sessões e callbacks.
- **Proxy de Rotas (Next.js 16):**
  - Criação do arquivo `src/proxy.ts` (conforme convenção do Next.js 16) gerenciando redirecionamento inteligente:
    - Usuários autenticados acessando `/` ou `/cadastro` são redirecionados para `/hub`.
    - Usuários não-autenticados acessando rotas privadas (como `/hub` ou `/campanhas/*`) são redirecionados para `/`.
- **Server Actions de Autenticação com Rollback:**
  - Criação do arquivo `src/app/actions/auth.ts` contendo as funções `signInAction` e `signUpAction`.
  - **Lógica de Sincronia de Entidades:** Implementação de um `INSERT` automático na tabela pública `users` do Drizzle após o cadastro de usuário bem-sucedido no Neon Auth.
  - **Rollback contra Estado Fantasma Reverso:** Lógica try/catch que executa uma chamada REST `DELETE` na API do Neon para excluir o usuário recém-criado do Auth caso a inserção no banco público Drizzle falhe.
- **Interfaces Funcionais de Usuário (React 19):**
  - Criação de telas e formulários interativos em `src/app/page.tsx` (Login) e `src/app/cadastro/page.tsx` (Cadastro) integrados com o hook `useActionState` do React 19 para exibição ativa de erros.

### Modificado
- **Variáveis de Ambiente:** Ajuste no arquivo `.env` para renomear `NEXT_PUBLIC_NEON_AUTH_URL` para `NEON_AUTH_BASE_URL` por motivos de conformidade do SDK e segurança, e inclusão de `NEON_API_KEY` para o rollback.

---

## [0.1.0] - 2026-06-18

### Adicionado
- **Inicialização do Projeto:**
  - Estruturação headless blindada do Next.js 16 (App Router) com TypeScript, Tailwind CSS e pasta `src/`.
- **Banco de Dados (Drizzle ORM):**
  - Instalação e configuração do `drizzle-orm`, `@neondatabase/serverless` (driver HTTP) e `drizzle-kit`.
  - Configuração do arquivo `drizzle.config.ts`.
  - Conexão do banco de dados configurada em `src/db/index.ts`.
  - Modelagem do schema do banco em `src/db/schema.ts` com as tabelas `users`, `campaigns` e `characters` (com coluna `sheet_data` configurada estritamente como `jsonb`).
- **Rotas de RPG:**
  - Criação das páginas dinâmicas e estáticas vazias para infraestrutura: `/hub`, `/convite/[campaign_id]`, `/campanhas/[campaign_id]/narrador` e `/campanhas/[campaign_id]/personagens/[character_id]` com suporte a parâmetros assíncronos no Next.js 16/15.

### Corrigido
- **Resiliência Relacional:** Ajuste fino na chave estrangeira `user_id` na tabela `characters` para utilizar `onDelete: "set null"` (em vez de `cascade`), protegendo as fichas dos personagens contra a exclusão acidental da conta de jogadores (os personagens passam a ser NPCs sob comando do Narrador).
- **Limpeza do Boilerplate:** Remoção de mídias desnecessárias (`public/*.svg`) e limpeza de estilos poluídos no Next.js.
