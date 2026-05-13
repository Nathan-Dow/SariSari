import { createClient } from '@/lib/supabase/server';
import { ProductTable } from '@/components/catalog/ProductTable';
import { AddProductButton } from '@/components/catalog/AddProductButton';
import { CatalogHealthCard } from '@/components/catalog/CatalogHealthCard';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { type Product, MOCK_PRODUCTS } from '@hackitup/shared';
import { calcMargin } from '@/lib/utils';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const PAGE_SIZE = 10;

interface SearchParams {
  page?: string;
  q?: string;
  category?: string;
  status?: string;
  onTarget?: string;
  belowTarget?: string;
  lowStock?: string;
}

async function fetchProducts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  {
    page,
    q,
    category,
    status,
    belowTarget,
    onTargetThreshold,
    lowStockThreshold,
  }: {
    page: number;
    q: string;
    category: string;
    status: string;
    belowTarget: number;
    onTargetThreshold: number;
    lowStockThreshold: number;
  }
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
  if (status === 'low_stock') {
    query = query.lte('stock', lowStockThreshold);
  }

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, count } = await query;
  let products = (data ?? []) as Product[];

  if (status === 'below') {
    products = products.filter((p) => {
      const m = calcMargin(p.price, p.cost);
      return m !== null && m < belowTarget;
    });
  } else if (status === 'healthy') {
    products = products.filter((p) => {
      const m = calcMargin(p.price, p.cost);
      return m !== null && m >= onTargetThreshold;
    });
  }

  return { products, totalCount: count ?? 0 };
}

async function fetchMarginHealth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  onTargetThreshold: number,
  belowTarget: number
) {
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
    if (m >= onTargetThreshold) onTarget++;
    else if (m < belowTarget) actionRequired++;
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

async function fetchLowStockCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lowStockThreshold: number
) {
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .lte('stock', lowStockThreshold);
  return count ?? 0;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = parseInt(searchParams.page ?? '1', 10);
  const q = searchParams.q ?? '';
  const category = searchParams.category ?? 'all';
  const status = searchParams.status ?? 'all';

  const onTargetThreshold = Math.min(100, Math.max(0, parseFloat(searchParams.onTarget ?? '35')));
  const belowTarget = Math.min(100, Math.max(0, parseFloat(searchParams.belowTarget ?? '25')));
  const lowStockThreshold = Math.max(0, parseInt(searchParams.lowStock ?? '10', 10));

  const thresholds = { onTarget: onTargetThreshold, belowTarget, lowStock: lowStockThreshold };

  // Build a plain-object snapshot of current params so the health card can update the URL
  const currentParams: Record<string, string> = {};
  if (q) currentParams.q = q;
  if (category !== 'all') currentParams.category = category;
  if (status !== 'all') currentParams.status = status;
  currentParams.onTarget = String(onTargetThreshold);
  currentParams.belowTarget = String(belowTarget);
  currentParams.lowStock = String(lowStockThreshold);

  // Query string for pagination links (all current filters, no page key)
  const pageParamBase = new URLSearchParams(currentParams).toString();

  let products: Product[] = [];
  let totalCount = 0;
  let health = { avgMargin: 0, onTarget: 0, actionRequired: 0, total: 0 };
  let categories: string[] = [];
  let lowStockCount = 0;

  if (DEMO_MODE) {
    let filtered = MOCK_PRODUCTS.filter((p) => {
      if (!p.is_active) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !p.sku.toLowerCase().includes(q.toLowerCase())) return false;
      if (category && category !== 'all' && p.category !== category) return false;
      if (status === 'low_stock') return p.stock <= lowStockThreshold;
      if (status === 'below') { const m = calcMargin(p.price, p.cost); return m !== null && m < belowTarget; }
      if (status === 'healthy') { const m = calcMargin(p.price, p.cost); return m !== null && m >= onTargetThreshold; }
      return true;
    });
    totalCount = filtered.length;
    products = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const allActive = MOCK_PRODUCTS.filter((p) => p.is_active && p.cost != null);
    let totalMarginSum = 0;
    for (const p of allActive) {
      const m = calcMargin(p.price, p.cost);
      if (m === null) continue;
      totalMarginSum += m;
      if (m >= onTargetThreshold) health.onTarget++;
      else if (m < belowTarget) health.actionRequired++;
    }
    health.avgMargin = allActive.length ? totalMarginSum / allActive.length : 0;
    health.total = allActive.length;

    categories = [...new Set(MOCK_PRODUCTS.filter((p) => p.category).map((p) => p.category as string))].sort();
    lowStockCount = MOCK_PRODUCTS.filter((p) => p.is_active && p.stock <= lowStockThreshold).length;
  } else {
    try {
      const supabase = await createClient();
      [{ products, totalCount }, health, categories, lowStockCount] = await Promise.all([
        fetchProducts(supabase, { page, q, category, status, belowTarget, onTargetThreshold, lowStockThreshold }),
        fetchMarginHealth(supabase, onTargetThreshold, belowTarget),
        fetchCategories(supabase),
        fetchLowStockCount(supabase, lowStockThreshold),
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2 tracking-tight">
            Product Catalog
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Manage inventory levels, adjust pricing strategies, and monitor product profitability all in one place.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button className="h-[48px] px-6 rounded-full border border-outline text-primary font-body-sm text-body-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Report
          </button>
          <AddProductButton />
        </div>
      </div>

      {/* Bento Grid: Filter + Health Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Search & Filter */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-headline-md text-headline-md text-on-surface">Catalog Search &amp; Filter</h2>
          <CatalogFilters
            q={q}
            category={category}
            status={status}
            categories={categories}
            thresholds={thresholds}
          />
        </div>

        {/* Health Summary — client component with editable thresholds */}
        <CatalogHealthCard
          health={health}
          lowStockCount={lowStockCount}
          thresholds={thresholds}
          currentParams={currentParams}
        />
      </div>

      {/* Product Table */}
      <ProductTable
        initialProducts={products}
        totalCount={totalCount}
        page={page}
        pageParamBase={pageParamBase}
        belowTarget={belowTarget}
        lowStock={lowStockThreshold}
      />

      <div className="h-8" />
    </div>
  );
}
