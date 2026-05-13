import { createClient } from '@/lib/supabase/server';
import { StaffTable } from '@/components/staff/StaffTable';
import { MOCK_TRANSACTIONS, MOCK_CASHIER_NAMES } from '@hackitup/shared';
import { formatCurrency } from '@/lib/utils';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export interface StaffStat {
  cashierId: string;
  displayName: string;
  totalRevenue: number;
  txCount: number;
  itemsSold: number;
  avgPerTransaction: number;
}

interface SearchParams {
  range?: string;
}

function getDateRange(range: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();

  if (range === 'week') {
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to };
  }
  if (range === 'month') {
    const from = new Date(now);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to };
  }
  // default: today
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to };
}

async function fetchStaffStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  { from, to }: { from: string; to: string }
): Promise<StaffStat[]> {
  const { data: txs } = await supabase
    .from('transactions')
    .select('id, cashier_id, total_amount')
    .gte('created_at', from)
    .lte('created_at', to)
    .eq('status', 'completed');

  if (!txs || txs.length === 0) return [];

  const txIds = txs.map((t: { id: string }) => t.id);
  const { data: items } = await supabase
    .from('transaction_items')
    .select('transaction_id, quantity')
    .in('transaction_id', txIds);

  const byStaff: Record<string, StaffStat> = {};

  for (const tx of txs) {
    const t = tx as { id: string; cashier_id: string; total_amount: number };
    if (!byStaff[t.cashier_id]) {
      byStaff[t.cashier_id] = {
        cashierId: t.cashier_id,
        displayName: `#${t.cashier_id.slice(0, 8).toUpperCase()}`,
        totalRevenue: 0,
        txCount: 0,
        itemsSold: 0,
        avgPerTransaction: 0,
      };
    }
    byStaff[t.cashier_id].totalRevenue += t.total_amount;
    byStaff[t.cashier_id].txCount += 1;
  }

  for (const item of items ?? []) {
    const i = item as { transaction_id: string; quantity: number };
    const tx = txs.find((t: { id: string }) => t.id === i.transaction_id) as { cashier_id: string } | undefined;
    if (tx && byStaff[tx.cashier_id]) {
      byStaff[tx.cashier_id].itemsSold += i.quantity;
    }
  }

  return Object.values(byStaff).map((s) => ({
    ...s,
    avgPerTransaction: s.txCount > 0 ? s.totalRevenue / s.txCount : 0,
  }));
}

function getDemoStaffStats(range: string): StaffStat[] {
  const { from } = getDateRange(range);
  const fromDate = new Date(from);

  const filtered = MOCK_TRANSACTIONS.filter(
    (t) => t.status === 'completed' && new Date(t.created_at) >= fromDate
  );

  const byStaff: Record<string, StaffStat> = {};

  for (const tx of filtered) {
    if (!byStaff[tx.cashier_id]) {
      byStaff[tx.cashier_id] = {
        cashierId: tx.cashier_id,
        displayName: MOCK_CASHIER_NAMES[tx.cashier_id] ?? `#${tx.cashier_id.slice(0, 8).toUpperCase()}`,
        totalRevenue: 0,
        txCount: 0,
        itemsSold: 0,
        avgPerTransaction: 0,
      };
    }
    byStaff[tx.cashier_id].totalRevenue += tx.total_amount;
    byStaff[tx.cashier_id].txCount += 1;
    byStaff[tx.cashier_id].itemsSold += Math.floor(tx.total_amount / 60);
  }

  return Object.values(byStaff).map((s) => ({
    ...s,
    avgPerTransaction: s.txCount > 0 ? s.totalRevenue / s.txCount : 0,
  }));
}

const RANGE_LABELS: Record<string, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
};

export default async function StaffPage({ searchParams }: { searchParams: SearchParams }) {
  const range = searchParams.range ?? 'today';

  let staffStats: StaffStat[] = [];

  if (DEMO_MODE) {
    staffStats = getDemoStaffStats(range);
  } else {
    try {
      const supabase = await createClient();
      staffStats = await fetchStaffStats(supabase, getDateRange(range));
    } catch {
      // Graceful fallback when env vars are not yet configured
    }
  }

  const totalRevenue = staffStats.reduce((s, st) => s + st.totalRevenue, 0);
  const totalTx = staffStats.reduce((s, st) => s + st.txCount, 0);

  return (
    <div className="p-gutter-mobile md:p-margin-desktop space-y-8">
      {/* Demo mode banner */}
      {DEMO_MODE && (
        <div className="flex items-center gap-3 bg-secondary-container text-on-secondary-container px-4 py-3 rounded-lg font-body-sm text-body-sm">
          <span className="material-symbols-outlined text-sm">info</span>
          <span>
            <strong>Demo Mode</strong> — showing sample data. Add your Supabase credentials to{' '}
            <code className="font-label-mono text-label-mono bg-surface/40 px-1 rounded">.env.local</code>{' '}
            to connect a real backend.
          </span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2 tracking-tight">
            Staff Terminal
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Individual performance metrics for each cashier terminal. Track revenue, transactions, and productivity per staff member.
          </p>
        </div>

        {/* Date range pills */}
        <div className="flex gap-2 shrink-0">
          {(['today', 'week', 'month'] as const).map((r) => (
            <a
              key={r}
              href={`?range=${r}`}
              className={`px-5 py-2 rounded-full font-body-sm text-body-sm transition-colors ${
                range === r
                  ? 'bg-primary text-on-primary'
                  : 'border border-outline text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {RANGE_LABELS[r]}
            </a>
          ))}
        </div>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <p className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider mb-2">Active Terminals</p>
          <p className="font-headline-lg text-headline-lg text-on-surface font-bold">{staffStats.length}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <p className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider mb-2">Total Revenue</p>
          <p className="font-headline-lg text-headline-lg text-on-surface font-bold">{formatCurrency(totalRevenue)}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{RANGE_LABELS[range]?.toLowerCase()}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <p className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider mb-2">Total Transactions</p>
          <p className="font-headline-lg text-headline-lg text-on-surface font-bold">{totalTx.toLocaleString()}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{RANGE_LABELS[range]?.toLowerCase()}</p>
        </div>
      </div>

      {/* Staff table */}
      <StaffTable staffStats={staffStats} />

      <div className="h-8" />
    </div>
  );
}
