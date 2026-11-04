# As Regras de Ouro 2.0 (E ainda chove)
## Módulo 06: Sistemas, Mecânica de Dados, Combate e Vitalidade

Este módulo reúne a mecânica operacional de resolução de testes, o sistema de combate físico/armado, a silhueta anatômica de Vitalidade com seus 9 setores, regras de sangue e as tabelas de Pânico e Diablerie.

---

### 1. Resolução de Testes e Mecânica de Dados

1. **Tipo de Dado:** Utiliza exclusivamente dados de dez faces ($d10$).
2. **Montagem da Parada de Dados:**
   - Em testes de ação, a parada básica é formada pela soma de **dois Talentos** (ou **Talento + Disciplina** / **Talento + Virtude**).
   - O nível da **Palavra-Chave** relevante altera diretamente o número de dados lançados:
     - `Fraco`: $-2$ dados na parada
     - `Médio`: $+0$ dados (padrão para qualquer tema não listado)
     - `Bom`: $+1$ dado na parada
     - `Ótimo`: $+2$ dados na parada
     - `Excepcional`: $+3$ dados na parada
     - `Extraordinário`: $+4$ dados na parada
3. **Dificuldade e Sucessos:**
   - O teste é realizado contra uma **Dificuldade** (valor de 2 a 10 estipulado pelo Narrador ou por um valor passivo do alvo).
   - Todo dado com resultado igual ou superior à Dificuldade conta como **1 Sucesso**.
   - **Falha:** Nenhum dado atinge a Dificuldade.
   - **Falha Crítica:** Nenhum dado atinge a Dificuldade e pelo menos um dado resulta em **1**.
4. **Disputas Resistidas:**
   - Ambos os lados rolam suas respectivas paradas contra a dificuldade estipulada; quem acumular mais sucessos líquidos vence a disputa.

---

### 2. Combate Físico e Manobras

O combate é dividido em turnos dinâmicos. A Iniciativa e os valores passivos de defesa são determinados matematicamente.

#### 2.1 Iniciativa e Defesa Passiva
- **Iniciativa do Turno:** Calculada por $\text{Espacial} + \text{Agilidade} + 1d10$ (personagens com *Velocidade do Pensamento* agem sempre primeiro).
- **Defesa Passiva do Alvo:** A Dificuldade básica para acertar um oponente é igual a:
  $$\text{Dificuldade do Ataque} = \text{Espacial} + \text{Agilidade do Alvo}$$
- **Ataques por Flancos ou Retaguarda:**
  - Flanco: $+1$ dado de bônus na parada do atacante.
  - Retaguarda (pelas costas): $+2$ dados de bônus na parada do atacante.

#### 2.2 Manobras de Combate Próximo
- **Socar (Socos, cotoveladas, cabeçadas):**
  - *Teste:* $\text{Agilidade} + \text{Força}$ vs. Defesa Passiva do alvo.
  - *Dano:* Contusivo igual a $\lceil \text{Força} / 2 \rceil$ ($+$ Palavra-Chave até $+2$).
  - *Soco Inglês:* Converte o dano contusivo para **Dano Letal**.
- **Chutar (Chutes, joelhadas):**
  - *Teste:* $\text{Agilidade} + \text{Força} - 1$ dado vs. Defesa Passiva do alvo.
  - *Dano:* Contusivo igual a $\text{Força}$ ($+$ Palavra-Chave até $+2$).
- **Facas e Punhais:**
  - *Teste:* $\text{Agilidade} + \text{Destreza}$ vs. Defesa Passiva do alvo.
  - *Dano:* Letal igual a $\text{Força} + 1$ ($+$ Palavra-Chave até $+2$).
- **Espadas e Lâminas Médias:**
  - *Teste:* $\text{Agilidade} + \text{Força}$ vs. Defesa Passiva do alvo.
  - *Dano:* Letal igual a $\text{Força} + 3$ ($+$ Palavra-Chave até $+2$).
