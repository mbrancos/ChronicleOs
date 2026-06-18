# ChronicleOS: Vampire the Masquerade 5e - Design System

Este documento serve como a **única fonte da verdade (Single Source of Truth)** para o design visual e de interface do ChronicleOS. Os tokens e diretrizes aqui apresentados foram extraídos e refinados diretamente do **Demiplane Nexus** para *Vampiro: A Máscara 5ª Edição*, garantindo a autenticidade e o clima gótico do RPG.

---

## 1. Cores (Color Palette)

O sistema de cores do ChronicleOS é profundamente temático, utilizando tons escuros e frios como base, contrastados com vermelhos intensos (sangue/fome) e dourados para focar a atenção do jogador.

### Cores Base (Backgrounds & Surfaces)

| Nome do Token | Valor HEX | Valor RGB | Semântica de Uso |
| :--- | :--- | :--- | :--- |
| `color-bg-main` | `#060606` | `rgb(6, 6, 6)` | Fundo principal da página (Preto profundo gótico) |
| `color-bg-card` | `#202020` | `rgb(32, 32, 32)` | Fundo de painéis, blocos de Atributos, fichas e modais |
| `color-bg-card-dark` | `#101014` | `rgb(16, 16, 20)` | Fundo de subseções ou cards aninhados |
| `color-bg-input` | `#111111` | `rgb(17, 17, 17)` | Fundo de caixas de entrada de texto e seleções |

### Cores Temáticas e Marcadores (Temática Vampiro V5)

| Nome do Token | Valor HEX | Valor RGB | Semântica de Uso |
| :--- | :--- | :--- | :--- |
| `color-blood-red` | `#c82434` | `rgb(200, 36, 52)` | Vermelho principal (botões primários, dados normais, rolagens) |
| `color-burgundy` | `#68111a` | `rgb(104, 17, 26)` | Vermelho escuro/vinho (cabeçalhos de cards, botões secundários) |
| `color-deep-crimson`| `#800008` | `rgb(128, 0, 8)` | Vermelho escuro (dano agravado, marcas de ferimento profundo) |
| `color-hunger-red` | `#ff5c5c` | `rgb(255, 92, 107)` | Vermelho brilhante de Fome (marcadores de fome, dados de Fome) |
| `color-willpower-blue`| `#244666` | `rgb(36, 70, 102)` | Azul Força de Vontade (marcadores de Força de Vontade) |
| `color-gold-accent` | `#ffd84d` | `rgb(255, 216, 77)` | Amarelo dourado (seleções, especializações, macros ativas) |

### Cores de Texto (Typography Colors)

| Nome do Token | Valor HEX | Valor RGB | Semântica de Uso |
| :--- | :--- | :--- | :--- |
| `color-text-primary`| `#ffffff` | `rgb(255, 255, 255)`| Texto principal, valores e nomes importantes |
| `color-text-muted` | `#b7b7b7` | `rgb(183, 183, 183)`| Texto secundário, rótulos de atributos, descrições breves |
| `color-text-dim` | `#666666` | `rgb(102, 102, 102)`| Texto desabilitado ou decorativo |

> [!WARNING]
> **Contraste de Acessibilidade:** O token `color-text-dim` possui contraste muito baixo contra fundos escuros (`2.5:1`). Não utilize esta cor para textos informativos ou rótulos importantes. Restrinja o uso a placeholders de entrada e estados puramente inativos.

---

## 2. Tipografia (Typography)

A tipografia do Demiplane equilibra a estética rústica e gótica medieval de *Vampiro* com a legibilidade exigida em aplicativos mobile e desktop de alta performance.

### Gerenciamento de Fontes no Next.js (Zero FOUT & Sem Erros de CORS)

Para garantir segurança contra CORS e o melhor desempenho possível, as fontes góticas oficiais do Demiplane são salvas localmente na pasta `public/fonts/` e inicializadas via **`next/font/local`** no arquivo `src/app/layout.tsx` usando o caminho relativo (ex: `../../public/fonts/Gin.otf`), enquanto as fontes Barlow e Nunito são carregadas do Google Fonts via **`next/font/google`** diretamente no arquivo `src/app/layout.tsx`.

### Regras de Uso de Fontes

