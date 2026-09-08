import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CreditCard } from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';

const COLORS = ['#10b981', '#2563eb', '#8b5cf6', '#f59e0b'];

export const PaymentDistributionChart: React.FC = () => {
  const { orders, settings } = usePosStore();

  const data = React.useMemo(() => {
    let cash = 0;
    let upi = 0;
    let card = 0;
    let split = 0;

    orders.forEach((o) => {
      if (o.paymentMethod === 'cash') cash += o.grandTotal;
      else if (o.paymentMethod === 'upi') upi += o.grandTotal;
      else if (o.paymentMethod === 'card') card += o.grandTotal;
      else if (o.paymentMethod === 'split') split += o.grandTotal;
    });

    const total = cash + upi + card + split || 1;

    return [
      { name: 'Cash', value: Math.round(cash), percentage: Math.round((cash / total) * 100) },
      { name: 'UPI / QR', value: Math.round(upi), percentage: Math.round((upi / total) * 100) },
      { name: 'Card / POS', value: Math.round(card), percentage: Math.round((card / total) * 100) },
      { name: 'Split', value: Math.round(split), percentage: Math.round((split / total) * 100) },
    ];
  }, [orders]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
          <CreditCard className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Tender Distribution</h3>
          <p className="text-xs text-slate-400">Payment methods share</p>
        </div>
      </div>

      <div className="h-56 w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '10px',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
              }}
              formatter={(value: any) => [`${settings.currencySymbol}${Number(value).toLocaleString('en-IN')}`]}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
        {data.map((d, i) => (
          <div key={d.name} className="p-1.5 rounded-lg bg-slate-50">
            <span className="text-[10px] font-bold text-slate-500 block">{d.name}</span>
            <span className="text-xs font-black" style={{ color: COLORS[i] }}>
              {d.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
