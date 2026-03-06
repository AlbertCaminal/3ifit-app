"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEYS = {
  enabled: "pausas_reminder_enabled",
  start: "pausas_reminder_start",
  end: "pausas_reminder_end",
  lastShownHour: "pausas_reminder_last_hour",
} as const;

const DEFAULT_START = "09:00";
const DEFAULT_END = "18:00";

interface BreakReminderContextValue {
  requestNotificationPermission: () => Promise<boolean>;
}

const BreakReminderContext = createContext<BreakReminderContextValue | null>(null);

interface BreakReminderProviderProps {
  children: ReactNode;
  pausasUnlocked?: boolean;
}

function parseTime(str: string): { h: number; m: number } {
  const [h, m] = str.split(":").map(Number);
  return { h: h ?? 9, m: m ?? 0 };
}

function timeToMinutes(str: string): number {
  const { h, m } = parseTime(str);
  return h * 60 + m;
}

function isWithinRange(now: Date, startStr: string, endStr: string): boolean {
  const nowM = now.getHours() * 60 + now.getMinutes();
  const startM = timeToMinutes(startStr);
  const endM = timeToMinutes(endStr);
  if (startM <= endM) return nowM >= startM && nowM < endM;
  return nowM >= startM || nowM < endM;
}

export function BreakReminderProvider({
  children,
  pausasUnlocked = true,
}: BreakReminderProviderProps) {
  const [showPopup, setShowPopup] = useState(false);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const perm = await Notification.requestPermission();
    return perm === "granted";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = () => {
      try {
        if (!pausasUnlocked) return;
        const enabled = localStorage.getItem(STORAGE_KEYS.enabled) === "true";
        if (!enabled) return;

        const start = localStorage.getItem(STORAGE_KEYS.start) ?? DEFAULT_START;
        const end = localStorage.getItem(STORAGE_KEYS.end) ?? DEFAULT_END;

        const now = new Date();
        if (!isWithinRange(now, start, end)) return;

        const currentHour = now.getHours();
        const lastShown = localStorage.getItem(STORAGE_KEYS.lastShownHour);
        if (lastShown !== null && parseInt(lastShown, 10) === currentHour) return;
        localStorage.setItem(STORAGE_KEYS.lastShownHour, String(currentHour));

        if (Notification.permission === "granted") {
          new Notification("Pausa activa", {
            body: "Es hora de hacer una pausa. Levántate, estira y muévete un poco.",
            icon: "/icons/icon-192.png",
          });
        }

        setShowPopup(true);
      } catch {
        // ignore
      }
    };

    check();
    const id = setInterval(check, 60 * 1000);
    return () => clearInterval(id);
  }, [pausasUnlocked]);

  const dismissPopup = useCallback(() => setShowPopup(false), []);

  return (
    <BreakReminderContext.Provider value={{ requestNotificationPermission }}>
      {children}
      {showPopup && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 p-4"
          onClick={dismissPopup}
        >
          <div
            className="max-w-sm rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Pausa activa
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Es hora de hacer una pausa. Levántate, estira y muévete un poco.
            </p>
            <button
              type="button"
              onClick={dismissPopup}
              className="btn-primary mt-4 w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </BreakReminderContext.Provider>
  );
}

export function useBreakReminder() {
  const ctx = useContext(BreakReminderContext);
  return ctx ?? { requestNotificationPermission: async () => false };
}

export { STORAGE_KEYS, DEFAULT_START, DEFAULT_END };
