import type { SubNivelDisciplina } from "@/types/systems/regrasDeOuro";

export interface PowerLevelDefinition {
  level: number;
  codigoBase: string; // ex: "1.0"
  nome: string;
  descricao: string;
  aprimoramentos: Array<{
    codigo: string; // ex: "1.2", "1.3"
    nome: string;
    descricao: string;
  }>;
}

export interface DisciplineCatalogItem {
  id: string;
  nome: string;
  categoria?: "comum" | "taumaturgia" | "necromancia";
  resumo: string;
  niveis: Record<number, PowerLevelDefinition>;
}

export const DISCIPLINAS_CANONICAS_CATALOGO: Record<string, DisciplineCatalogItem> = {
  // 1. ANIMALISMO
  "Animalismo": {
    id: "animalismo",
    nome: "Animalismo",
    categoria: "comum",
    resumo: "Afinidade sobrenatural com feras e controle da Besta em si e em outros.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "A Voz do Dono",
        descricao: "Comunica-se mentalmente com animais à vista ou toque, respeitando a inteligência natural da fera.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Voz da Espécie", descricao: "Comunica-se com todos os animais da mesma espécie simultaneamente (alcance 1 km; 1d10x10% atendem)." },
          { codigo: "1.3", nome: "Chamado Continental", descricao: "O alcance da comunicação e convocação estende-se por até 10 km." },
          { codigo: "1.4", nome: "Comando Soberano", descricao: "Animais obedecem a qualquer ordem que não envolva perigo óbvio de morte." },
          { codigo: "1.5", nome: "Pacto de São Francisco", descricao: "Comunica-se com múltiplas espécies de animais simultaneamente." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Martelo do Inquisidor",
        descricao: "Sonda a Besta de mortais e carniçais, fazendo perguntas iguais ao Emocional para descobrir instintos e paixões.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Sondagem Cainita", descricao: "Permite sondar a Besta de outros vampiros." },
          { codigo: "2.4", nome: "Olhar Lupino", descricao: "Permite sondar e interrogar a Besta de Lobisomens." },
          { codigo: "2.5", nome: "Olhos da Criação", descricao: "Pode sondar a Besta de qualquer criatura que abrigue o monstro interior." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Exorcismo",
        descricao: "Acalma as paixões da Besta até dormência. Em mortais induz catatonia prazerosa (+1 Líbido para o vampiro).",
        aprimoramentos: [
          { codigo: "3.4", nome: "Onda Pacificadora", descricao: "Afeta todos os alvos legais em um raio de até 10 metros simultaneamente." },
          { codigo: "3.5", nome: "Apaziguar o Sangue", descricao: "Afeta cainitas de geração mais recente, sugando a Líbido deles e encerrando Frenesi." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Açoite de Lázaro",
        descricao: "Ao entrar em Frenesi, transfere sua Besta para outra pessoa à vista, que sofre o Frenesi em seu lugar.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Usurpação do Monstro", descricao: "Envia sua Psique para suplantar a Besta do alvo, tornando-se o novo Guia da Besta dele." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Compartilhar Espírito",
        descricao: "Move sua Psique para o corpo de até 20 animais cuja soma de sangue seja <= à sua reserva, controlando-os em enxame a até 1 km.",
        aprimoramentos: [],
      },
    },
  },

  // 2. AUSPÍCIOS
  "Auspícios": {
    id: "auspicios",
    nome: "Auspícios",
    categoria: "comum",
    resumo: "Sentidos aprimorados, percepção de auras, telepatia e clarividência.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Sentidos Aguçados",
        descricao: "Ato reflexo. Multiplica sentidos em escala absurda (visão no escuro, escuta batimentos a 10m).",
        aprimoramentos: [
          { codigo: "1.2", nome: "Percepção Focalizada", descricao: "Gasta 1 Vitæ para ganhar uma Palavra-Chave em nível Bom em teste com Espacial até o fim da cena." },
          { codigo: "1.3", nome: "Sexto Sentido", descricao: "1x ao dia tem 50% de chance de acerto automático em pura intuição ou sorte." },
          { codigo: "1.4", nome: "Premonição Astral", descricao: "Pode entrar em transe voluntário para ter sonhos premonitórios reveladores." },
          { codigo: "1.5", nome: "Visão dos Mortos", descricao: "Enxerga Wraiths (fantasmas), espíritos da Umbra e entidades astrais." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Tato Empático",
        descricao: "Ato reflexo. Sente emoções, intenções e rastreia o fluxo de Líbido em um raio de 20 metros.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Radar Afetivo", descricao: "Detecta direção e intensidade de emoções mesmo sem visão direta." },
          { codigo: "2.4", nome: "Aura Expandida", descricao: "Alcance estende-se para 50 metros ao redor do cainita." },
          { codigo: "2.5", nome: "Sinal de Alerta", descricao: "Recebe alerta automático sempre que for alvo de emoção forte ou hostil." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Toque do Espírito (Psicometria)",
        descricao: "Toca um objeto para ler impressões sensoriais, memórias e emoções deixadas nele através dos tempos.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Psicometria à Distância", descricao: "Sonda objetos visíveis a até 10m sem necessidade de contato físico." },
          { codigo: "3.5", nome: "Claridade Cristalina", descricao: "Imune a falhas críticas ao realizar leituras psicométricas." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Telepatia",
        descricao: "Estabelece elo mental visual com um alvo para ler ou projetar pensamentos e segredos.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Comunhão da Cripta", descricao: "Vampiros voluntários não oferecem resistência ao elo mental telepático." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Projetar Sentidos",
        descricao: "Desassocia sentidos do corpo, movendo-se no espaço a até 800 km/h (alcance: órbita lunar), atravessando barreiras sólidas.",
        aprimoramentos: [],
      },
    },
  },

  // 3. CELERIDADE / RAPIDEZ
  "Celeridade / Rapidez": {
    id: "celeridade",
    nome: "Celeridade / Rapidez",
    categoria: "comum",
    resumo: "Velocidade sobre-humana, reflexos relâmpago e ações adicionais.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Rapidez",
        descricao: "Ato reflexo (1 Vitæ). Concede 1 ação física adicional no mesmo turno sem penalidade, usando parada total.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Reflexos do Vento", descricao: "Gasta 1 Vitæ para ganhar 2 ações físicas adicionais no mesmo turno." },
          { codigo: "1.3", nome: "Trovão Invisível", descricao: "Gasta 1 Vitæ para ganhar 3 ações físicas adicionais no mesmo turno." },
          { codigo: "1.4", nome: "Besta Tempestuosa", descricao: "Gasta 1 Vitæ para ganhar 4 ações físicas adicionais no mesmo turno." },
          { codigo: "1.5", nome: "Celeridade Suprema", descricao: "Gasta 1 Vitæ para ganhar 5 ações físicas adicionais no mesmo turno." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Caminhar no Éter",
        descricao: "Multiplica velocidade por Celeridade. Permite correr sobre paredes, fios, água e saltar distâncias colossais.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Fuga Etérea", descricao: "A duração do passo etéreo aumenta para 1d10 minutos." },
          { codigo: "2.4", nome: "Passada Contínua", descricao: "A duração estende-se para 30 minutos contínuos." },
          { codigo: "2.5", nome: "Peso das Plumas", descricao: "Não consome Vitæ para acionar o poder de caminhada etérea." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Vento Cortante",
        descricao: "Com Rapidez ativa, todo ataque corporal ou arma branca recebe bônus de +1 no dano (cumulativo com palavras-chave).",
        aprimoramentos: [
          { codigo: "3.4", nome: "Gume do Vácuo", descricao: "Golpes contundentes passam a desferir dano letal lacerante." },
          { codigo: "3.5", nome: "Vácuo Dilacerador", descricao: "Todos os danos de impacto passam a ser classificados como cortantes." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Impulso Primal",
        descricao: "Ativa Rapidez sem gastar Vitæ, sofrendo penalidade cumulativa de dados em ações físicas subsequentes.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Impulso Gracioso", descricao: "A penalidade inicial da primeira ativação é reduzida para zero." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Velocidade do Pensamento",
        descricao: "Acelera o raciocínio em 60x (1s parece 1min). Iniciativa automática, dificuldades físicas pela metade e atos reflexos ilimitados.",
        aprimoramentos: [],
      },
    },
  },

  // 4. DEMÊNCIA
  "Demência": {
    id: "demencia",
    nome: "Demência",
    categoria: "comum",
    resumo: "Canalização da loucura mística para estilhaçar a psique de alvos.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Sinos da Loucura",
        descricao: "Conversa com o alvo por 10 minutos para descobrir todas as suas desvantagens mentais e segredos comportamentais.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Sino Breve", descricao: "A conversa investigativa precisa durar apenas 1 minuto." },
          { codigo: "1.3", nome: "Sondagem de Virtudes", descricao: "Descobre também todas as vantagens mentais e intelectuais do alvo." },
          { codigo: "1.4", nome: "Olhar do Alienista", descricao: "Não precisa conversar: basta observar o alvo em silêncio por 10 minutos." },
          { codigo: "1.5", nome: "Diagnóstico Relâmpago", descricao: "Basta observar o alvo por apenas 1 minuto para diagnosticar sua mente." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Chamas Passionais",
        descricao: "Estimula uma emoção específica. Durante a noite a vítima reage descontroladamente a ela com paradas mentais pela metade.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Fagulha Veloz", descricao: "A indução emocional exige apenas 1 minuto de conversa." },
          { codigo: "2.4", nome: "Fogueira Coletiva", descricao: "Pode afetar uma quantidade de pessoas igual ao nível de Demência." },
          { codigo: "2.5", nome: "Incêndio da Alma", descricao: "As paradas de dados de resistência mental da vítima caem automaticamente para 1." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Delirium Tremens",
        descricao: "Em combate ou estresse, a vítima age por 2 turnos e no 3º fica catatônica por alucinações caleidoscópicas.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Delírio Ágil", descricao: "Conversa preparatória exige apenas 1 minuto." },
          { codigo: "3.5", nome: "Semana dos Monstros", descricao: "A duração do delírio intermitente estende-se por 7 noites inteiras." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Olhos do Caos",
        descricao: "Enxerga conexões ocultas, padrões no caos e decifra mistérios e pistas complexas em 1 turno de concentração.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Visão Diacrônica", descricao: "A sondagem de eventos retroage dias inteiros em vez de horas." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "O Beijo da Lua",
        descricao: "Implanta permanentemente na psique do alvo até 5 pontos em Desvantagens psicológicas e fobias profundas.",
        aprimoramentos: [],
      },
    },
  },

  // 5. DOMINAÇÃO
  "Dominação": {
    id: "dominacao",
    nome: "Dominação",
    categoria: "comum",
    resumo: "Controle mental absoluto e imposição irresistível da Vontade.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Comandar Mentes Fracas",
        descricao: "Disputa de Campo Pessoal com comando verbal imediato de 1 turno ('Pare!', 'Fuja!', 'Solte!').",
        aprimoramentos: [
          { codigo: "1.2", nome: "Língua Universal", descricao: "Afeta o alvo mesmo que ele não compreenda o idioma falado." },
          { codigo: "1.3", nome: "Toque Tirânico", descricao: "Dispensa contato visual direto se estiver tocando o alvo fisicamente." },
          { codigo: "1.4", nome: "Comando Astral", descricao: "Com contato visual, transmite a ordem telepaticamente por sussurro mental." },
          { codigo: "1.5", nome: "Voz do Tirano", descricao: "Dispensa contato visual direto se o alvo puder ouvir nitidamente a voz." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Hipnotizar",
        descricao: "Disputa de Campo Pessoal para implantar comandos complexos e condicionamentos acionados por gatilhos futuros.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Gatilho Poliglota", descricao: "Afeta o alvo mesmo sem compreensão do idioma falado." },
          { codigo: "2.4", nome: "Toque Hipnótico", descricao: "Dispensa contato visual ao tocar o alvo." },
          { codigo: "2.5", nome: "Sussurro Silencioso", descricao: "Comando hipnótico transmitido mentalmente por contato visual." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Comandar a Memória",
        descricao: "Disputa de Campo Pessoal para reescrever, apagar memórias dolorosas ou implantar lembranças fictícias.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Memória Sem Fronteiras", descricao: "Apaga ou altera memórias mesmo sem compreensão do idioma." },
          { codigo: "3.5", nome: "Escultura Tátil da Mente", descricao: "Dispensa contato visual sob toque na cabeça do alvo." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Condicionar",
        descricao: "Subjuga progressivamente um mortal, erodindo seu Campo Pessoal até torná-lo um autômato dócil.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Erosão Dupla", descricao: "O Campo Pessoal do alvo é reduzido em 2 níveis por teste bem-sucedido." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Possessão",
        descricao: "Habita integralmente o corpo do alvo, controlando-o como uma extensão de sua própria carne.",
        aprimoramentos: [],
      },
    },
  },

  // 6. FORTITUDE
  "Fortitude": {
    id: "fortitude",
    nome: "Fortitude",
    categoria: "comum",
    resumo: "Resistência física invulnerável e absorção de danos letais e agravados.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Armadura",
        descricao: "Ganha +1 ponto de Redução de Dano (RD) passiva sobrenatural contra danos físicos.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Carne de Ferro", descricao: "Aumenta a Redução de Dano passiva para RD 2." },
          { codigo: "1.3", nome: "Pele de Bronze", descricao: "Aumenta a Redução de Dano passiva para RD 3." },
          { codigo: "1.4", nome: "Couraça de Aço", descricao: "Aumenta a Redução de Dano passiva para RD 4." },
          { codigo: "1.5", nome: "Armadura Adamantina", descricao: "Aumenta a Redução de Dano passiva para RD 5." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Escudo",
        descricao: "Ato reflexo (1 Vitæ). Transfere pontos de sua RD para outro ser ou objeto até o fim da cena.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Escudo Noturno", descricao: "A proteção transferida dura até o próximo nascer do sol." },
          { codigo: "2.4", nome: "Bênção da Rocha", descricao: "O alvo recebe +1 nível adicional de RD além dos transferidos." },
          { codigo: "2.5", nome: "Baluarte Imortal", descricao: "O alvo recebe +2 níveis adicionais de RD além dos transferidos." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Asas Maternas",
        descricao: "Bloqueia 4 Vitæ e toca um alvo. O protegido compartilha de toda a RD do cainita e danos excedentes são atraídos.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Guarda Leve", descricao: "Apenas 3 Vitæ precisam ser bloqueados para manter o elo." },
          { codigo: "3.5", nome: "Abraço Maternal", descricao: "Apenas 2 Vitæ bloqueados para manter a proteção compartilhada." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Restauração",
        descricao: "Ato reflexo. Cura gratuitamente até 7 pontos de dano por noite sem Vitæ; regenera membros em 3h de repouso.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Cura dos Séculos", descricao: "Concede 10 curas gratuitas de qualquer tipo de dano por noite." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Fúria Pétrea",
        descricao: "Ato reflexo (5 Vitæ). A RD de armadura passa a absorver dano de Fogo e Luz Solar diretamente, e dá +1 contra Rötschreck.",
        aprimoramentos: [],
      },
    },
  },

  // 7. OBEAH
  "Obeah": {
    id: "obeah",
    nome: "Obeah",
    categoria: "comum",
    resumo: "Arte mística Salubri de cura espiritual, restauração de almas e apaziguamento.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Panacéia",
        descricao: "Cura ferimentos no próprio corpo lambendo-os, fechando 1 nível por turno sem gastar Vitæ.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Toque Humano", descricao: "A saliva curativa passa a fechar ferimentos em mortais." },
          { codigo: "1.3", nome: "Toque Universal", descricao: "Passa a afetar qualquer pessoa, incluindo outros vampiros." },
          { codigo: "1.4", nome: "Graça Agravada", descricao: "Não gasta Vitæ para regenerar danos agravados no próprio corpo." },
          { codigo: "1.5", nome: "Bênção Suprema", descricao: "Não consome Vitæ para curar danos agravados em outros cainitas." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Toque Analgésico",
        descricao: "Ato reflexo (1 Vitæ). Aplaca a dor ao tocar a pele nua, anulando penalidades de ferimento e tornando imune à tortura.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Anestesia Duradoura", descricao: "A duração do alívio estende-se para até 6 horas contínuas." },
          { codigo: "2.4", nome: "Olhar Compassivo", descricao: "Afeta quem fitar o Olho Vertical mesmo sem contato físico direto." },
          { codigo: "2.5", nome: "Luz dos Anjos", descricao: "Abrindo o Olho Vertical, alivia a dor de todos num raio de 10 metros." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Guarda Neutra",
        descricao: "Cria barreira de não-violência absoluta ao redor do Salubri. Agressores precisam vencer CP vs 10 para tentar atacar.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Remorso da Fera", descricao: "Agressor derrotado sofre resultado 2 níveis pior na tabela de Pânico." },
          { codigo: "3.5", nome: "Choque Catártico", descricao: "Agressor derrotado sofre resultado 4 níveis pior na tabela de Pânico." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Visão Clara",
        descricao: "Dissipa fúria, pânico e Frenesi, curando desvantagens mentais ao fitar os olhos do alvo com o Olho Vertical.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Espelho da Verdade", descricao: "Preso ao contato visual, o alvo responde sempre com verdade e franqueza pura." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Purgatório",
        descricao: "Coloca a alma em hibernação protegida. O corpo adquire RD 10 de Fortitude e incorruptibilidade com odor de rosas.",
        aprimoramentos: [],
      },
    },
  },

  // 8. OFUSCAÇÃO
  "Ofuscação": {
    id: "ofuscacao",
    nome: "Ofuscação",
    categoria: "comum",
    resumo: "Camuflagem mística, invisibilidade e apagamento da presença.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Cegar os Olhos da Mente",
        descricao: "Permanece imóvel e silencioso. Observadores desviam o olhar inconscientemente e ignoram a presença.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Passos Fantasmas", descricao: "Pode se mover lentamente sem gestos bruscos mantendo o manto." },
          { codigo: "1.3", nome: "Desvio Inconsciente", descricao: "Transeuntes desviam naturalmente do caminho em multidões densas." },
          { codigo: "1.4", nome: "Vanish", descricao: "Pode desaparecer na frente de testemunhas que já o fitavam." },
          { codigo: "1.5", nome: "Voz Oculta", descricao: "Pode falar mantendo a voz camuflada ou sem denunciar sua origem." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Máscara das Mil Faces",
        descricao: "Concentra-se por 3 turnos para assumir a aparência de outra pessoa na mente dos observadores.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Disfarce Bélico", descricao: "O disfarce não se desfaz mesmo durante ações violentas ou combate." },
          { codigo: "2.4", nome: "Voz Mímica", descricao: "A voz e os timbres do indivíduo imitado são reproduzidos à perfeição." },
          { codigo: "2.5", nome: "Manto Instantâneo", descricao: "Ativação instantânea sem necessidade de turnos de concentração." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Jogo de Espelhos",
        descricao: "Apresenta aparências diferentes ou invisibilidade seletiva para indivíduos distintos simultaneamente.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Espelho Gratuito", descricao: "Não gasta mais Vitæ para diferenciar alvos da ilusão." },
          { codigo: "3.5", nome: "Ilusão Multilateral", descricao: "Afeta quantos alvos desejar simultaneamente sem sobrecarga." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Ocultamento",
        descricao: "Gasta 1 Vitæ para ofuscar um objeto empunhado (espadas viram bengalas, fuzis desaparecem da visão).",
        aprimoramentos: [
          { codigo: "4.5", nome: "Véu Eterno", descricao: "O objeto permanece ofuscado indefinidamente até que algo quebre o efeito." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Cobrir Grupos",
        descricao: "Estende o manto de Ofuscação a companheiros a menos de 2 metros, ocultando todo o grupo.",
        aprimoramentos: [],
      },
    },
  },

  // 9. POTÊNCIA
  "Potência": {
    id: "potencia",
    nome: "Potência",
    categoria: "comum",
    resumo: "Força física colossal capaz de esmagar concreto e romper blindagens.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Força de Titã",
        descricao: "Concede +1 ponto permanente no Talento Força (podendo ultrapassar o limite de 5).",
        aprimoramentos: [
          { codigo: "1.2", nome: "Músculos de Aço", descricao: "Ganha +2 pontos permanentes adicionais no Talento Força." },
          { codigo: "1.3", nome: "Coluna de Caim", descricao: "Ganha +3 pontos permanentes adicionais no Talento Força." },
          { codigo: "1.4", nome: "Fúria Sísmica", descricao: "Ganha +4 pontos permanentes adicionais no Talento Força." },
          { codigo: "1.5", nome: "Colosso da Noite", descricao: "Ganha +5 pontos permanentes adicionais no Talento Força." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Pujança / Brutalidade",
        descricao: "Gasta 3 Vitæ: usa força integral em ataques desarmados com mãos nuas durante toda a cena.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Ruptura de Blindagem", descricao: "Ignora 3 pontos de RD de objetos e coberturas físicas." },
          { codigo: "2.4", nome: "Eficiência Muscular", descricao: "O custo de ativação é reduzido para 2 Vitæ." },
          { codigo: "2.5", nome: "Esmagamento Total", descricao: "Golpes desarmados causam Força Integral + 1 no cálculo de dano." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Indomável",
        descricao: "Ato reflexo (1 Vitæ). Em disputa de Força, considera o dado como resultado 10 automático.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Superação Pós-Rolagem", descricao: "Pode ser acionado após a rolagem do dado, inclusive em falhas críticas." },
          { codigo: "3.5", nome: "Poder Incondicional", descricao: "Não consome Vitæ para converter a rolagem em 10 automático." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Domínio da Força",
        descricao: "Toca um alvo e gasta Vitæ para alterar a Força dele (1 Vitæ por ponto) até o final da cena.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Marca Muscular", descricao: "A alteração de Força dura até o próximo nascer do sol." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Rompante",
        descricao: "Concentra por 1 turno; no turno seguinte a Força sobe em +1d10 pontos (podendo re-rolar e somar até +10).",
        aprimoramentos: [],
      },
    },
  },

  // 10. PRESENÇA
  "Presença": {
    id: "presenca",
    nome: "Presença",
    categoria: "comum",
    resumo: "Magnetismo sobrenatural, fascinação irresistível, pavor e comoção.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Fascínio",
        descricao: "Atrai a atenção total de todos em um recinto por 10 minutos, conferindo +1 nível em paradas sociais.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Fascínio Seletivo", descricao: "Pode delimitar o raio ou selecionar alvos específicos." },
          { codigo: "1.3", nome: "Hipnose Prolongada", descricao: "A duração do fascínio estende-se para 30 minutos." },
          { codigo: "1.4", nome: "Graça dos Deuses", descricao: "O bônus em paradas sociais aumenta para +2 níveis." },
          { codigo: "1.5", nome: "Brilho Sublime", descricao: "O bônus em paradas sociais atinge impressionantes +3 níveis." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Olhar Aterrorizante",
        descricao: "Exibe presas e chia, causando pânico e fobia pelo restante da cena em mortais.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Pavor Silencioso", descricao: "Um mero olhar silencioso é suficiente para induzir o terror." },
          { codigo: "2.4", nome: "Verificação de Pânico", descricao: "Força o alvo a realizar uma Verificação de Pânico imediata." },
          { codigo: "2.5", nome: "Toque do Terror", descricao: "O contato visual pode ser substituído por toque físico." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Paixão",
        descricao: "Disputa de Campo Pessoal para implantar no alvo uma Paixão de nível 3 devotada ao cainita por 30 dias.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Amor Trimestral", descricao: "A duração da paixão induzida estende-se para 3 meses." },
          { codigo: "3.5", nome: "Devoção Anual", descricao: "A duração da paixão induzida estende-se por 1 ano completo." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Convocação",
        descricao: "Disputa de Campo Pessoal para convocar um indivíduo à distância; ele fará de tudo para ir até o cainita por 24h.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Chamado Eterno", descricao: "A convocação dura até a Morte Final ou até o cainita dispensar." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Majestade",
        descricao: "Presença divina permanente. Atacar ou ofender o cainita exige disputa de Coragem vs Social + Presença.",
        aprimoramentos: [],
      },
    },
  },

  // 11. METAMORFOSE / PROTEÍSMO
  "Metamorfose / Proteísmo": {
    id: "proteismo",
    nome: "Metamorfose / Proteísmo",
    categoria: "comum",
    resumo: "Metamorfose em garras, névoa, formas animais e fusão com a terra.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Testemunha da Noite",
        descricao: "Ato reflexo. Olhos rubros permitem enxergar em escuridão absoluta sem penalidades.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Brilho Oculto", descricao: "Os olhos brilham apenas se o cainita desejar." },
          { codigo: "1.3", nome: "Sentidos de Lobo", descricao: "Assume o olfato e a audição aguçada de um lobo predador." },
          { codigo: "1.4", nome: "Ecolocalização", descricao: "Assume a audição de morcego com ecolocalização sonora." },
          { codigo: "1.5", nome: "Sentidos Quiméricos", descricao: "Imita sentidos de qualquer fera animal (visão de falcão, tato térmico de serpente)." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Ira da Fera (Garras de Proteísmo)",
        descricao: "Ato reflexo (1 Vitæ). Garras de 3 cm causam Dano Agravado igual a Metade da Força.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Bloqueio Sanguíneo", descricao: "Apenas bloqueia 1 Vitæ temporariamente em vez de gastar." },
          { codigo: "2.4", nome: "Garras Farpadas", descricao: "Soma bônus de dano de palavras-chave (até +2 no golpe)." },
          { codigo: "2.5", nome: "Dilaceração Integral", descricao: "O dano agravado das garras passa a usar a Força Integral do personagem." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "A Sombra da Besta",
        descricao: "Gasta 1 Vitæ para assumir forma animal de Lobo (+1 Força, +2 Vigor, +2 Agilidade) ou Morcego (+3 Agilidade, voo).",
        aprimoramentos: [
          { codigo: "3.4", nome: "Forma Complementar", descricao: "Ganha a outra forma animal não escolhida inicialmente." },
          { codigo: "3.5", nome: "Forma Crinos / Homem-Lobo", descricao: "Assume forma híbrida de guerra monstruosa: Força +4, Vigor +3, Agilidade +1, Aparência -5." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Fusão com a Terra",
        descricao: "Gasta 1 Vitæ para mergulhar no solo natural em 1 turno, ficando imune ao sol e protegido.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Natação Sísmica", descricao: "Move-se dentro da terra/rocha com velocidade igual à sua Agilidade em m/min." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Forma de Névoa",
        descricao: "Gasta 1 Vitæ para virar névoa em 3 turnos. Imune a dano físico e fogo; sol causa dano letal em vez de agravado.",
        aprimoramentos: [],
      },
    },
  },

  // 12. QUIETUS / QUIETUDE
  "Quietude / Quietus": {
    id: "quietus",
    nome: "Quietude / Quietus",
    categoria: "comum",
    resumo: "Silêncio mortal e alquimia letal do sangue dos Banu Haqim.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Silêncio Mortal",
        descricao: "Cria uma zona esférica de 3m de raio onde nenhum som pode ser emitido ou ouvido.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Esfera Expandida", descricao: "Gasta Vitæ para aumentar o raio da zona silenciosa em 3m por ponto." },
          { codigo: "1.3", nome: "Silêncio Seletivo", descricao: "Escolhe quais sons são silenciados e quais podem ser ouvidos." },
          { codigo: "1.4", nome: "Pacto de Silêncio", descricao: "Fixa campos de silêncio permanentes em objetos ou cômodos (1h por Vitæ)." },
          { codigo: "1.5", nome: "Projétil Silencioso", descricao: "Arremessa a zona de silêncio em alvo visível a até 50 metros." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Sanguessuga",
        descricao: "Pele permeável permite transferir ou absorver 1 Vitæ por turno por osmose através do toque.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Filtro Osmótico", descricao: "Filtra propriedades do sangue (vira sangue comum, sem formar laço)." },
          { codigo: "2.4", nome: "Dreno Duplo", descricao: "Transfere ou drena 2 Vitæ por turno pelo contato da pele." },
          { codigo: "2.5", nome: "Suor Sangrento", descricao: "Faz um mortal transpirar sangue sem parar até a morte." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "A Carícia de Baal",
        descricao: "Envenena o sangue por 1d10 turnos. Ao inocular em alvo, reduz 1 ponto em Força e em cada talento subsequente a cada turno.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Peçonha Duradoura", descricao: "O sangue permanece venenoso por 1d10 minutos após ativado." },
          { codigo: "3.5", nome: "Necrose Acelerada", descricao: "A penalidade de veneno passa a ser de -2 pontos por talento." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Agonia do Sangue",
        descricao: "Reveste armas com sangue cáustico: armas normais causam dano letal e letais causam dano agravado.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Veneno Temperado", descricao: "O veneno na lâmina resiste aos 2 primeiros golpes antes de se desfazer." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Gosto de Morte",
        descricao: "Condensa toxina necrosante no sangue. Cuspida à distância causa 2 de dano agravado por Vitæ e cicatrizes eternas.",
        aprimoramentos: [],
      },
    },
  },

  // 13. QUIMERISMO
  "Quimerismo": {
    id: "quimerismo",
    nome: "Quimerismo",
    categoria: "comum",
    resumo: "Criação de ilusões hipnóticas que enganam todos os sentidos.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Fata Morgana",
        descricao: "Bloqueia 1 Vitæ para criar ilusão estática que engana um sentido enquanto o alvo estiver no campo de visão.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Ilusão Panorâmica", descricao: "A ilusão engana todos os cinco sentidos simultaneamente." },
          { codigo: "1.3", nome: "Miragem Persistente", descricao: "Persiste por 1d10 turnos mesmo após o alvo sair do campo de visão." },
          { codigo: "1.4", nome: "Memória da Miragem", descricao: "Persiste por 1d10 minutos após o alvo sair de vista." },
          { codigo: "1.5", nome: "Ilusão Autônoma", descricao: "Persiste por 1d10 horas completas após o cainita se afastar." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Ignis Fatuus",
        descricao: "Gasta 1 Vitæ. A ilusão afeta a mente de todas as pessoas em um raio de 10 metros.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Eco de 25m", descricao: "O raio da ilusão atinge 25 metros de alcance." },
          { codigo: "2.4", nome: "Praça Ilusória", descricao: "O raio da ilusão estende-se para 50 metros ao redor." },
          { codigo: "2.5", nome: "Domo dos Espelhos", descricao: "O raio da ilusão abrange 100 metros de diâmetro." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Aparição",
        descricao: "Bloqueia 2 Vitæ para conferir movimento e animação realista à ilusão enquanto mantiver concentração.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Autômato Onírico", descricao: "Mantém movimentos cíclicos e fala sem exigir atenção contínua." },
          { codigo: "3.5", nome: "Metamorfose Ilusória", descricao: "Gasta 1 Vitæ para transformar a ilusão em outra inteiramente diferente." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Miragens",
        descricao: "Torna ilusões permanentes por dias iguais a Espacial + Quimerismo.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Semana dos Sonhos", descricao: "A duração das miragens passa a ser contada em semanas inteiras." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Cruel Realidade",
        descricao: "Ilusão adquire consistência física no consenso de realidade (armas causam dano real de até 5 letais ou 1 agravado).",
        aprimoramentos: [],
      },
    },
  },

  // 14. SERPENTIS
  "Serpentis": {
    id: "serpentis",
    nome: "Serpentis",
    categoria: "comum",
    resumo: "Feitiçaria ofídia dos Setitas: hipnose serpentina, escamas e mumificação.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Os Olhos da Serpente",
        descricao: "Olhos dourados com fenda negra: +2 em testes para parecer nobre e verdadeiro, e anula falhas críticas.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Olhar Sedutor", descricao: "Bônus aumenta para +4 níveis adicionais em testes sociais nobres." },
          { codigo: "1.3", nome: "Olhar Ocluso", descricao: "Afeta alvos vendados se estiverem com a face virada para o vampiro." },
          { codigo: "1.4", nome: "Voz Serpentina", descricao: "Afeta qualquer um que ouça sua voz num raio de 10 metros." },
          { codigo: "1.5", nome: "Sibilo da Cidade", descricao: "Afeta quem ouvir a voz através de meios de comunicação até 30 km." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "O Signo da Serpente",
        descricao: "Língua bífida de 45 cm causa 1 dano agravado, drena 1 Vitæ/turno com êxtase do Beijo e reduz penalidade às cegas.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Forma de Víbora", descricao: "Metamorfoseia-se em serpente negra de 3m (Vigor 5, Agilidade 5, veneno letal)." },
          { codigo: "2.4", nome: "Cospe Veneno", descricao: "Cospe sangue venenoso a até 5m causando erupções letais e cegueira." },
          { codigo: "2.5", nome: "Couraça de Escamas", descricao: "Endurece a pele em escamas com Redução de Dano sobrenatural." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Semblante da Medusa",
        descricao: "Fitando os olhos dourados do cainita, induz catalepsia e paralisia total (disputa de Campo Pessoal).",
        aprimoramentos: [
          { codigo: "3.4", nome: "Transe dos Dias", descricao: "A vítima permanece catatônica por 1d10 dias ou até ser ferida." },
          { codigo: "3.5", nome: "Olhar Pétreo", descricao: "Afeta alvos de olhos fechados se voltarem a face para o Setita." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "O Coração das Trevas",
        descricao: "Em noite de lua nova, extirpa o coração mumificado do peito. Torna o cainita imune a estacas de madeira no coração.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Cirurgia Sagrada", descricao: "Pode extirpar ou reinserir o coração sem causar ferimentos." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Corrupção do Éden",
        descricao: "Conversa de 5 minutos implanta paixão falsa baseada nos 7 Pecados Capitais em nível 2 (acumulável até 5).",
        aprimoramentos: [],
      },
    },
  },

  // 15. TENEBROSIDADE
  "Tenebrosidade": {
    id: "tenebrosidade",
    nome: "Tenebrosidade",
    categoria: "comum",
    resumo: "Manipulação e invocação da escuridão tangível do Abismo.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Jogo de Sombras",
        descricao: "Gasta 1 Vitæ para distorcer sombras ao redor: zera Espacial de observadores, causa vertigem e dá +2 em intimidação.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Vertigem Abissal", descricao: "Reduz talentos mentais dos presentes em -1 e impõe 50% de chance de queda." },
          { codigo: "1.3", nome: "Náusea Cósmica", descricao: "50% de chance de vômito por 3 turnos (vampiros perdem 2 Vitæ)." },
          { codigo: "1.4", nome: "Sombras Longevas", descricao: "A distorção de sombras permanece por 1d10 minutos após o Lasombra sair." },
          { codigo: "1.5", nome: "Assombração Noturna", descricao: "A distorção de sombras persiste por 1 hora completa no local." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Mortalha de Trevas",
        descricao: "Evoca escuridão abissal em 10m: bloqueia sol, distorce sons, temperatura cai para 0ºC e reduz iluminação a 1/10.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Arquitetura da Noite", descricao: "Modela a forma geométrica da escuridão livremente." },
          { codigo: "2.4", nome: "Olhar do Abismo", descricao: "O Lasombra enxerga perfeitamente através de suas próprias trevas." },
          { codigo: "2.5", nome: "Mestre das Sombras", descricao: "Enxerga através de trevas convocadas por qualquer outro vampiro." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Abismo",
        descricao: "Dá densidade sólida às trevas. Alvos movem-se a 1/2 da velocidade; danos de projéteis e lâminas caem pela metade.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Nadar no Vazio", descricao: "O Lasombra pode nadar e flutuar livremente dentro da escuridão densa." },
          { codigo: "3.5", nome: "Voo Abissal", descricao: "Desloca-se com velocidade normal de corrida em qualquer eixo 3D dentro do Abismo." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Rastejantes",
        descricao: "Gasta 1 Vitæ por tentáculo/simulacro sólido criado nas trevas (Força 3, RD 3, dano letal 3).",
        aprimoramentos: [
          { codigo: "4.5", nome: "Titãs das Trevas", descricao: "A Redução de Dano e as paradas de dados dos rastejantes aumentam para 4." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Sepultamento",
        descricao: "Funde alvo à sua sombra como silhueta 2D na parede/chão. Em si permite deslizar por frestas a velocidade dobrada.",
        aprimoramentos: [],
      },
    },
  },

  // 16. VICISSITUDE
  "Vicissitude": {
    id: "vicissitude",
    nome: "Vicissitude",
    categoria: "comum",
    resumo: "Escultura e transmutação da carne e ossos próprios e alheios.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Aspecto Maleável",
        descricao: "Gasta 1 Vitæ para alterar traços faciais, cabelo, altura (+-10%) e modificar níveis de Aparência.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Escultura Mental", descricao: "Alterações ocorrem mentalmente em turnos por toque rápido." },
          { codigo: "1.3", nome: "Argila Própria", descricao: "Alterações no próprio corpo não consomem pontos de Vitæ." },
          { codigo: "1.4", nome: "Perfeição Carnal", descricao: "Modificações em si mesmo nunca resultam em falhas críticas." },
          { codigo: "1.5", nome: "Mestre Plástico", descricao: "Os benefícios anteriores de facilidade aplicam-se a outros indivíduos." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Moldar Carne",
        descricao: "Modela músculos, pele e gordura como cera: pode aumentar ou reduzir Força e Vigor de um alvo sob toque.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Cirurgia Rápida", descricao: "A moldagem ocorre em turnos durante combate pelo toque." },
          { codigo: "2.4", nome: "Economia Tecidual", descricao: "Custo em Vitæ cai pela metade para aprimoramentos no próprio corpo." },
          { codigo: "2.5", nome: "Transcendência Muscular", descricao: "O limite biológico de 5 em Força e Vigor pode ser extrapolado." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Moldar Ossos",
        descricao: "Dobra ossadas, fratura membros de inimigos ao toque ou esculpe armas ósseas afiadas.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Esporões Ósseos", descricao: "Brotam esporões perfurantes da carne que agem como punhais de RD 3." },
          { codigo: "3.5", nome: "Garras de Marfim", descricao: "Os esporões e garras ósseas passam a desferir Dano Agravado puro." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Despertar Obra",
        descricao: "Grava uma transformação monstruosa prévia na memória celular (ex: forma de guerra demoníaca Zulo), ativável por 1 Vitæ.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Galeria Monstruosa", descricao: "Pode memorizar e alternar entre até 2 obras corporais diferentes." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Recozer o Barro da Vida",
        descricao: "Transmuta tecidos orgânicos: reconstrói membros amputados, cria couraças ósseas com RD 3 ou espadas de dano agravado.",
        aprimoramentos: [],
      },
    },
  },

  // 17. VISCERATIKA
  "Visceratika": {
    id: "visceratika",
    nome: "Visceratika",
    categoria: "comum",
    resumo: "Afinidade lítea dos Gárgulas, fusão com alvenaria e couraça de pedra.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Sussurros da Masmorra",
        descricao: "Toca pedra para perscrutar tudo o que toca a estrutura mineral em um cômodo.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Sussurro da Mansão", descricao: "Analisa uma edificação inteira de 2 andares ou até 10 cômodos." },
          { codigo: "1.3", nome: "Eco Mineral", descricao: "O Vitæ empregado é apenas bloqueado e retorna após 1 hora." },
          { codigo: "1.4", nome: "Visão do Edifício", descricao: "Sonda e mapeia a estrutura de um prédio inteiro de concreto/pedra." },
          { codigo: "1.5", nome: "Memória da Rocha", descricao: "Testa Emocional vs 8 para rever eventos recentes gravados na pedra." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Pele do Camaleão",
        descricao: "Custa 1 Vitæ. Mimetiza a textura e cor exata da rocha permitindo camuflagem absoluta mesmo frente a frente.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Gárgula Humana", descricao: "Retrai asas, garras e cauda assumindo fisionomia de mortal comum." },
          { codigo: "2.4", nome: "Sombra da Catedral", descricao: "Ganha Palavra-Chave Furtividade/Ótimo e bloqueia Vitæ em vez de gastar." },
          { codigo: "2.5", nome: "Mimetismo Instantâneo", descricao: "Pode camuflar-se mesmo após ser avistado; reduz custos de Vitæ em 1." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Senhor da Rocha",
        descricao: "Ato reflexo. Recebe bônus no Talento Vigor igual ao nível em Visceratika (podendo ultrapassar 5).",
        aprimoramentos: [
          { codigo: "3.4", nome: "Resiliência Granítica", descricao: "Todas as penalidades de dano da vitalidade caem pela metade." },
          { codigo: "3.5", nome: "Absorção Vulcânica", descricao: "Danos agravados de sol e fogo podem ser absorvidos com metade do Vigor." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Elo com a Pedra",
        descricao: "Gasta 1 Vitæ/turno para mover-se por dentro de rochas, concreto ou asfalto à velocidade de sua Agilidade.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Passeio Mineral", descricao: "Gasta Vitæ apenas na ativação; a manutenção da travessia é gratuita." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "A Queda de Apolo",
        descricao: "Ato reflexo. Vira estátua de obsidiana com RD 7 (funciona contra sol e fogo!) passando o dia inteiro sob sol sem queimar.",
        aprimoramentos: [],
      },
    },
  },

  // 18. TAUMATURGIA: LINHA 1 - REGO MOTUS
  "Taumaturgia: Rego Motus (Movimento da Mente)": {
    id: "taumaturgia_rego_motus",
    nome: "Taumaturgia: Rego Motus (Movimento da Mente)",
    categoria: "taumaturgia",
    resumo: "Telecinese hermética, campos de proteção e manipulação telecinética do vácuo.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Levitar",
        descricao: "Ergue objetos ou alvos a 1m/turno (testa Espacial + Rego Motus vs 1 para cada 20kg).",
        aprimoramentos: [
          { codigo: "1.2", nome: "Levitação Duradoura", descricao: "Prolonga a sustentação do objeto suspenso por mais 1 minuto." },
          { codigo: "1.3", nome: "Voo Suave", descricao: "Pode mover objetos suspensos horizontalmente com precisão." },
          { codigo: "1.4", nome: "Sustentação Estendida", descricao: "A duração do efeito pós-concentração estende-se por 10 minutos." },
          { codigo: "1.5", nome: "Gravidade Nula", descricao: "Objetos permanecem flutuando por até 1d10 horas sem gasto contínuo." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Mãos Fantasmas",
        descricao: "Cria mãos invisíveis a até 50 metros com Força 1 para manusear itens, abrir portas ou desarmar inimigos.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Mãos de Ferro", descricao: "A Força das mãos invisíveis aumenta para Força 2." },
          { codigo: "2.4", nome: "Aperto Espectral", descricao: "A Força das mãos invisíveis aumenta para Força 3." },
          { codigo: "2.5", nome: "Mãos de Titã", descricao: "A Força das mãos invisíveis atinge colossal Força 5." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Círculo de Proteção",
        descricao: "Campo de força a 10cm da pele freia projéteis e lâminas, reduzindo todo dano físico à metade.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Círculo Compartilhado", descricao: "Cria o campo de proteção em aliados por 1 Vitæ." },
          { codigo: "3.5", nome: "Deflexão Absoluta", descricao: "Todo dano de projéteis e armas é reduzido a um valor fixo de 1 ponto." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Grilhões Invisíveis",
        descricao: "Imobiliza membros e boca de uma vítima com bandas telecinéticas por até 1 hora.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Grilhões Visuais", descricao: "Agrilhoa alvos instantaneamente apenas mantendo contato visual." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Bênção de Morte",
        descricao: "Interrompe o fluxo vital, gerando parada cardíaca e coma imediato em mortais; em vampiros bloqueia Vitæ e força torpor.",
        aprimoramentos: [],
      },
    },
  },

  // 18. TAUMATURGIA: LINHA 2 - REGO VITAE
  "Taumaturgia: Rego Vitae (Trilha do Sangue)": {
    id: "taumaturgia_rego_vitae",
    nome: "Taumaturgia: Rego Vitae (Trilha do Sangue)",
    categoria: "taumaturgia",
    resumo: "Manipulação e controle místico da essência do sangue de Caim.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Um Gosto por Vitæ",
        descricao: "Toca uma gota de sangue para descobrir tipo sanguíneo, geração, clã, se é vampírico e doenças.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Aroma do Sangue", descricao: "Basta sentir o cheiro do sangue no ar para diagnosticar suas propriedades." },
          { codigo: "1.3", nome: "Toque do Recipiente", descricao: "Descobre propriedades tocando apenas o recipiente ou roupa manchada." },
          { codigo: "1.4", nome: "Sondagem a 5 Metros", descricao: "Sonda o sangue de indivíduos a até 5m de distância." },
          { codigo: "1.5", nome: "Visão da Fonte", descricao: "Se ingerir uma gota, obtém visão mental da localização exata da fonte." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Furto de Vitæ",
        descricao: "Drena sangue de um alvo a até 10 metros sem precisar de contato físico com as presas.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Voo do Sangue", descricao: "Velocidade de drenagem igual a Espacial em pontos de Vitæ por turno." },
          { codigo: "2.4", nome: "Transfusão Mística", descricao: "Transfere o sangue drenado diretamente para outro aliado à vista." },
          { codigo: "2.5", nome: "Vórtice Sanguíneo", descricao: "Drena múltiplos alvos simultaneamente no campo de visão." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Potência do Sangue",
        descricao: "Reduz temporariamente a geração efetiva do cainita, aumentando sua reserva e poder de Vitæ por horas.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Consagração de Aliados", descricao: "Pode aplicar a redução de geração em outros cainitas aliados." },
          { codigo: "3.5", nome: "Diluição dos Inimigos", descricao: "Enfraquece a marca de Caim em inimigos, elevando a geração deles até 15ª." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Fúria do Sangue",
        descricao: "Dobra os bônus físicos obtidos por Vitæ gasto e reduz pela metade custos de sangue de disciplinas.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Sangria Forçada", descricao: "Força outros vampiros a gastarem Vitæ involuntariamente à distância." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Caldeirão de Sangue",
        descricao: "Ferve o sangue da vítima a 60ºC! Causa perda de Vitæ e múltiplos danos agravados inabsorvíveis até por Fortitude.",
        aprimoramentos: [],
      },
    },
  },

  // 18. TAUMATURGIA: LINHA 3 - CREO IGNEM
  "Taumaturgia: Creo Ignem (Sedução das Chamas)": {
    id: "taumaturgia_creo_ignem",
    nome: "Taumaturgia: Creo Ignem (Sedução das Chamas)",
    categoria: "taumaturgia",
    resumo: "Conjuração e controle do fogo místico primordial.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Pira Oracular",
        descricao: "Mapeamento termográfico em raio de 25 metros e leitura de calor em objetos e pegadas.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Vela Reveladora", descricao: "Enxerga o cômodo adjacente na chama de uma simples vela." },
          { codigo: "1.3", nome: "Chama da Verdade", descricao: "Detecta mentiras observando as oscilações de uma tocha." },
          { codigo: "1.4", nome: "Farol Mortal", descricao: "Localiza a presença de mortais conhecidos no fogo." },
          { codigo: "1.5", nome: "Farol dos Imortais", descricao: "Localiza vampiros conhecidos observando as chamas." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Espada de Gabriel",
        descricao: "Induz combustão espontânea ao toque, causando 2 pontos de Dano Agravado por fogo.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Toque Ígneo", descricao: "O dano de fogo aumenta para 3 pontos agravados." },
          { codigo: "2.4", nome: "Faísca a 10m", descricao: "Dispara chamas causando 4 pontos de dano agravado a até 10m." },
          { codigo: "2.5", nome: "Chamas do Inferno", descricao: "Dispara chamas causando 5 pontos de dano agravado a até 20m." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "O Dançarino do Fogo",
        descricao: "Cura danos agravados de fogo gastando 1 Vitæ por ponto como se fossem ferimentos normais.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Pele Imune", descricao: "Danos de chamas passam a contar como danos letais convencionais." },
          { codigo: "3.5", nome: "Purificação Térmica", descricao: "Cura superfícies aquecidas ao custo de 1 Vitæ por setor corporal." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Corpus Igni",
        descricao: "Cobre o corpo com chamas azuis (3 Vitæ). Causa Rötschreck ao redor e atinge espíritos e demônios.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Golpe Solar", descricao: "Metade do nível de Creo Ignem vira Dano Agravado adicional em socos." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Beijo da Vida",
        descricao: "Beija cadáver recente com 5 Vitæ para ressuscitá-lo como servo por horas com chamas azuis nas órbitas.",
        aprimoramentos: [],
      },
    },
  },

  // 18. TAUMATURGIA: LINHA 4 - REGO TEMPESTAS
  "Taumaturgia: Rego Tempestas (Poder do Clima)": {
    id: "taumaturgia_rego_tempestas",
    nome: "Taumaturgia: Rego Tempestas (Poder do Clima)",
    categoria: "taumaturgia",
    resumo: "Comando sobre tempestades, rajadas de vento, relâmpagos e névoas.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Mestre do Vento",
        descricao: "Cria rajadas de vento controladas capazes de empurrar objetos e dispersar gases tóxicos.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Brisa Firme", descricao: "Rajada capaz de desviar flechas e projéteis lentos." },
          { codigo: "1.3", nome: "Vendaval", descricao: "Empurra pessoas adultas para trás e quebra vidraças." },
          { codigo: "1.4", nome: "Ciclone", descricao: "Ventos com Força 2 derrubam árvores e arrancam telhados." },
          { codigo: "1.5", nome: "Vendaval Titânico", descricao: "Ventos devastadores com Força 3 que viram carros." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Fazedor de Chuvas",
        descricao: "Cobre os céus com nuvens de tempestade densas, chuva torrencial, granizo e nevoeiro.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Nevasca", descricao: "Provoca queda brusca de granizo e neve espessa." },
          { codigo: "2.4", nome: "Dilúvio", descricao: "Alaga ruas e zera a visibilidade de observadores mortais." },
          { codigo: "2.5", nome: "Noite de Tempestade", descricao: "Nuvens negras místicas bloqueiam 100% do sol, permitindo agir de dia." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Voz do Trovão",
        descricao: "Expansão sônica com 1d10 de dano normal, perfurando tímpanos e arremessando alvos a 20 metros.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Ressonância 2d10", descricao: "O estrondo sônico atinge 2d10 de dano por impacto." },
          { codigo: "3.5", nome: "Trovão Cataclísmico", descricao: "Dano aumentado para 3d10 destruindo alvenaria e paredes." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Os Punhos de Deus",
        descricao: "Convoca um relâmpago direto das nuvens causando 1d10 de Dano Agravado puro e inconsciência imediata.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Tempestade de Raios", descricao: "Convoca múltiplos relâmpagos em um raio de até 50 metros." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Hálito do Éolo",
        descricao: "Altera a temperatura atmosférica em escala massiva (+10ºC/turno até 60ºC ou -10ºC até -20ºC) congelando tecidos.",
        aprimoramentos: [],
      },
    },
  },

  // 18. TAUMATURGIA: LINHA 5 - REGO AQUAM
  "Taumaturgia: Rego Aquam (Domínio das Águas)": {
    id: "taumaturgia_rego_aquam",
    nome: "Taumaturgia: Rego Aquam (Domínio das Águas)",
    categoria: "taumaturgia",
    resumo: "Domínio sobre correntes líquidas, pressões hidrostáticas e sangue aquoso.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Olhos do Mar",
        descricao: "Detecta qualquer corpo aquoso ou vazamento subterrâneo num raio de 10 metros.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Visão Aquática", descricao: "Enxerga através da água turva com clareza cristalina." },
          { codigo: "1.3", nome: "Espelho da Fonte", descricao: "Comunica-se à distância através de superfícies líquidas calmas." },
          { codigo: "1.4", nome: "Comunhão com o Rio", descricao: "Ouve sons propagados pela água a até 5 km de distância." },
          { codigo: "1.5", nome: "Sensor Hidrostático", descricao: "Detecta a presença de qualquer ser vivo que pise em água na cidade." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Escudo de Nereus",
        descricao: "Transforma água corrente em barreira intransponível para cainitas (impõe fobia de água).",
        aprimoramentos: [
          { codigo: "2.3", nome: "Repulsa Forte", descricao: "Cainitas que tocarem a água sofrem queimação similar a ácido." },
          { codigo: "2.4", nome: "Muralha Líquida", descricao: "A barreira de repulsa passa a repelir carniçais." },
          { codigo: "2.5", nome: "Barreira Total", descricao: "A barreira impede também a travessia de mortais e feras." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Grito Sangria",
        descricao: "Eleva a pressão interna de líquidos corporais, provocando vômito violento de sangue e perda de Vitæ.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Hemorragia Múltipla", descricao: "Afeta até 3 indivíduos simultaneamente no campo de visão." },
          { codigo: "3.5", nome: "Ruptura Vascular", descricao: "Causa rompimento de vasos sanguíneos e 2 de dano letal interno." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Transubstanciar",
        descricao: "Converte água comum em veneno, vinho, bílis ou sangue mortal ao toque; em vivos converte Vitæ em água.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Transubstanciação de Massa", descricao: "Transmuta barris inteiros ou caixas d'água de 1.000 litros instantaneamente." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Espada de Poseidon",
        descricao: "Dispara jato de água em ultra-alta velocidade cortando alvos como navalha (5 danos agravados ignorando 5 de RD).",
        aprimoramentos: [],
      },
    },
  },

  // 19. NECROMANCIA
  "Necromancia": {
    id: "necromancia",
    nome: "Necromancia",
    categoria: "necromancia",
    resumo: "Domínio sobre o mundo dos mortos, espectros e travessia da mortalha.",
    niveis: {
      1: {
        level: 1,
        codigoBase: "1.0",
        nome: "Visão da Mortalha",
        descricao: "Enxerga o mundo dos mortos, fantasmas, aparições e cicatrizes astrais deixadas por mortes violentas.",
        aprimoramentos: [
          { codigo: "1.2", nome: "Voz dos Túmulos", descricao: "Comunica-se e dialoga claramente com fantasmas e Wraiths." },
          { codigo: "1.3", nome: "Leitura de Cinzas", descricao: "Descobre a causa da morte e os últimos minutos de um cadáver." },
          { codigo: "1.4", nome: "Manto das Sombras Mortas", descricao: "Fica invisível para a percepção de espíritos da Umbra." },
          { codigo: "1.5", nome: "Sensor de Finados", descricao: "Detecta a presença de qualquer cadáver ou túmulo num raio de 1 km." },
        ],
      },
      2: {
        level: 2,
        codigoBase: "2.0",
        nome: "Língua Cadavérica",
        descricao: "Interroga cadáveres recentes para que revelem segredos e testemunhos da vida mortal.",
        aprimoramentos: [
          { codigo: "2.3", nome: "Cadáveres Antigos", descricao: "Pode interrogar ossadas de séculos anteriores sem perda de coerência." },
          { codigo: "2.4", nome: "Comando da Morte", descricao: "O cadáver responde obrigatoriamente sem mentir ou ocultar detalhes." },
          { codigo: "2.5", nome: "Autópsia Mística", descricao: "O cadáver relata os pensamentos de seu assassino no momento fatal." },
        ],
      },
      3: {
        level: 3,
        codigoBase: "3.0",
        nome: "Animar os Mortos",
        descricao: "Ergue cadáveres como zumbis servos que obedecem a comandos simples de guarda e combate.",
        aprimoramentos: [
          { codigo: "3.4", nome: "Horda de Esqueletos", descricao: "Pode animar até 5 cadáveres simultaneamente." },
          { codigo: "3.5", nome: "Servidão Eterna", descricao: "Os zumbis permanecem animados até serem destruídos fisicamente." },
        ],
      },
      4: {
        level: 4,
        codigoBase: "4.0",
        nome: "Rasgar a Mortalha",
        descricao: "Abre uma fenda na Mortalha permitindo puxar espíritos para o mundo físico ou atacá-los diretamente.",
        aprimoramentos: [
          { codigo: "4.5", nome: "Fenda Aberta", descricao: "A fenda permanece aberta por horas permitindo travessia mútua." },
        ],
      },
      5: {
        level: 5,
        codigoBase: "5.0",
        nome: "Travessia do Estige",
        descricao: "O cainita e seus companheiros atravessam fisicamente a Mortalha adentrando as Terras das Sombras e o Submundo.",
        aprimoramentos: [],
      },
    },
  },
};

