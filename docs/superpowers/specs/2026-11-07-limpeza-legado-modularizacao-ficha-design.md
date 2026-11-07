# Especificação Técnica de Design: Limpeza de Código Legado e Modularização da Ficha de Personagem

- **Data:** 07/11/2026
- **Status:** Aprovado em Brainstorming
- **Localização:** `docs/superpowers/specs/2026-11-07-limpeza-legado-modularizacao-ficha-design.md`

---

## 1. Contexto e Diagnóstico

Durante a evolução do ChronicleOS — especialmente após a introdução do sistema *Regras de Ouro 2.0* e do novo design system *Noir Carmesim* —, resíduos de código, arquivos temporários de processamento e duplicações foram deixados no repositório.

Além disso, a ficha de personagem principal (`src/components/sheet/CharacterSheetClient.tsx`) acumulou **3.647 linhas**, aglutinando regras legadas do V5 com o novo motor do Regras de Ouro e disparando múltiplos autosaves simultâneos.

### Diagnóstico Mapeado:
1. **Scripts temporários descartáveis:** Pasta `scripts/` (`copy_assets.sh`, `crop_veins.py`, `crop_veins_pillow.py`) com caminhos absolutos locais de sessões anteriores (`/home/moises/.../brain/...`).
2. **Assets estáticos órfãos:**
   - `public/images/tabela-vitalidade.jpg` (~283 KB) e `public/images/corpo-limpo.jpg` (~48 KB) não possuem nenhuma referência no código (o SVG anatômico usa exclusivamente `corpo-recortado.jpg`).
   - `docs/regras-de-ouro/bf2e61f5-c2ca-41e8-9497-fc2116791861.jpeg` (~33 KB) é uma imagem solta não referenciada na documentação.
3. **Componentes React mortos:**
   - `src/components/vtt/DiceVisualizer.tsx` (110 linhas) foi integralmente substituído por `RollLogItem.tsx` e não possui nenhum import no projeto.
4. **Duplicações e código morto em Server Actions / Componentes:**
   - `signOutAction` duplicado exatamente igual em `src/app/actions/auth.ts` (nunca importado) e `src/app/actions/hubActions.ts`.
   - Imports mortos (como `HumanityTracker` em `CharacterSheetClient.tsx`) e variáveis órfãs (`desc`, `isNull`, `sql`, `targetStatus` em `characterActions.ts`).
   - `src/lib/systems/regrasDeOuro/rules.test.ts` solto na pasta `src/` sem comando de teste configurado no `package.json`.
5. **Monólito `CharacterSheetClient.tsx`:**
   - 3.647 linhas mantendo simultaneamente os estados completos do V5 e de Regras de Ouro, renderização condicional pesada e autosaves duplicados.

---

## 2. Objetivos e Critérios de Sucesso

1. **Eliminar 100% dos resíduos e scripts temporários:**
   - Remover scripts com caminhos locais.
   - Liberar ~364 KB de imagens binárias inúteis.
   - Remover o componente React órfão `DiceVisualizer.tsx`.
2. **Unificar Server Actions e sanear o Linter:**
   - Centralizar `signOutAction` em `src/app/actions/auth.ts` e consumi-lo em `HubClient.tsx`.
   - Limpar imports e variáveis mortas que disparam alertas no ESLint.
   - Atribuir script de execução de teste no `package.json` para validar as regras do motor.
3. **Modularizar o `CharacterSheetClient.tsx`:**
   - Reduzir o orquestrador para ~300 linhas focadas em:
     - Avatar e modal de crop/vault;
     - Barra de abas (Ficha, Biografia, Inventário, Anotações, Diário de XP, Macros);
     - Renderização das abas compartilhadas (`InventoryManager`, `NotesSection`, `XpDiarySection`, `MacroSection`);
     - Roteamento polimórfico da aba "Ficha" para `<RegrasDeOuroSheetView />` ou `<V5SheetView />`.
   - Extrair a ficha do V5 para `src/components/sheet/V5SheetView.tsx`.
   - Isolar o autosave para persistir unicamente o sistema em uso pelo personagem ativo.
4. **Zero Regressão:**
   - `npm run build` deve compilar com status verde.
   - Fichas V5 e Regras de Ouro devem continuar carregando e salvando sem qualquer alteração no banco de dados.

---

## 3. Especificação Detalhada da Implementação

