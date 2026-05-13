'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface FormState {
  name: string;
  sku: string;
  barcode: string;
  price: string;
  cost: string;
  stock: string;
  category: string;
  description: string;
}

const EMPTY: FormState = {
  name: '',
  sku: '',
  barcode: '',
  price: '',
  cost: '',
  stock: '0',
  category: '',
  description: '',
};

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
}

function ModalContent({ open, onClose }: AddProductModalProps) {
  // Add a mounted state
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Set mounted to true after the first client-side render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use the mounted state to prevent rendering the portal during hydration
  if (!mounted) return null;

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const reset = () => {
    setForm(EMPTY);
    setError(null);
  };

  const handleClose = () => {
    onClose();
    // delay reset so the close animation finishes before the form clears
    setTimeout(reset, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = parseFloat(form.price);
    if (!form.name.trim()) { setError('Product name is required.'); return; }
    if (!form.sku.trim()) { setError('SKU is required.'); return; }
    if (isNaN(price) || price <= 0) { setError('Enter a valid retail price.'); return; }

    setSaving(true);

    if (DEMO_MODE) {
      setSaving(false);
      handleClose();
      return;
    }

    const supabase = createClient();
    const { error: dbError } = await supabase.from('products').insert({
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || null,
      price,
      cost: form.cost ? parseFloat(form.cost) : null,
      stock: parseInt(form.stock, 10) || 0,
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      is_active: true,
    });

    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    handleClose();
    router.refresh();
  };

  const jsx = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl transform transition-all duration-200 overflow-hidden ${
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="font-headline-md text-headline-md text-on-surface">Add Product</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form id="add-product-form" onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[60vh]">
            {DEMO_MODE && (
              <div className="bg-secondary-container text-on-secondary-container px-4 py-3 rounded-lg font-body-sm text-body-sm">
                <strong>Demo Mode</strong> — this product won&apos;t be saved to a database.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1">
                  Product Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Organic Whole Milk"
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1">
                  SKU <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={set('sku')}
                  placeholder="e.g. MLK-001"
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-label-mono text-label-mono outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1">
                  Barcode
                </label>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={set('barcode')}
                  placeholder="e.g. 012345678901"
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-label-mono text-label-mono outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1">
                  Retail Price <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline font-label-mono text-label-mono">
                    $
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={set('price')}
                    placeholder="0.00"
                    className="w-full pl-7 pr-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-label-mono text-label-mono outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1">
                  Unit Cost
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline font-label-mono text-label-mono">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={set('cost')}
                    placeholder="0.00"
                    className="w-full pl-7 pr-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-label-mono text-label-mono outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1">
                  Initial Stock
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={set('stock')}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-label-mono text-label-mono outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={set('category')}
                  placeholder="e.g. Dairy"
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm outline-none transition-all"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Optional product description…"
                  rows={3}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm outline-none transition-all resize-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-error font-body-sm text-body-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-lowest">
          <button
            type="button"
            onClick={handleClose}
            className="h-[40px] px-5 rounded-full border border-outline text-on-surface font-body-sm text-body-sm hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-product-form"
            disabled={saving}
            className="h-[40px] px-5 rounded-full bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <span className="material-symbols-outlined text-[16px] animate-spin">
                progress_activity
              </span>
            )}
            Add Product
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(jsx, document.body);
}

export function AddProductModal({ open, onClose }: AddProductModalProps) {
  return <ModalContent open={open} onClose={onClose} />;
}
