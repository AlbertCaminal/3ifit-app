"use server";

import { createClient } from "@/lib/supabase/server";
import type { UserMission } from "@/types/database";

export type { UserMission };

function getWeekStart(d: Date): string {
  const day = d.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function getWeekBounds(weekStart: string) {
  const start = new Date(weekStart + "T00:00:00Z");
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}

export async function getDailyXPTasks(): Promise<{
  activityDone: boolean;
  photoDone: boolean;
  clapsDone: boolean;
  clapsProgress: number;
  clapsTarget: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { activityDone: false, photoDone: false, clapsDone: false, clapsProgress: 0, clapsTarget: 5 };
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const { data: events } = await supabase
    .from("xp_events")
    .select("event_type, amount")
    .eq("user_id", user.id)
    .gte("created_at", todayStart.toISOString())
    .lt("created_at", tomorrowStart.toISOString());

  let activityDone = false;
  let photoDone = false;
  let clapXP = 0;
  for (const e of events ?? []) {
    const ev = e as { event_type: string; amount?: number };
    if (ev.event_type === "activity") activityDone = true;
    if (ev.event_type === "photo") photoDone = true;
    if (ev.event_type === "clap") clapXP += ev.amount ?? 0;
  }
  const clapsTarget = 5;
  const clapsProgress = Math.min(Math.floor(clapXP / 2), clapsTarget);
  const clapsDone = clapXP >= 10;

  return { activityDone, photoDone, clapsDone, clapsProgress, clapsTarget };
}

export async function ensureWeeklyMissions(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const weekStart = getWeekStart(new Date());

  await supabase.rpc("ensure_weekly_missions", {
    p_user_id: user.id,
    p_week_start: weekStart,
  });
}

export async function getUserMissions(): Promise<{
  missions: UserMission[];
  level: number;
  xpEarned?: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { missions: [], level: 1 };

  await ensureWeeklyMissions();

  const weekStart = getWeekStart(new Date());
  const { start: weekStartTs, end: weekEndTs } = getWeekBounds(weekStart);
  const lastWeekStart = new Date(weekStartTs);
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);
  const lastWeekStartStr = lastWeekStart.toISOString().slice(0, 10);

  const { data: rows } = await supabase
    .from("user_weekly_missions")
    .select(`
      id,
      mission_id,
      progress,
      completed_at,
      created_at,
      missions_pool (slug, title, xp_reward, target_value, type)
    `)
    .eq("user_id", user.id)
    .eq("week_start", weekStart);

  if (!rows?.length) return { missions: [], level: 1 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("level, plan, department_id")
    .eq("id", user.id)
    .single();

  const level = profile?.level ?? 1;
  const plan = profile?.plan ?? "estandar";
  const departmentId = profile?.department_id ?? null;
  const daysTotal = plan === "basico" ? 2 : plan === "estandar" ? 3 : 5;

  let totalXpEarned = 0;
  const progressUpdates = new Map<string, { progress: number; completedAt: string | null }>();

  type RowWithPool = {
    id: string;
    mission_id: string;
    progress: number;
    completed_at: string | null;
    created_at: string;
    missions_pool: { slug: string; title: string; xp_reward: number; target_value: number | null; type: string } | null;
  };

  for (const row of rows as unknown as RowWithPool[]) {
    if (row.completed_at) continue;

    const slug = row.missions_pool?.slug ?? "";
    const xpReward = row.missions_pool?.xp_reward ?? 0;
    const targetValue = row.missions_pool?.target_value;
    const missionUnlockedAt = row.created_at ?? weekStartTs.toISOString();
    const progress = await checkMissionProgress(
      supabase,
      user.id,
      slug,
      weekStart,
      weekStartTs.toISOString(),
      weekEndTs.toISOString(),
      missionUnlockedAt,
      lastWeekStartStr,
      departmentId,
      daysTotal
    );

    if (progress >= (targetValue ?? 1)) {
      const completedAt = new Date().toISOString();
      await supabase
        .from("user_weekly_missions")
        .update({ progress, completed_at: completedAt })
        .eq("id", row.id);

      progressUpdates.set(row.id, { progress, completedAt });

      const { error } = await supabase.rpc("award_xp", {
        p_user_id: user.id,
        p_event_type: "mission",
        p_amount: xpReward,
        p_metadata: { mission_slug: slug, week_start: weekStart },
      });
      if (!error) totalXpEarned += xpReward;
    } else if (progress !== row.progress) {
      await supabase
        .from("user_weekly_missions")
        .update({ progress })
        .eq("id", row.id);
      progressUpdates.set(row.id, { progress, completedAt: row.completed_at });
    }
  }

  const missions: UserMission[] = (rows as unknown as RowWithPool[]).map((r) => {
    const updated = progressUpdates.get(r.id);
    return {
      id: r.id,
      missionId: r.mission_id,
      slug: r.missions_pool?.slug ?? "",
      title: r.missions_pool?.title ?? "",
      xpReward: r.missions_pool?.xp_reward ?? 0,
      targetValue: r.missions_pool?.target_value ?? null,
      progress: updated ? updated.progress : r.progress,
      completedAt: updated ? updated.completedAt : r.completed_at,
      type: (r.missions_pool?.type ?? "pool") as "fixed" | "pool",
    };
  });

  return {
    missions,
    level,
    xpEarned: totalXpEarned > 0 ? totalXpEarned : undefined,
  };
}

async function checkMissionProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  slug: string,
  weekStart: string,
  weekStartTs: string,
  weekEndTs: string,
  missionUnlockedAt: string,
  lastWeekStartStr: string,
  departmentId: string | null,
  daysTotal: number
): Promise<number> {
  const countFrom = slug.startsWith("streak_") ? weekStartTs : missionUnlockedAt;
  switch (slug) {
    case "streak_1": {
      const { data: acts } = await supabase
        .from("activities")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const distinctDays = new Set((acts ?? []).map((a) => (a.created_at as string).slice(0, 10))).size;
      return distinctDays >= daysTotal ? 1 : 0;
    }
    case "streak_2": {
      const { data: lastWeek } = await supabase
        .from("weekly_plan_completions")
        .select("id")
        .eq("user_id", userId)
        .eq("week_start", lastWeekStartStr)
        .limit(1);
      if (!lastWeek?.length) return 0;
      const { data: acts } = await supabase
        .from("activities")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const distinctDays = new Set((acts ?? []).map((a) => (a.created_at as string).slice(0, 10))).size;
      return distinctDays >= daysTotal ? 2 : 1;
    }
    case "streak_4":
    case "streak_8":
    case "streak_12": {
      const target = parseInt(slug.replace("streak_", ""), 10);
      const { data: completions } = await supabase
        .from("weekly_plan_completions")
        .select("week_start")
        .eq("user_id", userId);
      const completionSet = new Set((completions ?? []).map((c) => c.week_start));
      const { data: acts } = await supabase
        .from("activities")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const distinctDays = new Set((acts ?? []).map((a) => (a.created_at as string).slice(0, 10))).size;
      const currentWeekComplete = distinctDays >= daysTotal;
      let consecutive = currentWeekComplete ? 1 : 0;
      if (!currentWeekComplete) return 0;
      let weekDate = new Date(weekStart + "T00:00:00Z");
      weekDate.setUTCDate(weekDate.getUTCDate() - 7);
      for (let i = 0; i < 20; i++) {
        const checkStr = weekDate.toISOString().slice(0, 10);
        if (completionSet.has(checkStr)) consecutive++;
        else break;
        weekDate.setUTCDate(weekDate.getUTCDate() - 7);
      }
      return Math.min(consecutive, target);
    }
    case "social_5": {
      const { data: count, error } = await supabase.rpc("count_social_5_likes", {
        p_week_start_ts: countFrom,
        p_week_end_ts: weekEndTs,
      });
      if (!error && typeof count === "number") return count;
      const { data: likes } = await supabase
        .from("feed_post_likes")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      return likes?.length ?? 0;
    }
    case "rompehielo": {
      const { data: posts } = await supabase
        .from("feed_posts")
        .select("id")
        .eq("user_id", userId)
        .not("image_url", "is", null)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      return (posts?.length ?? 0) >= 1 ? 1 : 0;
    }
    case "explorador": {
      const { data: acts } = await supabase
        .from("activities")
        .select("activity_type")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const types = new Set((acts ?? []).map((a) => a.activity_type));
      return types.size;
    }
    case "madrugador": {
      const { data: acts } = await supabase
        .from("activities")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const before9 = (acts ?? []).some((a) => {
        const h = new Date(a.created_at as string).getUTCHours();
        return h < 9;
      });
      return before9 ? 1 : 0;
    }
    case "nocturna": {
      const { data: acts } = await supabase
        .from("activities")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const after18 = (acts ?? []).some((a) => {
        const h = new Date(a.created_at as string).getUTCHours();
        return h >= 18;
      });
      return after18 ? 1 : 0;
    }
    case "inter_dept": {
      if (!departmentId) return 0;
      const { data: likes } = await supabase
        .from("feed_post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      if (!likes?.length) return 0;
      const postIds = likes.map((l) => l.post_id);
      const { data: posts } = await supabase
        .from("feed_posts")
        .select("user_id")
        .in("id", postIds);
      const authorIds = [...new Set((posts ?? []).map((p) => p.user_id).filter(Boolean))];
      if (!authorIds.length) return 0;
      const { data: authors } = await supabase
        .from("profiles")
        .select("department_id")
        .in("id", authorIds);
      const otherDept = (authors ?? []).filter((a) => a.department_id !== departmentId).length;
      return Math.min(otherDept, 3);
    }
    case "volumen_90": {
      const { data: acts } = await supabase
        .from("activities")
        .select("minutes")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const total = (acts ?? []).reduce((s, a) => s + (a.minutes ?? 0), 0);
      return total;
    }
    case "zen": {
      const { data: acts } = await supabase
        .from("activities")
        .select("minutes")
        .eq("user_id", userId)
        .in("activity_type", ["yoga", "meditation"])
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const total = (acts ?? []).reduce((s, a) => s + (a.minutes ?? 0), 0);
      return total;
    }
    case "animos_caminar_correr": {
      const { data: count, error } = await supabase.rpc("count_animos_caminar_correr", {
        p_week_start_ts: countFrom,
        p_week_end_ts: weekEndTs,
      });
      if (!error && typeof count === "number") return count;
      return 0;
    }
    case "mente_sana": {
      const { data: acts } = await supabase
        .from("activities")
        .select("minutes")
        .eq("user_id", userId)
        .in("activity_type", ["yoga", "meditation", "stretching"])
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const max = Math.max(0, ...(acts ?? []).map((a) => a.minutes ?? 0));
      return max >= 40 ? 40 : max;
    }
    case "fin_semana": {
      const { data: acts } = await supabase
        .from("activities")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const weekend = (acts ?? []).some((a) => {
        const d = new Date(a.created_at as string).getUTCDay();
        return d === 0 || d === 6;
      });
      return weekend ? 1 : 0;
    }
    case "intensidad": {
      const { data: acts } = await supabase
        .from("activities")
        .select("minutes")
        .in("activity_type", ["running", "cycling", "gym", "swimming"])
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const max = Math.max(0, ...(acts ?? []).map((a) => a.minutes ?? 0));
      return max >= 20 ? 20 : max;
    }
    case "influencer": {
      const { data: posts } = await supabase
        .from("feed_posts")
        .select("likes_count")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const maxLikes = Math.max(0, ...(posts ?? []).map((p) => p.likes_count ?? 0));
      return maxLikes >= 5 ? 5 : maxLikes;
    }
    case "embajador": {
      const { data: posts } = await supabase
        .from("feed_posts")
        .select("id")
        .eq("user_id", userId)
        .not("image_url", "is", null)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      return posts?.length ?? 0;
    }
    case "maraton_250": {
      const { data: acts } = await supabase
        .from("activities")
        .select("minutes")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const total = (acts ?? []).reduce((s, a) => s + (a.minutes ?? 0), 0);
      return total;
    }
    case "multideporte": {
      const { data: acts } = await supabase
        .from("activities")
        .select("activity_type")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      return new Set((acts ?? []).map((a) => a.activity_type)).size;
    }
    case "naturaleza": {
      const { data: acts } = await supabase
        .from("activities")
        .select("minutes")
        .eq("user_id", userId)
        .eq("activity_type", "hiking")
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const max = Math.max(0, ...(acts ?? []).map((a) => a.minutes ?? 0));
      return max >= 120 ? 120 : max;
    }
    case "record_personal": {
      const { data: thisWeek } = await supabase
        .from("activities")
        .select("minutes")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const thisTotal = (thisWeek ?? []).reduce((s, a) => s + (a.minutes ?? 0), 0);
      const prevStart = new Date(weekStartTs);
      prevStart.setUTCDate(prevStart.getUTCDate() - 7);
      const prevEnd = new Date(weekEndTs);
      prevEnd.setUTCDate(prevEnd.getUTCDate() - 7);
      const { data: lastWeek } = await supabase
        .from("activities")
        .select("minutes")
        .eq("user_id", userId)
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", prevEnd.toISOString());
      const lastTotal = (lastWeek ?? []).reduce((s, a) => s + (a.minutes ?? 0), 0);
      return thisTotal > lastTotal && lastTotal > 0 ? 1 : 0;
    }
    case "sherpa": {
      const { data: likes } = await supabase
        .from("feed_post_likes")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      return likes?.length ?? 0;
    }
    case "360": {
      const { data: acts } = await supabase
        .from("activities")
        .select("minutes, activity_type")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const total = (acts ?? []).reduce((s, a) => s + (a.minutes ?? 0), 0);
      const types = new Set((acts ?? []).map((a) => a.activity_type)).size;
      return total >= 300 && types >= 3 ? 300 : total;
    }
    case "motor_equipo": {
      if (!departmentId) return 0;
      const { data: deptUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("department_id", departmentId);
      const userIds = (deptUsers ?? []).map((u) => u.id).filter(Boolean);
      if (!userIds.length) return 0;
      const { data: totals } = await supabase
        .from("activities")
        .select("user_id, minutes")
        .in("user_id", userIds)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const byUser = new Map<string, number>();
      for (const t of totals ?? []) {
        byUser.set(t.user_id, (byUser.get(t.user_id) ?? 0) + (t.minutes ?? 0));
      }
      const myTotal = byUser.get(userId) ?? 0;
      const maxTotal = Math.max(...byUser.values(), 0);
      return myTotal >= maxTotal && maxTotal > 0 ? 1 : 0;
    }
    case "iron_mind": {
      const { data: acts } = await supabase
        .from("activities")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const days = new Map<string, boolean>();
      for (const a of acts ?? []) {
        const d = (a.created_at as string).slice(0, 10);
        const h = new Date(a.created_at as string).getUTCHours();
        const hardSlot = h < 8 || h >= 20;
        days.set(d, (days.get(d) ?? false) || hardSlot);
      }
      const hardDays = [...days.values()].filter(Boolean).length;
      return hardDays >= daysTotal ? 1 : 0;
    }
    case "invencible": {
      const { data: acts } = await supabase
        .from("activities")
        .select("created_at, minutes")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const byDay = new Map<string, number>();
      for (const a of acts ?? []) {
        const d = (a.created_at as string).slice(0, 10);
        byDay.set(d, (byDay.get(d) ?? 0) + (a.minutes ?? 0));
      }
      const days45 = [...byDay.values()].filter((m) => m >= 45).length;
      return days45;
    }
    case "consistencia": {
      const { data: acts } = await supabase
        .from("activities")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const distinctDays = new Set((acts ?? []).map((a) => (a.created_at as string).slice(0, 10))).size;
      return distinctDays;
    }
    case "primer_paso": {
      const { data: acts } = await supabase
        .from("activities")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      return (acts?.length ?? 0) >= 1 ? 1 : 0;
    }
    case "social_basico": {
      const { data: likes } = await supabase
        .from("feed_post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      if (!likes?.length) return 0;
      const postIds = likes.map((l) => l.post_id);
      const { data: posts } = await supabase
        .from("feed_posts")
        .select("user_id")
        .in("id", postIds);
      const distinctAuthors = new Set((posts ?? []).map((p) => p.user_id).filter(Boolean));
      return distinctAuthors.size;
    }
    case "pausa_activa": {
      const { data: acts } = await supabase
        .from("activities")
        .select("minutes")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const shortActs = (acts ?? []).filter((a) => {
        const m = a.minutes ?? 0;
        return m >= 5 && m <= 15;
      });
      return shortActs.length;
    }
    case "rutina_matinal": {
      const { data: acts } = await supabase
        .from("activities")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const before10 = new Set<string>();
      for (const a of acts ?? []) {
        const d = new Date(a.created_at as string);
        if (d.getUTCHours() < 10) before10.add(d.toISOString().slice(0, 10));
      }
      return before10.size;
    }
    case "variedad": {
      const { data: acts } = await supabase
        .from("activities")
        .select("activity_type")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      return new Set((acts ?? []).map((a) => a.activity_type)).size;
    }
    case "comunidad": {
      const { data: likes } = await supabase
        .from("feed_post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      if (!likes?.length) return 0;
      const postIds = likes.map((l) => l.post_id);
      const { data: posts } = await supabase
        .from("feed_posts")
        .select("user_id")
        .in("id", postIds);
      const distinctAuthors = new Set((posts ?? []).map((p) => p.user_id).filter(Boolean));
      return distinctAuthors.size;
    }
    case "constancia": {
      const { data: acts } = await supabase
        .from("activities")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const distinctDays = new Set((acts ?? []).map((a) => (a.created_at as string).slice(0, 10))).size;
      return distinctDays;
    }
    case "desconexion_digital": {
      const { data: acts } = await supabase
        .from("activities")
        .select("minutes")
        .eq("user_id", userId)
        .in("activity_type", ["yoga", "meditation", "stretching"])
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const max = Math.max(0, ...(acts ?? []).map((a) => a.minutes ?? 0));
      return max >= 20 ? 20 : max;
    }
    case "lider_animos": {
      const { data: allLikes } = await supabase
        .from("feed_post_likes")
        .select("user_id")
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const byUser = new Map<string, number>();
      for (const l of allLikes ?? []) {
        const uid = l.user_id as string;
        byUser.set(uid, (byUser.get(uid) ?? 0) + 1);
      }
      const sorted = [...byUser.entries()].sort((a, b) => b[1] - a[1]);
      const top3 = new Set(sorted.slice(0, 3).map(([u]) => u));
      return top3.has(userId) ? 1 : 0;
    }
    case "semana_completa": {
      const { data: acts } = await supabase
        .from("activities")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const weekdays = new Set<string>();
      for (const a of acts ?? []) {
        const d = new Date(a.created_at as string);
        const day = d.getUTCDay();
        if (day >= 1 && day <= 5) weekdays.add(d.toISOString().slice(0, 10));
      }
      return weekdays.size;
    }
    case "doble_sesion": {
      const { data: acts } = await supabase
        .from("activities")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const byDay = new Map<string, number>();
      for (const a of acts ?? []) {
        const d = (a.created_at as string).slice(0, 10);
        byDay.set(d, (byDay.get(d) ?? 0) + 1);
      }
      const daysWith2 = [...byDay.values()].filter((c) => c >= 2).length;
      return daysWith2 >= 1 ? 2 : 0;
    }
    case "referente": {
      const { data: posts } = await supabase
        .from("feed_posts")
        .select("likes_count")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const total = (posts ?? []).reduce((s, p) => s + (p.likes_count ?? 0), 0);
      return total;
    }
    case "ultra": {
      const { data: acts } = await supabase
        .from("activities")
        .select("minutes")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const max = Math.max(0, ...(acts ?? []).map((a) => a.minutes ?? 0));
      return max >= 90 ? 90 : max;
    }
    case "polivalente": {
      const { data: acts } = await supabase
        .from("activities")
        .select("activity_type, created_at")
        .eq("user_id", userId)
        .gte("created_at", countFrom)
        .lt("created_at", weekEndTs);
      const types = new Set((acts ?? []).map((a) => a.activity_type)).size;
      const distinctDays = new Set((acts ?? []).map((a) => (a.created_at as string).slice(0, 10))).size;
      return types >= 4 && distinctDays >= daysTotal ? 4 : Math.min(types, 3);
    }
    default:
      return 0;
  }
}
