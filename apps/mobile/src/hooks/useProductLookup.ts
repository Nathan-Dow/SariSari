import { supabase } from '../lib/supabase';
import { type Product, MOCK_PRODUCTS } from '@hackitup/shared';

const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

export async function lookupProductByBarcode(barcode: string): Promise<Product | null> {
  if (DEMO_MODE) {
    return MOCK_PRODUCTS.find((p) => p.barcode === barcode && p.is_active) ?? MOCK_PRODUCTS[0] ?? null;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data as Product;
}
