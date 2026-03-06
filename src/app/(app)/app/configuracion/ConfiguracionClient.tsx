"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { PageHeader } from "@/components/layout/PageHeader";
import { useBreakReminder } from "@/contexts/BreakReminderContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { updateProfileSettings } from "./actions";
import {
  STORAGE_KEYS,
  DEFAULT_START,
  DEFAULT_END,
} from "@/contexts/BreakReminderContext";

type Plan = "basico" | "estandar" | "pro";

const PLAN_LABELS: Record<
  Plan,
  { name: string; days: number; minutes: number }
> = {
  basico: { name: "Básico", days: 2, minutes: 15 },
  estandar: { name: "Estándar", days: 3, minutes: 30 },
  pro: { name: "Pro", days: 5, minutes: 30 },
};

/** XP por completar el plan semanal (inline para evitar hydration mismatch) */
const PLAN_XP: Record<Plan, number> = { basico: 50, estandar: 75, pro: 100 };

interface Department {
  id: string;
  name: string;
}

interface ConfiguracionClientProps {
  initialPlan: Plan;
  initialPrivacy: boolean;
  initialDepartmentId: string | null;
  initialNotificationsEnabled: boolean;
  initialDarkModeUnlocked: boolean;
  initialWeeklyPlanUnlocked: boolean;
  departments: Department[];
  planChangedThisWeek?: boolean;
  departmentChangedThisWeek?: boolean;
}

