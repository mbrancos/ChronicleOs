export const CLAN_DISCIPLINE_MAPPING: Record<string, string[]> = {
  "Banu Haqim": ["Feitiçaria de Sangue (Blood Sorcery)", "Rapidez (Celerity)", "Ofuscação (Obfuscate)"],
  "Brujah": ["Rapidez (Celerity)", "Potência (Potence)", "Presença (Presence)"],
  "Gangrel": ["Animalismo (Animalism)", "Fortitude", "Metamorfose (Protean)"],
  "Hecata": ["Auspício (Auspex)", "Fortitude", "Oblivion (Esquecimento)"],
  "Lasombra": ["Dominação (Dominate)", "Oblivion (Esquecimento)", "Potência (Potence)"],
  "Malkaviano": ["Auspício (Auspex)", "Ofuscação (Obfuscate)", "Dominação (Dominate)"],
  "Malkavian": ["Auspício (Auspex)", "Ofuscação (Obfuscate)", "Dominação (Dominate)"],
  "Ministério": ["Ofuscação (Obfuscate)", "Presença (Presence)", "Metamorfose (Protean)"],
  "Nosferatu": ["Animalismo (Animalism)", "Ofuscação (Obfuscate)", "Potência (Potence)"],
  "Ravnos": ["Animalismo (Animalism)", "Ofuscação (Obfuscate)", "Presença (Presence)"],
  "Salubri": ["Auspício (Auspex)", "Fortitude", "Presença (Presence)"],
  "Toreador": ["Auspício (Auspex)", "Rapidez (Celerity)", "Presença (Presence)"],
  "Tremere": ["Auspício (Auspex)", "Dominação (Dominate)", "Feitiçaria de Sangue (Blood Sorcery)"],
  "Tzimisce": ["Animalismo (Animalism)", "Dominação (Dominate)", "Metamorfose (Protean)"],
  "Ventrue": ["Dominação (Dominate)", "Fortitude", "Presença (Presence)"]
};

// Função para calcular o total de XP gasto a partir do buildState do V5
export function calculateSpentXp(clan: string, buildState: any): number {
  if (!buildState) return 0;
  let totalXp = 0;

  const isCaitiffOrThin = clan === "Caitiff" || clan === "Sem Clã" || clan === "Sangue-Ralo";

  // 1. Atributos (Novo Nível * 5)
  if (buildState.attributes) {
    Object.values(buildState.attributes).forEach((attr: any) => {
      if (attr && attr.xp > 0) {
        const start = attr.base || 1;
        const end = start + attr.xp;
        for (let lvl = start + 1; lvl <= end; lvl++) {
          totalXp += lvl * 5;
        }
      }
    });
  }

  // 2. Habilidades (Novo Nível * 3)
  if (buildState.skills) {
    Object.values(buildState.skills).forEach((skill: any) => {
      if (skill && skill.xp > 0) {
        const start = skill.base || 0;
        const end = start + skill.xp;
        for (let lvl = start + 1; lvl <= end; lvl++) {
          totalXp += lvl * 3;
        }
      }
    });
  }

  // 3. Disciplinas
  if (buildState.disciplines) {
    const clanDisciplines = CLAN_DISCIPLINE_MAPPING[clan] || [];
    Object.entries(buildState.disciplines).forEach(([discName, points]: any) => {
      if (points && points.xp > 0) {
        const isClanDisc = clanDisciplines.some(d => discName.toLowerCase().includes(d.split(" ")[0].toLowerCase()));
        
        let costMultiplier = 7; // Fora do Clã
        if (isCaitiffOrThin) {
          costMultiplier = 6; // Caitiff qualquer disciplina
        } else if (isClanDisc) {
          costMultiplier = 5; // Disciplina de Clã
        }

        const start = points.base || 0;
        const end = start + points.xp;
        for (let lvl = start + 1; lvl <= end; lvl++) {
          totalXp += lvl * costMultiplier;
        }
      }
    });
  }

  // 4. Vantagens (3 XP por ponto de vantagem)
  if (buildState.advantages) {
    Object.values(buildState.advantages).forEach((points: any) => {
      if (points && points.xp > 0) {
        totalXp += points.xp * 3;
      }
    });
  }

  // 5. Especializações (3 XP cada)
  if (buildState.specialties && Array.isArray(buildState.specialties)) {
    buildState.specialties.forEach((spec: any) => {
      if (spec && spec.isXp) {
        totalXp += 3;
      }
    });
  }

  // 6. Potência de Sangue (Novo Nível * 10)
  if (buildState.blood_potency && buildState.blood_potency.xp > 0) {
    const start = buildState.blood_potency.base || 1;
    const end = start + buildState.blood_potency.xp;
    for (let lvl = start + 1; lvl <= end; lvl++) {
      totalXp += lvl * 10;
    }
  }

  // 7. Humanidade (Novo Nível * 10)
  if (buildState.humanity && buildState.humanity.xp > 0) {
    const start = buildState.humanity.base || 7;
    const end = start + buildState.humanity.xp;
    for (let lvl = start + 1; lvl <= end; lvl++) {
      totalXp += lvl * 10;
    }
  }

  return totalXp;
}
