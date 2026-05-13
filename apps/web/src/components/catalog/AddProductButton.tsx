'use client';

import { useState } from 'react';
import { AddProductModal } from './AddProductModal';

export function AddProductButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-[48px] px-6 rounded-full bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        Add Product
      </button>
      <AddProductModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
