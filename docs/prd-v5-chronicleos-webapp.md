# Ficha RPG Vampiro A Máscara

## Objetivo

Sistema de fichas interativas para campanhas de Vampiro: A Máscara, com suporte a narrador, jogadores e sincronização de estado em tempo real. A arquitetura foca em uma "Ficha Reativa" baseada em JSONB para máxima flexibilidade.

## Telas

### Autenticação

**Rota:** `/`

**Objetivo:** Autenticar usuário ou criar nova conta para acessar o sistema.

**Componentes:**
- **Input Email**
- **Input Senha**
- **Botão Entrar**: Autentica o usuário nativamente via provedor (Neon Auth) e redireciona para `/hub`.
- **Link Criar Conta**: Navega para a tela de cadastro.

### Hub
**Rota:** `/hub`
**Objetivo:** Tela central pós-login onde o usuário neutro gerencia seus acessos. O sistema faz uma query no banco de dados para listar onde ele é Mestre e onde ele é Jogador.
**Componentes:**
- **Seção "Minhas Crônicas" (Narrador):** Lista de campanhas onde o user.id == campaign.narrator_id. Clicar leva para `/campanhas/:campaign_id/narrador`. Botão de "Criar Nova Campanha".
- **Seção "Minhas Fichas" (Jogador):** Lista de campanhas onde o user.id possui uma ficha vinculada. Clicar leva direto para `/campanhas/:campaign_id/personagens/:character_id`. Botão para "Entrar via Convite".

### Rota de Convite (Link Mágico)
**Rota:** `/convite/:campaign_id`
**Objetivo:** Link gerado pelo Narrador para convidar jogadores. Ao acessar logado, o sistema cria automaticamente uma ficha em branco (com campaign_id da mesa e user_id do jogador) e o redireciona para a tela da ficha recém-criada.

### Painel do Narrador

**Rota:** `/campanhas/:campaign_id/narrador`

**Objetivo:** Exibe cards de todos os personagens e NPCs ativos com dados críticos.

**Componentes:**
- **Card Resumo:** Exibe Nome, Vitalidade, Força de Vontade e Fome em tempo real. Clicar no card expande a ficha completa do alvo.
- **Botões de Ação:** Criar Personagem, Editar Personagem, Excluir Personagem.

### Ficha Completa (Personagem / NPC / Coterie)

**Rota:** `/campanhas/:campaign_id/personagens/:character_id`

**Objetivo:** Interface Mobile-First de página única renderizando o objeto JSONB.

**Componentes:**
- **Cabeçalho:** Nome, Clã, Conceito.
- **Rastreadores Reativos:** Vitalidade (Vazio, /, X), Força de Vontade e Fome.
- **Bolinhas de Pontuação:** Atributos e Habilidades.
- **Macros de Rolagem:** Botões criados pelo usuário que somam atributos específicos da ficha e rolam dados de d10 (incluindo cálculo automático de Dados de Fome).
- **Anotações Públicas (Apenas NPC):** Campo de texto rico visível para os jogadores.
- **Recursos da Coterie:** Domínio, Aliados, Refúgio e Detratores.

## Personas e Papéis de Contexto

### Permissão de Sistema (Global)
#### Administrador do Sistema (admin)
Possui a flag `role = 'admin'` na tabela de usuários. Tem acesso irrestrito aos bastidores do banco de dados para manutenção técnica, mas não possui interface ou painel administrativo dentro do webapp.

#### Usuário Padrão (user)
Possui a flag `role = 'user'`. O comportamento desse usuário muda dinamicamente dependendo do contexto da campanha em que ele entra:
- Como user, eu quero editar meu perfil básico (Nome/Email).
- Como user, eu quero criar campanhas (tornando-me automaticamente o Narrador delas).
- Como user, eu quero entrar como jogador na campanha de outro usuário através de um convite.

### Permissão de Domínio (Contextual)
#### 1. Narrador (Mestre da Campanha)
Usuário cujo ID está no campo `narrator_id` da tabela de campanhas. Possui controle de Leitura e Escrita total sobre aquela mesa específica.
**User Stories:**
- Como Narrador, eu quero criar fichas de Personagens (que ficarão vinculadas ao meu usuário) e gerar fichas em branco para os jogadores.
- Como Narrador, eu quero visualizar um dashboard com os status vitais de todos os envolvidos na cena.
- Como Narrador, eu quero alterar a Vitalidade ou Fome de qualquer ficha da minha campanha e ver isso refletir na tela do jogador instantaneamente.
- Como Narrador, eu quero escrever Anotações Públicas no JSON de um NPC para revelar informações à Coterie.

#### 2. Jogador
Usuário cujo ID está no campo `user_id` da tabela de personagens de uma campanha. Possui controle de Escrita apenas na própria ficha e Leitura parcial na ficha de outros (apenas a seção Coterie).
**User Stories:**
- Como Jogador, eu quero receber a ficha em branco criada pelo sistema ao entrar na campanha através de um convite.
- Como Jogador, eu quero poder gerenciar uma ou múltiplas fichas próprias dentro da mesma campanha, alternando entre elas facilmente pelo celular.
- Como Jogador, eu quero editar a ficha do meu personagem e preencher meus atributos de forma fluida pelo celular.
- Como Jogador, eu quero criar botões de macro na minha ficha para automatizar rolagens de Disciplinas.
- Como Jogador, eu quero marcar os danos recebidos (Superficial/Agravado) com cliques simples nos quadrados de Vitalidade.
- Como Jogador, eu quero acessar o card da Coterie de outros personagens para consultar nossos domínios e aliados em comum.

## Banco de Dados

### users
Armazena informações de perfil público e papel global. (A autenticação e gestão de senhas é delegada às tabelas internas do provedor via Neon Auth).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Chave primária (vinculada ao Auth do provedor) |
| name | text | Nome de exibição |
| email | text | Email do usuário |
| role | text | Permissão de sistema: 'user' ou 'admin' |

### campaigns
Armazena as mesas criadas, servindo como contêiner obrigatório para as fichas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Identificador único |
| name | text | Nome da crônica |
| narrator_id | fk | Relacionamento com users.id (Define quem é o Mestre desta mesa) |
| description | text | Resumo ou sinopse da história |

### characters
Armazena TODAS as entidades (Jogadores, NPCs e Coterie). Toda ficha pertence obrigatoriamente a uma campanha ativa.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Identificador único |
| campaign_id | fk | Relacionamento obrigatório com campaigns.id (NOT NULL) |
| user_id | fk | Relacionamento com users.id. Define o dono da ficha (NULL apenas para a Coterie). |
| name | text | Nome da entidade |
| type | text | 'jogador', 'npc' ou 'coterie' |
| sheet_data | jsonb | Objeto contendo Atributos, Habilidades, Disciplinas, Macros, Vitalidade, Fome, Itens de Coterie e Anotações Públicas. |