# 📐 Especificação de Design: Gestão de Macros & Teste de Despertar (V5) na Ficha

**Data:** 30/07/2026  
**Status:** Em Revisão  
**Escopo:** Atualização da Seção 8 (Sistema e Macros) na Ficha do Personagem (`CharacterSheetClient.tsx`).

---

## 🎯 Contexto e Objetivos

O sistema **ChronicleOS** já possui a mecânica do **Teste de Despertar (Rouse Check)** integrada e operacional no VTT (`PlayerDock.tsx`, `VttRoomClient.tsx`, `BloodEngine.ts`). 

Esta especificação define o alinhamento da **Seção 8 da Ficha do Personagem** (`CharacterSheetClient.tsx`), permitindo que o jogador gerencie suas macros customizadas, gere presets recomendados e execute o Teste de Despertar diretamente na visualização da ficha.

---

## 🛠️ Detalhamento das Funcionalidades

### 1. 🩸 Botão Dramático "Teste de Despertar" (Rouse Check)
* **Local:** Topo em destaque no painel da Seção 8 da Ficha.
* **Mecânica (V5):**
  - Rola 1d10 utilizando/reutilizando o motor `rollRouseCheck()` de `@/lib/vtt/BloodEngine.ts`.
  - **Falha (1–5):** Incrementa a Fome do personagem em +1 (respeitando o teto máximo de 5). Exibe alerta gótico no simulador e notificação de toast: `🩸 A Besta exige mais Sangue! Fome aumentada para X`.
  - **Sucesso (6–10):** A Fome permanece inalterada. Exibe feedback: `🩸 O Sangue respondeu ao seu chamado! Fome mantida em X`.
* **Estilo Visual:** Botão vermelho carmesim em destaque (`bg-deep-crimson/80 border border-blood-red text-white hover:bg-blood-red`).

---

### 2. ⚡ Gerador de Presets Recomendados V5
* **Local:** Barra de ações do painel de macros.
* **Ação (1-Clique):** Insere automaticamente no array `character.macros` as 5 rolagens fundamentais de Vampiro: A Máscara:
  1. 🗡️ **Ataque Corpo a Corpo:** `strength` (Força) + `brawl` (Briga)
  2. 🎯 **Tiro de Precisão:** `dexterity` (Destreza) + `firearms` (Armas de Fogo)
  3. 🏃 **Esquiva & Evasão:** `dexterity` (Destreza) + `athletics` (Atletismo)
  4. 👁️ **Percepção Aguçada:** `wits` (Raciocínio) + `awareness` (Percepção)
  5. 👤 **Furtividade:** `dexterity` (Destreza) + `stealth` (Furtividade)
* **Prevenção de Duplicatas:** Mescla apenas as macros cujos nomes/pools ainda não existam.

---

### 3. 📝 Formulário & Gestão de Macros Customizadas
* **Botão `+ Criar Nova Macro`:** Alterna a exibição de um formulário inline simples e escuro.
* **Campos:**
  - **Nome da Macro:** Input de texto (ex: *"Golpe de Espada"*, *"Tapa de Força"*).
  - **1º Dado (Atributo):** Dropdown contendo os 9 Atributos (Força, Destreza, Vigor, Carisma, Manipulação, Autocontrole, Inteligência, Raciocínio, Determinação).
  - **2º Dado (Habilidade / Disciplina):** Dropdown contendo Habilidades e Disciplinas ativas do personagem.
  - **Toggle `Teste de Despertar` (Opcional):** Marca se a macro exige um Rouse Check integrado ao ser disparada.
* **Exclusão de Macros:**
  - Botão `✕` sutil no topo de cada card de macro com remoção imediata do array `character.macros`.

---

### 4. 🎲 Painel do Simulador de Rolagem
* Exibe a rolagem disparada tanto de macros quanto do Teste de Despertar isolado.
* Mantém o cálculo automático de dados pretos e dados vermelhos de Fome, destacando **Vitórias Messiânicas** e **Falhas Bestiais**.

---

## 🧪 Plano de Verificação

1. **Tipagem e Build:** Executar `npx tsc --noEmit` para garantir 0 erros de TypeScript.
2. **Teste de Despertar:** Clicar no botão `🩸 Teste de Despertar` na Seção 8 e verificar se rola 1d10 e incrementa a Fome ao tirar <= 5.
3. **Presets:** Clicar em `⚡ Gerar Presets Recomendados V5` e verificar a adição das 5 macros.
4. **Criação e Exclusão:** Adicionar uma nova macro personalizada e testar sua exclusão via botão `✕`.
5. **Rolagem:** Clicar no card de uma macro e verificar a execução da rolagem no painel de resultados da direita.
