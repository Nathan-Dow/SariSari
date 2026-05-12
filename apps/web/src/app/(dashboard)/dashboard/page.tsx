import { createClient } from '@/lib/supabase/server';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { RevenueChart } from '@/components/charts/RevenueChart';
import {
  type Transaction,
  MOCK_TRANSACTIONS,
  MOCK_KPIS,
  MOCK_TOP_MOVERS,
} from '@hackitup/shared';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// ── Live data fetchers ────────────────────────────────────────────────────────
async function fetchKpis(supabase: Awaited<ReturnType<typeof createClient>>) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [revenueRes, txCountRes, marginRes, lowStockRes] = await Promise.all([
    supabase.from('transactions').select('total_amount').gte('created_at', todayIso).eq('status', 'completed'),
    supabase.from('transactions').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
    supabase.from('products').select('price, cost').eq('is_active', true).not('cost', 'is', null),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true).lte('stock', 10),
  ]);

  const totalRevenue = (revenueRes.data ?? []).reduce(
    (sum, r: { total_amount: number }) => sum + r.total_amount, 0
  );
  const products = (marginRes.data ?? []) as { price: number; cost: number }[];
  const avgMargin = products.length
    ? products.reduce((sum, p) => sum + ((p.price - p.cost) / p.price) * 100, 0) / products.length
    : 0;

  return {
    totalRevenue,
    txCount:       txCountRes.count ?? 0,
    avgMargin,
    lowStockCount: lowStockRes.count ?? 0,
  };
}

async function fetchTopMovers(supabase: Awaited<ReturnType<typeof createClient>>) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from('transaction_items')
    .select('quantity, product:products(name)')
    .gte('created_at', today.toISOString());

  if (!data) return [];
  const totals: Record<string, { name: string; qty: number }> = {};
  for (const item of data as { quantity: number; product: { name: string } | null }[]) {
    if (!item.product) continue;
    const { name } = item.product;
    totals[name] = { name, qty: (totals[name]?.qty ?? 0) + item.quantity };
  }
  return Object.values(totals).sort((a, b) => b.qty - a.qty).slice(0, 4);
}

async function fetchInitialTransactions(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from('transactions').select('*').order('created_at', { ascending: false }).limit(8);
  return (data ?? []) as Transaction[];
}

// ─────────────────────────────────────────────────────────────────────────────
const BAR_COLORS = ['bg-primary', 'bg-secondary', 'bg-tertiary-fixed-dim', 'bg-outline-variant'];

