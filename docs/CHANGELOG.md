# Changelog - ChronicleOS

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo. O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

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
