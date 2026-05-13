'use client';

import { useState } from 'react';
import type { StaffStat } from '@/app/(dashboard)/staff/page';
import { cn, formatCurrency } from '@/lib/utils';

interface StaffTableProps {
  staffStats: StaffStat[];
}

type SortKey = 'totalRevenue' | 'txCount' | 'itemsSold' | 'avgPerTransaction';

export function StaffTable({ staffStats }: StaffTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalRevenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...staffStats].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === 'asc' ? diff : -diff;
  });

  const maxRevenue = Math.max(...staffStats.map((s) => s.totalRevenue), 1);

  if (staffStats.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col items-center justify-center py-20 text-on-surface-variant">
        <span className="material-symbols-outlined text-[48px] mb-4">people</span>
        <p className="font-headline-md text-headline-md text-on-surface">No activity found</p>
        <p className="font-body-sm text-body-sm mt-1">No completed transactions recorded for this period.</p>
      </div>
    );
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) {
      return <span className="material-symbols-outlined text-[14px] text-outline ml-1 opacity-40">unfold_more</span>;
    }
    return (
      <span className="material-symbols-outlined text-[14px] text-primary ml-1">
        {sortDir === 'asc' ? 'expand_less' : 'expand_more'}
      </span>
    );
  }

  function SortableHeader({ col, label, className }: { col: SortKey; label: string; className?: string }) {
    return (
      <th
        className={cn('p-4 font-body-sm text-body-sm font-semibold text-on-surface cursor-pointer hover:bg-surface-container-high transition-colors select-none', className)}
        onClick={() => toggleSort(col)}
      >
        <span className="flex items-center gap-0.5 justify-end">
          {label}
          <SortIcon col={col} />
        </span>
      </th>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-surface-container-highest border-b border-outline-variant">
              <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface">Staff Terminal</th>
              <SortableHeader col="totalRevenue" label="Revenue" className="text-right w-36" />
              <SortableHeader col="txCount" label="Transactions" className="text-right w-32" />
              <SortableHeader col="itemsSold" label="Items Sold" className="text-right w-28" />
              <SortableHeader col="avgPerTransaction" label="Avg / Transaction" className="text-right w-40" />
              <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface text-right w-40">Performance</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm text-on-surface-variant">
            {sorted.map((stat, i) => (
              <tr
                key={stat.cashierId}
                className={cn(
                  'border-b border-outline-variant transition-colors',
                  i % 2 === 0 ? 'bg-surface hover:bg-surface-container-low' : 'bg-surface-bright hover:bg-surface-container-low'
                )}
              >
                {/* Staff identity */}
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-mono text-label-mono font-bold shrink-0">
                      {stat.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-on-surface">{stat.displayName}</p>
                      <p className="text-xs text-outline font-label-mono">{`#${stat.cashierId.slice(0, 8).toUpperCase()}`}</p>
                    </div>
                  </div>
                </td>

                {/* Revenue */}
                <td className="p-4 text-right font-label-mono text-label-mono text-on-surface font-bold">
                  {formatCurrency(stat.totalRevenue)}
                </td>

                {/* Transaction count */}
                <td className="p-4 text-right font-label-mono text-label-mono text-on-surface">
                  {stat.txCount.toLocaleString()}
                </td>

                {/* Items sold */}
                <td className="p-4 text-right font-label-mono text-label-mono text-on-surface">
                  {stat.itemsSold.toLocaleString()}
                </td>

                {/* Avg per transaction */}
                <td className="p-4 text-right font-label-mono text-label-mono text-on-surface">
                  {formatCurrency(stat.avgPerTransaction)}
                </td>

                {/* Performance bar */}
                <td className="p-4">
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-label-mono text-label-mono text-on-surface-variant text-xs">
                      {((stat.totalRevenue / maxRevenue) * 100).toFixed(0)}%
                    </span>
                    <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${(stat.totalRevenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
