import type { Product, Transaction, HourlyRevenue, InventoryLog } from './types';

// ── Products ──────────────────────────────────────────────────────────────────
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p-001', name: 'Organic Fuji Apples (1kg)', description: 'Fresh, crisp apples',
    sku: 'APPL-FUJ-1K', barcode: '4800012345671', price: 149.00, cost: 72.00,
    stock: 84, category: 'Fresh Produce', image_url: null, is_active: true,
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p-002', name: 'Coca-Cola 350ml', description: 'Classic Coke',
    sku: 'COKE-350ML', barcode: '4800045678912', price: 30.00, cost: 16.50,
    stock: 240, category: 'Beverages', image_url: null, is_active: true,
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p-003', name: "Lay's Classic Chips 110g", description: 'Salted potato chips',
    sku: 'LAYS-CLS-110', barcode: '4800023456789', price: 55.00, cost: 48.00,
    stock: 60, category: 'Snacks', image_url: null, is_active: true,
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p-004', name: 'Reusable Tote Bag', description: 'Eco-friendly canvas bag',
    sku: 'BAG-TOTE-ECO', barcode: '4800034567890', price: 89.00, cost: 32.00,
    stock: 33, category: 'Accessories', image_url: null, is_active: true,
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p-005', name: 'Gardenia Wheat Bread 600g', description: 'Sliced wheat loaf',
    sku: 'GARD-WHT-600', barcode: '4800067890123', price: 72.00, cost: 41.00,
    stock: 18, category: 'Bakery', image_url: null, is_active: true,
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p-006', name: 'Greek Yogurt 500g', description: 'Plain, full-fat',
    sku: 'YOPL-GRK-500', barcode: '4800078901234', price: 120.00, cost: 62.00,
    stock: 47, category: 'Dairy', image_url: null, is_active: true,
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p-007', name: 'Premium Dark Chocolate 70%', description: 'Single-origin, 100g',
    sku: 'CHOC-DRK-70P', barcode: '4800089012345', price: 195.00, cost: 88.00,
    stock: 52, category: 'Confectionery', image_url: null, is_active: true,
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'p-008', name: 'Mineral Water 1L', description: 'Still, natural spring water',
    sku: 'WATR-MIN-1L', barcode: '4800090123456', price: 25.00, cost: 8.50,
    stock: 312, category: 'Beverages', image_url: null, is_active: true,
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
];

// ── Transactions (today) ──────────────────────────────────────────────────────
function todayAt(h: number, m: number) {
  const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString();
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-001', cashier_id: 'u-001', total_amount: 374.00, payment_method: 'cash',   status: 'completed',  created_at: todayAt(14, 32) },
  { id: 'tx-002', cashier_id: 'u-002', total_amount: 89.00,  payment_method: 'card',   status: 'completed',  created_at: todayAt(14, 28) },
  { id: 'tx-003', cashier_id: 'u-001', total_amount: 450.25, payment_method: 'gcash',  status: 'processing', created_at: todayAt(14, 15) },
  { id: 'tx-004', cashier_id: 'u-003', total_amount: 15.99,  payment_method: 'cash',   status: 'refunded',   created_at: todayAt(14, 2)  },
  { id: 'tx-005', cashier_id: 'u-002', total_amount: 210.00, payment_method: 'cash',   status: 'completed',  created_at: todayAt(13, 55) },
  { id: 'tx-006', cashier_id: 'u-001', total_amount: 124.50, payment_method: 'maya',   status: 'completed',  created_at: todayAt(13, 40) },
  { id: 'tx-007', cashier_id: 'u-003', total_amount: 340.00, payment_method: 'card',   status: 'completed',  created_at: todayAt(13, 22) },
  { id: 'tx-008', cashier_id: 'u-002', total_amount: 77.50,  payment_method: 'cash',   status: 'completed',  created_at: todayAt(13, 10) },
];

// ── Hourly revenue (realistic sales curve) ────────────────────────────────────
export const MOCK_HOURLY_REVENUE: HourlyRevenue[] = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(
  (h, i) => {
    const d = new Date(); d.setHours(h, 0, 0, 0);
    const revenues = [820, 1240, 2100, 3450, 4820, 3980, 2680, 4100, 3320, 1450];
    return {
      hour_bucket: d.toISOString(),
      revenue: revenues[i] ?? 0,
      tx_count: Math.round((revenues[i] ?? 0) / 220),
    };
  }
);

