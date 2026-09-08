import React, { useState } from 'react';
import { Award, Flame, TrendingUp, Package } from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';

export const TopSellingTable: React.FC = () => {
  const { orders, products, settings } = usePosStore();
  const [period, setPeriod] = useState<'today' | 'month'>('today');

  const topSelling = React.useMemo(() => {
    const isToday = (dStr: string) => {
      const d = new Date(dStr);
      const today = new Date();
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    };

    const isThisMonth = (dStr: string) => {
      const d = new Date(dStr);
      const today = new Date();
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    };

    const targetOrders = orders.filter((o) =>
      period === 'today' ? isToday(o.createdAt) : isThisMonth(o.createdAt)
    );

    // Aggregate by productId
    const map = new Map<string, { qty: number; revenue: number; name: string; barcode: string; category: string; image: string }>();

    targetOrders.forEach((o) => {
      o.items.forEach((item) => {
        const existing = map.get(item.productId);
        const prod = products.find((p) => p.id === item.productId);
        const img = prod?.image || '';

        if (existing) {
          existing.qty += item.quantity;
          existing.revenue += item.total;
        } else {
          map.set(item.productId, {
            qty: item.quantity,
            revenue: item.total,
            name: item.productName,
            barcode: item.barcode,
            category: item.category,
            image: img,
          });
        }
      });
    });

    const list = Array.from(map.entries()).map(([id, data]) => ({ id, ...data }));
    list.sort((a, b) => b.qty - a.qty);
    return list.slice(0, 10);
  }, [orders, products, period]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Top 10 Selling Products</h3>
            <p className="text-xs text-slate-400">High velocity supermarket SKUs</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setPeriod('today')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
              period === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
              period === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 max-h-96">
        {topSelling.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No sales recorded in this period yet.
          </div>
        ) : (
          topSelling.map((item, idx) => (
            <div
              key={item.id}
              className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-xl px-2 transition-colors"
            >
              {/* Rank & Image & Title */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                    idx === 0
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-900'
                      : idx === 2
                      ? 'bg-amber-700/30 text-amber-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {idx + 1}
                </span>

                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-black text-xs flex-shrink-0">
                    {item.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                    {item.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.barcode} • {item.category}
                  </span>
                </div>
              </div>

              {/* Units & Revenue */}
              <div className="text-right flex-shrink-0">
                <span className="text-xs font-black text-slate-900 block">
                  {item.qty} Sold
                </span>
                <span className="text-[11px] font-bold text-blue-600">
                  {settings.currencySymbol}
                  {item.revenue.toFixed(0)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
