# As Regras de Ouro 2.0 (E ainda chove)
## Módulo 06: Sistemas, Mecânica de Dados, Combate e Vitalidade

Este módulo reúne a mecânica operacional completa do sistema *As Regras de Ouro 2.0*: a resolução de testes por dados de dez faces ($d10$), manobras de combate corporal e à distância, regras de cobertura e penetração de armadura (RD), perigos ambientais e substâncias no sangue, a silhueta anatômica de Vitalidade com seus 9 setores e transbordamento de dano, e as tabelas integrais de Verificação de Pânico (1 a 15) e Diablerie (-10 a +10).

---

### 1. Resolução de Testes e Mecânica de Dados

1. **Tipo de Dado e Rolagem:**
   - Utiliza exclusivamente dados de dez faces ($d10$).
   - Nas ações ativas, lança-se $1d10 + \text{Parada de Dados}$ contra uma **Dificuldade** estipulada pelo Narrador (ou $1d10 + \text{Dificuldade}$ em disputas resistidas).
   - **Regra de Ouro da Parada:** Nunca se utiliza mais do que duas características (dois Talentos, Talento + Disciplina ou Talento + Virtude) em uma única parada de teste.

2. **Influência das Palavras-Chave:**
   - O grau da **Palavra-Chave** relevante para a ação modifica diretamente o total de dados lançados:
     - `Fraco`: $-2$ dados na parada de dados.
     - `Médio`: $+0$ dados (padrão implícito para qualquer assunto/tema não registrado na ficha).
     - `Bom`: $+1$ dado na parada.
     - `Ótimo`: $+2$ dados na parada.
     - `Excepcional`: $+3$ dados na parada (ou $+1$ nível no Talento se este estiver em 5+).
     - `Extraordinário`: $+4$ dados na parada (ou $+2$ níveis no Talento se este estiver em 5+).

3. **Sucessos, Falhas e Críticos:**
   - **Sucesso:** Atingir ou superar a Dificuldade do teste.
   - **Sucesso Automático:** Fora de situações de estresse, perigo ou combate, se a Parada do personagem for igual ou superior à Dificuldade estipulada, a tarefa é considerada automaticamente bem-sucedida, dispensando a rolagem do dado.
   - **Crítico:** Um resultado **10 natural** no dado garante um Sucesso Crítico (superação excepcional ou benefício dramático adicional).
   - **Falha Crítica:** Ocorre quando o teste falha e o dado exibe um **1 natural**. Gera um revés desastroso ou traumático. Em testes de $\text{Emocional} + \text{Coragem}$, uma Falha Crítica desencadeia imediatamente uma **Verificação de Pânico**.

4. **Ações Prolongadas e Ações Múltiplas:**
   - **Ação Prolongada:** Tarefas complexas (pesquisa científica, conserto de motor, forja de armas, rituais arcanos) exigem o acúmulo de uma quantidade pré-determinada de sucessos ao longo de várias horas, dias ou semanas de jogo.
   - **Ações Múltiplas:** Declarar duas ou mais ações em um único turno reduz a parada da primeira ação em $-1$ dado, a da segunda em $-2$ dados, a terceira em $-3$ dados, e assim sucessivamente. Personagens com disciplinas como *Celeridade / Rapidez* agem sem essa penalidade em suas ações adicionais.

---

### 2. Sistemas de Combate

O combate é estruturado em turnos táticos com iniciativa dinâmica, defesa passiva e declaração simultânea de intenções.

#### 2.1 Iniciativa e Defesa Passiva
- **Iniciativa:** $\text{Espacial} + \text{Agilidade} + 1d10$. O personagem com maior resultado age primeiro no turno.
  - *Velocidade do Pensamento (Celeridade 1.1):* Permite agir antes de qualquer oponente sem poder semelhante.
- **Defesa Passiva Básica:** A Dificuldade base para atingir um alvo é:
  $$\text{Defesa Passiva} = \text{Espacial} + \text{Agilidade do Alvo}$$
