export default function AdminLoading() {
  return (
    <div className="space-y-5">
      <div>
        <div className="h-8 w-44 animate-pulse rounded-md bg-zinc-200" />
        <div className="mt-2 h-5 w-80 max-w-full animate-pulse rounded-md bg-zinc-200" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="h-5 w-32 animate-pulse rounded-md bg-zinc-200" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="h-4 w-24 animate-pulse rounded-md bg-zinc-200" />
      <div className="mt-3 h-7 w-28 animate-pulse rounded-md bg-zinc-200" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <div className="h-5 w-36 animate-pulse rounded-md bg-zinc-200" />
      <div className="mt-2 h-4 w-full animate-pulse rounded-md bg-zinc-200" />
    </div>
  );
}
