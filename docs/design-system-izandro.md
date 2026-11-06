# ChronicleOS: Design System "Noir Carmesim" (Sistema Izandro)

Este documento define a especificação oficial e a **Fonte Única da Verdade (Single Source of Truth)** para a nova identidade visual do ChronicleOS. Inspirado diretamente nos documentos originais do Izandro (*As Regras de Ouro*, *Planilha versão 4.0*, *Guia do Jogador-V8* e *Disciplinas Versão Final*), este design system une a estética crua de **Graphic Novel Noir / Chiaroscuro** em alto contraste com a funcionalidade moderna necessária para um webapp reativo no desktop e mobile.

---

## 1. Filosofia e Princípios Visuais

1. **Chiaroscuro & Alto Contraste (Preto e Branco Dominantes)**:
   A base da interface é rigorosamente monocromática. Tons de preto profundo e superfícies grafite contrastam com tipografias e linhas em branco nítido, evocando o suspense de quadrinhos noir e necropsias do século XIX.
2. **Carmesim Cirúrgico (O Sangue como Destaque)**:
   Diferente de temas genéricos que espalham vermelho por todos os botões, aqui o **Vermelho Sangue / Carmesim** é reservado com precisão: ele surge apenas quando a mecânica toca a carne e a Besta (Vitæ, ferimentos, frenesi, fome e o painel sombrio).
3. **Estrutura por Tarjas Sólidas (Identidade Izandro)**:
   As categorias de atributos, talentos e disciplinas são demarcadas por **tarjas pretas horizontais sólidas**, com texto branco condensado em caixa alta e ícones minimalistas em bloco invertido.
4. **Anatomia Humanoide Funcional**:
   O controle de integridade física abandona listas genéricas de pontos de vida em favor do **Diagrama Anatômico Humanoide de 9 Setores**, permitindo o rastreamento cirúrgico de ferimentos localizados e penalidades por membro.
5. **Dualidade Estrutural (O Homem vs. A Besta)**:
   A interface expressa visualmente a luta interior do vampiro: a parte superior representa o controle social e as habilidades do personagem, enquanto a parte inferior abriga a gaveta escura e visceral da Besta (*The Beast Within*).

---

## 2. Paleta de Cores (Color Tokens)

### 2.1 Superfícies e Fundos (Monocromático Noir)

| Token | Valor HEX | Valor RGB | Aplicação |
| :--- | :--- | :--- | :--- |
| `noir-base` | `#08080a` | `rgb(8, 8, 10)` | Fundo geral da aplicação (preto profundo carvão) |
| `noir-card` | `#121216` | `rgb(18, 18, 22)` | Fundo padrão de cards, fichas e painéis |
| `noir-card-subtle` | `#18181f` | `rgb(24, 24, 31)` | Fundo de sub-blocos, campos aninhados e modais |
| `noir-input` | `#0c0c0f` | `rgb(12, 12, 15)` | Fundo de caixas de texto e seletores |
| `noir-solid-banner` | `#000000` | `rgb(0, 0, 0)` | Fundo preto puro das tarjas de disciplinas e títulos |

### 2.2 Bordas e Linhas de Contraste

| Token | Valor HEX / Alpha | Aplicação |
| :--- | :--- | :--- |
| `noir-border` | `rgba(255, 255, 255, 0.12)` | Borda padrão de cards, botões neutros e contornos de divisores |
| `noir-border-strong` | `rgba(255, 255, 255, 0.25)` | Bordas de foco, campos ativos e caixas de seleção |
| `noir-border-double` | `#ffffff` | Linha dupla de contorno clássica (assinatura da Planilha 4.0) |

### 2.3 Tipografia (Escala de Claridade)

| Token | Valor HEX | Valor RGB | Aplicação |
| :--- | :--- | :--- | :--- |
| `noir-text-primary` | `#ffffff` | `rgb(255, 255, 255)` | Texto principal, nomes, valores de atributos e cabeçalhos |
| `noir-text-secondary` | `#b8b8c2` | `rgb(184, 184, 194)`| Rótulos técnicos, descrições secundárias e subtítulos |
| `noir-text-muted` | `#6a6a75` | `rgb(106, 106, 117)`| Textos de apoio, placeholders e contadores inativos |

