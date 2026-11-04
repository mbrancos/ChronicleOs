# Roadmap & Backlog Oficial: ChronicleOS

Este documento centraliza as ideias, iniciativas planejadas e o backlog de evolução contínua da plataforma **ChronicleOS**, integrando os sistemas **Vampiro: A Máscara 5ª Edição (V5)** e **As Regras de Ouro 2.0 (E ainda chove / Izandro)**.

---

## 🔮 1. Próximas Funcionalidades em Destaque (Backlog Prioritário)

### 🧠 1.1 Agente Tira-Dúvidas / Oráculo das Regras ("Izandro" / "Grimório de Sangue")
- **Conceito:** Assistente inteligente de IA integrado ao webapp para responder dúvidas mecânicas e narrativas em tempo real para jogadores e narradores.
- **Ativação e UX:**
  - **Atalho Global:** `Ctrl + Espaço` ou `Cmd + K` para abrir uma gaveta (*drawer*) rápida de qualquer tela.
  - **Botão Flutuante Gótico:** Exibido de forma contextual no canto inferior da tela (ativado quando a crônica ou personagem for do sistema *Regras de Ouro / Izandro*, ou configurável para ambos os sistemas).
- **Base de Conhecimento (RAG):**
  - Textos canônicos de *As Regras de Ouro 2.0* (Guia do Jogador, 40 Arquétipos, Vitalidade Anatômica, Guia da Besta).
  - Regras oficiais de *Vampiro V5* (fome, compulsões, rouse checks).
  - Consulta rápida de cálculos de arquétipos, tabelas de custos de XP e regras de transbordamento de dano.
- **Modos de Resposta:**
  - Modo Árbitro: Explicar regras literais de forma rápida e sucinta.
  - Modo Narrador: Sugerir interpretações temáticas para falhas críticas, impulsos da Besta e peculiaridades.

---

### 📚 1.2 Catálogo Textual Completo de Disciplinas & Poderes (Sob Demanda)
- **Origem:** Compilado de 57 páginas de `Disciplinas Versão Final.docx`.
- **Arquitetura Leve (Zero Peso no Bundle):**
  - Armazenamento em tabela/JSON no banco PostgreSQL Neon ou módulos carregados sob demanda (*lazy-loading* / Server Action).
  - O jogador só carrega a descrição detalhada quando clica no botão "Detalhes do Poder" ou passa o mouse na ficha.
- **Conteúdo:**
  - Descrições literais de todos os 5 níveis e sub-níveis automáticos $N.x$ para as 18 disciplinas canônicas.

---

### ⚔️ 1.3 Automações de Combate e VTT para Regras de Ouro
- Rolagem de ataque integrada que já sugere a parada de defesa (Esquiva ou Bloqueio).
- Aplicação rápida de dano anatômico com sorteio de setor (1d10 para localização do golpe) ou mira direcionada.
- Resolução visual de manobras especiais (Agarrão, Desarme, Tiro Mirado).

---

## 📌 2. Funcionalidades Concluídas (Entregues)

- [x] **Suporte Multi-Sistema (V5 & Regras de Ouro 2.0)**:
  - Discriminador de sistema no banco de dados (`system_id` em `campaigns` e `characters`).
  - Seletor de sistema e badges no Hub de Crônicas e no Cofre.
  - Grade de 12 Talentos (Físicos e Mentais) com dots interativos (0 a 6).
  - Gerenciador de Palavras-Chave (Graus I a IV com cálculo de bônus na parada).
  - Vitalidade Anatômica nos 9 setores com transbordamento automático (Normal $\rightarrow$ Letal $\rightarrow$ Agravado).
  - Guia da Besta (Ângstia, Líbido, Trilha, Pecados 1-10, Flagelos e Teste de Pânico).
  - Árvore de Disciplinas com sub-níveis $N.x$ automáticos.
  - Orquestrador de Ficha com persistência debounced e 100% de retrocompatibilidade com V5.
