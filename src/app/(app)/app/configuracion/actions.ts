"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSettingsSchema } from "@/lib/validations";

export async function getNotificationsEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return true;

  const { data } = await supabase
    .from("profiles")
    .select("notifications_enabled")
    .eq("id", user.id)
    .single();

  return (data?.notifications_enabled ?? true) as boolean;
}

export async function getDepartments() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");
  return data ?? [];
}

export async function getProfileSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("plan, privacy_individual, department_id, plan_changed_week_start, department_changed_week_start, notifications_enabled, departments(name)")
    .eq("id", user.id)
    .single();

  if (!data) return null;
  const { departments, ...rest } = data as typeof data & {
    departments: { name: string } | null;
  };
  return {
    ...rest,
    department_name: departments?.name ?? null,
  };
}

function getWeekStart(d: Date): string {
  const day = d.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export async function updateProfileSettings(updates: {
  plan?: "basico" | "estandar" | "pro";
  privacy_individual?: boolean;
  department_id?: string | null;
  notifications_enabled?: boolean;
}) {
  const parsed = updateProfileSettingsSchema.safeParse(updates);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { success: false, error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const updatesPayload = parsed.data;

  if (updatesPayload.plan !== undefined) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_changed_week_start")
      .eq("id", user.id)
      .single();

    if (profile && profile.plan !== updatesPayload.plan) {
      const currentWeek = getWeekStart(new Date());
      const lastChangeWeek = profile.plan_changed_week_start as string | null;
      if (lastChangeWeek === currentWeek) {
        return {
          success: false,
          error: "Solo puedes cambiar de plan una vez por semana. Podrás cambiarlo de nuevo el lunes.",
        };
      }
    }
  }

  if (updatesPayload.department_id !== undefined) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("department_id, department_changed_week_start")
      .eq("id", user.id)
      .single();

    const newDept = updatesPayload.department_id ?? null;
    const currentDept = profile?.department_id ?? null;
    if (profile && String(newDept) !== String(currentDept)) {
      const currentWeek = getWeekStart(new Date());
      const lastChangeWeek = profile.department_changed_week_start as string | null;
      if (lastChangeWeek === currentWeek) {
        return {
          success: false,
          error: "Solo puedes cambiar de departamento una vez por semana. Podrás modificarlo de nuevo el lunes.",
        };
      }
    }
  }

  const updatePayload: Record<string, unknown> = {
    ...updatesPayload,
    updated_at: new Date().toISOString(),
  };

  if (updatesPayload.plan !== undefined) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();
    if (profile && profile.plan !== updatesPayload.plan) {
      updatePayload.plan_changed_week_start = getWeekStart(new Date());
    }
  }

  if (updatesPayload.department_id !== undefined) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("department_id")
      .eq("id", user.id)
      .single();
    const newDept = updatesPayload.department_id ?? null;
    const currentDept = profile?.department_id ?? null;
    if (profile && String(newDept) !== String(currentDept)) {
      updatePayload.department_changed_week_start = getWeekStart(new Date());
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (!error) {
    revalidatePath("/app/configuracion");
    revalidatePath("/app/home");
    revalidatePath("/app/perfil");
    revalidatePath("/app/misiones");
    revalidatePath("/app/ranking");
  }

  return { success: !error, error: error?.message ?? undefined };
}
