import { Skeleton } from "@/components/ui/Skeleton";

export function HomeSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]" aria-busy="true" aria-label="Cargando inicio...">
      <header className="flex justify-between px-6 py-4">
        <div className="flex gap-3">
          <Skeleton className="h-[52px] w-[52px] shrink-0 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center gap-4 px-6 py-4">
        <div className="flex items-center gap-5">
          <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 pb-5">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="mt-auto pt-4 pb-6">
          <Skeleton className="h-[60px] w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
