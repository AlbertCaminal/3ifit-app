"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { XPEarnedPopup } from "@/components/ui/XPEarnedPopup";

export type ShowXPOptions = {
  /** Evita duplicados: solo 1 pop-up por source en SOURCE_COOLDOWN_MS */
  source?: string;
};

interface XPContextValue {
  showXP: (amount: number, options?: ShowXPOptions) => void;
}

const XPContext = createContext<XPContextValue | null>(null);

const SOURCE_COOLDOWN_MS = 60000;

export function XPProvider({ children }: { children: ReactNode }) {
  const [popup, setPopup] = useState<{
    amount: number;
    visible: boolean;
    key: number;
  }>({
    amount: 0,
    visible: false,
    key: 0,
  });
  const queueRef = useRef<number[]>([]);
  const lastShowBySource = useRef<Map<string, number>>(new Map());

  const showNextFromQueue = useCallback(() => {
    const next = queueRef.current.shift();
    if (next != null && next > 0) {
      setPopup({ amount: next, visible: true, key: Date.now() });
    } else {
      setPopup((p) => ({ ...p, visible: false }));
    }
  }, []);

  const showXP = useCallback((amount: number, options?: ShowXPOptions) => {
    if (amount <= 0) return;
    const now = Date.now();

    if (options?.source) {
      const last = lastShowBySource.current.get(options.source);
      if (last != null && now - last < SOURCE_COOLDOWN_MS) return;
      lastShowBySource.current.set(options.source, now);
    }

    setPopup((p) => {
      if (p.visible) {
        queueRef.current.push(amount);
        return p;
      }
      return { amount, visible: true, key: now };
    });
  }, []);

  const handleComplete = useCallback(() => {
    showNextFromQueue();
  }, [showNextFromQueue]);

  return (
    <XPContext.Provider value={{ showXP }}>
      {children}
      <XPEarnedPopup
        key={popup.key || "xp-popup"}
        amount={popup.amount}
        visible={popup.visible}
        onComplete={handleComplete}
      />
    </XPContext.Provider>
  );
}

export function useXP() {
  const ctx = useContext(XPContext);
  if (!ctx) {
    return { showXP: () => {} };
  }
  return ctx;
}
