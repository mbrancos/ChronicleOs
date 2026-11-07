import {
  calculateArchetypeBonuses,
  calculateInitialTrilha,
  getKeywordModifier,
  applyAnatomicalDamage,
  healSectorDamage,
  calculateXpCost,
  getPanicResult,
  createInitialRegrasDeOuroSheet,
  calculateRegrasDeOuroAllocation,
} from "./rules";
import { INITIAL_ANATOMICAL_VITALITY } from "./constants";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("Iniciando testes unitários do motor de regras...");

// 1. Arquétipos
const { campoPessoal, pontosVirtudes } = calculateArchetypeBonuses("Sobrevivente", "Solitário");
assert(campoPessoal === 4, `Campo pessoal esperado 4, obteve ${campoPessoal}`);
assert(pontosVirtudes === 7, `Pontos virtudes esperado 7, obteve ${pontosVirtudes}`);

// 2. Trilha Inicial
const trilha = calculateInitialTrilha(3, 4);
assert(trilha === 7, `Trilha esperada 7, obteve ${trilha}`);

// 3. Modificadores de Palavra-Chave
assert(getKeywordModifier("fraco") === -2, "Fraco deve ser -2");
assert(getKeywordModifier("medio") === 0, "Médio deve ser 0");
assert(getKeywordModifier("bom") === 1, "Bom deve ser +1");
assert(getKeywordModifier("otimo") === 2, "Ótimo deve ser +2");
assert(getKeywordModifier("excepcional") === 3, "Excepcional deve ser +3");
assert(getKeywordModifier("extraordinario") === 4, "Extraordinário deve ser +4");

// 4. Dano Anatômico e Transbordamento (Overflow)
const vit = JSON.parse(JSON.stringify(INITIAL_ANATOMICAL_VITALITY));
// Cabeça tem maxNormal: 5, maxLetal: 4, maxAgravado: 3
// Aplicando 6 pontos de dano normal na cabeça: deve encher 5 normais e 1 transbordar para letal!
const afterNormal = applyAnatomicalDamage(vit, "cabeca", "normal", 6);
assert(afterNormal.cabeca.normal === 5, `Normal na cabeça esperado 5, obteve ${afterNormal.cabeca.normal}`);
assert(afterNormal.cabeca.letal === 1, `Letal transbordado esperado 1, obteve ${afterNormal.cabeca.letal}`);
assert(afterNormal.cabeca.penalty === -2, `Penalidade na cabeça esperada -2, obteve ${afterNormal.cabeca.penalty}`);

// Propagação de penalidade vital para os braços
assert(afterNormal.braco_d.penalty === -2, `Braço D deve herdar penalidade vital de -2 da cabeça, obteve ${afterNormal.braco_d.penalty}`);

// 5. Cura com Vitæ
const healed = healSectorDamage(afterNormal, "cabeca", "normal_all");
assert(healed.vitality.cabeca.normal === 0, "Dano normal na cabeça deve ser zerado");
assert(healed.vitaeCost === 1, "Custo deve ser 1 Vitæ");

// 6. Custos de XP (Página 108)
// Novo nível de Talento: 8 + alvo
assert(calculateXpCost("talento", 4, 13) === 12, "Força 4 deve custar 8 + 4 = 12 XP");

// Trilha: 10 - Consciência
assert(calculateXpCost("trilha", 8, 13, false, undefined, undefined, 3) === 7, "Trilha com Consciência 3 deve custar 10 - 3 = 7 XP");

// Disciplina nova (nível 1): Geração do vampiro em pontos
assert(calculateXpCost("disciplina_nova", 1, 13, false) === 13, "Nova disciplina fora de clã 13ª geração deve custar 13 XP");
assert(calculateXpCost("disciplina_nova", 1, 13, true) === 11, "Nova disciplina de clã 13ª geração deve custar 11 XP (2 gerações mais antiga)");

// Disciplina nível (nível 3): nível atual (2) x Geração
assert(calculateXpCost("disciplina_nivel", 3, 13, false) === 26, "Disciplina nível 3 fora de clã deve custar 2 * 13 = 26 XP");
assert(calculateXpCost("disciplina_nivel", 3, 13, true) === 22, "Disciplina nível 3 de clã deve custar 2 * 11 = 22 XP");

// 7. Pânico
const panic = getPanicResult(5, 2); // score = 7
assert(panic.minRoll === 1, "Score 7 deve cair em Estado de choque");

