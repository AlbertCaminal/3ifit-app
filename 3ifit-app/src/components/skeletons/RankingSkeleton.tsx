import { Skeleton } from "@/components/ui/Skeleton";

export function RankingSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]" aria-busy="true" aria-label="Cargando ranking...">
      <div className="px-6 py-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-1 h-4 w-40" />
      </div>
      <div className="mx-4 mt-4">
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
      <div className="flex flex-1 flex-col gap-4 px-6 py-6">
        <div className="flex justify-around gap-2">
          <Skeleton className="h-24 w-20 rounded-xl" />
          <Skeleton className="h-32 w-24 rounded-xl" />
          <Skeleton className="h-24 w-20 rounded-xl" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
