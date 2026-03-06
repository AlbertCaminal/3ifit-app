import { FileQuestion } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-bg-muted)]">
          <FileQuestion
            className="h-10 w-10 text-[var(--color-text-muted)]"
            strokeWidth={1.5}
          />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            Página no encontrada
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            La página que buscas no existe o ha sido movida.
          </p>
        </div>
        <AppLink
          href="/app"
          className="btn-primary flex w-full items-center justify-center rounded-full bg-[var(--color-primary)] py-3.5 text-base font-semibold text-white shadow-[var(--shadow-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          Ir al inicio
        </AppLink>
      </div>
    </div>
  );
}