- **Modificadores Posicionais:**
  - **Ataque pelo Flanco:** $+1$ dado de bônus na parada do atacante.
  - **Ataque pela Retaguarda (Costas):** $+2$ dados de bônus na parada do atacante.
  - **Alvo Caído / Imobilizado:** $+2$ a $+4$ dados de bônus para o atacante.
  - **Mão Inábil:** Realizar ataques com a mão inábil impõe penalidade de $-2$ dados na parada (anulada pela vantagem *Ambidestro*).
  - **Duas Armas:** Empunhar duas armas requer ações múltiplas (ou a vantagem *Pistoleiro* para armas de fogo de pequeno porte).

#### 2.2 Manobras de Combate Próximo (Corporal e Armas Brancas)

| Manobra / Arma | Parada de Teste | Dano Causado | Propriedades Especiais |
| :--- | :--- | :--- | :--- |
| **Socar / Cabeçada** | $\text{Agilidade} + \text{Força}$ | Contusivo: $\lfloor \text{Força}/2 \rfloor$ | Soco-inglês converte para dano Letal. |
| **Chutar** | $\text{Agilidade} + \text{Força} - 1$ | Contusivo: $\text{Força}$ | $-1$ na parada pela perda de equilíbrio. |
| **Garras Sobrenaturais** | $\text{Agilidade} + \text{Força}$ | Agravado: $\lfloor \text{Força}/2 \rfloor + 1$ | Dano Agravado puro (Metamorfose 2). |
| **Encontrão** | $\text{Agilidade} + \text{Força}$ | Contusivo: $\text{Força}$ | Derruba o alvo se superar o Vigor do oponente. |
| **Agarrar / Imobilizar** | $\text{Agilidade} + \text{Força}$ | Nenhum (apenas contenção) | Alvo imobilizado só pode tentar soltar-se na sua ação. |
| **Morder (O Beijo)** | $\text{Agilidade} + \text{Força}$ | Letal: $\lfloor \text{Força}/2 \rfloor$ | Permite drenar 1 Vitæ por turno em seguida. |
| **Lâminas Pequenas (Facas, Punhais)** | $\text{Agilidade} + \text{Destreza}$ | Letal: $\lfloor \text{Força}/2 \rfloor + 1$ | Ocultável facilmente sob roupas. |
| **Lâminas Médias (Espadas, Cimitarras)** | $\text{Agilidade} + \text{Força}$ | Letal: $\text{Força} + 2$ | Alcance médio balanceado. |
| **Lâminas de Duas Mãos (Montantes)** | $\text{Agilidade} + \text{Força}$ | Letal: $\text{Força} + 4$ | Exige ambas as mãos; ignora 1 ponto de RD. |
| **Bastões, Maças e Cassetetes** | $\text{Agilidade} + \text{Força}$ | Contusivo: $\text{Força} + 2$ | Se desferido na Cabeça, converte para Letal. |
| **Machados e Machadinhas** | $\text{Agilidade} + \text{Força}$ | Letal: $\text{Força} + 4$ | **Ignora de 2 a 4 pontos de RD** de armaduras. |
| **Marretas e Martelos de Guerra** | $\text{Agilidade} + \text{Força}$ | Contusivo: $\text{Força} + 3$ | **Ignora 1 a 2 pontos de RD** por esmagamento. |
| **Motosserra** | $\text{Agilidade} + \text{Destreza}$ | Agravado: 3 pontos / turno | **Ignora 5 pontos de RD** de blindagens comuns. |

#### 2.3 Combate com Armas de Fogo e à Distância

Todas as armas de fogo causam **Dano Letal** e não podem ser esquivadas sem que o defensor se lance fisicamente para trás de uma cobertura.

- **Defesa Contra Armas de Fogo:**
  - Só é possível defender-se de armas de fogo jogando-se ativamente para trás de uma **cobertura completa**.
  - Esta esquiva emergencial deixa o personagem **automaticamente caído** no chão até o início do próximo turno.
  - A Dificuldade da esquiva é calculada como $\text{Sucessos do Atacante} + 2$.
