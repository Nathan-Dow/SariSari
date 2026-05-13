'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface Thresholds {
  onTarget: number;
  belowTarget: number;
  lowStock: number;
}

interface Props {
  health: { avgMargin: number; onTarget: number; actionRequired: number; total: number };
  lowStockCount: number;
  thresholds: Thresholds;
  currentParams: Record<string, string>;
}

export function CatalogHealthCard({ health, lowStockCount, thresholds, currentParams }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...thresholds });
  const [validationError, setValidationError] = useState<string | null>(null);
  const router = useRouter();

  const openEdit = () => {
    setDraft({ ...thresholds });
    setValidationError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setValidationError(null);
  };

  const save = () => {
    if (draft.belowTarget >= draft.onTarget) {
      setValidationError('"Below target" must be less than "On target".');
      return;
    }
    if (draft.belowTarget < 0 || draft.onTarget > 100 || draft.lowStock < 0) {
      setValidationError('Margins must be 0–100. Low stock must be ≥ 0.');
      return;
    }

    const params = new URLSearchParams(currentParams);
    params.set('onTarget', String(draft.onTarget));
    params.set('belowTarget', String(draft.belowTarget));
    params.set('lowStock', String(draft.lowStock));
    params.delete('page');
    router.push(`?${params.toString()}`);
    setEditing(false);
  };

  const field = (key: keyof Thresholds, label: string, suffix: string) => (
    <div>
      <label className="block font-body-sm text-body-sm text-on-surface-variant mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={0}
          max={key === 'lowStock' ? undefined : 100}
          step={key === 'lowStock' ? 1 : 0.5}
          value={draft[key]}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))
          }
          className="w-full pr-8 pl-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-label-mono text-label-mono outline-none transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline font-label-mono text-label-mono text-xs">
          {suffix}
        </span>
      </div>
    </div>
  );

  return (
    <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider">
          Overall Catalog Health
        </h3>
        <button
          onClick={editing ? cancel : openEdit}
          title={editing ? 'Cancel' : 'Edit thresholds'}
          className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full transition-colors -mt-1 -mr-1"
        >
          <span className="material-symbols-outlined text-[18px]">
            {editing ? 'close' : 'tune'}
          </span>
        </button>
      </div>

      <div className="font-headline-lg text-headline-lg text-on-surface flex items-baseline gap-2 mb-6">
        {health.avgMargin.toFixed(1)}%
        <span className="font-body-sm text-body-sm text-outline font-normal">Avg Margin</span>
      </div>

      {editing ? (
        <div className="flex flex-col gap-3 flex-1">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Adjust the thresholds used to classify products.
          </p>

          <div className="flex flex-col gap-3">
            {field('onTarget', 'On-target margin (≥)', '%')}
            {field('belowTarget', 'Below-target margin (<)', '%')}
            {field('lowStock', 'Low stock alert (≤)', 'units')}
          </div>

          {validationError && (
            <p className="text-error font-body-sm text-body-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              {validationError}
            </p>
          )}

          <div className="flex gap-2 mt-auto pt-2">
            <button
              onClick={cancel}
              className="flex-1 h-[36px] rounded-full border border-outline text-on-surface font-body-sm text-body-sm hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="flex-1 h-[36px] rounded-full bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Apply
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 flex-1 justify-end">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              On Target (≥{thresholds.onTarget}%)
            </span>
            <span className="font-label-mono text-label-mono text-on-surface">
              {health.onTarget.toLocaleString()} items
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-error font-body-sm text-body-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-error" />
              Below Target (&lt;{thresholds.belowTarget}%)
            </span>
            <span className="font-label-mono text-label-mono text-error font-bold">
              {health.actionRequired} items
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[14px] text-tertiary">inventory</span>
              Low Stock (≤{thresholds.lowStock})
            </span>
            <span
              className={`font-label-mono text-label-mono ${
                lowStockCount > 0 ? 'text-error font-bold' : 'text-on-surface'
              }`}
            >
              {lowStockCount} items
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
