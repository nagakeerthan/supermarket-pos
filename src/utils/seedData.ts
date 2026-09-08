import { Product, Order, Supplier, CashierUser, StoreSettings, Customer, BillFormatConfig } from '../types';
import kalaaSagarItems from './kalaaSagarItems.json';

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'Kalaasagar SuperMarket',
  tagline: 'Fresh Everyday • Guaranteed Low Prices',
  address: 'Plot 42, Sector 17, Main Market Road',
  city: 'Mumbai',
  pincode: '400001',
  phone: '+91 98201 12345',
  email: 'care@kalaasagar.in',
  gstin: '27AABCU9603R1ZM',
  fssaiNumber: '11518001000234',
  receiptHeader: 'Kalaasagar SuperMarket',
  receiptFooter: 'THANK YOU FOR SHOPPING WITH US! VISIT AGAIN',
  returnPolicy: 'Goods once sold can be exchanged within 7 days with original invoice.',
  currencySymbol: '₹',
  taxInclusive: true,
  thermalPaperSize: '80mm',
  autoPrintReceipt: false,
  soundEnabled: true,
  loyaltyPointsRatio: 100, // 1 point per ₹100 spent
};

export const INITIAL_BILL_FORMAT: BillFormatConfig = {
  paperSize: '80mm',
  fontFamily: 'monospace',
  fontSize: 'normal',
  dividerStyle: 'dashed',

  // Header options
  showStoreLogo: true,
  storeLogoUrl: '',
  storeName: 'Kalaasagar SuperMarket',
  tagline: 'Fresh Everyday • Guaranteed Low Prices',
  address: 'Plot 42, Sector 17, Main Market Road',
  city: 'Mumbai',
  pincode: '400001',
  phone: '+91 98201 12345',
  email: 'care@kalaasagar.in',
  gstin: '27AABCU9603R1ZM',
  fssaiNumber: '11518001000234',
  headerCustomText: 'TAX INVOICE / RETAIL BILL',
  headerAlignment: 'center',

  // Invoice Metadata
  showInvoiceNumber: true,
  showDateTime: true,
  showCashierName: true,
  showCustomerName: true,
  showCustomerPhone: true,
  showLoyaltyPoints: true,
  showPaymentMethod: true,
  showTokenNumber: false,

  // Item Table Columns
  showItemIndex: true,
  showBarcode: false,
  showUnit: false,
  showMrp: true,
  showRate: true,
  showDiscountPerItem: true,
  showGstPerItem: false,
  showHsnCode: false,

  // Totals & Calculations
  showSubtotal: true,
  showTotalDiscount: true,
  showSavingsBanner: true,
  showGstSummary: true,
  showItemCountQty: true,
  showTenderAndChange: true,

  // Footer options
  thankYouMessage: 'THANK YOU FOR SHOPPING WITH US! VISIT AGAIN 😊',
  returnPolicy: 'Goods once sold can be exchanged within 7 days with original invoice.',
  footerCustomNote: 'For home delivery & orders, WhatsApp +91 98201 12345',
  showBarcodeFooter: true,
  showQrCodeFooter: true,
  qrCodeType: 'upi',
  qrCustomValue: 'upi://pay?pa=kalaasagar@okhdfcbank&pn=Kalaasagar%20Supermarket',
  socialHandles: 'Instagram: @kalaasagarmarket | www.kalaasagar.com',
  showSignature: false,
  signatureLabel: 'Authorized Signatory',

  // Customizable Labels Dictionary
  customLabels: {
    invoiceTitle: 'TAX INVOICE / RETAIL BILL',
    invoiceNoLabel: 'INVOICE NO:',
    dateLabel: 'DATE & TIME:',
    cashierLabel: 'CASHIER:',
    customerLabel: 'CUSTOMER:',
    phoneLabel: 'PHONE:',
    paymentModeLabel: 'PAYMENT MODE:',
    tokenLabel: 'TOKEN NO:',
    itemHeader: 'ITEM DESCRIPTION',
    qtyHeader: 'QTY',
    mrpHeader: 'MRP',
    rateHeader: 'RATE',
    totalHeader: 'TOTAL',
    subtotalLabel: 'SUBTOTAL:',
    discountLabel: 'TOTAL SAVINGS:',
    netPayableLabel: 'NET AMOUNT PAYABLE:',
    tenderedLabel: 'AMOUNT TENDERED:',
    changeLabel: 'CHANGE RETURNED:',
    itemsCountLabel: 'TOTAL ITEMS:',
    savingsBannerText: '★ YOU SAVED {amount} ON THIS PURCHASE! ★',
    signatureText: 'Authorized Signatory',
  },

  // Custom Totals & Overrides
  overrideTotalEnabled: false,
  overrideTotalAmount: undefined,
  customTotalRows: [
    { id: 'tr-1', label: 'Eco Friendly Carry Bag', amount: 5, type: 'charge', enabled: false },
    { id: 'tr-2', label: 'Express Home Delivery', amount: 30, type: 'charge', enabled: false },
    { id: 'tr-3', label: 'Rounding Adjustment', amount: -0.45, type: 'roundoff', enabled: false },
    { id: 'tr-4', label: 'Special Member Coupon', amount: -50, type: 'discount', enabled: false },
  ],

  // Section Visibility Toggles
  visibleSections: {
    header: true,
    metadata: true,
    itemsTable: true,
    totals: true,
    gstBreakdown: true,
    savingsBanner: true,
    footer: true,
    barcode: true,
    qrCode: true,
    signature: false,
  },

  // Dynamic Custom Key-Value Fields
  customFields: [
    { id: 'f-1', label: 'Branch Code', value: 'KLS-01', section: 'header', enabled: false },
    { id: 'f-2', label: 'Drug License', value: '20B/21B-8942', section: 'header', enabled: false },
    { id: 'f-3', label: 'Counter No', value: 'POS Terminal #01', section: 'metadata', enabled: false },
    { id: 'f-4', label: 'Jurisdiction', value: 'Subject to Local Jurisdiction', section: 'footer', enabled: false },
  ],

  // Dynamic Custom Extra Charges / Discounts
  customCharges: [
    { id: 'c-1', label: 'Eco Friendly Carry Bag', amount: 5, enabled: false },
    { id: 'c-2', label: 'Express Home Delivery', amount: 30, enabled: false },
  ],

  // Dynamic Banners & Announcements
  customBanners: [
    { id: 'b-1', text: '🎉 Special Offers & Member Discounts Available!', position: 'top', style: 'highlight', enabled: false },
    { id: 'b-2', text: '⭐ Download our Supermarket App for exclusive member discounts!', position: 'bottom', style: 'bordered', enabled: false },
  ],
};

// Administrator and Cashier credentials
export const INITIAL_CASHIERS: CashierUser[] = [
  {
    id: 'usr-admin',
    name: 'Kalaasagar Admin',
    username: 'kalaasagar',
    role: 'admin',
    pin: 'drushika6',
    active: true,
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

// All 8,914 items from Kalaa Sagar Excel inventory master sheet
export const INITIAL_PRODUCTS: Product[] = (kalaaSagarItems as unknown as Product[]) || [];

// Seed orders helper for fresh real database initialized empty
export function generateSeedOrders(_products?: Product[]): Order[] {
  return [];
}
