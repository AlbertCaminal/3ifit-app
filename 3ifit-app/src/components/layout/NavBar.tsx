"use client";

import { AppLink as Link } from "@/components/ui/AppLink";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, Trophy, Target } from "lucide-react";

const tabs = [
  { href: "/app/home", icon: Home, label: "Home" },
  { href: "/app/comunidad", icon: Users, label: "Comunidad" },
  { href: "/app/ranking", icon: Trophy, label: "Ranking" },
  { href: "/app/misiones", icon: Target, label: "Misiones" },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <nav className="mx-auto flex w-full max-w-md shrink-0 items-center justify-between rounded-t-[24px] bg-[var(--color-bg-card)] px-7 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-7 shadow-[var(--shadow-navbar)]">
      {tabs.map(({ href, icon: Icon, label }) => {
        const isActive =
          pathname === href ||
          (href !== "/app/home" && pathname.startsWith(href));
        const color = isActive
          ? "text-[var(--color-primary)]"
          : "text-[var(--color-icon-inactive)]";

        return (
          <Link
            key={href}
            href={href}
            onMouseEnter={() => router.prefetch(href)}
            className={`group flex flex-col items-center gap-1 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${color}`}
            aria-label={label}
          >
            <Icon className="h-[26px] w-[26px]" strokeWidth={1.5} />
            <span className="text-[10px] font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {label}
            </span>
          </Link>
        );
      })}
      </nav>
    </div>
  );
}
