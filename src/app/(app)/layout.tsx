import { BreakReminderProvider } from "@/contexts/BreakReminderContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { XPProvider } from "@/contexts/XPContext";
import {
  getNotificationsEnabled,
  getWeeklyPlanUnlocked,
} from "./app/configuracion/actions";
import { AppShell } from "./AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [initialNotificationsEnabled, weeklyPlanUnlocked] = await Promise.all([
    getNotificationsEnabled(),
    getWeeklyPlanUnlocked(),
  ]);

  return (
    <XPProvider>
      <NotificationsProvider
        initialEnabled={initialNotificationsEnabled && weeklyPlanUnlocked}
      >
        <BreakReminderProvider pausasUnlocked={weeklyPlanUnlocked}>
          <AppShell>{children}</AppShell>
        </BreakReminderProvider>
      </NotificationsProvider>
    </XPProvider>
  );
}
