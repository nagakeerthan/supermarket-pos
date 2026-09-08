import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  AlertTriangle,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';

export const KPICards: React.FC = () => {
  const { orders, products, settings } = usePosStore();

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isYesterday = (dateStr: string) => {
    const d = new Date(dateStr);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return (
      d.getDate() === y.getDate() &&
      d.getMonth() === y.getMonth() &&
      d.getFullYear() === y.getFullYear()
    );
  };

  const todayOrders = orders.filter((o) => isToday(o.createdAt) && o.status !== 'voided');
  const yesterdayOrders = orders.filter((o) => isYesterday(o.createdAt) && o.status !== 'voided');

  const todaySales = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const yesterdaySales = yesterdayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const todayProfit = todayOrders.reduce((sum, o) => sum + o.netProfit, 0);
  const totalAllTimeSales = orders.filter(o => o.status !== 'voided').reduce((sum, o) => sum + o.grandTotal, 0);

  const totalProductsCount = products.length;
  const uniqueCategoriesCount = new Set(products.map((p) => p.category)).size;
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStockLevel).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const todayItemsSold = todayOrders.reduce((sum, o) => sum + o.totalQuantity, 0);

  // Dynamic Sales Trend
  let salesTrendText = 'No prior day sales';
  let salesTrendPositive = true;
  if (yesterdaySales > 0) {
    const change = ((todaySales - yesterdaySales) / yesterdaySales) * 100;
    salesTrendText = `${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs yesterday`;
    salesTrendPositive = change >= 0;
  } else if (todaySales > 0) {
    salesTrendText = `+100% first day sales`;
    salesTrendPositive = true;
  } else if (totalAllTimeSales > 0) {
    salesTrendText = `All-Time: ${settings.currencySymbol}${Math.round(totalAllTimeSales).toLocaleString('en-IN')}`;
    salesTrendPositive = true;
  }

  const profitMarginPercent = todaySales > 0 ? (todayProfit / todaySales) * 100 : 0;

  const kpis = [
    {
      title: "Today's Sales",
      value: `${settings.currencySymbol}${todaySales.toLocaleString('en-IN')}`,
      subtext: `${todayOrders.length} bills settled today`,
      icon: DollarSign,
      trend: salesTrendText,
      trendPositive: salesTrendPositive,
      color: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50 text-blue-700',
    },
    {
      title: "Today's Profit",
      value: `${settings.currencySymbol}${todayProfit.toLocaleString('en-IN')}`,
      subtext: `Margin: ${profitMarginPercent.toFixed(1)}% net`,
      icon: TrendingUp,
      trend: `${profitMarginPercent.toFixed(1)}% margin rate`,
      trendPositive: profitMarginPercent >= 0,
      color: 'from-emerald-600 to-teal-600',
      bgLight: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: "Today's Orders",
      value: todayOrders.length.toString(),
      subtext: `Avg Ticket: ${settings.currencySymbol}${todayOrders.length > 0 ? Math.round(todaySales / todayOrders.length) : 0}`,
      icon: ShoppingBag,
      trend: `${todayItemsSold} units billed`,
      trendPositive: true,
      color: 'from-purple-600 to-violet-600',
      bgLight: 'bg-purple-50 text-purple-700',
    },
    {
      title: 'Total Products',
      value: totalProductsCount.toString(),
      subtext: 'Catalog SKUs active',
      icon: Package,
      trend: `${uniqueCategoriesCount} Departments`,
      trendPositive: true,
      color: 'from-cyan-600 to-blue-600',
      bgLight: 'bg-cyan-50 text-cyan-700',
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockCount.toString(),
      subtext: 'Needs immediate reorder',
      icon: AlertTriangle,
      trend: lowStockCount > 0 ? `${lowStockCount} items critical` : 'Stock healthy',
      trendPositive: lowStockCount === 0,
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Inventory Value',
      value: `${settings.currencySymbol}${Math.round(totalInventoryValue).toLocaleString('en-IN')}`,
      subtext: 'Total stock asset at cost',
      icon: Boxes,
      trend: `${totalStockUnits.toLocaleString('en-IN')} units in stock`,
      trendPositive: true,
      color: 'from-slate-700 to-slate-900',
      bgLight: 'bg-slate-100 text-slate-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group relative overflow-hidden"
          >
            {/* Top icon and badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 line-clamp-1">{kpi.title}</span>
              <div className={`p-2 rounded-xl ${kpi.bgLight} group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Main Value */}
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                {kpi.value}
              </h3>
              <p className="text-[11px] font-medium text-slate-400 line-clamp-1">{kpi.subtext}</p>
            </div>

            {/* Bottom Trend */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
              <span className={kpi.trendPositive ? 'text-emerald-600 flex items-center gap-0.5' : 'text-amber-600 flex items-center gap-0.5'}>
                {kpi.trendPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
