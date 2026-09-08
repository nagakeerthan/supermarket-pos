export type CategoryType =
  | 'Groceries & Staples'
  | 'Dairy & Eggs'
  | 'Beverages'
  | 'Snacks & Branded Foods'
  | 'Personal Care'
  | 'Home & Kitchen'
  | 'Fruits & Vegetables'
  | 'Bakery & Cakes'
  | 'Frozen & Ready to Eat'
  | 'Baby & Child Care';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: CategoryType;
  brand: string;
  mrp: number;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockLevel: number;
  unit: 'pcs' | 'kg' | 'g' | 'L' | 'ml' | 'pack' | 'box';
  gstRate: number; // e.g. 0, 5, 12, 18, 28
  image?: string;
  description: string;
  supplier: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  sellingPrice: number; // Editable per transaction
  mrp: number;
  discountPercent: number;
  discountAmount: number;
  gstRate: number;
  gstAmount: number;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points: number;
  totalSpent: number;
  visitCount: number;
  tier?: 'Silver' | 'Gold' | 'Platinum';
}

export interface HeldCart {
  id: string;
  name: string;
  customer?: Customer;
  items: CartItem[];
  createdAt: string;
  note?: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'split';

export interface PaymentDetail {
  method: PaymentMethod;
  amount: number;
  tenderAmount?: number;
  changeReturned?: number;
  upiRef?: string;
  cardLast4?: string;
  splitDetails?: {
    cash?: number;
    upi?: number;
    card?: number;
  };
}

export interface OrderItem {
  productId: string;
  productName: string;
  barcode: string;
  category: string;
  unit: string;
  mrp: number;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  discountAmount: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  refundedQty?: number;
}

export interface RefundRecord {
  id: string;
  orderId: string;
  refundDate: string;
  cashierName: string;
  reason: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    refundAmount: number;
  }[];
  totalRefunded: number;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  items: OrderItem[];
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  grandTotal: number;
  totalCost: number;
  netProfit: number;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetail;
  cashier: {
    id: string;
    name: string;
    role: 'admin' | 'manager' | 'cashier';
  };
  customer?: {
    id: string;
    name: string;
    phone: string;
    pointsEarned: number;
  };
  status: 'completed' | 'refunded' | 'partially_refunded' | 'voided';
  refunds?: RefundRecord[];
  createdAt: string;
}

export type AdjustmentReason =
  | 'damage'
  | 'theft'
  | 'expired'
  | 'restock'
  | 'audit'
  | 'return';

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  previousStock: number;
  newStock: number;
  changeQuantity: number;
  reason: AdjustmentReason;
  note: string;
  cashierName: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  email: string;
  gstin: string;
  fssaiNumber: string;
  receiptHeader: string;
  receiptFooter: string;
  returnPolicy: string;
  currencySymbol: string;
  taxInclusive: boolean;
  thermalPaperSize: '58mm' | '80mm' | 'A4';
  autoPrintReceipt: boolean;
  soundEnabled: boolean;
  loyaltyPointsRatio: number; // ₹ spent per 1 point (e.g. 100)
}

export interface CashierUser {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'manager' | 'cashier';
  pin: string;
  avatar?: string;
  active: boolean;
}

export interface LabelTemplate {
  paperWidth: '58mm' | '80mm' | 'A4';
  showBarcode: boolean;
  showQr: boolean;
  showMrp: boolean;
  showDiscountBadge: boolean;
  showStoreName: boolean;
  fontSize: 'small' | 'medium' | 'large';
  storeLogoUrl?: string;
}

export interface CustomBillField {
  id: string;
  label: string;
  value: string;
  section: 'header' | 'metadata' | 'totals' | 'footer';
  enabled: boolean;
}

export interface CustomTotalRow {
  id: string;
  label: string;
  amount: number;
  type: 'charge' | 'discount' | 'tax' | 'roundoff' | 'tip' | 'custom';
  enabled: boolean;
  isPercentage?: boolean;
  percentageRate?: number;
}

