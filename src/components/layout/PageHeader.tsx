"use client";

import { AppLink as Link } from "@/components/ui/AppLink";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: { href: string };
  actions?: React.ReactNode;
  variant?: "default" | "minimal";
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  backLink,
  actions,
  variant = "default",
  className,
}: PageHeaderProps) {
  const hasBorder = variant === "default";
  const hasBackOrActions = backLink || actions;

  return (
    <header
      className={cn(
        "flex items-center gap-4 px-6 py-4",
        hasBorder && "border-b border-[var(--color-border)]",
        className,
      )}
    >
      {backLink && (
        <Link
          href={backLink.href}
          className="flex shrink-0 items-center text-[var(--color-primary)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-lg"
          aria-label="Volver"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
      )}
      <div className="flex flex-1 min-w-0 flex-col gap-1">
        <h1 className="text-[28px] font-bold text-[var(--color-text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs font-medium text-[var(--color-text-muted-light)]">
            {subtitle}
          </p>
        )}
      </div>
      {actions}
    </header>
  );
}
