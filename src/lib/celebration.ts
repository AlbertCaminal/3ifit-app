"use client";

import confetti from "canvas-confetti";

const COLORS = ["#f84015", "#22c55e", "#fbbf24", "#3b82f6", "#a855f7"];

/** Confetti estándar para XP y logros pequeños */
export function confettiBurst() {
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { y: 0.6 },
    colors: COLORS,
    ticks: 80,
  });
}

/** Fuegos artificiales para plan semanal y hitos grandes */
export function fireworks() {
  const duration = 1200;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 50,
      origin: { x: 0 },
      colors: COLORS,
      ticks: 60,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 50,
      origin: { x: 1 },
      colors: COLORS,
      ticks: 60,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

/** Explosión central para misiones completadas */
export function missionComplete() {
  const count = 60;
  const defaults = { origin: { y: 0.5 }, colors: COLORS, ticks: 70 };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }
  fire(0.4, { spread: 80 });
  fire(0.3, { spread: 100, decay: 0.92 });
}

/** Partículas suaves para desbloqueos (modo oscuro, etc.) */
export function particles() {
  confetti({
    particleCount: 30,
    spread: 80,
    origin: { y: 0.5 },
    colors: COLORS,
    scalar: 0.7,
    ticks: 60,
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