1. **`font-family: var(--font-gothic)`** (Injeta a fonte `Gin`)
   - **Onde usar**: Nome do Personagem, Clã, Conceito, Títulos Principais (`h1`, `h2`) e cabeçalhos de seções críticas (ex: ATRIBUTOS, HABILIDADES, DISCIPLINAS).
   - **Características**: Serifada gótica de época, transmite o tom dramático do jogo.
2. **`font-family: var(--font-data)`** (Injeta a fonte `Barlow`)
   - **Onde usar**: Nomes de Atributos, Habilidades, botões de rolagem, contadores numéricos rápidos.
   - **Características**: Sem serifa condensada, excelente para layouts compactos onde o texto precisa caber em colunas apertadas no mobile.
3. **`font-family: var(--font-reading)`** (Injeta a fonte `Nunito`)
   - **Onde usar**: Textos de histórico (Lore), anotações do jogador/narrador, descrições detalhadas de poderes de disciplinas e vantagens.
   - **Características**: Sem serifa arredondada e suave, de leitura agradável em fundos pretos.

---

## 3. Espaçamentos (Spacing Grid)

O ChronicleOS adota uma grade baseada em múltiplos de **8px** (padrão do Material Design / MUI utilizado pelo Demiplane).

| Token | Valor | Uso Recomendado |
| :--- | :--- | :--- |
| `spacing-xs` | `4px` (`0.25rem`) | Espaço entre bolinhas de atributos, pequenos ícones |
| `spacing-sm` | `8px` (`0.5rem`) | Padding interno de inputs, gap entre colunas secundárias |
| `spacing-md` | `16px` (`1rem`) | Padding de cards de seção, espaçamento entre itens de lista |
| `spacing-lg` | `24px` (`1.5rem`) | Margem inferior de cards principais, padding de cabeçalho |
| `spacing-xl` | `32px` (`2rem`) | Separação entre grandes blocos da ficha (Atributos vs Habilidades) |

---

## 4. Bordas e Sombras (Borders & Shadows)

### Ausência de Sombras
O tema de Vampiro preza por um visual cru, plano (flat) e focado em texturas ou contrastes fortes. 
- **Regra**: Evitar sombras volumosas. Usar `box-shadow: none !important` em cards comuns.
- **Exceção (Tooltips / Modais Suspensos)**: `box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2)` ou um contorno iluminado sutil.

### Bordas
Os cards e inputs são separados por contornos finos e semitransparentes.
- **Borda de Card Padrão**: `1px solid rgba(255, 255, 255, 0.1)` (ou `#ffffff3b` dependendo do destaque).
- **Border Radius**:
  - Cards grandes e painéis: `4px` ou `6px` para um visual sólido e pouco arredondado.
  - Botões de Rolagem de Dados: `4px` ou retos (`0px`).
  - Rastreamento e bolinhas: Círculos perfeitos (`50%` ou `9999px`).

---

## 5. Componentes Temáticos da Ficha (Ficha Reativa)

Abaixo estão as especificações visuais de componentes cruciais para a experiência reativa do jogador.

### A. Bolinhas de Pontuação (Dots)
Usadas para Atributos (Força, Destreza, etc.) e Habilidades (Prontidão, Luta, etc.), organizadas em fileiras de 5.

*   **Bolinha Ativa (Preenchida)**: 
    - Cor de Preenchimento: `var(--color-gold-accent)` (`#ffd84d`) ou `var(--color-text-primary)` (`#ffffff`).
    - Tamanho: `10px` a `12px` de diâmetro.
*   **Bolinha Inativa (Vazia)**:
    - Cor de Preenchimento: `var(--color-bg-main)` (`#060606`).
    - Borda: `1px solid var(--color-text-dim)` (`#666666`).
*   **Hover Estado**: Ao passar o mouse, a bolinha deve brilhar levemente com um contorno de opacidade (`rgba(255, 216, 77, 0.4)`).

> [!IMPORTANT]
> **Prevenção de Overflow no Mobile (Métrica Touch Target):**
> Em telas de `375px`, cinco botões individuais de `44px` geram `220px` de largura horizontal, quebrando o layout da linha. 
> - **Solução:** As bolinhas de pontuação devem funcionar como um **Slider Contínuo**.
> - O contêiner de 5 bolinhas deve possuir tamanho fixo e compacto (ex: `100px` a `120px` de largura total).
> - O contêiner pai inteiro terá uma altura física de **`44px`** (garantindo touch target vertical para fácil alcance do polegar).
> - Ao clicar na linha das bolinhas, calcula-se a posição horizontal relativa do toque para definir a pontuação (ex: toque ao centro preenche 3, toque à direita preenche 5), eliminando colisões de layout.

