import { create } from 'zustand';
import {
  Product,
  CartItem,
  HeldCart,
  Customer,
  Order,
  PaymentDetail,
  StockAdjustment,
  Supplier,
  StoreSettings,
  CashierUser,
  AdjustmentReason,
  BillFormatConfig,
  RefundRecord,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_CASHIERS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_BILL_FORMAT,
} from '../utils/seedData';
import { posSound } from '../utils/sound';
import { posApi } from '../utils/api';

export interface ActivityItem {
  id: string;
  type: 'sale' | 'refund' | 'stock' | 'product';
  text: string;
  amount?: number;
  timestamp: string;
}

interface PosState {
  // DB Sync Status
  isDbConnected: boolean;
  isLoadingDb: boolean;
  fetchFromDatabase: () => Promise<void>;

  // Authentication & Session
  isAuthenticated: boolean;
  login: (username: string, pin: string) => boolean;
  logout: () => void;

  // Products & Inventory
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  bulkAddOrUpdateProducts: (
    items: Partial<Product>[],
    mode: 'overwrite' | 'skip'
  ) => { imported: number; updated: number; skipped: number };
  reloadKalaaSagarInventory: () => void;

  // Cart Management
  cart: CartItem[];
  heldCarts: HeldCart[];
  activeCustomer: Customer | null;
  addToCart: (product: Product, quantity?: number) => boolean;
  updateCartItemQty: (id: string, qty: number) => void;
  updateCartItemPrice: (id: string, newSellingPrice: number) => void;
  updateCartItemMrp: (id: string, newMrp: number) => void;
  updateCartItemDiscount: (id: string, discountPercent: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setActiveCustomer: (customer: Customer | null) => void;
  holdCurrentCart: (note?: string) => void;
  resumeHeldCart: (heldCartId: string) => void;
  deleteHeldCart: (heldCartId: string) => void;

  // Checkout & Settlement
  checkout: (
    paymentDetail: PaymentDetail,
    cashier: CashierUser
  ) => { success: boolean; order?: Order; error?: string };

  // Orders & Refunds
  orders: Order[];
  refundOrderItem: (
    orderId: string,
    productId: string,
    refundQty: number,
    reason: string,
    cashierName: string
  ) => boolean;
  voidOrder: (orderId: string, cashierName: string, reason: string) => boolean;
  deleteOrder: (orderId: string, restoreStock?: boolean) => boolean;
  deleteOrders: (orderIds: string[], restoreStock?: boolean) => boolean;
  clearAllOrders: (restoreStock?: boolean) => void;

  // Stock Management
  stockAdjustments: StockAdjustment[];
  adjustStock: (
    productId: string,
    newStock: number,
    reason: AdjustmentReason,
    note: string,
    cashierName: string
  ) => void;

  // Suppliers & Customers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'points' | 'totalSpent' | 'visitCount'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;

  // Settings & Users
  settings: StoreSettings;
  updateSettings: (updates: Partial<StoreSettings>) => void;

  billFormat: BillFormatConfig;
  updateBillFormat: (updates: Partial<BillFormatConfig>) => void;
  resetBillFormat: () => void;

  cashiers: CashierUser[];
  currentCashier: CashierUser;
  switchCashier: (cashierId: string, pin: string) => boolean;
  addCashier: (cashier: Omit<CashierUser, 'id'>) => void;
  updateCashier: (id: string, updates: Partial<CashierUser>) => void;

  // Recent Activity & Audio
  activities: ActivityItem[];
  addActivity: (type: ActivityItem['type'], text: string, amount?: number) => void;

  // Persistence, Sync & Reset
  resetToDemoData: () => void;
  exportDatabaseBackup: () => string;
  restoreDatabaseBackup: (jsonContent: string) => boolean;
}

const STORAGE_KEY = 'supermarket_pos_v1_data';
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('supermarket_pos_channel')
  : null;

function loadInitialState() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading stored POS data:', e);
  }
  return null;
}

function sanitizeCashiers(cashiers?: CashierUser[]): CashierUser[] {
  if (!cashiers || cashiers.length === 0) return INITIAL_CASHIERS;
  const adminIndex = cashiers.findIndex(
    (c) => c.username.toLowerCase() === 'kalaasagar' || c.role === 'admin' || c.username.toLowerCase() === 'admin'
  );
  if (adminIndex === -1) {
    return [INITIAL_CASHIERS[0], ...cashiers];
  }
  const updated = [...cashiers];
  updated[adminIndex] = {
    ...updated[adminIndex],
    name: updated[adminIndex].username.toLowerCase() === 'admin' ? 'Kalaasagar Admin' : updated[adminIndex].name,
    username: 'kalaasagar',
    role: 'admin',
    pin: 'drushika6',
    active: true,
  };
  return updated;
}