export default function ConfiguracionClient({
  initialPlan,
  initialPrivacy,
  initialDepartmentId,
  initialNotificationsEnabled,
  initialDarkModeUnlocked,
  initialWeeklyPlanUnlocked,
  departments,
  planChangedThisWeek = false,
  departmentChangedThisWeek = false,
}: ConfiguracionClientProps) {
  const { isDark, toggleTheme } = useTheme();
  const [privacy, setPrivacy] = useState(initialPrivacy);
  const [pausasReminder, setPausasReminder] = useState(false);
  const [pausasStart, setPausasStart] = useState(DEFAULT_START);
  const [pausasEnd, setPausasEnd] = useState(DEFAULT_END);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeModalStart, setTimeModalStart] = useState(DEFAULT_START);
  const [timeModalEnd, setTimeModalEnd] = useState(DEFAULT_END);
  const { requestNotificationPermission } = useBreakReminder();
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    requestNotificationPermission: requestNotificationsPermission,
  } = useNotifications();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const enabled = localStorage.getItem(STORAGE_KEYS.enabled) === "true";
    const start = localStorage.getItem(STORAGE_KEYS.start) ?? DEFAULT_START;
    const end = localStorage.getItem(STORAGE_KEYS.end) ?? DEFAULT_END;
    setPausasReminder(enabled);
    setPausasStart(start);
    setPausasEnd(end);
    if (!localStorage.getItem(STORAGE_KEYS.start))
      localStorage.setItem(STORAGE_KEYS.start, DEFAULT_START);
    if (!localStorage.getItem(STORAGE_KEYS.end))
      localStorage.setItem(STORAGE_KEYS.end, DEFAULT_END);
  }, []);
  const [objective, setObjective] = useState<Plan>(initialPlan);
  const [departmentId, setDepartmentId] = useState<string | null>(
    initialDepartmentId,
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleObjectiveChange = async (opt: Plan) => {
    setError(null);
    setObjective(opt);
    const result = await updateProfileSettings({ plan: opt });
    if (result.success) {
      router.refresh();
    } else if (result.error) {
      setError(result.error);
      setObjective(initialPlan);
    }
  };

  const handlePrivacyChange = async () => {
    setError(null);
    const next = !privacy;
    setPrivacy(next);
    const result = await updateProfileSettings({ privacy_individual: next });
    if (result.success) {
      setTimeout(() => router.refresh(), 350);
    } else if (result.error) {
      setError(result.error);
      setPrivacy(!next);
    }
  };

  const handleNotificationsToggle = async () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    if (next) {
      await requestNotificationsPermission();
    }
    const result = await updateProfileSettings({ notifications_enabled: next });
    if (!result.success) {
      setNotificationsEnabled(!next);
      setError(result.error ?? "Error al guardar");
    } else {
      router.refresh();
    }
  };

  const handlePausasToggle = async () => {
    const next = !pausasReminder;
    setPausasReminder(next);
    localStorage.setItem(STORAGE_KEYS.enabled, String(next));
    if (next) {
      await requestNotificationPermission();
    }
  };

  const handleSaveTimeRange = () => {
    setPausasStart(timeModalStart);
    setPausasEnd(timeModalEnd);
    localStorage.setItem(STORAGE_KEYS.start, timeModalStart);
    localStorage.setItem(STORAGE_KEYS.end, timeModalEnd);
    setShowTimeModal(false);
  };

  const openTimeModal = () => {
    setTimeModalStart(pausasStart);
    setTimeModalEnd(pausasEnd);
    setShowTimeModal(true);
  };

  const handleDepartmentChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setError(null);
    const value = e.target.value || null;
    const prev = departmentId;
    setDepartmentId(value);
    const result = await updateProfileSettings({ department_id: value });
    if (result.success) {
      router.refresh();
    } else if (result.error) {
      setError(result.error);
      setDepartmentId(prev);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]">
      <PageHeader title="Configuración" backLink={{ href: "/app/perfil" }} />
      {error && (
        <div className="mx-6 mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {initialWeeklyPlanUnlocked && (
          <Card variant="compact" className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-primary)]">
              Notificaciones
            </span>
            <Toggle
              checked={notificationsEnabled}
              onChange={handleNotificationsToggle}
            />
          </Card>
        )}

        {initialDarkModeUnlocked && (
          <Card variant="compact" className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-primary)]">
              Modo oscuro
            </span>
            <Toggle checked={isDark} onChange={toggleTheme} />
          </Card>
        )}

        <div className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            Departamento
          </h2>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            ¿A qué equipo perteneces?
          </p>
          {departmentChangedThisWeek ? (
            <>
              <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-[13px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                Solo puedes cambiar de departamento una vez por semana. Podrás modificarlo de nuevo el lunes.
              </p>
              <div className="flex h-[52px] w-full items-center rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-muted)] px-4 text-sm font-medium text-[var(--color-text-muted)]">
                {departments.find((d) => d.id === departmentId)?.name ?? "Sin departamento"}
              </div>
            </>
          ) : (
            <select
              value={departmentId ?? ""}
              onChange={handleDepartmentChange}
              className="flex h-[52px] w-full items-center justify-between rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-card)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              <option value="">Seleccionar departamento</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            Configuración de Objetivo
          </h2>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            ¿Cuál es tu compromiso esta semana?
          </p>
          {planChangedThisWeek && (
            <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-[13px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              Solo puedes cambiar de plan una vez por semana. Podrás modificarlo de nuevo el lunes.
            </p>
          )}
          {(["basico", "estandar", "pro"] as const).map((opt) => {
            const info = PLAN_LABELS[opt];
            const isDisabled = planChangedThisWeek;
            return (
              <button
                key={opt}
                onClick={() => !isDisabled && handleObjectiveChange(opt)}
                disabled={isDisabled}
                className={`btn-card flex flex-col gap-1 rounded-xl border-2 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                  isDisabled
                    ? "cursor-not-allowed border-[var(--color-border-light)] bg-[var(--color-bg-muted)] opacity-60"
                    : objective === opt
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                      : "border-[var(--color-border-light)] bg-[var(--color-bg-card)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {info.name}
                  </span>
                  <span className="text-[13px] font-medium text-[var(--color-text-muted-light)]">
                    +{PLAN_XP[opt]} XP
                  </span>
                </div>
                <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
                  {info.days} días/semana · {info.minutes} min/día
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            Centro de Privacidad
          </h2>
          <Card variant="compact" className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-primary)]">
              Hacer mi actividad privada
            </span>
            <Toggle checked={privacy} onChange={handlePrivacyChange} />
          </Card>
        </div>

        {initialWeeklyPlanUnlocked && (
        <div className="flex flex-col gap-2">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            Recordatorio de pausas activas
          </h2>
          <Card variant="compact" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-primary)]">
                Avisarme cada hora para hacer una pausa
              </span>
              <Toggle checked={pausasReminder} onChange={handlePausasToggle} />
            </div>
            <button
              type="button"
              onClick={openTimeModal}
              className="btn-secondary flex w-full items-center justify-between rounded-xl bg-[var(--color-bg-muted)] px-5 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              <span className="text-[13px] text-[var(--color-text-secondary)]">
                Activo de:
              </span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {pausasStart} - {pausasEnd}
              </span>
            </button>
          </Card>
          {showTimeModal && (
            <div
              role="presentation"
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 p-4"
              onClick={() => setShowTimeModal(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="time-modal-title"
                className="w-full max-w-sm rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3
                  id="time-modal-title"
                  className="text-lg font-bold text-[var(--color-text-primary)]"
                >
                  Horario de recordatorios
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Elige entre qué horas quieres recibir avisos cada hora
                </p>
                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
                      Desde
                    </label>
                    <select
                      value={timeModalStart}
                      onChange={(e) => setTimeModalStart(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border-light)] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const h = i.toString().padStart(2, "0");
                        return (
                          <option key={h} value={`${h}:00`}>
                            {h}:00
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
                      Hasta
                    </label>
                    <select
                      value={timeModalEnd}
                      onChange={(e) => setTimeModalEnd(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border-light)] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const h = i.toString().padStart(2, "0");
                        return (
                          <option key={h} value={`${h}:00`}>
                            {h}:00
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTimeModal(false)}
                    className="btn-secondary flex-1 rounded-xl border border-[var(--color-border-light)] py-3 text-sm font-semibold text-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTimeRange}
                    className="btn-primary flex-1 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        <button
          type="button"
          onClick={() => {
            window.location.href = "/auth/signout";
          }}
          className="btn-danger mt-4 flex h-[52px] w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 text-base font-semibold text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
