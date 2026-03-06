"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  registerActivitySchema,
  getValidActivityType,
} from "@/lib/validations";
import { ACTIVITY_TYPES } from "./constants";

export async function getDailyXPStatus(): Promise<{
  activityXPClaimed: boolean;
  photoXPClaimed: boolean;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { activityXPClaimed: false, photoXPClaimed: false };
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const { data: events } = await supabase
    .from("xp_events")
    .select("event_type")
    .eq("user_id", user.id)
    .in("event_type", ["activity", "photo"])
    .gte("created_at", todayStart.toISOString())
    .lt("created_at", tomorrowStart.toISOString());

  const types = (events ?? []).map((e) => (e as { event_type: string }).event_type);
  return {
    activityXPClaimed: types.includes("activity"),
    photoXPClaimed: types.includes("photo"),
  };
}

export async function registerActivity(formData: {
  activity_type: string;
  minutes: number;
  notes?: string;
  share_to_feed?: boolean;
  image_url?: string | null;
}) {
  const parsed = registerActivitySchema.safeParse({
    activity_type: formData.activity_type,
    minutes: Math.round(Number(formData.minutes)),
    notes: formData.notes,
    share_to_feed: formData.share_to_feed,
    image_url: formData.image_url,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { success: false, error: msg };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }
  if (!(await checkRateLimit(user.id, "registerActivity"))) {
    return { success: false, error: "Demasiadas peticiones. Espera un momento." };
  }

  const { minutes, activity_type, notes, share_to_feed, image_url } = parsed.data;
  const validType = getValidActivityType(activity_type);
  const typeLabel = ACTIVITY_TYPES.find((t) => t.value === validType)?.label ?? "Actividad";
  const content = share_to_feed
    ? (notes?.trim()
        ? `${minutes} min de ${typeLabel}. ${notes}`
        : `${minutes} min de ${typeLabel}`)
    : null;

  const { data: result, error } = await supabase.rpc("register_activity_complete", {
    p_activity_type: validType,
    p_minutes: minutes,
    p_notes: notes?.trim() || null,
    p_share_to_feed: share_to_feed ?? false,
    p_image_url: image_url || null,
    p_content: content,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const res = result as { success?: boolean; error?: string; xpEarned?: number } | null;
  if (!res?.success) {
    return { success: false, error: res?.error ?? "Error al registrar" };
  }

  revalidatePath("/app/misiones");
  return {
    success: true,
    xpEarned: res.xpEarned && res.xpEarned > 0 ? res.xpEarned : undefined,
  };
}
