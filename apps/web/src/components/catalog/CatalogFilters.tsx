'use client';

import { useTransition, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Thresholds {
  onTarget: number;
  belowTarget: number;
  lowStock: number;
}

interface Props {
  q: string;
  category: string;
  status: string;
  categories: string[];
  thresholds: Thresholds;
}

export function CatalogFilters({ q, category, status, categories, thresholds }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = (updates: { q?: string; category?: string; status?: string }) => {
    const params = new URLSearchParams();

    // Always preserve thresholds
    params.set('onTarget', String(thresholds.onTarget));
    params.set('belowTarget', String(thresholds.belowTarget));
    params.set('lowStock', String(thresholds.lowStock));

    const nextQ = updates.q !== undefined ? updates.q : searchValue;
    const nextCategory = updates.category !== undefined ? updates.category : category;
    const nextStatus = updates.status !== undefined ? updates.status : status;

    if (nextQ) params.set('q', nextQ);
    if (nextCategory && nextCategory !== 'all') params.set('category', nextCategory);
    if (nextStatus && nextStatus !== 'all') params.set('status', nextStatus);
    // omit page to reset to 1

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate({ q: value }), 400);
  };

  const selectClass = cn(
    'w-full pl-4 pr-10 py-3 bg-surface border border-outline rounded-lg',
    'text-on-surface font-body-sm text-body-sm appearance-none outline-none cursor-pointer',
    'focus:border-primary focus:ring-1 focus:ring-primary transition-all',
    isPending && 'opacity-60 cursor-not-allowed'
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline select-none pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by SKU, Name, or Barcode…"
          className={cn(
            'w-full pl-10 pr-10 py-3 bg-surface border border-outline rounded-lg',
            'text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm transition-all outline-none',
            isPending && 'opacity-60'
          )}
        />
        {isPending && (
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-[20px] animate-spin pointer-events-none">
            progress_activity
          </span>
        )}
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Category */}
        <div className="relative">
          <select
            value={category}
            onChange={(e) => navigate({ category: e.target.value })}
            disabled={isPending}
            className={selectClass}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none select-none text-[20px]">
            expand_more
          </span>
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => navigate({ status: e.target.value })}
            disabled={isPending}
            className={selectClass}
          >
            <option value="all">All Products</option>
            <option value="below">Below Target (&lt;{thresholds.belowTarget}%)</option>
            <option value="healthy">Healthy Margin (≥{thresholds.onTarget}%)</option>
            <option value="low_stock">Low Stock (≤{thresholds.lowStock} units)</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none select-none text-[20px]">
            expand_more
          </span>
        </div>
      </div>
    </div>
  );
}
