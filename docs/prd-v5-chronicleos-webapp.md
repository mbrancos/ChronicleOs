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
Armazena TODAS as entidades (Jogadores, NPCs e Coterie). Fichas de NPCs podem ser criadas diretamente no cofre (com `campaign_id` como `null`), permitindo a portabilidade entre crônicas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Identificador único |
| campaign_id | fk | Relacionamento opcional com campaigns.id (permite null para personagens no cofre) |
| user_id | fk | Relacionamento com users.id. Define o dono da ficha (NULL apenas para Coterie ou NPCs controlados pelo Narrador). |
| name | text | Nome da entidade |
| type | text | 'jogador', 'npc' ou 'coterie' |
| sheet_data | jsonb | Objeto contendo Atributos, Habilidades, Disciplinas, Macros, Vitalidade, Fome, Itens de Coterie e Anotações Públicas. |
| status | text | Estado de criação da ficha: 'DRAFT', 'READY', ou 'IN_PLAY' |
| build_state | jsonb | Memória de pontos iniciais de criação vs evolução pós-lançamento por XP |

### rolls
Histórico e registro de rolagens efetuadas na mesa, servindo também como log permanente de ações da crônica.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Chave primária |
| campaign_id | fk | Relacionamento com campaigns.id (NOT NULL) |
| character_id | fk | Relacionamento opcional com characters.id |
| character_name| text | Nome do personagem que efetuou a jogada |
| pool_name | text | Nome da pool de dados (ex: "Força + Atletismo" ou "Dano Aplicado") |
| result_data | jsonb | Resultados individuais de cada d10 rolado |
| hunger_dice | integer | Quantidade de dados de fome aplicados na rolagem |
| is_rerolled | boolean | Flag indicando se a jogada sofreu Rerrolagem de Força de Vontade |
| is_secret | boolean | Flag indicando se a rolagem foi feita de forma oculta pelo Narrador |

### scene_tokens
Tokens de personagens inseridos ativamente na cena do VTT para controle tático de cena e turnos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Chave primária |
| campaign_id | fk | Relacionamento com campaigns.id (NOT NULL) |
| character_id | fk | Relacionamento opcional com characters.id |
| name | text | Nome de exibição do token |
| type | text | 'player', 'full_npc' ou 'quick_npc' |
| x | integer | Coordenada X no grid VTT |
| y | integer | Coordenada Y no grid VTT |
| is_visible | boolean | Define se o token está visível para os jogadores (dentro do Palco) |
| has_acted | boolean | Controle de rodada/turnos de combate do token |
| quick_stats | jsonb | Atributos simplificados e status vitais para figurantes rápidos (quick_npc) |

### xp_ledgers
Livro-razão de transações de XP de cada personagem, auditando o avanço das fichas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Chave primária |
| character_id | fk | Relacionamento com characters.id (NOT NULL) |
| description | text | Descrição do gasto ou ganho de XP (ex: "Evolução: Força de 2 para 3") |
| xp_change | integer | Valor de variação de XP (positivo para ganhos, negativo para compras, 0 para Edição Divina) |
| metadata | jsonb | Metadados estruturados detalhando a evolução |

---

## Recursos Especiais da Mesa de Jogo (VTT)

1. **Sincronização em Tempo Real via Pusher**: Comunicação bidirecional sem polling, atualizando posições de tokens, imagens de cena, fundos, logs de danos e rolagens instantaneamente.
2. **Sistema de Presença**: Monitoramento online/offline de jogadores na mesa através de gemas de status integradas no painel do Narrador.
3. **Controle de Turnos e Fog of War**: Narrador arrasta tokens entre o "Palco da Cena" (visível aos jogadores) e os "Bastidores" (invisível aos jogadores), e controla a escala de cinza de tokens inativos que já agiram no turno.
4. **Ficha Única Anchor-Driven**: Layout moderno sem abas com rolagem vertical suave e barra de navegação sticky no topo da ficha.
5. **Edição Divina (Narrator Override)**: Chave-mestra no menu superior que permite ao Narrador contornar as regras oficiais e aplicar ajustes diretos na ficha dos jogadores (com log de 0 XP e sincronia em tempo real).