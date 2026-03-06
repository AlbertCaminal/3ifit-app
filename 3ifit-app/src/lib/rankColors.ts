/** Colores para posiciones 1º, 2º, 3º en rankings. Sincronizado con globals.css */
export const RANK_COLORS = ["#ffd700", "#c0c0c0", "#cd7f32"] as const; // oro, plata, bronce

/** Degradados para círculos del podio (igual que niveles) */
export const RANK_GRADIENTS = [
  "linear-gradient(135deg, #f59e0b 0%, #fbbf24 25%, #fef3c7 50%, #fbbf24 75%, #f59e0b 100%)", // oro
  "linear-gradient(135deg, #a8a8a8 0%, #c0c0c0 25%, #e8e8e8 50%, #c0c0c0 75%, #a8a8a8 100%)", // plata
  "linear-gradient(135deg, #b87333 0%, #cd7f32 25%, #e8d5c4 50%, #cd7f32 75%, #b87333 100%)", // bronce
] as const;

export function getRankColor(rank: number): string {
  return rank <= 3 ? RANK_COLORS[rank - 1]! : "var(--color-text-primary)";
}

export function getRankGradient(rank: number): string | null {
  return rank <= 3 ? RANK_GRADIENTS[rank - 1]! : null;
}
