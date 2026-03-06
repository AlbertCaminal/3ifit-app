"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  LeaderboardEntry,
  SeasonInfo,
  DepartmentRankingEntry,
} from "@/types/database";

export type { LeaderboardEntry, SeasonInfo, DepartmentRankingEntry };

export async function getActiveSeason(): Promise<SeasonInfo | null> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("seasons")
    .select("id, name, start_date, end_date")
    .lte("start_date", today)
    .gte("end_date", today)
    .single();

  if (!data) return null;

  const end = new Date(data.end_date);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    id: data.id,
    name: data.name,
    start_date: data.start_date,
    end_date: data.end_date,
    days_remaining: daysRemaining,
  };
}

export async function getLeaderboard(seasonId: string): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: entries } = await supabase
    .from("leaderboard_entries")
    .select("user_id, minutes")
    .eq("season_id", seasonId)
    .order("minutes", { ascending: false });

  if (!entries?.length) return [];

  const userIds = [...new Set(entries.map((e) => e.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, department_id, privacy_individual")
    .in("id", userIds);

  const deptIds = [...new Set((profiles ?? []).map((p) => p.department_id).filter(Boolean))];
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .in("id", deptIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        department_name: departments?.find((d) => d.id === p.department_id)?.name ?? null,
        privacy_individual: p.privacy_individual ?? false,
      },
    ])
  );

  return entries.map((e, i) => {
    const p = profileMap.get(e.user_id);
    const isPrivate = p?.privacy_individual ?? false;
    return {
      user_id: e.user_id,
      full_name: isPrivate ? "Anónimo" : (p?.full_name ?? "Usuario"),
      avatar_url: isPrivate ? null : (p?.avatar_url ?? null),
      department_name: p?.department_name ?? null,
      minutes: e.minutes ?? 0,
      rank: i + 1,
    };
  });
}

const COMMON_GOAL_MINUTES = 20_000;

export async function getLeaderboardWithContext(seasonId: string): Promise<{
  top3: LeaderboardEntry[];
  peloton: LeaderboardEntry[];
  currentUserRank: number | null;
  totalMinutesForGoal: number;
  commonGoalMinutes: number;
}> {
  const all = await getLeaderboard(seasonId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { top3: [], peloton: [], currentUserRank: null, totalMinutesForGoal: 0, commonGoalMinutes: COMMON_GOAL_MINUTES };

  const totalMinutesForGoal = all.reduce((sum, e) => sum + e.minutes, 0);
  const top3 = all.slice(0, 3);
  const currentIndex = all.findIndex((e) => e.user_id === user.id);
  const currentUserRank = currentIndex >= 0 ? currentIndex + 1 : null;

  let peloton: LeaderboardEntry[] = [];
  if (currentIndex >= 0) {
    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(all.length, currentIndex + 3);
    peloton = all.slice(start, end).map((e) => ({
      ...e,
      isCurrentUser: e.user_id === user.id,
    })) as LeaderboardEntry[];
  }

  return { top3, peloton, currentUserRank, totalMinutesForGoal, commonGoalMinutes: COMMON_GOAL_MINUTES };
}

export async function getDepartmentRanking(seasonId: string): Promise<DepartmentRankingEntry[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: entries } = await supabase
    .from("leaderboard_entries")
    .select("user_id, minutes")
    .eq("season_id", seasonId);

  if (!entries?.length) return [];

  const userIds = entries.map((e) => e.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, department_id")
    .in("id", userIds);

  const deptIds = [...new Set((profiles ?? []).map((p) => p.department_id).filter(Boolean))] as string[];
  if (deptIds.length === 0) return [];

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .in("id", deptIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.department_id]));
  const deptMinutes = new Map<string, number>();

  for (const e of entries) {
    const deptId = profileMap.get(e.user_id);
    if (deptId) {
      deptMinutes.set(deptId, (deptMinutes.get(deptId) ?? 0) + (e.minutes ?? 0));
    }
  }

  const totalMinutes = [...deptMinutes.values()].reduce((a, b) => a + b, 0);
  const sorted = [...deptMinutes.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([deptId, minutes], i) => {
      const dept = departments?.find((d) => d.id === deptId);
      const currentUserDept = (profiles ?? []).find((p) => p.id === user.id)?.department_id;
      return {
        department_id: deptId,
        department_name: dept?.name ?? "Sin nombre",
        minutes,
        rank: i + 1,
        progress: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
        isCurrentUserDepartment: currentUserDept === deptId,
      };
    });

  return sorted;
}
