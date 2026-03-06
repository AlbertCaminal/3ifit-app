import { Skeleton } from "@/components/ui/Skeleton";

export function RegistrarActividadSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]" aria-busy="true" aria-label="Cargando...">
      <div className="px-6 py-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-1 h-4 w-32" />
      </div>
      <div className="flex flex-1 flex-col gap-5 overflow-auto px-6 py-7">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-2.5">
          <Skeleton className="aspect-square rounded-[20px]" />
          <Skeleton className="aspect-square rounded-[20px]" />
          <Skeleton className="aspect-square rounded-[20px]" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="mt-auto pt-2">
          <Skeleton className="h-14 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
