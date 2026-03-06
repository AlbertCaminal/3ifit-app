"use server";

import { PLAN_XP } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import type { HomeProfileResult } from "@/types/database";

export type { HomeProfileResult };

const PLAN_DAYS = { basico: 2, estandar: 3, pro: 5 } as const;

export async function getHomeDataRpc(): Promise<HomeProfileResult | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("get_home_data", {
    p_user_id: user.id,
  });

  if (error || !data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (obj.error) return null;

  return {
    avatar_url: (obj.avatar_url as string) ?? null,
    full_name: (obj.full_name as string) ?? null,
    plan: (obj.plan as "basico" | "estandar" | "pro") ?? null,
    level: (obj.level as number) ?? 1,
    department_name: (obj.department_name as string) ?? null,
    today_minutes: (obj.today_minutes as number) ?? 0,
    today_goal: (obj.today_goal as number) ?? 30,
    days_completed: (obj.days_completed as number) ?? 0,
    days_total: (obj.days_total as number) ?? 3,
    xpEarned: obj.xpEarned != null ? (obj.xpEarned as number) : undefined,
    perfectStreakWeeks: (obj.perfectStreakWeeks as number) ?? 0,
  };
}

const PLAN_DAYS_LEGACY = { basico: 2, estandar: 3, pro: 5 } as const;
const PLAN_MINUTES = { basico: 15, estandar: 30, pro: 30 } as const;

export async function getHomeProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart.getTime() - 1);

  const fourWeeksAgo = new Date(weekStart);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const lastWeekStartStr = lastWeekStart.toISOString().slice(0, 10);
  const fourWeeksAgoStr = fourWeeksAgo.toISOString().slice(0, 10);

  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const [
    profileResult,
    todayActivitiesResult,
    weekActivitiesResult,
    existingLastWeekResult,
    existingCurrentWeekResult,
    recentCompletionsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("avatar_url, full_name, plan, level, department_id, departments(name)")
      .eq("id", user.id)
      .single(),
    supabase
      .from("activities")
      .select("minutes")
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("activities")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", weekStart.toISOString()),
    supabase
      .from("weekly_plan_completions")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start", lastWeekStartStr)
      .single(),
    supabase
      .from("weekly_plan_completions")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start", weekStartStr)
      .single(),
    supabase
      .from("weekly_plan_completions")
      .select("week_start")
      .eq("user_id", user.id)
      .gte("week_start", fourWeeksAgoStr)
      .order("week_start", { ascending: false }),
  ]);

  const { data } = profileResult;
  if (!data) return null;

  const { departments, ...rest } = data as typeof data & { departments: { name: string } | null };

  const todayMinutes =
    (todayActivitiesResult.data ?? []).reduce((sum, a) => sum + (a.minutes ?? 0), 0);

  const uniqueDays = new Set(
    (weekActivitiesResult.data ?? []).map((a) =>
      new Date(a.created_at).toISOString().slice(0, 10)
    )
  );
  const daysCompleted = uniqueDays.size;

  const plan = (rest.plan ?? "estandar") as keyof typeof PLAN_DAYS_LEGACY;
  const daysTotal = PLAN_DAYS_LEGACY[plan] ?? 3;
  const todayGoal = PLAN_MINUTES[plan] ?? 30;

  let xpEarned: number | undefined;
  const existingLastWeek = existingLastWeekResult.data;
  const existingCurrentWeek = existingCurrentWeekResult.data;

  if (!existingLastWeek) {
    const { data: lastWeekActivities } = await supabase
      .from("activities")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", lastWeekStart.toISOString())
      .lte("created_at", lastWeekEnd.toISOString());

    const lastWeekDays = new Set(
      (lastWeekActivities ?? []).map((a) =>
        new Date(a.created_at).toISOString().slice(0, 10)
      )
    );
    const lastWeekPlan = (rest.plan ?? "estandar") as keyof typeof PLAN_DAYS_LEGACY;
    const lastWeekTotal = PLAN_DAYS_LEGACY[lastWeekPlan] ?? 3;

    if (lastWeekDays.size >= lastWeekTotal) {
      await supabase.from("weekly_plan_completions").insert({
        user_id: user.id,
        week_start: lastWeekStartStr,
        plan: lastWeekPlan,
      });

      const xpAmount = PLAN_XP[lastWeekPlan] ?? 75;
      const { data: newTotal } = await supabase.rpc("award_xp", {
        p_user_id: user.id,
        p_event_type: "weekly_plan",
        p_amount: xpAmount,
        p_metadata: null,
      });
      if (typeof newTotal === "number" && newTotal >= 0) {
        xpEarned = xpAmount;
      }
    }
  }

  if (!existingCurrentWeek && daysCompleted >= daysTotal) {
    await supabase.from("weekly_plan_completions").insert({
      user_id: user.id,
      week_start: weekStartStr,
      plan,
    });

    const xpAmount = PLAN_XP[plan] ?? 75;
    const { data: newTotal } = await supabase.rpc("award_xp", {
      p_user_id: user.id,
      p_event_type: "weekly_plan",
      p_amount: xpAmount,
      p_metadata: null,
    });
    if (typeof newTotal === "number" && newTotal >= 0) {
      xpEarned = xpAmount;
    }
  }

  let weekStarts = (recentCompletionsResult.data ?? []).map((c) =>
    (c as { week_start: string }).week_start
  );
  if (!existingCurrentWeek && daysCompleted >= daysTotal) {
    weekStarts = [weekStartStr, ...weekStarts];
  }

  let perfectStreakWeeks = 0;
  const currentWeekCompleted = weekStarts.includes(weekStartStr);
  let expectedWeek = new Date(weekStart);
  if (!currentWeekCompleted) {
    expectedWeek.setDate(expectedWeek.getDate() - 7);
  }
  for (let i = 0; i < 104; i++) {
    const expected = expectedWeek.toISOString().slice(0, 10);
    if (weekStarts.includes(expected)) {
      perfectStreakWeeks++;
      expectedWeek.setDate(expectedWeek.getDate() - 7);
    } else {
      break;
    }
  }

  return {
    ...rest,
    department_name: departments?.name ?? null,
    today_minutes: todayMinutes,
    today_goal: todayGoal,
    days_completed: daysCompleted,
    days_total: daysTotal,
    xpEarned,
    perfectStreakWeeks,
  };
}