export interface RitualTaumaturgicoCatalogItem {
  id: string;
  nome: string;
  nivel: number;
  descricao: string;
  ingredientes?: string;
}

export const RITUAIS_TAUMATURGICOS_CATALOGO: RitualTaumaturgicoCatalogItem[] = [
  // Nível 1
  { id: "rit-1-1", nome: "Despertar com o Frescor do Amanhecer", nivel: 1, descricao: "Círculo de cinzas de penas de pombo e vela; alerta o vampiro e permite acordar de dia sem penalidade nos 2 primeiros turnos." },
  { id: "rit-1-2", nome: "Defesa do Refúgio Sagrado", nivel: 1, descricao: "Sangue com a palma da mão sela janelas e frestas; impede penetração de luz solar em recinto semi-fechado até o anoitecer." },
  { id: "rit-1-3", nome: "A Bênção do Mestre", nivel: 1, descricao: "Comunicação telepática bilateral de 5 minutos com o senhor usando objeto de afeto dele." },
  { id: "rit-1-4", nome: "Proteção contra a Madeira", nivel: 1, descricao: "Círculo de madeira/serragem; estacas usadas no círculo quebram a ponta e causam no máximo 1 dano." },
  { id: "rit-1-5", nome: "Toque do Demônio", nivel: 1, descricao: "Amaldiçoa moeda/joia metálica com sangue de mortal vil; quem portá-la é tratado com agressividade e insultos por estranhos." },
  { id: "rit-1-6", nome: "Pureza da Carne", nivel: 1, descricao: "Meditação nua em pedras purifica o corpo expelindo drogas, balas, venenos e implantes." },
  { id: "rit-1-7", nome: "Rito de Apresentação", nivel: 1, descricao: "Mensagem telepática de 1 min via vapor d'água para o líder da capela da cidade." },
  { id: "rit-1-8", nome: "Receptáculo de Sangue", nivel: 1, descricao: "Encanta recipiente para extrair 1/10 de ponto de sangue de quem tocá-lo sem ferir." },
  { id: "rit-1-9", nome: "Renascimento da Vaidade", nivel: 1, descricao: "Faz crescer 10 cm de cabelo por ponto de Campo Pessoal excedente ao do alvo." },
  { id: "rit-1-10", nome: "Encantamento do Pastor", nivel: 1, descricao: "Localiza em círculos a pessoa de quem bebeu sangue três vezes mais próxima." },
  { id: "rit-1-11", nome: "Farejando o Rastro do Lobo", nivel: 1, descricao: "Incenso com acônito permite rastrear lupinos pelo olfato por 1 hora." },

  // Nível 2
  { id: "rit-2-1", nome: "Cadeia do Sangue", nivel: 2, descricao: "Amostra de sangue sob lua cheia revela o rosto e nome do senhor do vampiro, senhor do senhor, etc." },
  { id: "rit-2-2", nome: "Signo Contra Carniçais", nivel: 2, descricao: "Selo com sangue repele carniçais a 1 metro com fobia mórbida." },
  { id: "rit-2-3", nome: "Instilar com Vitæ", nivel: 2, descricao: "Armazena 1 Vitæ em uma pedra/objeto pequeno que se desfaz em sangue sob comando." },
  { id: "rit-2-4", nome: "Lágrimas de Sangue", nivel: 2, descricao: "Alvo chora sangue, sofre cegueira temporária e perde 1 a 2 pontos de sangue." },
  { id: "rit-2-5", nome: "Identificação do Igual", nivel: 2, descricao: "Espelho encantado que não reflete cainitas, identificando quem carrega a maldição de Caim." },

  // Nível 3
  { id: "rit-3-1", nome: "Signo Contra Lupinos", nivel: 3, descricao: "Selo com prata e sangue garou que repele lobisomens a 2 metros." },
  { id: "rit-3-2", nome: "Dardo da Paz Eterna", nivel: 3, descricao: "Estaca de sorveira entalhada que quebra dentro da carne e cava até o coração em 1d10 dias, paralisando o cainita." },
  { id: "rit-3-3", nome: "Pele de Toque Ígneo", nivel: 3, descricao: "Ingestão de brasa viva dá tom bronzeado; quem tocar o vampiro sente queimadura de chicote de fogo." },
  { id: "rit-3-4", nome: "A Mão de Rutheau", nivel: 3, descricao: "Decepa a própria mão e insere um dos olhos nela. A mão ganha vida, enxerga e obedece ordens como um servo fiel." },
  { id: "rit-3-5", nome: "O Baú da Meia Noite", nivel: 3, descricao: "Cria ponte dimensional com baú de jequitibá-rei; puxa qualquer item do baú através de um lenço a qualquer distância." },

  // Nível 4
  { id: "rit-4-1", nome: "Signo Contra Membros", nivel: 4, descricao: "Selo com Vitæ e terra abençoada que repele vampiros com fobia irresistível." },
  { id: "rit-4-2", nome: "Amarrar a Besta", nivel: 4, descricao: "Bebe sangue de criatura propensa a frenesi. Causa 1 dano agravado em si para acalmar a Besta do alvo em frenesi imediatamente." },
  { id: "rit-4-3", nome: "Coração de Pedra", nivel: 4, descricao: "Transforma o coração em pedra sobre círculo de 12 terras e vela rara. Imune a estacas, +4 contra Frenesi, Fome e Rötschreck." },
  { id: "rit-4-4", nome: "Estilhaço Servo", nivel: 4, descricao: "Estaca de cemitério em bainha encantada. Ao abrir e dar ordem verbal, explode e voa teleguiada ao coração do alvo atacando repetidamente." },
  { id: "rit-4-5", nome: "Adaga de Sengir", nivel: 4, descricao: "Forjada em ferro frio com glifos. Causa Força/2 + 1, ignora 1 de RD e drena 1 sangue para o detentor a cada golpe." },

  // Nível 5
  { id: "rit-5-1", nome: "Signo Contra Espíritos", nivel: 5, descricao: "Selo de sal que repele fantasmas, aparições e elementais." },
  { id: "rit-5-2", nome: "Contrato de Sangue", nivel: 5, descricao: "Contrato em pele humana assinado em sangue no equinócio. Quebrar o contrato acarreta morte por acidente místico em 1d10 horas." },
  { id: "rit-5-3", nome: "Sono de Pedra", nivel: 5, descricao: "Permite virar estátua de rocha maciça com RD 10, imune a fogo, sol e dano físico por até 6 vezes." },
  { id: "rit-5-4", nome: "Ao Nosso Comando Ele Respira", nivel: 5, descricao: "O ritual proibido dos Tremere para criar uma Gárgula costurando partes cainitas em líquido amniótico alquímico por 3 meses." },
  { id: "rit-5-5", nome: "A Rosa dos Ventos", nivel: 5, descricao: "Estrela de 5 pontas com 5 taumaturgos com Auspícios 3 meditando em sincronia para obter a visão da localização exata do alvo." },
];

