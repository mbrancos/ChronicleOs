# Limpeza de Legado e Modularização da Ficha Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar scripts descartáveis, assets órfãos, código morto e modularizar o monólito `CharacterSheetClient.tsx` (3.647 linhas) separando a visualização V5 em `V5SheetView.tsx` e mantendo um Shell Orquestrador enxuto (~300 linhas).

**Architecture:** Abordagem multi-sistema com Shell Orquestrador polimórfico (`CharacterSheetClient.tsx`) que gerencia o cabeçalho compartilhado (avatar, autosave ativo, abas globais) e delega a renderização da aba "Ficha" para `<RegrasDeOuroSheetView />` ou `<V5SheetView />`.

**Tech Stack:** Next.js 16 (App Router Turbopack), React 19, TypeScript 5, Tailwind CSS 4, Drizzle ORM, PostgreSQL JSONB.

## Global Constraints

- Respostas, documentação e commits estritamente em português do Brasil (`pt-BR`).
- Zero quebra de compatibilidade para personagens existentes (V5 ou Regras de Ouro).
- Preservação da estrutura do banco de dados (`sheetData` JSONB).
- `npm run build` deve compilar com 0 erros.
- `npm test` deve executar os testes unitários de regras e passar 100%.

---

### Task 1: Exclusão de Scripts Temporários, Assets Órfãos e Componente Morto

**Files:**
- Delete: `scripts/copy_assets.sh`
- Delete: `scripts/crop_veins.py`
- Delete: `scripts/crop_veins_pillow.py`
- Delete: `public/images/tabela-vitalidade.jpg`
- Delete: `public/images/corpo-limpo.jpg`
- Delete: `docs/regras-de-ouro/bf2e61f5-c2ca-41e8-9497-fc2116791861.jpeg`
- Delete: `src/components/vtt/DiceVisualizer.tsx`

**Interfaces:**
- Consumes: Nenhuma interface externa ativa.
- Produces: Base de código limpa de artefatos temporários e assets não utilizados.

- [ ] **Step 1: Remover arquivos de scripts e diretório scripts se vazio**

Execute a remoção dos scripts descartáveis com paths locais obsoletos:
```bash
rm -f scripts/copy_assets.sh scripts/crop_veins.py scripts/crop_veins_pillow.py
rmdir scripts 2>/dev/null || true
```

- [ ] **Step 2: Remover imagens estáticas não referenciadas**

Execute a remoção dos arquivos de imagem órfãos:
```bash
rm -f public/images/tabela-vitalidade.jpg public/images/corpo-limpo.jpg docs/regras-de-ouro/bf2e61f5-c2ca-41e8-9497-fc2116791861.jpeg
```

- [ ] **Step 3: Remover o componente DiceVisualizer.tsx**

Remover o componente morto não importado:
```bash
rm -f src/components/vtt/DiceVisualizer.tsx
```

- [ ] **Step 4: Verificar se a compilação do TypeScript continua íntegra**

Execute o check do TypeScript para confirmar ausência de referências órfãs:
```bash
npx tsc --noEmit
```
Expected: Compilação concluída sem erros sobre os arquivos deletados.

- [ ] **Step 5: Commit das exclusões**

```bash
git add -u
git commit -m "chore(cleanup): remove scripts descartaveis, assets orfaos e componente morto DiceVisualizer"
```

---

### Task 2: Saneamento de Server Actions, Atualização do Teste Unitário e Script de Teste

