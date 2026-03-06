import { NextResponse } from "next/server";
import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

const ACTIVITY_REMINDER_HOUR = 14;

function getReminderPayload(title: string, body: string) {
  return { title, body, icon: "/icons/icon-192.png" };
}

/** Obtiene el ranking de departamentos para la temporada activa */
async function getDepartmentRankingForCron(
  supabase: ReturnType<typeof createAdminClient>,
  seasonId: string
): Promise<Map<string, number>> {
  const { data: entries } = await supabase
    .from("leaderboard_entries")
    .select("user_id, minutes")
    .eq("season_id", seasonId);

  if (!entries?.length) return new Map();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, department_id")
    .in("id", entries.map((e) => e.user_id));

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.department_id])
  );
  const deptMinutes = new Map<string, number>();

  for (const e of entries) {
    const deptId = profileMap.get(e.user_id);
    if (deptId) {
      deptMinutes.set(deptId, (deptMinutes.get(deptId) ?? 0) + (e.minutes ?? 0));
    }
  }

  const sorted = [...deptMinutes.entries()].sort((a, b) => b[1] - a[1]);
  const rankMap = new Map<string, number>();
  sorted.forEach(([deptId], i) => rankMap.set(deptId, i + 1));
  return rankMap;
}

async function handleCron() {
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { error: "VAPID keys no configuradas" },
      { status: 500 }
    );
  }

  webPush.setVapidDetails(
    "mailto:3ifit@empresa.com",
    vapidPublic,
    vapidPrivate
  );

  const supabase = createAdminClient();
  const now = new Date();
  const currentHour = now.getHours();
  const today = now.toISOString().slice(0, 10);

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");

  if (!subs?.length) {
    return NextResponse.json({ sent: 0, message: "Sin suscripciones" });
  }

  const userIds = subs.map((s) => s.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, department_id, department_rank_last_notified")
    .in("id", userIds)
    .eq("notifications_enabled", true)
    .eq("weekly_plan_unlocked", true);

  const enabledIds = new Set((profiles ?? []).map((p) => p.id));

  const { data: activeSeason } = await supabase
    .from("seasons")
    .select("id")
    .lte("start_date", today)
    .gte("end_date", today)
    .single();

  const deptRankMap =
    activeSeason?.id
      ? await getDepartmentRankingForCron(supabase, activeSeason.id)
      : new Map<string, number>();

  let sent = 0;

  for (const sub of subs) {
    if (!enabledIds.has(sub.user_id)) continue;

    const { data } = await supabase.rpc("get_home_data_for_cron", {
      p_user_id: sub.user_id,
    });

    if (!data || typeof data !== "object") continue;
    const obj = data as Record<string, unknown>;
    const daysTotal = (obj.days_total as number) ?? 3;
    const daysCompleted = (obj.days_completed as number) ?? 0;
    const daysRemaining = Math.max(0, daysTotal - daysCompleted);
    const hasActivityToday = ((obj.today_minutes as number) ?? 0) > 0;
    const perfectStreakWeeks = (obj.perfectStreakWeeks as number) ?? 0;
    const departmentId = obj.department_id as string | null;

    const payloads: Array<{ title: string; body: string; icon: string }> = [];

    if (daysRemaining > 0 && daysRemaining <= 3) {
      const daysText = daysRemaining === 1 ? "1 día" : `${daysRemaining} días`;
      payloads.push(
        getReminderPayload(
          "Plan semanal",
          `Te faltan ${daysText} para completar tu plan esta semana`
        )
      );
    }

    if (!hasActivityToday && currentHour >= ACTIVITY_REMINDER_HOUR) {
      if (perfectStreakWeeks >= 1) {
        const weeksText =
          perfectStreakWeeks === 1
            ? "1 semana"
            : `${perfectStreakWeeks} semanas`;
        payloads.push(
          getReminderPayload(
            "Racha en riesgo",
            `Llevas ${weeksText} de racha. Registra actividad hoy para no perderla.`
          )
        );
      } else {
        payloads.push(
          getReminderPayload(
            "Actividad diaria",
            "Aún no has registrado actividad hoy, ¡no pierdas tu racha!"
          )
        );
      }
    }

    let rankingNotificationSent = false;
    if (departmentId && deptRankMap.size > 0) {
      const currentRank = deptRankMap.get(departmentId);
      const profile = profiles?.find((p) => p.id === sub.user_id);
      const lastNotified = profile?.department_rank_last_notified ?? null;

      if (
        typeof currentRank === "number" &&
        lastNotified !== null &&
        currentRank !== lastNotified
      ) {
        const direction =
          currentRank < lastNotified ? "subido" : "bajado";
        const posText =
          currentRank === 1
            ? "1º"
            : currentRank === 2
              ? "2º"
              : currentRank === 3
                ? "3º"
                : `${currentRank}º`;
        payloads.push(
          getReminderPayload(
            "Ranking",
            `Tu equipo ha ${direction} al puesto ${posText} en el ranking.`
          )
        );
        rankingNotificationSent = true;
      }
    }

    for (const payload of payloads) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
          { TTL: 86400 }
        );
        sent++;
      } catch (err) {
        if (err && typeof err === "object" && "statusCode" in err) {
          const status = (err as { statusCode: number }).statusCode;
          if (status === 410 || status === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("user_id", sub.user_id);
          }
        }
      }
    }

    const currentRank =
      departmentId && deptRankMap.size > 0
        ? deptRankMap.get(departmentId)
        : undefined;
    const profile = profiles?.find((p) => p.id === sub.user_id);
    const lastNotified = profile?.department_rank_last_notified ?? null;
    if (
      departmentId &&
      typeof currentRank === "number" &&
      (rankingNotificationSent || lastNotified === null)
    ) {
      await supabase
        .from("profiles")
        .update({ department_rank_last_notified: currentRank })
        .eq("id", sub.user_id);
    }
  }

  return NextResponse.json({ sent });
}

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  return !!cronSecret && authHeader === `Bearer ${cronSecret}`;
}

/** Vercel Cron envía GET; también aceptamos POST para pruebas manuales */
export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return handleCron();
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return handleCron();
}
