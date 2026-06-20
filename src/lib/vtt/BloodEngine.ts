export interface V5RollResult {
  type: "standard";
  poolSize: number;
  hungerLevel: number;
  difficulty: number;
  normalDice: number[];
  hungerDice: number[];
  totalSuccesses: number;
  criticalPairs: number;
  isSuccess: boolean;
  isMessianic: boolean;
  isBestialFailure: boolean;
  hasBestialFailureFlag: boolean;
}

export interface RouseCheckResult {
  type: "rouse";
  dieResult: number;
  isSuccess: boolean; // true se >= 6 (Fome mantida)
}

/**
 * Executa uma rolagem padrão do sistema de regras de Vampiro: A Máscara 5ª Edição.
 */
export function rollV5(
  poolSize: number,
  hungerLevel: number,
  difficulty: number = 0
): V5RollResult {
  // O valor mínimo de dados rolados deve ser 1
  const actualPoolSize = Math.max(1, poolSize);
  const hungerDiceCount = Math.min(actualPoolSize, hungerLevel);
  const normalDiceCount = Math.max(0, actualPoolSize - hungerDiceCount);

  // Rolar os dados (1 a 10)
  const normalDice: number[] = [];
  for (let i = 0; i < normalDiceCount; i++) {
    normalDice.push(Math.floor(Math.random() * 10) + 1);
  }

  const hungerDice: number[] = [];
  for (let i = 0; i < hungerDiceCount; i++) {
    hungerDice.push(Math.floor(Math.random() * 10) + 1);
  }

  // Contagem básica de sucessos (dados >= 6)
  const normalSuccesses = normalDice.filter(d => d >= 6).length;
  const hungerSuccesses = hungerDice.filter(d => d >= 6).length;
  const baseSuccesses = normalSuccesses + hungerSuccesses;

  // Contagem de 10s para críticos (pares de 10)
  const normalTens = normalDice.filter(d => d === 10).length;
  const hungerTens = hungerDice.filter(d => d === 10).length;
  const totalTens = normalTens + hungerTens;

  const criticalPairs = Math.floor(totalTens / 2);
  const criticalBonusSuccesses = criticalPairs * 2; // Cada par de 10 adiciona +2 sucessos de bônus

  const totalSuccesses = baseSuccesses + criticalBonusSuccesses;

  // Crítico Messiânico: Crítico em que pelo menos um 10 é dos dados de Fome
  const isMessianic = criticalPairs > 0 && hungerTens > 0;

  // Presença de "1" nos dados de Fome
  const hasBestialFailureFlag = hungerDice.some(d => d === 1);

  // Veredito de Sucesso / Falha
  let isSuccess = false;
  let failed = false;

  if (difficulty > 0) {
    isSuccess = totalSuccesses >= difficulty;
    failed = totalSuccesses < difficulty;
  } else {
    // Sem dificuldade explícita, qualquer sucesso conta para feedback básico
    isSuccess = totalSuccesses > 0;
    failed = totalSuccesses === 0;
  }

  // Falha Bestial: Ação falhou E teve pelo menos um "1" nos dados de Fome
  const isBestialFailure = hasBestialFailureFlag && failed;

  return {
    type: "standard",
    poolSize: actualPoolSize,
    hungerLevel,
    difficulty,
    normalDice,
    hungerDice,
    totalSuccesses,
    criticalPairs,
    isSuccess,
    isMessianic,
    isBestialFailure,
    hasBestialFailureFlag,
  };
}

/**
 * Executa um Teste de Despertar (Rouse Check).
 * Rola 1 único dado normal. Resultado >= 6 é sucesso (Fome mantida), < 6 é falha (Fome aumenta).
 */
export function rollRouseCheck(): RouseCheckResult {
  const dieResult = Math.floor(Math.random() * 10) + 1;
  const isSuccess = dieResult >= 6;

  return {
    type: "rouse",
    dieResult,
    isSuccess,
  };
}
