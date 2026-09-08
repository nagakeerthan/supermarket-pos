import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  Download,
  Printer,
  Calendar,
  Layers,
  Percent,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { exportOrdersToCsv } from '../utils/pdfExport';

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const ReportsPage: React.FC = () => {
  const { orders, products, settings } = usePosStore();

  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  // Filter orders by time window
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      if (o.status === 'voided') return false;
      const orderDate = new Date(o.createdAt);

      if (dateFilter === 'today') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      } else if (dateFilter === 'month') {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      } else if (dateFilter === 'year') {
        return orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [orders, dateFilter]);

  // Aggregate Metrics
  const totalSales = filteredOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalOrdersCount = filteredOrders.length;
  const totalProfit = filteredOrders.reduce((sum, o) => sum + o.netProfit, 0);
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalSales / totalOrdersCount) : 0;
  const totalInventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const totalGstCollected = filteredOrders.reduce((sum, o) => sum + o.totalGst, 0);

  // Top and Lowest Selling Product
  const productPerformance = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    filteredOrders.forEach((o) => {
      o.items.forEach((i) => {
        const existing = map.get(i.productId);
        if (existing) {
          existing.qty += i.quantity;
          existing.revenue += i.total;
        } else {
          map.set(i.productId, { name: i.productName, qty: i.quantity, revenue: i.total });
        }
      });
    });
    const arr = Array.from(map.values()).sort((a, b) => b.qty - a.qty);
    return {
      top: arr[0] || { name: 'N/A', qty: 0, revenue: 0 },
      lowest: arr[arr.length - 1] || { name: 'N/A', qty: 0, revenue: 0 },
      all: arr,
    };
  }, [filteredOrders]);

  // Sales by Category Bar Chart
  const categoryChartData = useMemo(() => {
    const catMap = new Map<string, number>();
    filteredOrders.forEach((o) => {
      o.items.forEach((i) => {
        catMap.set(i.category, (catMap.get(i.category) || 0) + i.total);
      });
    });
    return Array.from(catMap.entries())
      .map(([name, sales]) => ({ name: name.split(' ')[0], full: name, sales: Math.round(sales) }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);
  }, [filteredOrders]);

  // Daily Trend Line Chart
  const trendLineData = useMemo(() => {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const match = filteredOrders.filter(
        (o) => new Date(o.createdAt).toDateString() === d.toDateString()
      );
      const sales = match.reduce((sum, o) => sum + o.grandTotal, 0);
      const profit = match.reduce((sum, o) => sum + o.netProfit, 0);
      list.push({
        name: days[d.getDay()],
        sales: Math.round(sales),
        profit: Math.round(profit),
      });
    }
    return list;
  }, [filteredOrders]);

  // Cashier Performance
  const cashierLeaderboard = useMemo(() => {
    const map = new Map<string, { name: string; bills: number; total: number }>();
    filteredOrders.forEach((o) => {
      const existing = map.get(o.cashier.id);
      if (existing) {
        existing.bills += 1;
        existing.total += o.grandTotal;
      } else {
        map.set(o.cashier.id, { name: o.cashier.name, bills: 1, total: o.grandTotal });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredOrders]);

  return (
    <div className="space-y-6 pb-6">
      {/* Header & Date Preset Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Business Intelligence & Financial Reports</span>
            </h3>
            <p className="text-xs text-slate-400">
              Gross sales, profit margins, GST taxes, and cashier leaderboards
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['today', 'week', 'month', 'year', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                    dateFilter === f
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {f === 'all' ? 'All Time' : f}
                </button>
              ))}
            </div>

            {/* Export actions */}
            <button
              onClick={() => exportOrdersToCsv(filteredOrders)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">Total Sales</span>
          <h4 className="text-xl font-black text-slate-900 mt-1">
            {settings.currencySymbol}{totalSales.toLocaleString('en-IN')}
          </h4>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Gross Revenue</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">Total Profit</span>
          <h4 className="text-xl font-black text-emerald-600 mt-1">
            {settings.currencySymbol}{totalProfit.toLocaleString('en-IN')}
          </h4>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            Margin: {totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0'}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">Total Orders</span>
          <h4 className="text-xl font-black text-slate-900 mt-1">{totalOrdersCount}</h4>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">Invoices generated</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">Avg Order Value</span>
          <h4 className="text-xl font-black text-slate-900 mt-1">
            {settings.currencySymbol}{avgOrderValue}
          </h4>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">Basket size</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">GST Collected</span>
          <h4 className="text-xl font-black text-slate-900 mt-1">
            {settings.currencySymbol}{Math.round(totalGstCollected).toLocaleString('en-IN')}
          </h4>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">CGST + SGST</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">Top SKU</span>
          <h4 className="text-xs font-bold text-slate-900 mt-1 truncate" title={productPerformance.top.name}>
            {productPerformance.top.name}
          </h4>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
            {productPerformance.top.qty} units sold
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">Inventory Asset</span>
          <h4 className="text-xl font-black text-slate-900 mt-1">
            {settings.currencySymbol}{Math.round(totalInventoryValue).toLocaleString('en-IN')}
          </h4>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">Valuation at cost</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category Sales Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-800">Sales by Category</h4>
            <span className="text-xs text-slate-400">Department performance</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                  formatter={(val: any) => [`${settings.currencySymbol}${Number(val).toLocaleString('en-IN')}`]}
                />
                <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 0, 0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue vs Profit Dual Line Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-800">Daily Revenue & Net Profit</h4>
            <span className="text-xs text-slate-400">Profitability timeline</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendLineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                  formatter={(val: any) => [`${settings.currencySymbol}${Number(val).toLocaleString('en-IN')}`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2.5} name="Revenue" />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} name="Net Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cashier Leaderboard & GST Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cashier Leaderboard */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-800">Cashier Counter Performance</h4>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {cashierLeaderboard.map((c, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <span className="text-[10px] text-slate-400">{c.bills} Invoices billed</span>
                  </div>
                </div>
                <span className="font-black text-slate-900 text-sm font-mono">
                  {settings.currencySymbol}{c.total.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* GST Tax Summary Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-800">Tax Collection Summary (GSTIN: {settings.gstin})</h4>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">CGST (Central)</span>
                <span className="text-base font-black text-slate-900">
                  {settings.currencySymbol}{(totalGstCollected / 2).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">SGST (State)</span>
                <span className="text-base font-black text-slate-900">
                  {settings.currencySymbol}{(totalGstCollected / 2).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Tax Liability</span>
                <span className="text-base font-black text-emerald-600">
                  {settings.currencySymbol}{totalGstCollected.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl text-[11px] text-blue-900 mt-4 flex items-center justify-between">
            <span>FSSAI License: <b className="font-mono">{settings.fssaiNumber}</b></span>
            <span>Compliance Mode: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
