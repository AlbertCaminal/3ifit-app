"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Calendar, Sparkles, Trophy, Users } from "lucide-react";
import { getRankColor, getRankGradient } from "@/lib/rankColors";
import type {
  DepartmentRankingEntry,
  LeaderboardEntry,
  SeasonInfo,
} from "./actions";

interface RankingClientProps {
  season: SeasonInfo | null;
  top3: LeaderboardEntry[];
  peloton: LeaderboardEntry[];
  totalMinutesForGoal: number;
  commonGoalMinutes: number;
  departmentRanking: DepartmentRankingEntry[];
  daysRemainingInMonth: number;
}

export default function RankingClient({
  season,
  top3,
  peloton,
  totalMinutesForGoal,
  commonGoalMinutes,
  departmentRanking,
  daysRemainingInMonth,
}: RankingClientProps) {
  const [tab, setTab] = useState<"empresa" | "equipos">("empresa");

  const hasLeaderboardData = top3.length > 0 || peloton.length > 0;

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]">
      <PageHeader
        title="Ranking"
        subtitle={
          season
            ? `${season.name}: Quedan ${season.days_remaining} días`
            : "Sin temporada activa"
        }
      />

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Vista de ranking"
        className="mx-4 mt-4 flex gap-1.5 rounded-full bg-[var(--color-bg-tabs)] p-1.5"
      >
        <button
          id="tab-empresa"
          role="tab"
          aria-selected={tab === "empresa"}
          aria-controls="panel-empresa"
          tabIndex={tab === "empresa" ? 0 : -1}
          onClick={() => setTab("empresa")}
          className={`flex-1 rounded-[18px] py-2.5 text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
            tab === "empresa"
              ? "bg-[var(--color-primary)] text-white hover:brightness-110 active:scale-[0.98]"
              : "bg-transparent text-[var(--color-text-muted-light)] hover:bg-black/5 active:scale-[0.98]"
          }`}
        >
          Empresa (3iPunt)
        </button>
        <button
          id="tab-equipos"
          role="tab"
          aria-selected={tab === "equipos"}
          aria-controls="panel-equipos"
          tabIndex={tab === "equipos" ? 0 : -1}
          onClick={() => setTab("equipos")}
          className={`flex-1 rounded-[18px] py-2.5 text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
            tab === "equipos"
              ? "bg-[var(--color-primary)] text-white hover:brightness-110 active:scale-[0.98]"
              : "bg-transparent text-[var(--color-text-muted-light)] hover:bg-black/5 active:scale-[0.98]"
          }`}
        >
          Equipos
        </button>
      </div>

      <div
        id={tab === "empresa" ? "panel-empresa" : "panel-equipos"}
        role="tabpanel"
        aria-labelledby={tab === "empresa" ? "tab-empresa" : "tab-equipos"}
        className="flex-1 overflow-auto p-4"
      >
        {tab === "equipos" ? (
          <>
            <Card variant="muted" className="mb-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                <span className="font-medium text-[var(--color-text-primary)]">
                  Equipo ganador: +200 XP
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
                <span className="font-medium text-[var(--color-text-primary)]">
                  Duración: mensual · Quedan {daysRemainingInMonth} días
                </span>
              </div>
            </Card>
            {departmentRanking.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Aún no hay datos de equipos"
                subtitle="Registra actividades y selecciona tu departamento en configuración para que aparezca en el ranking"
                actionLabel="Registrar actividad"
                actionHref="/app/registrar-actividad"
              />
            ) : (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Ranking por equipos
                </h2>
                {departmentRanking.map((d) => {
                  const rankColor = getRankColor(d.rank);
                  return (
                    <Card
                      key={d.department_id}
                      variant={
                        d.isCurrentUserDepartment
                          ? "highlighted"
                          : "compactBorder"
                      }
                      className="flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span
                            className="text-sm font-bold"
                            style={{ color: rankColor }}
                          >
                            {d.rank}º
                          </span>
                          <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                            {d.department_name}
                          </span>
                          {d.isCurrentUserDepartment && (
                            <span className="rounded bg-[var(--color-primary)] px-1.5 py-0.5 text-xs font-medium text-white">
                              Tu equipo
                            </span>
                          )}
                        </span>
                        <span className="text-sm font-semibold text-[var(--color-primary)]">
                          {d.progress}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted-light)]">
                        <span>{d.minutes.toLocaleString("es-ES")} min</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-md bg-[var(--color-bg-muted)]">
                        <div
                          className="h-full rounded-md bg-[var(--color-primary)] transition-all"
                          style={{ width: `${d.progress}%` }}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Indicadores Objetivo Común */}
            {season && (
              <Card variant="muted" className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
                  <span className="font-medium text-[var(--color-text-primary)]">
                    Duración del objetivo: {season.days_remaining} días
                    restantes
                  </span>
                </div>
              </Card>
            )}
            {/* El Objetivo Común */}
            <Card variant="default">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    El Objetivo Común
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-text-muted-light)]">
                    {commonGoalMinutes.toLocaleString("es-ES")} minutos totales
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    +500 XP para todos al completar
                  </p>
                </div>
                <span className="rounded-lg bg-[var(--color-primary)] px-2 py-0.5 text-sm font-bold text-white shrink-0">
                  {commonGoalMinutes > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (totalMinutesForGoal / commonGoalMinutes) * 100,
                        ),
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-start gap-2">
                <span className="text-3xl font-bold leading-none text-[var(--color-primary)]">
                  {totalMinutesForGoal.toLocaleString("es-ES")}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  / {commonGoalMinutes.toLocaleString("es-ES")} min
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Faltan{" "}
                {Math.max(
                  0,
                  commonGoalMinutes - totalMinutesForGoal,
                ).toLocaleString("es-ES")}{" "}
                min para el 100%
              </p>
              <p className="mt-2 text-xs text-[var(--color-text-muted-light)]">
                {commonGoalMinutes.toLocaleString("es-ES")} min
              </p>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-md bg-[var(--color-bg-muted)]">
                <div
                  className="h-full rounded-md bg-[var(--color-primary)] transition-all"
                  style={{
                    width: `${commonGoalMinutes > 0 ? Math.min(100, (totalMinutesForGoal / commonGoalMinutes) * 100) : 0}%`,
                  }}
                />
              </div>
            </Card>
            {/* Indicadores Ranking Individual */}
            {hasLeaderboardData && (
              <Card variant="muted" className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                  <span className="font-medium text-[var(--color-text-primary)]">
                    Top 3: +100 XP al final del mes
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
                  <span className="font-medium text-[var(--color-text-primary)]">
                    Duración: mensual · Quedan {daysRemainingInMonth} días
                  </span>
                </div>
              </Card>
            )}
            {!hasLeaderboardData ? (
              <EmptyState
                icon={Trophy}
                title="Aún no hay ranking"
                subtitle="Sé el primero en registrar actividades y lidera la tabla"
                actionLabel="Registrar actividad"
                actionHref="/app/registrar-actividad"
              />
            ) : (
              <>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Tabla de Líderes
                </h2>
                {/* Podio - orden visual: 2º, 1º, 3º */}
                <div className="flex items-end justify-center gap-3">
                  {[1, 0, 2].map((i) => {
                    const e = top3[i];
                    if (!e) return null;
                    const rankNum = i === 0 ? 2 : i === 1 ? 1 : 3;
                    const rankColor = getRankColor(e.rank);
                    const rankGradient = getRankGradient(e.rank);
                    const isFirst = e.rank === 1;
                    const padding = isFirst ? "p-[6px]" : "p-[4px]";
                    return (
                      <div
                        key={e.user_id}
                        className="flex flex-col items-center gap-2"
                      >
                        <div
                          className={`flex rounded-full ${padding}`}
                          style={
                            rankGradient
                              ? { background: rankGradient }
                              : { backgroundColor: rankColor }
                          }
                        >
                          <div className="overflow-hidden rounded-full">
                            <Avatar
                              src={e.avatar_url}
                              alt={e.full_name ?? "Usuario"}
                              size={isFirst ? "lg" : "md"}
                              className={
                                isFirst ? "h-[88px] w-[88px]" : "h-16 w-16"
                              }
                            />
                          </div>
                        </div>
                        <span
                          className="text-sm font-bold"
                          style={{ color: rankColor }}
                        >
                          {e.rank}º
                        </span>
                        <span
                          className={`font-semibold text-[var(--color-text-primary)] ${
                            rankNum === 1 ? "text-base" : "text-sm"
                          }`}
                        >
                          {e.full_name === "Anónimo"
                            ? "Anónimo"
                            : (e.full_name?.split(" ")[0] ??
                              e.full_name ??
                              "Usuario")}
                        </span>
                        <span className="text-xs font-medium text-[var(--color-text-muted)]">
                          {e.minutes.toLocaleString()} min
                        </span>
                      </div>
                    );
                  })}
                </div>
                {peloton.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold text-[var(--color-text-muted)]">
                      Tu posición en el ranking
                    </h3>
                    {peloton.map((p) => {
                      const rankColor = getRankColor(p.rank);
                      return (
                        <Card
                          key={p.user_id}
                          variant={
                            p.isCurrentUser ? "highlighted" : "compactBorder"
                          }
                          className="flex items-center gap-3"
                        >
                          <Avatar
                            src={p.avatar_url}
                            alt={p.full_name ?? "Usuario"}
                            size="md"
                          />
                          <div className="flex flex-1 flex-col gap-0.5">
                            <span className="font-semibold text-[var(--color-text-primary)]">
                              <span style={{ color: rankColor }}>
                                {p.rank}º
                              </span>{" "}
                              {p.full_name === "Anónimo"
                                ? "Anónimo"
                                : p.isCurrentUser
                                  ? "Tú"
                                  : (p.full_name?.split(" ")[0] ??
                                    p.full_name ??
                                    "Usuario")}{" "}
                              — {p.minutes.toLocaleString()} min
                            </span>
                            <span className="text-xs text-[var(--color-text-muted-light)]">
                              {p.department_name ?? "—"}
                            </span>
                          </div>
                        </Card>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
