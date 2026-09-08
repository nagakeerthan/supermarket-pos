import dns from 'dns';
// Set public DNS to prevent Atlas querySrv ECONNREFUSED on Windows Node.js
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('DNS server override warning:', e.message);
}

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing in .env file!');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const client = new MongoClient(MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 15000,
  serverSelectionTimeoutMS: 15000,
});

let db;
let productsCol;
let ordersCol;
let customersCol;
let suppliersCol;
let cashiersCol;
let settingsCol;
let billFormatCol;
let stockAdjustmentsCol;
let activitiesCol;

// Default System Baselines
const INITIAL_SETTINGS = {
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
  loyaltyPointsRatio: 100,
};

const INITIAL_BILL_FORMAT = {
  paperSize: '80mm',
  fontFamily: 'monospace',
  fontSize: 'normal',
  dividerStyle: 'dashed',
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
  showInvoiceNumber: true,
  showDateTime: true,
  showCashierName: true,
  showCustomerName: true,
  showCustomerPhone: true,
  showLoyaltyPoints: true,
  showPaymentMethod: true,
  showTokenNumber: false,
  showItemIndex: true,
  showBarcode: false,
  showUnit: false,
  showMrp: true,
  showRate: true,
  showDiscountPerItem: true,
  showGstPerItem: false,
  showHsnCode: false,
  showSubtotal: true,
  showTotalDiscount: true,
  showSavingsBanner: true,
  showGstSummary: true,
  showItemCountQty: true,
  showTenderAndChange: true,
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
  overrideTotalEnabled: false,
  overrideTotalAmount: undefined,
  customTotalRows: [
    { id: 'tr-1', label: 'Eco Friendly Carry Bag', amount: 5, type: 'charge', enabled: false },
    { id: 'tr-2', label: 'Express Home Delivery', amount: 30, type: 'charge', enabled: false },
    { id: 'tr-3', label: 'Rounding Adjustment', amount: -0.45, type: 'roundoff', enabled: false },
    { id: 'tr-4', label: 'Special Member Coupon', amount: -50, type: 'discount', enabled: false },
  ],
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
  customFields: [
    { id: 'f-1', label: 'Branch Code', value: 'KLS-01', section: 'header', enabled: false },
    { id: 'f-2', label: 'Drug License', value: '20B/21B-8942', section: 'header', enabled: false },
    { id: 'f-3', label: 'Counter No', value: 'POS Terminal #01', section: 'metadata', enabled: false },
    { id: 'f-4', label: 'Jurisdiction', value: 'Subject to Local Jurisdiction', section: 'footer', enabled: false },
  ],
  customCharges: [
    { id: 'c-1', label: 'Eco Friendly Carry Bag', amount: 5, enabled: false },
    { id: 'c-2', label: 'Express Home Delivery', amount: 30, enabled: false },
  ],
  customBanners: [
    { id: 'b-1', text: '🎉 Special Offers & Member Discounts Available!', position: 'top', style: 'highlight', enabled: false },
    { id: 'b-2', text: '⭐ Download our Supermarket App for exclusive member discounts!', position: 'bottom', style: 'bordered', enabled: false },
  ],
};

const INITIAL_ADMIN = {
  id: 'usr-admin',
  name: 'Kalaasagar Admin',
  username: 'kalaasagar',
  role: 'admin',
  pin: 'drushika6',
  active: true,
};

