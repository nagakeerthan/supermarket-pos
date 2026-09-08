import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { usePosStore } from '../../store/usePosStore';

export const SalesTrendChart: React.FC = () => {
  const { orders, settings } = usePosStore();
  const [viewMode, setViewMode] = useState<'hourly' | 'daily' | 'monthly'>('daily');

  // Compute chart aggregated data
  const chartData = React.useMemo(() => {
    if (viewMode === 'hourly') {
      // Group today's orders by 2-hour slots
      const slots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      return slots.map((time, idx) => {
        const hour = 8 + idx * 2;
        const matching = orders.filter((o) => {
          const d = new Date(o.createdAt);
          return d.getHours() >= hour && d.getHours() < hour + 2;
        });
        const sales = matching.reduce((sum, o) => sum + o.grandTotal, 0);
        const profit = matching.reduce((sum, o) => sum + o.netProfit, 0);
        return { name: time, sales: Math.round(sales), profit: Math.round(profit) };
      });
    }

    if (viewMode === 'monthly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.slice(0, 8).map((m, idx) => {
        const matching = orders.filter((o) => new Date(o.createdAt).getMonth() === idx);
        const sales = matching.reduce((sum, o) => sum + o.grandTotal, 0);
        const profit = matching.reduce((sum, o) => sum + o.netProfit, 0);
        return { name: m, sales: Math.round(sales), profit: Math.round(profit) };
      });
    }

    // Default: Past 7 days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = days[targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1];
      const matching = orders.filter((o) => {
        const d = new Date(o.createdAt);
        return d.toDateString() === targetDate.toDateString();
      });
      const sales = matching.reduce((sum, o) => sum + o.grandTotal, 0);
      const profit = matching.reduce((sum, o) => sum + o.netProfit, 0);
      result.push({
        name: `${dayName} ${targetDate.getDate()}`,
        sales: Math.round(sales),
        profit: Math.round(profit),
      });
    }
    return result;
  }, [orders, viewMode]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
      {/* Header with Switcher */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Sales & Profit Velocity</h3>
          <p className="text-xs text-slate-400">Revenue growth & gross margin trends</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['hourly', 'daily', 'monthly'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-colors ${
                viewMode === m
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              }}
              formatter={(value: any) => [`${settings.currencySymbol}${Number(value).toLocaleString('en-IN')}`]}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Area
              type="monotone"
              dataKey="sales"
              name="Gross Sales"
              stroke="#2563eb"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#salesGrad)"
            />
            <Area
              type="monotone"
              dataKey="profit"
              name="Net Profit"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#profitGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
