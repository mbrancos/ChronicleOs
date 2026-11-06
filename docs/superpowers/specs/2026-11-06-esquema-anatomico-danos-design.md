# Documento de Design: Esquema Anatômico Interativo de Registro de Danos (Marco EAD1)

**Data:** 06/11/2026  
**Sistema:** ChronicleOS — Módulo "As Regras de Ouro" (Sistema Izandro)  
**Status:** Aprovado (Marco EAD1)

---

## 1. Visão Geral e Objetivos

O **Esquema Anatômico Interativo de Registro de Danos** substitui os antigos rastreadores genéricos de pontos de vida por uma interface cirúrgica e imersiva inspirada na *Tabela de Vitalidade* do Sistema Izandro. O objetivo é unir o impacto estético do design system **Noir Carmesim** (alto contraste chiaroscuro, fundo preto carvão, iluminação vascular carmesim) com uma experiência de usuário ágil, sem fricção e de alta precisão tática durante as sessões de RPG.

### Decisão de Design (Evolução "Mais Bonito" — Marco EAD1)
Em vez de reproduzir a estética rústica de papel pergaminho escaneado dos livros originais dos anos 90, o design adotado segue a direção **EAD1**:
- Fundo preto profundo (`#060608`) com gradiente radial sutil carmesim (`rgba(200, 36, 52, 0.18)`).
- Silhueta muscular e vascular écorché em alta definição (`corpo-recortado.jpg`, proporção 383 &times; 808 px) sem margens mortas.
- **Vetorização 1:1 exata pixel a pixel**: Os 9 setores corporais possuem contornos vetoriais SVG reais rastreados sobre a silhueta da arte (incluindo curvatura do crânio, deltoides, costelas e dedos individuais das mãos).
- Ao passar o mouse ou selecionar um membro, toda a borda do desenho se acende com contorno carmesim e brilho cirúrgico (*glow*).
- **Gaveta Tática Flutuante/Lateral**:
  - Quando nenhum membro está selecionado: Exibe a **Visão Geral do Corpo**, mostrando a penalidade máxima ativa e a lista clicável de membros atingidos.
  - Ao selecionar um membro: Exibe cabeçalho, descrição tática e matriz rigorosa de pips em CSS Grid (`50px 1fr 1fr 1fr`).
  - **Deseleção de 1 clique**: Clicar fora do corpo ou do quadro desseleciona o membro ativo imediatamente.

---

## 2. Mapeamento das 9 Regiões Anatômicas e Vetorização

O sistema utiliza a rolagem de **1d10** para sorteio de impacto aleatório e mapeamento dos 9 setores anatômicos:

| Setor | d10 | Vital? | Contusivo (🩹) | Letal (🗡️) | Agravado (🔥) | Escala de Penalidades | Descrição Tática |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **Cabeça** | `1` | Sim | 5 caixas | 4 caixas | 3 caixas | `0`, `-1`, `-2`, `-4`, `X` | Afeta Percepção e Ações Mentais; Torpor em X |
| **Pescoço** | `0` | Sim | 5 caixas | 4 caixas | 3 caixas | `0`, `-1`, `-2`, `-4`, `X` | Ponto carotídeo crítico; Decapitação em X |
| **Tórax** | `5 • 6` | Sim | 7 caixas | 6 caixas | 5 caixas | `0`, `0`, `-1`, `-2`, `-3`, `-4`, `X` | Protege o Coração Cainita; Torpor em X |
| **Braço D.** | `2` | Não | 5 caixas | 4 caixas | 3 caixas | `0`, `-1`, `-2`, `-3`, `X` | Reduz parada de dados para ataques físicos |
| **Braço E.** | `9` | Não | 5 caixas | 4 caixas | 3 caixas | `0`, `-1`, `-2`, `-3`, `X` | Afeta escudo e empunhadura secundária |
| **Mão D.** | `3` | Não | 4 caixas | 3 caixas | 2 caixas | `0`, `-1`, `-2`, `X` | Força desarmamento em X |
| **Mão E.** | `8` | Não | 4 caixas | 3 caixas | 2 caixas | `0`, `-1`, `-2`, `X` | Destreza manual e empunhadura secundária |
| **Perna D.** | `4` | Não | 6 caixas | 5 caixas | 4 caixas | `0`, `0`, `-1`, `-2`, `-3`, `X` | Afeta Esquiva, Atletismo e Deslocamento |
| **Perna E.** | `7` | Não | 6 caixas | 5 caixas | 4 caixas | `0`, `0`, `-1`, `-2`, `-3`, `X` | Reduz mobilidade; Queda ao solo em X |

