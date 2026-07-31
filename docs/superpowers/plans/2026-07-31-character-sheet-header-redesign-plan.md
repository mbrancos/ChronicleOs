# 📐 Plano de Implementação: Redesign Compacto com Quadro Único de Recursos Vitais (`#sec-profile`)

> **Para executores agentivos:** SUB-SKILL REQUERIDA: Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. As etapas usam a sintaxe de checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Agrupar Vitalidade, Força de Vontade e Fome em um **Quadro Único de Recursos Vitais**, eliminar bordas/quadros duplicados na Bússola Moral e Ressonância, e reduzir a altura total do cabeçalho de perfil (`#sec-profile`) em ~45%.

**Arquitetura:** Reorganizar a seção `#sec-profile` em `CharacterSheetClient.tsx`. O lado esquerdo conterá o avatar de 80px, metadados em 2 linhas e card V5 compacto. O lado direito conterá o Quadro Único de Recursos Vitais (3 linhas alinhadas de saúde, vontade e fome) seguido pelos quadros diretos de Ressonância e Bússola Moral sem nesting de bordas.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS.

---

## 🎯 Atividades e Modificações Propostas

### 1. Reorganização do Cabeçalho (`#sec-profile`)
#### [MODIFY] [CharacterSheetClient.tsx](file:///d:/Etna/Projetos/ChronicleOS/src/components/sheet/CharacterSheetClient.tsx)
- Reduzir tamanho do avatar para `80x80px` (`w-20 h-20`).
- Reorganizar pílulas de metadados em 2 linhas horizontais compactas.
- Agrupar `DamageTracker` (Vitalidade), `DamageTracker` (Força de Vontade) e `DotSlider` (Fome) em um único container (`bg-black/40 border border-white/10 p-3.5 rounded-xs space-y-3`).
- Remover wrappers de bordas duplicadas ao redor do `HumanityTracker` e `BloodPanel`.

---

## 📋 Tarefas Detalhadas de Implementação

### Tarefa 1: Implementar Quadro Único de Recursos Vitais e Layout Compacto em `CharacterSheetClient.tsx`
**Arquivos:**
- Modificar: `d:\Etna\Projetos\ChronicleOS\src\components\sheet\CharacterSheetClient.tsx` (linhas 1888-2080)

- [ ] **Passo 1: Ajustar Avatar para `w-20 h-20` e metadados em 2 linhas horizontais**
- [ ] **Passo 2: Criar o container do Quadro Único de Recursos Vitais agrupando Vitalidade, Vontade e Fome**
- [ ] **Passo 3: Remover bordas e padding duplicados do `HumanityTracker` e `BloodPanel`**
- [ ] **Passo 4: Validar compilação TypeScript com `npx tsc --noEmit`**

---

## 🧪 Plano de Verificação

### Teste Estático
- Executar `npx tsc --noEmit` para garantir 0 erros de compilação.

### Teste de Interface
1. Abrir a ficha do personagem (`/campanhas/[id]/personagens/[id]` ou pela gaveta lateral).
2. Verificar se Vitalidade, Força de Vontade e Fome estão no **Quadro Único de Recursos Vitais**.
3. Confirmar a ausência de quadros duplos/duplicados na Bússola Moral.
4. Verificar a redução significativa da altura da seção no navegador.
