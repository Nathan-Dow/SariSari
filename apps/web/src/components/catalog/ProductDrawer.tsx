'use client';

import { createPortal } from 'react-dom';
import type { Product } from '@hackitup/shared';
import { cn, calcMargin } from '@/lib/utils';
import { InventoryChart } from '@/components/charts/InventoryChart';

function MarginChip({ margin }: { margin: number | null }) {
  if (margin === null) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface-container font-label-mono text-label-mono text-on-surface-variant">
        N/A
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-md font-label-mono text-label-mono font-bold',
        margin < 25
          ? 'bg-error-container text-on-error-container'
          : 'bg-surface-container text-on-surface'
      )}
    >
      {margin.toFixed(1)}%
    </span>
  );
}

interface ProductDrawerProps {
  product: Product | null;
  onClose: () => void;
  lowStock?: number;
}

function DrawerContent({ product, onClose, lowStock = 10 }: ProductDrawerProps) {
  if (typeof window === 'undefined') return null;

  const margin = product ? calcMargin(product.price, product.cost) : null;

  const jsx = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-end',
        product ? 'pointer-events-auto' : 'pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-300',
          product ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'relative flex flex-col w-full max-w-lg h-screen bg-surface shadow-2xl',
          'transform transition-transform duration-300 ease-in-out overflow-y-auto',
          product ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {product && (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-surface border-b border-outline-variant px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface leading-tight">
                  {product.name}
                </h2>
                <span className="font-label-mono text-label-mono text-primary mt-1 inline-block">
                  {product.sku}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors shrink-0"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Product Info */}
            <div className="px-6 py-5 space-y-4 border-b border-outline-variant">
              {/* Category + Barcode chips */}
              <div className="flex flex-wrap gap-2">
                {product.category && (
                  <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-body-sm text-body-sm">
                    {product.category}
                  </span>
                )}
                {product.barcode && (
                  <span className="px-3 py-1 rounded-full bg-surface-container font-label-mono text-label-mono text-on-surface-variant">
                    {product.barcode}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {product.description ?? 'No description available.'}
              </p>

              {/* Stock level */}
              <div className="flex items-center gap-2">
                {product.stock <= lowStock && (
                  <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                )}
                <span
                  className={cn(
                    'font-label-mono text-label-mono font-bold',
                    product.stock <= lowStock ? 'text-error' : 'text-on-surface'
                  )}
                >
                  {product.stock} units in stock
                </span>
                {product.stock <= lowStock && (
                  <span className="font-body-sm text-body-sm text-error">— Low stock</span>
                )}
              </div>

              {/* Cost / Price / Margin row */}
              <div className="grid grid-cols-3 gap-4 pt-1">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3">
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">Unit Cost</p>
                  <p className="font-label-mono text-label-mono text-on-surface font-bold">
                    {product.cost != null ? `$${product.cost.toFixed(2)}` : '—'}
                  </p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3">
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">Retail Price</p>
                  <p className="font-label-mono text-label-mono text-on-surface font-bold">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3">
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">Margin</p>
                  <MarginChip margin={margin} />
                </div>
              </div>
            </div>

            {/* Stock History */}
            <div className="px-6 py-5">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Stock History</h3>
              <InventoryChart key={product.id} productId={product.id} />
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(jsx, document.body);
}

export function ProductDrawer({ product, onClose, lowStock }: ProductDrawerProps) {
  return <DrawerContent product={product} onClose={onClose} lowStock={lowStock} />;
}
