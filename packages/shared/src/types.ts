export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  price: number;
  cost: number | null;
  stock: number;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  cashier_id: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  delta: number;
  reason: 'sale' | 'restock' | 'adjustment' | 'waste';
  reference_id: string | null;
  performed_by: string | null;
  note: string | null;
  created_at: string;
}

export interface HourlyRevenue {
  hour_bucket: string;
  revenue: number;
  tx_count: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type UserRole = 'staff' | 'manager';

export interface CheckoutPayload {
  p_items: { product_id: string; quantity: number }[];
  p_payment_method?: string;
}

export interface CheckoutResult {
  transaction_id: string;
  total_amount: number;
  created_at: string;
}