- **Mirar:** Gastar 1 turno inteiro mirando em um alvo estático concede $+2$ dados de bônus no disparo no turno seguinte.
- **Tiros Múltiplos:** Disparar mais de uma vez no mesmo turno impõe penalidade de $-1$ dado na parada para cada tiro subsequente além do primeiro, devido ao coice da arma.
- **Rajada Curta (3 tiros semiautomáticos):**
  - Adiciona $+3$ ao dano da arma contra o alvo visado.
  - Penalidade de $-2$ dados na parada de ataque.
- **Modo Automático Total:**
  - Descarrega pelo menos metade do carregador em um único alvo.
  - Adiciona $+10$ ao dano básico da arma.
  - Penalidade severa de $-4$ dados na parada de ataque pelo recuo violento.
- **Efeito Mangueira (Supressão em Arco):**
  - Espalha fogo contínuo em rajada em um cone de até 45 graus.
  - Afeta todos os alvos dentro do arco: cada alvo deve testar esquiva ou sofrer o dano base da arma $+2$.
- **Recarregar:** Recarregar um carregador ou municiar a arma consome 1 turno completo de ação.

#### 2.4 Redução de Dano (RD) e Coberturas

Armaduras e barreiras físicas absorvem dano antes que ele atinja os níveis de vitalidade do corpo:
- **Roupa de Couro Pesado:** RD 1 (apenas contra dano contusivo e cortes leves).
- **Colete Balístico Kevlar Leve:** RD 2 contra projéteis e lâminas no Tórax.
- **Colete Tático Militar com Placas de Cerâmica:** RD 4 contra armas de fogo no Tórax.
- **Cobertura de Madeira / Drywall:** RD 1 a 2; reduz a parada do atacante em $-1$ a $-2$ dados.
- **Cobertura de Alvenaria / Tijolo Maciço:** RD 4; reduz a parada em $-3$ dados.
- **Carcaça de Automóvel / Bloco de Motor:** RD 6 a 8; bloqueia disparos de pequeno porte.
- **Blindagem Pesada de Aço:** RD 10; imune a armas convencionais de mão.

---

### 3. Fontes Ambientais e Perigos Extremos

| Perigo | Efeito Mecânico | Observações |
| :--- | :--- | :--- |
| **Quedas Livres** | 1 ponto de dano letal por metro de queda livre acima do 3º metro não amortecido. | Se amortecida com acrobacia/sucesso em $\text{Agilidade} + \text{Espacial}$, converte para contusivo. |
| **Luz Solar Direta** | 1 a 3 pontos de **Dano Agravado por turno** de exposição, dependendo da intensidade da luz. | Setitas não podem absorver dano do sol por nenhum meio. |
| **Luz Solar Difusa / Nublado** | 1 ponto de Dano Agravado por minuto de exposição. | Queima a carne e gera fumaça com cheiro de matéria queimada. |
| **Fogo (Tocha / Fogueira)** | 1 a 3 pontos de **Dano Agravado por turno** de contato contínuo. | Exige teste de $\text{Emocional} + \text{Coragem}$ para evitar o Terror do *Rötschreck*. |
| **Inanição (Fome Mortal)** | 1 ponto de dano letal no Tórax a cada 3 dias sem alimentação (ou 1 dia sem água). | Ignora completamente qualquer valor de RD ou Vigor. |
| **Asfixia (Gás / Afogamento)** | 1 ponto de dano letal no Tórax a cada turno após prender a respiração por minutos iguais ao Vigor. | Vampiros são mortos-vivos e não sofrem asfixia pulmonar. |
| **Eletrocução** | 1 a 5 pontos de dano letal no setor em contato elétrico; paralisia muscular reflexa imediata. | Se for na Cabeça ou Tórax, exige teste de Vigor contra Dificuldade 8 para não desmaiar. |

