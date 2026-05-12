import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function calcMargin(price: number, cost: number | null): number | null {
  if (!cost || cost <= 0 || price <= 0) return null;
  return ((price - cost) / price) * 100;
}

export function priceFromMargin(cost: number, targetMarginPct: number): number {
  if (targetMarginPct >= 100) return 0;
  return cost / (1 - targetMarginPct / 100);
}
