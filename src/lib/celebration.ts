"use client";

import confetti from "canvas-confetti";

const COLORS = ["#f84015", "#22c55e", "#fbbf24", "#3b82f6", "#a855f7"];

/** Confetti estándar para XP y logros pequeños */
export function confettiBurst() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: COLORS,
  });
}

/** Fuegos artificiales para plan semanal y hitos grandes */
export function fireworks() {
  const duration = 2500;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: COLORS,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: COLORS,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

/** Explosión central para misiones completadas */
export function missionComplete() {
  const count = 150;
  const defaults = { origin: { y: 0.5 }, colors: COLORS };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

/** Partículas suaves para desbloqueos (modo oscuro, etc.) */
export function particles() {
  confetti({
    particleCount: 50,
    spread: 100,
    origin: { y: 0.5 },
    colors: COLORS,
    scalar: 0.8,
    drift: 0.5,
  });
}

/** Lluvia de confetti desde arriba */
export function confettiRain() {
  const count = 100;
  const defaults = { origin: { y: 0 }, colors: COLORS };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.1, { spread: 120, startVelocity: 30 });
  fire(0.15, { spread: 120, startVelocity: 45 });
  fire(0.2, { spread: 120, startVelocity: 60 });
}
