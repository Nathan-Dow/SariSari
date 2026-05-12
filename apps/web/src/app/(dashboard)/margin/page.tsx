import { createClient } from '@/lib/supabase/server';
import { MarginTable } from '@/components/margin/MarginTable';
import { type Product, MOCK_PRODUCTS } from '@hackitup/shared';
import { calcMargin } from '@/lib/utils';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const PAGE_SIZE = 10;

interface SearchParams {
  page?: string;
  q?: string;
  category?: string;
  status?: string;
}

async function fetchProducts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  { page, q, category, status }: { page: number; q: string; category: string; status: string }
) {
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('name');

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`);
  }
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, count } = await query;
  let products = (data ?? []) as Product[];

  if (status === 'below') {
    products = products.filter((p) => {
      const m = calcMargin(p.price, p.cost);
      return m !== null && m < 25;
    });
  } else if (status === 'healthy') {
    products = products.filter((p) => {
      const m = calcMargin(p.price, p.cost);
      return m !== null && m >= 35;
    });
  }

  return { products, totalCount: count ?? 0 };
}

async function fetchMarginHealth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from('products')
    .select('price, cost')
    .eq('is_active', true)
    .not('cost', 'is', null);

  const products = (data ?? []) as { price: number; cost: number }[];
  let onTarget = 0;
  let actionRequired = 0;
  let totalMargin = 0;

  for (const p of products) {
    const m = calcMargin(p.price, p.cost);
    if (m === null) continue;
    totalMargin += m;
    if (m >= 35) onTarget++;
    else if (m < 25) actionRequired++;
  }

  return {
    avgMargin: products.length ? totalMargin / products.length : 0,
    onTarget,
    actionRequired,
    total: products.length,
  };
}

async function fetchCategories(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from('products')
    .select('category')
    .eq('is_active', true)
    .not('category', 'is', null);
  const cats = [...new Set((data ?? []).map((r: { category: string }) => r.category))].sort();
  return cats;
}

export default async function MarginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = parseInt(searchParams.page ?? '1', 10);
  const q = searchParams.q ?? '';
  const category = searchParams.category ?? 'all';
  const status = searchParams.status ?? 'all';

  let products: Product[] = [];
  let totalCount = 0;
  let health = { avgMargin: 0, onTarget: 0, actionRequired: 0, total: 0 };
  let categories: string[] = [];

  if (DEMO_MODE) {
    // Filter + paginate mock data in-process
    let filtered = MOCK_PRODUCTS.filter((p) => {
      if (!p.is_active) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !p.sku.toLowerCase().includes(q.toLowerCase())) return false;
      if (category && category !== 'all' && p.category !== category) return false;
      if (status === 'below') { const m = calcMargin(p.price, p.cost); return m !== null && m < 25; }
      if (status === 'healthy') { const m = calcMargin(p.price, p.cost); return m !== null && m >= 35; }
      return true;
    });
    totalCount = filtered.length;
    products = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Compute health stats from full mock product set
    const allActive = MOCK_PRODUCTS.filter((p) => p.is_active && p.cost != null);
    let totalMarginSum = 0;
    for (const p of allActive) {
      const m = calcMargin(p.price, p.cost);
      if (m === null) continue;
      totalMarginSum += m;
      if (m >= 35) health.onTarget++;
      else if (m < 25) health.actionRequired++;
    }
    health.avgMargin = allActive.length ? totalMarginSum / allActive.length : 0;
    health.total = allActive.length;

    categories = [...new Set(MOCK_PRODUCTS.filter((p) => p.category).map((p) => p.category as string))].sort();
  } else {
    try {
      const supabase = await createClient();
      [{ products, totalCount }, health, categories] = await Promise.all([
        fetchProducts(supabase, { page, q, category, status }),
        fetchMarginHealth(supabase),
        fetchCategories(supabase),
      ]);
    } catch {
      // Graceful fallback when env vars are not yet configured
    }
  }

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
            Margin Control Panel
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Monitor product profitability, adjust pricing strategies, and apply category-wide margin
            updates to ensure target metrics are met.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button className="h-[48px] px-6 rounded-full border border-outline text-primary font-body-sm text-body-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Report
          </button>
          <button className="h-[48px] px-6 rounded-full bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">edit_document</span>
            Bulk Margin Update
          </button>
        </div>
      </div>

      {/* Bento Grid: Filter + Health Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Search & Filter */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-headline-md text-headline-md text-on-surface">Catalog Search &amp; Filter</h2>
          <form method="GET" className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                name="q"
                defaultValue={q}
                type="text"
                placeholder="Search by SKU, Name, or Barcode…"
                className="w-full pl-10 pr-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm transition-all outline-none"
              />
            </div>
            <select
              name="category"
              defaultValue={category}
              className="w-full sm:w-48 px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm appearance-none outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status}
              className="w-full sm:w-56 px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm appearance-none outline-none cursor-pointer"
            >
              <option value="all">Status: All Products</option>
              <option value="below">Status: Below Target Margin</option>
              <option value="healthy">Status: Healthy Margin</option>
            </select>
            <button type="submit" className="hidden" aria-hidden />
          </form>
        </div>

        {/* Margin Health Summary */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-1 uppercase tracking-wider">
              Overall Category Health
            </h3>
            <div className="font-headline-lg text-headline-lg text-on-surface flex items-baseline gap-2">
              {health.avgMargin.toFixed(1)}%
              <span className="font-body-sm text-body-sm text-outline font-normal">Avg Margin</span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                <div className="w-2 h-2 rounded-full bg-primary" />
                On Target (&gt;35%)
              </span>
              <span className="font-label-mono text-label-mono text-on-surface">
                {health.onTarget.toLocaleString()} items
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-error font-body-sm text-body-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-error" />
                Action Required (&lt;25%)
              </span>
              <span className="font-label-mono text-label-mono text-error font-bold">
                {health.actionRequired} items
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Table — client component (inline edit state) */}
      <MarginTable initialProducts={products} totalCount={totalCount} page={page} />

      <div className="h-8" />
    </div>
  );
}
