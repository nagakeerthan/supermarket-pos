import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, PlayCircle, Trash2, ShoppingCart, Clock } from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';

interface HeldCartsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeldCartsModal: React.FC<HeldCartsModalProps> = ({ isOpen, onClose }) => {
  const { heldCarts, resumeHeldCart, deleteHeldCart, settings } = usePosStore();

  if (!isOpen) return null;

  const handleResume = (id: string) => {
    resumeHeldCart(id);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Held Customer Carts ({heldCarts.length})</h3>
                <p className="text-xs text-amber-100">
                  Resume active checkout queue without losing scanned items
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="p-5 max-h-[65vh] overflow-y-auto space-y-3">
            {heldCarts.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">No Held Carts in queue</p>
                <p className="text-xs text-slate-400 mt-1">
                  You can hold any active cart from the billing screen (HotKey: F8)
                </p>
              </div>
            ) : (
              heldCarts.map((h) => {
                const totalAmount = h.items.reduce((sum, item) => sum + item.total, 0);
                const totalQty = h.items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <div
                    key={h.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-amber-300 hover:shadow-md transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-800 truncate">{h.name}</h4>
                        {h.customer && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                            Loyalty Customer
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(h.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span>{h.items.length} Products ({totalQty} Qty)</span>
                        <span>•</span>
                        <span className="font-bold text-slate-900">
                          {settings.currencySymbol}
                          {totalAmount.toFixed(2)}
                        </span>
                      </div>
                      {h.note && (
                        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-2 inline-block">
                          Note: {h.note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResume(h.id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Resume (F8)
                      </button>
                      <button
                        onClick={() => deleteHeldCart(h.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Held Cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
