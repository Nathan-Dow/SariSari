'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@hackitup/shared';
import { cn, calcMargin, priceFromMargin } from '@/lib/utils';

interface MarginTableProps {
  initialProducts: Product[];
  totalCount: number;
  page: number;
}

const PAGE_SIZE = 10;

function MarginChip({ margin }: { margin: number | null }) {
  if (margin === null) {
    return (
      <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-1 rounded-md font-label-mono text-label-mono text-on-surface-variant">
        N/A
      </span>
    );
  }
  const isBelowTarget = margin < 25;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md font-label-mono text-label-mono font-bold',
        isBelowTarget
          ? 'bg-error-container text-on-error-container'
          : 'bg-surface-container text-on-surface'
      )}
    >
      {margin.toFixed(1)}%
    </span>
  );
}

interface EditingState {
  productId: string;
  marginInput: string;
  priceInput: string;
}

export function MarginTable({ initialProducts, totalCount, page }: MarginTableProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);

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

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-container-highest border-b border-outline-variant">
              <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface w-12 text-center">
                <input type="checkbox" className="rounded border-outline text-primary focus:ring-primary h-4 w-4" />
              </th>
              <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface w-32">SKU</th>
              <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface">Product Detail</th>
              <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface text-right w-28">Unit Cost</th>
              <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface text-right w-36">Current Margin</th>
              <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface text-right w-32">Retail Price</th>
              <th className="p-4 font-body-sm text-body-sm font-semibold text-on-surface text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm text-on-surface-variant">
            {products.map((product, i) => {
              const margin = calcMargin(product.price, product.cost);
              const isBelowTarget = margin !== null && margin < 25;
              const isEditing = editing?.productId === product.id;

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
                      {product.cost != null ? `$${product.cost.toFixed(2)}` : '—'}
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
                <tr
                  key={product.id}
                  className={cn(
                    'border-b border-outline-variant transition-colors group relative',
                    i % 2 === 0 ? 'bg-surface hover:bg-surface-container-low' : 'bg-surface-bright hover:bg-surface-container-low'
                  )}
                >
                  {isBelowTarget && (
                    <td className="absolute left-0 top-0 bottom-0 w-1 bg-error p-0" aria-hidden />
                  )}
                  <td className={cn('p-4 text-center', isBelowTarget && 'pl-5')}>
                    <input type="checkbox" className="rounded border-outline text-primary focus:ring-primary h-4 w-4" />
                  </td>
                  <td className="p-4 font-label-mono text-label-mono text-primary font-medium tracking-tight">
                    {product.sku}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-on-surface flex items-center gap-2">
                      {product.name}
                      {isBelowTarget && (
                        <span
                          className="material-symbols-outlined text-error text-[16px]"
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
                    {product.cost != null ? `$${product.cost.toFixed(2)}` : '—'}
                  </td>
                  <td className="p-4 text-right">
                    <MarginChip margin={margin} />
                  </td>
                  <td className="p-4 text-right font-label-mono text-label-mono font-bold text-on-surface">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => startEdit(product)}
                      className="text-primary hover:bg-primary-container/20 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-on-surface-variant font-label-mono text-label-mono">
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
            href={`?page=${Math.max(1, page - 1)}`}
            className={cn(
              'p-1 rounded text-outline hover:bg-surface-container-high transition-colors',
              page <= 1 && 'opacity-50 pointer-events-none'
            )}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </a>
          <a
            href={`?page=${Math.min(totalPages, page + 1)}`}
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
  );
}