- **Machados de Guerra:**
  - *Teste:* $\text{Agilidade} + \text{Força}$ vs. Defesa Passiva do alvo.
  - *Dano:* Letal igual a $\text{Força} + 4$. Ignora naturalmente 2 a 4 pontos de Redução de Dano (RD) de armaduras convencionais.
- **Marretas e Martelos de Batalha:**
  - *Teste:* $\text{Agilidade} + \text{Força}$ vs. Defesa Passiva do alvo.
  - *Dano:* Letal igual a $\text{Força} + 3$. Ignora 1 a 2 pontos de RD.
- **Motosserra:**
  - *Teste:* $\text{Agilidade} + \text{Destreza}$ vs. Defesa Passiva do alvo.
  - *Dano:* **3 pontos de Dano Agravado por turno** de contato contínuo. Ignora 5 níveis de RD.

#### 2.3 Combate com Armas de Fogo
Todas as armas de fogo causam **Dano Letal**:
- **Disparo Individual:** Teste de $\text{Espacial} + \text{Destreza}$ vs. Defesa Passiva.
- **Tiros Múltiplos:** Cada tiro após o primeiro impõe penalidade cumulativa de $-1$ dado na parada devido ao recuo.
- **Rajada Curta (3 tiros):** $+3$ no dano da arma, penalidade de $-2$ dados na parada de ataque.
- **Modo Automático:** Descarrega o pente em um único alvo. Causa $+10$ no dano da arma, mas sofre penalidade de $-4$ dados na parada de ataque.

---

### 3. Vitalidade Anatômica (Os 9 Setores do Corpo)

A saúde do personagem é rastreada individualmente em um diagrama da silhueta corporal dividido em **9 setores**:
- **3 Setores Vitais:** Cabeça, Pescoço, Tórax.
- **6 Setores Não-Vitais:** Braço Direito, Braço Esquerdo, Mão Direita, Mão Esquerda, Perna Direita, Perna Esquerda.

#### 3.1 Tipos de Dano e Transbordamento (*Overflow*)
Cada setor do corpo possui três colunas de caixas:
1. **Dano Normal (Contusivo):** Pancadas, socos, quedas, choques mecânicos.
2. **Dano Letal:** Facadas, lâminas, balas de armas de fogo, mordidas.
3. **Dano Agravado:** Fogo, luz solar direta, garras sobrenaturais (Proteísmo), ácido de Quietus, motosserras.

**Mecânica de Transbordamento:**
- Se todas as caixas de **Dano Normal** de um setor forem preenchidas, qualquer novo dano normal naquele setor transborda e é registrado como **Dano Letal**.
- Se todas as caixas de **Dano Letal** de um setor forem preenchidas, danos letais adicionais transbordam e são registrados como **Dano Agravado**.

#### 3.2 Penalidades por Ferimento
Conforme os níveis de um setor são marcados, ativam-se penalidades progressivas ($-1, -2, -3$):
- **Setores Não-Vitais (Membros):** A penalidade aplica-se **apenas** a ações que utilizem aquele membro ferido específico. As penalidades entre membros não são cumulativas (usa-se a pior daquele membro).
- **Setores Vitais (Cabeça, Pescoço, Tórax):** A penalidade sobre uma parte vital afeta o **corpo inteiro**. Se o tórax sofrer uma penalidade de $-2$, todas as partes do corpo que tenham penalidade menor assumem $-2$.

