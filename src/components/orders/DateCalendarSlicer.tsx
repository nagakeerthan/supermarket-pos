import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  TrendingUp,
  Receipt,
  CalendarRange,
  X,
  Sparkles,
  Clock,
} from 'lucide-react';
import { Order } from '../../types';

export type DatePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | '7days'
  | 'this_month'
  | 'last_month'
  | '30days'
  | '60days'
  | '90days'
  | 'this_quarter'
  | 'this_year'
  | '1year'
  | 'custom';

interface DateCalendarSlicerProps {
  orders: Order[];
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string; // 'YYYY-MM-DD' or ''
  activePreset: DatePreset;
  currencySymbol?: string;
  onRangeChange: (start: string, end: string, preset: DatePreset) => void;
}

const formatDateToISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseISODate = (str: string): Date | null => {
  if (!str) return null;
  const parts = str.split('-').map(Number);
  if (parts.length !== 3) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DateCalendarSlicer: React.FC<DateCalendarSlicerProps> = ({
  orders,
  startDate,
  endDate,
  activePreset,
  currencySymbol = '₹',
  onRangeChange,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Calendar View Window: controls the visible base month
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (endDate) {
      const d = parseISODate(endDate);
      if (d) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Range Selection in progress state
  const [selectingStart, setSelectingStart] = useState<string | null>(null);
  const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);

  // Synchronize viewDate when preset or endDate changes externally
  useEffect(() => {
    if (endDate) {
      const d = parseISODate(endDate);
      if (d) {
        setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
  }, [endDate]);

  // Aggregate orders by day for activity badges & heat tooltips
  const dayOrderStats = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    orders.forEach((o) => {
      if (o.status === 'voided') return;
      const dStr = formatDateToISO(new Date(o.createdAt));
      const curr = map.get(dStr) || { count: 0, revenue: 0 };
      curr.count += 1;
      curr.revenue += o.grandTotal;
      map.set(dStr, curr);
    });
    return map;
  }, [orders]);

  // Summary Metrics for current slice
  const sliceStats = useMemo(() => {
    let ordersCount = 0;
    let totalRevenue = 0;

    const startObj = startDate ? parseISODate(startDate) : null;
    const endObj = endDate ? parseISODate(endDate) : null;

    if (startObj) startObj.setHours(0, 0, 0, 0);
    if (endObj) endObj.setHours(23, 59, 59, 999);

    orders.forEach((o) => {
      if (o.status === 'voided') return;
      const oTime = new Date(o.createdAt).getTime();

      if (startObj && oTime < startObj.getTime()) return;
      if (endObj && oTime > endObj.getTime()) return;

      ordersCount += 1;
      totalRevenue += o.grandTotal;
    });

    let daysDuration = 1;
    if (startObj && endObj) {
      daysDuration = Math.max(1, Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)));
    } else if (orders.length > 0) {
      // All time duration
      let minT = Infinity;
      let maxT = -Infinity;
      orders.forEach((o) => {
        const t = new Date(o.createdAt).getTime();
        if (t < minT) minT = t;
        if (t > maxT) maxT = t;
      });
      if (minT !== Infinity && maxT !== -Infinity) {
        daysDuration = Math.max(1, Math.round((maxT - minT) / (1000 * 60 * 60 * 24)) + 1);
      }
    }

    const avgDaily = daysDuration > 0 ? Math.round(totalRevenue / daysDuration) : 0;

    return {
      ordersCount,
      totalRevenue,
      daysDuration,
      avgDaily,
    };
  }, [orders, startDate, endDate]);

  // Calendar navigation helpers
  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };
  const prevYear = () => {
    setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
  };
  const nextYear = () => {
    setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
  };
  const jumpToToday = () => {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    applyPreset('today');
  };

  // Preset Logic
  const applyPreset = (preset: DatePreset) => {
    const now = new Date();
    const todayStr = formatDateToISO(now);

    setSelectingStart(null);

    switch (preset) {
      case 'all': {
        onRangeChange('', '', 'all');
        break;
      }
      case 'today': {
        onRangeChange(todayStr, todayStr, 'today');
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      }
      case 'yesterday': {
        const y = new Date();
        y.setDate(now.getDate() - 1);
        const yStr = formatDateToISO(y);
        onRangeChange(yStr, yStr, 'yesterday');
        setViewDate(new Date(y.getFullYear(), y.getMonth(), 1));
        break;
      }
      case 'this_week': {
        const first = new Date(now);
        const day = first.getDay(); // 0 is Sunday
        first.setDate(first.getDate() - day);
        onRangeChange(formatDateToISO(first), todayStr, 'this_week');
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      }
      case '7days': {
        const past7 = new Date();
        past7.setDate(now.getDate() - 6);
        onRangeChange(formatDateToISO(past7), todayStr, '7days');
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      }
      case 'this_month': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        onRangeChange(formatDateToISO(firstDay), todayStr, 'this_month');
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      }
      case 'last_month': {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        onRangeChange(formatDateToISO(firstDay), formatDateToISO(lastDay), 'last_month');
        setViewDate(new Date(firstDay.getFullYear(), firstDay.getMonth(), 1));
        break;
      }
      case '30days': {
        const past30 = new Date();
        past30.setDate(now.getDate() - 29);
        onRangeChange(formatDateToISO(past30), todayStr, '30days');
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      }
      case '60days': {
        const past60 = new Date();
        past60.setDate(now.getDate() - 59);
        onRangeChange(formatDateToISO(past60), todayStr, '60days');
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      }
      case '90days': {
        const past90 = new Date();
        past90.setDate(now.getDate() - 89);
        onRangeChange(formatDateToISO(past90), todayStr, '90days');
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      }
      case 'this_quarter': {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const firstDay = new Date(now.getFullYear(), currentQuarter * 3, 1);
        onRangeChange(formatDateToISO(firstDay), todayStr, 'this_quarter');
        setViewDate(new Date(firstDay.getFullYear(), firstDay.getMonth(), 1));
        break;
      }
      case 'this_year': {
        const firstDay = new Date(now.getFullYear(), 0, 1);
        onRangeChange(formatDateToISO(firstDay), todayStr, 'this_year');
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      }
      case '1year': {
        const past1y = new Date();
        past1y.setFullYear(now.getFullYear() - 1);
        onRangeChange(formatDateToISO(past1y), todayStr, '1year');
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      }
      case 'custom': {
        onRangeChange(startDate, endDate, 'custom');
        break;
      }
    }
  };

  // Calendar Day Click Handler (Two-click range selection)
  const handleDayClick = (dateStr: string) => {
    if (!selectingStart) {
      // First click: sets start date and enters selection mode
      setSelectingStart(dateStr);
    } else {
      // Second click: completes range
      let s = selectingStart;
      let e = dateStr;
      if (s > e) {
        // Swap if clicked in reverse order
        const temp = s;
        s = e;
        e = temp;
      }
      onRangeChange(s, e, 'custom');
      setSelectingStart(null);
    }
  };

  // Quick single day double click or select
  const handleSingleDayPick = (dateStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRangeChange(dateStr, dateStr, 'custom');
    setSelectingStart(null);
  };

  // Presets definition list
  const presetGroups = [
    { key: 'all' as DatePreset, label: 'All Time' },
    { key: 'today' as DatePreset, label: 'Today' },
    { key: 'yesterday' as DatePreset, label: 'Yesterday' },
    { key: 'this_week' as DatePreset, label: 'This Week' },
    { key: '7days' as DatePreset, label: 'Last 7 Days' },
    { key: 'this_month' as DatePreset, label: 'This Month' },
    { key: 'last_month' as DatePreset, label: 'Last Month' },
    { key: '30days' as DatePreset, label: 'Last 30 Days' },
    { key: '60days' as DatePreset, label: 'Last 60 Days' },
    { key: '90days' as DatePreset, label: 'Last 90 Days' },
    { key: 'this_quarter' as DatePreset, label: 'This Quarter' },
    { key: 'this_year' as DatePreset, label: 'This Year' },
    { key: '1year' as DatePreset, label: 'Past 1 Year' },
  ];

  // Helper to generate calendar matrix for a given month
  const generateMonthMatrix = (year: number, monthIndex: number) => {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);

    const startWeekday = firstDay.getDay(); // 0-6
    const totalDays = lastDay.getDate(); // 28-31

    const days: ({ dateStr: string; dayNum: number; isCurrentMonth: boolean })[] = [];

    // Leading days from previous month
    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const prevD = prevMonthLastDay - i;
      const prevDate = new Date(year, monthIndex - 1, prevD);
      days.push({
        dateStr: formatDateToISO(prevDate),
        dayNum: prevD,
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let d = 1; d <= totalDays; d++) {
      const currDate = new Date(year, monthIndex, d);
      days.push({
        dateStr: formatDateToISO(currDate),
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Trailing days to fill 6-week grid (up to 42 cells)
    const remaining = 42 - days.length;
    for (let nextD = 1; nextD <= remaining; nextD++) {
      const nextDate = new Date(year, monthIndex + 1, nextD);
      days.push({
        dateStr: formatDateToISO(nextDate),
        dayNum: nextD,
        isCurrentMonth: false,
      });
    }

    return {
      year,
      monthIndex,
      monthName: MONTH_NAMES[monthIndex],
      days,
    };
  };

  // Generate 2 side-by-side months for desktop dual-calendar
  const firstMonthData = useMemo(() => {
    return generateMonthMatrix(viewDate.getFullYear(), viewDate.getMonth());
  }, [viewDate]);

  const secondMonthData = useMemo(() => {
    const nextM = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    return generateMonthMatrix(nextM.getFullYear(), nextM.getMonth());
  }, [viewDate]);

  // Active Effective Range (accounting for in-progress selection hover)
  const effectiveStartStr = useMemo(() => {
    if (selectingStart) {
      if (hoveredDateStr) {
        return selectingStart <= hoveredDateStr ? selectingStart : hoveredDateStr;
      }
      return selectingStart;
    }
    return startDate;
  }, [selectingStart, hoveredDateStr, startDate]);

  const effectiveEndStr = useMemo(() => {
    if (selectingStart) {
      if (hoveredDateStr) {
        return selectingStart <= hoveredDateStr ? hoveredDateStr : selectingStart;
      }
      return selectingStart;
    }
    return endDate;
  }, [selectingStart, hoveredDateStr, endDate]);

  const todayStr = formatDateToISO(today);

  // Render a Single Month Calendar Grid Component
  const renderCalendarMonth = (monthData: ReturnType<typeof generateMonthMatrix>) => {
    return (
      <div className="flex-1 min-w-[270px]">
        {/* Month Header */}
        <div className="text-center py-2 font-bold text-xs text-slate-800 uppercase tracking-wider bg-slate-50 rounded-xl mb-2.5 border border-slate-200">
          {monthData.monthName} {monthData.year}
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 uppercase mb-1">
          {DAYS_OF_WEEK.map((w, idx) => (
            <div key={w} className={`py-1 ${idx === 0 || idx === 6 ? 'text-blue-600' : ''}`}>
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {monthData.days.map((item, idx) => {
            const isToday = item.dateStr === todayStr;
            const stats = dayOrderStats.get(item.dateStr);
            const hasOrders = stats && stats.count > 0;

            const isStart = effectiveStartStr === item.dateStr;
            const isEnd = effectiveEndStr === item.dateStr;
            const isInRange =
              effectiveStartStr &&
              effectiveEndStr &&
              item.dateStr >= effectiveStartStr &&
              item.dateStr <= effectiveEndStr;
            const isSingleSelected = isStart && isEnd;

            return (
              <div
                key={`${item.dateStr}-${idx}`}
                onClick={() => handleDayClick(item.dateStr)}
                onMouseEnter={() => setHoveredDateStr(item.dateStr)}
                onDoubleClick={(e) => handleSingleDayPick(item.dateStr, e)}
                className={`group relative h-9 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all duration-150 select-none ${
                  !item.isCurrentMonth
                    ? 'opacity-35 hover:opacity-75 text-slate-500'
                    : 'text-slate-800'
                } ${
                  isSingleSelected
                    ? 'bg-blue-600 text-white font-black shadow-md ring-2 ring-blue-400/40 z-10'
                    : isStart
                    ? 'bg-blue-600 text-white font-black rounded-r-none shadow-sm z-10'
                    : isEnd
                    ? 'bg-blue-600 text-white font-black rounded-l-none shadow-sm z-10'
                    : isInRange
                    ? 'bg-blue-100 text-blue-900 font-bold rounded-none hover:bg-blue-200'
                    : 'hover:bg-slate-100 hover:text-slate-950 font-medium'
                } ${
                  isToday && !isInRange
                    ? 'ring-1 ring-blue-500 font-black text-blue-600'
                    : ''
                }`}
                title={
                  stats
                    ? `${item.dateStr}: ${stats.count} orders (${currencySymbol}${stats.revenue.toLocaleString('en-IN')})`
                    : item.dateStr
                }
              >
                <span className="text-xs leading-none">{item.dayNum}</span>

                {/* Orders indicator badge dot */}
                {hasOrders && (
                  <span
                    className={`w-1 h-1 rounded-full mt-0.5 ${
                      isStart || isEnd || isSingleSelected
                        ? 'bg-white'
                        : isInRange
                        ? 'bg-blue-600'
                        : 'bg-emerald-500'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
      {/* Header Bar */}
      <div className="p-4 sm:px-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white tracking-tight">Date Calendar Slicer</h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider">
                {activePreset === 'all' ? 'Full History' : activePreset.replace('_', ' ')}
              </span>
              {sliceStats.daysDuration > 31 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {sliceStats.daysDuration} Days Range
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">
              Click start & end dates on the interactive calendar grid to slice order transactions
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2">
          {/* Quick Jump Today */}
          <button
            onClick={jumpToToday}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Today</span>
          </button>

          {/* Reset button */}
          {(startDate || endDate || activePreset !== 'all') && (
            <button
              onClick={() => applyPreset('all')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset date slicer to Full History"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              <span>Reset</span>
            </button>
          )}

          {/* Toggle Expand/Collapse */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>{isExpanded ? 'Hide Calendar' : 'Show Calendar'}</span>
          </button>
        </div>
      </div>

      {/* Preset Pills Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mr-1 flex items-center gap-1">
            <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
            Presets:
          </span>
          {presetGroups.map((p) => {
            const isActive = activePreset === p.key;
            return (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs scale-102 ring-2 ring-blue-600/30'
                    : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Selected Range Summary Label */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-600 pl-2">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 shadow-2xs">
            <span className="text-slate-400 text-[11px]">Selected:</span>
            <span className="font-mono font-bold text-blue-600">
              {startDate || 'Earliest Date'}
            </span>
            <span className="text-slate-400">→</span>
            <span className="font-mono font-bold text-blue-600">
              {endDate || 'Latest Date'}
            </span>
            <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
              {sliceStats.daysDuration} {sliceStats.daysDuration === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Calendar Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Quick Metrics Bar for Active Slice */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Orders in Range</span>
                <Receipt className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p className="text-lg font-black text-slate-900">{sliceStats.ordersCount}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Slice Revenue</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-lg font-black text-slate-900">
                {currencySymbol}
                {sliceStats.totalRevenue.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Daily Average</span>
                <span className="text-[10px] text-slate-400 font-mono">/ day</span>
              </div>
              <p className="text-lg font-black text-slate-900">
                {currencySymbol}
                {sliceStats.avgDaily.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Selected Window</span>
                <CalendarRange className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <p className="text-lg font-black text-slate-900">
                {sliceStats.daysDuration} <span className="text-xs font-bold text-slate-500">Days</span>
              </p>
            </div>
          </div>

          {/* Interactive Dual Month Visual Calendar View */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            {/* Calendar Navigation Controls */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1">
                <button
                  onClick={prevYear}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Previous Year"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center">
                <span className="font-extrabold text-xs text-slate-800">
                  {selectingStart ? (
                    <span className="text-blue-600 animate-pulse">
                      Click another date to complete the range (Start: {selectingStart})
                    </span>
                  ) : (
                    <span>Click any day to start range, or double-click for single day</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={nextYear}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Next Year"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Side-by-Side Dual Month Grids */}
            <div className="flex flex-col md:flex-row gap-6 justify-between pt-1">
              {renderCalendarMonth(firstMonthData)}
              {renderCalendarMonth(secondMonthData)}
            </div>
          </div>

          {/* Bottom Manual Date Inputs & Quick Range Boosters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5 text-blue-600" />
                Exact Date Inputs:
              </span>

              {/* Start Date input */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white">
                <span className="text-slate-400 font-semibold text-[11px]">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    onRangeChange(e.target.value, endDate, 'custom');
                  }}
                  className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>

              {/* End Date input */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white">
                <span className="text-slate-400 font-semibold text-[11px]">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    onRangeChange(startDate, e.target.value, 'custom');
                  }}
                  className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Quick Stepper Shortcuts */}
              <button
                onClick={() => applyPreset('60days')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                +60 Days
              </button>

              <button
                onClick={() => applyPreset('90days')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                +90 Days
              </button>

              <button
                onClick={() => applyPreset('1year')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                +1 Year
              </button>
            </div>

            {/* Clear custom filter */}
            {(startDate || endDate) && (
              <button
                onClick={() => applyPreset('all')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset to All Time</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
