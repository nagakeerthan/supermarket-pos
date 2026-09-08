import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  PlusCircle,
  Receipt,
  Tag,
  Boxes,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { KPICards } from '../components/dashboard/KPICards';
import { SalesTrendChart } from '../components/dashboard/SalesTrendChart';
import { TopSellingTable } from '../components/dashboard/TopSellingTable';
import { PaymentDistributionChart } from '../components/dashboard/PaymentDistributionChart';
import { LowStockAlerts } from '../components/dashboard/LowStockAlerts';
import { ActivityTimeline } from '../components/dashboard/ActivityTimeline';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      label: 'New Bill (POS)',
      sub: 'Open billing register',
      icon: ShoppingCart,
      to: '/billing',
      color: 'from-blue-600 to-indigo-600 text-white shadow-blue-500/20',
    },
    {
      label: 'Add New Product',
      sub: 'Catalog & barcode SKU',
      icon: PlusCircle,
      to: '/inventory?add=true',
      color: 'from-emerald-600 to-teal-600 text-white shadow-emerald-500/20',
    },
    {
      label: 'View Order Registry',
      sub: 'Invoices & refunds',
      icon: Receipt,
      to: '/orders',
      color: 'from-purple-600 to-violet-600 text-white shadow-purple-500/20',
    },
    {
      label: 'Print Shelf Labels',
      sub: 'Barcode sticker maker',
      icon: Tag,
      to: '/labels',
      color: 'from-amber-500 to-orange-600 text-white shadow-amber-500/20',
    },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Quick Action Launchpad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((act, i) => {
          const Icon = act.icon;
          return (
            <button
              key={i}
              onClick={() => navigate(act.to)}
              className={`p-3.5 rounded-2xl bg-gradient-to-r ${act.color} text-left shadow-lg hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between group`}
            >
              <div>
                <h4 className="font-extrabold text-sm leading-tight">{act.label}</h4>
                <p className="text-[11px] opacity-80 mt-0.5">{act.sub}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-xl group-hover:rotate-6 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* KPI Cards Grid */}
      <KPICards />

      {/* Main Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SalesTrendChart />
        </div>
        <div className="lg:col-span-1">
          <PaymentDistributionChart />
        </div>
      </div>

      {/* Feed & Tables Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div>
          <TopSellingTable />
        </div>
        <div>
          <LowStockAlerts />
        </div>
        <div>
          <ActivityTimeline />
        </div>
      </div>
    </div>
  );
};
