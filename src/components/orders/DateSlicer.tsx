import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  Receipt,
  CalendarRange,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Order } from '../../types';

export type DatePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | '7days'
  | '30days'
  | '60days'
  | '90days'
  | '6months'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | '1year'
  | 'custom';

interface DateSlicerProps {
  orders: Order[];
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string; // 'YYYY-MM-DD' or ''
  activePreset: DatePreset;
  currencySymbol?: string;
  onRangeChange: (start: string, end: string, preset: DatePreset) => void;
}

interface TimelineBucket {
  id: string;
  startDateStr: string;
  endDateStr: string;
  displayLabel: string;
  subLabel: string;
  orderCount: number;
  revenue: number;
  inRange: boolean;
}

const formatDateToISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const DateSlicer: React.FC<DateSlicerProps> = ({
  orders,
  startDate,
  endDate,
  activePreset,
  currencySymbol = '₹',
  onRangeChange,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [hoveredBucket, setHoveredBucket] = useState<TimelineBucket | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartIdx, setDragStartIdx] = useState<number | null>(null);
  const histogramRef = useRef<HTMLDivElement>(null);

  // Overall bounds calculated from orders + any active custom range (can span months or years)
  const { minDate, maxDate, minDateStr, maxDateStr, totalDays } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let minTime = Infinity;
    let maxTime = -Infinity;

    if (orders.length > 0) {
      orders.forEach((o) => {
        const t = new Date(o.createdAt).getTime();
        if (t < minTime) minTime = t;
        if (t > maxTime) maxTime = t;
      });
    }

    // Incorporate custom selected dates if outside existing orders
    if (startDate) {
      const sTime = new Date(`${startDate}T00:00:00`).getTime();
      if (!isNaN(sTime) && sTime < minTime) minTime = sTime;
    }
    if (endDate) {
      const eTime = new Date(`${endDate}T23:59:59.999`).getTime();
      if (!isNaN(eTime) && eTime > maxTime) maxTime = eTime;
    }

    // Default fallback to at least past 90 days if orders span is small
    const past90 = new Date(today);
    past90.setDate(today.getDate() - 89);
    past90.setHours(0, 0, 0, 0);

    if (minTime === Infinity) {
      minTime = past90.getTime();
    } else {
      // Allow timeline to breathe (at least 60-90 days for great sliding context)
      if (today.getTime() - minTime < 60 * 24 * 60 * 60 * 1000) {
        minTime = Math.min(minTime, past90.getTime());
      }
    }

    if (maxTime === -Infinity || maxTime < today.getTime()) {
      maxTime = today.getTime();
    }

    const minD = new Date(minTime);
    minD.setHours(0, 0, 0, 0);
    const maxD = new Date(maxTime);
    maxD.setHours(23, 59, 59, 999);

    const diffDays = Math.max(1, Math.round((maxD.getTime() - minD.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      minDate: minD,
      maxDate: maxD,
      minDateStr: formatDateToISO(minD),
      maxDateStr: formatDateToISO(maxD),
      totalDays: diffDays,
    };
  }, [orders, startDate, endDate]);

  // Current active date range timestamps
  const activeStartTime = useMemo(() => {
    if (!startDate) return minDate.getTime();
    const t = new Date(`${startDate}T00:00:00`).getTime();
    return isNaN(t) ? minDate.getTime() : t;
  }, [startDate, minDate]);

  const activeEndTime = useMemo(() => {
    if (!endDate) return maxDate.getTime();
    const t = new Date(`${endDate}T23:59:59.999`).getTime();
    return isNaN(t) ? maxDate.getTime() : t;
  }, [endDate, maxDate]);

  // Adaptive histogram buckets based on total timeline days span (>31 days, 90 days, 365 days, etc.)
  const { timelineBuckets, maxBucketRevenue } = useMemo(() => {
    // Determine bucket granularity
    // <= 45 days: 1 day per bucket
    // 46 - 120 days: 2 days per bucket
    // 121 - 365 days: 1 week (7 days) per bucket
    // > 365 days: 1 month (~30 days) per bucket
    let bucketSpanDays = 1;
    if (totalDays > 365) {
      bucketSpanDays = 30;
    } else if (totalDays > 120) {
      bucketSpanDays = 7;
    } else if (totalDays > 45) {
      bucketSpanDays = 2;
    }

    const buckets: TimelineBucket[] = [];
    const current = new Date(minDate);
    let maxRev = 0;

    while (current <= maxDate) {
      const bStart = new Date(current);
      bStart.setHours(0, 0, 0, 0);

      const bEnd = new Date(current);
      bEnd.setDate(bEnd.getDate() + (bucketSpanDays - 1));
      bEnd.setHours(23, 59, 59, 999);
      if (bEnd > maxDate) {
        bEnd.setTime(maxDate.getTime());
      }

      const bStartStr = formatDateToISO(bStart);
      const bEndStr = formatDateToISO(bEnd);

      // Filter orders in this bucket
      let bCount = 0;
      let bRevenue = 0;
      const bStartTime = bStart.getTime();
      const bEndTime = bEnd.getTime();

      orders.forEach((o) => {
        if (o.status === 'voided') return;
        const oTime = new Date(o.createdAt).getTime();
        if (oTime >= bStartTime && oTime <= bEndTime) {
          bCount += 1;
          bRevenue += o.grandTotal;
        }
      });

      if (bRevenue > maxRev) maxRev = bRevenue;

      // Check if this bucket overlaps with active selected range
      const inRange = bEndTime >= activeStartTime && bStartTime <= activeEndTime;

      // Format display label
      let displayLabel = bStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      let subLabel = bStart.toLocaleDateString('en-US', { weekday: 'short' });
      if (bucketSpanDays > 1) {
        displayLabel = `${bStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${bEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        subLabel = `${bucketSpanDays}d span`;
      }

      buckets.push({
        id: `${bStartStr}_${bEndStr}`,
        startDateStr: bStartStr,
        endDateStr: bEndStr,
        displayLabel,
        subLabel,
        orderCount: bCount,
        revenue: bRevenue,
        inRange,
      });

      // Advance
      current.setDate(current.getDate() + bucketSpanDays);
    }

    return {
      timelineBuckets: buckets,
      maxBucketRevenue: maxRev > 0 ? maxRev : 1,
    };
  }, [orders, minDate, maxDate, totalDays, activeStartTime, activeEndTime]);

  // Aggregate stats in current slice
  const sliceStats = useMemo(() => {
    let ordersCount = 0;
    let totalRevenue = 0;

    orders.forEach((o) => {
      if (o.status === 'voided') return;
      const oTime = new Date(o.createdAt).getTime();
      if (oTime >= activeStartTime && oTime <= activeEndTime) {
        ordersCount += 1;
        totalRevenue += o.grandTotal;
      }
    });

    const activeDaysSpan = Math.max(1, Math.round((activeEndTime - activeStartTime) / (1000 * 60 * 60 * 24)));
    const avgDaily = activeDaysSpan > 0 ? Math.round(totalRevenue / activeDaysSpan) : 0;

    return {
      ordersCount,
      totalRevenue,
      activeDaysSpan,
      avgDaily,
    };
  }, [orders, activeStartTime, activeEndTime]);

  // Quick Preset Actions
  const applyPreset = (preset: DatePreset) => {
    const today = new Date();
    const todayStr = formatDateToISO(today);

    switch (preset) {
      case 'all': {
        onRangeChange('', '', 'all');
        break;
      }
      case 'today': {
        onRangeChange(todayStr, todayStr, 'today');
        break;
      }
      case 'yesterday': {
        const y = new Date();
        y.setDate(today.getDate() - 1);
        const yStr = formatDateToISO(y);
        onRangeChange(yStr, yStr, 'yesterday');
        break;
      }
      case '7days': {
        const past7 = new Date();
        past7.setDate(today.getDate() - 6);
        onRangeChange(formatDateToISO(past7), todayStr, '7days');
        break;
      }
      case '30days': {
        const past30 = new Date();
        past30.setDate(today.getDate() - 29);
        onRangeChange(formatDateToISO(past30), todayStr, '30days');
        break;
      }
      case '60days': {
        const past60 = new Date();
        past60.setDate(today.getDate() - 59);
        onRangeChange(formatDateToISO(past60), todayStr, '60days');
        break;
      }
      case '90days': {
        const past90 = new Date();
        past90.setDate(today.getDate() - 89);
        onRangeChange(formatDateToISO(past90), todayStr, '90days');
        break;
      }
      case '6months': {
        const past6m = new Date();
        past6m.setMonth(today.getMonth() - 6);
        onRangeChange(formatDateToISO(past6m), todayStr, '6months');
        break;
      }
      case 'this_month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        onRangeChange(formatDateToISO(firstDay), todayStr, 'this_month');
        break;
      }
      case 'last_month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        onRangeChange(formatDateToISO(firstDay), formatDateToISO(lastDay), 'last_month');
        break;
      }
      case 'this_year': {
        const firstDay = new Date(today.getFullYear(), 0, 1);
        onRangeChange(formatDateToISO(firstDay), todayStr, 'this_year');
        break;
      }
      case '1year': {
        const past1y = new Date();
        past1y.setFullYear(today.getFullYear() - 1);
        onRangeChange(formatDateToISO(past1y), todayStr, '1year');
        break;
      }
      case 'custom': {
        onRangeChange(startDate || minDateStr, endDate || maxDateStr, 'custom');
        break;
      }
    }
  };

  // Step through time (previous / next window of same duration)
  const shiftPeriod = (direction: 'prev' | 'next') => {
    const currentSpanMs = activeEndTime - activeStartTime;
    let newStartTime = activeStartTime;
    let newEndTime = activeEndTime;

    if (direction === 'prev') {
      newStartTime = Math.max(minDate.getTime(), activeStartTime - currentSpanMs);
      newEndTime = newStartTime + currentSpanMs;
    } else {
      newEndTime = Math.min(maxDate.getTime(), activeEndTime + currentSpanMs);
      newStartTime = newEndTime - currentSpanMs;
    }

    onRangeChange(
      formatDateToISO(new Date(newStartTime)),
      formatDateToISO(new Date(newEndTime)),
      'custom'
    );
  };

  // Slider Calculation (0 to 1000 resolution for smooth continuous scrubbing)
  const totalTimelineSpan = Math.max(1, maxDate.getTime() - minDate.getTime());
  const startSliderVal = Math.round(((activeStartTime - minDate.getTime()) / totalTimelineSpan) * 1000);
  const endSliderVal = Math.round(((activeEndTime - minDate.getTime()) / totalTimelineSpan) * 1000);

  const handleStartSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const clampedVal = Math.min(val, endSliderVal - 5);
    const newTime = minDate.getTime() + (clampedVal / 1000) * totalTimelineSpan;
    onRangeChange(formatDateToISO(new Date(newTime)), endDate || maxDateStr, 'custom');
  };

  const handleEndSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const clampedVal = Math.max(val, startSliderVal + 5);
    const newTime = minDate.getTime() + (clampedVal / 1000) * totalTimelineSpan;
    onRangeChange(startDate || minDateStr, formatDateToISO(new Date(newTime)), 'custom');
  };

  // Direct Bar Click / Drag in Histogram
  const handleBarMouseDown = (idx: number) => {
    setIsDragging(true);
    setDragStartIdx(idx);
    const b = timelineBuckets[idx];
    onRangeChange(b.startDateStr, b.endDateStr, 'custom');
  };

  const handleBarMouseEnter = (idx: number) => {
    if (isDragging && dragStartIdx !== null) {
      const minI = Math.min(dragStartIdx, idx);
      const maxI = Math.max(dragStartIdx, idx);
      onRangeChange(timelineBuckets[minI].startDateStr, timelineBuckets[maxI].endDateStr, 'custom');
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStartIdx(null);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  const presets: { key: DatePreset; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: '7days', label: '7 Days' },
    { key: '30days', label: '30 Days' },
    { key: '60days', label: '60 Days' },
    { key: '90days', label: '90 Days' },
    { key: '6months', label: '6 Months' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'this_year', label: 'This Year' },
    { key: '1year', label: '1 Year' },
  ];

  // Slider track percentages
  const leftPercent = Math.max(0, Math.min(100, (startSliderVal / 1000) * 100));
  const rightPercent = Math.max(0, Math.min(100, 100 - (endSliderVal / 1000) * 100));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200">
      {/* Header Bar */}
      <div className="p-4 sm:px-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white tracking-tight">Timeline Date Slicer</h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider">
                {activePreset === 'all' ? 'Full History' : activePreset.replace('_', ' ')}
              </span>
              {sliceStats.activeDaysSpan > 31 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Extended Range ({sliceStats.activeDaysSpan}d)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">
              Slice orders across any date range (from 1 day to multiple months or years) with scrubber & histogram
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2">
          {/* Stepper Navigation */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5 text-slate-300">
            <button
              onClick={() => shiftPeriod('prev')}
              className="p-1.5 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
              title="Shift previous period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono px-2 text-slate-400 select-none">Shift</span>
            <button
              onClick={() => shiftPeriod('next')}
              className="p-1.5 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
              title="Shift next period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

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
            <span>{isExpanded ? 'Hide Slicer' : 'Show Slicer'}</span>
          </button>
        </div>
      </div>

      {/* Preset Pills Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mr-1 flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            Presets:
          </span>
          {presets.map((p) => {
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

        {/* Active Range Summary Badge */}
        <div className="hidden xl:flex items-center gap-3 text-xs font-semibold text-slate-600 pl-2">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 shadow-2xs">
            <span className="text-slate-400 text-[11px]">Selected:</span>
            <span className="font-mono font-bold text-blue-600">
              {startDate || minDateStr}
            </span>
            <span className="text-slate-400">→</span>
            <span className="font-mono font-bold text-blue-600">
              {endDate || maxDateStr}
            </span>
            <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
              {sliceStats.activeDaysSpan} {sliceStats.activeDaysSpan === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Interactive Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Quick Metrics Bar for Active Slice */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Orders in Slice</span>
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
                {sliceStats.activeDaysSpan} <span className="text-xs font-bold text-slate-500">Days</span>
              </p>
            </div>
          </div>

          {/* Interactive Histogram Chart & Time Scrubber */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 relative shadow-inner overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-1/4 w-72 h-32 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Timeline Activity Distribution
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  (Click or drag across bars to slice)
                </span>
              </div>
              {hoveredBucket && (
                <div className="bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-3 animate-in fade-in duration-100">
                  <span className="font-bold text-white">{hoveredBucket.displayLabel}:</span>
                  <span className="text-blue-400 font-bold">{hoveredBucket.orderCount} orders</span>
                  <span className="text-emerald-400 font-bold">
                    {currencySymbol}{hoveredBucket.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* Bars container */}
            <div
              ref={histogramRef}
              className="h-24 flex items-end gap-1 sm:gap-1.5 pt-2 pb-1 relative select-none"
            >
              {timelineBuckets.map((bucket, idx) => {
                const heightPercent = Math.max(8, Math.round((bucket.revenue / maxBucketRevenue) * 100));

                return (
                  <div
                    key={bucket.id}
                    onMouseDown={() => handleBarMouseDown(idx)}
                    onMouseEnter={() => {
                      setHoveredBucket(bucket);
                      handleBarMouseEnter(idx);
                    }}
                    onMouseLeave={() => setHoveredBucket(null)}
                    className="flex-1 flex flex-col justify-end items-center h-full group cursor-pointer relative"
                  >
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-150 relative ${
                        bucket.inRange
                          ? 'bg-linear-to-t from-blue-600 to-indigo-400 shadow-xs shadow-blue-500/30'
                          : 'bg-slate-700/50 hover:bg-slate-600'
                      }`}
                    >
                      {/* Active indicator dot */}
                      {bucket.orderCount > 0 && bucket.inRange && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scrubber & Slider Track */}
            <div className="relative pt-4 pb-2">
              {/* Visual custom track bar */}
              <div className="h-2 bg-slate-800 rounded-full relative overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-blue-500 rounded-full transition-all duration-75 shadow-xs shadow-blue-400/50"
                  style={{
                    left: `${leftPercent}%`,
                    right: `${rightPercent}%`,
                  }}
                />
              </div>

              {/* Dual Range Native Sliders overlaid (0-1000 step precision) */}
              <div className="relative w-full h-6 -mt-4">
                <input
                  type="range"
                  min={0}
                  max={1000}
                  value={startSliderVal}
                  onChange={handleStartSliderChange}
                  className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:appearance-none"
                />
                <input
                  type="range"
                  min={0}
                  max={1000}
                  value={endSliderVal}
                  onChange={handleEndSliderChange}
                  className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:appearance-none"
                />
              </div>

              {/* Timeline Axis Labels */}
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 mt-1 select-none">
                <span>{minDateStr}</span>
                <span className="hidden sm:inline text-slate-500">
                  {sliceStats.activeDaysSpan} days selected of {totalDays} total span
                </span>
                <span>{maxDateStr}</span>
              </div>
            </div>
          </div>

          {/* Bottom Manual Date Inputs & Quick Range Boosters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5 text-blue-600" />
                Custom Date Range:
              </span>

              {/* Start Date input (Fully unrestricted) */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white">
                <span className="text-slate-400 font-semibold text-[11px]">From:</span>
                <input
                  type="date"
                  value={startDate || minDateStr}
                  onChange={(e) => {
                    onRangeChange(e.target.value, endDate || maxDateStr, 'custom');
                  }}
                  className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>

              {/* End Date input (Fully unrestricted) */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white">
                <span className="text-slate-400 font-semibold text-[11px]">To:</span>
                <input
                  type="date"
                  value={endDate || maxDateStr}
                  onChange={(e) => {
                    onRangeChange(startDate || minDateStr, e.target.value, 'custom');
                  }}
                  className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Quick Jump Buttons */}
              <button
                onClick={() => applyPreset('today')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Today
              </button>

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
