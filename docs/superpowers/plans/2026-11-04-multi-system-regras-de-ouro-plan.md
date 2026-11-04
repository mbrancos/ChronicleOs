# Plano de Implementação: ChronicleOS Multi-Sistema (V5 e Regras de Ouro 2.0)

> **Para executores agenticos:** SUB-HABILIDADE OBRIGATÓRIA: Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. As etapas utilizam a sintaxe de caixas de seleção (`- [ ]`) para rastreamento.

**Meta:** Implementar suporte multi-sistema no ChronicleOS, permitindo criar mesas e fichas tanto para *Vampiro: A Máscara 5ª Edição (V5)* quanto para *As Regras de Ouro 2.0 (E ainda chove)* sem quebras para campanhas existentes.

**Arquitetura:** Adição de coluna discriminadora `system_id: 'v5' | 'regras_de_ouro'` nas tabelas `campaigns` e `characters` com default `'v5'`. Criação de um motor de regras puras (`src/lib/systems/regrasDeOuro/`) e refatoração da casca de ficha (`CharacterSheetClient.tsx`) para renderizar componentes de visão especializados (`<V5SheetView />` e `<RegrasDeOuroSheetView />`).

**Stack Tecnológica:** Next.js 16 (App Router), React 19, TypeScript 5, Drizzle ORM, Neon Postgres, Pusher, TailwindCSS.

## Restrições Globais

- Idioma: Código, comentários e documentação em português do Brasil (pt-BR) onde aplicável; mensagens de commit obrigatoriamente em pt-BR.
- Compatibilidade V5: Nenhuma alteração pode quebrar personagens, rolagens ou campanhas V5 existentes.
- Tipagem: Modo estrito TypeScript (`tsc --noEmit`), proibido o uso de `any` em novas interfaces.
- TDD e Isolamento: Funções matemáticas e de transbordamento de dano devem possuir scripts de verificação com asserções rigorosas.

---

### Tarefa 1: Modelos de Tipos e Esquemas do Sistema

**Arquivos:**
- Criar: `src/types/systems/regrasDeOuro.ts`
- Modificar: `src/types/character.ts`

**Interfaces:**
- Produz: `RegrasDeOuroSheetData`, `RegrasDeOuroTalentos`, `PalavraChaveItem`, `AnatomicalVitality`, `GuiaDaBestaData`, `SystemId`.

- [ ] **Passo 1: Criar o arquivo de tipos de Regras de Ouro**

Criar `src/types/systems/regrasDeOuro.ts` com a estrutura completa:
```typescript
export type SystemId = "v5" | "regras_de_ouro";

export interface RegrasDeOuroTalentos {
  forca: number;
  vigor: number;
  agilidade: number;
  destreza: number;
  aparencia: number;
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
  talentoAssociado?: keyof RegrasDeOuroTalentos;
}

export interface RegrasDeOuroVirtudes {
  consciencia: number;
  autocontrole: number;
  coragem: number;
}

export type BodySectorId = 
  | "cabeca" | "pescoco" | "torax"
  | "braco_d" | "braco_e" | "mao_d" | "mao_e"
  | "perna_d" | "perna_e";

export interface SectorDamage {
  normal: number;
  letal: number;
  agravado: number;
  maxBoxes: number;
  penalty: number;
}

export type AnatomicalVitality = Record<BodySectorId, SectorDamage>;

export interface RegrasDeOuroDisciplinaAdquirida {
  id: string;
  nome: string;
  nivel: number;
}

export interface GuiaDaBestaData {
  angstia: number;
  libido: number;
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
  geracao: number;
  campoPessoal: number;
  trilha: {
    nome: string;
    nivel: number;
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

- [ ] **Passo 2: Integrar o tipo discriminado em `src/types/character.ts`**

Adicionar em `src/types/character.ts`:
```typescript
import { RegrasDeOuroSheetData, SystemId } from "./systems/regrasDeOuro";

