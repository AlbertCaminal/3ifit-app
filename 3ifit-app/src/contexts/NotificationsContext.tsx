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
import { getReminderStatus } from "@/app/(app)/app/configuracion/actions-notifications";
import { getNotificationsEnabled } from "@/app/(app)/app/configuracion/actions";
import { subscribeToPush } from "@/lib/push-subscribe";

const ACTIVITY_REMINDER_HOUR = 14; // Mostrar recordatorio de actividad a partir de las 14:00
const CHECK_INTERVAL_MS = 30 * 60 * 1000; // Cada 30 minutos

interface NotificationsContextValue {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  requestNotificationPermission: () => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface NotificationsProviderProps {
  children: ReactNode;
  initialEnabled?: boolean;
}

export function NotificationsProvider({
  children,
  initialEnabled = true,
}: NotificationsProviderProps) {
  const [notificationsEnabled, setNotificationsEnabledState] =
    useState(initialEnabled);
  const planShownForDate = useRef<string | null>(null);
  const activityShownForDate = useRef<string | null>(null);

  useEffect(() => {
    setNotificationsEnabledState(initialEnabled);
  }, [initialEnabled]);

  useEffect(() => {
    if (typeof window === "undefined" || !initialEnabled) return;
    if (Notification.permission === "granted") {
      subscribeToPush();
    }
  }, [initialEnabled]);

  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    setNotificationsEnabledState(enabled);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") {
      await subscribeToPush();
      return true;
    }
    if (Notification.permission === "denied") return false;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      await subscribeToPush();
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = async () => {
      try {
        const enabled = await getNotificationsEnabled();
        if (!enabled) return;
        if (Notification.permission !== "granted") return;

        const status = await getReminderStatus();
        if (!status) return;

        const today = getTodayKey();
        const now = new Date();
        const currentHour = now.getHours();

        // Plan semanal: "Te faltan X días para completar tu plan esta semana"
        if (status.daysRemaining > 0 && status.daysRemaining <= 3) {
          if (planShownForDate.current !== today) {
            const daysText =
              status.daysRemaining === 1
                ? "1 día"
                : `${status.daysRemaining} días`;
            const title = "Plan semanal";
            const body = `Te faltan ${daysText} para completar tu plan esta semana`;

            new Notification(title, {
              body,
              icon: "/icons/icon-192.png",
            });
            planShownForDate.current = today;
          }
        }

        // Actividad diaria: "Aún no has registrado actividad hoy, ¡no pierdas tu racha!"
        if (
          !status.hasActivityToday &&
          currentHour >= ACTIVITY_REMINDER_HOUR &&
          activityShownForDate.current !== today
        ) {
          const title = "Actividad diaria";
          const body =
            "Aún no has registrado actividad hoy, ¡no pierdas tu racha!";

          new Notification(title, {
            body,
            icon: "/icons/icon-192.png",
          });
          activityShownForDate.current = today;
        }
      } catch {
        // ignore
      }
    };

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notificationsEnabled,
        setNotificationsEnabled,
        requestNotificationPermission,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  return (
    ctx ?? {
      notificationsEnabled: true,
      setNotificationsEnabled: () => {},
      requestNotificationPermission: async () => false,
    }
  );
}
