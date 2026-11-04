# Especificação Técnica de Arquitetura: ChronicleOS Multi-Sistema
## Suporte Nativo a "Vampiro: A Máscara V5" e "As Regras de Ouro 2.0 (E ainda chove)"

**Data:** 04/11/2026  
**Status:** Em Revisão (Brainstorming Concluído)  
**Localização:** `docs/superpowers/specs/2026-11-04-multi-system-regras-de-ouro-design.md`

---

## 1. Visão Geral e Objetivos

O **ChronicleOS** foi originalmente concebido como uma aplicação web moderna voltada a *Vampiro: A Máscara 5ª Edição (V5)*. Este documento especifica a evolução arquitetural do ChronicleOS para uma plataforma **multi-sistema**, permitindo que narradores e jogadores criem, gerenciem e joguem mesas tanto em **Vampiro V5** quanto na customização brasileira **As Regras de Ouro 2.0** (*E ainda chove*).

### Objetivos Centrais:
1. **Preservação Total do V5:** Zero quebras, regressões ou degradações nas campanhas e personagens V5 existentes.
2. **Suporte Completo ao Regras de Ouro 2.0:** Suporte nativo a 12 Talentos, Palavras-Chave graduadas (-2 a +4), Tabela de 40 Arquétipos, Campo Pessoal, 9 setores de Vitalidade Anatômica, Vitæ numérico, Guia da Besta e árvore de Disciplinas com auto-evolução de sub-níveis.
3. **Casca Comum Modular:** A arquitetura reaproveita 100% da infraestrutura de autenticação, banco de dados, salas em tempo real, VTT (*DirectorBoard*, tokens, palco), inventário genérico, bloco de notas e galeria de mídia (*AssetVault*), delegando a inteligência de regras e a renderização da ficha para componentes especializados por sistema.

---

## 2. Mapa de Acoplamento do Código Atual e Diagnóstico

### 2.1 Banco de Dados (`src/db/schema.ts`)
- **Tabela `campaigns`:**
  - Possui colunas fortemente amarradas ao V5: `powerLevel` (FLEDGLING, NEONATE, ANCILLAE), `tenets` (Princípios da Crônica), `systemRules` (`ChronicleSystemRules` com regras de fome e predador).
  - *Extensão:* Adicionar coluna `systemId: text("system_id").$type<"v5" | "regras_de_ouro">().default("v5").notNull()`.
- **Tabela `characters`:**
  - Possui `sheetData: jsonb("sheet_data").notNull()`. O PostgreSQL JSONB é perfeitamente polimórfico, suportando qualquer estrutura de dados.
  - *Extensão:* Adicionar coluna `systemId: text("system_id").$type<"v5" | "regras_de_ouro">().default("v5").notNull()`.
- **Tabela `rolls`:**
  - Possui `hungerDice: integer("hunger_dice")`. Em *Regras de Ouro*, não há dados de fome, mas há Dificuldade variável e modificadores de Palavra-Chave. A coluna `resultData: jsonb` suportará tanto `V5RollResult` quanto `RegrasDeOuroRollResult`.

### 2.2 Tipagem (`src/types/`)
- Hoje, `src/types/character.ts` modela exclusivamente o V5 (`CharacterAttributes` 3x3, 27 `CharacterSkills`, `CharacterStatus` com fome/máculas/potência de sangue).
- *Novo Modelo de Tipos:*
  - `src/types/character.ts`: Mantém tipos genéricos compartilhados (`CharacterProfile`, `Tracker`, `Experience`, `InventoryItem`, `CharacterNote`).
  - `src/types/systems/v5.ts`: Extrai a tipagem específica do V5 (`V5SheetData`, atributos, perícias, predadores).
  - `src/types/systems/regrasDeOuro.ts`: Define a tipagem de *Regras de Ouro 2.0* (`RegrasDeOuroSheetData`, 12 Talentos, Palavras-Chave, Virtudes, Campo Pessoal, Vitalidade Anatômica 9 setores, Besta).

### 2.3 Componente da Ficha (`src/components/sheet/CharacterSheetClient.tsx`)
- Atualmente é um arquivo monolítico de ~3.474 linhas, acoplando layout, lógica de edição inline, abas e cálculo de regras V5.
- **Decisão Arquitetural:** Em vez de poluir esse arquivo com centenas de condicionais `if (system === 'regras_de_ouro')`, ele será refatorado para atuar como **Orquestrador de Ficha**:
  - **Camada Compartilhada:** Avatar com recorte WebP, Nome do Personagem, Barra de Navegação por Abas (Ficha, Biografia, Inventário, Anotações, Diário de XP, Macros).
  - **Aba Ficha Polimórfica:**
    - Se `systemId === 'v5'`: Renderiza `<V5SheetView />`.
    - Se `systemId === 'regras_de_ouro'`: Renderiza `<RegrasDeOuroSheetView />`.
  - As abas de *Inventário*, *Anotações* e *Diário de XP* operam de forma transparente e compartilhada.

---

## 3. Modelo de Dados de "As Regras de Ouro 2.0"

