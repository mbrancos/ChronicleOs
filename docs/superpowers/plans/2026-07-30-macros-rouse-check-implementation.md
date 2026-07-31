# 📐 Plano de Implementação: Gestão de Macros & Teste de Despertar (V5) na Ficha

> **Para executores agentivos:** SUB-SKILL REQUERIDA: Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. As etapas usam a sintaxe de checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Implementar o botão dedicado do Teste de Despertar (Rouse Check 1d10), a geração automática de Presets Recomendados V5 e o Gerenciador de Macros Customizadas (criação e exclusão) na Seção 8 da Ficha do Personagem (`CharacterSheetClient.tsx`).

**Arquitetura:** A Seção 8 será atualizada com componentes inline de UI responsivos e góticos. Reutilizaremos a engine de rolagem `rollRouseCheck` de `@/lib/vtt/BloodEngine.ts` para garantir consistência entre a Ficha e a Mesa VTT. As alterações de Fome e Macros serão mantidas no estado do personagem e salvas via debounced autosave (`useAutosave`).

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS, `@/lib/vtt/BloodEngine`.

---

## 🎯 Atividades e Modificações Propostas

### Seção 8 da Ficha (`CharacterSheetClient.tsx`)

#### [MODIFY] [CharacterSheetClient.tsx](file:///d:/Etna/Projetos/ChronicleOS/src/components/sheet/CharacterSheetClient.tsx#L3130-L3220)

- Adicionar o botão destacado `🩸 Teste de Despertar (Rouse Check)` no topo da Seção 8.
- Criar a função `handleRouseCheckSolo` invocando `rollRouseCheck()` de `@/lib/vtt/BloodEngine`.
- Atualizar a Fome do personagem (`status.hunger + 1` até o máx de 5 em caso de falha no dado 1-5).
- Exibir os alertas/notificações de resultado e alimentar o Simulador Lateral.
- Adicionar a barra de ações com o botão `⚡ Gerar Presets Recomendados V5`.
- Adicionar a função `handleGeneratePresets` que injeta as 5 macros padrão (Ataque Corpo a Corpo, Tiro, Esquiva, Percepção e Furtividade).
- Adicionar o estado e formulário de `+ Criar Nova Macro` (Atributo + Habilidade/Disciplina + Rouse Check).
- Adicionar o botão de exclusão `✕` no card de cada macro e ligar à função `handleDeleteMacro`.

---

## 📋 Tarefas Detalhadas de Implementação

### Tarefa 1: Botão Dedicado de Rouse Check na Seção 8
**Arquivos:**
- Modificar: `d:\Etna\Projetos\ChronicleOS\src\components\sheet\CharacterSheetClient.tsx` (linhas ~3130-3180)

**Interfaces:**
- Consumes: `rollRouseCheck()` de `@/lib/vtt/BloodEngine`
- Produces: `handleRouseCheckSolo()` que altera `character.status.hunger` e gera `rollResult` no Simulador.

- [ ] **Passo 1: Importar `rollRouseCheck` em `CharacterSheetClient.tsx`**
- [ ] **Passo 2: Implementar a função `handleRouseCheckSolo`**
- [ ] **Passo 3: Renderizar o Botão `🩸 Teste de Despertar (Rouse Check 1d10)` no topo da Seção 8**
- [ ] **Passo 4: Validar TypeScript via `npx tsc --noEmit`**

---

### Tarefa 2: Botão de Presets Recomendados V5
**Arquivos:**
- Modificar: `d:\Etna\Projetos\ChronicleOS\src\components\sheet\CharacterSheetClient.tsx`

**Interfaces:**
- Consumes: `DEFAULT_CHARACTER_DATA.macros` ou constante `V5_RECOMMENDED_MACROS`
- Produces: `handleGeneratePresets()` que atualiza `character.macros`.

- [ ] **Passo 1: Definir a lista `V5_RECOMMENDED_MACROS` com os 5 presets V5**
- [ ] **Passo 2: Implementar `handleGeneratePresets` evitando duplicatas por pool/nome**
- [ ] **Passo 3: Renderizar o botão `⚡ Gerar Presets Recomendados V5` no cabeçalho das macros**
- [ ] **Passo 4: Validar TypeScript via `npx tsc --noEmit`**

---

### Tarefa 3: Criador e Exclusão de Macros Customizadas
**Arquivos:**
- Modificar: `d:\Etna\Projetos\ChronicleOS\src\components\sheet\CharacterSheetClient.tsx`

**Interfaces:**
- Consumes: `character.attributes`, `character.skills`, `character.disciplines`
- Produces: `handleSaveMacro`, `handleDeleteMacro`, formulário inline.

- [ ] **Passo 1: Criar os estados de controle do formulário (`isCreatingMacro`, `newMacroName`, `selectedAttr`, `selectedSkillOrDisc`, `rouseCheckToggle`)**
- [ ] **Passo 2: Construir o formulário inline estilizado com dropdowns góticos**
- [ ] **Passo 3: Implementar `handleSaveMacro` e `handleDeleteMacro`**
- [ ] **Passo 4: Adicionar o botão `✕` (Excluir) em cada card de macro na grade**
- [ ] **Passo 5: Validar TypeScript via `npx tsc --noEmit`**

---

## 🧪 Plano de Verificação

### Testes Automatizados e Estáticos
- Executar `npx tsc --noEmit` no terminal para garantir 0 erros de compilação TypeScript.

### Verificação Manual na Ficha Solo
1. Acessar uma ficha no navegador.
2. Ir até a **Seção 8 (Macros)**.
3. Clicar no botão `🩸 Teste de Despertar (Rouse Check)` e conferir se o 1d10 rola no simulador e se a Fome aumenta quando o resultado é <= 5.
4. Clicar em `⚡ Gerar Presets Recomendados V5` e conferir se as 5 macros são inseridas na grade.
5. Clicar em `+ Criar Nova Macro`, preencher Nome, Atributo, Habilidade/Disciplina e salvar.
6. Clicar no botão `✕` para excluir uma macro e confirmar sua remoção.
