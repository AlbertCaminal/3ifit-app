"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import { logError } from "@/lib/logger";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("App error", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 pb-24">
      <div className="flex max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-light)]">
          <AlertTriangle
            className="h-10 w-10 text-[var(--color-primary)]"
            strokeWidth={1.5}
          />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            Algo ha ido mal
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn-primary w-full rounded-full bg-[var(--color-primary)] py-3.5 text-base font-semibold text-white shadow-[var(--shadow-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            Reintentar
          </button>
          <AppLink
            href="/app"
            className="btn-secondary flex w-full items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] py-3.5 text-base font-medium text-[var(--color-text-primary)]"
          >
            Ir al inicio
          </AppLink>
        </div>
      </div>
    </div>
  );
}