### 3.1 Esquema TypeScript (`src/types/systems/regrasDeOuro.ts`)

```typescript
export type SystemId = "v5" | "regras_de_ouro";

export interface RegrasDeOuroTalentos {
  // 3 Físicos (0 a 5)
  forca: number;
  vigor: number;
  agilidade: number;
  // 9 Mentais (0 a 5)
  destreza: number;
  aparencia: number; // Pode ser negativo para Nosferatu
  social: number;
  emocional: number;
  espacial: number;
  logica: number;
  linguistica: number;
  musical: number;
  naturalista: number;
}

export type PalavraChaveGrau = "fraco" | "medio" | "bom" | "otimo" | "excepcional" | "extraordinario";

export interface PalavraChaveItem {
  id: string;
  nome: string;
  grau: PalavraChaveGrau;
  talentoAssociado?: keyof RegrasDeOuroTalentos; // Para grau excepcional/extraordinário
}

export interface RegrasDeOuroVirtudes {
  consciencia: number; // 1 a 5
  autocontrole: number; // 1 a 5
  coragem: number;     // 1 a 5
}

export type BodySectorId = 
  | "cabeca" | "pescoco" | "torax"
  | "braco_d" | "braco_e" | "mao_d" | "mao_e"
  | "perna_d" | "perna_e";

export interface SectorDamage {
  normal: number;    // Caixas preenchidas de dano contusivo
  letal: number;     // Caixas preenchidas de dano letal
  agravado: number;  // Caixas preenchidas de dano agravado
  maxBoxes: number;  // Capacidade total de caixas do setor
  penalty: number;   // Penalidade atual (-1, -2, -3, ou incapacitado)
}

export type AnatomicalVitality = Record<BodySectorId, SectorDamage>;

export interface RegrasDeOuroDisciplinaAdquirida {
  id: string;
  nome: string; // Ex: "Celeridade"
  nivel: number; // 1 a 5
  // Os sub-níveis N.x são calculados dinamicamente baseados no nível total
}

export interface GuiaDaBestaData {
  angstia: number; // 1 a 10
  libido: number;  // 1 a 10
  paixoesObscuras: Array<{ id: string; nome: string; nivel: number }>;
  flagelos: Array<{ id: string; nome: string; nivel: number; custo: number }>;
  xpBesta: { total: number; gasto: number };
}

export interface RegrasDeOuroSheetData {
  systemId: "regras_de_ouro";
  etaria: "neonato" | "neofito" | "ancilla";
  natureza: string;
  mascara: string;
  cla: string;
  geracao: number; // 13 a 4
  campoPessoal: number; // 1 a 10 (derivado de Natureza + Máscara)
  trilha: {
    nome: string; // Ex: "Via Humanitatis"
    nivel: number; // 1 a 10 (Consciência + Autocontrole)
  };
  virtudes: RegrasDeOuroVirtudes;
  talentos: RegrasDeOuroTalentos;
  palavrasChave: PalavraChaveItem[];
  disciplinas: RegrasDeOuroDisciplinaAdquirida[];
  vitalidade: AnatomicalVitality;
  vitae: {
    atual: number;
    maximo: number;
    gastoPorTurno: number;
  };
  paixoes: Array<{ id: string; nome: string; nivel: number }>;
  vantagens: Array<{ id: string; nome: string; categoria: string; custo: number }>;
  desvantagens: Array<{ id: string; nome: string; categoria: string; pontos: number }>;
  peculiaridades: string[];
  besta: GuiaDaBestaData;
}
```

---

## 4. Motor de Fórmulas e Regras Computáveis (`src/lib/systems/regrasDeOuro/`)

As regras extraídas dos módulos em `docs/regras-de-ouro/` são encapsuladas em funções puras e testáveis:

1. **`calculateArchetypeBonuses(natureza: string, mascara: string)`:**
   - Consulta a tabela oficial de 40 arquétipos.
   - Retorna:
     - $\text{campoPessoal} = \text{campoPessoal}(\text{natureza}) + \text{campoPessoal}(\text{mascara})$
     - $\text{pontosVirtudes} = \text{virtudes}(\text{natureza}) + \text{virtudes}(\text{mascara})$

2. **`calculateInitialTrilha(consciencia: number, autocontrole: number)`:**
   - Retorna $\text{consciencia} + \text{autocontrole}$.

3. **`getKeywordModifier(grau: PalavraChaveGrau): number`:**
   - Mapeia: `fraco: -2`, `medio: 0`, `bom: +1`, `otimo: +2`, `excepcional: +3`, `extraordinario: +4`.

4. **`calculateVitalityDamage(sector: BodySectorId, damageType: 'normal' | 'letal' | 'agravado', amount: number, current: AnatomicalVitality)`:**
   - Aplica dano com transbordamento automático: $\text{Normal} \to \text{Letal} \to \text{Agravado}$.
   - Calcula penalidades específicas e propaga penalidades de setores vitais (Cabeça, Pescoço, Tórax) para todo o corpo.

