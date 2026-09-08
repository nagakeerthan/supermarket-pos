import React from 'react';
import { Activity, ShoppingCart, RefreshCcw, PackagePlus, AlertCircle } from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';

export const ActivityTimeline: React.FC = () => {
  const { activities, settings } = usePosStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />;
      case 'refund':
        return <RefreshCcw className="w-3.5 h-3.5 text-rose-600" />;
      case 'stock':
        return <PackagePlus className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Live Register Activity</h3>
          <p className="text-xs text-slate-400">Real-time store audit stream</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-80 pr-1">
        {activities.map((act) => (
          <div
            key={act.id}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors flex items-start gap-2.5"
          >
            <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-xs mt-0.5">
              {getIcon(act.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 leading-snug">
                {act.text}
              </p>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                {act.amount !== undefined && (
                  <span className="font-bold text-slate-900">
                    {settings.currencySymbol}{act.amount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