export interface EditableBillItem {
  id: string;
  productName: string;
  barcode?: string;
  hsnCode?: string;
  unit: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  discountAmount: number;
  gstRate: number;
  total: number;
}

export interface CustomBillCharge {
  id: string;
  label: string;
  amount: number; // positive for charge, negative for discount
  enabled: boolean;
}

export interface CustomBillBanner {
  id: string;
  text: string;
  position: 'top' | 'middle' | 'bottom';
  style: 'bordered' | 'solid' | 'highlight';
  enabled: boolean;
}

export interface FreeTextNote {
  id: string;
  text: string;
  position: 'after_header' | 'after_items' | 'after_totals' | 'footer';
  enabled: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface BillCustomLabels {
  invoiceTitle: string;
  invoiceNoLabel: string;
  dateLabel: string;
  cashierLabel: string;
  customerLabel: string;
  phoneLabel: string;
  paymentModeLabel: string;
  tokenLabel: string;
  itemHeader: string;
  qtyHeader: string;
  mrpHeader: string;
  rateHeader: string;
  totalHeader: string;
  subtotalLabel: string;
  discountLabel: string;
  netPayableLabel: string;
  tenderedLabel: string;
  changeLabel: string;
  itemsCountLabel: string;
  savingsBannerText: string;
  signatureText: string;
}

export interface BillFormatConfig {
  paperSize: '58mm' | '80mm' | 'A4';
  fontFamily: 'monospace' | 'sans' | 'serif';
  fontSize: 'compact' | 'normal' | 'large';
  dividerStyle: 'dashed' | 'dotted' | 'solid' | 'double';

  // Header options
  showStoreLogo: boolean;
  storeLogoUrl?: string;
  storeName: string;
  tagline: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  email: string;
  gstin: string;
  fssaiNumber: string;
  headerCustomText: string;
  headerAlignment: 'left' | 'center' | 'right';

  // Invoice Metadata options
  showInvoiceNumber: boolean;
  showDateTime: boolean;
  showCashierName: boolean;
  showCustomerName: boolean;
  showCustomerPhone: boolean;
  showLoyaltyPoints: boolean;
  showPaymentMethod: boolean;
  showTokenNumber: boolean;

  // Item Table Columns
  showItemIndex: boolean;
  showBarcode: boolean;
  showUnit: boolean;
  showMrp: boolean;
  showRate: boolean;
  showDiscountPerItem: boolean;
  showGstPerItem: boolean;
  showHsnCode: boolean;

  // Totals & Calculations
  showSubtotal: boolean;
  showTotalDiscount: boolean;
  showSavingsBanner: boolean;
  showGstSummary: boolean;
  showItemCountQty: boolean;
  showTenderAndChange: boolean;
  roundingMode?: 'none' | 'nearest_1' | 'nearest_half' | 'round_down' | 'round_up';
  taxMode?: 'inclusive' | 'exclusive';
  customCurrencySymbol?: string;

  // Footer & Signature
  thankYouMessage: string;
  returnPolicy: string;
  footerCustomNote: string;
  showBarcodeFooter: boolean;
  showQrCodeFooter: boolean;
  qrCodeType: 'upi' | 'invoice' | 'website';
  qrCustomValue?: string;
  socialHandles?: string;
  showSignature: boolean;
  signatureLabel: string;

  // Custom Totals & Overrides
  overrideTotalEnabled: boolean;
  overrideTotalAmount?: number;
  subtotalOverride?: number;
  discountOverride?: number;
  customTotalRows: CustomTotalRow[];

  // Section Visibility Toggles (allows removing any section)
  visibleSections: {
    header: boolean;
    metadata: boolean;
    itemsTable: boolean;
    totals: boolean;
    gstBreakdown: boolean;
    savingsBanner: boolean;
    footer: boolean;
    barcode: boolean;
    qrCode: boolean;
    signature: boolean;
  };

  // Dynamic Custom Additions & Labels
  customLabels: BillCustomLabels;
  customFields: CustomBillField[];
  customCharges: CustomBillCharge[];
  customBanners: CustomBillBanner[];
  freeTextNotes?: FreeTextNote[];
}
