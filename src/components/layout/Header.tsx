import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Clock,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Keyboard,
  Layers,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';

interface HeaderProps {
  onOpenShortcuts: () => void;
  onOpenHeldCarts: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShortcuts, onOpenHeldCarts }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { heldCarts, settings, updateSettings } = usePosStore();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (location.pathname !== '/billing') {
        navigate(`/billing?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Executive Dashboard & Analytics';
      case '/billing':
        return 'Point of Sale (POS) Billing Terminal';
      case '/orders':
        return 'Invoice Registry & Order History';
      case '/inventory':
        return 'Inventory & Product Catalog';
      case '/stock':
        return 'Stock Adjustments & Expiry Tracker';
      case '/reports':
        return 'Business Reports & Profit Analytics';
      case '/labels':
        return 'Shelf Tag & Barcode Label Designer';
      case '/settings':
        return 'System Configuration & Admin Settings';
      default:
        return 'Supermarket Management System';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
      {/* Left Title & Path */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            {getPageTitle()}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Realtime Active
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <Wifi className="w-3 h-3 text-emerald-600" /> Multi-tab Synced
            </span>
          </div>
        </div>
      </div>

      {/* Middle Global Search (only if not on billing) */}
      {location.pathname !== '/billing' && (
        <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative w-80">
          <Search className="w-4 h-4 absolute left-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search product / barcode (F1)..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
          />
        </form>
      )}

      {/* Right Controls & Clock */}
      <div className="flex items-center gap-2.5">
        {/* Held Carts quick access */}
        <button
          onClick={onOpenHeldCarts}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            heldCarts.length > 0
              ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm animate-pulse-subtle'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
          title="View Held Carts (F8)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Held Carts</span>
          {heldCarts.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
              {heldCarts.length}
            </span>
          )}
        </button>

        {/* Live Clock Card */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-mono font-bold text-slate-800">{currentTime}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">{currentDate}</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          className={`p-2 rounded-xl border transition-all ${
            settings.soundEnabled
              ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
              : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
          }`}
          title={settings.soundEnabled ? 'Mute POS Audio Chimes' : 'Unmute POS Audio Chimes'}
        >
          {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Hotkeys helper */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
          title="Keyboard Hotkeys Reference (F10 or ?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (POS Mode)'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
