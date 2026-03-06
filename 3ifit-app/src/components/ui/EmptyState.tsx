"use client";

import Image from "next/image";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Card } from "@/components/ui/Card";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  imageSrc,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const buttonClass =
    "btn-primary flex h-14 w-full items-center justify-center rounded-full bg-[var(--color-primary)] text-base font-semibold text-white shadow-[var(--shadow-button-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
      {imageSrc ? (
        <div className="relative flex flex-1 w-full max-w-sm items-center justify-center">
          <Image
            src={imageSrc}
            alt=""
            width={320}
            height={320}
            className="object-contain"
          />
        </div>
      ) : (
        <Card variant="elevated" padding="lg" className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-6">
            {Icon && (
              <div className="flex h-20 w-20 items-center justify-center">
                <Icon
                  className="h-20 w-20 text-[var(--color-primary)]"
                  strokeWidth={1.5}
                />
              </div>
            )}
            {(title || subtitle) && (
              <div className="flex flex-col items-center gap-2">
                {title && (
                  <h2 className="text-center text-lg font-bold text-[var(--color-text-primary)]">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-center text-sm font-normal text-[var(--color-text-muted-light)]">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={buttonClass}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button type="button" onClick={onAction} className={buttonClass}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
