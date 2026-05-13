'use client';

import { Fragment, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@hackitup/shared';
import { cn, calcMargin, priceFromMargin } from '@/lib/utils';
import { ProductDrawer } from './ProductDrawer';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const PAGE_SIZE = 10;

interface ProductTableProps {
  initialProducts: Product[];
  totalCount: number;
  page: number;
  pageParamBase: string;
  belowTarget?: number;
  lowStock?: number;
}

interface EditingState {
  productId: string;
  marginInput: string;
  priceInput: string;
}

interface AdjustState {
  delta: number;
  reason: string;
  note: string;
}

function MarginChip({ margin, belowTarget }: { margin: number | null; belowTarget: number }) {
  if (margin === null) {
    return (
      <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-1 rounded-md font-label-mono text-label-mono text-on-surface-variant">
        N/A
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md font-label-mono text-label-mono font-bold',
        margin < belowTarget
          ? 'bg-error-container text-on-error-container'
          : 'bg-surface-container text-on-surface'
      )}
    >
      {margin.toFixed(1)}%
    </span>
  );
}

export function ProductTable({ initialProducts, totalCount, page, pageParamBase, belowTarget = 25, lowStock = 10 }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const pageHref = (p: number) => `?${pageParamBase}&page=${p}`;
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustState, setAdjustState] = useState<AdjustState>({ delta: 0, reason: 'restock', note: '' });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ── Price/margin edit logic (identical to MarginTable) ─────────────────────
  const startEdit = (product: Product) => {
    const margin = calcMargin(product.price, product.cost);
    setEditing({
      productId: product.id,
      marginInput: margin !== null ? margin.toFixed(1) : '',
      priceInput: product.price.toFixed(2),
    });
  };

  const cancelEdit = () => setEditing(null);

  const handleMarginChange = (value: string) => {
    if (!editing) return;
    const pct = parseFloat(value);
    const product = products.find((p) => p.id === editing.productId);
    if (product?.cost && !isNaN(pct) && pct > 0 && pct < 100) {
      const newPrice = priceFromMargin(product.cost, pct);
      setEditing({ ...editing, marginInput: value, priceInput: newPrice.toFixed(2) });
    } else {
      setEditing({ ...editing, marginInput: value });
    }
  };

  const handlePriceChange = (value: string) => {
    if (!editing) return;
    const price = parseFloat(value);
    const product = products.find((p) => p.id === editing.productId);
    if (product?.cost && !isNaN(price) && price > 0) {
      const newMargin = calcMargin(price, product.cost);
      setEditing({
        ...editing,
        priceInput: value,
        marginInput: newMargin !== null ? newMargin.toFixed(1) : '',
      });
    } else {
      setEditing({ ...editing, priceInput: value });
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    const newPrice = parseFloat(editing.priceInput);
    if (isNaN(newPrice) || newPrice <= 0) return;

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({ price: newPrice })
      .eq('id', editing.productId);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editing.productId ? { ...p, price: newPrice } : p))
      );
      setEditing(null);
    }
    setSaving(false);
  };

  // ── Stock adjustment logic ─────────────────────────────────────────────────
  const openAdjust = (productId: string) => {
    setAdjusting(productId);
    setAdjustState({ delta: 0, reason: 'restock', note: '' });
  };

  const applyAdjustment = async () => {
    if (!adjusting || adjustState.delta === 0) return;
    const product = products.find((p) => p.id === adjusting);
    if (!product) return;

    setSaving(true);

    if (DEMO_MODE) {
      setProducts((prev) =>
        prev.map((p) => p.id === adjusting ? { ...p, stock: p.stock + adjustState.delta } : p)
      );
      setAdjusting(null);
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const newStock = product.stock + adjustState.delta;

    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', adjusting);

    if (!updateError) {
      // TODO: wrap in a DB function/transaction for atomicity
      await supabase.from('inventory_logs').insert({
        product_id: adjusting,
        delta: adjustState.delta,
        reason: adjustState.reason,
        note: adjustState.note || null,
        performed_by: null,
      });

      setProducts((prev) =>
        prev.map((p) => p.id === adjusting ? { ...p, stock: newStock } : p)
      );
      setAdjusting(null);
    }
    setSaving(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <>
      <ProductDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} lowStock={lowStock} />

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-container-highest border-b border-outline-variant">
                <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface w-12 text-center">
                  <input type="checkbox" className="rounded border-outline text-primary focus:ring-primary h-4 w-4" />
                </th>
                <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface w-32">SKU</th>
                <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface">Product Detail</th>
                <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface text-right w-24">Stock</th>
                <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface text-right w-28">Unit Cost</th>
                <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface text-right w-32">Retail Price</th>
                <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface text-right w-36">Margin</th>
                <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface text-center w-44">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-surface-variant">
              {products.map((product, i) => {
                const margin = calcMargin(product.price, product.cost);
                const isBelowTarget = margin !== null && margin < belowTarget;
                const isLowStock = product.stock <= lowStock;
                const isEditing = editing?.productId === product.id;
                const isAdjusting = adjusting === product.id;

                if (isEditing) {
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-outline-variant bg-primary-fixed-dim/10 ring-1 ring-inset ring-primary transition-all"
                    >
                      <td className="p-4 text-center">
                        <input type="checkbox" disabled className="rounded border-outline h-4 w-4 opacity-40" />
                      </td>
                      <td className="p-4 font-label-mono text-label-mono text-primary font-medium tracking-tight opacity-70">
                        {product.sku}
                      </td>
                      <td className="p-4 opacity-70">
                        <div className="font-medium text-on-surface">{product.name}</div>
                        {product.category && (
                          <div className="text-outline text-xs mt-0.5">{product.category}</div>
                        )}
                      </td>
                      <td className="p-4 text-right font-label-mono text-label-mono opacity-70">
                        {product.stock}
                      </td>
                      <td className="p-4 text-right font-label-mono text-label-mono opacity-70">
                        {product.cost != null ? `$${product.cost.toFixed(2)}` : '—'}
                      </td>
                      {/* Price edit cell */}
                      <td className="p-4 bg-surface-container-lowest shadow-sm relative z-10">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-outline font-label-mono text-label-mono">$</span>
                          <input
                            type="text"
                            value={editing.priceInput}
                            onChange={(e) => handlePriceChange(e.target.value)}
                            title="Auto-calculated from cost and target margin"
                            className="w-20 text-right px-2 py-1.5 border-b border-outline-variant bg-surface-container-lowest font-label-mono text-label-mono font-bold text-primary focus:outline-none focus:border-primary"
                          />
                        </div>
                      </td>
                      {/* Margin edit cell */}
                      <td className="p-4 bg-surface-container-lowest border-l border-outline-variant shadow-sm relative z-10">
                        <div className="flex items-center justify-end gap-1 relative">
                          <input
                            type="text"
                            value={editing.marginInput}
                            onChange={(e) => handleMarginChange(e.target.value)}
                            className="w-16 text-right px-2 py-1.5 border-b-2 border-primary bg-surface font-label-mono text-label-mono text-on-surface focus:outline-none"
                          />
                          <span className="text-on-surface-variant font-label-mono text-label-mono">%</span>
                          <span className="absolute -top-4 right-0 text-[10px] text-primary font-semibold whitespace-nowrap">
                            Editing Margin
                          </span>
                        </div>
                      </td>
                      {/* Save/Cancel */}
                      <td className="p-4 text-center bg-surface-container-lowest border-r border-outline-variant shadow-sm relative z-10">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={saveEdit}
                            disabled={saving}
                            title="Save changes"
                            className="bg-primary text-on-primary p-1.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">check</span>
                          </button>
                          <button
                            onClick={cancelEdit}
                            title="Cancel"
                            className="text-outline hover:text-error hover:bg-error-container/30 p-1.5 rounded-md transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <Fragment key={product.id}>
                    <tr
                      onClick={() => !isAdjusting && setSelectedProduct(product)}
                      className={cn(
                        'border-b border-outline-variant transition-colors group cursor-pointer',
                        i % 2 === 0 ? 'bg-surface hover:bg-surface-container-low' : 'bg-surface-bright hover:bg-surface-container-low',
                        isAdjusting && 'bg-tertiary-fixed/10 ring-1 ring-inset ring-tertiary',
                        isBelowTarget && !isAdjusting && '[box-shadow:inset_3px_0_0_var(--md-sys-color-error,#B3261E)]'
                      )}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-outline text-primary focus:ring-primary h-4 w-4" />
                      </td>
                      <td className="p-4 font-label-mono text-label-mono text-primary font-medium tracking-tight">
                        {product.sku}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-on-surface flex items-center gap-1.5">
                          <span>{product.name}</span>
                          {isBelowTarget && (
                            <span
                              className="material-symbols-outlined text-error text-[16px] shrink-0"
                              title="Margin below 25% threshold"
                            >
                              warning
                            </span>
                          )}
                        </div>
                        {product.category && (
                          <div className="text-outline text-xs mt-0.5">{product.category}</div>
                        )}
                      </td>
                      <td className="p-4 text-right font-label-mono text-label-mono">
                        <span className={cn('flex items-center justify-end gap-1', isLowStock && 'text-error font-bold')}>
                          {isLowStock && (
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                          )}
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4 text-right font-label-mono text-label-mono">
                        {product.cost != null ? `$${product.cost.toFixed(2)}` : '—'}
                      </td>
                      <td className="p-4 text-right font-label-mono text-label-mono font-bold text-on-surface">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <MarginChip margin={margin} belowTarget={belowTarget} />
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => startEdit(product)}
                            className="font-body-sm text-body-sm text-primary hover:underline font-medium transition-colors"
                          >
                            Edit Price
                          </button>
                          <span className="text-outline-variant text-xs">|</span>
                          <button
                            onClick={() => isAdjusting ? setAdjusting(null) : openAdjust(product.id)}
                            className={cn(
                              'font-body-sm text-body-sm font-medium transition-colors',
                              isAdjusting
                                ? 'text-tertiary hover:underline'
                                : 'text-on-surface-variant hover:text-on-surface hover:underline'
                            )}
                          >
                            {isAdjusting ? 'Close' : 'Adjust Stock'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Stock adjust sub-row */}
                    {isAdjusting && (
                      <tr className="border-b border-outline-variant bg-tertiary-fixed/10">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="font-body-sm text-body-sm text-on-surface font-medium">
                              Adjust stock for <strong>{product.name}</strong>
                              <span className="ml-2 font-label-mono text-label-mono text-on-surface-variant">
                                (current: {product.stock})
                              </span>
                            </span>
                            {/* Delta stepper */}
                            <div className="flex items-center gap-1 bg-surface border border-outline rounded-lg overflow-hidden">
                              <button
                                onClick={() => setAdjustState((s) => ({ ...s, delta: s.delta - 1 }))}
                                className="px-3 py-2 font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                value={adjustState.delta}
                                onChange={(e) => setAdjustState((s) => ({ ...s, delta: parseInt(e.target.value) || 0 }))}
                                className="w-16 text-center py-2 bg-surface font-label-mono text-label-mono text-on-surface focus:outline-none border-x border-outline"
                              />
                              <button
                                onClick={() => setAdjustState((s) => ({ ...s, delta: s.delta + 1 }))}
                                className="px-3 py-2 font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                              >
                                +
                              </button>
                            </div>
                            {/* Reason */}
                            <select
                              value={adjustState.reason}
                              onChange={(e) => setAdjustState((s) => ({ ...s, reason: e.target.value }))}
                              className="px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface font-body-sm text-body-sm appearance-none outline-none cursor-pointer focus:border-primary"
                            >
                              <option value="restock">Restock</option>
                              <option value="adjustment">Adjustment</option>
                              <option value="waste">Waste</option>
                            </select>
                            {/* Note */}
                            <input
                              type="text"
                              placeholder="Optional note…"
                              value={adjustState.note}
                              onChange={(e) => setAdjustState((s) => ({ ...s, note: e.target.value }))}
                              className="flex-1 min-w-[140px] px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                            {/* Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={applyAdjustment}
                                disabled={saving || adjustState.delta === 0}
                                className="px-4 py-2 bg-primary text-on-primary rounded-full font-body-sm text-body-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                              >
                                Apply
                              </button>
                              <button
                                onClick={() => setAdjusting(null)}
                                className="px-4 py-2 border border-outline text-on-surface-variant rounded-full font-body-sm text-body-sm hover:bg-surface-container-low transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-on-surface-variant font-label-mono text-label-mono">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-surface border-t border-outline-variant p-4 flex items-center justify-between">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()} items
          </span>
          <div className="flex gap-2">
            <a
              href={pageHref(Math.max(1, page - 1))}
              className={cn(
                'p-1 rounded text-outline hover:bg-surface-container-high transition-colors',
                page <= 1 && 'opacity-50 pointer-events-none'
              )}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </a>
            <a
              href={pageHref(Math.min(totalPages, page + 1))}
              className={cn(
                'p-1 rounded text-on-surface hover:bg-surface-container-high transition-colors',
                page >= totalPages && 'opacity-50 pointer-events-none'
              )}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