async function initDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas successfully');

    db = client.db('kalaasagar_pos');
    productsCol = db.collection('products');
    ordersCol = db.collection('orders');
    customersCol = db.collection('customers');
    suppliersCol = db.collection('suppliers');
    cashiersCol = db.collection('cashiers');
    settingsCol = db.collection('settings');
    billFormatCol = db.collection('billFormat');
    stockAdjustmentsCol = db.collection('stockAdjustments');
    activitiesCol = db.collection('activities');

    // Create Indexes
    await productsCol.createIndex({ barcode: 1 });
    await productsCol.createIndex({ id: 1 }, { unique: true });
    await ordersCol.createIndex({ id: 1 }, { unique: true });
    await ordersCol.createIndex({ invoiceNumber: 1 });
    await ordersCol.createIndex({ createdAt: -1 });
    await cashiersCol.createIndex({ username: 1 });

    // Seed Settings if empty
    const settingsCount = await settingsCol.countDocuments();
    if (settingsCount === 0) {
      await settingsCol.insertOne({ id: 'store_settings', ...INITIAL_SETTINGS });
    }

    // Seed Bill Format if empty
    const billFormatCount = await billFormatCol.countDocuments();
    if (billFormatCount === 0) {
      await billFormatCol.insertOne({ id: 'bill_format_config', ...INITIAL_BILL_FORMAT });
    }

    // Seed Admin Cashier if empty or update to ensure kalaasagar / drushika6
    await cashiersCol.updateOne(
      { username: 'kalaasagar' },
      { $set: INITIAL_ADMIN },
      { upsert: true }
    );

    // Seed Products from Kalaasagar Master Catalog if empty
    const prodCount = await productsCol.countDocuments();
    console.log(`📦 Current products count in MongoDB: ${prodCount}`);
    if (prodCount === 0) {
      const itemsPath = path.join(__dirname, '../src/utils/kalaaSagarItems.json');
      if (fs.existsSync(itemsPath)) {
        const raw = fs.readFileSync(itemsPath, 'utf8');
        const items = JSON.parse(raw);
        console.log(`🚀 Seeding ${items.length} Kalaasagar products into MongoDB Atlas...`);
        const cleanedItems = items.map((item) => ({
          ...item,
          image: '', // No external dummy images
        }));
        // Insert in batches of 1000
        const batchSize = 1000;
        for (let i = 0; i < cleanedItems.length; i += batchSize) {
          const batch = cleanedItems.slice(i, i + batchSize);
          await productsCol.insertMany(batch);
        }
        console.log('✅ Seeding completed! All products stored in MongoDB.');
      }
    }

    // Initial activity if empty
    const actCount = await activitiesCol.countDocuments();
    if (actCount === 0) {
      await activitiesCol.insertOne({
        id: `act-${Date.now()}`,
        type: 'sale',
        text: 'MongoDB Atlas cloud database connected & operational',
        timestamp: new Date().toISOString(),
      });
    }

    console.log('✨ All MongoDB collections initialized and ready.');
  } catch (err) {
    console.error('❌ MongoDB Initialization error:', err);
  }
}

// ----------------------
// API ROUTES
// ----------------------

