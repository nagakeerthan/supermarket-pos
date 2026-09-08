import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Boxes,
  BarChart3,
  Tag,
  Printer,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  LogOut,
} from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
}) => {
  const navigate = useNavigate();
  const { cart, products, settings, logout } = usePosStore();

  const lowStockCount = products.filter((p) => p.stock <= p.minStockLevel).length;
  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    {
      to: '/billing',
      label: 'Billing (POS)',
      icon: ShoppingCart,
      badge: cartItemCount > 0 ? `${cartItemCount}` : null,
      badgeColor: 'bg-emerald-500 text-white',
    },
    { to: '/orders', label: 'Orders', icon: Receipt, badge: null },
    {
      to: '/inventory',
      label: 'Inventory',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount}` : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    { to: '/stock', label: 'Stock Management', icon: Boxes, badge: null },
    { to: '/reports', label: 'Reports', icon: BarChart3, badge: null },
    { to: '/labels', label: 'Label Printing', icon: Tag, badge: null },
    { to: '/bill-print', label: 'Bill Print & Design', icon: Printer, badge: null },
    { to: '/settings', label: 'Settings', icon: Settings, badge: null },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col justify-between bg-slate-900 text-slate-200 h-screen border-r border-slate-800 shadow-xl select-none z-30 flex-shrink-0"
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-slate-800 h-16">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  <h1 className="font-bold text-white text-sm tracking-tight truncate max-w-[160px]" title={settings.storeName || 'Kalaasagar SuperMarket'}>
                    {settings.storeName || 'Kalaasagar SuperMarket'}
                  </h1>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded tracking-wider">
                    ENTERPRISE POS
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                        isActive ? 'scale-110 text-white' : 'group-hover:scale-105'
                      }`}
                    />
                    {!collapsed && (
                      <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.label}
                      </span>
                    )}

                    {item.badge && !collapsed && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold shadow-sm ${
                          item.badgeColor || 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {collapsed && item.badge && (
                      <span
                        className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${
                          item.badgeColor?.split(' ')[0] || 'bg-blue-500'
                        }`}
                      />
                    )}

                    {/* Tooltip in collapsed mode */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50 border border-slate-800">
                        {item.label}
                        {item.badge && ` (${item.badge})`}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 hover:bg-rose-500/20 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-all text-left group border border-slate-800 cursor-pointer"
          title="Sign Out / Logout"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-rose-500/20 text-slate-400 group-hover:text-rose-400 border border-slate-700/50 group-hover:border-rose-500/30 flex items-center justify-center transition-colors flex-shrink-0">
            <LogOut className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-slate-200 group-hover:text-rose-200 transition-colors">
                Sign Out
              </p>
              <span className="text-[10px] text-slate-500 font-medium">
                End Terminal Session
              </span>
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
};