// 8. Ficha Inicial
const sheet = createInitialRegrasDeOuroSheet({ name: "Ian", cla: "Gangrel" });
assert(sheet.cla === "Gangrel", "Clã deve ser Gangrel");
assert(sheet.systemId === "regras_de_ouro", "SystemId deve ser regras_de_ouro");
assert(sheet.campoPessoal >= 1, "Campo pessoal deve ser preenchido");

// 9. Rastreador de Alocação e Dicas de Criação (Passo 2 a 8)
// 9.1 Neonato
const neonatoAlloc = calculateRegrasDeOuroAllocation(sheet);
assert(neonatoAlloc.talentosQuota === 20, "Neonato deve ter cota de 20 talentos");
assert(neonatoAlloc.talentosSpent === 12, "Sheet inicial tem 12 talentos gastos (1 em cada)");
assert(neonatoAlloc.talentosRemaining === 8, "Devem restar 8 pontos de talentos para Neonato");
assert(neonatoAlloc.disciplinasQuota === 3, "Cota inicial de disciplinas deve ser 3");
assert(neonatoAlloc.disciplinasRemaining === 3, "Disciplinas restantes devem ser 3");
assert(neonatoAlloc.isDraft === true, "Ficha inicial com pontos a distribuir deve ser rascunho (isDraft = true)");

// 9.2 Mudança de Etária para Neófito
const neofitoSheet = { ...sheet, etaria: "neofito" as const };
const neofitoAlloc = calculateRegrasDeOuroAllocation(neofitoSheet);
assert(neofitoAlloc.talentosQuota === 22, "Neófito deve ter cota de 22 talentos");
assert(neofitoAlloc.talentosRemaining === 10, "Devem restar 10 pontos de talentos para Neófito");
assert(neofitoAlloc.keywordsAlloc.bomBase === 3, "Neófito começa com cota base de 3 Bom");
assert(neofitoAlloc.keywordsAlloc.maxFracosExtras === 1, "Neófito pode ter até 1 Fraco extra");

// 9.3 Ancilla com Fracos Extras e Bônus de Palavras-Chave
const ancillaSheet = {
  ...sheet,
  etaria: "ancilla" as const,
  palavrasChave: [
    { id: "k1", nome: "Tecnologia", grau: "fraco" as const },
    { id: "k2", nome: "Cultura Moderna", grau: "fraco" as const },
    { id: "k3", nome: "Armas de Fogo", grau: "fraco" as const },
  ],
};
const ancillaAlloc = calculateRegrasDeOuroAllocation(ancillaSheet);
assert(ancillaAlloc.talentosQuota === 24, "Ancilla deve ter cota de 24 talentos");
assert(ancillaAlloc.keywordsAlloc.fracoBase === 1, "Ancilla tem 1 Fraco base");
assert(ancillaAlloc.keywordsAlloc.fracosAtuais === 3, "3 Fracos cadastrados");
assert(ancillaAlloc.keywordsAlloc.fracosExtras === 2, "2 Fracos extras assumidos");
// 4 base + (2 extras * 2) = 8 Bom permitidos
assert(ancillaAlloc.keywordsAlloc.bomPermitido === 8, "2 Fracos extras devem conceder +4 Bom (total 8 Bom)");

// 9.4 Decréscimo dinâmico de Virtudes e Disciplinas
const evolvedSheet = {
  ...sheet,
  virtudes: { consciencia: 4, autocontrole: 3, coragem: 3 }, // 3 + 2 + 2 = 7 gastos
  disciplinas: [{ id: "d1", nome: "Rapidez", nivel: 3, poderes: [] }],
  talentos: {
    forca: 2, vigor: 2, agilidade: 2,
    destreza: 2, aparencia: 1, social: 2, emocional: 2, espacial: 2,
    logica: 2, linguistica: 1, musical: 1, naturalista: 1 // total = 20
  }
};
const evolvedAlloc = calculateRegrasDeOuroAllocation(evolvedSheet);
assert(evolvedAlloc.virtudesRemaining === 0, "Virtudes restantes devem ser 0");
assert(evolvedAlloc.disciplinasRemaining === 0, "Disciplinas restantes devem ser 0");
assert(evolvedAlloc.talentosRemaining === 0, "Talentos restantes devem ser 0");
assert(evolvedAlloc.isDraft === false, "Ficha com cotas zeradas não deve ser rascunho (isDraft = false)");

console.log("TODOS OS TESTES DO MOTOR DE REGRAS PASSARAM COM SUCESSO!");
