import React, { useMemo } from 'react';
import { Store, X } from 'lucide-react';
import {
  BillFormatConfig,
  BillCustomLabels,
  CustomBillField,
  CustomTotalRow,
  CustomBillBanner,
  EditableBillItem,
  FreeTextNote,
  Order,
  StoreSettings,
} from '../../types';
import { BarcodeSvg } from './BarcodeSvg';
import { QrCodeSvg } from './QrCodeSvg';

interface BillReceiptViewProps {
  order?: Order | null;
  items?: EditableBillItem[];
  config: BillFormatConfig;
  settings: StoreSettings;
  paperSizeOverride?: '58mm' | '80mm' | 'A4';
  isLiveEditMode?: boolean;
  containerId?: string;

  // Optional Live WYSIWYG Handlers
  onUpdateConfig?: <K extends keyof BillFormatConfig>(key: K, value: BillFormatConfig[K]) => void;
  onUpdateLabel?: (key: keyof BillCustomLabels, value: string) => void;
  onUpdateItem?: (id: string, updates: Partial<EditableBillItem>) => void;
  onDeleteItem?: (id: string) => void;
  onOpenAddItem?: () => void;
  onUpdateCustomField?: (id: string, updates: Partial<CustomBillField>) => void;
  onDeleteCustomField?: (id: string) => void;
  onOpenAddField?: (section: 'header' | 'metadata' | 'totals' | 'footer') => void;
  onUpdateTotalRow?: (id: string, updates: Partial<CustomTotalRow>) => void;
  onDeleteTotalRow?: (id: string) => void;
  onOpenAddTotalRow?: () => void;
  onUpdateBanner?: (id: string, text: string) => void;
  onDeleteBanner?: (id: string) => void;
  onUpdateFreeTextNote?: (id: string, text: string) => void;
  onDeleteFreeTextNote?: (id: string) => void;
  onToggleSection?: (section: keyof BillFormatConfig['visibleSections']) => void;
}

