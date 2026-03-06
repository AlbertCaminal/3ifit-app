import { getDepartments, getProfileSettings } from "./actions";
import ConfiguracionClient from "./ConfiguracionClient";

function getWeekStart(d: Date): string {
  const day = d.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export default async function ConfiguracionPage() {
  const [profile, departments] = await Promise.all([
    getProfileSettings(),
    getDepartments(),
  ]);
  const plan =
    profile?.plan && ["basico", "estandar", "pro"].includes(profile.plan)
      ? (profile.plan as "basico" | "estandar" | "pro")
      : "estandar";
  const privacy = profile?.privacy_individual ?? false;
  const departmentId = profile?.department_id ?? null;
  const notificationsEnabled =
    (profile as { notifications_enabled?: boolean } | null)?.notifications_enabled ?? true;
  const currentWeek = getWeekStart(new Date());
  const planChangedThisWeek =
    (profile as { plan_changed_week_start?: string | null } | null)
      ?.plan_changed_week_start === currentWeek;
  const departmentChangedThisWeek =
    (profile as { department_changed_week_start?: string | null } | null)
      ?.department_changed_week_start === currentWeek;

  return (
    <ConfiguracionClient
      initialPlan={plan}
      initialPrivacy={privacy}
      initialDepartmentId={departmentId}
      initialNotificationsEnabled={notificationsEnabled}
      departments={departments}
      planChangedThisWeek={planChangedThisWeek}
      departmentChangedThisWeek={departmentChangedThisWeek}
    />
  );
}
