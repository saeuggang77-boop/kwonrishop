export default function ListingsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Search bar skeleton */}
      <div className="mb-8 h-12 animate-pulse rounded-lg bg-gray-200" />

      {/* Filter bar skeleton */}
      <div className="mb-6 flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-28 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="h-48 animate-pulse rounded-lg bg-gray-200" />
            <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-6 w-1/3 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
