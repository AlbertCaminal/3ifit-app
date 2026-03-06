import { BreakReminderProvider } from "@/contexts/BreakReminderContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { XPProvider } from "@/contexts/XPContext";
import { getNotificationsEnabled } from "./app/configuracion/actions";
import { AppShell } from "./AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialNotificationsEnabled = await getNotificationsEnabled();

  return (
    <XPProvider>
      <NotificationsProvider initialEnabled={initialNotificationsEnabled}>
        <BreakReminderProvider>
          <AppShell>{children}</AppShell>
        </BreakReminderProvider>
      </NotificationsProvider>
    </XPProvider>
  );
}
