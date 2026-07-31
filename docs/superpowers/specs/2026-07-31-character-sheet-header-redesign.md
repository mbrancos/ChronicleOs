# 📐 Especificação de Design: Redesign Compacto do Cabeçalho da Ficha (`#sec-profile`)

**Data:** 31/07/2026  
**Status:** Aprovado  
**Escopo:** Reorganização do cabeçalho fixo da ficha (`CharacterSheetClient.tsx`), introduzindo o **Quadro Único de Recursos Vitais**, eliminando quadros duplos/redundantes e reduzindo a altura total da seção em ~45%.

---

## 🎯 Objetivos do Ajuste Visual & UX

1. **Quadro Único de Recursos Vitais:** Unificar **Vitalidade**, **Força de Vontade** e **Fome** em um único container tático com visual padronizado.
2. **Fim dos Quadros Duplos:** Eliminar bordas e wrappers internos redundantes na Bússola Moral (`HumanityTracker`) e na Ressonância (`BloodPanel`).
3. **Compactação de Altura:** Reduzir a altura vertical total do cabeçalho de perfil através do ajuste de tamanho do Avatar (80px), pílulas de metadados em 2 linhas e layout de alta densidade.

---

## 🏛️ 1. Identidade do Vampiro (Coluna Esquerda - `lg:col-span-5`)

- **Avatar:** `80x80px` (`w-20 h-20`), mantendo o clique interativo de alteração da foto.
- **Nome do Vampiro:** Tipografia gótica (`font-gothic text-2xl text-blood-red`) com suporte a nomes longos via truncamento.
- **Metadados em 2 Linhas Compactas:**
  - Linha 1: `Clã`, `Idade`, `Geração`
  - Linha 2: `Predador`, `Senhor`
  - Pílulas em tom escuro translúcido (`bg-black/40 border border-white/10 hover:border-gold-accent/40 rounded-xs px-2.5 py-1`).
- **Card Informativo de Regras V5:** Faixa horizontal enxuta de 1 linha na base da coluna (`bg-amber-950/20 border border-amber-600/30 p-2 rounded-xs text-[10px] font-data`).

---

## 🎲 2. HUD Vitais & Sangue (Coluna Direita - `lg:col-span-7`)

### A. Quadro Único de Recursos Vitais (Vitalidade + Força de Vontade + Fome)
- **Container Unificado:** `bg-black/40 border border-white/10 p-3.5 rounded-xs space-y-3`.
- **Três Linhas de Recursos Padronizadas:**
  - `Vitalidade`: Rótulo, caixas de dano (`18x18px`) e indicador de alteração.
  - `Força de Vontade`: Rótulo, caixas de dano (`18x18px`) e indicador de alteração.
  - `Fome`: Rótulo e 5 marcadores circulares vermelhos (`color-hunger-red`) alinhados.

### B. Linha de Ressonância & Bússola Moral
- **Ressonância (`BloodPanel`):** Container compacto (`bg-black/30 border border-white/10 p-3 rounded-xs`) com dropdown de Humor e input de Discrasi sem wrappers duplos.
- **Bússola Moral (`HumanityTracker`):** Container compacto (`bg-black/30 border border-white/10 p-3 rounded-xs`) com os 10 marcadores dourados e controles numéricos de Humanidade/Máculas.

### C. Rodapé da Maldição do Clã
- Faixa horizontal minimalista (`bg-burgundy/25 border border-blood-red/30 px-3 py-1.5 rounded-xs text-xs font-data`) destacando a maldição ativa.

---

## 🧪 Plano de Verificação

1. **TypeScript Check:** Executar `npx tsc --noEmit` para garantir 0 erros.
2. **Validação de UI/UX:** Testar a ficha e a gaveta lateral verificando a redução de altura, visualização do Quadro Único de Recursos Vitais e ausência de caixas duplas.