**Files:**
- Modify: `src/app/actions/auth.ts`
- Modify: `src/app/actions/hubActions.ts`
- Modify: `src/components/hub/HubClient.tsx`
- Modify: `src/app/actions/characterActions.ts`
- Modify: `src/lib/systems/regrasDeOuro/rules.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `@neondatabase/auth`, Next.js `redirect`, `headers`.
- Produces: Ação canônica `signOutAction` em `auth.ts`, linter limpo de variáveis não utilizadas em `characterActions.ts`, script `npm test`.

- [ ] **Step 1: Consolidar signOutAction em `src/app/actions/auth.ts` e exportar re-export em `hubActions.ts`**

Em `src/app/actions/hubActions.ts`, substituir a declaração duplicada de `signOutAction` por:
```typescript
export { signOutAction } from "./auth";
```
Em `src/components/hub/HubClient.tsx`, certificar que a importação de `signOutAction` seja de `@/app/actions/auth` ou `@/app/actions/hubActions` de forma consistente.

- [ ] **Step 2: Limpar variáveis não utilizadas em `src/app/actions/characterActions.ts`**

Remover `desc`, `isNull`, `sql` não utilizados da importação de `drizzle-orm` e remover ou utilizar a variável `targetStatus`.

- [ ] **Step 3: Atualizar asserções de `rules.test.ts` para os valores canônicos da tabela de vitalidade**

Em `src/lib/systems/regrasDeOuro/rules.test.ts`:
Ajustar o teste de dano e transbordamento para refletir `maxNormal: 5` da cabeça (aplicar 6 de dano normal para transbordar 1 para letal):
```typescript
// Cabeça tem maxNormal: 5, maxLetal: 4, maxAgravado: 3
// Aplicando 6 pontos de dano normal na cabeça: deve encher 5 normais e 1 transbordar para letal!
const afterNormal = applyAnatomicalDamage(vit, "cabeca", "normal", 6);
assert(afterNormal.cabeca.normal === 5, `Normal na cabeça esperado 5, obteve ${afterNormal.cabeca.normal}`);
assert(afterNormal.cabeca.letal === 1, `Letal transbordado esperado 1, obteve ${afterNormal.cabeca.letal}`);
assert(afterNormal.cabeca.penalty === -2, `Penalidade na cabeça esperada -2, obteve ${afterNormal.cabeca.penalty}`);
```

- [ ] **Step 4: Adicionar o script `"test"` no `package.json`**

Em `package.json`, em `"scripts"`, adicionar:
```json
"test": "npx tsx src/lib/systems/regrasDeOuro/rules.test.ts"
```

- [ ] **Step 5: Executar os testes unitários**

Executar:
```bash
npm test
```
Expected: PASS com "Iniciando testes unitários do motor de regras..." e término sem erros.

- [ ] **Step 6: Commit do saneamento de actions e testes**

```bash
git add src/app/actions/ src/components/hub/HubClient.tsx src/lib/systems/regrasDeOuro/rules.test.ts package.json
git commit -m "refactor(actions): unifica autenticacao, limpa codigo morto e adiciona runner de teste"
```

---

### Task 3: Criação de `V5SheetView.tsx` e Modularização do Monólito `CharacterSheetClient.tsx`

**Files:**
- Create: `src/components/sheet/V5SheetView.tsx`
- Modify: `src/components/sheet/CharacterSheetClient.tsx`

**Interfaces:**
- `V5SheetViewProps`:
  ```typescript
  interface V5SheetViewProps {
    character: CharacterSheetData;
    onUpdateCharacter: React.Dispatch<React.SetStateAction<CharacterSheetData>>;
    isStoryteller: boolean;
    disabled: boolean;
    isEvolvingMode: boolean;
    onToggleEvolvingMode: () => void;
    chronicle: { id: string; name: string } | null;
    campaignId?: string | null;
    onRollDice?: (diceCount: number, hungerCount: number, poolName: string) => void;
  }
  ```
- `CharacterSheetClient`:
  - Shell orquestrador contendo avatar, modais de upload/crop/vault, barra de abas, indicador de autosave e renderização condicional da aba "Ficha" delegada a `RegrasDeOuroSheetView` ou `V5SheetView`.

- [ ] **Step 1: Criar o componente modular `src/components/sheet/V5SheetView.tsx`**

Extrair do `CharacterSheetClient.tsx` o bloco de renderização da ficha V5 (atributos 3x3, perícias, disciplinas, vitalidade V5, força de vontade, especializações, criação progressiva HUD, ressonâncias e modos de evolução).

- [ ] **Step 2: Refatorar `src/components/sheet/CharacterSheetClient.tsx`**

1. Remover o JSX monolítico de 1.700 linhas do V5 e substituí-lo por:
```tsx
{isRegrasDeOuro ? (
  <RegrasDeOuroSheetView
    sheetData={regrasDeOuroData}
    onUpdateSheet={setRegrasDeOuroData}
    characterName={initialName || "Novo Vampiro"}
    isNarrator={isStoryteller}
    disabled={status === "IN_PLAY" && !isStoryteller}
    onRollDice={handleRegrasDeOuroRoll}
  />
) : (
  <V5SheetView
    character={character}
    onUpdateCharacter={setCharacter}
    isStoryteller={isStoryteller}
    disabled={status === "IN_PLAY" && !isStoryteller}
    isEvolvingMode={isEvolvingMode}
    onToggleEvolvingMode={() => setIsEvolvingMode(!isEvolvingMode)}
    chronicle={chronicle}
    campaignId={campaignId}
    onRollDice={handleV5Roll}
  />
)}
```
2. Isolar os autosaves para que apenas o sistema ativo acione a sincronização com o banco.
3. Remover a importação não utilizada de `HumanityTracker`.
4. Garantir que as abas compartilhadas (`Biografia`, `Inventário`, `Anotações`, `Diário de XP`, `Macros`) continuem funcionando normalmente para ambos os sistemas.

- [ ] **Step 3: Testar compilação do Next.js**

Executar:
```bash
npm run build
```
Expected: Compilação concluída com sucesso com todas as rotas estáticas e dinâmicas geradas.

- [ ] **Step 4: Commit da modularização da ficha**

```bash
git add src/components/sheet/V5SheetView.tsx src/components/sheet/CharacterSheetClient.tsx
git commit -m "refactor(sheet): modulariza CharacterSheetClient extraindo V5SheetView e orquestrador enxuto"
```

---

### Task 4: Verificação Completa e Limpeza Final

**Files:**
- All modified files

**Interfaces:**
- Consumes: Scripts npm (`test`, `build`, `lint`).
- Produces: Confirmação de integridade e estabilidade da aplicação.

- [ ] **Step 1: Executar suite de testes unitários**

```bash
npm test
```
Expected: PASS com 0 erros.

- [ ] **Step 2: Executar build de produção do Next.js**

```bash
npm run build
```
Expected: `✓ Compiled successfully` e `✓ Finished TypeScript`.

- [ ] **Step 3: Verificar status do Git**

Executar:
```bash
git status
```
Expected: Working tree clean, sem arquivos soltos nem untracked inesperados.

- [ ] **Step 4: Commit de finalização (se houver ajustes adicionais)**

```bash
git commit --allow-empty -m "chore: verificacao final da limpeza e modularizacao da ficha concluida com sucesso"
```
