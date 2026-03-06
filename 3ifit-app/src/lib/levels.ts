// Umbrales de XP para cada nivel (acumulativo)
export const LEVEL_XP_THRESHOLDS: Record<number, number> = {
  1: 0, // Bronce
  2: 1000, // Plata
  3: 3000, // Oro
  4: 6000, // Platino
  5: 10000, // Diamante
};

export const LEVEL_NAMES: Record<number, string> = {
  1: "Bronce",
  2: "Plata",
  3: "Oro",
  4: "Platino",
  5: "Diamante",
};

export const LEVEL_COLORS: Record<number, string> = {
  1: "#cd7f32", // Bronce
  2: "#c0c0c0", // Plata
  3: "#ffd700", // Oro
  4: "#e09696", // Platino - más rosado
  5: "#38bdf8", // Diamante - azul diamante
};

export function getLevelName(level: number): string {
  return LEVEL_NAMES[level] ?? "Bronce";
}

export function getLevelColor(level: number): string {
  return LEVEL_COLORS[level] ?? LEVEL_COLORS[1];
}

export function getLevelFromXP(xp: number): number {
  if (xp >= 10000) return 5;
  if (xp >= 6000) return 4;
  if (xp >= 3000) return 3;
  if (xp >= 1000) return 2;
  return 1;
}

export function getXPToNextLevel(currentXP: number): number | null {
  const level = getLevelFromXP(currentXP);
  if (level === 5) return null;
  const nextThreshold = LEVEL_XP_THRESHOLDS[level + 1];
  return nextThreshold - currentXP;
}

export function getXPProgressInLevel(currentXP: number): {
  current: number;
  needed: number;
  percent: number;
} {
  const level = getLevelFromXP(currentXP);
  if (level === 5) return { current: 0, needed: 0, percent: 100 };
  const thresholdCurrent = LEVEL_XP_THRESHOLDS[level];
  const thresholdNext = LEVEL_XP_THRESHOLDS[level + 1];
  const current = currentXP - thresholdCurrent;
  const needed = thresholdNext - thresholdCurrent;
  return {
    current,
    needed,
    percent: needed > 0 ? Math.round((current / needed) * 100) : 100,
  };
}