### 3.1 Faxina de Arquivos Órfãos e Scripts
- **Exclusão de Arquivos:**
  - `scripts/copy_assets.sh`
  - `scripts/crop_veins.py`
  - `scripts/crop_veins_pillow.py`
  - `public/images/tabela-vitalidade.jpg`
  - `public/images/corpo-limpo.jpg`
  - `docs/regras-de-ouro/bf2e61f5-c2ca-41e8-9497-fc2116791861.jpeg`
  - `src/components/vtt/DiceVisualizer.tsx`
- **Configuração de Teste:**
  - Adicionar script em `package.json`:
    `"test": "node --import tsx src/lib/systems/regrasDeOuro/rules.test.ts"` (ou runner compatível com node/tsx já existente).

### 3.2 Saneamento de Actions e Código Morto
- **`src/app/actions/auth.ts` & `src/app/actions/hubActions.ts`:**
  - Manter `signOutAction` em `src/app/actions/auth.ts`.
  - Remover a declaração duplicada de `signOutAction` em `src/app/actions/hubActions.ts` (ou reexportar `export { signOutAction } from "./auth"` para retrocompatibilidade segura).
  - Atualizar [`HubClient.tsx`](file:///media/moises/Acer/Etna/Projetos/ChronicleOS/src/components/hub/HubClient.tsx) para importar `signOutAction` de `@/app/actions/auth`.
- **`src/app/actions/characterActions.ts`:**
  - Remover `desc`, `isNull`, `sql` da importação de drizzle se não utilizados no arquivo.
  - Remover a variável não lida `targetStatus` ou utilizá-la conforme a lógica esperada.
- **`src/components/sheet/CharacterSheetClient.tsx`:**
  - Remover importação não utilizada de `HumanityTracker`.

### 3.3 Arquitetura de Ficha Modular

```
src/components/sheet/
├── CharacterSheetClient.tsx      (Shell Orquestrador Enxuto)
│   ├── Avatar & Crop & Vault
│   ├── Indicador de Salvamento (Autosave único ativo)
│   ├── Tab Bar (Ficha, Bio, Inventário, Notas, XP, Macros)
│   ├── Abas Compartilhadas (InventoryManager, NotesSection, etc.)
│   └── Aba Ficha:
│       ├── systemId === "regras_de_ouro" → <RegrasDeOuroSheetView />
│       └── systemId === "v5"             → <V5SheetView />
│
├── V5SheetView.tsx               (Componente Dedicado da Ficha V5)
│   ├── Atributos 3x3 (AttributeGroup)
│   ├── Habilidades e Perícias (SkillGroup)
│   ├── Disciplinas V5, Rituais e Poderes
│   ├── Vitalidade e Força de Vontade V5 (DamageTracker)
│   ├── Fome, Humanidade e Condições
│   └── Modo de Criação / Edição Inline V5
│
└── regrasDeOuro/
    └── RegrasDeOuroSheetView.tsx (Componente Dedicado do Regras de Ouro)
```

#### Contrato de Interfaces:
1. `<V5SheetView />`:
   - Recebe `character: CharacterSheetData`, `onUpdateCharacter: (updater: (prev: CharacterSheetData) => CharacterSheetData) => void`, `isNarrator: boolean`, `disabled: boolean`.
   - Encapsula toda a renderização do bloco V5 previamente localizado entre as linhas 1.979 e 3.647 de `CharacterSheetClient.tsx`.
2. `CharacterSheetClient`:
   - Inicializa apenas o estado correspondente ao `systemId`:
     - Se `regras_de_ouro`: gerencia `regrasDeOuroData` e autosave correspondente.
     - Se `v5`: gerencia `character` e autosave correspondente.
   - O `useAutosave` dispara para o estado ativo, eliminando sincronizações fantasmas em segundo plano.

---

## 4. Plano de Verificação e Testes

1. **Validação de Exclusões:**
   - Confirmar via git status que os arquivos órfãos foram excluídos sem deixar referências quebradas.
2. **Execução de Testes Unitários:**
   - Executar `npm test` para assegurar que as regras de negócio de `rules.test.ts` rodam e passam com sucesso.
3. **Verificação de Compilação:**
   - Executar `npm run build` e confirmar que todas as rotas estáticas e dinâmicas continuam compilando sem falhas de TypeScript ou bundling.
4. **Inspeção de Linter:**
   - Executar `npm run lint` e atestar a diminuição de warnings e a ausência de novos erros.
5. **Verificação Funcional:**
   - Garantir que um personagem de *Regras de Ouro* renderiza o layout Noir Carmesim, silhueta anatômica e salvamento automático.
   - Garantir que um personagem de *Vampiro V5* renderiza a ficha clássica com atributos, perícias e trackers funcionando.