#### Intoxicação por Sangue Contaminado
Vampiros que se alimentam de mortais sob o efeito de substâncias psicoativas ou venenos absorvem os efeitos:
- **Álcool:** Subtrai $-1$ dado das paradas de teste de Destreza e Agilidade durante $1d10$ horas.
- **Maconha:** Tempo de reação fica lento e sonolento; perde $-1$ na Iniciativa e $-1$ em testes de percepção por $1d10$ horas.
- **Alucinógenos (LSD, Psilocibina):** Todas as paradas de teste sofrem penalidade de $-2$ dados; ilusões vívidas distorcem a percepção sensorial.
- **Cocaína / Crack / Metanfetamina:** A Dificuldade para resistir ao Frenesi aumenta em $+2$ pontos; a Besta fica agitada e violenta.
- **Heroína / Opióides / Barbitúricos:** Subtrai $-2$ de todos os testes de Força e Agilidade; o vampiro entra em estado apático e prostrado.
- **Salmonella / Envenenamento Alimentar:** O vampiro fica enjoado e deve testar $\text{Vigor} + \text{Autocontrole}$; se falhar, vomita todo o sangue ingerido perdendo o Vitæ correspondente.
- **Veneno / Toxinas Químicas:** Subtrai $-1$ de todas as paradas por $2d10$ horas até que o sangue seja filtrado ou expurgado do organismo.

---

### 4. Vitalidade Anatômica (Os 9 Setores do Corpo)

A vitalidade não é um medidor abstrato universal de pontos de vida. Ela é mapeada em uma silhueta do corpo humano dividida em **9 setores anatômicos**:
- **3 Setores Vitais:** Cabeça, Pescoço, Tórax.
- **6 Setores Não-Vitais:** Braço Direito, Braço Esquerdo, Mão Direita, Mão Esquerda, Perna Direita, Perna Esquerda.

#### 4.1 Níveis de Dano e Transbordamento (*Overflow*)
Cada setor possui caixas divididas em três tipos de dano:
1. **Dano Normal (Contusivo):** Pancadas, quedas, socos, pancadas de bastão.
2. **Dano Letal:** Facadas, tiros de armas de fogo, mordidas, cortes de lâminas.
3. **Dano Agravado:** Fogo, luz solar, garras sobrenaturais, feitiços taumatúrgicos e motosserras.

**Regra do Transbordamento de Dano:**
- Quando todas as caixas de **Dano Normal** de um setor são preenchidas, qualquer dano contusivo adicional naquele setor transborda automaticamente e é anotado como **Dano Letal**.
- Quando todas as caixas de **Dano Letal** de um setor são preenchidas, ferimentos letais subsequentes transbordam e são anotados como **Dano Agravado**.

#### 4.2 Capacidade e Penalidades por Setor

| Setor Corporal | Tipo | Caixas Normais | Caixas Letais | Caixas Agravadas | Penalidade Máxima |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Cabeça** | Vital | 2 | 2 | 2 | $-3$ / Desmaio / Incapacitação |
| **Pescoço** | Vital | 1 | 1 | 1 | $-2$ / Risco de decapitação |
| **Tórax** | Vital | 4 | 4 | 4 | $-3$ / Colapso cardiovascular |
| **Braço Direito** | Não-Vital | 3 | 3 | 3 | $-2$ (ações do braço direito) |
| **Braço Esquerdo** | Não-Vital | 3 | 3 | 3 | $-2$ (ações do braço esquerdo) |
| **Mão Direita** | Não-Vital | 2 | 2 | 2 | $-2$ (destreza manual direita) |
| **Mão Esquerda** | Não-Vital | 2 | 2 | 2 | $-2$ (destreza manual esquerda) |
| **Perna Direita** | Não-Vital | 3 | 3 | 3 | $-2$ (locomoção / corrida) |
| **Perna Esquerda** | Não-Vital | 3 | 3 | 3 | $-2$ (locomoção / corrida) |

