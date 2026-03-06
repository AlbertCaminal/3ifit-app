"use client";

import { useRouter } from "next/navigation";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import {
  getLevelName,
  getLevelColor,
  getLevelFromXP,
  getXPToNextLevel,
  getXPProgressInLevel,
} from "@/lib/levels";

interface PerfilClientProps {
  profile: {
    avatar_url: string | null;
    full_name: string | null;
    email: string | null;
    level: number;
    minutes_total: number;
    points: number;
    department_name: string | null;
    perfectStreakWeeks?: number;
  } | null;
}

export default function PerfilClient({ profile }: PerfilClientProps) {
  const router = useRouter();

  if (profile === null) {
    return (
      <div className="flex flex-1 flex-col bg-[var(--background)]">
        <PageHeader title="Perfil" variant="minimal" className="pt-5" />
        <EmptyState
          icon={AlertCircle}
          title="No se pudo cargar tu perfil"
          subtitle="Hubo un problema al cargar tus datos. Comprueba la conexión e inténtalo de nuevo."
          actionLabel="Reintentar"
          onAction={() => router.refresh()}
        />
      </div>
    );
  }

  const xp = profile.points ?? 0;
  const level = getLevelFromXP(xp);
  const levelName = getLevelName(level);
  const minutesTotal = profile.minutes_total ?? 0;
  const perfectStreakWeeks = profile.perfectStreakWeeks ?? 0;
  const xpProgress = getXPProgressInLevel(xp);
  const xpToNext = getXPToNextLevel(xp);

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]">
      <PageHeader title="Perfil" variant="minimal" className="pt-5" />

      <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
        <Card variant="default" padding="lg" className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3">
            {level === 5 ? (
              <div
                className="flex shrink-0 rounded-full p-[4.5px]"
                style={{
                  background:
                    "linear-gradient(135deg, #38bdf8 0%, #7dd3fc 25%,rgb(190, 241, 247) 50%, #7dd3fc 75%, #38bdf8 100%)",
                }}
              >
                <div className="overflow-hidden rounded-full">
                  <Avatar
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Usuario"}
                    size="lg"
                  />
                </div>
              </div>
            ) : level === 3 ? (
              <div
                className="flex shrink-0 rounded-full p-[4.5px]"
                style={{
                  background:
                    "linear-gradient(135deg, #f59e0b 0%, #fbbf24 25%, #fef3c7 50%, #fbbf24 75%, #f59e0b 100%)",
                }}
              >
                <div className="overflow-hidden rounded-full">
                  <Avatar
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Usuario"}
                    size="lg"
                  />
                </div>
              </div>
            ) : level === 4 ? (
              <div
                className="flex shrink-0 rounded-full p-[4.5px]"
                style={{
                  background:
                    "linear-gradient(135deg, #e09696 0%, #f0b8b8 25%, #fce4e4 50%, #f0b8b8 75%, #e09696 100%)",
                }}
              >
                <div className="overflow-hidden rounded-full">
                  <Avatar
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Usuario"}
                    size="lg"
                  />
                </div>
              </div>
            ) : level === 2 ? (
              <div
                className="flex shrink-0 rounded-full p-[4.5px]"
                style={{
                  background:
                    "linear-gradient(135deg, #a8a8a8 0%, #c0c0c0 25%, #e8e8e8 50%, #c0c0c0 75%, #a8a8a8 100%)",
                }}
              >
                <div className="overflow-hidden rounded-full">
                  <Avatar
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Usuario"}
                    size="lg"
                  />
                </div>
              </div>
            ) : level === 1 ? (
              <div
                className="flex shrink-0 rounded-full p-[4.5px]"
                style={{
                  background:
                    "linear-gradient(135deg, #b87333 0%, #cd7f32 25%, #e8d5c4 50%, #cd7f32 75%, #b87333 100%)",
                }}
              >
                <div className="overflow-hidden rounded-full">
                  <Avatar
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Usuario"}
                    size="lg"
                  />
                </div>
              </div>
            ) : (
              <div
                className="flex shrink-0 rounded-full p-1.5"
                style={{
                  border: "4.5px solid",
                  borderColor: getLevelColor(level),
                }}
              >
                <Avatar
                  src={profile.avatar_url}
                  alt={profile.full_name ?? "Usuario"}
                  size="lg"
                />
              </div>
            )}
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {profile.full_name ?? "Usuario"}
            </h2>
            <span className="text-xs font-medium text-[var(--color-text-muted-light)]">
              Nivel {level} -{" "}
              <span style={{ color: getLevelColor(level) }}>{levelName}</span>
            </span>
            <div className="flex w-full flex-col gap-1.5">
              <div className="h-1 w-full overflow-hidden rounded bg-[var(--color-border)]">
                <div
                  className="h-full rounded bg-[var(--color-primary)] transition-[width]"
                  style={{ width: `${xpProgress.percent}%` }}
                />
              </div>
              <p className="text-xs font-medium text-[var(--color-text-muted-light)]">
                {level < 5 ? (
                  xpToNext !== null ? (
                    <>
                      Consigue {xpToNext} XP más para{" "}
                      <span style={{ color: getLevelColor(level + 1) }}>
                        {getLevelName(level + 1)}
                      </span>
                    </>
                  ) : (
                    <>Nivel máximo alcanzado</>
                  )
                ) : (
                  <>
                    ¡Nivel{" "}
                    <span style={{ color: getLevelColor(5) }}>Diamante</span>{" "}
                    alcanzado!
                  </>
                )}
              </p>
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {profile.department_name ?? "—"}
            </span>
          </div>
        </Card>

        <div className="flex gap-4">
          <Card variant="muted" padding="lg" className="flex flex-1 flex-col items-center gap-1 text-center">
            <span className="text-xl font-semibold text-[var(--color-text-primary)]">
              {xp.toLocaleString()}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              XP total
            </span>
          </Card>
          <Card variant="muted" padding="lg" className="flex flex-1 flex-col items-center gap-1 text-center">
            <span className="text-xl font-semibold text-[var(--color-text-primary)]">
              {minutesTotal.toLocaleString()}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Minutos totales
            </span>
          </Card>
          <Card variant="muted" padding="lg" className="flex flex-1 flex-col items-center gap-1 text-center">
            <span className="text-xl font-semibold text-[var(--color-text-primary)]">
              {perfectStreakWeeks === 0 ? "—" : perfectStreakWeeks}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {perfectStreakWeeks === 0
                ? "Comienza tu racha semanal"
                : "racha semanal"}
            </span>
          </Card>
        </div>

        <Link
          href="/app/configuracion"
          className="group block rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          <Card
            variant="compact"
            className="flex items-center justify-between bg-[var(--color-bg-muted)] transition-all duration-150 group-hover:bg-[var(--color-border-light)] group-active:scale-[0.99]"
          >
          <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            Configuración
          </span>
          <ChevronRight className="h-5 w-5 text-[var(--color-primary)]" />
          </Card>
        </Link>
      </div>
    </div>
  );
}
