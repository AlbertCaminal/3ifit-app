"use server";

import { createClient } from "@/lib/supabase/server";
import { completeOnboardingSchema } from "@/lib/validations";

type Plan = "basico" | "estandar" | "pro" | null;

export async function getDepartments() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");
  return data ?? [];
}

export async function completeOnboarding(
  plan: Plan,
  departmentId: string | null,
  privacyIndividual: boolean,
) {
  const parsed = completeOnboardingSchema.safeParse({
    plan,
    departmentId,
    privacyIndividual,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { success: false, error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  const effectivePlan = parsed.data.plan ?? "basico";
  const departmentIdFinal = parsed.data.departmentId;

  const updates: Record<string, unknown> = {
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    plan: effectivePlan,
    ...(departmentIdFinal && { department_id: departmentIdFinal }),
    privacy_individual: parsed.data.privacyIndividual,
  };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    if (
      error.message?.includes("privacy_individual") ||
      error.message?.includes("column")
    ) {
      const { error: err2 } = await supabase
        .from("profiles")
        .update({
          onboarding_completed_at: updates.onboarding_completed_at,
          updated_at: updates.updated_at,
          plan: effectivePlan,
          ...(departmentIdFinal && { department_id: departmentIdFinal }),
        })
        .eq("id", user.id);
      if (err2) return { success: false, error: err2.message };
    } else {
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}
