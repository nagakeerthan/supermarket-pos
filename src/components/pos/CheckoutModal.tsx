import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  Split,
  CheckCircle2,
  AlertCircle,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePosStore } from '../../store/usePosStore';
import { PaymentMethod, PaymentDetail, Order } from '../../types';
import { QrCodeSvg } from '../common/QrCodeSvg';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { cart, activeCustomer, currentCashier, settings, checkout } = usePosStore();

  const grandTotal = Math.round(cart.reduce((sum, item) => sum + item.total, 0));

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tenderAmount, setTenderAmount] = useState<number>(grandTotal);
  const [upiVerified, setUpiVerified] = useState<boolean>(false);
  const [cardProcessing, setCardProcessing] = useState<boolean>(false);
  const [cardSuccess, setCardSuccess] = useState<boolean>(false);

  // Split payment state
  const [splitCash, setSplitCash] = useState<number>(Math.floor(grandTotal / 2));
  const [splitOther, setSplitOther] = useState<number>(grandTotal - Math.floor(grandTotal / 2));

  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTenderAmount(grandTotal);
      setUpiVerified(false);
      setCardSuccess(false);
      setCardProcessing(false);
      setErrorMsg('');
    }
  }, [isOpen, grandTotal]);

  if (!isOpen) return null;

  const changeReturned = Math.max(0, tenderAmount - grandTotal);

  // Quick cash denomination presets
  const cashPresets = [
    { label: 'Exact', amount: grandTotal },
    { label: '₹100', amount: 100 },
    { label: '₹200', amount: 200 },
    { label: '₹500', amount: 500 },
    { label: '₹2000', amount: 2000 },
    { label: 'Round 100', amount: Math.ceil(grandTotal / 100) * 100 },
    { label: 'Round 500', amount: Math.ceil(grandTotal / 500) * 500 },
  ];

  // UPI payment intent link for dynamic QR code
  const upiIntentString = `upi://pay?pa=kalasagar@upi&pn=${encodeURIComponent(
    settings.storeName
  )}&am=${grandTotal}&cu=INR&tn=Invoice_${Date.now().toString().slice(-6)}`;

  const handleSimulateCard = () => {
    setCardProcessing(true);
    setTimeout(() => {
      setCardProcessing(false);
      setCardSuccess(true);
    }, 1200);
  };

  const handleCompletePayment = () => {
    if (paymentMethod === 'cash') {
      if (tenderAmount < grandTotal) {
        setErrorMsg('Tender amount cannot be less than Grand Total');
        return;
      }
    }

    if (paymentMethod === 'upi' && !upiVerified) {
      setErrorMsg('Please click "Payment Received" after customer scans the UPI QR code');
      return;
    }

    if (paymentMethod === 'card' && !cardSuccess) {
      setErrorMsg('Please process card through terminal first');
      return;
    }

    if (paymentMethod === 'split') {
      if (splitCash + splitOther !== grandTotal) {
        setErrorMsg('Split amounts must exactly equal Grand Total');
        return;
      }
    }

    const paymentDetail: PaymentDetail = {
      method: paymentMethod,
      amount: grandTotal,
      tenderAmount: paymentMethod === 'cash' ? tenderAmount : grandTotal,
      changeReturned: paymentMethod === 'cash' ? changeReturned : 0,
      upiRef: paymentMethod === 'upi' ? `UPI${Math.floor(100000000000 + Math.random() * 900000000000)}` : undefined,
      cardLast4: paymentMethod === 'card' ? '4242' : undefined,
      splitDetails:
        paymentMethod === 'split'
          ? {
              cash: splitCash,
              upi: splitOther,
            }
          : undefined,
    };

    const res = checkout(paymentDetail, currentCashier);
    if (res.success && res.order) {
      // Confetti burst on checkout
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981', '#f59e0b'],
      });

      onSuccess(res.order);
      onClose();
    } else {
      setErrorMsg(res.error || 'Checkout failed');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-400/30">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-base">Payment & Tender Settlement</h3>
                <p className="text-xs text-slate-300">
                  Cashier: {currentCashier.name} • {cart.length} Items in Cart
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Grand Total Highlight Banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
              <div>
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                  Amount Due
                </span>
                {activeCustomer && (
                  <span className="text-xs text-slate-600 font-medium">
                    Customer: <span className="font-bold text-slate-800">{activeCustomer.name}</span> ({activeCustomer.phone})
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-blue-900">
                  {settings.currencySymbol}
                  {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'cash', label: 'Cash', icon: Banknote, color: 'text-emerald-600' },
                  { id: 'upi', label: 'UPI / QR', icon: QrCode, color: 'text-blue-600' },
                  { id: 'card', label: 'Card / POS', icon: CreditCard, color: 'text-purple-600' },
                  { id: 'split', label: 'Split', icon: Split, color: 'text-amber-600' },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = paymentMethod === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(tab.id as PaymentMethod);
                        setErrorMsg('');
                      }}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 shadow-sm ring-2 ring-blue-600/30'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${tab.color}`} />
                      <span className="text-xs font-bold text-slate-800">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Sub-Panel 1: Cash Payment */}
            {paymentMethod === 'cash' && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount Received / Tendered ({settings.currencySymbol}):
                  </label>
                  <input
                    type="number"
                    value={tenderAmount || ''}
                    onChange={(e) => setTenderAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount given by customer"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    autoFocus
                  />
                </div>

                {/* Quick Cash Presets */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                    Quick Cash Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cashPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTenderAmount(preset.amount)}
                        className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors shadow-xs"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change Return Card */}
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    tenderAmount >= grandTotal
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {tenderAmount >= grandTotal ? 'Balance Return / Change:' : 'Shortage Amount:'}
                  </span>
                  <span className="text-xl font-black">
                    {settings.currencySymbol}
                    {tenderAmount >= grandTotal
                      ? changeReturned.toFixed(2)
                      : (grandTotal - tenderAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Sub-Panel 2: UPI QR Payment */}
            {paymentMethod === 'upi' && (
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 inline-block shadow-md">
                  <QrCodeSvg value={upiIntentString} size={160} includeMargin />
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Scan with Google Pay, PhonePe, Paytm, BHIM
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Amount: <span className="font-bold text-slate-800">{settings.currencySymbol}{grandTotal.toFixed(2)}</span>
                  </p>
                </div>

                {upiVerified ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>UPI Payment Verified Successfully!</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUpiVerified(true)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 mx-auto"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Payment Received (Confirm UPI)
                  </button>
                )}
              </div>
            )}

            {/* Payment Sub-Panel 3: Card Payment */}
            {paymentMethod === 'card' && (
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                  <CreditCard className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">POS Card Terminal</h4>
                  <p className="text-xs text-slate-500">Insert, swipe, or tap Credit / Debit Card on device</p>
                </div>

                {cardSuccess ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Card Authorized: Auth Code #TX{Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSimulateCard}
                    disabled={cardProcessing}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                  >
                    {cardProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Communicating with EDC Terminal...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Simulate Tap / Insert Card</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Payment Sub-Panel 4: Split Payment */}
            {paymentMethod === 'split' && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cash Portion ({settings.currencySymbol}):</label>
                    <input
                      type="number"
                      value={splitCash}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setSplitCash(val);
                        setSplitOther(Math.max(0, grandTotal - val));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">UPI / Card Portion ({settings.currencySymbol}):</label>
                    <input
                      type="number"
                      value={splitOther}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setSplitOther(val);
                        setSplitCash(Math.max(0, grandTotal - val));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 text-xs font-semibold flex justify-between">
                  <span>Total Split Allocated:</span>
                  <span className="font-bold">{settings.currencySymbol}{(splitCash + splitOther).toFixed(2)} / {settings.currencySymbol}{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Cancel (Esc)
            </button>

            <button
              onClick={handleCompletePayment}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Settle & Print Bill</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
