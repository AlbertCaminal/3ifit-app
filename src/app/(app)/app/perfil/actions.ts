"use server";

import { createClient } from "@/lib/supabase/server";

export async function getPerfilProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data }, { data: streak }] = await Promise.all([
    supabase
      .from("profiles")
      .select("avatar_url, full_name, email, level, minutes_total, points, department_id, departments(name)")
      .eq("id", user.id)
      .single(),
    supabase.rpc("get_perfect_streak_weeks", { p_user_id: user.id }),
  ]);

  if (!data) return null;
  const { departments, ...rest } = data as typeof data & { departments: { name: string } | null };
  return {
    ...rest,
    department_name: departments?.name ?? null,
    perfectStreakWeeks: streak ?? 0,
  };
}