#### 4.3 Efeito das Penalidades
- **Setores Não-Vitais:** A penalidade afeta **estritamente** as ações que utilizam aquele membro ferido. As penalidades entre membros distintos não se somam (usa-se o valor específico do membro empregado na ação).
- **Setores Vitais (Cabeça, Pescoço, Tórax):** A penalidade de um setor vital reflete em debilidade sistêmica geral e afeta **o corpo inteiro**. Se o Tórax estiver em $-2$, qualquer ação corporal do personagem sofrerá pelo menos penalidade de $-2$.

#### 4.4 Incapacitação ("x")
Ao marcar o nível final ("x") de um setor:
- **Dano Normal em Membro:** O membro fica adormecido e inutilizável até ser curado.
- **Dano Normal em Cabeça/Tórax:** Personagem cai contorcendo-se de dor; se for na Cabeça, desmaia por $1d10$ minutos.
- **Dano Letal em Membro:** Membro fraturado/estraçalhado criticamente; requer cirurgia urgente para mortais ou cura vampírica.
- **Dano Letal em Cabeça/Tórax:** Morte para humanos normais. Vampiros entram em **Torpor**. Se a Cabeça for incapacitada por dano letal massivo, o cainita sofre a **Morte Final imediata**.
- **Dano Agravado em Membro:** Membro decepado ou incinerado permanentemente. Vampiros regeneram o membro após repouso prolongado igual à metade de sua Geração em noites.
- **Dano Agravado em Cabeça/Pescoço/Tórax:** **Morte Final instantânea e irrevogável** tanto para mortais quanto para vampiros.

#### 4.5 Cura por Vitæ
- **Dano Normal:** 1 Vitæ cura instantaneamente todas as caixas de dano normal de um setor do corpo.
- **Dano Letal:** 1 Vitæ cura 1 ponto de dano letal no setor desejado.
- **Dano Agravado:** 1 Vitæ cura 1 ponto de dano agravado, restrito ao limite biológico de **apenas 1 ponto de dano agravado por noite** para cada um dos 9 setores do corpo.

---

### 5. Sangue e Vitæ

O sangue é a moeda biológica e sobrenatural dos Cainitas.
- **Sangue em Fontes:**
  - Mortal adulto normal: 10 pontos de sangue humano.
  - Cão: 2 pontos de sangue animal.
  - Vaca / Cavalo: 5 pontos de sangue animal.
  - Lupino (Lobisomem): 25 pontos de Vitæ hiper-concentrada.

| Geração | Vitæ Máxima | Gasto de Vitæ por Turno |
| :---: | :---: | :---: |
| **15ª** | 6 (4 mortal) | 1 |
| **14ª** | 8 (2 mortal) | 1 |
| **13ª** | 10 | 1 |
| **12ª** | 11 | 1 |
| **11ª** | 12 | 1 |
| **10ª** | 13 | 1 |
| **9ª** | 14 | 2 |
| **8ª** | 15 | 3 |
| **7ª** | 20 | 4 |
| **6ª** | 30 | 6 |
| **5ª** | 40 | 8 |
| **4ª** | 50 | 10 |

---

### 6. Tabela Oficial de Verificação de Pânico

Sempre que um jogador obtiver uma **Falha Crítica** em seu teste de $\text{Emocional} + \text{Coragem}$ diante de horror extremo, criaturas aberrantes ou perigo de morte, ou sob determinação direta do Narrador em eventos traumáticos, deve realizar a Verificação de Pânico:
$$\text{Resultado} = 1d10 + \text{Emocional}$$