export default async function DashboardPage() {
  // ── Data resolution: demo → mock, live → Supabase ────────────────────────
  let kpis                = MOCK_KPIS;
  let topMovers           = MOCK_TOP_MOVERS;
  let initialTransactions = MOCK_TRANSACTIONS as Transaction[];

  if (!DEMO_MODE) {
    try {
      const supabase = await createClient();
      [kpis, topMovers, initialTransactions] = await Promise.all([
        fetchKpis(supabase),
        fetchTopMovers(supabase),
        fetchInitialTransactions(supabase),
      ]);
    } catch {
      // Credentials not yet configured — keep mock data as fallback.
    }
  }

  const maxQty = topMovers[0]?.qty ?? 1;

  return (
    <div className="p-margin-mobile md:p-margin-desktop">
      {/* Demo mode banner */}
      {DEMO_MODE && (
        <div className="mb-6 flex items-center gap-3 bg-secondary-container text-on-secondary-container px-4 py-3 rounded-lg font-body-sm text-body-sm">
          <span className="material-symbols-outlined text-sm">info</span>
          <span>
            <strong>Demo Mode</strong> — showing sample data. Add your Supabase credentials to{' '}
            <code className="font-label-mono text-label-mono bg-surface/40 px-1 rounded">.env.local</code>{' '}
            to connect a real backend.
          </span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Today&apos;s Overview</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Real-time metrics for current shift.
          </p>
        </div>
        <div className="flex items-center bg-surface-container border border-outline-variant rounded-DEFAULT h-10 px-3 cursor-pointer hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">calendar_today</span>
          <span className="font-label-mono text-label-mono text-on-surface">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-sm ml-2">arrow_drop_down</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter-mobile md:gap-gutter-desktop mb-8">
        {/* Total Revenue */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-wider">Total Revenue</span>
            <div className="bg-primary-container text-on-primary-container p-1.5 rounded-DEFAULT">
              <span className="material-symbols-outlined text-sm">attach_money</span>
            </div>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-on-surface">
              ${kpis.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center mt-2 font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-secondary text-[16px] mr-1">trending_up</span>
              <span className="text-secondary font-medium">+8.4%</span>
              <span className="text-on-surface-variant ml-2">vs yesterday</span>
            </div>
          </div>
        </div>

        {/* Avg Margin */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-wider">Avg Margin</span>
            <div className="bg-secondary-container text-on-secondary-container p-1.5 rounded-DEFAULT">
              <span className="material-symbols-outlined text-sm">pie_chart</span>
            </div>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-on-surface">
              {kpis.avgMargin.toFixed(1)}%
            </div>
            <div className="flex items-center mt-2 font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-secondary text-[16px] mr-1">trending_up</span>
              <span className="text-secondary font-medium">+1.2%</span>
              <span className="text-on-surface-variant ml-2">vs yesterday</span>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-wider">Transactions</span>
            <div className="bg-surface-container-high text-on-surface p-1.5 rounded-DEFAULT">
              <span className="material-symbols-outlined text-sm">receipt_long</span>
            </div>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-on-surface">{kpis.txCount}</div>
            <div className="flex items-center mt-2 font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-error text-[16px] mr-1">trending_down</span>
              <span className="text-error font-medium">-3.1%</span>
              <span className="text-on-surface-variant ml-2">vs yesterday</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-surface-container-lowest border border-error-container rounded-lg p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-error-container rounded-bl-full opacity-20 pointer-events-none" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-wider">Low Stock Alerts</span>
            <div className="bg-error-container text-on-error-container p-1.5 rounded-DEFAULT">
              <span className="material-symbols-outlined text-sm">warning</span>
            </div>
          </div>
          <div className="relative z-10">
            <div className="font-headline-lg text-headline-lg text-error">{kpis.lowStockCount}</div>
            <div className="flex items-center mt-2 font-body-sm text-body-sm">
              <span className="text-error font-medium">{kpis.lowStockCount > 0 ? 'Action Required' : 'All Clear'}</span>
              <span className="text-on-surface-variant ml-2">SKUs below minimum</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-mobile md:gap-gutter-desktop mb-8">
        <RevenueChart />

        {/* Top Movers */}
        <div className="xl:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-headline-md text-headline-md text-on-surface">Top Movers</h4>
            <span className="font-label-mono text-label-mono text-secondary cursor-pointer hover:underline">View All</span>
          </div>
          <div className="flex-1 flex flex-col space-y-4 justify-center">
            {topMovers.map((mover, i) => (
              <div key={mover.name}>
                <div className="flex justify-between text-body-sm font-body-sm mb-1">
                  <span className="text-on-surface font-medium truncate pr-2">{mover.name}</span>
                  <span className="text-on-surface-variant font-label-mono text-label-mono shrink-0">
                    {mover.qty} units
                  </span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                  <div
                    className={`${BAR_COLORS[i] ?? 'bg-outline-variant'} h-1.5 rounded-full`}
                    style={{ width: `${(mover.qty / maxQty) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-mobile md:gap-gutter-desktop">
        <RecentTransactions initialData={initialTransactions} />

        {/* Terminal Activity */}
        <div className="xl:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col">
          <div className="p-5 border-b border-outline-variant flex justify-between items-center">
            <h4 className="font-headline-md text-headline-md text-on-surface">Terminal Activity</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface font-label-mono text-label-mono uppercase tracking-wider">
                  <th className="px-4 py-3 border-b border-outline-variant font-medium">Staff ID</th>
                  <th className="px-4 py-3 border-b border-outline-variant font-medium text-right">Sales Vol</th>
                  <th className="px-4 py-3 border-b border-outline-variant font-medium text-right">Avg/Txn</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {[
                  { initials: 'JD', name: 'J. Doe',   vol: 12450, avg: 85.20, bg: 'bg-primary-container text-on-primary-container' },
                  { initials: 'AS', name: 'A. Smith',  vol: 9820,  avg: 62.15, bg: 'bg-secondary-container text-on-secondary-container' },
                  { initials: 'MK', name: 'M. Klein',  vol: 7105,  avg: 45.90, bg: 'bg-tertiary-fixed text-on-tertiary-fixed' },
                ].map((s, i) => (
                  <tr
                    key={s.name}
                    className={`${i % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-bright'} hover:bg-surface-container-low transition-colors border-b border-outline-variant last:border-0`}
                  >
                    <td className="px-4 py-3 text-on-surface font-medium flex items-center">
                      <div className={`w-6 h-6 rounded-full ${s.bg} flex items-center justify-center font-label-mono text-[10px] mr-3`}>
                        {s.initials}
                      </div>
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-on-surface font-medium text-right">
                      ${s.vol.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-right">
                      ${s.avg.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
