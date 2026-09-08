import React from 'react';
import {
  CreditCard,
  Trash2,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';

interface BillingFooterProps {
  onOpenCheckout: () => void;
}

export const BillingFooter: React.FC<BillingFooterProps> = ({ onOpenCheckout }) => {
  const { cart, clearCart, holdCurrentCart, settings } = usePosStore();

  const totalItems = cart.length;
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discountAmount, 0);
  const totalGst = cart.reduce((sum, item) => sum + item.gstAmount, 0);
  const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);

  const isCartEmpty = cart.length === 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2.5 space-y-2 flex-shrink-0">
      {/* Metrics Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/70">
          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Items / Qty</span>
          <span className="font-extrabold text-slate-800 text-xs sm:text-sm block">
            {totalItems} <span className="text-slate-400 font-normal text-[10px]">lines</span> / {totalQuantity} <span className="text-slate-400 font-normal text-[10px]">pcs</span>
          </span>
        </div>

        <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/70">
          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Subtotal</span>
          <span className="font-extrabold text-slate-800 text-xs sm:text-sm block">
            {settings.currencySymbol}{subtotal.toFixed(2)}
          </span>
        </div>

        <div className="bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/80">
          <span className="text-emerald-700 block text-[10px] font-bold uppercase tracking-wider">Savings / Disc</span>
          <span className="font-extrabold text-emerald-700 text-xs sm:text-sm block">
            -{settings.currencySymbol}{totalDiscount.toFixed(2)}
          </span>
        </div>

        <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/70">
          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
            GST ({settings.taxInclusive ? 'Included' : 'Extra'})
          </span>
          <span className="font-extrabold text-slate-800 text-xs sm:text-sm block">
            {settings.currencySymbol}{totalGst.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Grand Total Banner & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
        {/* Left Side Controls: Clear Cart & Hold Cart */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => clearCart()}
            disabled={isCartEmpty}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            title="Clear Cart (F4)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear (F4)</span>
          </button>

          <button
            onClick={() => holdCurrentCart()}
            disabled={isCartEmpty}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            title="Hold Bill to serve next customer (F8)"
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>Hold Bill (F8)</span>
          </button>
        </div>

        {/* Right Side: Grand Total & Checkout Button */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
              Net Amount Payable
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900 leading-tight block">
              {settings.currencySymbol}
              {grandTotal.toFixed(2)}
            </span>
          </div>

          <button
            onClick={onOpenCheckout}
            disabled={isCartEmpty}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
          >
            <CreditCard className="w-4 h-4" />
            <span>CHECKOUT (F12)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