### 2.4 Carmesim & Marcadores Vitais (Uso Cirúrgico)

| Token | Valor HEX | Valor RGB | Aplicação |
| :--- | :--- | :--- | :--- |
| `crimson-blood` | `#c82434` | `rgb(200, 36, 52)` | Vitæ ativa, gota de sangue primária, dano letal (`✕`) |
| `crimson-dark` | `#68111a` | `rgb(104, 17, 26)` | Fundo sutil de alerta, contorno de ferimentos vitais |
| `crimson-aggravated` | `#800008` | `rgb(128, 0, 8)` | Dano agravado (`✦`), marcas de flagelos e cicatrizes permanentes |
| `crimson-beast` | `#991b1b` | `rgb(153, 27, 27)` | Fundo e detalhes do crânio do Painel da Besta |
| `crimson-glow` | `rgba(200, 36, 52, 0.4)`| — | Sombra de brilho interno em órgãos atingidos e Vitæ pulsante |

---

## 3. Tipografia e Hierarquia

O sistema tipográfico de Izandro combina elegância clássica com impacto condensado:

```
[Título Display (Romana Clássica)]  ->  "DR. ETTORE GALVANI" (Cinzel / Garamond)
[Tarja Sólida (Condensada Alta)]    ->  "■ TALENTOS MENTAIS" (Bebas Neue / Oswald)
[Rótulo Técnico (Sem Serifa)]       ->  "DESTREZA" (Inter / Barlow SemiBold)
[Texto de Regra / Lore (Serifada)]  ->  "Descrição de poder e histórico..." (Garamond / Inter)
```

### 3.1 Famílias Tipográficas Recomendadas

1. **`font-cinzel` (Display / Nobreza / Clã)**:
   - Uso: Nome do Personagem, Clã, Título da Crônica, Cabeçalho da Besta.
   - Efeito visual: Letras romanas lapidares clássicas, conferindo antiguidade e nobreza imortal.
2. **`font-condensed` (Tarjas Sólidas / Bebas Neue ou Oswald)**:
   - Uso: Cabeçalhos horizontais de Disciplinas, Talentos, Virtudes, Perícias e Ações de Combate.
   - Efeito visual: Caixa alta firme e compacta sobre a tarja preta sólida.
3. **`font-sans` (Interface e Dados / Inter ou Roboto)**:
   - Uso: Valores numéricos, caixas de diálogo, botões de ação e dados do VTT.
   - Efeito visual: Clareza cristalina e legibilidade absoluta em qualquer resolução.

### 3.2 O Símbolo da Marca: Tríscele (Triskelion)
Presente como ícone oficial do sistema nas capas dos livros de regras de Izandro, o Tríscele celta circular de três espirais deve ser utilizado como marca d'água discreta, botão do menu principal do sistema ou divisor entre seções dramáticas da ficha.

---

## 4. O Esquema de Dano Anatômico (Silhueta do Corpo)

A substituição dos cards de texto comuns pela **Silhueta Anatômica Vetorial Interativa** é um dos pilares do redesign.

### 4.1 Setores Anatômicos Mapeados (9 Setores)

```
             ┌───────────┐
             │ 1. CABEÇA │ (Vital - 3 caixas)
             └─────┬─────┘
             ┌─────┴─────┐
             │ 2. PESCOÇO│ (Vital - 2 caixas)
        ┌────┴───────────┴────┐
        │      3. TÓRAX       │ (Vital - 4 caixas)
   ┌────┤                     ├────┐
   │ 4. │                     │ 5. │
   │BR.D│                     │BR.E│ (3 caixas cada)
   ├────┤                     ├────┤
   │ 6. │                     │ 7. │
   │MÃO │                     │MÃO │ (2 caixas cada)
   └────┘   ┌──────┬──────┐   └────┘
            │  8.  │  9.  │
            │PER.D │PER.E │ (4 caixas cada)
            └──────┴──────┘
```

### 4.1 Tabela Oficial de Dano por Região e d10 de Aleatoriedade

Os números de 0 a 9 correspondem à rolagem de 1d10 para localização aleatória de impactos (ex: atropelamentos, explosões, tiros perdidos ou rajadas de combate).

