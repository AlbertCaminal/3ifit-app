"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Target } from "lucide-react";
import { useXP } from "@/contexts/XPContext";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { getLevelName } from "@/lib/levels";
import { getUserMissions, getDailyXPTasks, type UserMission } from "./actions";

const XP_SOURCE = "misiones-initial" as const;

interface DailyTasks {
  activityDone: boolean;
  photoDone: boolean;
  clapsDone: boolean;
  clapsProgress: number;
  clapsTarget: number;
}

interface MisionesClientProps {
  missions: UserMission[];
  level: number;
  xpEarned?: number;
  dailyTasks: DailyTasks;
}

export default function MisionesClient({
  missions: initialMissions,
  level: initialLevel,
  xpEarned,
  dailyTasks: initialDailyTasks,
}: MisionesClientProps) {
  const { showXP } = useXP();
  const [missions, setMissions] = useState(initialMissions);
  const [level, setLevel] = useState(initialLevel);
  const [dailyTasks, setDailyTasks] = useState(initialDailyTasks);
  const [mounted, setMounted] = useState(false);
  const refreshIdRef = useRef(0);
  const xpShownRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-compiler/react-compiler -- badge solo en cliente para evitar hydration mismatch
    setMounted(true);
  }, []);

  useEffect(() => {
    if (xpEarned && xpEarned > 0 && !xpShownRef.current) {
      xpShownRef.current = true;
      showXP(xpEarned, { source: XP_SOURCE });
    }
  }, [xpEarned, showXP]);

  const refreshMissions = useCallback(() => {
    const id = ++refreshIdRef.current;
    Promise.all([getUserMissions(), getDailyXPTasks()]).then(([data, tasks]) => {
      if (id !== refreshIdRef.current) return;
      setMissions(data.missions);
      setLevel(data.level);
      setDailyTasks(tasks);
      if (data.xpEarned && data.xpEarned > 0) {
        showXP(data.xpEarned, { source: XP_SOURCE });
      }
    });
  }, [showXP]);

  useEffect(() => {
    const onFocus = () => refreshMissions();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshMissions]);

  const levelName = getLevelName(level);
  const levelClass = `level-badge-${Math.min(Math.max(level, 1), 5)}`;
  const levelBadge = mounted ? (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 ${levelClass}`}
    >
      <span className="text-base font-semibold">
        Nivel {level} - {levelName}
      </span>
    </div>
  ) : null;

  if (missions.length === 0) {
    return (
      <div className="flex flex-1 flex-col bg-[var(--background)]">
        <PageHeader title="Misiones" actions={levelBadge} />
        <div className="flex flex-1 flex-col gap-4 overflow-auto px-6 pt-3 pb-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">
              Tareas diarias
            </h2>
            <Card variant="compact" padding="md" className="flex flex-col gap-2">
              <DailyTaskItem
                done={dailyTasks.activityDone}
                label="Registrar actividad"
                xp="+10 XP"
              />
              <DailyTaskItem
                done={dailyTasks.photoDone}
                label="Registrar actividad con foto"
                xp="+10 XP"
              />
              <DailyTaskItem
                done={dailyTasks.clapsDone}
                label="Dar 5 ánimos en el muro"
                xp="+10 XP"
                progress={
                  !dailyTasks.clapsDone
                    ? `${dailyTasks.clapsProgress}/${dailyTasks.clapsTarget}`
                    : undefined
                }
              />
            </Card>
          </div>
          <EmptyState
            icon={Target}
            title="No hay misiones activas"
            subtitle="Las misiones de esta semana aún no están disponibles. ¡Vuelve el lunes!"
            actionLabel="Ir al inicio"
            actionHref="/app/home"
          />
        </div>
      </div>
    );
  }

  const fixedMissions = missions.filter((m) => m.type === "fixed");
  const poolMissions = missions.filter((m) => m.type === "pool");

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]">
      <PageHeader title="Misiones" actions={levelBadge} />

      <div className="flex flex-1 flex-col gap-4 overflow-auto px-6 pt-3 pb-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">
            Tareas diarias
          </h2>
          <Card variant="compact" padding="md" className="flex flex-col gap-2">
            <DailyTaskItem
              done={dailyTasks.activityDone}
              label="Registrar actividad"
              xp="+10 XP"
            />
            <DailyTaskItem
              done={dailyTasks.photoDone}
              label="Registrar actividad con foto"
              xp="+10 XP"
            />
            <DailyTaskItem
              done={dailyTasks.clapsDone}
              label="Dar 5 ánimos en el muro"
              xp="+10 XP"
              progress={
                !dailyTasks.clapsDone
                  ? `${dailyTasks.clapsProgress}/${dailyTasks.clapsTarget}`
                  : undefined
              }
            />
          </Card>
        </div>

        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          Misión fija
        </h2>
        {fixedMissions.map((m) => (
          <MissionCard key={m.id} mission={m} />
        ))}

        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          Misiones de esta semana
        </h2>
        {poolMissions.map((m) => (
          <MissionCard key={m.id} mission={m} />
        ))}
      </div>
    </div>
  );
}

function DailyTaskItem({
  done,
  label,
  xp,
  progress,
}: {
  done: boolean;
  label: string;
  xp: string;
  progress?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            done ? "bg-[var(--color-success)]" : "border-2 border-[var(--color-border)]"
          }`}
        >
          {done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`text-sm font-medium ${
              done ? "text-[var(--color-text-muted)] line-through" : "text-[var(--color-text-primary)]"
            }`}
          >
            {label}
          </span>
          {progress != null && (
            <span className="ml-2 text-xs text-[var(--color-text-muted)]">
              ({progress})
            </span>
          )}
        </div>
      </div>
      <span className="text-xs font-semibold text-[var(--color-success)]">
        {xp}
      </span>
    </div>
  );
}

function getMissionImageSlug(slug: string): string {
  if (slug.startsWith("streak_")) return "streak";
  return slug;
}

function MissionCard({ mission }: { mission: UserMission }) {
  const isCompleted = !!mission.completedAt;
  const target = mission.targetValue ?? 1;
  const progress = mission.progress;
  const percent = target > 0 ? Math.min(100, (progress / target) * 100) : 0;
  const imageSlug = getMissionImageSlug(mission.slug);
  const imageSrc = `/images/missions/${imageSlug}.png`;

  return (
    <Card
      variant={isCompleted ? "success" : "compact"}
      padding="none"
      className={cn("relative overflow-hidden", isCompleted && "border-3")}
    >
      <div className="relative aspect-[16/10] w-full">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 via-35% to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-4" suppressHydrationWarning>
          <h3 className="min-w-0 text-base font-semibold leading-snug text-white">
            {mission.title}
          </h3>
          {isCompleted ? (
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-[var(--color-success)] px-2.5 py-0.5 text-xs font-semibold text-white">
                Completada
              </span>
              <span className="text-[13px] font-semibold text-[var(--color-success)]">
                +{mission.xpReward} XP
              </span>
            </div>
          ) : target > 0 ? (
            <div className="flex flex-col gap-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-white/90">
                  {progress}/{target} completado
                </span>
                <span className="text-[13px] font-semibold text-[var(--color-success)]">
                  +{mission.xpReward} XP
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[var(--color-success)]">
                +{mission.xpReward} XP
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
