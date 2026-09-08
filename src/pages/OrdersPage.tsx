import React, { useState, useMemo } from 'react';
import {
  Search,
  Receipt,
  Eye,
  Trash2,
  AlertTriangle,
  AlertCircle,
  FileSpreadsheet,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { Order } from '../types';
import { OrderDetailsDrawer } from '../components/orders/OrderDetailsDrawer';
import { DateCalendarSlicer, DatePreset } from '../components/orders/DateCalendarSlicer';
import { exportOrdersToCsv } from '../utils/pdfExport';

export const OrdersPage: React.FC = () => {
  const { orders, settings, deleteOrder, deleteOrders, clearAllOrders } = usePosStore();

  // Date Slicer State
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState<boolean>(false);
  const [clearAllModalOpen, setClearAllModalOpen] = useState<boolean>(false);
  const [restoreStock, setRestoreStock] = useState<boolean>(true);

  // Filter Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);

      // Date Range from DateSlicer
      if (startDate) {
        const startDateTime = new Date(`${startDate}T00:00:00`);
        if (orderDate < startDateTime) return false;
      }
      if (endDate) {
        const endDateTime = new Date(`${endDate}T23:59:59.999`);
        if (orderDate > endDateTime) return false;
      }

      // Payment method filter
      if (selectedMethod !== 'all' && o.paymentMethod !== selectedMethod) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && o.status !== selectedStatus) {
        return false;
      }

      // Search query (Invoice number, Customer name, Phone, or item barcode)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesInvoice = o.invoiceNumber.toLowerCase().includes(q);
        const matchesCustomer = o.customer?.name.toLowerCase().includes(q);
        const matchesPhone = o.customer?.phone.includes(q);
        const matchesCashier = o.cashier.name.toLowerCase().includes(q);
        const matchesItemBarcode = o.items.some((i) => i.barcode.includes(q) || i.productName.toLowerCase().includes(q));

        if (!matchesInvoice && !matchesCustomer && !matchesPhone && !matchesCashier && !matchesItemBarcode) {
          return false;
        }
      }

      return true;
    });
  }, [orders, startDate, endDate, selectedMethod, selectedStatus, searchQuery]);

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const toggleSelectOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (filteredOrders.length === 0) return;
    const allVisibleSelected = filteredOrders.every((o) => selectedIds.has(o.id));
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredOrders.forEach((o) => next.delete(o.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredOrders.forEach((o) => next.add(o.id));
        return next;
      });
    }
  };

  const handleConfirmSingleDelete = () => {
    if (!orderToDelete) return;
    deleteOrder(orderToDelete.id, restoreStock);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(orderToDelete.id);
      return next;
    });
    setOrderToDelete(null);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.size === 0) return;
    deleteOrders(Array.from(selectedIds), restoreStock);
    setSelectedIds(new Set());
    setBulkDeleteModalOpen(false);
  };

  const handleConfirmClearAll = () => {
    clearAllOrders(restoreStock);
    setSelectedIds(new Set());
    setClearAllModalOpen(false);
  };

  const totalFilteredSales = filteredOrders.reduce((sum, o) => (o.status !== 'voided' ? sum + o.grandTotal : sum), 0);
  const selectedCount = selectedIds.size;
  const isAllFilteredSelected = filteredOrders.length > 0 && filteredOrders.every((o) => selectedIds.has(o.id));
  const isSomeFilteredSelected = filteredOrders.some((o) => selectedIds.has(o.id)) && !isAllFilteredSelected;

  const selectedOrdersTotal = useMemo(() => {
    return orders
      .filter((o) => selectedIds.has(o.id))
      .reduce((sum, o) => (o.status !== 'voided' ? sum + o.grandTotal : sum), 0);
  }, [orders, selectedIds]);

  return (
    <div className="space-y-5 pb-6">
      {/* Interactive Date Calendar Slicer Component */}
      <DateCalendarSlicer
        orders={orders}
        startDate={startDate}
        endDate={endDate}
        activePreset={datePreset}
        currencySymbol={settings.currencySymbol}
        onRangeChange={(start, end, preset) => {
          setStartDate(start);
          setEndDate(end);
          setDatePreset(preset);
        }}
      />

      {/* Search, Filter & Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Invoice #, Customer, Phone, Cashier, or Barcode..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Action Buttons: Export & Clear */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => exportOrdersToCsv(filteredOrders)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Export filtered orders to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            {orders.length > 0 && (
              <button
                onClick={() => {
                  setRestoreStock(true);
                  setClearAllModalOpen(true);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                title="Clear all orders history"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filters (Method, Status, Count & Total) */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Method Filter */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Method:</span>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium cursor-pointer"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI / QR</option>
              <option value="card">Card / POS</option>
              <option value="split">Split</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partially Refunded</option>
              <option value="voided">Voided</option>
            </select>
          </div>

          {/* Result Count and Aggregates */}
          <div className="ml-auto font-medium text-slate-500 flex items-center gap-3">
            <span>
              Showing <b className="text-slate-900">{filteredOrders.length}</b> Invoices
            </span>
            <span>•</span>
            <span>
              Total: <b className="text-slate-900">{settings.currencySymbol}{totalFilteredSales.toLocaleString('en-IN')}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedCount > 0 && (
        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center bg-blue-600 text-white font-black text-xs px-2.5 py-1 rounded-lg">
              {selectedCount}
            </span>
            <span className="text-xs font-semibold">
              {selectedCount === 1 ? '1 order selected' : `${selectedCount} orders selected`} ({settings.currencySymbol}{selectedOrdersTotal.toFixed(2)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Deselect All
            </button>
            <button
              onClick={() => {
                setRestoreStock(true);
                setBulkDeleteModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-3 text-center w-10" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={handleSelectAllVisible}
                    className="p-1 text-slate-300 hover:text-white transition-colors"
                    title={isAllFilteredSelected ? 'Deselect all visible' : 'Select all visible'}
                  >
                    {isAllFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : isSomeFilteredSelected ? (
                      <MinusSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Items / Qty</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Payment</th>
                <th className="py-3.5 px-4">Cashier</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    No orders match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const isSelected = selectedIds.has(o.id);
                  return (
                    <tr
                      key={o.id}
                      onClick={() => handleRowClick(o)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/80 hover:bg-blue-50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td
                        className="py-3.5 px-3 text-center"
                        onClick={(e) => toggleSelectOrder(o.id, e)}
                      >
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {o.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        {o.customer ? (
                          <div>
                            <p className="font-bold text-slate-900">{o.customer.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{o.customer.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Walk-in</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">{o.totalItems}</span> items ({o.totalQuantity} pcs)
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {settings.currencySymbol}{o.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block uppercase font-bold text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-[120px]">
                        {o.cashier.name.split(' ')[0]}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            o.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'voided'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleRowClick(o)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 transition-colors"
                            title="View Invoice Drawer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setOrderToDelete(o);
                              setRestoreStock(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-500 transition-colors"
                            title="Delete Order Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Drawer */}
      <OrderDetailsDrawer
        order={selectedOrder}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedOrder(null);
        }}
      />

      {/* Single Order Deletion Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Delete Order?</h4>
            <p className="text-xs text-slate-500 mb-3">
              Are you sure you want to delete order <span className="font-mono font-bold text-slate-800">{orderToDelete.invoiceNumber}</span> ({settings.currencySymbol}{orderToDelete.grandTotal.toFixed(2)}) from history?
            </p>

            {orderToDelete.status !== 'voided' && (
              <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer text-xs mb-4 text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={restoreStock}
                  onChange={(e) => setRestoreStock(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">Restock items back into inventory</span>
              </label>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Delete Selected Orders?</h4>
            <p className="text-xs text-slate-500 mb-3">
              This will permanently delete <span className="font-bold text-slate-800">{selectedCount}</span> selected orders ({settings.currencySymbol}{selectedOrdersTotal.toFixed(2)}) from orders history.
            </p>

            <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer text-xs mb-4 text-slate-700 select-none">
              <input
                type="checkbox"
                checked={restoreStock}
                onChange={(e) => setRestoreStock(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">Restock items back into inventory</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                Delete {selectedCount} Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Orders Modal */}
      {clearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Clear Entire Orders History?</h4>
            <p className="text-xs text-slate-500 mb-3">
              Are you sure you want to remove all <span className="font-bold text-slate-800">{orders.length}</span> orders from the database? This action cannot be reversed.
            </p>

            <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer text-xs mb-4 text-slate-700 select-none">
              <input
                type="checkbox"
                checked={restoreStock}
                onChange={(e) => setRestoreStock(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">Restock items back into inventory</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setClearAllModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                Clear All Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
