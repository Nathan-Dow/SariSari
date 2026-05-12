'use client';

import { useRealtimeTransactions } from '@/hooks/useRealtimeTransactions';
import type { Transaction } from '@hackitup/shared';
import { cn } from '@/lib/utils';

interface Props {
  initialData: Transaction[];
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-secondary-container text-on-secondary-container',
  processing: 'bg-tertiary-fixed text-on-tertiary-fixed',
  refunded: 'bg-error-container text-on-error-container',
  void: 'bg-surface-container-highest text-on-surface-variant',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function RecentTransactions({ initialData }: Props) {
  const transactions = useRealtimeTransactions(initialData);

  return (
    <div className="xl:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col">
      <div className="p-5 border-b border-outline-variant flex justify-between items-center">
        <h4 className="font-headline-md text-headline-md text-on-surface">Recent Transactions</h4>
        <button className="p-1 text-on-surface-variant hover:bg-surface-container-low rounded-DEFAULT transition-colors">
          <span className="material-symbols-outlined text-sm">filter_list</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container text-on-surface font-label-mono text-label-mono uppercase tracking-wider">
              <th className="px-4 py-3 border-b border-outline-variant font-medium">Time</th>
              <th className="px-4 py-3 border-b border-outline-variant font-medium">Order ID</th>
              <th className="px-4 py-3 border-b border-outline-variant font-medium text-right">Total</th>
              <th className="px-4 py-3 border-b border-outline-variant font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant font-label-mono text-label-mono">
                  No transactions today
                </td>
              </tr>
            ) : (
              transactions.slice(0, 8).map((tx, i) => (
                <tr
                  key={tx.id}
                  className={cn(
                    'hover:bg-surface-container-low transition-colors border-b border-outline-variant last:border-0',
                    i % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-bright'
                  )}
                >
                  <td className="px-4 py-3 text-on-surface-variant font-label-mono text-label-mono">
                    {formatTime(tx.created_at)}
                  </td>
                  <td className="px-4 py-3 text-on-surface font-medium">
                    #{tx.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-on-surface font-medium text-right">
                    ${tx.total_amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-DEFAULT font-label-mono text-label-mono text-[11px] uppercase tracking-wide',
                        STATUS_STYLES[tx.status] ?? STATUS_STYLES['void']
                      )}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
