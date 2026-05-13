export default function CatalogLoading() {
  return (
    <div className="p-gutter-mobile md:p-margin-desktop space-y-8 animate-pulse">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-56 bg-surface-container-high rounded-lg" />
          <div className="h-5 w-96 bg-surface-container rounded-lg" />
        </div>
        <div className="flex gap-3">
          <div className="h-[48px] w-36 bg-surface-container rounded-full" />
          <div className="h-[48px] w-36 bg-surface-container-high rounded-full" />
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filter card */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
          <div className="h-7 w-48 bg-surface-container-high rounded-lg" />
          <div className="h-12 w-full bg-surface-container rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-12 bg-surface-container rounded-lg" />
            <div className="h-12 bg-surface-container rounded-lg" />
          </div>
        </div>

        {/* Health card */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
          <div className="h-4 w-32 bg-surface-container rounded" />
          <div className="h-10 w-28 bg-surface-container-high rounded-lg" />
          <div className="mt-auto space-y-3 pt-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex justify-between">
                <div className="h-4 w-36 bg-surface-container rounded" />
                <div className="h-4 w-16 bg-surface-container rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="flex gap-4 px-4 py-4 bg-surface-container-highest border-b border-outline-variant">
          {[12, 32, 160, 60, 80, 90, 80, 80].map((w, i) => (
            <div key={i} className="h-4 bg-surface-container rounded flex-shrink-0" style={{ width: w }} />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`flex gap-4 px-4 py-4 border-b border-outline-variant ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-bright'}`}
          >
            {[12, 80, 200, 60, 80, 90, 80, 80].map((w, j) => (
              <div key={j} className="h-4 bg-surface-container rounded flex-shrink-0" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