const normalizeString = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/**
 * Encontra a definição canônica no catálogo por nome, id ou correspondência normalizada.
 */
export function findCanonicalDiscipline(disciplinaNome: string): DisciplineCatalogItem | null {
  if (!disciplinaNome) return null;
  const cleanName = normalizeString(disciplinaNome);

  // 1. Busca exata ou por correspondência de ID/nome normalizado
  for (const item of Object.values(DISCIPLINAS_CANONICAS_CATALOGO)) {
    const itemNorm = normalizeString(item.nome);
    const idNorm = normalizeString(item.id);
    if (
      itemNorm === cleanName ||
      idNorm === cleanName ||
      cleanName.includes(idNorm) ||
      itemNorm.includes(cleanName) ||
      cleanName.includes(itemNorm)
    ) {
      return item;
    }
  }

  // 2. Casos especiais e aliases canônicos
  if (cleanName.includes("taumaturgia") || cleanName.includes("rego") || cleanName.includes("creo")) {
    return DISCIPLINAS_CANONICAS_CATALOGO["Taumaturgia: Rego Motus (Movimento da Mente)"];
  }
  if (cleanName.includes("quietus") || cleanName.includes("quietude")) {
    return DISCIPLINAS_CANONICAS_CATALOGO["Quietude / Quietus"];
  }
  if (cleanName.includes("proteismo") || cleanName.includes("metamorfose")) {
    return DISCIPLINAS_CANONICAS_CATALOGO["Metamorfose / Proteísmo"];
  }
  if (cleanName.includes("celeridade") || cleanName.includes("rapidez")) {
    return DISCIPLINAS_CANONICAS_CATALOGO["Celeridade / Rapidez"];
  }

  return null;
}

