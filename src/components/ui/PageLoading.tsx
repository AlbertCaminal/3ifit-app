export function PageLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6" aria-busy="true" aria-label="Cargando...">
      <div className="flex flex-col gap-4">
        <div className="h-8 w-3/4 animate-pulse rounded-lg bg-[var(--color-bg-muted)]" />
        <div className="h-4 w-full animate-pulse rounded bg-[var(--color-bg-muted)]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--color-bg-muted)]" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="h-24 w-full animate-pulse rounded-2xl bg-[var(--color-bg-muted)]" />
        <div className="h-24 w-full animate-pulse rounded-2xl bg-[var(--color-bg-muted)]" />
        <div className="h-24 w-full animate-pulse rounded-2xl bg-[var(--color-bg-muted)]" />
      </div>
    </div>
  );
}

export function PageLoadingSpinner() {
  return (
    <div
      className="flex min-h-[80vh] flex-1 flex-col items-center justify-center gap-4"
      aria-busy="true"
      aria-label="Cargando..."
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]"
        role="status"
      />
      <p className="text-sm text-[var(--color-text-muted)]">Cargando...</p>
    </div>
  );
}