// ── KPI summary ───────────────────────────────────────────────────────────────
export const MOCK_KPIS = {
  totalRevenue: MOCK_TRANSACTIONS
    .filter((t) => t.status === 'completed')
    .reduce((s, t) => s + t.total_amount, 0),
  txCount: MOCK_TRANSACTIONS.length,
  avgMargin: 43.2,
  lowStockCount: MOCK_PRODUCTS.filter((p) => p.stock <= 20).length,
};

// ── Inventory logs ────────────────────────────────────────────────────────────
export const MOCK_INVENTORY_LOGS: InventoryLog[] = [
  // p-001 Organic Fuji Apples
  { id: 'il-001', product_id: 'p-001', delta: 100, reason: 'restock',    reference_id: null,   performed_by: null, note: 'Initial stock',   created_at: '2025-03-01T08:00:00Z' },
  { id: 'il-002', product_id: 'p-001', delta: -12, reason: 'sale',       reference_id: 'tx-001', performed_by: null, note: null,            created_at: '2025-03-05T14:30:00Z' },
  { id: 'il-003', product_id: 'p-001', delta: 50,  reason: 'restock',    reference_id: null,   performed_by: null, note: 'Weekly delivery', created_at: '2025-03-10T09:00:00Z' },
  { id: 'il-004', product_id: 'p-001', delta: -8,  reason: 'sale',       reference_id: 'tx-005', performed_by: null, note: null,            created_at: '2025-03-14T11:20:00Z' },
  { id: 'il-005', product_id: 'p-001', delta: -3,  reason: 'waste',      reference_id: null,   performed_by: null, note: 'Expired items',  created_at: '2025-03-18T16:00:00Z' },
  { id: 'il-006', product_id: 'p-001', delta: 50,  reason: 'restock',    reference_id: null,   performed_by: null, note: 'Weekly delivery', created_at: '2025-03-24T09:00:00Z' },
  { id: 'il-007', product_id: 'p-001', delta: -10, reason: 'sale',       reference_id: 'tx-006', performed_by: null, note: null,            created_at: '2025-03-29T13:45:00Z' },
  // p-002 Coca-Cola
  { id: 'il-008', product_id: 'p-002', delta: 200, reason: 'restock',    reference_id: null,   performed_by: null, note: 'Bulk order',     created_at: '2025-03-01T08:00:00Z' },
  { id: 'il-009', product_id: 'p-002', delta: -40, reason: 'sale',       reference_id: null,   performed_by: null, note: null,             created_at: '2025-03-08T12:00:00Z' },
  { id: 'il-010', product_id: 'p-002', delta: 120, reason: 'restock',    reference_id: null,   performed_by: null, note: 'Reorder',        created_at: '2025-03-15T09:00:00Z' },
  { id: 'il-011', product_id: 'p-002', delta: -30, reason: 'sale',       reference_id: null,   performed_by: null, note: null,             created_at: '2025-03-22T14:00:00Z' },
  { id: 'il-012', product_id: 'p-002', delta: -10, reason: 'adjustment', reference_id: null,   performed_by: null, note: 'Damaged cans',   created_at: '2025-03-28T10:00:00Z' },
  // p-003 Lay's Chips
  { id: 'il-013', product_id: 'p-003', delta: 80,  reason: 'restock',    reference_id: null,   performed_by: null, note: 'Initial stock',  created_at: '2025-03-01T08:00:00Z' },
  { id: 'il-014', product_id: 'p-003', delta: -15, reason: 'sale',       reference_id: null,   performed_by: null, note: null,             created_at: '2025-03-09T11:00:00Z' },
  { id: 'il-015', product_id: 'p-003', delta: -5,  reason: 'waste',      reference_id: null,   performed_by: null, note: 'Torn packaging', created_at: '2025-03-20T15:00:00Z' },
  // p-004 Tote Bag
  { id: 'il-016', product_id: 'p-004', delta: 50,  reason: 'restock',    reference_id: null,   performed_by: null, note: 'Initial stock',  created_at: '2025-03-01T08:00:00Z' },
  { id: 'il-017', product_id: 'p-004', delta: -17, reason: 'sale',       reference_id: null,   performed_by: null, note: null,             created_at: '2025-03-12T10:00:00Z' },
  // p-005 Gardenia Bread
  { id: 'il-018', product_id: 'p-005', delta: 40,  reason: 'restock',    reference_id: null,   performed_by: null, note: 'Weekly delivery', created_at: '2025-03-01T08:00:00Z' },
  { id: 'il-019', product_id: 'p-005', delta: -10, reason: 'sale',       reference_id: null,   performed_by: null, note: null,             created_at: '2025-03-05T09:00:00Z' },
  { id: 'il-020', product_id: 'p-005', delta: -8,  reason: 'waste',      reference_id: null,   performed_by: null, note: 'Expired loaves', created_at: '2025-03-07T17:00:00Z' },
  { id: 'il-021', product_id: 'p-005', delta: 30,  reason: 'restock',    reference_id: null,   performed_by: null, note: 'Weekly delivery', created_at: '2025-03-10T08:00:00Z' },
  { id: 'il-022', product_id: 'p-005', delta: -12, reason: 'sale',       reference_id: null,   performed_by: null, note: null,             created_at: '2025-03-13T11:00:00Z' },
  { id: 'il-023', product_id: 'p-005', delta: -7,  reason: 'waste',      reference_id: null,   performed_by: null, note: 'Day-old stock',  created_at: '2025-03-14T18:00:00Z' },
  // p-006 Greek Yogurt
  { id: 'il-024', product_id: 'p-006', delta: 60,  reason: 'restock',    reference_id: null,   performed_by: null, note: 'Initial stock',  created_at: '2025-03-01T08:00:00Z' },
  { id: 'il-025', product_id: 'p-006', delta: -8,  reason: 'sale',       reference_id: null,   performed_by: null, note: null,             created_at: '2025-03-10T12:00:00Z' },
  { id: 'il-026', product_id: 'p-006', delta: -5,  reason: 'waste',      reference_id: null,   performed_by: null, note: 'Past sell-by',   created_at: '2025-03-18T17:00:00Z' },
  // p-007 Dark Chocolate
  { id: 'il-027', product_id: 'p-007', delta: 60,  reason: 'restock',    reference_id: null,   performed_by: null, note: 'Initial stock',  created_at: '2025-03-01T08:00:00Z' },
  { id: 'il-028', product_id: 'p-007', delta: -8,  reason: 'sale',       reference_id: null,   performed_by: null, note: null,             created_at: '2025-03-15T14:00:00Z' },
  // p-008 Mineral Water
  { id: 'il-029', product_id: 'p-008', delta: 300, reason: 'restock',    reference_id: null,   performed_by: null, note: 'Bulk order',     created_at: '2025-03-01T08:00:00Z' },
  { id: 'il-030', product_id: 'p-008', delta: -50, reason: 'sale',       reference_id: null,   performed_by: null, note: null,             created_at: '2025-03-08T13:00:00Z' },
  { id: 'il-031', product_id: 'p-008', delta: 100, reason: 'restock',    reference_id: null,   performed_by: null, note: 'Reorder',        created_at: '2025-03-20T09:00:00Z' },
  { id: 'il-032', product_id: 'p-008', delta: -38, reason: 'sale',       reference_id: null,   performed_by: null, note: null,             created_at: '2025-03-28T15:00:00Z' },
];

// ── Staff cashier names ────────────────────────────────────────────────────────
export const MOCK_CASHIER_NAMES: Record<string, string> = {
  'u-001': 'J. Dela Cruz',
  'u-002': 'A. Santos',
  'u-003': 'M. Reyes',
};

// ── Top movers ────────────────────────────────────────────────────────────────
export const MOCK_TOP_MOVERS = [
  { name: 'Organic Fuji Apples (1kg)',  qty: 142 },
  { name: 'Mineral Water 1L',           qty: 98  },
  { name: 'Coca-Cola 350ml',            qty: 76  },
  { name: 'Gardenia Wheat Bread 600g',  qty: 41  },
];
