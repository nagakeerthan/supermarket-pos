import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, PackageCheck } from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';

export const LowStockAlerts: React.FC = () => {
  const navigate = useNavigate();
  const { products } = usePosStore();

  const lowStockItems = products
    .filter((p) => p.stock <= p.minStockLevel)
    .sort((a, b) => a.stock - b.stock);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Low Stock Warnings ({lowStockItems.length})
            </h3>
            <p className="text-xs text-slate-400">Inventory items near depletion</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/stock')}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <span>Reorder</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-80">
        {lowStockItems.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            <PackageCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            All inventory SKUs are healthy above threshold!
          </div>
        ) : (
          lowStockItems.map((p) => (
            <div
              key={p.id}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition-colors flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {p.barcode} • Supplier: {p.supplier}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-full inline-block ${
                    p.stock === 0
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Min: {p.minStockLevel} {p.unit}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