/**
 * Gera a lista de poderes e aprimoramentos canônicos oficiais do livro
 * para uma disciplina em determinado nível (1 a 5).
 */
export function generateCanonicalSubLevels(disciplinaNome: string, nivel: number): SubNivelDisciplina[] {
  const catalogItem = findCanonicalDiscipline(disciplinaNome);

  if (!catalogItem) {
    // Fallback genérico caso seja uma disciplina homebrew não catalogada
    const list: SubNivelDisciplina[] = [];
    for (let main = 1; main <= nivel; main++) {
      list.push({
        codigo: `${main}.0`,
        nome: `Poder Fundamental Círculo ${main}`,
        descricao: `Efeito primário do círculo ${main}.`,
        ativo: true,
      });
      list.push({
        codigo: `${main}.1`,
        nome: `Aprimoramento ${main}.1`,
        descricao: `Evolução técnica passiva desbloqueada sem custo extra de XP.`,
        ativo: true,
      });
      if (main >= 2) {
        list.push({
          codigo: `${main}.2`,
          nome: `Aprimoramento ${main}.2`,
          descricao: `Refinamento secundário disponível automaticamente.`,
          ativo: true,
        });
      }
    }
    return list;
  }

  const list: SubNivelDisciplina[] = [];

  for (let currentLevel = 1; currentLevel <= nivel; currentLevel++) {
    const levelDef = catalogItem.niveis[currentLevel];
    if (!levelDef) continue;

    // 1. Adiciona o Poder Fundamental do nível (ex: 1.0, 2.0, 3.0)
    list.push({
      codigo: levelDef.codigoBase,
      nome: levelDef.nome,
      descricao: levelDef.descricao,
      ativo: true,
    });

    // 2. Adiciona os Aprimoramentos automáticos desbloqueados conforme o nível atual da disciplina:
    // Conforme a regra de auto-evolução de Regras de Ouro:
    // Ao comprar Nível 1: ganha poder 1.0
    // Ao comprar Nível 2: ganha poder 2.0 e poder 1 evolui para 1.2
    // Ao comprar Nível 3: ganha poder 3.0, poder 1 evolui para 1.3 e poder 2 para 2.3
    // Ao comprar Nível 4: poder 1 evolui para 1.4, poder 2 para 2.4, poder 3 para 3.4
    // Ao comprar Nível 5: poder 1 evolui para 1.5, poder 2 para 2.5, poder 3 para 3.5, poder 4 para 4.5
    for (const apr of levelDef.aprimoramentos) {
      const parts = apr.codigo.split(".");
      const requiredDiscLevel = parts.length > 1 ? Number(parts[1]) : currentLevel;

      if (nivel >= requiredDiscLevel) {
        list.push({
          codigo: apr.codigo,
          nome: apr.nome,
          descricao: apr.descricao,
          ativo: true,
        });
      }
    }
  }

  return list;
}

