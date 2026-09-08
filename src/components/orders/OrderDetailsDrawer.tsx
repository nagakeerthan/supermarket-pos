import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Printer,
  Download,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Clock,
  CreditCard,
  Barcode,
} from 'lucide-react';
import { Order, OrderItem } from '../../types';
import { usePosStore } from '../../store/usePosStore';
import { generateInvoicePdf } from '../../utils/pdfExport';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { ReceiptModal } from '../pos/ReceiptModal';

interface OrderDetailsDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { refundOrderItem, voidOrder, deleteOrder, currentCashier, settings, billFormat } = usePosStore();

  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [selectedRefundItem, setSelectedRefundItem] = useState<OrderItem | null>(null);
  const [refundQty, setRefundQty] = useState<number>(1);
  const [refundReason, setRefundReason] = useState<string>('Customer returned goods');
  const [voidConfirmOpen, setVoidConfirmOpen] = useState<boolean>(false);
  const [voidReason, setVoidReason] = useState<string>('Billing error / Wrong barcode entered');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteRestoreStock, setDeleteRestoreStock] = useState<boolean>(true);

  if (!isOpen || !order) return null;

  const handleOpenRefundModal = (item: OrderItem) => {
    const remainingQty = item.quantity - (item.refundedQty || 0);
    if (remainingQty > 0) {
      setSelectedRefundItem(item);
      setRefundQty(1);
    }
  };

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefundItem) return;

    refundOrderItem(
      order.id,
      selectedRefundItem.productId,
      refundQty,
      refundReason,
      currentCashier.name
    );

    setSelectedRefundItem(null);
  };

  const handleProcessVoid = () => {
    voidOrder(order.id, currentCashier.name, voidReason);
    setVoidConfirmOpen(false);
    onClose();
  };

  const handleProcessDelete = () => {
    deleteOrder(order.id, deleteRestoreStock);
    setDeleteConfirmOpen(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200"
        >
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-mono">{order.invoiceNumber}</h3>
                <span
                  className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                    order.status === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : order.status === 'voided'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(order.createdAt).toLocaleString('en-IN')}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-5 overflow-y-auto flex-1 space-y-5">
            {/* Metadata Summary */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Cashier Staff</span>
                <span className="font-bold text-slate-800">{order.cashier.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Payment Method</span>
                <span className="font-bold text-slate-800 uppercase">{order.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Customer</span>
                <span className="font-bold text-slate-800">
                  {order.customer ? `${order.customer.name} (${order.customer.phone})` : 'Walk-in Customer'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Loyalty Points Earned</span>
                <span className="font-bold text-blue-600">
                  +{order.customer?.pointsEarned || 0} pts
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Order Items ({order.items.length})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {order.items.map((item, idx) => {
                  const remainingQty = item.quantity - (item.refundedQty || 0);

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 leading-snug">{item.productName}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.barcode} • Rate: {settings.currencySymbol}{item.sellingPrice} • Qty: {item.quantity} {item.unit}
                        </p>
                        {item.refundedQty ? (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded mt-1 inline-block">
                            Refunded: {item.refundedQty} pcs
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-slate-900 text-sm">
                          {settings.currencySymbol}{item.total.toFixed(2)}
                        </span>

                        {order.status !== 'voided' && remainingQty > 0 && (
                          <button
                            onClick={() => handleOpenRefundModal(item)}
                            className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] flex items-center gap-1"
                            title="Process partial/item refund"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Refund
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Breakup */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">{settings.currencySymbol}{order.subtotal.toFixed(2)}</span>
              </div>
              {order.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount Savings:</span>
                  <span className="font-mono">-{settings.currencySymbol}{order.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST Tax (CGST + SGST):</span>
                <span className="font-mono">{settings.currencySymbol}{order.totalGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono">{settings.currencySymbol}{order.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold pt-1">
                <span>Gross Profit Margin:</span>
                <span className="font-mono">+{settings.currencySymbol}{order.netProfit.toFixed(2)}</span>
              </div>
            </div>

            {/* Barcode representation */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-center">
              <BarcodeSvg value={order.invoiceNumber} height={35} width={1.4} />
            </div>

            {/* Refund History Records */}
            {order.refunds && order.refunds.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                  Refund Audit Trail
                </h4>
                {order.refunds.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-xs text-rose-900 space-y-1"
                  >
                    <div className="flex justify-between font-bold">
                      <span>Reason: {ref.reason}</span>
                      <span>-{settings.currencySymbol}{ref.totalRefunded.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-rose-700">
                      Processed by {ref.cashierName} on {new Date(ref.refundDate).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              {order.status !== 'voided' ? (
                <button
                  onClick={() => setVoidConfirmOpen(true)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1.5"
                  title="Void order and restock items"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Void</span>
                </button>
              ) : (
                <span className="text-xs text-rose-600 font-bold px-2 py-1 bg-rose-50 rounded-lg border border-rose-200">
                  Voided
                </span>
              )}

              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
                title="Permanently remove order from history"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => generateInvoicePdf(order, settings, billFormat)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              <button
                onClick={() => setReceiptModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>

          {/* Refund Submodal */}
          {selectedRefundItem && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
                <h4 className="font-bold text-sm text-slate-900 mb-1">Process Item Refund</h4>
                <p className="text-xs text-slate-500 mb-3">{selectedRefundItem.productName}</p>

                <form onSubmit={handleProcessRefund} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Refund Quantity (Max: {selectedRefundItem.quantity - (selectedRefundItem.refundedQty || 0)})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedRefundItem.quantity - (selectedRefundItem.refundedQty || 0)}
                      value={refundQty}
                      onChange={(e) => setRefundQty(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Return</label>
                    <select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    >
                      <option value="Customer returned goods">Customer returned goods</option>
                      <option value="Damaged / Expired item">Damaged / Expired item</option>
                      <option value="Wrong product billed">Wrong product billed</option>
                      <option value="Customer changed mind">Customer changed mind</option>
                    </select>
                  </div>

                  <div className="p-2.5 bg-rose-50 rounded-xl text-xs text-rose-800 font-semibold flex justify-between">
                    <span>Refund Amount:</span>
                    <span className="font-bold">
                      {settings.currencySymbol}
                      {((selectedRefundItem.total / selectedRefundItem.quantity) * refundQty).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRefundItem(null)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
                    >
                      Confirm Refund
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Void Confirmation Submodal */}
          {voidConfirmOpen && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Void Entire Order?</h4>
                <p className="text-xs text-slate-500 mb-3">
                  This will reverse the payment of {settings.currencySymbol}{order.grandTotal.toFixed(2)} and automatically restock all items back into inventory.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Void</label>
                    <input
                      type="text"
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setVoidConfirmOpen(false)}
                      className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleProcessVoid}
                      className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm"
                    >
                      Yes, Void Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Submodal */}
          {deleteConfirmOpen && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Delete Order Record?</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Are you sure you want to permanently delete order <span className="font-mono font-bold text-slate-800">{order.invoiceNumber}</span> ({settings.currencySymbol}{order.grandTotal.toFixed(2)}) from orders history?
                </p>

                {order.status !== 'voided' && (
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer text-xs mb-4 text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={deleteRestoreStock}
                      onChange={(e) => setDeleteRestoreStock(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">Restock items back into inventory</span>
                  </label>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessDelete}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Receipt Modal */}
          <ReceiptModal
            order={order}
            isOpen={receiptModalOpen}
            onClose={() => setReceiptModalOpen(false)}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
