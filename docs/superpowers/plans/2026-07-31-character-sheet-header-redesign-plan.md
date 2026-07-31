# 📐 Plano de Implementação: Redesign do Cabeçalho da Ficha do Personagem (`#sec-profile`)

> **Para executores agentivos:** SUB-SKILL REQUERIDA: Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. As etapas usam a sintaxe de checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Refatorar a disposição e hierarquia visual do cabeçalho fixo da ficha (`#sec-profile` em `CharacterSheetClient.tsx`), melhorando proporções, alinhamentos e estética sem alterar nenhuma funcionalidade existente nem remover/adicionar elementos.

**Arquitetura:** Reorganizar o container `#sec-profile` em um Cartão de Identidade Gótico (lado esquerdo) e um HUD Vitais Tático Simétrico (lado direito). Os metadados passarão a usar pílulas compactas de dados, e os trackers de saúde, força de vontade, fome e ressonância serão contidos em caixas modulares com a mesma linguagem visual.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS.

---

## 🎯 Atividades e Modificações Propostas

### 1. Coluna de Identidade do Vampiro (Esquerda)
#### [MODIFY] [CharacterSheetClient.tsx](file:///d:/Etna/Projetos/ChronicleOS/src/components/sheet/CharacterSheetClient.tsx)
- Ampliar moldura do Avatar para `100x100px` (`w-24 h-24 sm:w-28 sm:h-28`) com anel duplo iluminado em dourado e carmesim.
- Reorganizar a grade de metadados (`Clã`, `Idade`, `Geração`, `Predador`, `Senhor`) em pílulas compactas (`bg-black/40 border border-white/10 hover:border-gold-accent/40 rounded-xs px-2.5 py-1.5`).
- Estilizar o card da Regra V5 para integração harmônica no rodapé da coluna.

---

### 2. HUD Vitais & Sangue (Direita)
#### [MODIFY] [CharacterSheetClient.tsx](file:///d:/Etna/Projetos/ChronicleOS/src/components/sheet/CharacterSheetClient.tsx)
- Reorganizar a coluna da direita (`lg:col-span-7`) com divisor de borda (`border-l border-white/10 pl-6`).
- Emparelhar Vitalidade e Força de Vontade (`DamageTracker`) em cartões modulares de altura simétrica (`bg-black/30 border border-white/10 p-3 rounded-xs`).
- Ajustar Fome (`DotSlider`) e Ressonância (`BloodPanel`) em containers simétricos.
- Estilizar o bloco de Bússola Moral (`HumanityTracker`) e a faixa da Maldição do Clã no rodapé da seção.

---

## 📋 Tarefas Detalhadas de Implementação

### Tarefa 1: Redesign da Coluna de Identidade em `CharacterSheetClient.tsx`
**Arquivos:**
- Modificar: `d:\Etna\Projetos\ChronicleOS\src\components\sheet\CharacterSheetClient.tsx` (linhas 1888-2017)

- [ ] **Passo 1: Atualizar classes do Avatar para `w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-gold-accent/50 ring-1 ring-blood-red/40`**
- [ ] **Passo 2: Reorganizar os campos `InlineEdit` de metadados em pílulas de dados estilizadas**
- [ ] **Passo 3: Ajustar o container de estilo do card Informativo da Regra V5**
- [ ] **Passo 4: Validar compilação TypeScript com `npx tsc --noEmit`**

---

### Tarefa 2: Redesign da Coluna do HUD Vitais & Sangue em `CharacterSheetClient.tsx`
**Arquivos:**
- Modificar: `d:\Etna\Projetos\ChronicleOS\src\components\sheet\CharacterSheetClient.tsx` (linhas 2019-2075)

- [ ] **Passo 1: Adicionar container tático modular com `border-l border-white/10 pl-6`**
- [ ] **Passo 2: Enquadrar `DamageTracker` (Vitalidade e Força de Vontade) em cards simétricos**
- [ ] **Passo 3: Harmonizar Fome (`DotSlider`) e Ressonância (`BloodPanel`)**
- [ ] **Passo 4: Refinar o layout da Bússola Moral (`HumanityTracker`) e o banner da Maldição do Clã**
- [ ] **Passo 5: Validar compilação TypeScript com `npx tsc --noEmit`**

---

## 🧪 Plano de Verificação

### Teste Estático
- Executar `npx tsc --noEmit` para garantir 0 erros de compilação.

### Teste de Interface
1. Abrir a ficha do personagem (`/campanhas/[id]/personagens/[id]` ou pela gaveta lateral).
2. Verificar o novo alinhamento do Avatar, Nome e pílulas de metadados.
3. Testar a alteração via `InlineEdit` de Clã, Idade, Geração, Predador e Senhor.
4. Verificar se a Vitalidade, Força de Vontade, Fome, Ressonância e Humanidade estão perfeitamente alinhadas e operacionais.
