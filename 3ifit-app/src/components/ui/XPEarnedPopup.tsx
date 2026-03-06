"use client";

import { useLayoutEffect, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface XPEarnedPopupProps {
  amount: number;
  visible: boolean;
  onComplete?: () => void;
}

const POPUP_DURATION_MS = 1000;

export function XPEarnedPopup({
  amount,
  visible,
  onComplete,
}: XPEarnedPopupProps) {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!visible || amount <= 0) return;
    const t = setTimeout(() => onComplete?.(), POPUP_DURATION_MS);
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
      <div className="animate-xp-popup rounded-2xl bg-[var(--color-bg-card)] px-8 py-4 shadow-[var(--shadow-popup)] opacity-100">
        <span className="text-xl font-bold text-[var(--color-success)]">+{amount} XP</span>
      </div>
    </div>,
    document.body,
  );
}