/**
 * Encontra o texto oficial de um poder específico no catálogo (ex: "1.0", "1.2") para restauração.
 */
export function findCanonicalPower(disciplinaNome: string, codigo: string): { nome: string; descricao: string } | null {
  const catalog = findCanonicalDiscipline(disciplinaNome);
  if (!catalog) return null;

  for (const level of Object.values(catalog.niveis)) {
    if (level.codigoBase === codigo) {
      return { nome: level.nome, descricao: level.descricao };
    }
    const aprimoramento = level.aprimoramentos.find((a) => a.codigo === codigo);
    if (aprimoramento) {
      return { nome: aprimoramento.nome, descricao: aprimoramento.descricao };
    }
  }

  return null;
}

/**
 * Verifica se a lista de subníveis contém apenas os textos placeholders genéricos antigos
 * ("Poder Fundamental Círculo X" ou "Aprimoramento X.X"). Ignora poderes customizados pelo jogador.
 */
export function isPlaceholderSubLevels(subNiveis?: SubNivelDisciplina[]): boolean {
  if (!subNiveis || subNiveis.length === 0) return true;
  return subNiveis.some((s) => {
    if (s.customizado) return false;
    const isPoderPlaceholder = /^Poder Fundamental C[ií]rculo \d+$/i.test(s.nome.trim());
    const isAprimoramentoPlaceholder = /^Aprimoramento \d+\.\d+$/i.test(s.nome.trim());
    const hasGenericDesc =
      s.descricao.includes("Evolução técnica passiva") ||
      s.descricao.includes("Efeito primário do círculo") ||
      s.descricao.includes("Refinamento secundário disponível");
    return isPoderPlaceholder || isAprimoramentoPlaceholder || hasGenericDesc;
  });
}

/**
 * As 5 Sendas canônicas oficiais de Taumaturgia de Regras de Ouro 2.0.
 */
export const SENDAS_TAUMATURGICAS = [
  "Taumaturgia: Rego Motus (Movimento da Mente)",
  "Taumaturgia: Rego Vitae (Trilha do Sangue)",
  "Taumaturgia: Creo Ignem (Sedução das Chamas)",
  "Taumaturgia: Rego Tempestas (Poder do Clima)",
  "Taumaturgia: Rego Aquam (Domínio das Águas)",
] as const;

/**
 * Lista formatada de todas as disciplinas canônicas para seleção rápida e limpa em UIs.
 */
export const CANONICAL_DISCIPLINES_LIST = Object.values(DISCIPLINAS_CANONICAS_CATALOGO).map((item) => ({
  id: item.id,
  nome: item.nome,
  categoria: item.categoria || "comum",
  resumo: item.resumo,
}));

