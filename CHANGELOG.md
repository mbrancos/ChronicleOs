# Changelog - ChronicleOS

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo. O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

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
