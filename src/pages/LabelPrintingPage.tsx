import React, { useState } from 'react';
import {
  Tag,
  Printer,
  Settings,
  Sliders,
  Check,
  Package,
  Layers,
  Sparkles,
  QrCode,
  Barcode,
  Search,
} from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { Product } from '../types';
import { BarcodeSvg } from '../components/common/BarcodeSvg';
import { QrCodeSvg } from '../components/common/QrCodeSvg';

export const LabelPrintingPage: React.FC = () => {
  const { products, settings } = usePosStore();

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([
    products[0]?.id || '',
    products[1]?.id || '',
  ]);
  const [productSearch, setProductSearch] = useState<string>('');

  // Designer Configs
  const [labelFormat, setLabelFormat] = useState<'58mm' | '80mm' | 'a4_sheet'>('80mm');
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showMrp, setShowMrp] = useState<boolean>(true);
  const [showBarcode, setShowBarcode] = useState<boolean>(true);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [showSavingsBadge, setShowSavingsBadge] = useState<boolean>(true);
  const [showGstRate, setShowGstRate] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [tagTitle, setTagTitle] = useState<string>(settings.storeName);
  const [copiesPerItem, setCopiesPerItem] = useState<number>(1);

  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));

  const toggleProductSelect = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((pId) => pId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p.id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <span>Visual Shelf Price Tag & Barcode Label Designer</span>
          </h3>
          <p className="text-xs text-slate-400">
            Design, preview, and batch-print shelf tags for 58mm / 80mm thermal rolls and A4 sticker sheets
          </p>
        </div>

        <button
          onClick={handlePrint}
          disabled={selectedProducts.length === 0}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Printer className="w-4 h-4" />
          <span>Print Labels ({selectedProducts.length * copiesPerItem} Tags)</span>
        </button>
      </div>

      {/* Main Grid: Left Control Panel + Right Live Visual Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Label Dimensions & Format */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" /> Paper Format & Dimensions
            </h4>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '58mm', label: '58mm Thermal' },
                { id: '80mm', label: '80mm Thermal' },
                { id: 'a4_sheet', label: 'A4 Sheet (24-up)' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setLabelFormat(fmt.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    labelFormat === fmt.id
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>

            {/* Custom Store Tagline on Tag */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Header on Tag</label>
              <input
                type="text"
                value={tagTitle}
                onChange={(e) => setTagTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>

            {/* Toggle Options */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-700">
              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg">
                <span>Display Store Name Header</span>
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="rounded text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg">
                <span>Display Barcode (EAN/UPC)</span>
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={(e) => setShowBarcode(e.target.checked)}
                  className="rounded text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg">
                <span>Display MRP Strikethrough</span>
                <input
                  type="checkbox"
                  checked={showMrp}
                  onChange={(e) => setShowMrp(e.target.checked)}
                  className="rounded text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg">
                <span>Display "Special Offer" Savings Badge</span>
                <input
                  type="checkbox"
                  checked={showSavingsBadge}
                  onChange={(e) => setShowSavingsBadge(e.target.checked)}
                  className="rounded text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg">
                <span>Display QR Code for Digital Info</span>
                <input
                  type="checkbox"
                  checked={showQr}
                  onChange={(e) => setShowQr(e.target.checked)}
                  className="rounded text-blue-600"
                />
              </label>
            </div>
          </div>

          {/* Product Batch Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Items to Print ({selectedProductIds.length})
              </h4>
              <button
                onClick={handleSelectAll}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                {selectedProductIds.length === products.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search items for batch print..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 pr-1">
              {products
                .filter((p) =>
                  productSearch ? p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode.includes(productSearch) : true
                )
                .slice(0, 60)
                .map((p) => {
                  const isChecked = selectedProductIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="py-2 px-1 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProductSelect(p.id)}
                          className="rounded text-blue-600"
                        />
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {p.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{p.sellingPrice}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right Preview Canvas (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-200/80 rounded-3xl p-6 border border-slate-300 flex flex-col justify-start items-center min-h-[500px] overflow-y-auto">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">
            Live Print Layout Preview ({labelFormat.toUpperCase()})
          </span>

          {/* Printable Container */}
          <div
            id="printable-receipt"
            className={`w-full flex flex-wrap gap-4 justify-center ${
              labelFormat === 'a4_sheet' ? 'max-w-2xl bg-white p-6 rounded-2xl shadow-xl' : ''
            }`}
          >
            {selectedProducts.map((prod) => {
              const savings = prod.mrp - prod.sellingPrice;
              const savingsPercent = prod.mrp > 0 ? Math.round((savings / prod.mrp) * 100) : 0;

              return (
                <div
                  key={prod.id}
                  className={`bg-white border-2 border-slate-900 rounded-xl p-3 shadow-md text-slate-900 flex flex-col justify-between ${
                    labelFormat === '58mm'
                      ? 'w-[56mm] min-h-[40mm]'
                      : labelFormat === '80mm'
                      ? 'w-[76mm] min-h-[46mm]'
                      : 'w-[62mm] h-[36mm]'
                  }`}
                >
                  {/* Tag Header */}
                  {showStoreName && (
                    <div className="border-b border-slate-900 pb-1 mb-1 text-center">
                      <h4 className="font-black text-[11px] tracking-wider uppercase leading-none">
                        {tagTitle}
                      </h4>
                      <span className="text-[8px] text-slate-600 block">Supermarket Fresh Tag</span>
                    </div>
                  )}

                  {/* Product Title */}
                  <div className="min-w-0">
                    <h3 className="font-black text-xs leading-tight line-clamp-2 uppercase">
                      {prod.name}
                    </h3>
                    <span className="text-[9px] text-slate-600 font-medium">
                      Net: 1 {prod.unit} • Incl. GST {prod.gstRate}%
                    </span>
                  </div>

                  {/* Price Banner */}
                  <div className="my-1.5 p-1 bg-slate-950 text-white rounded-lg flex items-center justify-between px-2">
                    <div>
                      {showMrp && prod.mrp > prod.sellingPrice && (
                        <span className="text-[9px] text-slate-400 line-through block leading-none">
                          MRP: ₹{prod.mrp.toFixed(2)}
                        </span>
                      )}
                      <span className="text-[10px] text-amber-400 font-extrabold uppercase leading-none">
                        Offer Price
                      </span>
                    </div>

                    <span className="text-base font-black text-amber-400 leading-none">
                      {settings.currencySymbol}{prod.sellingPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Savings Badge */}
                  {showSavingsBadge && savings > 0 && (
                    <div className="text-center py-0.5 bg-rose-600 text-white font-black text-[9px] rounded uppercase tracking-wider mb-1">
                      SAVE {settings.currencySymbol}{savings.toFixed(2)} ({savingsPercent}% OFF)
                    </div>
                  )}

                  {/* Barcode / QR */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-300">
                    {showBarcode && (
                      <div className="flex-1 overflow-hidden flex justify-center">
                        <BarcodeSvg value={prod.barcode} height={20} width={1.1} fontSize={8} />
                      </div>
                    )}
                    {showQr && (
                      <div className="flex-shrink-0 pl-1">
                        <QrCodeSvg value={`ITEM:${prod.barcode}`} size={32} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
