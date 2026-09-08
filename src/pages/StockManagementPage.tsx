import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  Save,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  History,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { Product, AdjustmentReason } from '../types';

export const StockManagementPage: React.FC = () => {
  const {
    products,
    updateProduct,
    adjustStock,
    stockAdjustments,
    currentCashier,
    settings,
  } = usePosStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'audit' | 'expiry' | 'history'>('audit');

  // Local editable draft state for batch edits: map of productId -> partial Product
  const [draftEdits, setDraftEdits] = useState<Record<string, Partial<Product>>>({});
  const [adjustmentReasons, setAdjustmentReasons] = useState<Record<string, AdjustmentReason>>({});
  const [adjustmentNotes, setAdjustmentNotes] = useState<Record<string, string>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Expiry tracker calculations
  const expiringProducts = useMemo(() => {
    const now = new Date();
    return products
      .filter((p) => p.expiryDate)
      .map((p) => {
        const exp = new Date(p.expiryDate!);
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...p, daysToExpiry: diffDays };
      })
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }, [products]);

  const handleFieldChange = (productId: string, field: keyof Product, value: any) => {
    setDraftEdits((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleSaveProduct = (p: Product) => {
    const edits = draftEdits[p.id];
    if (!edits) return;

    // Check if stock changed to log adjustment
    if (edits.stock !== undefined && edits.stock !== p.stock) {
      const reason = adjustmentReasons[p.id] || 'audit';
      const note = adjustmentNotes[p.id] || 'Manual stock update in Stock Management';
      adjustStock(p.id, edits.stock, reason, note, currentCashier.name);
    }

    updateProduct(p.id, edits);

    // Clear draft for this product
    setDraftEdits((prev) => {
      const next = { ...prev };
      delete next[p.id];
      return next;
    });

    setSaveSuccessMsg(`Saved changes for ${p.name}`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleSaveAll = () => {
    const changedIds = Object.keys(draftEdits);
    if (changedIds.length === 0) return;

    changedIds.forEach((id) => {
      const prod = products.find((p) => p.id === id);
      if (prod) {
        handleSaveProduct(prod);
      }
    });

    setSaveSuccessMsg(`Successfully saved bulk updates for ${changedIds.length} items!`);
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  const pendingCount = Object.keys(draftEdits).length;

  return (
    <div className="space-y-5 pb-6">
      {/* Top Header & Tab Navigation */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-600" />
              <span>Stock Management & Inventory Audit</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live batch stock adjustments, price overrides, and expiry date monitoring
            </p>
          </div>

          {/* Action Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Stock Audit Grid
            </button>
            <button
              onClick={() => setActiveTab('expiry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'expiry'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Expiry Monitor</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-blue-500" />
              <span>Adjustment Log</span>
            </button>
          </div>
        </div>

        {/* Search and Bulk Save Bar (when in audit tab) */}
        {activeTab === 'audit' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by barcode, product title, or supplier..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {pendingCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                  {pendingCount} unsaved modifications
                </span>
                <button
                  onClick={handleSaveAll}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
                </button>
              </div>
            )}
          </div>
        )}

        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Tab 1: Live Stock Audit Grid */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Item & Barcode</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Cost Price ({settings.currencySymbol})</th>
                  <th className="py-3 px-4 text-center">Selling ({settings.currencySymbol})</th>
                  <th className="py-3 px-4 text-center">MRP ({settings.currencySymbol})</th>
                  <th className="py-3 px-4 text-center">Expiry Date</th>
                  <th className="py-3 px-4 text-center">Reason (If stock changed)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProducts.map((p) => {
                  const draft = draftEdits[p.id] || {};
                  const currentStock = draft.stock !== undefined ? draft.stock : p.stock;
                  const currentCost = draft.costPrice !== undefined ? draft.costPrice : p.costPrice;
                  const currentSelling = draft.sellingPrice !== undefined ? draft.sellingPrice : p.sellingPrice;
                  const currentMrp = draft.mrp !== undefined ? draft.mrp : p.mrp;
                  const currentExpiry = draft.expiryDate !== undefined ? draft.expiryDate : p.expiryDate || '';
                  const hasEdits = Boolean(draftEdits[p.id]);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-blue-50/30 transition-colors ${
                        hasEdits ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Name & Barcode */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="font-bold text-slate-900 leading-snug">{p.name}</p>
                        <span className="text-[10px] text-blue-600 font-mono font-bold">
                          {p.barcode}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-4 text-slate-600 max-w-[140px] truncate">
                        {p.supplier}
                      </td>

                      {/* Stock Quantity Editor */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          value={currentStock}
                          onChange={(e) =>
                            handleFieldChange(p.id, 'stock', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-xs focus:ring-1 focus:ring-blue-600"
                        />
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={currentCost}
                          onChange={(e) =>
                            handleFieldChange(p.id, 'costPrice', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-xs text-slate-700"
                        />
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={currentSelling}
                          onChange={(e) =>
                            handleFieldChange(p.id, 'sellingPrice', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 px-2 py-1 bg-white border border-blue-400 rounded-lg text-center font-mono font-black text-xs text-blue-900"
                        />
                      </td>

                      {/* MRP */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={currentMrp}
                          onChange={(e) =>
                            handleFieldChange(p.id, 'mrp', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-xs text-slate-500"
                        />
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="date"
                          value={currentExpiry}
                          onChange={(e) =>
                            handleFieldChange(p.id, 'expiryDate', e.target.value)
                          }
                          className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </td>

                      {/* Adjustment Reason */}
                      <td className="py-3 px-4 text-center">
                        <select
                          value={adjustmentReasons[p.id] || 'audit'}
                          onChange={(e) =>
                            setAdjustmentReasons((prev) => ({
                              ...prev,
                              [p.id]: e.target.value as AdjustmentReason,
                            }))
                          }
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                        >
                          <option value="audit">Audit Balance</option>
                          <option value="restock">Restock Received</option>
                          <option value="damage">Damaged</option>
                          <option value="expired">Expired</option>
                          <option value="theft">Shortage / Theft</option>
                          <option value="return">Vendor Return</option>
                        </select>
                      </td>

                      {/* Save Button */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleSaveProduct(p)}
                          disabled={!hasEdits}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            hasEdits
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Expiry Date Monitor */}
      {activeTab === 'expiry' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Perishable Expiry Monitor</h4>
              <p className="text-xs text-slate-400">
                Sorted by nearest expiration dates. Proactively discount or remove expired inventory.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600">
              {expiringProducts.length} Tracked Batches
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiringProducts.map((p) => {
              const isExpired = p.daysToExpiry <= 0;
              const isNearExpiry = p.daysToExpiry > 0 && p.daysToExpiry <= 45;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                    isExpired
                      ? 'bg-rose-50/70 border-rose-200'
                      : isNearExpiry
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 leading-snug">{p.name}</h5>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {p.barcode} • {p.supplier}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isExpired
                          ? 'bg-rose-600 text-white'
                          : isNearExpiry
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isExpired
                        ? 'Expired'
                        : `${p.daysToExpiry} days left`}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Current Stock</span>
                      <span className="font-bold text-slate-900">{p.stock} {p.unit}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Expiry Date</span>
                      <span className="font-mono font-bold text-slate-800">{p.expiryDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Stock Adjustment Audit Trail */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Stock Adjustment Audit Log</h4>
              <p className="text-xs text-slate-400">
                Log of all manual stock changes, damages, theft, and restocks
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600">
              {stockAdjustments.length} Logged Entries
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {stockAdjustments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No stock adjustments logged in this session.
              </div>
            ) : (
              stockAdjustments.map((adj) => {
                const isIncrease = adj.changeQuantity > 0;

                return (
                  <div
                    key={adj.id}
                    className="py-3 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl flex-shrink-0 ${
                          isIncrease
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isIncrease ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <p className="font-bold text-slate-900">{adj.productName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {adj.barcode} • Reason: <span className="font-bold uppercase text-slate-700">{adj.reason}</span>
                          {adj.note && ` • Note: ${adj.note}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-xs font-black block ${
                          isIncrease ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isIncrease ? `+${adj.changeQuantity}` : adj.changeQuantity} ({adj.previousStock} → {adj.newStock})
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {adj.cashierName} • {new Date(adj.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