#### 3.3 Incapacitação ("x")
Ao atingir o nível crítico marcado com "x":
- **Dano Normal em Setor Não-Vital:** O membro fica dormente e inutilizado temporariamente.
- **Dano Normal em Setor Vital:** O personagem cai contorcendo-se de dor (se for na Cabeça, desmaia por $1d10$ minutos).
- **Dano Letal em Setor Não-Vital:** Membro severamente estraçalhado; necessita de cuidados cirúrgicos.
- **Dano Letal em Setor Vital:** Mortais morrem. Vampiros entram em **Torpor paralisante** (se o dano letal incapacitar a **Cabeça**, o vampiro sofre a **Morte Final imediata**).
- **Dano Agravado em Setor Não-Vital:** Membro permanentemente destruído/amputado. Vampiros regeneram o membro após dias iguais à metade de sua Geração.
- **Dano Agravado em Setor Vital:** **Morte Final imediata e irrevogável** para vampiros e mortais (decapitação, tórax vaporizado).

#### 3.4 Cura com Vitæ
- **Dano Normal:** 1 Vitæ cura instantaneamente todos os danos normais de uma das 9 regiões do corpo.
- **Dano Letal:** 1 Vitæ cura 1 ponto de dano letal no setor desejado.
- **Dano Agravado:** 1 Vitæ cura 1 ponto de dano agravado, limitado a 1 ponto por noite para cada um dos 9 setores do corpo.

---

### 4. Sangue e Vitæ

- **Capacidade de Vitæ:**
  - Mortal adulto saudável: 10 pontos de sangue mortal.
  - Vampiro 13ª Geração: 10 Vitæ (gasto máximo de 1 por turno).
  - Vampiro 12ª Geração: 11 Vitæ (1 por turno).
  - Vampiro 11ª Geração: 12 Vitæ (1 por turno).
  - Vampiro 10ª Geração: 13 Vitæ (1 por turno).
  - Vampiro 9ª Geração: 14 Vitæ (2 por turno).
  - Vampiro 8ª Geração: 15 Vitæ (3 por turno).
- **Fontes Alimentares de Sangue:**
  - Rato: $1/2$ ponto de sangue
  - Gato: 1 ponto
  - Cão: 2 pontos
  - Vaca: 5 pontos
  - Humano adulto: 10 pontos
  - Lupino (Lobisomem): 25 pontos de sangue hiper-energético

---

### 5. Verificação de Pânico

Sempre que um personagem cometer Falha Crítica em teste de $\text{Emocional} + \text{Coragem}$ diante de horror extremo ou fogo, deve rolar a tabela de Pânico:
$$\text{Resultado} = 1d10 + \text{Emocional}$$

| Resultado | Efeito do Pânico |
| :---: | :--- |
| **15** | Atônito. Perde a ação por 1 turno. |
| **14** | Atordoado. Perde a ação por 2 turnos. |
| **13** | Acesso de vômito / náusea violenta. Perde a ação por 5 turnos. |
| **12** | Atônito e adquire uma Peculiaridade psicológica temporária. |
| **11** | Atordoado e adquire uma Peculiaridade. |
| **10** | Acesso de vômito e adquire uma Peculiaridade permanente. |
| **9** | Desmaia imediatamente por $1d10$ minutos. |
| **8** | Desmaio grave por $2d10$ minutos; sofre 1 ponto de dano letal no tórax por choque cardíaco. |
| **7 ou menos** | Estado de choque catatônico profundo. Desmaio por $4d10$ minutos e sequela mental. |

---

### 6. Diablerie (O Amaranto)

O consumo da alma e do sangue de outro vampiro:
- O agressor deve imobilizar a vítima e drenar toda a sua Vitæ até secá-la.
- Em seguida, deve continuar sugando a essência vital espiritual do coração da vítima.
- Disputa-se uma contenda de **Campo Pessoal do Diablerista vs. Campo Pessoal da Vítima**:
  - Se o diablerista vencer: consome a alma da vítima, sua Geração é reduzida em 1 nível permanente e sua aura ganha veios negros fluorescentes (*mancha de diablerie* visível por Auspícios por um ano por geração da vítima).
  - Se o diablerista falhar: a alma da vítima pode resistir ou, em falhas críticas, a personalidade da vítima sobrepuja a mente do diablerista, tomando controle de seu corpo.
