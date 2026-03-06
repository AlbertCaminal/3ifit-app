"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Flame, Trophy } from "lucide-react";
import { useXP } from "@/contexts/XPContext";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DonutChart, PLAN_COLORS } from "@/components/home/DonutChart";
import { getLevelName, getLevelColor } from "@/lib/levels";
import { getRankColor } from "@/lib/rankColors";
import type { DepartmentRankingEntry } from "../ranking/actions";
import { AlertCircle } from "lucide-react";
import { fireworks } from "@/lib/celebration";

type Plan = keyof typeof PLAN_COLORS;

interface HomeClientProps {
  weeklyPlanUnlocked?: boolean;
  profile: {
    avatar_url: string | null;
    full_name: string | null;
    plan: Plan | null;
    level: number;
    department_name: string | null;
    department_id?: string | null;
    today_minutes?: number;
    today_goal?: number;
    days_completed?: number;
    days_total?: number;
  } | null;
  departmentRanking: DepartmentRankingEntry[];
  xpEarned?: number;
  perfectStreakWeeks?: number;
}

export default function HomeClient({
  profile,
  departmentRanking,
  xpEarned,
  perfectStreakWeeks = 0,
  weeklyPlanUnlocked = false,
}: HomeClientProps) {
  const { showXP } = useXP();
  const router = useRouter();
  const [showWeeklyPlanUnlockModal, setShowWeeklyPlanUnlockModal] =
    useState(false);

  if (profile === null) {
    return (
      <div className="flex flex-1 flex-col bg-[var(--background)]">
        <header className="px-6 py-5" />
        <EmptyState
          icon={AlertCircle}
          title="No se pudo cargar el inicio"
          subtitle="Hubo un problema al cargar tus datos. Comprueba la conexión e inténtalo de nuevo."
          actionLabel="Reintentar"
          onAction={() => router.refresh()}
        />
      </div>
    );
  }

  useEffect(() => {
    if (typeof xpEarned === "number" && xpEarned > 0) {
      showXP(xpEarned, { source: "home-initial" });
    }
  }, [xpEarned, showXP]);

  useEffect(() => {
    if (
      weeklyPlanUnlocked &&
      typeof window !== "undefined" &&
      !localStorage.getItem("3ifit-weekly-plan-unlock-shown")
    ) {
      setShowWeeklyPlanUnlockModal(true);
      fireworks();
    }
  }, [weeklyPlanUnlocked]);

  const plan = (profile?.plan ?? "pro") as Plan;
  const daysTotal = profile?.days_total ?? 5;
  const daysCompleted = profile?.days_completed ?? 0;
  const todayMinutes = profile?.today_minutes ?? 0;
  const todayGoal = profile?.today_goal ?? 30;

  const myTeam = departmentRanking.find((d) => d.isCurrentUserDepartment);
  const teamAbove =
    myTeam && myTeam.rank > 1
      ? departmentRanking.find((d) => d.rank === myTeam.rank - 1)
      : null;
  const maxMinutes = Math.max(...departmentRanking.map((d) => d.minutes), 1);

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]">
      {showWeeklyPlanUnlockModal && (
        <div
          role="presentation"
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="weekly-unlock-title"
            className="w-full max-w-sm rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-xl"
          >
            <h3
              id="weekly-unlock-title"
              className="text-lg font-bold text-[var(--color-text-primary)]"
            >
              ¡Plan semanal completado!
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Has desbloqueado las notificaciones push y el recordatorio de
              pausas activas. Puedes activarlos en Perfil → Configuración.
            </p>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("3ifit-weekly-plan-unlock-shown", "true");
                }
                setShowWeeklyPlanUnlockModal(false);
                router.refresh();
              }}
              className="btn-primary mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[var(--color-primary)] text-base font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <header className="flex justify-between px-6 py-4">
        <div className="flex gap-3">
          <Link
            href="/app/perfil"
            className="shrink-0 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            {(profile?.level ?? 1) === 5 ? (
              <div
                className="flex shrink-0 rounded-full p-[3px]"
                style={{
                  background:
                    "linear-gradient(135deg, #38bdf8 0%, #7dd3fc 25%, #a5f3fc 50%, #7dd3fc 75%, #38bdf8 100%)",
                }}
              >
                <div className="overflow-hidden rounded-full">
                  <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.full_name ?? "Usuario"}
                    size="md"
                    className="h-[52px] w-[52px]"
                  />
                </div>
              </div>
            ) : (profile?.level ?? 1) === 3 ? (
              <div
                className="flex shrink-0 rounded-full p-[3px]"
                style={{
                  background:
                    "linear-gradient(135deg, #f59e0b 0%, #fbbf24 25%, #fef3c7 50%, #fbbf24 75%, #f59e0b 100%)",
                }}
              >
                <div className="overflow-hidden rounded-full">
                  <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.full_name ?? "Usuario"}
                    size="md"
                    className="h-[52px] w-[52px]"
                  />
                </div>
              </div>
            ) : (profile?.level ?? 1) === 4 ? (
              <div
                className="flex shrink-0 rounded-full p-[3px]"
                style={{
                  background:
                    "linear-gradient(135deg, #e09696 0%, #f0b8b8 25%, #fce4e4 50%, #f0b8b8 75%, #e09696 100%)",
                }}
              >
                <div className="overflow-hidden rounded-full">
                  <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.full_name ?? "Usuario"}
                    size="md"
                    className="h-[52px] w-[52px]"
                  />
                </div>
              </div>
            ) : (profile?.level ?? 1) === 2 ? (
              <div
                className="flex shrink-0 rounded-full p-[3px]"
                style={{
                  background:
                    "linear-gradient(135deg, #a8a8a8 0%, #c0c0c0 25%, #e8e8e8 50%, #c0c0c0 75%, #a8a8a8 100%)",
                }}
              >
                <div className="overflow-hidden rounded-full">
                  <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.full_name ?? "Usuario"}
                    size="md"
                    className="h-[52px] w-[52px]"
                  />
                </div>
              </div>
            ) : (profile?.level ?? 1) === 1 ? (
              <div
                className="flex shrink-0 rounded-full p-[3px]"
                style={{
                  background:
                    "linear-gradient(135deg, #b87333 0%, #cd7f32 25%, #e8d5c4 50%, #cd7f32 75%, #b87333 100%)",
                }}
              >
                <div className="overflow-hidden rounded-full">
                  <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.full_name ?? "Usuario"}
                    size="md"
                    className="h-[52px] w-[52px]"
                  />
                </div>
              </div>
            ) : (
              <div
                className="flex shrink-0 rounded-full p-1"
                style={{
                  border: "3px solid",
                  borderColor: getLevelColor(profile?.level ?? 1),
                }}
              >
                <Avatar
                  src={profile?.avatar_url}
                  alt={profile?.full_name ?? "Usuario"}
                  size="md"
                  className="h-[52px] w-[52px]"
                />
              </div>
            )}
          </Link>
          <div className="flex flex-col gap-0.5">
            <div className="flex gap-1">
              <span className="text-[22px] font-medium text-[var(--color-text-primary)]">
                Hola,{" "}
              </span>
              <span className="text-[22px] font-bold text-[var(--color-text-primary)]">
                {profile?.full_name?.split(" ")[0] ?? "Usuario"}
              </span>
            </div>
            <span className="text-xs font-medium text-[var(--color-text-muted-light)]">
              Nivel {profile?.level ?? 1} -{" "}
              <span style={{ color: getLevelColor(profile?.level ?? 1) }}>
                {getLevelName(profile?.level ?? 1)}
              </span>
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center gap-4 px-6 py-4">
        <div className="flex items-center gap-5">
          <DonutChart completed={daysCompleted} total={daysTotal} plan={plan} />
          <div className="flex flex-col gap-1">
            <span className="text-4xl font-bold text-[var(--color-text-primary)]">
              {daysCompleted} de {daysTotal}
            </span>
            <span className="text-sm font-medium text-[var(--color-text-muted-light)]">
              días de ejercicio esta semana
            </span>
            <span
              className="text-[13px] font-semibold"
              style={{
                color:
                  daysCompleted >= daysTotal
                    ? "var(--color-success-bright)"
                    : PLAN_COLORS[plan].text,
              }}
            >
              {daysCompleted >= daysTotal ? "¡Bien hecho!" : "¡Vas genial!"}
            </span>
            {perfectStreakWeeks > 0 && (
              <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[var(--color-bg-muted)] px-3 py-1.5">
                <Flame className="h-4 w-4 text-[var(--color-primary)]" />
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                  {perfectStreakWeeks >= 4
                    ? "¡4/4! +50 XP al final del mes"
                    : `Racha perfecta: ${perfectStreakWeeks} ${perfectStreakWeeks === 1 ? "semana" : "semanas"}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 pb-5">
        <Card
          variant="default"
          className={
            todayMinutes >= todayGoal ? "bg-[var(--color-success-light)]" : ""
          }
        >
          <span className="text-xs font-medium text-[var(--color-text-muted-light)]">
            Objetivo de hoy
          </span>
          <p
            className="text-xl font-semibold"
            style={{
              color:
                todayMinutes >= todayGoal
                  ? "var(--color-success-bright)"
                  : PLAN_COLORS[plan].text,
            }}
          >
            {todayMinutes} / {todayGoal} min
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-[var(--color-border)]">
            <div
              className="h-full rounded transition-[width]"
              style={{
                width: `${Math.min(100, (todayMinutes / todayGoal) * 100)}%`,
                backgroundColor:
                  todayMinutes >= todayGoal
                    ? "var(--color-success-bright)"
                    : PLAN_COLORS[plan].text,
              }}
            />
          </div>
          {todayMinutes >= todayGoal && (
            <p className="mt-1 text-xs font-semibold text-[var(--color-success-bright)]">
              ¡Objetivo cumplido!
            </p>
          )}
        </Card>

        <Link
          href="/app/ranking"
          className="block rounded-3xl transition-opacity hover:opacity-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          <Card variant="default" padding="lg" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--color-text-primary)]">
                Ranking por equipos
              </span>
              <Trophy className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            {departmentRanking.length === 0 || !myTeam ? (
              <p className="text-[13px] text-[var(--color-text-muted-light)]">
                Registra actividades y selecciona tu departamento para ver el
                ranking
              </p>
            ) : myTeam.rank === 1 ? (
              <div className="flex flex-col gap-2">
                <p className="text-[13px] font-semibold text-[var(--color-primary)]">
                  ¡Tu equipo lidera!
                </p>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    <span style={{ color: getRankColor(1) }}>1º</span>{" "}
                    {myTeam.department_name}
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--color-text-muted-light)]">
                    {myTeam.minutes.toLocaleString("es-ES")} min
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-md bg-[var(--color-bg-muted)]">
                  <div
                    className="h-full rounded-md bg-[var(--color-primary)]"
                    style={{ width: `${(myTeam.minutes / maxMinutes) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {teamAbove && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                          <span style={{ color: getRankColor(teamAbove.rank) }}>
                            {teamAbove.rank}º
                          </span>{" "}
                          {teamAbove.department_name}
                        </span>
                        <span className="text-[13px] font-semibold text-[var(--color-text-muted-light)]">
                          {teamAbove.minutes.toLocaleString("es-ES")} min
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-md bg-[var(--color-bg-muted)]">
                        <div
                          className="h-full rounded-md bg-[var(--color-primary)]"
                          style={{
                            width: `${(teamAbove.minutes / maxMinutes) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-[13px] font-semibold text-[var(--color-primary)]">
                      Os faltan{" "}
                      {(teamAbove.minutes - myTeam.minutes).toLocaleString(
                        "es-ES",
                      )}{" "}
                      min para alcanzarles
                    </p>
                  </>
                )}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-[var(--color-text-primary)]">
                      <span style={{ color: getRankColor(myTeam.rank) }}>
                        {myTeam.rank}º
                      </span>{" "}
                      Tu equipo
                    </span>
                    <span className="text-[13px] font-semibold text-[var(--color-text-muted-light)]">
                      {myTeam.minutes.toLocaleString("es-ES")} min
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-md bg-[var(--color-bg-muted)]">
                    <div
                      className="h-full rounded-md bg-[var(--color-primary)]"
                      style={{
                        width: `${(myTeam.minutes / maxMinutes) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Link>

        <div className="mt-auto flex items-end pt-4 pb-6">
          <Link
            href="/app/registrar-actividad"
            className="btn-primary flex h-[60px] w-full items-center justify-center rounded-full bg-[var(--color-primary)] text-[17px] font-semibold text-white shadow-[var(--shadow-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            Registrar Actividad
          </Link>
        </div>
      </div>
    </div>
  );
}
