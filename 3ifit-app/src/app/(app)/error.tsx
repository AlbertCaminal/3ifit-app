"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log para depuración (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.error("App error:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-6">
      <div className="flex max-w-sm flex-col items-center gap-6 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Algo ha fallado al cargar. Es un error temporal.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
