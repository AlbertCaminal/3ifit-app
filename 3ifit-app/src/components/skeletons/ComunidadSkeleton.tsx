import { Skeleton } from "@/components/ui/Skeleton";

function PostCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <Skeleton className="h-8 w-16 shrink-0 rounded-full" />
      </div>
    </div>
  );
}

export function ComunidadSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]" aria-busy="true" aria-label="Cargando comunidad...">
      <div className="px-6 py-4">
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex flex-1 flex-col gap-5 overflow-auto px-6 pt-4 pb-7">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="flex flex-col gap-3">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </div>
    </div>
  );
}
