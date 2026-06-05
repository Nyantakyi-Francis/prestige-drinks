export default function SalesLoading() {
  return (
    <div className="space-y-5">
      <div>
        <div className="h-8 w-40 animate-pulse rounded-md bg-zinc-200" />
        <div className="mt-2 h-5 w-72 max-w-full animate-pulse rounded-md bg-zinc-200" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="h-4 w-24 animate-pulse rounded-md bg-zinc-200" />
      <div className="mt-3 h-7 w-32 animate-pulse rounded-md bg-zinc-200" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="h-5 w-44 animate-pulse rounded-md bg-zinc-200" />
      <div className="mt-2 h-4 w-full max-w-sm animate-pulse rounded-md bg-zinc-200" />
    </div>
  );
}
