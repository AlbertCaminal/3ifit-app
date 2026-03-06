import { Skeleton } from "@/components/ui/Skeleton";

export function MisionesSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]" aria-busy="true" aria-label="Cargando misiones...">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-6 py-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