5. **`calculateXpCost(item: XpBuyableItem, currentLevel: number, character: RegrasDeOuroSheetData): number`:**
   - Implementa a tabela matemática da página 108 (ex: Disciplina de clã como 2 gerações mais antiga).

---

## 5. Fluxo de Criação de Mesa e Personagem no Frontend

### 5.1 No Hub de Campanhas (`src/components/hub/HubClient.tsx`)
- Ao abrir o modal "Criar Nova Mesa / Crônica":
  - O narrador encontra um seletor destacado de **Sistema de Regras**:
    - `[V5] Vampiro: A Máscara (5ª Edição)`
    - `[Regras de Ouro] E ainda chove (As Regras de Ouro 2.0)`
  - Se selecionar **Regras de Ouro**:
    - O formulário oculta campos específicos do V5 (Princípios da Crônica, Tipos de Predador) e exibe configurações adequadas (Etária padrão permitida: Neonato / Neófito / Ancillae).
    - A campanha é salva no banco com `system_id: "regras_de_ouro"`.

### 5.2 No Cofre de Personagens e Entrada em Mesa
- **Cofre:** Ao clicar em "Criar Personagem", o jogador escolhe o sistema. O esqueleto inicial do JSONB é preenchido com a estrutura correta (`V5SheetData` ou `RegrasDeOuroSheetData`).
- **Entrada em Campanha:** Ao vincular ou importar uma ficha para uma mesa, o sistema valida a compatibilidade de `systemId` (uma ficha V5 não pode entrar numa mesa de Regras de Ouro e vice-versa).

---

## 6. O Motor de Rolagem e VTT

### 6.1 Motor de Rolagens (`src/app/actions/rolls.ts`)
- **Rolagem V5:** Rola $N$ d10 normais + $H$ dados de fome contra Dificuldade fixa 6. Calcula sucessos, críticos (pares de 10), falha bestial (1 no dado de fome) e crítico bagunçado (10 no dado de fome).
- **Rolagem Regras de Ouro 2.0:**
  - Monta parada: $(\text{Talento}_1 + \text{Talento}_2) + \text{Modificador de Palavra-Chave}$.
  - Rola contra uma Dificuldade estipulada pelo narrador (ou defesa passiva $\text{Espacial} + \text{Agilidade}$).
  - Conta sucessos $\ge \text{Dificuldade}$.
  - Detecta Falha Crítica se houver zero sucessos e presença de faces "1".
- **Feed e Histórico do VTT (`src/components/vtt/ActionFeed.tsx` e `RollLogItem.tsx`):**
  - Renderiza visualmente o card de rolagem indicando o sistema utilizado e destacando o resultado de sucessos e falhas críticas.

---

## 7. Inventário de Componentes e Estratégia de Implementação

### 7.1 Reaproveitamento 100% (Sem alterações estruturais)
- `src/components/media/AssetVaultModal.tsx` & `ImageCropModal.tsx` (Mídias, avatares, tokens).
- `src/components/sheet/DotSlider.tsx` (Bolinhas 0 a 5 para talentos, virtudes, disciplinas).
- `src/components/sheet/InlineEdit.tsx` (Edição inline de campos de texto).
- `src/components/sheet/InventoryManager.tsx` (Inventário de itens, peso e quantidade).
- `src/components/sheet/NotesSection.tsx` (Bloco de anotações do jogador).
- `src/components/vtt/DirectorBoard.tsx` (Tabuleiro do palco virtual, tokens e camadas).
- `src/context/ToastContext.tsx` (Alertas e notificações).

### 7.2 Novos Componentes Especializados
- `src/components/sheet/regrasDeOuro/RegrasDeOuroSheetView.tsx`: Tela da ficha de Regras de Ouro.
- `src/components/sheet/regrasDeOuro/TalentosGrid.tsx`: Exibição visual dos 3 Talentos Físicos e 9 Mentais.
- `src/components/sheet/regrasDeOuro/KeywordsSection.tsx`: Gerenciador de Palavras-Chave com badges coloridas por grau.
- `src/components/sheet/regrasDeOuro/AnatomicalHealthTracker.tsx`: Silhueta interativa dos 9 setores do corpo com marcação de Normal, Letal e Agravado.
- `src/components/sheet/regrasDeOuro/BestaPanel.tsx`: Painel do Guia da Besta com Ângstia, Líbido e Flagelos.
- `src/components/sheet/regrasDeOuro/DisciplinesTree.tsx`: Exibição da disciplina com os sub-níveis N.x ativos destacados.

---

## 8. Segurança, Compatibilidade e Plano de Migração

1. **Migração do Banco de Dados Drizzle:**
   - `ALTER TABLE campaigns ADD COLUMN system_id text DEFAULT 'v5' NOT NULL;`
   - `ALTER TABLE characters ADD COLUMN system_id text DEFAULT 'v5' NOT NULL;`
   - Todos os dados existentes no banco continuam intactos e funcionando imediatamente como V5.
2. **Validações Server-Side:**
   - Server Actions checam o `systemId` da campanha e do personagem antes de invocar as rotinas de dano, XP ou rolagem.
