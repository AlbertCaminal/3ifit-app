import { Suspense } from "react";
import { BreakReminderProvider } from "@/contexts/BreakReminderContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { XPProvider } from "@/contexts/XPContext";
import { getNotificationsEnabled } from "./app/configuracion/actions";
import { AppShell } from "./AppShell";

function AppLayoutLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
    </div>
  );
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialNotificationsEnabled = false;
  try {
    initialNotificationsEnabled = await getNotificationsEnabled();
  } catch {
    // Si falla la carga (ej. sesión no lista), usar valor por defecto
  }

  return (
    <XPProvider>
      <NotificationsProvider initialEnabled={initialNotificationsEnabled}>
        <BreakReminderProvider>
          <Suspense fallback={<AppLayoutLoading />}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </BreakReminderProvider>
      </NotificationsProvider>
    </XPProvider>
  );
}
