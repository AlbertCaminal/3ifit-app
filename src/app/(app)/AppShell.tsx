"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname?.startsWith("/app/onboarding");

  return (
    <div className="flex min-h-screen flex-col items-center bg-[var(--background)]">
      <div className="flex w-full max-w-md flex-1 flex-col min-h-0 min-w-0">
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex flex-1 flex-col overflow-auto [scrollbar-gutter:stable] ${
            isOnboarding ? "" : "pb-20"
          }`}
        >
          {children}
        </main>
        {!isOnboarding && <NavBar />}
      </div>
    </div>
  );
}
