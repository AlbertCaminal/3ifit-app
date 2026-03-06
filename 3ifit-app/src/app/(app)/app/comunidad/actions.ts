"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { likePostSchema } from "@/lib/validations";
import type { FeedPost } from "@/types/database";

export type { FeedPost };

export async function getClapXPStatus(): Promise<{
  clapXPToday: number;
  clapXPLimit: number;
  remaining: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { clapXPToday: 0, clapXPLimit: 10, remaining: 10 };

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const { data: events } = await supabase
    .from("xp_events")
    .select("amount")
    .eq("user_id", user.id)
    .eq("event_type", "clap")
    .gte("created_at", todayStart.toISOString())
    .lt("created_at", tomorrowStart.toISOString());

  const clapXPToday = (events ?? []).reduce((s, e) => s + ((e as { amount: number }).amount ?? 0), 0);
  const limit = 10;
  return {
    clapXPToday,
    clapXPLimit: limit,
    remaining: Math.max(0, limit - clapXPToday),
  };
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: posts } = await supabase
    .from("feed_posts")
    .select("id, content, image_url, likes_count, created_at, user_id")
    .order("created_at", { ascending: false });

  if (!posts?.length) return [];

  const postIds = posts.map((p) => p.id);
  const { data: userLikes } = await supabase
    .from("feed_post_likes")
    .select("post_id")
    .eq("user_id", user.id)
    .in("post_id", postIds);

  const likedPostIds = new Set((userLikes ?? []).map((l) => l.post_id));

  const userIds = [...new Set(posts.map((p) => p.user_id).filter(Boolean))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, privacy_individual, level")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        privacy_individual: p.privacy_individual ?? false,
        level: p.level ?? 1,
      },
    ])
  );

  const visiblePosts = posts.filter((p) => {
    const profile = profileMap.get(p.user_id);
    if (!profile) return false;
    return !profile.privacy_individual;
  });

  return visiblePosts.map((p) => {
    const profile = profileMap.get(p.user_id);
    return {
      id: p.id,
      content: p.content,
      image_url: p.image_url,
      likes_count: p.likes_count ?? 0,
      user_liked: likedPostIds.has(p.id),
      created_at: p.created_at,
      user_name: profile?.full_name ?? "Usuario",
      user_avatar: profile?.avatar_url ?? null,
      user_level: profile?.level ?? 1,
    };
  });
}

export async function likePost(
  postId: string
): Promise<{ success: boolean; newCount?: number; xpEarned?: number }> {
  const parsed = likePostSchema.safeParse({ postId });
  if (!parsed.success) return { success: false };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };
  if (!(await checkRateLimit(user.id, "like"))) return { success: false };

  const { data: rpcResult, error } = await supabase.rpc("increment_feed_post_likes", {
    post_id: parsed.data.postId,
  });

  if (error) {
    const { data: row } = await supabase
      .from("feed_posts")
      .select("likes_count")
      .eq("id", postId)
      .single();
    const fallbackCount = (row?.likes_count ?? 0) + 1;
    const { error: updateError } = await supabase
      .from("feed_posts")
      .update({ likes_count: fallbackCount })
      .eq("id", postId);
    if (updateError) return { success: false };
    revalidatePath("/app/comunidad");
    revalidatePath("/app/misiones");
    return { success: true, newCount: fallbackCount };
  }

  // -1 = no autenticado, -2 = ya había dado like (no insertamos)
  const alreadyLiked = rpcResult === -2;
  let newCount: number;
  if (alreadyLiked) {
    const { data: row } = await supabase
      .from("feed_posts")
      .select("likes_count")
      .eq("id", postId)
      .single();
    newCount = row?.likes_count ?? 0;
    revalidatePath("/app/comunidad");
    revalidatePath("/app/misiones");
    return { success: true, newCount };
  }
  newCount = rpcResult ?? 0;

  // XP por dar ánimos: solo cuando insertamos un like nuevo, +2 por like, máx 10 XP/día (5 likes)
  let xpEarned: number | undefined;
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const { data: clapEventsToday } = await supabase
    .from("xp_events")
    .select("amount")
    .eq("user_id", user.id)
    .eq("event_type", "clap")
    .gte("created_at", todayStart.toISOString())
    .lt("created_at", tomorrowStart.toISOString());

  const clapXPToday = (clapEventsToday ?? []).reduce((s, e) => s + ((e as { amount: number }).amount ?? 0), 0);
  if (clapXPToday < 10) {
    const { data: total } = await supabase.rpc("award_xp", {
      p_user_id: user.id,
      p_event_type: "clap",
      p_amount: 2,
      p_metadata: null,
    });
    if (typeof total === "number" && total >= 0) xpEarned = 2;
  }

  revalidatePath("/app/comunidad");
  revalidatePath("/app/misiones");
  return { success: true, newCount: newCount ?? undefined, xpEarned };
}
