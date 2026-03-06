"use client";

export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--color-bg-muted)] ${className}`}
      aria-hidden
      {...props}
    />
  );
}