export type { SystemId, RegrasDeOuroSheetData };
export type AnySheetData = CharacterProfile & { systemId?: "v5" } | RegrasDeOuroSheetData;
```

- [ ] **Passo 3: Verificar compilação TypeScript**

Executar: `npx tsc --noEmit`  
Esperado: PASS sem erros.

- [ ] **Passo 4: Commit**

```bash
git add src/types/systems/regrasDeOuro.ts src/types/character.ts
git commit -m "feat(types): definicao de interfaces para Regras de Ouro 2.0 e tipo AnySheetData"
```

---

### Tarefa 2: Catálogo de Dados e Constantes (`constants.ts`)

**Arquivos:**
- Criar: `src/lib/systems/regrasDeOuro/constants.ts`

**Interfaces:**
- Produz: `ARCHETYPES_TABLE`, `TALENTOS_LIST`, `CLANS_REGRAS_DE_OURO`, `DISCIPLINES_CATALOG`, `PANIC_TABLE`, `INITIAL_SECTORS_CONFIG`.

- [ ] **Passo 1: Implementar o arquivo `constants.ts` com todos os 40 arquétipos e dados do manual**

Cadastrar a tabela completa com as tuplas extraídas da documentação em `docs/regras-de-ouro/02-criacao-de-personagem.md` e os 14 clãs com suas disciplinas.

- [ ] **Passo 2: Verificar integridade de compilação**

Executar: `npx tsc --noEmit`  
Esperado: PASS sem erros.

- [ ] **Passo 3: Commit**

```bash
git add src/lib/systems/regrasDeOuro/constants.ts
git commit -m "feat(engine): catalogo completo de arquetipos, clas e disciplinas de Regras de Ouro 2.0"
```

---

### Tarefa 3: Motor de Regras e Fórmulas Matemáticas (`rules.ts`)

**Arquivos:**
- Criar: `src/lib/systems/regrasDeOuro/rules.ts`
- Criar: `src/lib/systems/regrasDeOuro/rules.test.ts` (ou script de validação)

**Interfaces:**
- Produz:
  - `calculateArchetypeBonuses(natureza, mascara)`
  - `calculateInitialTrilha(consciencia, autocontrole)`
  - `getKeywordModifier(grau)`
  - `applyAnatomicalDamage(vitality, sector, damageType, amount)`
  - `calculateXpCost(itemType, currentLevel, generation, isClan)`

- [ ] **Passo 1: Escrever testes unitários para as fórmulas matemáticas**

Testar:
1. `calculateArchetypeBonuses("Sobrevivente", "Solitário")` deve retornar `campoPessoal: 4` e `pontosVirtudes: 7`.
2. `calculateInitialTrilha(2, 3)` deve retornar `5`.
3. `getKeywordModifier("fraco")` deve retornar `-2`, `"otimo"` deve retornar `+2`.
4. Transbordamento de dano anatômico: 3 danos normais num setor com 2 caixas normais devem preencher as 2 caixas normais e 1 caixa letal.
5. Propagação de dano vital: Ferimento grave no tórax deve impor a pior penalidade ao corpo inteiro.

- [ ] **Passo 2: Implementar as funções em `src/lib/systems/regrasDeOuro/rules.ts`**

Codificar a lógica pura sem dependências externas.

- [ ] **Passo 3: Executar a validação dos cálculos**

Executar o script de teste e garantir 100% de asserções bem-sucedidas.

- [ ] **Passo 4: Commit**

```bash
git add src/lib/systems/regrasDeOuro/rules.ts src/lib/systems/regrasDeOuro/rules.test.ts
git commit -m "feat(engine): funcoes puras de calculos, virtudes, dano anatomico e XP para Regras de Ouro"
```

---

### Tarefa 4: Migração do Esquema de Banco de Dados

**Arquivos:**
- Modificar: `src/db/schema.ts`
- Gerar: migração Drizzle

**Interfaces:**
- Altera: tabelas `campaigns` e `characters` com `systemId`.

- [ ] **Passo 1: Adicionar colunas `systemId` em `src/db/schema.ts`**

```typescript
export const campaigns = pgTable("campaigns", {
  // ...
  systemId: text("system_id").$type<"v5" | "regras_de_ouro">().default("v5").notNull(),
});