### Posicionamento e Vetores (Sistema `viewBox="0 0 383 808"`)
- A arte base (`corpo-recortado.jpg`) e os caminhos vetoriais compartilham o mesmo espaço de coordenadas exatas de `383 × 808`, garantindo alinhamento pixel-perfect em qualquer escala responsiva.
- Posições nodais do d10:
  - Cabeça: `left: 50.13%, top: 5.57%` (testa, acima dos olhos).
  - Pescoço: `left: 50.13%, top: 16.83%` (pomo de adão / garganta).
  - Tórax: `left: 50.13%, top: 34.65%` (centro anatômico entre peito e abdômen).
  - Braço D.: `left: 24.02%, top: 29.08%` | Braço E.: `left: 76.24%, top: 29.08%`
  - Mão D.: `left: 13.58%, top: 51.73%` | Mão E.: `left: 86.68%, top: 51.73%`
  - Perna D.: `left: 39.69%, top: 69.93%` | Perna E.: `left: 60.57%, top: 69.93%`

---

## 3. Arquitetura de Componentes

### 3.1 `AnatomicalSilhouetteSVG.tsx`
- **Responsabilidade**: Renderização gráfica da silhueta do corpo.
- **Camadas**:
  1. `<image>` com o desenho anatômico de fundo (`corpo-recortado.jpg`).
  2. `<g>` com os caminhos vetoriais (`<path>`) das 9 regiões anatômicas contendo estilos reativos a hover e seleção.
  3. `<g>` com linhas pontilhadas de mira cirúrgica conectando cada setor à margem.
  4. Camada HTML com os 9 botões circulares interativos (`.sector-node`) exibindo o número do d10 e o badge da penalidade quando ferido.
- **Props**:
  - `vitality: AnatomicalVitality`
  - `selectedSector: BodySectorId | null`
  - `hoveredSector: BodySectorId | null`
  - `onSelectSector: (sectorId: BodySectorId) => void`
  - `onHoverSector: (sectorId: BodySectorId | null) => void`
  - `disabled?: boolean`

### 3.2 `AnatomicalHealthTracker.tsx`
- **Responsabilidade**: Contêiner tático de controle e registro de danos.
- **Estrutura**:
  - Barra superior: Título e botões `🎲 Rolar d10` (sorteio aleatório e destaque visual) e `Limpar Danos`.
  - Área central dividida em duas colunas:
    - Coluna esquerda: `AnatomicalSilhouetteSVG`.
    - Coluna direita: Gaveta cirúrgica reativa (com estado geral de integridade e estado individual de membro).
  - Ouvinte de clique global (`document.addEventListener("click")`) para desselecionar quando o usuário clica fora do boneco e da gaveta.

### 3.3 `RegrasDeOuroSheetView.tsx`
- Substitui a chamada ao protótipo anterior pelo componente `AnatomicalHealthTracker` oficial, sincronizando as alterações com o autosave da ficha do jogador.

---

## 4. Regras de Negócio e Mecânicas de Dano

1. **Marcação de Dano Direta (1 Clique)**:
   - Clicar em um círculo vazio preenche o dano até aquele índice.
   - Clicar no último círculo preenchido remove o dano.
2. **Cálculo de Penalidade**:
   - Cada membro tem uma sequência de limiares de penalidade (`rows`).
   - O dano total (normal + letal + agravado) determina o índice da pior penalidade ativa do membro.
   - Quando atinge o nível `X`, o membro é considerado incapacitado.
3. **Cura com Vitæ**:
   - Um botão de cura consome 1 ponto de Vitæ do vampiro e cura:
     - 1 dano agravado (se houver), ou
     - 1 dano letal (se houver e não houver agravado), ou
     - todos os danos contusivos daquele membro.
   - Atualiza `onChangeBlood(currentBlood - 1)`.

---

## 5. Verificação e Critérios de Aceite

- [x] O contorno vetorial casa 100% com as bordas físicas do desenho em todas as 9 regiões.
- [x] O nó 1 da cabeça fica na testa, acima dos olhos.
- [x] O nó 0 fica no pescoço e o 5•6 no meio do tórax/abdômen.
- [x] As colunas de pips ficam matematicamente alinhadas via CSS Grid.
- [x] Clicar fora desmarca o setor e exibe o resumo corporal.
- [x] O comando de build (`npm run build`) e testes passam sem erros de TypeScript ou Next.js.
