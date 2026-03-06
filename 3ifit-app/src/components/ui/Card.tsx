"use client";

import { cn } from "@/lib/utils";

type CardVariant = "default" | "muted" | "highlighted" | "compact" | "elevated" | "compactBorder" | "success";

type CardPadding = "sm" | "md" | "lg" | "none";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    "rounded-3xl bg-[var(--color-bg-card)] shadow-[var(--shadow-card)]",
  muted:
    "rounded-xl bg-[var(--color-bg-muted)]",
  highlighted:
    "rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-primary-light)]",
  compact:
    "rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-card)]",
  compactBorder:
    "rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)]",
  success:
    "rounded-xl border border-[var(--color-success)] bg-[var(--color-success-light)]",
  elevated:
    "rounded-3xl bg-[var(--color-bg-card)] shadow-[var(--shadow-card-elevated)]",
};

const paddingClasses: Record<CardPadding, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
  none: "p-0",
};

export function Card({
  variant = "default",
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(variantClasses[variant], paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}
