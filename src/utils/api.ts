import {
  Product,
  Order,
  Customer,
  Supplier,
  CashierUser,
  StoreSettings,
  BillFormatConfig,
  StockAdjustment,
} from '../types';
import { ActivityItem } from '../store/usePosStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return res.json();
  } catch (e: any) {
    console.warn(`API Error [${endpoint}]:`, e.message);
    throw e;
  }
}

export interface InitialSyncPayload {
  success: boolean;
  products: Product[];
  orders: Order[];
  customers: Customer[];
  suppliers: Supplier[];
  cashiers: CashierUser[];
  settings: StoreSettings;
  billFormat: BillFormatConfig;
  stockAdjustments: StockAdjustment[];
  activities: ActivityItem[];
}

export const posApi = {
  // Full initial data sync from MongoDB
  fetchInitialData: () => request<InitialSyncPayload>('/data'),

  // Products
  fetchProducts: () => request<Product[]>('/products'),
  createProduct: (product: Product) => request<{ success: boolean; product: Product }>('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  }),
  updateProduct: (id: string, updates: Partial<Product>) => request<{ success: boolean }>(`/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteProduct: (id: string) => request<{ success: boolean }>(`/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }),
  bulkAddProducts: (items: Partial<Product>[], mode: 'overwrite' | 'skip') =>
    request<{ success: boolean; imported: number; updated: number; skipped: number }>('/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ items, mode }),
    }),
  reloadMasterCatalog: () => request<{ success: boolean; count: number }>('/products/reload-master', {
    method: 'POST',
  }),

  // Orders
  fetchOrders: () => request<Order[]>('/orders'),
  createOrder: (order: Order) => request<{ success: boolean; order: Order }>('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  }),
  deleteOrder: (id: string, restoreStock = true) => request<{ success: boolean }>(`/orders/${encodeURIComponent(id)}?restoreStock=${restoreStock}`, {
    method: 'DELETE',
  }),
  bulkDeleteOrders: (orderIds: string[], restoreStock = true) => request<{ success: boolean }>('/orders/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ orderIds, restoreStock }),
  }),
  clearAllOrders: (restoreStock = true) => request<{ success: boolean }>('/orders/clear-all', {
    method: 'POST',
    body: JSON.stringify({ restoreStock }),
  }),
  refundOrderItem: (orderId: string, productId: string, refundQty: number, reason: string, cashierName: string) =>
    request<{ success: boolean }>(`/orders/${encodeURIComponent(orderId)}/refund`, {
      method: 'POST',
      body: JSON.stringify({ productId, refundQty, reason, cashierName }),
    }),
  voidOrder: (orderId: string, cashierName: string, reason: string) =>
    request<{ success: boolean }>(`/orders/${encodeURIComponent(orderId)}/void`, {
      method: 'POST',
      body: JSON.stringify({ cashierName, reason }),
    }),

  // Customers
  fetchCustomers: () => request<Customer[]>('/customers'),
  createCustomer: (customer: Customer) => request<{ success: boolean; customer: Customer }>('/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  }),
  updateCustomer: (id: string, updates: Partial<Customer>) => request<{ success: boolean }>(`/customers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),

  // Suppliers
  fetchSuppliers: () => request<Supplier[]>('/suppliers'),
  createSupplier: (supplier: Supplier) => request<{ success: boolean; supplier: Supplier }>('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplier),
  }),
  updateSupplier: (id: string, updates: Partial<Supplier>) => request<{ success: boolean }>(`/suppliers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteSupplier: (id: string) => request<{ success: boolean }>(`/suppliers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }),

  // Cashiers
  fetchCashiers: () => request<CashierUser[]>('/cashiers'),
  createCashier: (cashier: CashierUser) => request<{ success: boolean; cashier: CashierUser }>('/cashiers', {
    method: 'POST',
    body: JSON.stringify(cashier),
  }),
  updateCashier: (id: string, updates: Partial<CashierUser>) => request<{ success: boolean }>(`/cashiers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),

  // Settings & Bill Format
  fetchSettings: () => request<StoreSettings>('/settings'),
  updateSettings: (settings: Partial<StoreSettings>) => request<{ success: boolean; settings: StoreSettings }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
  fetchBillFormat: () => request<BillFormatConfig>('/bill-format'),
  updateBillFormat: (billFormat: Partial<BillFormatConfig>) => request<{ success: boolean; billFormat: BillFormatConfig }>('/bill-format', {
    method: 'PUT',
    body: JSON.stringify(billFormat),
  }),

  // Adjustments & Activities
  createStockAdjustment: (adjustment: StockAdjustment) => request<{ success: boolean; adjustment: StockAdjustment }>('/stock-adjustments', {
    method: 'POST',
    body: JSON.stringify(adjustment),
  }),
  createActivity: (activity: ActivityItem) => request<{ success: boolean; activity: ActivityItem }>('/activities', {
    method: 'POST',
    body: JSON.stringify(activity),
  }),
};
