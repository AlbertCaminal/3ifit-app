import { Skeleton } from "@/components/ui/Skeleton";

export function ConfiguracionSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]" aria-busy="true" aria-label="Cargando configuración...">
      <div className="px-6 py-4">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex flex-1 flex-col gap-4 px-6 py-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}