const AUTH_STORAGE_KEY = 'kalaasagar_auth_session';
const isInitialAuthenticated = typeof window !== 'undefined'
  ? localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
  : false;

const stored = loadInitialState();
const defaultProducts: Product[] = (!stored?.products || stored.products.length < 100)
  ? INITIAL_PRODUCTS
  : stored.products;
const defaultOrders: Order[] = stored?.orders || [];

const storedSettings = stored?.settings;
const defaultSettings: StoreSettings = (!storedSettings || storedSettings.storeName === 'METRO SUPERMARKET' || storedSettings.storeName === 'KALASAGAR')
  ? { ...INITIAL_SETTINGS, storeName: 'Kalaasagar SuperMarket' }
  : { ...storedSettings, storeName: 'Kalaasagar SuperMarket' };
const defaultBillFormat: BillFormatConfig = {
  ...(stored?.billFormat || INITIAL_BILL_FORMAT),
  storeName: 'Kalaasagar SuperMarket',
};

const defaultCashiers = sanitizeCashiers(stored?.cashiers);
const defaultCurrentCashier = defaultCashiers.find(c => c.username.toLowerCase() === 'kalaasagar') || defaultCashiers[0];

export const usePosStore = create<PosState>((set, get) => {
  // Sync state helper to save to localStorage and broadcast to other tabs
  const saveAndBroadcast = (nextState: Partial<PosState>) => {
    set(nextState);
    if (typeof window !== 'undefined') {
      try {
        const full = {
          products: get().products,
          orders: get().orders,
          heldCarts: get().heldCarts,
          stockAdjustments: get().stockAdjustments,
          suppliers: get().suppliers,
          customers: get().customers,
          settings: get().settings,
          billFormat: get().billFormat,
          cashiers: get().cashiers,
          currentCashier: get().currentCashier,
          activities: get().activities,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
        broadcastChannel?.postMessage({ type: 'SYNC_STATE', payload: full });
      } catch (e) {
        console.error('Failed to save POS state:', e);
      }
    }
  };

  return {
    isDbConnected: false,
    isLoadingDb: false,

    fetchFromDatabase: async () => {
      set({ isLoadingDb: true });
      try {
        const payload = await posApi.fetchInitialData();
        if (payload && payload.success) {
          const cashiers = sanitizeCashiers(payload.cashiers);
          const activeCashier = cashiers.find(c => c.username.toLowerCase() === 'kalaasagar') || cashiers[0];

          saveAndBroadcast({
            isDbConnected: true,
            isLoadingDb: false,
            products: payload.products && payload.products.length > 0 ? payload.products : INITIAL_PRODUCTS,
            orders: payload.orders || [], // Real orders only from MongoDB
            customers: payload.customers || [],
            suppliers: payload.suppliers || [],
            cashiers: cashiers,
            currentCashier: activeCashier,
            settings: payload.settings || INITIAL_SETTINGS,
            billFormat: payload.billFormat || INITIAL_BILL_FORMAT,
            stockAdjustments: payload.stockAdjustments || [],
            activities: payload.activities || [],
          });
          return;
        }
      } catch (e) {
        console.warn('Backend sync warning (running offline / fallback mode):', e);
      }
      set({ isLoadingDb: false });
    },

    isAuthenticated: isInitialAuthenticated,
    login: (username, pin) => {
      const cleanUsername = username.trim().toLowerCase();
      const cleanPin = pin.trim();

      const isAdminMatch = cleanUsername === 'kalaasagar' && cleanPin === 'drushika6';
      const matchedCashier = get().cashiers.find(
        (c) =>
          c.active &&
          (c.username.toLowerCase() === cleanUsername || c.name.toLowerCase() === cleanUsername) &&
          c.pin === cleanPin
      );

      if (isAdminMatch || matchedCashier) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, 'true');
        }
        const activeCashier =
          matchedCashier ||
          get().cashiers.find((c) => c.username.toLowerCase() === 'kalaasagar') ||
          get().cashiers[0];
        set({ isAuthenticated: true, currentCashier: activeCashier });
        return true;
      }
      return false;
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      set({ isAuthenticated: false });
    },

    products: defaultProducts,
    orders: defaultOrders,
    cart: [],
    heldCarts: stored?.heldCarts || [],
    activeCustomer: null,
    stockAdjustments: stored?.stockAdjustments || [],
    suppliers: stored?.suppliers || INITIAL_SUPPLIERS,
    customers: stored?.customers || INITIAL_CUSTOMERS,
    settings: defaultSettings,
    cashiers: defaultCashiers,
    currentCashier: defaultCurrentCashier,
    activities: stored?.activities || [],

    // Product actions
    addProduct: (productData) => {
      const newProduct: Product = {
        ...productData,
        id: `prod-${Date.now()}`,
        image: productData.image || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedProducts = [newProduct, ...get().products];
      get().addActivity('product', `Added new product: ${newProduct.name}`);
      saveAndBroadcast({ products: updatedProducts });
      posApi.createProduct(newProduct).catch(() => {});
    },

    updateProduct: (id, updates) => {
      const updatedProducts = get().products.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      saveAndBroadcast({ products: updatedProducts });
      posApi.updateProduct(id, updates).catch(() => {});
    },

    deleteProduct: (id) => {
      const target = get().products.find((p) => p.id === id);
      const updatedProducts = get().products.filter((p) => p.id !== id);
      if (target) {
        get().addActivity('product', `Deleted product: ${target.name}`);
      }
      saveAndBroadcast({ products: updatedProducts });
      posApi.deleteProduct(id).catch(() => {});
    },

    bulkAddOrUpdateProducts: (items, mode) => {
      const currentProducts = [...get().products];
      let imported = 0;
      let updated = 0;
      let skipped = 0;

      items.forEach((item) => {
        if (!item.barcode || !item.name) {
          skipped++;
          return;
        }
        const existingIdx = currentProducts.findIndex((p) => p.barcode === item.barcode);
        if (existingIdx >= 0) {
          if (mode === 'overwrite') {
            currentProducts[existingIdx] = {
              ...currentProducts[existingIdx],
              ...item,
              image: item.image || currentProducts[existingIdx].image || '',
              updatedAt: new Date().toISOString(),
            } as Product;
            updated++;
          } else {
            skipped++;
          }
        } else {
          currentProducts.push({
            id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: item.name!,
            barcode: item.barcode!,
            category: item.category || 'Groceries & Staples',
            brand: item.brand || 'Generic',
            mrp: item.mrp || item.sellingPrice || 100,
            costPrice: item.costPrice || (item.sellingPrice ? item.sellingPrice * 0.8 : 80),
            sellingPrice: item.sellingPrice || 100,
            stock: item.stock || 50,
            minStockLevel: item.minStockLevel || 10,
            unit: item.unit || 'pcs',
            gstRate: item.gstRate || 0,
            image: item.image || '',
            description: item.description || '',
            supplier: item.supplier || 'Wholesaler Direct',
            expiryDate: item.expiryDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          imported++;
        }
      });

      get().addActivity('product', `CSV Bulk Import: ${imported} added, ${updated} updated, ${skipped} skipped`);
      saveAndBroadcast({ products: currentProducts });
      posApi.bulkAddProducts(items, mode).catch(() => {});
      return { imported, updated, skipped };
    },

    reloadKalaaSagarInventory: () => {
      saveAndBroadcast({ products: INITIAL_PRODUCTS });
      get().addActivity('product', `Reloaded ${INITIAL_PRODUCTS.length} products from Kalaasagar master catalog`);
      posApi.reloadMasterCatalog().catch(() => {});
    },

    // Cart actions
    addToCart: (product, quantity = 1) => {
      const currentCart = [...get().cart];
      const existingIndex = currentCart.findIndex((item) => item.product.id === product.id);

      if (product.stock <= 0) {
        posSound.playErrorBeep();
        return false;
      }

      if (existingIndex >= 0) {
        const existing = currentCart[existingIndex];
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) {
          posSound.playErrorBeep();
          return false;
        }

        const lineSelling = existing.sellingPrice * newQty;
        const discountAmt = (lineSelling * existing.discountPercent) / 100;
        const taxable = lineSelling - discountAmt;
        const gstAmt = (taxable * existing.gstRate) / 100;
        const total = taxable + (get().settings.taxInclusive ? 0 : gstAmt);

        currentCart[existingIndex] = {
          ...existing,
          quantity: newQty,
          discountAmount: discountAmt,
          gstAmount: gstAmt,
          total: total,
        };
      } else {
        const lineSelling = product.sellingPrice * quantity;
        const discountPercent = 0;
        const discountAmt = 0;
        const taxable = lineSelling;
        const gstAmt = (taxable * product.gstRate) / 100;
        const total = taxable + (get().settings.taxInclusive ? 0 : gstAmt);

        const newCartItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          product,
          quantity,
          sellingPrice: product.sellingPrice,
          mrp: product.mrp,
          discountPercent,
          discountAmount: discountAmt,
          gstRate: product.gstRate,
          gstAmount: gstAmt,
          total,
        };
        currentCart.unshift(newCartItem);
      }

      posSound.playScanBeep();
      set({ cart: currentCart });
      return true;
    },

    updateCartItemQty: (id, qty) => {
      if (qty <= 0) {
        get().removeFromCart(id);
        return;
      }

      const currentCart = get().cart.map((item) => {
        if (item.id === id) {
          if (qty > item.product.stock) {
            posSound.playErrorBeep();
            return item;
          }
          const lineSelling = item.sellingPrice * qty;
          const discountAmt = (lineSelling * item.discountPercent) / 100;
          const taxable = lineSelling - discountAmt;
          const gstAmt = (taxable * item.gstRate) / 100;
          const total = taxable + (get().settings.taxInclusive ? 0 : gstAmt);

          return {
            ...item,
            quantity: qty,
            discountAmount: discountAmt,
            gstAmount: gstAmt,
            total,
          };
        }
        return item;
      });

      posSound.playClick();
      set({ cart: currentCart });
    },

    updateCartItemPrice: (id, newSellingPrice) => {
      const currentCart = get().cart.map((item) => {
        if (item.id === id) {
          const price = Math.max(0, newSellingPrice);
          const lineSelling = price * item.quantity;
          const discountAmt = (lineSelling * item.discountPercent) / 100;
          const taxable = lineSelling - discountAmt;
          const gstAmt = (taxable * item.gstRate) / 100;
          const total = taxable + (get().settings.taxInclusive ? 0 : gstAmt);

          return {
            ...item,
            sellingPrice: price,
            discountAmount: discountAmt,
            gstAmount: gstAmt,
            total,
          };
        }
        return item;
      });
      set({ cart: currentCart });
    },

    updateCartItemMrp: (id, newMrp) => {
      const currentCart = get().cart.map((item) => {
        if (item.id === id) {
          return { ...item, mrp: Math.max(0, newMrp) };
        }
        return item;
      });
      set({ cart: currentCart });
    },

    updateCartItemDiscount: (id, discountPercent) => {
      const currentCart = get().cart.map((item) => {
        if (item.id === id) {
          const lineSelling = item.sellingPrice * item.quantity;
          const discountAmt = (lineSelling * discountPercent) / 100;
          const taxable = lineSelling - discountAmt;
          const gstAmt = (taxable * item.gstRate) / 100;
          const total = taxable + (get().settings.taxInclusive ? 0 : gstAmt);

          return {
            ...item,
            discountPercent,
            discountAmount: discountAmt,
            gstAmount: gstAmt,
            total,
          };
        }
        return item;
      });
      set({ cart: currentCart });
    },

    removeFromCart: (id) => {
      posSound.playClick();
      set({ cart: get().cart.filter((i) => i.id !== id) });
    },

    clearCart: () => {
      posSound.playClick();
      set({ cart: [], activeCustomer: null });
    },

    setActiveCustomer: (customer) => {
      set({ activeCustomer: customer });
    },

    holdCurrentCart: (note) => {
      const { cart, activeCustomer, heldCarts } = get();
      if (cart.length === 0) return;

      const newHeldCart: HeldCart = {
        id: `held-${Date.now()}`,
        name: activeCustomer ? activeCustomer.name : `Customer ${heldCarts.length + 1}`,
        customer: activeCustomer || undefined,
        items: [...cart],
        createdAt: new Date().toISOString(),
        note,
      };

      const updatedHeld = [newHeldCart, ...heldCarts];
      get().addActivity('sale', `Held cart for ${newHeldCart.name} (${cart.length} items)`);
      saveAndBroadcast({ heldCarts: updatedHeld, cart: [], activeCustomer: null });
    },

    resumeHeldCart: (heldCartId) => {
      const target = get().heldCarts.find((h) => h.id === heldCartId);
      if (!target) return;

      const updatedHeld = get().heldCarts.filter((h) => h.id !== heldCartId);
      set({
        cart: target.items,
        activeCustomer: target.customer || null,
        heldCarts: updatedHeld,
      });
      saveAndBroadcast({ heldCarts: updatedHeld });
    },

    deleteHeldCart: (heldCartId) => {
      const updatedHeld = get().heldCarts.filter((h) => h.id !== heldCartId);
      saveAndBroadcast({ heldCarts: updatedHeld });
    },

    // Checkout execution
    checkout: (paymentDetail, cashier) => {
      const { cart, products, activeCustomer, settings, orders, customers } = get();
      if (cart.length === 0) {
        return { success: false, error: 'Cart is empty' };
      }

      // Check stock sufficiency
      for (const item of cart) {
        const prod = products.find((p) => p.id === item.product.id);
        if (!prod || prod.stock < item.quantity) {
          posSound.playErrorBeep();
          return {
            success: false,
            error: `Insufficient stock for ${item.product.name} (Available: ${prod?.stock || 0})`,
          };
        }
      }

      const now = new Date();
      const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(orders.length + 1001).padStart(4, '0')}`;

      let subtotal = 0;
      let totalDiscount = 0;
      let totalGst = 0;
      let grandTotal = 0;
      let totalCost = 0;

      const orderItems = cart.map((item) => {
        subtotal += item.sellingPrice * item.quantity;
        totalDiscount += item.discountAmount;
        totalGst += item.gstAmount;
        grandTotal += item.total;
        totalCost += item.product.costPrice * item.quantity;

        return {
          productId: item.product.id,
          productName: item.product.name,
          barcode: item.product.barcode,
          category: item.product.category,
          unit: item.product.unit,
          mrp: item.mrp,
          costPrice: item.product.costPrice,
          sellingPrice: item.sellingPrice,
          quantity: item.quantity,
          discountAmount: item.discountAmount,
          gstRate: item.gstRate,
          gstAmount: item.gstAmount,
          total: item.total,
        };
      });

      const netProfit = grandTotal - totalCost - (settings.taxInclusive ? 0 : totalGst);
      const pointsEarned = activeCustomer ? Math.floor(grandTotal / (settings.loyaltyPointsRatio || 100)) : 0;

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        invoiceNumber,
        items: orderItems,
        totalItems: orderItems.length,
        totalQuantity: orderItems.reduce((acc, i) => acc + i.quantity, 0),
        subtotal: Math.round(subtotal * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        totalGst: Math.round(totalGst * 100) / 100,
        grandTotal: Math.round(grandTotal),
        totalCost: Math.round(totalCost * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        paymentMethod: paymentDetail.method,
        paymentDetails: paymentDetail,
        cashier: {
          id: cashier.id,
          name: cashier.name,
          role: cashier.role,
        },
        customer: activeCustomer
          ? {
              id: activeCustomer.id,
              name: activeCustomer.name,
              phone: activeCustomer.phone,
              pointsEarned,
            }
          : undefined,
        status: 'completed',
        createdAt: now.toISOString(),
      };

      // Atomic inventory stock reduction
      const updatedProducts = products.map((prod) => {
        const cartMatch = cart.find((c) => c.product.id === prod.id);
        if (cartMatch) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartMatch.quantity),
            updatedAt: now.toISOString(),
          };
        }
        return prod;
      });

      // Update customer loyalty points and spending
      let updatedCustomers = [...customers];
      if (activeCustomer) {
        updatedCustomers = customers.map((c) => {
          if (c.id === activeCustomer.id) {
            const nextSpent = c.totalSpent + newOrder.grandTotal;
            const nextPoints = c.points + pointsEarned;
            const tier: Customer['tier'] =
              nextSpent > 50000 ? 'Platinum' : nextSpent > 20000 ? 'Gold' : 'Silver';
            return {
              ...c,
              totalSpent: nextSpent,
              points: nextPoints,
              visitCount: c.visitCount + 1,
              tier,
            };
          }
          return c;
        });
      }

      posSound.playSuccessChime();

      get().addActivity(
        'sale',
        `New Bill ${invoiceNumber} created by ${cashier.name} (${paymentDetail.method.toUpperCase()})`,
        newOrder.grandTotal
      );

      saveAndBroadcast({
        products: updatedProducts,
        orders: [newOrder, ...orders],
        customers: updatedCustomers,
        cart: [],
        activeCustomer: null,
      });

      // Persist to MongoDB Atlas
      posApi.createOrder(newOrder).catch(() => {});

      return { success: true, order: newOrder };
    },

    // Refunds and returns
    refundOrderItem: (orderId, productId, refundQty, reason, cashierName) => {
      const { orders, products } = get();
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) return false;

      const item = targetOrder.items.find((i) => i.productId === productId);
      if (!item) return false;

      const currentRefunded = item.refundedQty || 0;
      if (currentRefunded + refundQty > item.quantity) return false;

      const refundAmount = (item.total / item.quantity) * refundQty;

      // Restock inventory
      const updatedProducts = products.map((p) => {
        if (p.id === productId) {
          return { ...p, stock: p.stock + refundQty, updatedAt: new Date().toISOString() };
        }
        return p;
      });

      // Update order
      const updatedOrders = orders.map((o) => {
        if (o.id === orderId) {
          const updatedItems = o.items.map((i) =>
            i.productId === productId ? { ...i, refundedQty: (i.refundedQty || 0) + refundQty } : i
          );
          const allRefunded = updatedItems.every((i) => (i.refundedQty || 0) >= i.quantity);

          const refundRecord: RefundRecord = {
            id: `ref-${Date.now()}`,
            orderId,
            refundDate: new Date().toISOString(),
            cashierName,
            reason,
            items: [
              {
                productId: item.productId,
                productName: item.productName,
                quantity: refundQty,
                refundAmount,
              },
            ],
            totalRefunded: refundAmount,
          };

          return {
            ...o,
            items: updatedItems,
            status: allRefunded ? ('refunded' as const) : o.status,
            refunds: [...(o.refunds || []), refundRecord],
          };
        }
        return o;
      });

      get().addActivity(
        'refund',
        `Refunded ${refundQty}x ${item.productName} on Invoice #${targetOrder.invoiceNumber}`,
        refundAmount
      );

      saveAndBroadcast({ products: updatedProducts, orders: updatedOrders });
      posApi.refundOrderItem(orderId, productId, refundQty, reason, cashierName).catch(() => {});
      return true;
    },

    voidOrder: (orderId, cashierName, reason) => {
      const { orders, products } = get();
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder || targetOrder.status === 'voided') return false;

      // Restock all items
      const updatedProducts = products.map((prod) => {
        const matched = targetOrder.items.find((i) => i.productId === prod.id);
        if (matched) {
          const restockQty = matched.quantity - (matched.refundedQty || 0);
          return { ...prod, stock: prod.stock + restockQty, updatedAt: new Date().toISOString() };
        }
        return prod;
      });

      const updatedOrders = orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'voided' as const,
            }
          : o
      );

      get().addActivity(
        'refund',
        `Voided Invoice #${targetOrder.invoiceNumber} by ${cashierName}: ${reason}`,
        targetOrder.grandTotal
      );

      saveAndBroadcast({ products: updatedProducts, orders: updatedOrders });
      posApi.voidOrder(orderId, cashierName, reason).catch(() => {});
      return true;
    },

    deleteOrder: (orderId, restoreStock = true) => {
      const { orders, products } = get();
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) return false;

      let updatedProducts = products;
      if (restoreStock && targetOrder.status !== 'voided') {
        updatedProducts = products.map((prod) => {
          const matched = targetOrder.items.find((i) => i.productId === prod.id);
          if (matched) {
            const restockQty = matched.quantity - (matched.refundedQty || 0);
            return { ...prod, stock: prod.stock + restockQty, updatedAt: new Date().toISOString() };
          }
          return prod;
        });
      }

      const updatedOrders = orders.filter((o) => o.id !== orderId);
      get().addActivity(
        'sale',
        `Deleted Invoice #${targetOrder.invoiceNumber} from registry ${restoreStock ? '(stock restored)' : ''}`
      );

      saveAndBroadcast({ products: updatedProducts, orders: updatedOrders });
      posApi.deleteOrder(orderId, restoreStock).catch(() => {});
      return true;
    },

    deleteOrders: (orderIds, restoreStock = true) => {
      const { orders, products } = get();
      const targetOrders = orders.filter((o) => orderIds.includes(o.id));
      if (targetOrders.length === 0) return false;

      let updatedProducts = products;
      if (restoreStock) {
        updatedProducts = products.map((prod) => {
          let extraStock = 0;
          targetOrders.forEach((to) => {
            if (to.status !== 'voided') {
              const matched = to.items.find((i) => i.productId === prod.id);
              if (matched) {
                extraStock += matched.quantity - (matched.refundedQty || 0);
              }
            }
          });
          if (extraStock > 0) {
            return { ...prod, stock: prod.stock + extraStock, updatedAt: new Date().toISOString() };
          }
          return prod;
        });
      }

      const updatedOrders = orders.filter((o) => !orderIds.includes(o.id));
      get().addActivity(
        'sale',
        `Bulk deleted ${targetOrders.length} invoices from registry ${restoreStock ? '(stock restored)' : ''}`
      );

      saveAndBroadcast({ products: updatedProducts, orders: updatedOrders });
      posApi.bulkDeleteOrders(orderIds, restoreStock).catch(() => {});
      return true;
    },

    clearAllOrders: (restoreStock = true) => {
      const { orders, products } = get();
      if (orders.length === 0) return;

      let updatedProducts = products;
      if (restoreStock) {
        updatedProducts = products.map((prod) => {
          let extraStock = 0;
          orders.forEach((to) => {
            if (to.status !== 'voided') {
              const matched = to.items.find((i) => i.productId === prod.id);
              if (matched) {
                extraStock += matched.quantity - (matched.refundedQty || 0);
              }
            }
          });
          if (extraStock > 0) {
            return { ...prod, stock: prod.stock + extraStock, updatedAt: new Date().toISOString() };
          }
          return prod;
        });
      }

      get().addActivity(
        'sale',
        `Cleared all ${orders.length} orders from registry ${restoreStock ? '(stock restored)' : ''}`
      );

      saveAndBroadcast({ products: updatedProducts, orders: [] });
      posApi.clearAllOrders(restoreStock).catch(() => {});
    },

    // Stock adjustments
    adjustStock: (productId, newStock, reason, note, cashierName) => {
      const { products } = get();
      const targetProd = products.find((p) => p.id === productId);
      if (!targetProd) return;

      const previousStock = targetProd.stock;
      const difference = newStock - previousStock;

      const adjustment: StockAdjustment = {
        id: `adj-${Date.now()}`,
        productId,
        productName: targetProd.name,
        barcode: targetProd.barcode,
        previousStock,
        newStock,
        changeQuantity: difference,
        reason,
        note,
        cashierName,
        createdAt: new Date().toISOString(),
      };

      const updatedProducts = products.map((p) =>
        p.id === productId ? { ...p, stock: newStock, updatedAt: new Date().toISOString() } : p
      );

      get().addActivity(
        'stock',
        `Adjusted stock for ${targetProd.name}: ${previousStock} ➔ ${newStock} (${reason})`
      );

      saveAndBroadcast({
        products: updatedProducts,
        stockAdjustments: [adjustment, ...get().stockAdjustments],
      });

      posApi.createStockAdjustment(adjustment).catch(() => {});
    },

    // Suppliers
    addSupplier: (supplierData) => {
      const newSup: Supplier = { ...supplierData, id: `sup-${Date.now()}` };
      saveAndBroadcast({ suppliers: [...get().suppliers, newSup] });
      posApi.createSupplier(newSup).catch(() => {});
    },
    updateSupplier: (id, updates) => {
      const updated = get().suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s));
      saveAndBroadcast({ suppliers: updated });
      posApi.updateSupplier(id, updates).catch(() => {});
    },
    deleteSupplier: (id) => {
      saveAndBroadcast({ suppliers: get().suppliers.filter((s) => s.id !== id) });
      posApi.deleteSupplier(id).catch(() => {});
    },

    // Customers
    addCustomer: (data) => {
      const newCust: Customer = {
        ...data,
        id: `cust-${Date.now()}`,
        points: 0,
        totalSpent: 0,
        visitCount: 1,
        tier: 'Silver',
      };
      saveAndBroadcast({ customers: [newCust, ...get().customers] });
      posApi.createCustomer(newCust).catch(() => {});
      return newCust;
    },
    updateCustomer: (id, updates) => {
      const updated = get().customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveAndBroadcast({ customers: updated });
      posApi.updateCustomer(id, updates).catch(() => {});
    },

    // Settings
    updateSettings: (updates) => {
      const updated = { ...get().settings, ...updates };
      posSound.enabled = updated.soundEnabled;
      saveAndBroadcast({ settings: updated });
      posApi.updateSettings(updated).catch(() => {});
    },

    // Bill Format
    billFormat: defaultBillFormat,
    updateBillFormat: (updates) => {
      const updated = { ...get().billFormat, ...updates };
      saveAndBroadcast({ billFormat: updated });
      posApi.updateBillFormat(updated).catch(() => {});
    },
    resetBillFormat: () => {
      saveAndBroadcast({ billFormat: INITIAL_BILL_FORMAT });
      posApi.updateBillFormat(INITIAL_BILL_FORMAT).catch(() => {});
    },

    // Cashiers
    switchCashier: (cashierId, pin) => {
      const cleanPin = pin.trim();
      const target = get().cashiers.find((c) => c.id === cashierId && c.active);
      if (
        target &&
        (target.pin === cleanPin || (target.role === 'admin' && cleanPin === 'drushika6'))
      ) {
        set({ currentCashier: target });
        get().addActivity('sale', `Cashier switched to ${target.name}`);
        return true;
      }
      posSound.playErrorBeep();
      return false;
    },
    addCashier: (data) => {
      const newCashier: CashierUser = { ...data, id: `usr-${Date.now()}` };
      saveAndBroadcast({ cashiers: [...get().cashiers, newCashier] });
      posApi.createCashier(newCashier).catch(() => {});
    },
    updateCashier: (id, updates) => {
      const updated = get().cashiers.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveAndBroadcast({ cashiers: updated });
      posApi.updateCashier(id, updates).catch(() => {});
    },

    // Activity
    addActivity: (type, text, amount) => {
      const newAct: ActivityItem = {
        id: `act-${Date.now()}`,
        type,
        text,
        amount,
        timestamp: new Date().toISOString(),
      };
      set({ activities: [newAct, ...get().activities.slice(0, 49)] });
      posApi.createActivity(newAct).catch(() => {});
    },

    // Reset & Backup
    resetToDemoData: () => {
      const resetProds = INITIAL_PRODUCTS;
      const cleanState = {
        products: resetProds,
        orders: [],
        cart: [],
        heldCarts: [],
        activeCustomer: null,
        stockAdjustments: [],
        suppliers: INITIAL_SUPPLIERS,
        customers: INITIAL_CUSTOMERS,
        settings: INITIAL_SETTINGS,
        billFormat: INITIAL_BILL_FORMAT,
        cashiers: INITIAL_CASHIERS,
        currentCashier: INITIAL_CASHIERS[0],
        activities: [
          {
            id: `act-${Date.now()}`,
            type: 'sale' as const,
            text: 'System database initialized with Kalaasagar master catalog',
            timestamp: new Date().toISOString(),
          },
        ],
      };
      saveAndBroadcast(cleanState);
      posApi.reloadMasterCatalog().catch(() => {});
      posApi.clearAllOrders(false).catch(() => {});
    },

    exportDatabaseBackup: () => {
      const state = {
        products: get().products,
        orders: get().orders,
        heldCarts: get().heldCarts,
        stockAdjustments: get().stockAdjustments,
        suppliers: get().suppliers,
        customers: get().customers,
        settings: get().settings,
        billFormat: get().billFormat,
        cashiers: get().cashiers,
        version: '1.0',
        exportedAt: new Date().toISOString(),
      };
      return JSON.stringify(state, null, 2);
    },

    restoreDatabaseBackup: (jsonContent) => {
      try {
        const parsed = JSON.parse(jsonContent);
        if (parsed.products && parsed.orders) {
          saveAndBroadcast({
            products: parsed.products,
            orders: parsed.orders,
            heldCarts: parsed.heldCarts || [],
            stockAdjustments: parsed.stockAdjustments || [],
            suppliers: parsed.suppliers || INITIAL_SUPPLIERS,
            customers: parsed.customers || INITIAL_CUSTOMERS,
            settings: parsed.settings || INITIAL_SETTINGS,
            billFormat: parsed.billFormat || INITIAL_BILL_FORMAT,
            cashiers: parsed.cashiers || INITIAL_CASHIERS,
            cart: [],
            activeCustomer: null,
          });
          get().addActivity('stock', 'Database restored from JSON backup');
          return true;
        }
      } catch (e) {
        console.error('Failed to restore backup JSON:', e);
      }
      return false;
    },
  };
});

// Auto-trigger MongoDB Atlas initial sync
if (typeof window !== 'undefined') {
  setTimeout(() => {
    usePosStore.getState().fetchFromDatabase();
  }, 100);
}

// Real-time multi-tab synchronization listener
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data && event.data.type === 'SYNC_STATE' && event.data.payload) {
      usePosStore.setState(event.data.payload);
    }
  };
}
