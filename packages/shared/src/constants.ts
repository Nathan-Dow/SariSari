export const USER_ROLES = {
  STAFF: 'staff',
  MANAGER: 'manager',
} as const;

export const TRANSACTION_STATUS = {
  COMPLETED: 'completed',
  VOID: 'void',
  REFUNDED: 'refunded',
} as const;

export const LOG_REASON = {
  SALE: 'sale',
  RESTOCK: 'restock',
  ADJUSTMENT: 'adjustment',
  WASTE: 'waste',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  GCASH: 'gcash',
  MAYA: 'maya',
} as const;

export const BARCODE_TYPES = ['ean13', 'ean8', 'qr', 'code128', 'upc_a'] as const;
