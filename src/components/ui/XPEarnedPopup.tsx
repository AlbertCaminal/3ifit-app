"use client";

import { useLayoutEffect, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  confettiBurst,
  fireworks,
  missionComplete,
} from "@/lib/celebration";

interface XPEarnedPopupProps {
  amount: number;
  visible: boolean;
  onComplete?: () => void;
}

const POPUP_DURATION_MS = 800;

function triggerCelebration(amount: number) {
  requestAnimationFrame(() => {
    if (amount >= 75) fireworks();
    else if (amount >= 50) missionComplete();
    else confettiBurst();
  });
}

export function XPEarnedPopup({
  amount,
  visible,
  onComplete,
}: XPEarnedPopupProps) {
  const [mounted, setMounted] = useState(false);
  const celebratedRef = useRef(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!visible || amount <= 0) return;
    if (!celebratedRef.current) {
      triggerCelebration(amount);
      celebratedRef.current = true;
    }
    const t = setTimeout(() => {
      onComplete?.();
      celebratedRef.current = false;
    }, POPUP_DURATION_MS);
    return () => clearTimeout(t);
  }, [visible, amount, onComplete]);

  if (
    !mounted ||
    typeof document === "undefined" ||
    !document?.body ||
    amount <= 0
  )
    return null;
  if (!visible) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed left-1/2 top-1/4 z-[99999] -translate-x-1/2"
      aria-hidden
    >
      <div className="animate-xp-popup rounded-2xl border-2 border-[var(--color-success)] bg-[var(--color-bg-card)] px-8 py-5 shadow-[var(--shadow-popup)] opacity-100">
        <span className="text-2xl font-bold text-[var(--color-success)]">
          +{amount} XP
        </span>
      </div>
    </div>,
    document.body,
  );
}
