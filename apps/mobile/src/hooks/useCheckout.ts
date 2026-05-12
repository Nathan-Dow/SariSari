import { supabase } from '../lib/supabase';
import { type CheckoutResult, MOCK_PRODUCTS } from '@hackitup/shared';

const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

interface CheckoutItem {
  product_id: string;
  quantity: number;
}

export async function processCheckout(
  items: CheckoutItem[],
  paymentMethod = 'cash'
): Promise<CheckoutResult> {
  if (DEMO_MODE) {
    const totalAmount = items.reduce((sum, item) => {
      const product = MOCK_PRODUCTS.find((p) => p.id === item.product_id);
      return sum + (product?.price ?? 0) * item.quantity;
    }, 0);
    return {
      transaction_id: `demo-${Date.now()}`,
      total_amount: totalAmount,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase.rpc('process_checkout', {
    p_items: items,
    p_payment_method: paymentMethod,
  });

  if (error) throw new Error(error.message);
  return data as CheckoutResult;
}