export const BillReceiptView: React.FC<BillReceiptViewProps> = ({
  order,
  items: customItemsProp,
  config,
  settings,
  paperSizeOverride,
  isLiveEditMode = false,
  containerId = 'printable-receipt',
  onUpdateConfig,
  onUpdateLabel,
  onUpdateItem,
  onDeleteItem,
  onOpenAddItem,
  onUpdateCustomField,
  onDeleteCustomField,
  onOpenAddField,
  onUpdateTotalRow,
  onDeleteTotalRow,
  onOpenAddTotalRow,
  onUpdateBanner,
  onDeleteBanner,
  onUpdateFreeTextNote,
  onDeleteFreeTextNote,
  onToggleSection,
}) => {
  // Convert order items to EditableBillItem list if custom items are not passed
  const billItems: EditableBillItem[] = useMemo(() => {
    if (customItemsProp && customItemsProp.length > 0) {
      return customItemsProp;
    }
    if (order && order.items && order.items.length > 0) {
      return order.items.map((i, idx) => ({
        id: `ord-item-${idx}-${i.productId || idx}`,
        productName: i.productName,
        barcode: i.barcode || '',
        hsnCode: '1901',
        unit: i.unit || 'pcs',
        quantity: i.quantity,
        mrp: i.mrp || i.sellingPrice,
        sellingPrice: i.sellingPrice,
        discountAmount: i.discountAmount || 0,
        gstRate: i.gstRate || 0,
        total: i.total,
      }));
    }
    return [];
  }, [customItemsProp, order]);

  const effectivePaperSize = paperSizeOverride || config.paperSize || '80mm';
  const currency = config.customCurrencySymbol || settings.currencySymbol || '₹';

  // Styling helper classes
  const dividerClass = useMemo(() => {
    switch (config.dividerStyle) {
      case 'dashed':
        return 'border-b border-dashed border-slate-400 my-2';
      case 'dotted':
        return 'border-b border-dotted border-slate-400 my-2';
      case 'solid':
        return 'border-b border-solid border-slate-400 my-2';
      case 'double':
        return 'border-b-2 border-double border-slate-600 my-2';
      default:
        return 'border-b border-dashed border-slate-400 my-2';
    }
  }, [config.dividerStyle]);

  const fontClass = useMemo(() => {
    switch (config.fontFamily) {
      case 'monospace':
        return 'font-mono';
      case 'sans':
        return 'font-sans';
      case 'serif':
        return 'font-serif';
      default:
        return 'font-mono';
    }
  }, [config.fontFamily]);

  const fontSizeClass = useMemo(() => {
    switch (config.fontSize) {
      case 'compact':
        return 'text-[10px] leading-tight';
      case 'normal':
        return 'text-[11px] leading-normal';
      case 'large':
        return 'text-[12px] leading-relaxed';
      default:
        return 'text-[11px] leading-normal';
    }
  }, [config.fontSize]);

  const paperWidthClass = useMemo(() => {
    switch (effectivePaperSize) {
      case '58mm':
        return 'w-[300px] p-3 text-xs';
      case '80mm':
        return 'w-[410px] p-5 text-xs';
      case 'A4':
        return 'w-[640px] p-8 text-sm';
      default:
        return 'w-[410px] p-5 text-xs';
    }
  }, [effectivePaperSize]);

  // Calculations
  const calculatedSubtotal = useMemo(() => {
    if (config.subtotalOverride !== undefined) return config.subtotalOverride;
    if (order && !customItemsProp && order.subtotal !== undefined) return order.subtotal;
    return billItems.reduce((sum, i) => sum + i.total, 0);
  }, [billItems, config.subtotalOverride, order, customItemsProp]);

  const calculatedDiscount = useMemo(() => {
    if (config.discountOverride !== undefined) return config.discountOverride;
    const itemDiff = billItems.reduce(
      (sum, i) => sum + Math.max(0, (i.mrp - i.sellingPrice) * i.quantity + (i.discountAmount || 0)),
      0
    );
    if (order && !customItemsProp && order.totalDiscount > 0) {
      return Math.max(order.totalDiscount, itemDiff);
    }
    return itemDiff;
  }, [billItems, config.discountOverride, order, customItemsProp]);

  const calculatedItemsTotal = useMemo(() => {
    if (order && !customItemsProp) return order.grandTotal;
    return billItems.reduce((sum, i) => sum + i.total, 0);
  }, [billItems, order, customItemsProp]);

  const customTotalRowsSum = useMemo(() => {
    if (!config.customTotalRows) return 0;
    return config.customTotalRows
      .filter((r) => r.enabled)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [config.customTotalRows]);

  const totalQuantitySum = useMemo(() => {
    if (order && !customItemsProp) return order.totalQuantity;
    return billItems.reduce((sum, i) => sum + i.quantity, 0);
  }, [billItems, order, customItemsProp]);

  const finalGrandTotal = useMemo(() => {
    if (config.overrideTotalEnabled && config.overrideTotalAmount !== undefined) {
      return config.overrideTotalAmount;
    }
    let total = calculatedItemsTotal + customTotalRowsSum;
    if (config.roundingMode === 'nearest_1') {
      total = Math.round(total);
    } else if (config.roundingMode === 'nearest_half') {
      total = Math.round(total * 2) / 2;
    } else if (config.roundingMode === 'round_down') {
      total = Math.floor(total);
    } else if (config.roundingMode === 'round_up') {
      total = Math.ceil(total);
    }
    return Math.max(0, total);
  }, [
    config.overrideTotalEnabled,
    config.overrideTotalAmount,
    config.roundingMode,
    calculatedItemsTotal,
    customTotalRowsSum,
  ]);

  // GST Breakdown calculation
  const gstBreakdown = useMemo(() => {
    const rateMap = new Map<number, { taxable: number; cgst: number; sgst: number; totalGst: number }>();
    billItems.forEach((item) => {
      const lineTaxable = item.sellingPrice * item.quantity;
      const rate = item.gstRate;
      const gstAmt = (lineTaxable * rate) / 100;
      const halfRate = gstAmt / 2;

      const curr = rateMap.get(rate) || { taxable: 0, cgst: 0, sgst: 0, totalGst: 0 };
      curr.taxable += lineTaxable;
      curr.cgst += halfRate;
      curr.sgst += halfRate;
      curr.totalGst += gstAmt;
      rateMap.set(rate, curr);
    });

    return Array.from(rateMap.entries()).map(([rate, vals]) => ({
      rate,
      ...vals,
    }));
  }, [billItems]);

  // Inline WYSIWYG Editable Component
  const EditableText: React.FC<{
    value: string;
    onSave?: (val: string) => void;
    className?: string;
    placeholder?: string;
  }> = ({ value, onSave, className = '', placeholder = 'Click to edit...' }) => {
    if (!isLiveEditMode || !onSave) {
      return <span className={className}>{value || placeholder}</span>;
    }

    return (
      <span
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onSave(e.currentTarget.textContent || '')}
        className={`hover:outline-dashed hover:outline-1 hover:outline-blue-500 focus:outline-2 focus:outline-blue-600 focus:bg-blue-50/50 rounded-xs px-0.5 cursor-text transition-all duration-75 inline-block ${className}`}
        title="Click to edit text directly"
      >
        {value || placeholder}
      </span>
    );
  };

  const invoiceNo = order?.invoiceNumber || 'INV-202609-1082';
  const orderDate = order?.createdAt ? new Date(order.createdAt) : new Date();
  const cashierName = order?.cashier?.name || 'Kalaasagar Admin';
  const customerName = order?.customer?.name || 'Walk-in Customer';
  const customerPhone = order?.customer?.phone || '';
  const pointsEarned = order?.customer?.pointsEarned || 25;
  const paymentMode = order?.paymentMethod || 'CASH / UPI';
  const tenderAmount = order?.paymentDetails?.tenderAmount ?? finalGrandTotal;
  const changeReturned = order?.paymentDetails?.changeReturned ?? 0;

  const visible = config.visibleSections || {
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
  };

  const labels = config.customLabels || {
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
  };

  return (
    <div
      id={containerId}
      className={`bg-white text-slate-900 shadow-2xl border border-slate-300 rounded-sm relative ${paperWidthClass} ${fontClass} ${fontSizeClass} print:p-0 print:m-0 print:border-none print:shadow-none`}
    >
      {/* Paper Roll Top Serration Graphic */}
      <div className="w-full h-1 bg-[radial-gradient(circle,transparent_2px,#e2e8f0_2px)] bg-[length:6px_6px] -mt-1 opacity-60 print:hidden" />

      {/* 1. STORE HEADER SECTION */}
      {visible.header && (
        <div
          className={`space-y-0.5 group relative pt-0 mt-0 ${
            config.headerAlignment === 'center'
              ? 'text-center'
              : config.headerAlignment === 'right'
              ? 'text-right'
              : 'text-left'
          }`}
        >
          {/* Quick remove section button on hover */}
          {isLiveEditMode && onToggleSection && (
            <button
              type="button"
              onClick={() => onToggleSection('header')}
              className="absolute -top-1 -right-1 p-0.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer print:hidden"
              title="Hide Store Header Section"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {config.showStoreLogo && (
            <div className="flex justify-center mb-0.5 group/logo relative">
              <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                <Store className="w-3.5 h-3.5" />
              </div>
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showStoreLogo', false)}
                  className="absolute -top-1 right-1/3 text-slate-400 hover:text-rose-600 opacity-0 group-hover/logo:opacity-100 cursor-pointer text-xs print:hidden"
                  title="Remove Logo"
                >
                  ×
                </button>
              )}
            </div>
          )}

          <h1 className="font-black text-sm sm:text-base uppercase tracking-wider text-slate-950 group/h relative mt-0 pt-0 leading-tight">
            <EditableText
              value={config.storeName || settings.storeName}
              onSave={onUpdateConfig ? (val) => onUpdateConfig('storeName', val) : undefined}
              placeholder="STORE NAME"
            />
          </h1>

          {(config.tagline || isLiveEditMode) && (
            <p className="text-[10px] text-slate-600 italic group/t relative">
              <EditableText
                value={config.tagline}
                onSave={onUpdateConfig ? (val) => onUpdateConfig('tagline', val) : undefined}
                placeholder="Tagline / slogan..."
              />
              {isLiveEditMode && config.tagline && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('tagline', '')}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/t:opacity-100 cursor-pointer"
                  title="Remove tagline"
                >
                  ×
                </button>
              )}
            </p>
          )}

          {(config.address || isLiveEditMode) && (
            <p className="text-[10px] text-slate-700 group/a relative">
              <EditableText
                value={config.address}
                onSave={onUpdateConfig ? (val) => onUpdateConfig('address', val) : undefined}
                placeholder="Address..."
              />
              {config.city ? `, ${config.city}` : ''}
              {config.pincode ? ` - ${config.pincode}` : ''}
              {isLiveEditMode && config.address && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('address', '')}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/a:opacity-100 cursor-pointer"
                  title="Remove address"
                >
                  ×
                </button>
              )}
            </p>
          )}

          {(config.phone || isLiveEditMode) && (
            <p className="text-[10px] text-slate-700 group/p relative">
              Tel:{' '}
              <EditableText
                value={config.phone}
                onSave={onUpdateConfig ? (val) => onUpdateConfig('phone', val) : undefined}
                placeholder="Phone..."
              />
              {isLiveEditMode && config.phone && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('phone', '')}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/p:opacity-100 cursor-pointer"
                  title="Remove phone"
                >
                  ×
                </button>
              )}
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-x-2 text-[10px] text-slate-700 pt-0.5">
            {(config.gstin || isLiveEditMode) && (
              <span className="group/g relative">
                GSTIN:{' '}
                <b className="font-mono">
                  <EditableText
                    value={config.gstin}
                    onSave={onUpdateConfig ? (val) => onUpdateConfig('gstin', val) : undefined}
                    placeholder="GSTIN..."
                  />
                </b>
                {isLiveEditMode && config.gstin && onUpdateConfig && (
                  <button
                    type="button"
                    onClick={() => onUpdateConfig('gstin', '')}
                    className="ml-0.5 text-slate-300 hover:text-rose-600 opacity-0 group-hover/g:opacity-100 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </span>
            )}
            {(config.fssaiNumber || isLiveEditMode) && (
              <span className="group/f relative">
                FSSAI:{' '}
                <b className="font-mono">
                  <EditableText
                    value={config.fssaiNumber}
                    onSave={onUpdateConfig ? (val) => onUpdateConfig('fssaiNumber', val) : undefined}
                    placeholder="FSSAI..."
                  />
                </b>
                {isLiveEditMode && config.fssaiNumber && onUpdateConfig && (
                  <button
                    type="button"
                    onClick={() => onUpdateConfig('fssaiNumber', '')}
                    className="ml-0.5 text-slate-300 hover:text-rose-600 opacity-0 group-hover/f:opacity-100 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </span>
            )}
          </div>

          {/* Dynamic Custom Header Fields */}
          {(config.customFields || [])
            .filter((f) => f.enabled && f.section === 'header')
            .map((f) => (
              <div key={f.id} className="text-[10px] text-slate-800 font-semibold group/f relative">
                <span>
                  <EditableText
                    value={f.label}
                    onSave={onUpdateCustomField ? (val) => onUpdateCustomField(f.id, { label: val }) : undefined}
                  />
                  :{' '}
                </span>
                <b className="font-mono">
                  <EditableText
                    value={f.value}
                    onSave={onUpdateCustomField ? (val) => onUpdateCustomField(f.id, { value: val }) : undefined}
                  />
                </b>
                {isLiveEditMode && onDeleteCustomField && (
                  <button
                    type="button"
                    onClick={() => onDeleteCustomField(f.id)}
                    className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/f:opacity-100 cursor-pointer"
                    title="Delete line"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

          {/* Top Custom Banners */}
          {(config.customBanners || [])
            .filter((b) => b.enabled && b.position === 'top')
            .map((b) => (
              <div
                key={b.id}
                className={`my-1.5 p-1 rounded text-[10px] font-bold text-center group/b relative ${
                  b.style === 'solid'
                    ? 'bg-slate-900 text-white'
                    : b.style === 'bordered'
                    ? 'border border-slate-900 text-slate-900'
                    : 'bg-amber-50 border border-dashed border-amber-500 text-amber-900'
                }`}
              >
                <EditableText
                  value={b.text}
                  onSave={onUpdateBanner ? (val) => onUpdateBanner(b.id, val) : undefined}
                />
                {isLiveEditMode && onDeleteBanner && (
                  <button
                    type="button"
                    onClick={() => onDeleteBanner(b.id)}
                    className="absolute top-0.5 right-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover/b:opacity-100 cursor-pointer"
                    title="Remove banner"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

          {/* Free text after header */}
          {(config.freeTextNotes || [])
            .filter((n) => n.enabled && n.position === 'after_header')
            .map((n) => (
              <div key={n.id} className="my-1 text-[9px] text-slate-700 italic group/n relative">
                <EditableText
                  value={n.text}
                  onSave={onUpdateFreeTextNote ? (val) => onUpdateFreeTextNote(n.id, val) : undefined}
                />
                {isLiveEditMode && onDeleteFreeTextNote && (
                  <button
                    type="button"
                    onClick={() => onDeleteFreeTextNote(n.id)}
                    className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/n:opacity-100 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

          {config.headerCustomText && (
            <div className="mt-1.5 py-0.5 bg-slate-100 font-extrabold text-[10px] uppercase tracking-widest text-slate-900 border-y border-slate-300 group/title relative">
              <EditableText
                value={config.headerCustomText}
                onSave={onUpdateConfig ? (val) => onUpdateConfig('headerCustomText', val) : undefined}
                placeholder="TAX INVOICE / RETAIL BILL"
              />
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('headerCustomText', '')}
                  className="absolute top-0.5 right-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover/title:opacity-100 cursor-pointer"
                  title="Remove title bar"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* DIVIDER */}
      {visible.header && <div className={dividerClass} />}

      {/* 2. INVOICE METADATA SECTION */}
      {visible.metadata && (
        <div className="space-y-0.5 text-[10px] group relative">
          {isLiveEditMode && onToggleSection && (
            <button
              type="button"
              onClick={() => onToggleSection('metadata')}
              className="absolute -top-1 -right-1 p-0.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Hide Metadata Section"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {config.showInvoiceNumber && (
            <div className="flex justify-between items-center group/inv relative">
              <span className="font-bold">
                <EditableText
                  value={labels.invoiceNoLabel}
                  onSave={onUpdateLabel ? (val) => onUpdateLabel('invoiceNoLabel', val) : undefined}
                />
              </span>
              <span className="font-mono font-black text-slate-950">{invoiceNo}</span>
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showInvoiceNumber', false)}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/inv:opacity-100 cursor-pointer text-xs"
                  title="Remove invoice no"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {config.showDateTime && (
            <div className="flex justify-between items-center text-slate-700 group/dt relative">
              <span>
                <EditableText
                  value={labels.dateLabel}
                  onSave={onUpdateLabel ? (val) => onUpdateLabel('dateLabel', val) : undefined}
                />
              </span>
              <span>
                {orderDate.toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showDateTime', false)}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/dt:opacity-100 cursor-pointer text-xs"
                  title="Remove date"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {config.showCashierName && (
            <div className="flex justify-between items-center text-slate-700 group/csh relative">
              <span>
                <EditableText
                  value={labels.cashierLabel}
                  onSave={onUpdateLabel ? (val) => onUpdateLabel('cashierLabel', val) : undefined}
                />
              </span>
              <span>{cashierName}</span>
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showCashierName', false)}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/csh:opacity-100 cursor-pointer text-xs"
                  title="Remove cashier"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {config.showCustomerName && (
            <div className="flex justify-between items-center font-semibold pt-0.5 text-slate-900 group/cust relative">
              <span>
                <EditableText
                  value={labels.customerLabel}
                  onSave={onUpdateLabel ? (val) => onUpdateLabel('customerLabel', val) : undefined}
                />
              </span>
              <span>{customerName}</span>
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showCustomerName', false)}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/cust:opacity-100 cursor-pointer text-xs"
                  title="Remove customer name"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {config.showCustomerPhone && customerPhone && (
            <div className="flex justify-between items-center text-slate-700 group/ph relative">
              <span>
                <EditableText
                  value={labels.phoneLabel}
                  onSave={onUpdateLabel ? (val) => onUpdateLabel('phoneLabel', val) : undefined}
                />
              </span>
              <span className="font-mono">{customerPhone}</span>
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showCustomerPhone', false)}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/ph:opacity-100 cursor-pointer text-xs"
                  title="Remove customer phone"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {config.showPaymentMethod && (
            <div className="flex justify-between items-center text-slate-700 group/pm relative">
              <span>
                <EditableText
                  value={labels.paymentModeLabel}
                  onSave={onUpdateLabel ? (val) => onUpdateLabel('paymentModeLabel', val) : undefined}
                />
              </span>
              <span className="uppercase font-bold text-slate-900">{paymentMode}</span>
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showPaymentMethod', false)}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/pm:opacity-100 cursor-pointer text-xs"
                  title="Remove payment mode"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* Dynamic Custom Metadata Fields */}
          {(config.customFields || [])
            .filter((f) => f.enabled && f.section === 'metadata')
            .map((f) => (
              <div key={f.id} className="flex justify-between items-center text-slate-800 group/m relative">
                <span>
                  <EditableText
                    value={f.label}
                    onSave={onUpdateCustomField ? (val) => onUpdateCustomField(f.id, { label: val }) : undefined}
                  />
                  :
                </span>
                <b className="font-mono">
                  <EditableText
                    value={f.value}
                    onSave={onUpdateCustomField ? (val) => onUpdateCustomField(f.id, { value: val }) : undefined}
                  />
                </b>
                {isLiveEditMode && onDeleteCustomField && (
                  <button
                    type="button"
                    onClick={() => onDeleteCustomField(f.id)}
                    className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/m:opacity-100 cursor-pointer text-xs"
                    title="Delete metadata field"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

          {config.showTokenNumber && (
            <div className="flex justify-between items-center font-bold text-blue-700 group/tok relative">
              <span>
                <EditableText
                  value={labels.tokenLabel}
                  onSave={onUpdateLabel ? (val) => onUpdateLabel('tokenLabel', val) : undefined}
                />
              </span>
              <span className="font-mono text-xs">#T-42</span>
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showTokenNumber', false)}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/tok:opacity-100 cursor-pointer text-xs"
                  title="Remove token"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* DIVIDER */}
      {visible.metadata && <div className={dividerClass} />}

      {/* 3. ITEM TABLE SECTION */}
      {visible.itemsTable && (
        <div className="space-y-1 group relative">
          {isLiveEditMode && onToggleSection && (
            <button
              type="button"
              onClick={() => onToggleSection('itemsTable')}
              className="absolute -top-1 -right-1 p-0.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Hide Items Table"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-300 font-extrabold text-[10px] uppercase text-slate-800">
                {config.showItemIndex && <th className="py-1 w-5">#</th>}
                <th className="py-1">
                  <EditableText
                    value={labels.itemHeader}
                    onSave={onUpdateLabel ? (val) => onUpdateLabel('itemHeader', val) : undefined}
                  />
                </th>
                <th className="py-1 text-center">
                  <EditableText
                    value={labels.qtyHeader}
                    onSave={onUpdateLabel ? (val) => onUpdateLabel('qtyHeader', val) : undefined}
                  />
                </th>
                {config.showMrp && (
                  <th className="py-1 text-right">
                    <EditableText
                      value={labels.mrpHeader}
                      onSave={onUpdateLabel ? (val) => onUpdateLabel('mrpHeader', val) : undefined}
                    />
                  </th>
                )}
                {config.showRate && (
                  <th className="py-1 text-right">
                    <EditableText
                      value={labels.rateHeader}
                      onSave={onUpdateLabel ? (val) => onUpdateLabel('rateHeader', val) : undefined}
                    />
                  </th>
                )}
                {config.showGstPerItem && <th className="py-1 text-center">GST%</th>}
                <th className="py-1 text-right">
                  <EditableText
                    value={labels.totalHeader}
                    onSave={onUpdateLabel ? (val) => onUpdateLabel('totalHeader', val) : undefined}
                  />
                </th>
                {isLiveEditMode && <th className="w-4" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {billItems.map((item, idx) => (
                <tr key={item.id || idx} className="align-top text-[10px] group/item hover:bg-slate-50">
                  {config.showItemIndex && <td className="py-1 text-slate-500">{idx + 1}</td>}
                  <td className="py-1 pr-1 font-medium">
                    <div className="font-bold text-slate-900 leading-tight">
                      <EditableText
                        value={item.productName}
                        onSave={onUpdateItem ? (val) => onUpdateItem(item.id, { productName: val }) : undefined}
                      />
                    </div>
                    {config.showBarcode && item.barcode && (
                      <div className="text-[9px] text-slate-500 font-mono">Barcode: {item.barcode}</div>
                    )}
                    {config.showHsnCode && (
                      <div className="text-[9px] text-slate-500 font-mono">
                        HSN: {item.hsnCode || '1901'} | Taxable: {(item.sellingPrice * item.quantity).toFixed(2)}
                      </div>
                    )}
                    {config.showDiscountPerItem && item.discountAmount > 0 && (
                      <div className="text-[9px] text-emerald-700 font-semibold">
                        Discount: -{item.discountAmount.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="py-1 text-center whitespace-nowrap font-bold">
                    <EditableText
                      value={String(item.quantity)}
                      onSave={
                        onUpdateItem
                          ? (val) => onUpdateItem(item.id, { quantity: parseFloat(val) || 1 })
                          : undefined
                      }
                    />
                  </td>
                  {config.showMrp && (
                    <td className="py-1 text-right text-slate-700 font-medium">
                      <EditableText
                        value={item.mrp.toFixed(2)}
                        onSave={
                          onUpdateItem
                            ? (val) => onUpdateItem(item.id, { mrp: parseFloat(val) || 0 })
                            : undefined
                        }
                      />
                    </td>
                  )}
                  {config.showRate && (
                    <td className="py-1 text-right font-medium">
                      <EditableText
                        value={item.sellingPrice.toFixed(2)}
                        onSave={
                          onUpdateItem
                            ? (val) => onUpdateItem(item.id, { sellingPrice: parseFloat(val) || 0 })
                            : undefined
                        }
                      />
                    </td>
                  )}
                  {config.showGstPerItem && (
                    <td className="py-1 text-center text-slate-600 font-mono">
                      <EditableText
                        value={String(item.gstRate)}
                        onSave={
                          onUpdateItem
                            ? (val) => onUpdateItem(item.id, { gstRate: parseFloat(val) || 0 })
                            : undefined
                        }
                      />
                      %
                    </td>
                  )}
                  <td className="py-1 text-right font-bold text-slate-950">
                    <EditableText
                      value={item.total.toFixed(2)}
                      onSave={
                        onUpdateItem
                          ? (val) => onUpdateItem(item.id, { total: parseFloat(val) || 0 })
                          : undefined
                      }
                    />
                  </td>
                  {isLiveEditMode && onDeleteItem && (
                    <td className="py-1 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="text-slate-300 hover:text-rose-600 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer text-xs"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Middle Custom Banners */}
      {(config.customBanners || [])
        .filter((b) => b.enabled && b.position === 'middle')
        .map((b) => (
          <div
            key={b.id}
            className={`my-2 p-1.5 rounded text-[10px] font-bold text-center group/b relative ${
              b.style === 'solid'
                ? 'bg-slate-900 text-white'
                : b.style === 'bordered'
                ? 'border border-slate-900 text-slate-900'
                : 'bg-amber-50 border border-dashed border-amber-500 text-amber-900'
            }`}
          >
            <EditableText
              value={b.text}
              onSave={onUpdateBanner ? (val) => onUpdateBanner(b.id, val) : undefined}
            />
            {isLiveEditMode && onDeleteBanner && (
              <button
                type="button"
                onClick={() => onDeleteBanner(b.id)}
                className="absolute top-0.5 right-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover/b:opacity-100 cursor-pointer"
                title="Remove banner"
              >
                ×
              </button>
            )}
          </div>
        ))}

      {/* Free text after items */}
      {(config.freeTextNotes || [])
        .filter((n) => n.enabled && n.position === 'after_items')
        .map((n) => (
          <div key={n.id} className="my-1 text-[9px] text-slate-700 italic group/n relative">
            <EditableText
              value={n.text}
              onSave={onUpdateFreeTextNote ? (val) => onUpdateFreeTextNote(n.id, val) : undefined}
            />
            {isLiveEditMode && onDeleteFreeTextNote && (
              <button
                type="button"
                onClick={() => onDeleteFreeTextNote(n.id)}
                className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/n:opacity-100 cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        ))}

      {/* DIVIDER */}
      {visible.itemsTable && <div className={dividerClass} />}

      {/* 4. TOTALS & SAVINGS SECTION */}
      {visible.totals && (
        <div className="space-y-1 text-[10px] group relative">
          {isLiveEditMode && onToggleSection && (
            <button
              type="button"
              onClick={() => onToggleSection('totals')}
              className="absolute -top-1 -right-1 p-0.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Hide Totals Section"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {config.showItemCountQty && (
            <div className="flex justify-between items-center text-slate-600 text-[10px] group/qty relative">
              <span>
                <EditableText
                  value={labels.itemsCountLabel}
                  onSave={onUpdateLabel ? (val) => onUpdateLabel('itemsCountLabel', val) : undefined}
                />{' '}
                <b>{billItems.length}</b>
              </span>
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showItemCountQty', false)}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/qty:opacity-100 cursor-pointer text-xs"
                  title="Remove item count"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {config.showSubtotal && (
            <div className="flex justify-between items-center text-slate-700 pt-0.5 group/sub relative">
              <span>
                <EditableText
                  value={labels.subtotalLabel}
                  onSave={onUpdateLabel ? (val) => onUpdateLabel('subtotalLabel', val) : undefined}
                />
              </span>
              <span className="font-bold font-mono">
                {currency}
                <EditableText
                  value={calculatedSubtotal.toFixed(2)}
                  onSave={onUpdateConfig ? (val) => onUpdateConfig('subtotalOverride', parseFloat(val) || 0) : undefined}
                />
              </span>
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showSubtotal', false)}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/sub:opacity-100 cursor-pointer text-xs"
                  title="Remove subtotal"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* Dynamic Custom Total Rows */}
          {(config.customTotalRows || [])
            .filter((r) => r.enabled)
            .map((r) => (
              <div key={r.id} className="flex justify-between items-center text-slate-800 font-semibold group/r relative">
                <span>
                  <EditableText
                    value={r.label}
                    onSave={onUpdateTotalRow ? (val) => onUpdateTotalRow(r.id, { label: val }) : undefined}
                  />
                  :
                </span>
                <span className="font-mono font-bold">
                  {r.amount >= 0 ? '+' : '-'}
                  {currency}
                  <EditableText
                    value={Math.abs(r.amount).toFixed(2)}
                    onSave={
                      onUpdateTotalRow
                        ? (val) => {
                            const parsed = parseFloat(val) || 0;
                            onUpdateTotalRow(r.id, {
                              amount: r.type === 'discount' ? -Math.abs(parsed) : parsed,
                            });
                          }
                        : undefined
                    }
                  />
                </span>
                {isLiveEditMode && onDeleteTotalRow && (
                  <button
                    type="button"
                    onClick={() => onDeleteTotalRow(r.id)}
                    className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/r:opacity-100 cursor-pointer text-xs"
                    title="Remove charge line"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

          {/* GRAND TOTAL ROW */}
          <div className="flex justify-between items-center py-1 text-xs font-black text-slate-950 border-t border-b border-slate-900 my-1 group/grand relative">
            <span className="text-xs">
              <EditableText
                value={labels.netPayableLabel}
                onSave={onUpdateLabel ? (val) => onUpdateLabel('netPayableLabel', val) : undefined}
              />
            </span>
            <span className="text-sm font-mono font-black">
              {currency}
              <EditableText
                value={finalGrandTotal.toFixed(2)}
                onSave={
                  onUpdateConfig
                    ? (val) => {
                        const customVal = parseFloat(val);
                        if (!isNaN(customVal)) {
                          onUpdateConfig('overrideTotalEnabled', true);
                          onUpdateConfig('overrideTotalAmount', customVal);
                        }
                      }
                    : undefined
                }
              />
            </span>
          </div>

          {/* TOTAL SAVINGS (BELOW NET AMOUNT PAYABLE) */}
          {config.showTotalDiscount && (calculatedDiscount > 0 || config.discountOverride !== undefined) && (
            <div className="flex justify-between items-center text-emerald-800 font-bold py-0.5 group/disc relative text-[10px]">
              <span>
                <EditableText
                  value={labels.discountLabel}
                  onSave={onUpdateLabel ? (val) => onUpdateLabel('discountLabel', val) : undefined}
                />
              </span>
              <span className="font-mono font-bold text-emerald-800">
                {currency}
                <EditableText
                  value={calculatedDiscount.toFixed(2)}
                  onSave={onUpdateConfig ? (val) => onUpdateConfig('discountOverride', parseFloat(val) || 0) : undefined}
                />
              </span>
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showTotalDiscount', false)}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/disc:opacity-100 cursor-pointer text-xs"
                  title="Remove savings row"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* TENDER & CHANGE */}
          {config.showTenderAndChange && (
            <div className="space-y-0.5 text-slate-600 text-[10px] pt-0.5 group/tc relative">
              <div className="flex justify-between items-center">
                <span>
                  <EditableText
                    value={labels.tenderedLabel}
                    onSave={onUpdateLabel ? (val) => onUpdateLabel('tenderedLabel', val) : undefined}
                  />
                </span>
                <span className="font-mono">
                  {tenderAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>
                  <EditableText
                    value={labels.changeLabel}
                    onSave={onUpdateLabel ? (val) => onUpdateLabel('changeLabel', val) : undefined}
                  />
                </span>
                <span className="font-mono">{changeReturned.toFixed(2)}</span>
              </div>
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showTenderAndChange', false)}
                  className="absolute -top-1 -right-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/tc:opacity-100 cursor-pointer text-xs"
                  title="Remove tender & change"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* SUPERMARKET SAVINGS BANNER */}
          {visible.savingsBanner && config.showSavingsBanner && calculatedDiscount > 0 && (
            <div className="mt-2 p-1.5 bg-emerald-50 border border-dashed border-emerald-500 text-emerald-900 text-center rounded text-[10px] font-black tracking-wide group/sav relative">
              ★ YOU SAVED {currency}
              {calculatedDiscount.toFixed(2)} ON THIS PURCHASE! ★
              {isLiveEditMode && onToggleSection && (
                <button
                  type="button"
                  onClick={() => onToggleSection('savingsBanner')}
                  className="absolute top-0.5 right-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover/sav:opacity-100 cursor-pointer"
                  title="Remove savings banner"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* GST SUMMARY TABLE */}
          {visible.gstBreakdown && config.showGstSummary && gstBreakdown.length > 0 && (
            <div className="pt-2 group/gst relative">
              {isLiveEditMode && onToggleSection && (
                <button
                  type="button"
                  onClick={() => onToggleSection('gstBreakdown')}
                  className="absolute top-1 right-0 text-slate-400 hover:text-rose-600 opacity-0 group-hover/gst:opacity-100 cursor-pointer text-xs"
                  title="Remove GST table"
                >
                  ×
                </button>
              )}
              <div className="text-[9px] font-bold uppercase text-slate-700 mb-0.5">
                GST Tax Breakdown
              </div>
              <table className="w-full text-[9px] text-center border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-0.5">Rate</th>
                    <th className="py-0.5">Taxable</th>
                    <th className="py-0.5">CGST</th>
                    <th className="py-0.5">SGST</th>
                    <th className="py-0.5">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {gstBreakdown.map((g) => (
                    <tr key={g.rate}>
                      <td className="py-0.5 font-bold">{g.rate}%</td>
                      <td className="py-0.5">
                        {g.taxable.toFixed(2)}
                      </td>
                      <td className="py-0.5">
                        {g.cgst.toFixed(2)}
                      </td>
                      <td className="py-0.5">
                        {g.sgst.toFixed(2)}
                      </td>
                      <td className="py-0.5 font-bold">
                        {g.totalGst.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* LOYALTY POINTS SUMMARY */}
          {config.showLoyaltyPoints && (
            <div className="flex justify-between text-[10px] text-blue-800 font-bold pt-1 group/loy relative">
              <span>LOYALTY POINTS EARNED:</span>
              <span>+{pointsEarned} PTS</span>
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showLoyaltyPoints', false)}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/loy:opacity-100 cursor-pointer text-xs"
                  title="Remove loyalty line"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Free text after totals */}
      {(config.freeTextNotes || [])
        .filter((n) => n.enabled && n.position === 'after_totals')
        .map((n) => (
          <div key={n.id} className="my-1.5 text-[9px] text-slate-700 italic group/n relative text-center">
            <EditableText
              value={n.text}
              onSave={onUpdateFreeTextNote ? (val) => onUpdateFreeTextNote(n.id, val) : undefined}
            />
            {isLiveEditMode && onDeleteFreeTextNote && (
              <button
                type="button"
                onClick={() => onDeleteFreeTextNote(n.id)}
                className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/n:opacity-100 cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        ))}

      {/* DIVIDER */}
      {visible.totals && <div className={dividerClass} />}

      {/* 5. FOOTER & POLICY SECTION */}
      {visible.footer && (
        <div className="text-center space-y-1 text-[10px] group relative">
          {isLiveEditMode && onToggleSection && (
            <button
              type="button"
              onClick={() => onToggleSection('footer')}
              className="absolute -top-1 -right-1 p-0.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Hide Footer Section"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Bottom Custom Banners */}
          {(config.customBanners || [])
            .filter((b) => b.enabled && b.position === 'bottom')
            .map((b) => (
              <div
                key={b.id}
                className={`my-1.5 p-1 rounded text-[10px] font-bold text-center group/b relative ${
                  b.style === 'solid'
                    ? 'bg-slate-900 text-white'
                    : b.style === 'bordered'
                    ? 'border border-slate-900 text-slate-900'
                    : 'bg-amber-50 border border-dashed border-amber-500 text-amber-900'
                }`}
              >
                <EditableText
                  value={b.text}
                  onSave={onUpdateBanner ? (val) => onUpdateBanner(b.id, val) : undefined}
                />
                {isLiveEditMode && onDeleteBanner && (
                  <button
                    type="button"
                    onClick={() => onDeleteBanner(b.id)}
                    className="absolute top-0.5 right-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover/b:opacity-100 cursor-pointer"
                    title="Remove banner"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

          {(config.thankYouMessage || isLiveEditMode) && (
            <p className="font-extrabold uppercase text-slate-900 tracking-wide group/ty relative">
              <EditableText
                value={config.thankYouMessage || settings.receiptFooter || 'THANK YOU FOR SHOPPING WITH US!'}
                onSave={onUpdateConfig ? (val) => onUpdateConfig('thankYouMessage', val) : undefined}
                placeholder="Thank you message..."
              />
              {isLiveEditMode && config.thankYouMessage && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('thankYouMessage', '')}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/ty:opacity-100 cursor-pointer"
                >
                  ×
                </button>
              )}
            </p>
          )}

          {(config.returnPolicy || isLiveEditMode) && (
            <p className="text-[9px] text-slate-600 leading-tight group/rp relative">
              <EditableText
                value={config.returnPolicy || settings.returnPolicy || ''}
                onSave={onUpdateConfig ? (val) => onUpdateConfig('returnPolicy', val) : undefined}
                placeholder="Return policy disclaimer..."
              />
              {isLiveEditMode && config.returnPolicy && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('returnPolicy', '')}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/rp:opacity-100 cursor-pointer"
                >
                  ×
                </button>
              )}
            </p>
          )}

          {(config.footerCustomNote || isLiveEditMode) && (
            <p className="text-[9px] text-slate-700 font-bold group/fn relative">
              <EditableText
                value={config.footerCustomNote}
                onSave={onUpdateConfig ? (val) => onUpdateConfig('footerCustomNote', val) : undefined}
                placeholder="Custom delivery / note..."
              />
              {isLiveEditMode && config.footerCustomNote && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('footerCustomNote', '')}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/fn:opacity-100 cursor-pointer"
                >
                  ×
                </button>
              )}
            </p>
          )}

          {/* Dynamic Custom Footer Fields */}
          {(config.customFields || [])
            .filter((f) => f.enabled && f.section === 'footer')
            .map((f) => (
              <p key={f.id} className="text-[9px] text-slate-600 group/ff relative">
                <span>
                  <EditableText
                    value={f.label}
                    onSave={onUpdateCustomField ? (val) => onUpdateCustomField(f.id, { label: val }) : undefined}
                  />
                  :{' '}
                </span>
                <b>
                  <EditableText
                    value={f.value}
                    onSave={onUpdateCustomField ? (val) => onUpdateCustomField(f.id, { value: val }) : undefined}
                  />
                </b>
                {isLiveEditMode && onDeleteCustomField && (
                  <button
                    type="button"
                    onClick={() => onDeleteCustomField(f.id)}
                    className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/ff:opacity-100 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </p>
            ))}

          {/* Free text in footer */}
          {(config.freeTextNotes || [])
            .filter((n) => n.enabled && n.position === 'footer')
            .map((n) => (
              <div key={n.id} className="my-1 text-[9px] text-slate-600 group/n relative">
                <EditableText
                  value={n.text}
                  onSave={onUpdateFreeTextNote ? (val) => onUpdateFreeTextNote(n.id, val) : undefined}
                />
                {isLiveEditMode && onDeleteFreeTextNote && (
                  <button
                    type="button"
                    onClick={() => onDeleteFreeTextNote(n.id)}
                    className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/n:opacity-100 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

          {(config.socialHandles || isLiveEditMode) && (
            <p className="text-[9px] text-slate-500 font-mono group/soc relative">
              <EditableText
                value={config.socialHandles || ''}
                onSave={onUpdateConfig ? (val) => onUpdateConfig('socialHandles', val) : undefined}
                placeholder="Social / Website links..."
              />
              {isLiveEditMode && config.socialHandles && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('socialHandles', '')}
                  className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/soc:opacity-100 cursor-pointer"
                >
                  ×
                </button>
              )}
            </p>
          )}

          {/* Signature Block */}
          {config.showSignature && (
            <div className="pt-6 pb-2 text-right group/sig relative">
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showSignature', false)}
                  className="absolute top-2 right-0 text-slate-300 hover:text-rose-600 opacity-0 group-hover/sig:opacity-100 cursor-pointer text-xs"
                  title="Remove signature"
                >
                  ×
                </button>
              )}
              <div className="inline-block border-t border-slate-900 pt-1 px-4 text-center">
                <span className="text-[10px] font-bold text-slate-800">
                  <EditableText
                    value={config.signatureLabel || labels.signatureText || 'Authorized Signatory'}
                    onSave={onUpdateConfig ? (val) => onUpdateConfig('signatureLabel', val) : undefined}
                    placeholder="Authorized Signatory"
                  />
                </span>
              </div>
            </div>
          )}

          {/* Barcode Render */}
          {visible.barcode && config.showBarcodeFooter && (
            <div className="pt-2 flex flex-col items-center justify-center group/bc relative">
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showBarcodeFooter', false)}
                  className="absolute top-0 right-2 text-slate-300 hover:text-rose-600 opacity-0 group-hover/bc:opacity-100 cursor-pointer text-xs"
                  title="Remove barcode"
                >
                  ×
                </button>
              )}
              <BarcodeSvg
                value={invoiceNo}
                format="CODE128"
                width={1.2}
                height={32}
                fontSize={10}
              />
            </div>
          )}

          {/* QR Code Render */}
          {visible.qrCode && config.showQrCodeFooter && (
            <div className="pt-2 flex flex-col items-center justify-center group/qr relative">
              {isLiveEditMode && onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => onUpdateConfig('showQrCodeFooter', false)}
                  className="absolute top-0 right-2 text-slate-300 hover:text-rose-600 opacity-0 group-hover/qr:opacity-100 cursor-pointer text-xs"
                  title="Remove QR code"
                >
                  ×
                </button>
              )}
              <QrCodeSvg
                value={
                  config.qrCustomValue ||
                  `upi://pay?pa=supermarket@upi&pn=${encodeURIComponent(
                    config.storeName || settings.storeName
                  )}&am=${finalGrandTotal}&cu=INR`
                }
                size={64}
              />
              <span className="text-[8px] text-slate-500 mt-0.5">
                Scan to Pay / Verify e-Invoice
              </span>
            </div>
          )}
        </div>
      )}

      {/* Paper Roll Bottom Tear Serration */}
      <div className="w-full h-1 bg-[radial-gradient(circle,transparent_2px,#e2e8f0_2px)] bg-[length:6px_6px] -mb-1 opacity-60 mt-3" />
    </div>
  );
};