| Região Anatômica | Número no d10 | Vital? | 🩹 Contusivo (Curativo) | 🗡️ Letal (Lâmina) | 🔥 Agravado (Fogo) | Escala de Penalidades |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Cabeça** | `1` | Sim | 5 círculos | 4 círculos | 3 círculos | `0`, `-1`, `-2`, `-4`, `X` |
| **Pescoço** | `0` | Sim | 5 círculos | 4 círculos | 3 círculos | `0`, `-1`, `-2`, `-4`, `X` |
| **Tórax** | `5` e `6` | Sim | 7 círculos | 6 círculos | 5 círculos | `0`, `0`, `-1`, `-2`, `-3`, `-4`, `X` |
| **Braço Direito** | `2` | Não | 5 círculos | 4 círculos | 3 círculos | `0`, `-1`, `-2`, `-3`, `X` |
| **Braço Esquerdo** | `9` | Não | 5 círculos | 4 círculos | 3 círculos | `0`, `-1`, `-2`, `-3`, `X` |
| **Mão Direita** | `3` | Não | 4 círculos | 3 círculos | 2 círculos | `0`, `-1`, `-2`, `X` |
| **Mão Esquerda** | `8` | Não | 4 círculos | 3 círculos | 2 círculos | `0`, `-1`, `-2`, `X` |
| **Perna Direita** | `4` | Não | 6 círculos | 5 círculos | 4 círculos | `0`, `0`, `-1`, `-2`, `-3`, `X` |
| **Perna Esquerda** | `7` | Não | 6 círculos | 5 círculos | 4 círculos | `0`, `0`, `-1`, `-2`, `-3`, `X` |

### 4.2 Estados e Símbolos de Dano

*   **Caixa Vazia (`□`)**: Membro íntegro. Borda fina branca/cinza (`rgba(255, 255, 255, 0.2)`).
*   **Dano Contusivo / Normal (`/`)**: Marcado com traço diagonal único em âmbar ou cinza claro.
*   **Dano Letal (`✕`)**: Marcado com cruz sólida em `crimson-blood` (`#c82434`).
*   **Dano Agravado (`✦`)**: Marcado com losango ou estrela em `crimson-aggravated` (`#800008`) com preenchimento em roxo-sangue profundo.

### 4.3 Arquitetura Visual em Dobra Única de Tela e Interação de 1 Clique

O componente foi dimensionado para caber **100% dentro de uma única dobra de tela** (sem rolagem vertical excessiva em resoluções de desktop/laptop):
*   **Coluna Esquerda**: Cabeça [1], Braço D. [2], Mão D. [3], Perna D. [4].
*   **Coluna Central**: Silhueta Humanoide Écorché artística com ramificações vasculares em carmesim arterial fluindo do coração, anéis nodais interativos com a numeração do d10 e o card do Tórax [5 • 6] posicionado no centro.
*   **Coluna Direita**: Pescoço [0], Braço E. [9], Mão E. [8], Perna E. [7].
*   **Ferramenta de Rolagem d10**: Botão `🎲 Rolar d10` na barra de topo que sorteia o d10 (0 a 9), anuncia a região atingida e acende a região correspondente no boneco!

**Interação Rápida Direta**:
1. Cada membro possui 3 colunas de marcadores com seus ícones dedicados no rodapé:
   - 🩹 **Contusivo / Curativo**: Bolinha com preenchimento âmbar e barra `/`.
   - 🗡️ **Letal / Lâmina**: Bolinha com preenchimento carmesim e cruz `✕`.
   - 🔥 **Agravado / Fogo**: Bolinha com preenchimento vermelho escuro pulsante e estrela `✦`.
2. **Clique Direto**: Clicar em qualquer bolinha marca ou desmarca o dano instantaneamente (**1 único clique**), sem abrir modais, sem dropdowns e sem confirmações chatas.
3. **Cura com 1 Clique**: Um botão `🩸 Curar` dedicado em cada card ferido consome 1 ponto de Vitæ e cura o ferimento imediatamente.
4. **Sincronia Visual**: Passar o mouse ou tocar em qualquer card destaca o respectivo membro na silhueta central (e vice-versa).

