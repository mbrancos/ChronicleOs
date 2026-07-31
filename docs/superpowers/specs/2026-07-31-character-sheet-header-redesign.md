# 📐 Especificação de Design: Redesign do Cabeçalho da Ficha do Personagem (`#sec-profile`)

**Data:** 31/07/2026  
**Status:** Aprovado  
**Escopo:** Refatoração de layout e hierarquia visual do cabeçalho fixo da ficha (`CharacterSheetClient.tsx`), melhorando proporções, alinhamentos e estética sem alterar nenhuma funcionalidade existente nem remover/adicionar elementos.

---

## 🎯 Visão Geral do Redesign

O objetivo é transformar a parte superior da ficha (`#sec-profile`) em um **Cartão de Identidade Gótico com HUD Vitais Tático Simétrico**. 

---

## 🏛️ 1. Identidade do Vampiro (Coluna Esquerda - `lg:col-span-5`)

### Layout e Proporções:
- **Avatar do Vampiro:** Moldura circular `100x100px` (`w-24 h-24 sm:w-28 sm:h-28`) com anel duplo em dourado e carmesim (`border-2 border-gold-accent/50 ring-1 ring-blood-red/40`), mantendo o clique interativo de alteração da foto.
- **Nome do Vampiro:** Tipografia gótica (`font-gothic text-2xl sm:text-3xl text-blood-red`), com truncamento limpo para nomes longos.
- **Metadados em Pílulas (`Clã`, `Idade`, `Geração`, `Predador`, `Senhor`):**
  - Mapeados em cartões compactos (`bg-black/40 border border-white/10 hover:border-gold-accent/40 rounded-xs px-2.5 py-1.5`).
  - Preservadas 100% as interações de `InlineEdit` (dropdowns e campos de texto).
- **Card Informativo de Regras V5:**
  - Container translúcido em tom âmbar escuro (`bg-amber-950/20 border border-amber-600/30 p-2.5 rounded-xs text-[10px] font-data`), harmonizado no rodapé da coluna de perfil.

---

## 🎲 2. HUD Tático de Vitais & Sangue (Coluna Direita - `lg:col-span-7`)

### Grid Modular de Estado:
- **Estrutura:** Grid interno equilibrado com borda divisória esquerda (`border-l border-white/10 pl-6`).
- **Vitalidade & Força de Vontade (`DamageTracker`):**
  - Emparelhados em mini-cards modulares de altura uniforme (`bg-black/30 border border-white/10 rounded-xs p-3`).
  - Quadrados de dano (`/` e `✕`) ajustados para `18x18px` (`w-4.5 h-4.5`) com alinhamento rigoroso.
- **Fome & Ressonância (`DotSlider` e `BloodPanel`):**
  - Fome (5 marcadores circulares vermelhos) e Ressonância (Humor da Vítima + Discrasi) integrados em um bloco simétrico de recursos de sangue.
- **Bússola Moral (`HumanityTracker`):**
  - Ocupa a largura total inferior da direita, apresentando os 10 marcadores dourados (`color-gold-accent`) alinhados aos seletores numéricos de Humanidade e Máculas.
- **Faixa da Maldição do Clã:**
  - Posicionada na base do container com fundo carmesim translúcido (`bg-burgundy/25 border border-blood-red/30 p-2.5 rounded-xs`), mantendo o texto descritivo e o badge do clã.

---

## 🧪 Plano de Verificação

1. **TypeScript Check:** Executar `npx tsc --noEmit` para validar ausência de erros de tipagem.
2. **Interface Visual:** Abrir a ficha do personagem no navegador (via gaveta ou tela cheia) e testar:
   - Alinhamento de fotos e nomes longos.
   - Edição inline de Clã, Idade, Geração, Predador e Senhor.
   - Interação com os marcadores de Danos, Fome, Ressonância e Humanidade.
