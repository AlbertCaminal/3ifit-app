export default function AppLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      <p className="mt-4 text-sm text-[var(--color-text-muted)]">Cargando...</p>
    </div>
  );
}