| Resultado | Efeito do Pânico |
| :---: | :--- |
| **15** | **Atônito:** O personagem perde a ação por 1 turno. |
| **14** | **Atordoado:** O personagem perde a ação por 2 turnos. |
| **13** | **Acesso de Vômito:** Náusea incontrolável; perde a ação por 5 turnos. |
| **12** | **Atônito e Peculiaridade:** Perde a ação por 1 turno e adquire uma Peculiaridade psicológica temporária. |
| **11** | **Atordoado e Peculiaridade:** Perde a ação por 2 turnos e adquire uma Peculiaridade. |
| **10** | **Acesso de Vômito e Peculiaridade:** Perde a ação por 5 turnos e adquire uma Peculiaridade permanente. |
| **9** | **Desmaio Breve:** O personagem desmaia imediatamente por $1d10$ minutos. |
| **8** | **Desmaio Grave:** Permanece inconsciente por $2d10$ minutos e sofre 1 ponto de dano letal no tórax por estresse cardiovascular. |
| **7** | **Estado de Choque:** Desmaio por $4d10$ minutos e sofre 3 pontos de dano letal no tórax. |
| **6** | **Crise Convulsiva:** Perde o controle motor do corpo (cai no chão, contorce-se em convulsões) por $1d10$ minutos. Sofre 3 pontos de dano letal no tórax. |
| **5** | **Pânico Histeriforme:** Corre em círculos, grita, chora ou pratica ações sem sentido durante $1d10$ minutos. Sofre 5 pontos de dano letal no tórax. |
| **4** | **Pânico com Sequela Psíquica:** Pânico idêntico ao nível 5 e adquire compulsoriamente uma **Desvantagem Mental de $-2$ pontos**. |
| **3** | **Pânico com Sequela Física:** Pânico idêntico ao nível 5 e sofre transformação física decorrente do choque extremo (cabelos embranquecidos subitamente, envelhecimento precoce de 5 anos em uma noite ou surdez parcial; adquire $-2$ pontos em Desvantagens Físicas). |
| **2** | **Coma:** Inconsciência profunda durante $1d10$ horas. Ao despertar, adquire $-4$ pontos em Desvantagens Mentais. |
| **1** | **Coma Profundo:** Inconsciência durante $4d10$ horas. Ao despertar, adquire $-4$ pontos em Desvantagens Mentais e **perde 1 nível permanente em um Talento Físico e 1 nível permanente em um Talento Mental**. |

---

### 7. Diablerie (O Amaranto) e Tabela Oficial (-10 a +10)

A Diablerie é o consumo absoluto da alma e da Vitæ de outro vampiro. Ao secar completamente o sangue de um cainita e continuar sugando, o assassino arranca a essência espiritual do coração da vítima.

#### 7.1 Procedimento de Resolução
1. O agressor deve imobilizar a vítima e drenar 100% de sua Vitæ.
2. Em seguida, disputa-se um confronto estrito:
   $$\text{Campo Pessoal do Diablerista} \quad \text{versus} \quad \text{Campo Pessoal da Vítima}$$
   *(Nota: com exceção da vantagem "Vontade de Ferro", nenhum bônus externo pode ser aplicado a esta contenda).*
3. Calcula-se a margem final:
   $$\text{Margem da Diablerie} = \text{Sucessos do Diablerista} - \text{Sucessos da Vítima}$$
4. Consulta-se o resultado na Tabela Oficial abaixo.
5. **Geração e Disciplinas:**
   - A Geração só é reduzida se a vítima for de Geração mais potente que a do diablerista (calcula-se a média aritmética estipulada pelo Narrador).
   - Se a vítima for conhecedora avançada (nível 3 em uma Disciplina), o diablerista pode aprender o 1º ponto naquela Disciplina.
   - Se a vítima for mestra (nível 5 na Disciplina), o ganho pode chegar a 2 pontos.

#### 7.2 Tabela Oficial de Diablerie

