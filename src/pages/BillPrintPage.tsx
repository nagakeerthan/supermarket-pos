import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  CheckCircle2,
  RotateCcw,
  Download,
  Eye,
  Store,
  Layers,
  Sparkles,
  QrCode,
  Save,
  ZoomIn,
  ZoomOut,
  User,
  Plus,
  Trash2,
  PenTool,
  Megaphone,
  Type,
  Calculator,
  PlusCircle,
  ShoppingBag,
  Sliders,
  DollarSign,
  FileText,
  X,
} from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import {
  BillFormatConfig,
  Order,
  CustomBillField,
  CustomBillCharge,
  CustomBillBanner,
  CustomTotalRow,
  EditableBillItem,
  BillCustomLabels,
  FreeTextNote,
} from '../types';
import { INITIAL_BILL_FORMAT } from '../utils/seedData';
import { generateInvoicePdf } from '../utils/pdfExport';
import { BillReceiptView } from '../components/common/BillReceiptView';

export const BillPrintPage: React.FC = () => {
  const { orders, settings, billFormat, updateBillFormat, resetBillFormat } = usePosStore();

  // Local draft format configuration state
  const [config, setConfig] = useState<BillFormatConfig>(() => {
    return {
      ...INITIAL_BILL_FORMAT,
      ...billFormat,
      visibleSections: {
        ...INITIAL_BILL_FORMAT.visibleSections,
        ...(billFormat?.visibleSections || {}),
      },
      customLabels: {
        ...INITIAL_BILL_FORMAT.customLabels,
        ...(billFormat?.customLabels || {}),
      },
      customTotalRows: billFormat?.customTotalRows || INITIAL_BILL_FORMAT.customTotalRows,
      customFields: billFormat?.customFields || INITIAL_BILL_FORMAT.customFields,
      customCharges: billFormat?.customCharges || INITIAL_BILL_FORMAT.customCharges,
      customBanners: billFormat?.customBanners || INITIAL_BILL_FORMAT.customBanners,
      freeTextNotes: billFormat?.freeTextNotes || [],
    };
  });

  // Whenever config changes, auto-save to POS Store so all checkouts immediately reflect the changes
  const applyConfigUpdate = (updater: (prev: BillFormatConfig) => BillFormatConfig) => {
    setConfig((prev) => {
      const next = updater(prev);
      updateBillFormat(next);
      return next;
    });
  };

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders.length > 0 ? orders[0].id : 'sample'
  );

  // Active navigation tab on left panel
  const [activeTab, setActiveTab] = useState<
    'totals' | 'items' | 'layout' | 'sections' | 'header' | 'customer' | 'banners' | 'freetext' | 'footer' | 'labels'
  >('totals');

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [isLiveEditMode, setIsLiveEditMode] = useState<boolean>(true);

  // Custom Items on the live preview (user can edit/add/delete items directly)
  const [customItems, setCustomItems] = useState<EditableBillItem[]>(() => [
    {
      id: 'item-1',
      productName: 'Aashirvaad Superior MP Whole Wheat Atta 5kg',
      barcode: '8901030012345',
      hsnCode: '1901',
      unit: 'kg',
      quantity: 2,
      mrp: 380,
      sellingPrice: 345,
      discountAmount: 70,
      gstRate: 0,
      total: 690,
    },
    {
      id: 'item-2',
      productName: 'Amul Butter Pasteurized 500g',
      barcode: '8901262010113',
      hsnCode: '0405',
      unit: 'pcs',
      quantity: 1,
      mrp: 275,
      sellingPrice: 260,
      discountAmount: 15,
      gstRate: 12,
      total: 260,
    },
    {
      id: 'item-3',
      productName: 'Tata Tea Gold Leaf 1kg Carton',
      barcode: '8901058000109',
      hsnCode: '0902',
      unit: 'pack',
      quantity: 1,
      mrp: 620,
      sellingPrice: 560,
      discountAmount: 60,
      gstRate: 5,
      total: 560,
    },
    {
      id: 'item-4',
      productName: 'Surf Excel Matic Liquid Detergent 2L',
      barcode: '8901030372832',
      hsnCode: '3402',
      unit: 'L',
      quantity: 1,
      mrp: 450,
      sellingPrice: 399,
      discountAmount: 51,
      gstRate: 18,
      total: 399,
    },
  ]);

  // Synchronize items when user picks a real historical order
  const syncOrderItems = (orderId: string) => {
    setSelectedOrderId(orderId);
    if (orderId === 'sample') return;
    const found = orders.find((o) => o.id === orderId);
    if (found) {
      setCustomItems(
        found.items.map((i, idx) => ({
          id: `item-${idx}-${Date.now()}`,
          productName: i.productName,
          barcode: i.barcode,
          hsnCode: '1901',
          unit: i.unit,
          quantity: i.quantity,
          mrp: i.mrp,
          sellingPrice: i.sellingPrice,
          discountAmount: i.discountAmount,
          gstRate: i.gstRate,
          total: i.total,
        }))
      );
    }
  };

  // Form input helpers for adding custom elements
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemQty, setNewItemQty] = useState<string>('1');
  const [newItemPrice, setNewItemPrice] = useState<string>('100');
  const [newItemMrp, setNewItemMrp] = useState<string>('120');
  const [newItemUnit, setNewItemUnit] = useState<string>('pcs');

  const [newTotalRowLabel, setNewTotalRowLabel] = useState<string>('');
  const [newTotalRowAmount, setNewTotalRowAmount] = useState<string>('10.00');
  const [newTotalRowType, setNewTotalRowType] = useState<CustomTotalRow['type']>('charge');

  const [newFieldLabel, setNewFieldLabel] = useState<string>('');
  const [newFieldValue, setNewFieldValue] = useState<string>('');
  const [newFieldSection, setNewFieldSection] = useState<'header' | 'metadata' | 'totals' | 'footer'>('header');

  const [newBannerText, setNewBannerText] = useState<string>('');
  const [newBannerPos, setNewBannerPos] = useState<'top' | 'middle' | 'bottom'>('top');
  const [newBannerStyle, setNewBannerStyle] = useState<'highlight' | 'bordered' | 'solid'>('highlight');

  const [newNoteText, setNewNoteText] = useState<string>('');
  const [newNotePos, setNewNotePos] = useState<FreeTextNote['position']>('after_totals');

  // Config field updater
  const handleUpdate = <K extends keyof BillFormatConfig>(key: K, value: BillFormatConfig[K]) => {
    applyConfigUpdate((prev) => ({ ...prev, [key]: value }));
  };

  // Section visibility toggle
  const toggleSection = (sectionKey: keyof BillFormatConfig['visibleSections']) => {
    applyConfigUpdate((prev) => ({
      ...prev,
      visibleSections: {
        ...prev.visibleSections,
        [sectionKey]: !prev.visibleSections[sectionKey],
      },
    }));
  };

  // Label dictionary updater
  const handleUpdateLabel = (key: keyof BillCustomLabels, value: string) => {
    applyConfigUpdate((prev) => ({
      ...prev,
      customLabels: {
        ...prev.customLabels,
        [key]: value,
      },
    }));
  };

  // Item List Management
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;

    const qty = parseFloat(newItemQty) || 1;
    const price = parseFloat(newItemPrice) || 0;
    const mrp = parseFloat(newItemMrp) || price;
    const disc = Math.max(0, (mrp - price) * qty);
    const lineTotal = price * qty;

    const item: EditableBillItem = {
      id: `custom-item-${Date.now()}`,
      productName: newItemName.trim(),
      barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      hsnCode: '1901',
      unit: newItemUnit || 'pcs',
      quantity: qty,
      mrp,
      sellingPrice: price,
      discountAmount: disc,
      gstRate: 5,
      total: lineTotal,
    };

    setCustomItems((prev) => [...prev, item]);
    setNewItemName('');
    setNewItemPrice('100');
    setNewItemMrp('120');
  };

  const handleUpdateItem = (id: string, updates: Partial<EditableBillItem>) => {
    setCustomItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = { ...item, ...updates };
          if (updates.quantity !== undefined || updates.sellingPrice !== undefined) {
            const q = updates.quantity !== undefined ? updates.quantity : item.quantity;
            const p = updates.sellingPrice !== undefined ? updates.sellingPrice : item.sellingPrice;
            next.total = q * p;
          }
          return next;
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setCustomItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Custom Totals Rows Management
  const handleAddTotalRow = (
    e?: React.FormEvent,
    presetLabel?: string,
    presetAmount?: number,
    presetType?: CustomTotalRow['type']
  ) => {
    if (e) e.preventDefault();
    const label = presetLabel || newTotalRowLabel.trim();
    if (!label) return;

    const amt = presetAmount !== undefined ? presetAmount : parseFloat(newTotalRowAmount) || 0;
    const type = presetType || newTotalRowType;

    const newRow: CustomTotalRow = {
      id: `total-row-${Date.now()}`,
      label,
      amount: type === 'discount' ? -Math.abs(amt) : amt,
      type,
      enabled: true,
    };

    applyConfigUpdate((prev) => ({
      ...prev,
      customTotalRows: [...prev.customTotalRows, newRow],
    }));

    setNewTotalRowLabel('');
    setNewTotalRowAmount('10.00');
  };

  const handleUpdateTotalRow = (id: string, updates: Partial<CustomTotalRow>) => {
    applyConfigUpdate((prev) => ({
      ...prev,
      customTotalRows: prev.customTotalRows.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  };

  const handleToggleTotalRow = (id: string) => {
    applyConfigUpdate((prev) => ({
      ...prev,
      customTotalRows: prev.customTotalRows.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    }));
  };

  const handleDeleteTotalRow = (id: string) => {
    applyConfigUpdate((prev) => ({
      ...prev,
      customTotalRows: prev.customTotalRows.filter((r) => r.id !== id),
    }));
  };

  // Custom Key-Value Fields Management
  const handleAddCustomField = (
    e?: React.FormEvent,
    overrideSection?: 'header' | 'metadata' | 'totals' | 'footer'
  ) => {
    if (e) e.preventDefault();
    if (!newFieldLabel.trim() || !newFieldValue.trim()) return;

    const newField: CustomBillField = {
      id: `field-${Date.now()}`,
      label: newFieldLabel.trim(),
      value: newFieldValue.trim(),
      section: overrideSection || newFieldSection,
      enabled: true,
    };

    applyConfigUpdate((prev) => ({
      ...prev,
      customFields: [...prev.customFields, newField],
    }));

    setNewFieldLabel('');
    setNewFieldValue('');
  };

  const handleUpdateCustomField = (id: string, updates: Partial<CustomBillField>) => {
    applyConfigUpdate((prev) => ({
      ...prev,
      customFields: prev.customFields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  };

  const handleToggleCustomField = (id: string) => {
    applyConfigUpdate((prev) => ({
      ...prev,
      customFields: prev.customFields.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
    }));
  };

  const handleDeleteCustomField = (id: string) => {
    applyConfigUpdate((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((f) => f.id !== id),
    }));
  };

  // Custom Banners Management
  const handleAddCustomBanner = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newBannerText.trim()) return;

    const newBanner: CustomBillBanner = {
      id: `banner-${Date.now()}`,
      text: newBannerText.trim(),
      position: newBannerPos,
      style: newBannerStyle,
      enabled: true,
    };

    applyConfigUpdate((prev) => ({
      ...prev,
      customBanners: [...prev.customBanners, newBanner],
    }));

    setNewBannerText('');
  };

  const handleUpdateBanner = (id: string, text: string) => {
    applyConfigUpdate((prev) => ({
      ...prev,
      customBanners: prev.customBanners.map((b) => (b.id === id ? { ...b, text } : b)),
    }));
  };

  const handleDeleteCustomBanner = (id: string) => {
    applyConfigUpdate((prev) => ({
      ...prev,
      customBanners: prev.customBanners.filter((b) => b.id !== id),
    }));
  };

  // Free Text Notes Management
  const handleAddFreeTextNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: FreeTextNote = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      position: newNotePos,
      enabled: true,
      align: 'center',
    };

    applyConfigUpdate((prev) => ({
      ...prev,
      freeTextNotes: [...(prev.freeTextNotes || []), newNote],
    }));

    setNewNoteText('');
  };

  const handleUpdateFreeTextNote = (id: string, text: string) => {
    applyConfigUpdate((prev) => ({
      ...prev,
      freeTextNotes: (prev.freeTextNotes || []).map((n) => (n.id === id ? { ...n, text } : n)),
    }));
  };

  const handleDeleteFreeTextNote = (id: string) => {
    applyConfigUpdate((prev) => ({
      ...prev,
      freeTextNotes: (prev.freeTextNotes || []).filter((n) => n.id !== id),
    }));
  };

  const currency = config.customCurrencySymbol || settings.currencySymbol || '₹';

  // Save Format as Default
  const handleSaveDefault = () => {
    updateBillFormat(config);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // Reset to Standard Defaults
  const handleResetToStandard = () => {
    const fresh = { ...INITIAL_BILL_FORMAT };
    setConfig(fresh);
    resetBillFormat();
  };

  // Preset Template Loader
  const loadPresetTemplate = (
    preset:
      | 'standard_80mm'
      | 'compact_58mm'
      | 'grocery_gst'
      | 'tax_invoice_a4'
      | 'minimalist'
      | 'restaurant_cafe'
      | 'pharmacy'
  ) => {
    let next: BillFormatConfig = { ...INITIAL_BILL_FORMAT };
    switch (preset) {
      case 'standard_80mm':
        next = {
          ...INITIAL_BILL_FORMAT,
          paperSize: '80mm',
          fontFamily: 'monospace',
          fontSize: 'normal',
          dividerStyle: 'dashed',
          showMrp: true,
          showRate: true,
          showDiscountPerItem: true,
          showSavingsBanner: true,
          showGstSummary: true,
          showBarcodeFooter: true,
          showQrCodeFooter: true,
        };
        break;
      case 'compact_58mm':
        next = {
          ...INITIAL_BILL_FORMAT,
          paperSize: '58mm',
          fontFamily: 'monospace',
          fontSize: 'compact',
          dividerStyle: 'dashed',
          showBarcode: false,
          showMrp: false,
          showDiscountPerItem: false,
          showHsnCode: false,
          showGstPerItem: false,
          showGstSummary: false,
          showBarcodeFooter: false,
          showQrCodeFooter: true,
        };
        break;
      case 'grocery_gst':
        next = {
          ...INITIAL_BILL_FORMAT,
          paperSize: '80mm',
          fontFamily: 'monospace',
          fontSize: 'normal',
          dividerStyle: 'double',
          showItemIndex: true,
          showBarcode: true,
          showUnit: true,
          showMrp: true,
          showRate: true,
          showDiscountPerItem: true,
          showGstPerItem: true,
          showHsnCode: true,
          showSavingsBanner: true,
          showGstSummary: true,
          showBarcodeFooter: true,
          showQrCodeFooter: true,
        };
        break;
      case 'tax_invoice_a4':
        next = {
          ...INITIAL_BILL_FORMAT,
          paperSize: 'A4',
          fontFamily: 'sans',
          fontSize: 'large',
          dividerStyle: 'solid',
          headerAlignment: 'left',
          headerCustomText: 'ORIGINAL TAX INVOICE (RULE 46 OF CGST RULES)',
          showItemIndex: true,
          showBarcode: true,
          showUnit: true,
          showMrp: true,
          showRate: true,
          showDiscountPerItem: true,
          showGstPerItem: true,
          showHsnCode: true,
          showGstSummary: true,
          showSavingsBanner: true,
          showBarcodeFooter: true,
          showQrCodeFooter: true,
          showSignature: true,
        };
        break;
      case 'restaurant_cafe':
        next = {
          ...INITIAL_BILL_FORMAT,
          paperSize: '80mm',
          fontFamily: 'monospace',
          fontSize: 'normal',
          dividerStyle: 'dashed',
          showTokenNumber: true,
          customFields: [
            { id: 'rf-1', label: 'Table No', value: 'T-14 (AC Hall)', section: 'metadata', enabled: true },
            { id: 'rf-2', label: 'Server / Captain', value: 'Vikram S.', section: 'metadata', enabled: true },
            { id: 'rf-3', label: 'Order Type', value: 'Dine-In', section: 'metadata', enabled: true },
          ],
          customTotalRows: [
            { id: 'tr-sc', label: 'Restaurant Service Charge (5%)', amount: 35, type: 'charge', enabled: true },
            { id: 'tr-tip', label: 'Server Tip / Gratuity', amount: 20, type: 'tip', enabled: false },
          ],
        };
        break;
      case 'pharmacy':
        next = {
          ...INITIAL_BILL_FORMAT,
          paperSize: '80mm',
          fontFamily: 'sans',
          fontSize: 'normal',
          dividerStyle: 'solid',
          showHsnCode: true,
          showGstPerItem: true,
          customFields: [
            { id: 'pf-1', label: 'Drug Lic No (DL)', value: '20B/21B-94827', section: 'header', enabled: true },
            { id: 'pf-2', label: 'Doctor Name', value: 'Dr. A. K. Verma (MD)', section: 'metadata', enabled: true },
            { id: 'pf-3', label: 'Patient Name', value: 'Smt. Sarojini Devi', section: 'metadata', enabled: true },
          ],
        };
        break;
      case 'minimalist':
        next = {
          ...INITIAL_BILL_FORMAT,
          paperSize: '80mm',
          fontFamily: 'sans',
          fontSize: 'compact',
          dividerStyle: 'solid',
          showStoreLogo: false,
          showItemIndex: false,
          showBarcode: false,
          showMrp: false,
          showDiscountPerItem: false,
          showHsnCode: false,
          showGstPerItem: false,
          showGstSummary: false,
          showSavingsBanner: false,
          showBarcodeFooter: false,
          showQrCodeFooter: false,
        };
        break;
    }
    setConfig(next);
    updateBillFormat(next);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const subtotal = customItems.reduce((sum, i) => sum + i.mrp * i.quantity, 0);
    const discount = customItems.reduce((sum, i) => sum + (i.mrp - i.sellingPrice) * i.quantity, 0);
    const itemsTotal = customItems.reduce((sum, i) => sum + i.total, 0);
    const customSum = config.customTotalRows
      .filter((r) => r.enabled)
      .reduce((sum, r) => sum + r.amount, 0);

    const grandTotal = config.overrideTotalEnabled && config.overrideTotalAmount !== undefined
      ? config.overrideTotalAmount
      : Math.max(0, itemsTotal + customSum);

    const orderForPdf: Order = {
      id: 'pdf-ord',
      invoiceNumber: config.customLabels.invoiceTitle || 'INV-202609-0892',
      createdAt: new Date().toISOString(),
      items: customItems.map((i) => ({
        productId: i.id,
        productName: i.productName,
        barcode: i.barcode || '',
        category: 'Groceries',
        unit: i.unit,
        mrp: i.mrp,
        costPrice: i.sellingPrice * 0.8,
        sellingPrice: i.sellingPrice,
        quantity: i.quantity,
        discountAmount: i.discountAmount,
        gstRate: i.gstRate,
        gstAmount: (i.total * i.gstRate) / 100,
        total: i.total,
      })),
      totalItems: customItems.length,
      totalQuantity: customItems.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      totalDiscount: discount,
      totalGst: (itemsTotal * 5) / 100,
      grandTotal,
      totalCost: itemsTotal * 0.8,
      netProfit: itemsTotal * 0.2,
      paymentMethod: 'cash',
      paymentDetails: { method: 'cash', amount: grandTotal },
      cashier: { id: 'usr-admin', name: 'Kalaasagar Admin', role: 'admin' },
      status: 'completed',
    };

    generateInvoicePdf(orderForPdf, settings, config);
  };

  // Active simulated order for preview
  const activeOrder = useMemo<Order>(() => {
    const subtotal = customItems.reduce((sum, i) => sum + i.mrp * i.quantity, 0);
    const discount = customItems.reduce((sum, i) => sum + (i.mrp - i.sellingPrice) * i.quantity, 0);
    const itemsTotal = customItems.reduce((sum, i) => sum + i.total, 0);
    const customSum = config.customTotalRows
      .filter((r) => r.enabled)
      .reduce((sum, r) => sum + r.amount, 0);

    const grandTotal = config.overrideTotalEnabled && config.overrideTotalAmount !== undefined
      ? config.overrideTotalAmount
      : Math.max(0, itemsTotal + customSum);

    const defaultMeta: Order = {
      id: 'preview-ord',
      invoiceNumber: 'INV-202609-1082',
      createdAt: new Date().toISOString(),
      cashier: { id: 'usr-admin', name: 'Kalaasagar Admin', role: 'admin' },
      customer: { id: 'cust-1', name: 'Priya Sundaram', phone: '+91 98765 43210', pointsEarned: 25 },
      paymentMethod: 'upi',
      items: customItems.map((i) => ({
        productId: i.id,
        productName: i.productName,
        barcode: i.barcode || '',
        category: 'Groceries',
        unit: i.unit,
        mrp: i.mrp,
        costPrice: i.sellingPrice * 0.8,
        sellingPrice: i.sellingPrice,
        quantity: i.quantity,
        discountAmount: i.discountAmount,
        gstRate: i.gstRate,
        gstAmount: (i.total * i.gstRate) / 100,
        total: i.total,
      })),
      totalItems: customItems.length,
      totalQuantity: customItems.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      totalDiscount: discount,
      totalGst: (itemsTotal * 5) / 100,
      grandTotal,
      totalCost: itemsTotal * 0.8,
      netProfit: itemsTotal * 0.2,
      paymentDetails: { method: 'upi', amount: grandTotal, tenderAmount: grandTotal, changeReturned: 0 },
      status: 'completed',
    };

    if (selectedOrderId === 'sample') return defaultMeta;
    const found = orders.find((o) => o.id === selectedOrderId);
    if (!found) return defaultMeta;
    return found;
  }, [selectedOrderId, orders, customItems, config]);

  return (
    <div className="space-y-5 pb-10">
      {/* Print Specific CSS to isolate bill print */}
      <style>{`
        @media print {
          @page {
            margin: 0 !important;
            size: auto;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-receipt,
          #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${config.paperSize === '58mm' ? '58mm' : config.paperSize === '80mm' ? '80mm' : '100%'} !important;
            margin: 0 !important;
            padding-top: 1mm !important;
            padding-bottom: 2mm !important;
            padding-left: ${config.paperSize === '58mm' ? '1mm' : '2mm'} !important;
            padding-right: ${config.paperSize === '58mm' ? '1mm' : '2mm'} !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Bill Print & Format Designer
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                ⚡ Auto-Synced with All Printouts
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize bill totals, edit text inline, add/remove items, charges, banners & metadata
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Live WYSIWYG In-Place Edit Mode */}
          <button
            onClick={() => setIsLiveEditMode((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isLiveEditMode
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle direct click-to-edit on preview canvas"
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isLiveEditMode ? 'Live Edit: Active (Click Any Text)' : 'Live Edit: Off'}</span>
          </button>

          <button
            onClick={handleResetToStandard}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset to standard default format"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download PDF version of invoice"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleSaveDefault}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            title="Save this format as default for all future checkouts & prints"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Format</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Bill</span>
          </button>
        </div>
      </div>

      {/* Save confirmation toast */}
      {saveToast && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Bill template format, custom totals & fields saved successfully and active for all printouts!</span>
          </div>
          <button onClick={() => setSaveToast(false)} className="text-emerald-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preset Quick Templates Bar */}
      <div className="bg-white rounded-2xl p-3 px-4 border border-slate-200 shadow-sm flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Format Presets:
          </span>
          <button
            onClick={() => loadPresetTemplate('standard_80mm')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              config.paperSize === '80mm' && config.dividerStyle === 'dashed' && !config.showTokenNumber
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Standard POS (80mm)
          </button>
          <button
            onClick={() => loadPresetTemplate('compact_58mm')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              config.paperSize === '58mm'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Compact (58mm)
          </button>
          <button
            onClick={() => loadPresetTemplate('grocery_gst')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              config.showHsnCode && config.showGstSummary && config.paperSize === '80mm'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            GST Grocery Tax Bill
          </button>
          <button
            onClick={() => loadPresetTemplate('restaurant_cafe')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              config.showTokenNumber
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Restaurant / Cafe Bill
          </button>
          <button
            onClick={() => loadPresetTemplate('pharmacy')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            Pharmacy / Chemist
          </button>
          <button
            onClick={() => loadPresetTemplate('tax_invoice_a4')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              config.paperSize === 'A4'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Full Tax Invoice (A4)
          </button>
          <button
            onClick={() => loadPresetTemplate('minimalist')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            Minimalist Slip
          </button>
        </div>

        {/* Real Order Data Selector for Testing */}
        {orders.length > 0 && (
          <div className="flex items-center gap-2 min-w-max pl-4 border-l border-slate-200 text-xs">
            <span className="font-bold text-slate-500">Test Order:</span>
            <select
              value={selectedOrderId}
              onChange={(e) => syncOrderItems(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sample">Sample Demo Order</option>
              {orders.slice(0, 10).map((ord) => (
                <option key={ord.id} value={ord.id}>
                  {ord.invoiceNumber} - {currency}{ord.grandTotal.toFixed(0)} ({ord.items.length} items)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Designer Grid: Left Controls (7 Cols) & Right Live Preview (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Format Customization Studio */}
        <div className="lg:col-span-6 xl:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1 p-2 bg-slate-50/80 border-b border-slate-200 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveTab('totals')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'totals'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Bill Totals & Charges</span>
            </button>

            <button
              onClick={() => setActiveTab('items')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'items'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Products & Items ({customItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sections')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'sections'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Section Manager</span>
            </button>

            <button
              onClick={() => setActiveTab('layout')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'layout'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Paper & Font</span>
            </button>

            <button
              onClick={() => setActiveTab('header')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'header'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Header & Store</span>
            </button>

            <button
              onClick={() => setActiveTab('customer')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'customer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer & Meta</span>
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'banners'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Banners & Badges</span>
            </button>

            <button
              onClick={() => setActiveTab('freetext')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'freetext'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Custom Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('footer')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'footer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Footer & QR</span>
            </button>

            <button
              onClick={() => setActiveTab('labels')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'labels'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Labels & Words</span>
            </button>
          </div>

          {/* TAB 1: TOTALS & BILL CALCULATIONS (100% CUSTOMIZABLE) */}
          {activeTab === 'totals' && (
            <div className="p-6 space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    Bill Totals, Calculation Customizer & Extra Charges
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize calculation rules, auto-rounding, extra fees, delivery, carry bag, or override grand total
                  </p>
                </div>
              </div>

              {/* MANUAL GRAND TOTAL OVERRIDE BLOCK */}
              <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl space-y-3 shadow-md border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                      Manual Grand Total Override
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Force a specific final payable amount on all printed receipts or let it calculate automatically
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                    <input
                      type="checkbox"
                      checked={config.overrideTotalEnabled}
                      onChange={(e) => handleUpdate('overrideTotalEnabled', e.target.checked)}
                      className="w-4 h-4 rounded text-blue-500"
                    />
                    <span className="text-xs font-bold text-white">Manual Override</span>
                  </label>
                </div>

                {config.overrideTotalEnabled && (
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
                    <span className="text-xs font-bold text-slate-300">Set Net Payable Amount ({currency}):</span>
                    <input
                      type="number"
                      value={config.overrideTotalAmount ?? activeOrder.grandTotal}
                      onChange={(e) => handleUpdate('overrideTotalAmount', parseFloat(e.target.value) || 0)}
                      className="px-3 py-1.5 bg-slate-800 border border-blue-500 text-white rounded-xl text-sm font-mono font-black w-40 focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      ✓ All bill printouts will now display exactly {currency}
                      {(config.overrideTotalAmount ?? activeOrder.grandTotal).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* AUTO-ROUNDING & CALCULATION SETTINGS */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  Auto-Rounding & Currency Options
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Rounding Mode</label>
                    <select
                      value={config.roundingMode || 'none'}
                      onChange={(e) => handleUpdate('roundingMode', e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                    >
                      <option value="none">No Rounding (Exact Paise / Cents)</option>
                      <option value="nearest_1">Round to Nearest Integer (₹1.00)</option>
                      <option value="nearest_half">Round to Nearest 50 Paise (₹0.50)</option>
                      <option value="round_down">Always Round Down (Floor)</option>
                      <option value="round_up">Always Round Up (Ceil)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Currency Symbol</label>
                    <input
                      type="text"
                      value={config.customCurrencySymbol || ''}
                      placeholder={settings.currencySymbol || '₹'}
                      onChange={(e) => handleUpdate('customCurrencySymbol', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* STANDARD TOTALS ROWS TOGGLES */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Totals Rows Visibility & Toggles
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'showSubtotal', label: 'Subtotal Row', desc: 'Display total MRP / base price' },
                    { key: 'showTotalDiscount', label: 'Discount / Savings Row', desc: 'Show total money saved by customer' },
                    { key: 'showSavingsBanner', label: 'Supermarket Savings Highlight Banner', desc: 'Green banner: ★ YOU SAVED ₹XX! ★' },
                    { key: 'showGstSummary', label: 'GST Breakdown Tax Table', desc: 'Multi-slab Rate/Taxable/CGST/SGST table' },
                    { key: 'showItemCountQty', label: 'Total Items Row', desc: 'e.g. TOTAL ITEMS: 4' },
                    { key: 'showTenderAndChange', label: 'Tendered Amount & Change Due', desc: 'Payment breakdown lines' },
                  ].map((tot) => (
                    <label
                      key={tot.key}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none hover:border-slate-300 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={!!config[tot.key as keyof BillFormatConfig]}
                        onChange={(e) =>
                          handleUpdate(tot.key as keyof BillFormatConfig, e.target.checked as never)
                        }
                        className="w-4 h-4 mt-0.5 rounded text-blue-600"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">{tot.label}</span>
                        <span className="text-[10px] text-slate-500">{tot.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* CUSTOM EXTRA CHARGES & DEDUCTIONS */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    Custom Extra Charges, Fees & Discounts ({config.customTotalRows.length})
                  </h4>
                </div>

                {/* Quick Add Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400">Quick Add:</span>
                  {[
                    { label: 'Carry Bag (Paper)', amt: 10, type: 'charge' as const },
                    { label: 'Carry Bag (Cloth)', amt: 15, type: 'charge' as const },
                    { label: 'Home Delivery', amt: 30, type: 'charge' as const },
                    { label: 'Express Delivery', amt: 60, type: 'charge' as const },
                    { label: 'Packaging Fee', amt: 10, type: 'charge' as const },
                    { label: 'Service Charge', amt: 25, type: 'charge' as const },
                    { label: 'Staff Tip', amt: 20, type: 'tip' as const },
                    { label: 'Coupon Discount', amt: 50, type: 'discount' as const },
                    { label: 'Rounding Off', amt: -0.45, type: 'roundoff' as const },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleAddTotalRow(undefined, preset.label, preset.amt, preset.type)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-all cursor-pointer"
                    >
                      + {preset.label} ({preset.type === 'discount' ? '-' : ''}{currency}{Math.abs(preset.amt)})
                    </button>
                  ))}
                </div>

                {/* List of Custom Total Rows */}
                <div className="space-y-2">
                  {config.customTotalRows.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={() => handleToggleTotalRow(row.id)}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => handleUpdateTotalRow(row.id, { label: e.target.value })}
                          className="font-bold text-slate-900 bg-transparent flex-1 px-1 focus:bg-white focus:outline-none rounded"
                        />
                        <div className="flex items-center gap-1 font-mono font-extrabold text-blue-700">
                          <span>{currency}</span>
                          <input
                            type="number"
                            value={row.amount}
                            onChange={(e) =>
                              handleUpdateTotalRow(row.id, { amount: parseFloat(e.target.value) || 0 })
                            }
                            className="w-20 px-1 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">({row.type})</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteTotalRow(row.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete this total row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Custom Total Row Form */}
                <form
                  onSubmit={(e) => handleAddTotalRow(e)}
                  className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3"
                >
                  <h4 className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    Add Custom Row to Bill Totals
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={newTotalRowLabel}
                      onChange={(e) => setNewTotalRowLabel(e.target.value)}
                      placeholder="Row Name (e.g. Green Cess, Bag)"
                      className="sm:col-span-2 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={newTotalRowAmount}
                      onChange={(e) => setNewTotalRowAmount(e.target.value)}
                      placeholder={`Amount (${currency})`}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                    <select
                      value={newTotalRowType}
                      onChange={(e) => setNewTotalRowType(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                    >
                      <option value="charge">Extra Charge (+)</option>
                      <option value="discount">Discount (-)</option>
                      <option value="roundoff">Round Off (+/-)</option>
                      <option value="tax">Tax / Cess (+)</option>
                      <option value="tip">Tip / Gratuity (+)</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Total Line</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS & LINE ITEMS */}
          {activeTab === 'items' && (
            <div className="p-6 space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    Bill Line Items & Products ({customItems.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add custom products, edit quantities, rates, MRPs, or delete items
                  </p>
                </div>
                <span className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-xl">
                  {customItems.length} items
                </span>
              </div>

              {/* Add New Item Form */}
              <form
                onSubmit={(e) => handleAddItem(e)}
                className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3"
              >
                <h4 className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                  Add Custom Item to Bill
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Product / Item Name"
                    className="sm:col-span-2 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="number"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    placeholder="Qty"
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="Unit (kg/pcs)"
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder={`Price (${currency})`}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item to Bill</span>
                  </button>
                </div>
              </form>

              {/* Items List with Delete & Edit */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {customItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-bold text-slate-400 w-5">#{idx + 1}</span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => handleUpdateItem(item.id, { productName: e.target.value })}
                        className="font-bold text-slate-900 bg-transparent w-full focus:outline-none focus:bg-white rounded px-1"
                      />
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>
                          Qty:{' '}
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 1 })
                            }
                            className="w-12 px-1 bg-white border border-slate-300 rounded text-center font-bold"
                          />
                        </span>
                        <span>
                          Price: {currency}
                          <input
                            type="number"
                            value={item.sellingPrice}
                            onChange={(e) =>
                              handleUpdateItem(item.id, { sellingPrice: parseFloat(e.target.value) || 0 })
                            }
                            className="w-16 px-1 bg-white border border-slate-300 rounded text-center font-bold"
                          />
                        </span>
                        <span className="font-mono font-bold text-slate-900 ml-auto">
                          Total: {currency}{item.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete item from bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Column Toggles */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Item Table Column Visibility
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'showItemIndex', label: 'Sr No (#)' },
                    { key: 'showUnit', label: 'Unit' },
                    { key: 'showMrp', label: 'MRP' },
                    { key: 'showRate', label: 'Rate' },
                    { key: 'showDiscountPerItem', label: 'Discount' },
                    { key: 'showBarcode', label: 'Barcode' },
                    { key: 'showGstPerItem', label: 'GST %' },
                    { key: 'showHsnCode', label: 'HSN Code' },
                  ].map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer text-xs select-none"
                    >
                      <input
                        type="checkbox"
                        checked={!!config[col.key as keyof BillFormatConfig]}
                        onChange={(e) =>
                          handleUpdate(col.key as keyof BillFormatConfig, e.target.checked as never)
                        }
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span className="font-bold text-slate-700">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECTION MANAGER */}
          {activeTab === 'sections' && (
            <div className="p-6 space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Bill Section Visibility Manager
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toggle on/off or completely remove any block on the bill with one click
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'header', label: 'Store Header & Tax IDs', desc: 'Logo, store name, address, GSTIN, FSSAI' },
                  { key: 'metadata', label: 'Invoice Metadata', desc: 'Invoice #, date, cashier, customer info, token' },
                  { key: 'itemsTable', label: 'Items & Products Table', desc: 'Table of purchased items, prices, qty, totals' },
                  { key: 'totals', label: 'Totals & Charges Section', desc: 'Subtotal, discount, custom charges, net payable' },
                  { key: 'gstBreakdown', label: 'GST Tax Breakdown Matrix', desc: 'Taxable value, CGST, SGST breakdown table' },
                  { key: 'savingsBanner', label: 'Supermarket Savings Highlight', desc: 'Green banner celebrating customer savings' },
                  { key: 'footer', label: 'Footer & Return Policy', desc: 'Thank you note, policy, disclaimer, notes' },
                  { key: 'barcode', label: 'Invoice Barcode', desc: 'Scannable barcode for invoice returns & lookup' },
                  { key: 'qrCode', label: 'QR Code (UPI / Pay)', desc: 'Scannable QR code for instant UPI checkout' },
                  { key: 'signature', label: 'Signature Box', desc: 'Authorized signatory stamp line' },
                ].map((sec) => (
                  <div
                    key={sec.key}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      config.visibleSections[sec.key as keyof BillFormatConfig['visibleSections']]
                        ? 'bg-blue-50/40 border-blue-200'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">{sec.label}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{sec.desc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSection(sec.key as keyof BillFormatConfig['visibleSections'])}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        config.visibleSections[sec.key as keyof BillFormatConfig['visibleSections']]
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {config.visibleSections[sec.key as keyof BillFormatConfig['visibleSections']]
                        ? 'Visible'
                        : 'Hidden'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LAYOUT & TYPOGRAPHY */}
          {activeTab === 'layout' && (
            <div className="p-6 space-y-5 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Paper Size, Typography & Divider Style
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Receipt Paper Width</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { size: '58mm', label: '58mm (Mini)' },
                      { size: '80mm', label: '80mm (Standard)' },
                      { size: 'A4', label: 'A4 (Invoice)' },
                    ].map((p) => (
                      <button
                        key={p.size}
                        type="button"
                        onClick={() => handleUpdate('paperSize', p.size as any)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          config.paperSize === p.size
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Font Family</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { font: 'monospace', label: 'Mono (POS)' },
                      { font: 'sans', label: 'Modern Sans' },
                      { font: 'serif', label: 'Serif' },
                    ].map((f) => (
                      <button
                        key={f.font}
                        type="button"
                        onClick={() => handleUpdate('fontFamily', f.font as any)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          config.fontFamily === f.font
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Section Separator Line Style</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { style: 'dashed', label: 'Dashed (---)' },
                      { style: 'dotted', label: 'Dotted (···)' },
                      { style: 'solid', label: 'Solid (───)' },
                      { style: 'double', label: 'Double (═══)' },
                    ].map((d) => (
                      <button
                        key={d.style}
                        type="button"
                        onClick={() => handleUpdate('dividerStyle', d.style as any)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          config.dividerStyle === d.style
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Font Size Scaling</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { size: 'compact', label: 'Compact' },
                      { size: 'normal', label: 'Normal' },
                      { size: 'large', label: 'Large' },
                    ].map((s) => (
                      <button
                        key={s.size}
                        type="button"
                        onClick={() => handleUpdate('fontSize', s.size as any)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          config.fontSize === s.size
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HEADER & STORE INFO */}
          {activeTab === 'header' && (
            <div className="p-6 space-y-5 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600" />
                Store Branding, Tax Registrations & Custom Lines
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Store Name</label>
                  <input
                    type="text"
                    value={config.storeName}
                    onChange={(e) => handleUpdate('storeName', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Tagline / Motto</label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => handleUpdate('tagline', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Address Line</label>
                  <input
                    type="text"
                    value={config.address}
                    onChange={(e) => handleUpdate('address', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">City & Pincode</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.city}
                      onChange={(e) => handleUpdate('city', e.target.value)}
                      placeholder="City"
                      className="w-2/3 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      value={config.pincode}
                      onChange={(e) => handleUpdate('pincode', e.target.value)}
                      placeholder="Pincode"
                      className="w-1/3 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Store Contact Number</label>
                  <input
                    type="text"
                    value={config.phone}
                    onChange={(e) => handleUpdate('phone', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">GSTIN Number</label>
                  <input
                    type="text"
                    value={config.gstin}
                    onChange={(e) => handleUpdate('gstin', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">FSSAI License Number</label>
                  <input
                    type="text"
                    value={config.fssaiNumber}
                    onChange={(e) => handleUpdate('fssaiNumber', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Bill Title Header</label>
                  <input
                    type="text"
                    value={config.headerCustomText}
                    onChange={(e) => handleUpdate('headerCustomText', e.target.value)}
                    placeholder="TAX INVOICE / RETAIL BILL"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold uppercase"
                  />
                </div>
              </div>

              {/* Dynamic Custom Header Fields */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  Custom Header Fields (e.g. Drug Lic, CIN, Branch Code)
                </h4>

                <div className="space-y-2">
                  {config.customFields
                    .filter((f) => f.section === 'header')
                    .map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={field.enabled}
                            onChange={() => handleToggleCustomField(field.id)}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <span className="font-bold text-slate-700">{field.label}:</span>
                          <span className="font-mono text-slate-900">{field.value}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomField(field.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>

                <form
                  onSubmit={(e) => {
                    setNewFieldSection('header');
                    handleAddCustomField(e, 'header');
                  }}
                  className="flex flex-wrap items-center gap-2 p-3 bg-blue-50/60 rounded-2xl border border-blue-200"
                >
                  <input
                    type="text"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="Field Name (e.g. Drug Lic No)"
                    className="flex-1 min-w-[120px] px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="text"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    placeholder="Value (e.g. 20B/21B-9482)"
                    className="flex-1 min-w-[150px] px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOMER & METADATA */}
          {activeTab === 'customer' && (
            <div className="p-6 space-y-5 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Customer, Cashier & Register Metadata
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'showInvoiceNumber', label: 'Invoice / Bill Number', desc: 'e.g. INV-202609-1001' },
                  { key: 'showDateTime', label: 'Transaction Date & Time', desc: 'Timestamp of checkout' },
                  { key: 'showCashierName', label: 'Cashier Staff Name', desc: 'Staff who handled register' },
                  { key: 'showPaymentMethod', label: 'Payment Mode', desc: 'CASH / UPI / CARD / SPLIT' },
                  { key: 'showCustomerName', label: 'Customer Name', desc: 'Member customer full name' },
                  { key: 'showCustomerPhone', label: 'Customer Mobile Number', desc: 'Contact mobile number' },
                  { key: 'showLoyaltyPoints', label: 'Loyalty Points Earned', desc: 'Show +XX loyalty reward points' },
                  { key: 'showTokenNumber', label: 'Token / Counter Order #', desc: 'Daily order queue token' },
                ].map((meta) => (
                  <label
                    key={meta.key}
                    className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 cursor-pointer select-none transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!!config[meta.key as keyof BillFormatConfig]}
                      onChange={(e) => handleUpdate(meta.key as keyof BillFormatConfig, e.target.checked as never)}
                      className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{meta.label}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{meta.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Dynamic Metadata Custom Fields */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  Custom Metadata Fields (e.g. Table #, Doctor Name, Vehicle #)
                </h4>

                <div className="space-y-2">
                  {config.customFields
                    .filter((f) => f.section === 'metadata')
                    .map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={field.enabled}
                            onChange={() => handleToggleCustomField(field.id)}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <span className="font-bold text-slate-700">{field.label}:</span>
                          <span className="font-mono text-slate-900">{field.value}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomField(field.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>

                <form
                  onSubmit={(e) => {
                    setNewFieldSection('metadata');
                    handleAddCustomField(e, 'metadata');
                  }}
                  className="flex flex-wrap items-center gap-2 p-3 bg-blue-50/60 rounded-2xl border border-blue-200"
                >
                  <input
                    type="text"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="Field Name (e.g. Table No)"
                    className="flex-1 min-w-[120px] px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="text"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    placeholder="Value (e.g. Table #14)"
                    className="flex-1 min-w-[150px] px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Field</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 7: BANNERS & BADGES */}
          {activeTab === 'banners' && (
            <div className="p-6 space-y-5 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" />
                Custom Highlight Badges & Promotional Banners
              </h3>

              <div className="space-y-3">
                {config.customBanners.map((banner) => (
                  <div
                    key={banner.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                        {banner.position}
                      </span>
                      <span className="font-bold text-slate-900">{banner.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomBanner(banner.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddCustomBanner} className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
                <h4 className="font-bold text-xs text-blue-900">Add Promotional Banner</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newBannerText}
                    onChange={(e) => setNewBannerText(e.target.value)}
                    placeholder="Banner text (e.g. ★ MEGA SALE: 20% OFF ★)"
                    className="sm:col-span-3 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                  <select
                    value={newBannerPos}
                    onChange={(e) => setNewBannerPos(e.target.value as any)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="top">Position: Top (Below Header)</option>
                    <option value="middle">Position: Middle (After Items)</option>
                    <option value="bottom">Position: Bottom (Above Footer)</option>
                  </select>
                  <select
                    value={newBannerStyle}
                    onChange={(e) => setNewBannerStyle(e.target.value as any)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="highlight">Style: Highlight Box</option>
                    <option value="bordered">Style: Bordered Box</option>
                    <option value="solid">Style: Solid Dark Box</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Banner</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 8: FREE-TEXT NOTES */}
          {activeTab === 'freetext' && (
            <div className="p-6 space-y-5 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Custom Paragraphs, Notes & Free-Text Blocks
              </h3>

              <div className="space-y-3">
                {(config.freeTextNotes || []).map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700 mr-2">
                        {note.position.replace('_', ' ')}
                      </span>
                      <span className="text-slate-900">{note.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFreeTextNote(note.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddFreeTextNote} className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
                <h4 className="font-bold text-xs text-blue-900">Add Free-Form Text Block</h4>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Type any instructions, greeting, disclaimer, or notes here..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                />
                <div className="flex items-center justify-between">
                  <select
                    value={newNotePos}
                    onChange={(e) => setNewNotePos(e.target.value as any)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="after_header">Position: After Header</option>
                    <option value="after_items">Position: After Items</option>
                    <option value="after_totals">Position: After Totals</option>
                    <option value="footer">Position: In Footer</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Note Block</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 9: FOOTER, QR & POLICY */}
          {activeTab === 'footer' && (
            <div className="p-6 space-y-5 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                Footer Disclaimers, Social Links, Barcode & QR Code
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Thank You Message</label>
                  <input
                    type="text"
                    value={config.thankYouMessage}
                    onChange={(e) => handleUpdate('thankYouMessage', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Return & Exchange Policy</label>
                  <textarea
                    value={config.returnPolicy}
                    onChange={(e) => handleUpdate('returnPolicy', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Custom Footer Note</label>
                  <input
                    type="text"
                    value={config.footerCustomNote}
                    onChange={(e) => handleUpdate('footerCustomNote', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Social Handles & Website</label>
                  <input
                    type="text"
                    value={config.socialHandles || ''}
                    onChange={(e) => handleUpdate('socialHandles', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={config.showBarcodeFooter}
                      onChange={(e) => handleUpdate('showBarcodeFooter', e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Print Invoice Barcode</span>
                      <span className="text-[10px] text-slate-500">Scan barcode for instant lookup & returns</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={config.showQrCodeFooter}
                      onChange={(e) => handleUpdate('showQrCodeFooter', e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Print Footer QR Code</span>
                      <span className="text-[10px] text-slate-500">Scan to pay via UPI or view receipt</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: CUSTOMIZABLE LABELS DICTIONARY */}
          {activeTab === 'labels' && (
            <div className="p-6 space-y-4 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Type className="w-4 h-4 text-blue-600" />
                Customizable Receipt Words & Column Header Labels
              </h3>
              <p className="text-xs text-slate-500">
                Rename any standard text label on the bill to your preferred language or terminology:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[
                  { key: 'invoiceNoLabel', label: 'Invoice No Label', def: 'INVOICE NO:' },
                  { key: 'dateLabel', label: 'Date & Time Label', def: 'DATE & TIME:' },
                  { key: 'cashierLabel', label: 'Cashier Label', def: 'CASHIER:' },
                  { key: 'customerLabel', label: 'Customer Label', def: 'CUSTOMER:' },
                  { key: 'paymentModeLabel', label: 'Payment Mode Label', def: 'PAYMENT MODE:' },
                  { key: 'itemHeader', label: 'Item Column Header', def: 'ITEM DESCRIPTION' },
                  { key: 'qtyHeader', label: 'Quantity Header', def: 'QTY' },
                  { key: 'mrpHeader', label: 'MRP Header', def: 'MRP' },
                  { key: 'rateHeader', label: 'Rate Header', def: 'RATE' },
                  { key: 'totalHeader', label: 'Total Column Header', def: 'TOTAL' },
                  { key: 'subtotalLabel', label: 'Subtotal Label', def: 'SUBTOTAL:' },
                  { key: 'discountLabel', label: 'Discount / Total Savings Label', def: 'TOTAL SAVINGS:' },
                  { key: 'netPayableLabel', label: 'Net Payable Label', def: 'NET AMOUNT PAYABLE:' },
                  { key: 'tenderedLabel', label: 'Tendered Amount Label', def: 'AMOUNT TENDERED:' },
                  { key: 'changeLabel', label: 'Change Returned Label', def: 'CHANGE RETURNED:' },
                  { key: 'itemsCountLabel', label: 'Total Items Label', def: 'TOTAL ITEMS:' },
                ].map((item) => (
                  <div key={item.key} className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">{item.label}</label>
                    <input
                      type="text"
                      value={config.customLabels[item.key as keyof BillCustomLabels] || item.def}
                      onChange={(e) => handleUpdateLabel(item.key as keyof BillCustomLabels, e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Thermal Print Preview Viewport (5 Cols) */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center">
          {/* Viewport Control Bar */}
          <div className="w-full bg-slate-900 text-white p-3.5 rounded-2xl mb-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">Live Receipt Preview</span>
              {isLiveEditMode && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold animate-pulse">
                  ✏️ Click-to-Edit Enabled
                </span>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1.5 text-slate-300">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(135, z + 15))}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Thermal Receipt Paper Canvas rendered via unified BillReceiptView */}
          <div className="w-full bg-slate-200 p-6 rounded-3xl border border-slate-300 shadow-inner flex justify-center items-start min-h-[650px] overflow-x-auto">
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="transition-transform duration-150"
            >
              <BillReceiptView
                order={activeOrder}
                items={customItems}
                config={config}
                settings={settings}
                isLiveEditMode={isLiveEditMode}
                containerId="printable-receipt"
                onUpdateConfig={handleUpdate}
                onUpdateLabel={handleUpdateLabel}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onUpdateCustomField={handleUpdateCustomField}
                onDeleteCustomField={handleDeleteCustomField}
                onUpdateTotalRow={handleUpdateTotalRow}
                onDeleteTotalRow={handleDeleteTotalRow}
                onUpdateBanner={handleUpdateBanner}
                onDeleteBanner={handleDeleteCustomBanner}
                onUpdateFreeTextNote={handleUpdateFreeTextNote}
                onDeleteFreeTextNote={handleDeleteFreeTextNote}
                onToggleSection={toggleSection}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
