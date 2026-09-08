import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  Percent,
  Edit2,
  ShoppingCart,
  Check,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';
import { CartItem } from '../../types';

export const CartTable: React.FC = () => {
  const {
    cart,
    updateCartItemQty,
    updateCartItemPrice,
    updateCartItemMrp,
    updateCartItemDiscount,
    removeFromCart,
    settings,
  } = usePosStore();

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  const [editingMrpId, setEditingMrpId] = useState<string | null>(null);
  const [tempMrp, setTempMrp] = useState<string>('');

  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [tempDiscount, setTempDiscount] = useState<string>('');

  const handleStartEditPrice = (item: CartItem) => {
    setEditingPriceId(item.id);
    setTempPrice(String(item.sellingPrice));
    setEditingMrpId(null);
  };

  const handleSavePrice = (id: string) => {
    const val = parseFloat(tempPrice);
    if (!isNaN(val) && val >= 0) {
      updateCartItemPrice(id, val);
    }
    setEditingPriceId(null);
  };

  const handleStartEditMrp = (item: CartItem) => {
    setEditingMrpId(item.id);
    setTempMrp(String(item.mrp));
    setEditingPriceId(null);
  };

  const handleSaveMrp = (id: string) => {
    const val = parseFloat(tempMrp);
    if (!isNaN(val) && val >= 0) {
      updateCartItemMrp(id, val);
    }
    setEditingMrpId(null);
  };

  const handleStartEditDiscount = (item: CartItem) => {
    setEditingDiscountId(item.id);
    setTempDiscount(String(item.discountPercent));
  };

  const handleSaveDiscount = (id: string) => {
    const val = parseFloat(tempDiscount);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      updateCartItemDiscount(id, val);
    }
    setEditingDiscountId(null);
  };

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-300 select-none">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-inner">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Billing Cart is Empty</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
          Scan product barcodes with USB scanner or click items from the left product catalog to start billing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* Table Header */}
      <div className="bg-slate-900 text-white px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider grid grid-cols-12 gap-2 items-center rounded-t-2xl flex-shrink-0">
        <span className="col-span-1 text-center">#</span>
        <span className="col-span-4">Item Details</span>
        <span className="col-span-2 text-right">Price / MRP</span>
        <span className="col-span-2 text-center">Qty</span>
        <span className="col-span-1 text-center">Disc%</span>
        <span className="col-span-2 text-right pr-2">Total</span>
      </div>

      {/* Cart Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-0.5">
        {cart.map((item, index) => {
          const isOverStock = item.quantity >= item.product.stock;

          return (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-2 items-center px-3.5 py-2 hover:bg-blue-50/40 transition-colors text-slate-700"
            >
              {/* Row Number */}
              <div className="col-span-1 text-center font-bold text-xs text-slate-400">
                {index + 1}
              </div>

              {/* Product Info */}
              <div className="col-span-4 min-w-0 pr-1">
                <p className="font-bold text-xs sm:text-sm text-slate-900 truncate leading-snug" title={item.product.name}>
                  {item.product.name}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                  <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[10px] text-slate-600 font-semibold">{item.product.barcode}</span>
                  <span>•</span>
                  <span className="font-medium text-slate-600">{item.product.unit}</span>
                  <span>•</span>
                  <span className="text-blue-600 font-bold bg-blue-50 px-1 py-0.2 rounded text-[10px]">GST {item.gstRate}%</span>
                </div>
              </div>

              {/* Unit Price & MRP (Both Quick-Editable) */}
              <div className="col-span-2 text-right">
                {editingPriceId === item.id ? (
                  <div className="flex items-center justify-end gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSavePrice(item.id);
                        if (e.key === 'Escape') setEditingPriceId(null);
                      }}
                      onBlur={() => handleSavePrice(item.id)}
                      className="w-16 px-1.5 py-0.5 text-right font-bold text-xs bg-amber-50 border-2 border-amber-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSavePrice(item.id)}
                      className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                      title="Save Selling Price"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => handleStartEditPrice(item)}
                    className="cursor-pointer group/price flex items-center justify-end gap-1 hover:text-blue-600"
                    title="Click to edit selling price"
                  >
                    <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover/price:text-blue-600 transition-colors">
                      {settings.currencySymbol}
                      {item.sellingPrice.toFixed(2)}
                    </span>
                    <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover/price:opacity-100 text-blue-500" />
                  </div>
                )}

                {/* MRP Price (Quick Editable & Clean without Strikethrough) */}
                {editingMrpId === item.id ? (
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[10px] text-slate-600 font-semibold">MRP:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tempMrp}
                      onChange={(e) => setTempMrp(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveMrp(item.id);
                        if (e.key === 'Escape') setEditingMrpId(null);
                      }}
                      onBlur={() => handleSaveMrp(item.id)}
                      className="w-16 px-1 py-0.5 text-right font-bold text-[11px] bg-amber-50 border-2 border-amber-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveMrp(item.id)}
                      className="p-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                      title="Save MRP & Sync to Inventory"
                    >
                      <Check className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end mt-0.5">
                    <div
                      onClick={() => handleStartEditMrp(item)}
                      className="cursor-pointer group/mrp inline-flex items-center gap-1 text-[10px] text-slate-600 hover:text-blue-700 font-semibold bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 px-1.5 py-0.2 rounded transition-all"
                      title="Click to quick-edit MRP (will update inventory catalog)"
                    >
                      <span>
                        MRP {settings.currencySymbol}{item.mrp.toFixed(2)}
                      </span>
                      <Edit2 className="w-2 h-2 opacity-40 group-hover/mrp:opacity-100 text-blue-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Stepper */}
              <div className="col-span-2 flex items-center justify-center gap-1">
                <button
                  onClick={() => updateCartItemQty(item.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold transition-all cursor-pointer active:scale-90"
                  title="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <input
                  type="number"
                  min="1"
                  max={item.product.stock}
                  value={item.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) updateCartItemQty(item.id, val);
                  }}
                  className="w-10 text-center font-extrabold text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <button
                  onClick={() => updateCartItemQty(item.id, item.quantity + 1)}
                  disabled={isOverStock}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold transition-all cursor-pointer active:scale-90 ${
                    isOverStock
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 shadow-2xs'
                  }`}
                  title={isOverStock ? 'Max available stock reached' : 'Increase quantity'}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Discount % (Editable) */}
              <div className="col-span-1 text-center">
                {editingDiscountId === item.id ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tempDiscount}
                    onChange={(e) => setTempDiscount(e.target.value)}
                    onBlur={() => handleSaveDiscount(item.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveDiscount(item.id)}
                    className="w-11 px-1 py-0.5 text-center font-bold text-xs bg-amber-50 border-2 border-amber-400 rounded focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => handleStartEditDiscount(item)}
                    className={`px-1.5 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                      item.discountPercent > 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                        : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                    }`}
                    title="Click to apply line discount"
                  >
                    {item.discountPercent > 0 ? `${item.discountPercent}%` : '0%'}
                  </button>
                )}
              </div>

              {/* Total & Remove */}
              <div className="col-span-2 flex items-center justify-end gap-1.5 pr-1">
                <div className="text-right">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-950 block tracking-tight">
                    {settings.currencySymbol}
                    {item.total.toFixed(2)}
                  </span>
                  {item.discountAmount > 0 && (
                    <span className="text-[10px] text-emerald-600 font-semibold block">
                      Save {settings.currencySymbol}{item.discountAmount.toFixed(2)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