| Margem | Efeitos Espirituais e Mecânicos da Diablerie |
| :---: | :--- |
| **+10** | **Vitória Absoluta:** Baixa de Geração. O diablerista pode ganhar pontos em até **3 Disciplinas diferentes** da vítima. As 3 Disciplinas de maior valor da vítima tornam-se como se fossem **disciplinas de clã** para o diablerista (custo de XP reduzido). Adquire todas as memórias da vítima e a desvantagem *Vício: Cometer o Amaranto*. |
| **+9** | **Vitória Triunfal:** Baixa de Geração. Ganha pontos em até 3 Disciplinas da vítima. As **2 Disciplinas de maior valor** tornam-se como de clã. Adquire as memórias da vítima e *Vício: Cometer o Amaranto*. |
| **+8** | **Vitória Maior:** Baixa de Geração. Ganha pontos em até 3 Disciplinas da vítima. A Disciplina de maior valor da vítima torna-se de clã para o diablerista. Adquire as memórias da vítima e *Vício: Cometer o Amaranto*. |
| **+7** | **Vitória Forte:** Baixa de Geração. Ganha pontos em até 3 Disciplinas da vítima. Adquire memórias da vítima e *Vício: Cometer o Amaranto*. |
| **+6, +5, +4** | **Sucesso Amplo:** Baixa de Geração. Ganha pontos em até **2 Disciplinas diferentes** da vítima. Adquire fragmentos seletos das memórias da vítima. |
| **+3, +2** | **Sucesso Moderado:** Baixa de Geração. Ganha pontos em **1 Disciplina** da vítima. Adquire algumas memórias da vítima. |
| **+1** | **Sucesso Mínimo:** Baixa de Geração. Ganha pontos em 1 Disciplina da vítima. Sem assimilação de memórias. |
| **0** | **Empate Estéril:** Baixa de Geração. Não assimila poderes nem memórias da vítima. |
| **-1** | **Fracasso Leve:** Baixa de Geração, mas o diablerista sofre trauma psíquico e deve adquirir ao menos uma **Desvantagem Mental de $-1$ ponto** ligada à psique da vítima. |
| **-2** | **Fracasso Notável:** Baixa de Geração. Deve adquirir ao menos uma **Desvantagem Mental de $-2$ pontos** relacionada à vítima. |
| **-3** | **Fracasso Severo:** Baixa de Geração. Deve adquirir ao menos uma **Desvantagem Mental de $-3$ pontos** relacionada à vítima. |
| **-4** | **Fracasso Traumático:** Baixa de Geração. Deve adquirir um total de **$-4$ pontos em Desvantagens** que representem o trauma da invasão anímica. |
| **-5** | **Fracasso Devastador:** Baixa de Geração. Deve adquirir um total de **$-5$ pontos em Desvantagens** representativas do trauma espiritual. |
| **-6** | **Fracasso Crítico:** Baixa de Geração, mas com estraçalhamento psicológico e fisiológico: deve adquirir compulsoriamente **$-3$ pontos em Desvantagens Mentais, $-3$ pontos em Desvantagens Sobrenaturais e $-2$ pontos em Desvantagens Físicas**. |
| **-7** | **Aniquilação Mútua:** As duas almas entram em combustão psíquica e colapso anímico simultâneo. **O diablerista é obliterado permanentemente junto com a vítima**. |
| **-8** | **Cisão da Besta:** A Besta do diablerista é fraturada e passa a ser **guiada por duas personalidades** simultâneas (o Guia original e a antiga psique do diablerizado atormentando perpetuamente). A Besta recebe $+3$ pontos imediatos em Flagelos. |
| **-9** | **Dominação da Besta:** A psique do diablerizado assume o controle do Guia da Besta do personagem. Realiza-se um novo processo de criação do Guia da Besta com foco nos rancores da vítima; a nova Besta recebe um bônus de $+6$ pontos em Flagelos. |
| **-10** | **Possessão Reversa Absoluta:** **A alma da vítima expurga completamente a psique do diablerista e toma posse definitiva de seu corpo físico**. O antigo diablerista é aniquilado enquanto mente. **O jogador que controlava o diablerista é rebaixado e passa a atuar como o Guia da Besta de seu próprio antigo personagem**, agora personificado pela vítima! |