export const characters = pgTable("characters", {
  // ...
  systemId: text("system_id").$type<"v5" | "regras_de_ouro">().default("v5").notNull(),
});
```

- [ ] **Passo 2: Gerar migração com drizzle-kit**

Executar: `npx drizzle-kit generate`  
Esperado: Arquivo SQL gerado adicionando as colunas com default `'v5'`.

- [ ] **Passo 3: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat(db): adicao da coluna discriminadora system_id com fallback seguro v5"
```

---

### Tarefa 5: Adaptação das Server Actions

**Arquivos:**
- Modificar: `src/app/actions/characterActions.ts`
- Modificar: `src/app/actions/rolls.ts`
- Modificar: `src/app/actions/damageActions.ts`
- Modificar: `src/app/actions/xpActions.ts`

**Interfaces:**
- Consome: `systemId`, `rules.ts`
- Produz: Criação inicial de ficha baseada em `systemId`, rolagens adaptativas, transbordamento de dano.

- [ ] **Passo 1: Adaptar `characterActions.ts` para instanciar esqueleto de ficha de acordo com o sistema**

Se `systemId === 'regras_de_ouro'`, inicializa `sheetData` com os 12 Talentos em 0, Vitalidade com os 9 setores e Guia da Besta.

- [ ] **Passo 2: Adaptar `rolls.ts` para processar rolagens de Regras de Ouro**

Suportar parâmetro de Dificuldade variável e modificadores de Palavra-Chave, salvando em `resultData` a contagem de sucessos e detecção de falha crítica em 1s.

- [ ] **Passo 3: Verificar compilação**

Executar: `npx tsc --noEmit`  
Esperado: PASS.

- [ ] **Passo 4: Commit**

```bash
git add src/app/actions/characterActions.ts src/app/actions/rolls.ts src/app/actions/damageActions.ts src/app/actions/xpActions.ts
git commit -m "feat(actions): suporte polimorfico a criacao de fichas, rolagens e dano por sistema"
```

---

### Tarefa 6: Interface do Hub (Criação de Mesas e Personagens)

**Arquivos:**
- Modificar: `src/components/hub/HubClient.tsx`
- Modificar: `src/app/cofre/personagens/page.tsx` (ou modal de criação de personagem)

**Interfaces:**
- Produz: Seletor visual de Sistema de Regras (V5 vs Regras de Ouro 2.0).

- [ ] **Passo 1: Inserir seletor de sistema no modal de nova campanha em `HubClient.tsx`**

Exibir botões/cards elegantes para seleção:
- "Vampiro: A Máscara (V5)"
- "E ainda chove (Regras de Ouro 2.0)"
Ao alternar, adaptar campos visuais do modal.

- [ ] **Passo 2: Inserir seletor de sistema na criação avulsa no Cofre de Personagens**

- [ ] **Passo 3: Commit**

```bash
git add src/components/hub/HubClient.tsx src/app/cofre/personagens/
git commit -m "feat(ui): seletor de sistema de regras no hub de campanhas e no cofre de personagens"
```

---

### Tarefa 7: Componentes Visuais da Ficha de Regras de Ouro

**Arquivos:**
- Criar: `src/components/sheet/regrasDeOuro/RegrasDeOuroSheetView.tsx`
- Criar: `src/components/sheet/regrasDeOuro/TalentosGrid.tsx`
- Criar: `src/components/sheet/regrasDeOuro/KeywordsSection.tsx`
- Criar: `src/components/sheet/regrasDeOuro/AnatomicalHealthTracker.tsx`
- Criar: `src/components/sheet/regrasDeOuro/BestaPanel.tsx`
- Criar: `src/components/sheet/regrasDeOuro/DisciplinesTree.tsx`

**Interfaces:**
- Consome: `RegrasDeOuroSheetData`, componentes atômicos `DotSlider.tsx`, `TrackerBoxes.tsx`.

- [ ] **Passo 1: Construir `TalentosGrid.tsx`**

Grid responsivo com os 3 Físicos em destaque e os 9 Mentais com `DotSlider`.