### B. Rastreador de Dano (Health & Willpower Boxes)
A Vitalidade e a Força de Vontade são controladas por quadradinhos reativos (`16px x 16px`).

1.  **Estado Livre (Vazio)**:
    - Fundo: `var(--color-bg-input)` (`#111111`).
    - Borda: `1.5px solid var(--color-text-muted)` (`#b7b7b7`).
2.  **Dano Superficial (/)**:
    - Fundo: `var(--color-bg-input)` (`#111111`).
    - Desenho: Uma barra diagonal `/` de cor `var(--color-text-primary)` (`#ffffff`) cruzando de ponta a ponta.
3.  **Dano Agravado (X)**:
    - Fundo: `rgba(128, 0, 8, 0.15)` (Fundo sutil avermelhado).
    - Desenho: Duas barras em cruz `X` de cor `var(--color-deep-crimson)` (`#800008`) de espessura destacada.

### C. Rastreador de Fome (Hunger Tracker)
Exibe 5 quadradinhos dedicados à Fome do Vampiro (0 a 5).

*   **Fome Ativa (Fome > 0)**:
    - Fundo: `var(--color-hunger-red)` (`#ff5c5c`) ou um ícone estilizado de gota de sangue vermelho brilhante.
    - Borda: `1px solid var(--color-hunger-red)`.
*   **Fome Inativa**:
    - Fundo: `rgba(255, 92, 107, 0.05)` (preenchimento vermelho apagado).
    - Borda: `1px solid var(--color-text-dim)` (`#666666`).

### D. Dados de Rolagem d10 (Macros)
Os botões de macro geram rolagens de dados que combinam dados normais e dados de fome.

*   **Dado d10 Comum (Preto/Vermelho Principal)**:
    - Fundo: `var(--color-bg-main)` (`#060606`).
    - Borda: `1px solid var(--color-blood-red)` (`#c82434`).
    - Número Interno: `var(--color-text-primary)` (`#ffffff`).
*   **Dado d10 de Fome (Vermelho Fome)**:
    - Fundo: `var(--color-hunger-red)` (`#ff5c5c`).
    - Borda: `1px solid var(--color-text-primary)` (`#ffffff`).
    - Número Interno: `var(--color-bg-main)` (`#060606`).
    - *Nota*: Sucessos Críticos de Fome (10) e Falhas Bestiais (1) devem ter ícones específicos em vez de números apenas (como um olho ou uma cruz de presas).

---

## 6. Guia de Configuração no Tailwind CSS v4

No Tailwind CSS v4, a configuração baseia-se em CSS e os tokens são estendidos diretamente no bloco `@theme` no arquivo global de estilos.

### Configuração no `src/app/globals.css`

```css
@import "tailwindcss";

@theme {
  /* Cores Base */
  --color-bg-main: #060606;
  --color-bg-card: #202020;
  --color-bg-card-dark: #101014;
  --color-bg-input: #111111;

  /* Cores Temáticas */
  --color-blood-red: #c82434;
  --color-burgundy: #68111a;
  --color-deep-crimson: #800008;
  --color-hunger-red: #ff5c5c;
  --color-willpower-blue: #244666;
  --color-gold-accent: #ffd84d;

  /* Cores de Texto */
  --color-text-primary: #ffffff;
  --color-text-muted: #b7b7b7;
  --color-text-dim: #666666;

  /* Famílias de Fontes mapeadas para as variáveis carregadas no Layout */
  --font-gothic: var(--font-gin), serif;
  --font-data: var(--font-barlow), sans-serif;
  --font-reading: var(--font-nunito), sans-serif;
}

body {
  background-color: var(--color-bg-main);
  color: var(--color-text-primary);
  font-family: var(--font-reading);
}
```

### Classes de Utilitários Temáticos no HTML:
- Fundo de painéis e cards: `class="bg-bg-card border border-white/10 p-4 rounded"`
- Cabeçalhos de seção góticos: `class="font-gothic text-2xl text-blood-red"`
- Dados, Atributos e Números rápidos: `class="font-data text-gold-accent font-bold"`