// 1. Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: db ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// 2. Full Initial State Sync (Fast single-payload hydration)
app.get('/api/data', async (req, res) => {
  try {
    const [
      products,
      orders,
      customers,
      suppliers,
      cashiers,
      settingsDoc,
      billFormatDoc,
      stockAdjustments,
      activities,
    ] = await Promise.all([
      productsCol.find({}, { projection: { _id: 0 } }).toArray(),
      ordersCol.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray(),
      customersCol.find({}, { projection: { _id: 0 } }).toArray(),
      suppliersCol.find({}, { projection: { _id: 0 } }).toArray(),
      cashiersCol.find({}, { projection: { _id: 0 } }).toArray(),
      settingsCol.findOne({ id: 'store_settings' }, { projection: { _id: 0 } }),
      billFormatCol.findOne({ id: 'bill_format_config' }, { projection: { _id: 0 } }),
      stockAdjustmentsCol.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(100).toArray(),
      activitiesCol.find({}, { projection: { _id: 0 } }).sort({ timestamp: -1 }).limit(50).toArray(),
    ]);

    res.json({
      success: true,
      products: products || [],
      orders: orders || [], // Real orders only
      customers: customers || [],
      suppliers: suppliers || [],
      cashiers: cashiers.length > 0 ? cashiers : [INITIAL_ADMIN],
      settings: settingsDoc || INITIAL_SETTINGS,
      billFormat: billFormatDoc || INITIAL_BILL_FORMAT,
      stockAdjustments: stockAdjustments || [],
      activities: activities || [],
    });
  } catch (error) {
    console.error('Failed to fetch full data from MongoDB:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Products Endpoints
app.get('/api/products', async (req, res) => {
  try {
    const products = await productsCol.find({}, { projection: { _id: 0 } }).toArray();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = {
      ...req.body,
      id: req.body.id || `prod-${Date.now()}`,
      image: req.body.image || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await productsCol.insertOne(product);
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    delete updates._id;
    await productsCol.updateOne({ id: req.params.id }, { $set: updates });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await productsCol.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products/bulk', async (req, res) => {
  try {
    const { items, mode } = req.body;
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      if (!item.barcode || !item.name) {
        skipped++;
        continue;
      }
      const existing = await productsCol.findOne({ barcode: item.barcode });
      if (existing) {
        if (mode === 'overwrite') {
          await productsCol.updateOne(
            { barcode: item.barcode },
            { $set: { ...item, updatedAt: new Date().toISOString() } }
          );
          updated++;
        } else {
          skipped++;
        }
      } else {
        await productsCol.insertOne({
          id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: item.name,
          barcode: item.barcode,
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
    }
    res.json({ success: true, imported, updated, skipped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products/reload-master', async (req, res) => {
  try {
    const itemsPath = path.join(__dirname, '../src/utils/kalaaSagarItems.json');
    if (fs.existsSync(itemsPath)) {
      const raw = fs.readFileSync(itemsPath, 'utf8');
      const items = JSON.parse(raw);
      await productsCol.deleteMany({});
      const cleanedItems = items.map((item) => ({ ...item, image: '' }));
      const batchSize = 1000;
      for (let i = 0; i < cleanedItems.length; i += batchSize) {
        const batch = cleanedItems.slice(i, i + batchSize);
        await productsCol.insertMany(batch);
      }
      res.json({ success: true, count: cleanedItems.length });
    } else {
      res.status(404).json({ error: 'Master items file not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Orders Endpoints
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await ordersCol.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = {
      ...req.body,
      id: req.body.id || `ord-${Date.now()}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
      status: req.body.status || 'completed',
    };
    await ordersCol.insertOne(order);

    // Deduct stock in MongoDB
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        await productsCol.updateOne(
          { id: item.productId },
          { $inc: { stock: -item.quantity }, $set: { updatedAt: new Date().toISOString() } }
        );
      }
    }

    // Update customer stats if customer attached
    if (order.customer && order.customer.id) {
      await customersCol.updateOne(
        { id: order.customer.id },
        {
          $inc: {
            totalSpent: order.grandTotal,
            visitCount: 1,
            points: order.customer.pointsEarned || 0,
          },
        }
      );
    }

    // Log Activity
    await activitiesCol.insertOne({
      id: `act-${Date.now()}`,
      type: 'sale',
      text: `Settled Bill #${order.invoiceNumber} (${order.paymentMethod.toUpperCase()})`,
      amount: order.grandTotal,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { restoreStock } = req.query;
    const order = await ordersCol.findOne({ id: req.params.id });
    if (order && restoreStock === 'true' && order.status !== 'voided' && order.items) {
      for (const item of order.items) {
        await productsCol.updateOne(
          { id: item.productId },
          { $inc: { stock: item.quantity }, $set: { updatedAt: new Date().toISOString() } }
        );
      }
    }
    await ordersCol.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/bulk-delete', async (req, res) => {
  try {
    const { orderIds, restoreStock } = req.body;
    if (restoreStock && Array.isArray(orderIds)) {
      const orders = await ordersCol.find({ id: { $in: orderIds } }).toArray();
      for (const order of orders) {
        if (order.status !== 'voided' && order.items) {
          for (const item of order.items) {
            await productsCol.updateOne(
              { id: item.productId },
              { $inc: { stock: item.quantity }, $set: { updatedAt: new Date().toISOString() } }
            );
          }
        }
      }
    }
    await ordersCol.deleteMany({ id: { $in: orderIds } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/clear-all', async (req, res) => {
  try {
    const { restoreStock } = req.body;
    if (restoreStock) {
      const orders = await ordersCol.find({ status: { $ne: 'voided' } }).toArray();
      for (const order of orders) {
        if (order.items) {
          for (const item of order.items) {
            await productsCol.updateOne(
              { id: item.productId },
              { $inc: { stock: item.quantity }, $set: { updatedAt: new Date().toISOString() } }
            );
          }
        }
      }
    }
    await ordersCol.deleteMany({});
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/:id/refund', async (req, res) => {
  try {
    const { productId, refundQty, reason, cashierName } = req.body;
    const order = await ordersCol.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const item = order.items.find((i) => i.productId === productId);
    if (!item) return res.status(404).json({ error: 'Item not found in order' });

    // Restock product
    await productsCol.updateOne(
      { id: productId },
      { $inc: { stock: refundQty }, $set: { updatedAt: new Date().toISOString() } }
    );

    // Record stock adjustment
    await stockAdjustmentsCol.insertOne({
      id: `adj-${Date.now()}`,
      productId,
      productName: item.productName,
      barcode: item.barcode,
      previousStock: 0,
      newStock: refundQty,
      difference: refundQty,
      reason: 'Returned Goods',
      note: `Refund for invoice #${order.invoiceNumber}: ${reason}`,
      cashierName: cashierName || 'Cashier',
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/:id/void', async (req, res) => {
  try {
    const { cashierName, reason } = req.body;
    const order = await ordersCol.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Restock all items
    if (order.items && order.status !== 'voided') {
      for (const item of order.items) {
        await productsCol.updateOne(
          { id: item.productId },
          { $inc: { stock: item.quantity }, $set: { updatedAt: new Date().toISOString() } }
        );
      }
    }

    await ordersCol.updateOne({ id: req.params.id }, { $set: { status: 'voided' } });

    await activitiesCol.insertOne({
      id: `act-${Date.now()}`,
      type: 'refund',
      text: `Voided Invoice #${order.invoiceNumber} by ${cashierName}: ${reason}`,
      amount: order.grandTotal,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Customers Endpoints
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await customersCol.find({}, { projection: { _id: 0 } }).toArray();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customer = {
      ...req.body,
      id: req.body.id || `cust-${Date.now()}`,
      points: req.body.points || 0,
      totalSpent: req.body.totalSpent || 0,
      visitCount: req.body.visitCount || 1,
      tier: req.body.tier || 'Silver',
    };
    await customersCol.insertOne(customer);
    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    await customersCol.updateOne({ id: req.params.id }, { $set: updates });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Suppliers Endpoints
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await suppliersCol.find({}, { projection: { _id: 0 } }).toArray();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const supplier = { ...req.body, id: req.body.id || `sup-${Date.now()}` };
    await suppliersCol.insertOne(supplier);
    res.json({ success: true, supplier });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    await suppliersCol.updateOne({ id: req.params.id }, { $set: updates });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await suppliersCol.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Cashiers Endpoints
app.get('/api/cashiers', async (req, res) => {
  try {
    const cashiers = await cashiersCol.find({}, { projection: { _id: 0 } }).toArray();
    res.json(cashiers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cashiers', async (req, res) => {
  try {
    const cashier = { ...req.body, id: req.body.id || `usr-${Date.now()}` };
    await cashiersCol.insertOne(cashier);
    res.json({ success: true, cashier });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cashiers/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    await cashiersCol.updateOne({ id: req.params.id }, { $set: updates });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Settings & Bill Format Endpoints
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await settingsCol.findOne({ id: 'store_settings' }, { projection: { _id: 0 } });
    res.json(settings || INITIAL_SETTINGS);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const updates = { ...req.body, id: 'store_settings' };
    delete updates._id;
    await settingsCol.updateOne({ id: 'store_settings' }, { $set: updates }, { upsert: true });
    res.json({ success: true, settings: updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bill-format', async (req, res) => {
  try {
    const config = await billFormatCol.findOne({ id: 'bill_format_config' }, { projection: { _id: 0 } });
    res.json(config || INITIAL_BILL_FORMAT);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bill-format', async (req, res) => {
  try {
    const updates = { ...req.body, id: 'bill_format_config' };
    delete updates._id;
    await billFormatCol.updateOne({ id: 'bill_format_config' }, { $set: updates }, { upsert: true });
    res.json({ success: true, billFormat: updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Stock Adjustments & Activities
app.get('/api/stock-adjustments', async (req, res) => {
  try {
    const list = await stockAdjustmentsCol.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(100).toArray();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stock-adjustments', async (req, res) => {
  try {
    const adj = { ...req.body, id: req.body.id || `adj-${Date.now()}`, createdAt: new Date().toISOString() };
    await stockAdjustmentsCol.insertOne(adj);
    // Update product stock
    await productsCol.updateOne(
      { id: adj.productId },
      { $set: { stock: adj.newStock, updatedAt: new Date().toISOString() } }
    );
    res.json({ success: true, adjustment: adj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const list = await activitiesCol.find({}, { projection: { _id: 0 } }).sort({ timestamp: -1 }).limit(50).toArray();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/activities', async (req, res) => {
  try {
    const act = { ...req.body, id: req.body.id || `act-${Date.now()}`, timestamp: new Date().toISOString() };
    await activitiesCol.insertOne(act);
    res.json({ success: true, activity: act });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Serve static frontend assets in production (when dist exists)
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA Fallback: serve index.html for non-API GET requests (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Kalaasagar POS Server running on http://localhost:${PORT}`);
  await initDatabase();
});