- [ ] **Passo 2: Construir `KeywordsSection.tsx`**

Lista interativa com badges de grau (Fraco a Extraordinário) e seletor rápido.

- [ ] **Passo 3: Construir `AnatomicalHealthTracker.tsx`**

Silhueta anatômica SVG/CSS dos 9 setores do corpo humano com caixas interativas para Normal, Letal e Agravado, exibindo penalidades ativas em tempo real.

- [ ] **Passo 4: Construir `BestaPanel.tsx`**

Painel com rastreadores de Ângstia, Líbido e lista de Flagelos.

- [ ] **Passo 5: Montar `RegrasDeOuroSheetView.tsx` unificando todos os blocos**

- [ ] **Passo 6: Verificar compilação**

Executar: `npx tsc --noEmit`  
Esperado: PASS.

- [ ] **Passo 7: Commit**

```bash
git add src/components/sheet/regrasDeOuro/
git commit -m "feat(ui): componentes visuais da ficha de Regras de Ouro com rastreador anatomico"
```

---

### Tarefa 8: Orquestrador da Ficha do Personagem

**Arquivos:**
- Modificar: `src/components/sheet/CharacterSheetClient.tsx`
- Criar: `src/components/sheet/v5/V5SheetView.tsx`

**Interfaces:**
- Desacopla: Transfere o miolo da ficha V5 para `V5SheetView.tsx`.
- Orquestra: `CharacterSheetClient.tsx` renderiza `<V5SheetView />` ou `<RegrasDeOuroSheetView />` com base em `character.systemId`.

- [ ] **Passo 1: Extrair a visão de ficha do V5 para `V5SheetView.tsx`**

- [ ] **Passo 2: Inserir a alternância polimórfica em `CharacterSheetClient.tsx`**

- [ ] **Passo 3: Testar compilação e ausência de regressão**

Executar: `npx tsc --noEmit`  
Esperado: PASS.

- [ ] **Passo 4: Commit**

```bash
git add src/components/sheet/CharacterSheetClient.tsx src/components/sheet/v5/V5SheetView.tsx
git commit -m "refactor(sheet): orquestrador polimorfico de ficha com visao isolada por sistema"
```

---

### Tarefa 9: Adaptação do VTT e Histórico de Rolagens

**Arquivos:**
- Modificar: `src/components/vtt/ActionFeed.tsx`
- Modificar: `src/components/vtt/RollLogItem.tsx`
- Modificar: `src/components/vtt/DiceVisualizer.tsx`

**Interfaces:**
- Produz: Renderização clara dos resultados de dados conforme o sistema da mesa (dados de fome para V5 vs dificuldade variável e falhas críticas em 1s para Regras de Ouro).

- [ ] **Passo 1: Adaptar `RollLogItem.tsx` para formatar `resultData` de Regras de Ouro**

- [ ] **Passo 2: Verificar compilação**

Executar: `npx tsc --noEmit`  
Esperado: PASS.

- [ ] **Passo 3: Commit**

```bash
git add src/components/vtt/ActionFeed.tsx src/components/vtt/RollLogItem.tsx src/components/vtt/DiceVisualizer.tsx
git commit -m "feat(vtt): suporte a exibicao de rolagens com dificuldade e palavras-chave de Regras de Ouro"
```

---

### Tarefa 10: Verificação Completa e Teste de Regressão

**Arquivos:**
- Todo o repositório

- [ ] **Passo 1: Rodar TypeScript check geral**

Executar: `npx tsc --noEmit`  
Esperado: Zero erros.

- [ ] **Passo 2: Rodar linting do Next.js**

Executar: `npm run lint`  
Esperado: Zero advertências críticas.

- [ ] **Passo 3: Teste de fumaça de build**

Executar: `npm run build`  
Esperado: Build bem-sucedido de todas as rotas estáticas e dinâmicas.

- [ ] **Passo 4: Commit de finalização**

```bash
git commit --allow-empty -m "chore: verificacao completa do suporte multi-sistema v5 e regras de ouro"
```