---

## 5. A Seção "A Besta (The Beast Within)" e Termômetro de Vitæ

### 5.1 O Termômetro Vertical de Vitæ (Gotas Pareadas)
Fiel à coluna central da Planilha 4.0:
- O reservatório de Vitæ é desenhado como um termômetro vertical contendo pares simétricos de gotas de sangue conectadas por um eixo central.
- Gotas cheias preenchem-se com `crimson-blood` (`#c82434`) com gradiente sutil.
- Gotas vazias exibem apenas o contorno fino da gota com fundo `noir-input`.
- O clique direto na gota preenche ou consome o sangue, acionando som sutil ou pulso de sangue.

### 5.2 O Painel da Besta (Gaveta Retrátil Inferior)
Posicionado no rodapé da ficha com botão de puxar (*drawer*):
- **Cabeçalho Visual**: Logotipo gótico estilizado com o crânio cornudo da Besta.
- **Rastreadores Específicos do Sistema Izandro**:
  - **Trilha de Libido Reprimida**: 10 gotas/círculos sequenciais.
  - **Trilha de Angústia**: 10 caixas graduadas.
  - **Flagelos & Paixões Obscuras**: Lista de compulsões e impulsos sombrios da Besta.
- **Modo Vampiro V5**:
  - Quando a ficha estiver no modo V5, o mesmo contêiner visual abriga o rastreador de **Fome** (0 a 5) com dados de Fome estilizados e o botão de **Teste de Incitação (Rouse Check)** com o efeito sonoro e visual do Horror da Besta.

---

## 6. Componentes Reutilizáveis

### 6.1 Tarjas Sólidas de Cabeçalho (`SolidHeaderBanner`)
```html
<div class="flex items-center gap-2 bg-black border-b border-white/20 px-3 py-1.5">
  <div class="w-5 h-5 bg-white text-black flex items-center justify-center font-bold text-xs">
    <!-- Ícone Vetorial em Bloco Invertido -->
  </div>
  <h3 class="font-condensed text-base tracking-widest uppercase text-white font-bold">
    TALENTOS FÍSICOS
  </h3>
  <div class="flex-1 h-px bg-white/20 ml-2"></div>
</div>
```

### 6.2 Bolinhas de Pontuação (Talentos / Perícias)
- Diâmetro: `12px`.
- **Preenchida**: Branca sólida com leve brilho ou borda fina preta.
- **Vazia**: Fundo `noir-base` com borda fina `rgba(255, 255, 255, 0.3)`.
- **Especialização**: Circundada por halo sutil em carmesim ou dourado suave.

### 6.3 Botões de Ação Noir
- Fundo: `noir-card` (`#121216`).
- Borda: `1px solid rgba(255, 255, 255, 0.15)`.
- Hover: Borda e texto em `crimson-blood` (`#c82434`) com sombra suave `0 0 12px rgba(200, 36, 52, 0.25)`.

---

## 7. Mapeamento no Tailwind CSS v4

As variáveis de tema devem ser registradas no arquivo global `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Cores Base Noir */
  --color-noir-base: #08080a;
  --color-noir-card: #121216;
  --color-noir-subtle: #18181f;
  --color-noir-input: #0c0c0f;
  --color-noir-banner: #000000;

  /* Cores de Texto Noir */
  --color-noir-text-primary: #ffffff;
  --color-noir-text-secondary: #b8b8c2;
  --color-noir-text-muted: #6a6a75;

  /* Bordas Noir */
  --color-noir-border: rgba(255, 255, 255, 0.12);
  --color-noir-border-strong: rgba(255, 255, 255, 0.25);

  /* Carmesim Cirúrgico */
  --color-crimson-blood: #c82434;
  --color-crimson-dark: #68111a;
  --color-crimson-aggravated: #800008;
  --color-crimson-beast: #991b1b;

  /* Famílias Tipográficas */
  --font-display: var(--font-cinzel), serif;
  --font-condensed: var(--font-bebas), sans-serif;
  --font-body: var(--font-inter), sans-serif;
}
```

---

Este documento constitui o guia formal para qualquer desenvolvimento ou refatoração visual no ChronicleOS a partir deste branch.
