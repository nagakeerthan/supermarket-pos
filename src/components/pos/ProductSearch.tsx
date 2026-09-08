import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Barcode,
  Camera,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Zap,
} from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';
import { Product, CategoryType } from '../../types';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { posSound } from '../../utils/sound';

interface ProductSearchProps {
  onSelectProduct: (product: Product) => void;
  initialSearch?: string;
}

const CATEGORIES: ('All' | CategoryType)[] = [
  'All',
  'Groceries & Staples',
  'Dairy & Eggs',
  'Beverages',
  'Snacks & Branded Foods',
  'Personal Care',
  'Home & Kitchen',
  'Fruits & Vegetables',
  'Bakery & Cakes',
  'Frozen & Ready to Eat',
  'Baby & Child Care',
];

export const ProductSearch: React.FC<ProductSearchProps> = ({
  onSelectProduct,
  initialSearch = '',
}) => {
  const { products, settings } = usePosStore();
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<'All' | CategoryType>('All');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);
  const [cameraBarcode, setCameraBarcode] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Hardware barcode scanner wedge listener
  useBarcodeScanner({
    onScan: (scannedBarcode) => {
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 800);

      const match = products.find(
        (p) => p.barcode.toLowerCase() === scannedBarcode.toLowerCase()
      );
      if (match) {
        onSelectProduct(match);
      } else {
        setSearchQuery(scannedBarcode);
        posSound.playErrorBeep();
      }
    },
  });

  // Filter products by category, name, brand, or barcode
  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  const [visibleCount, setVisibleCount] = useState<number>(60);

  // Reset visibleCount when search or category changes
  useEffect(() => {
    setVisibleCount(60);
  }, [searchQuery, selectedCategory]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const handleSimulateCameraScan = (code: string) => {
    const match = products.find((p) => p.barcode === code);
    if (match) {
      onSelectProduct(match);
      setCameraModalOpen(false);
      setCameraBarcode('');
    } else {
      setSearchQuery(code);
      setCameraModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Search Input Header */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              data-search-input="true"
              data-barcode-input="true"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredProducts.length > 0) {
                  e.preventDefault();
                  onSelectProduct(filteredProducts[0]);
                  setSearchQuery('');
                }
              }}
              placeholder="Search product by name, brand, or barcode (F1 / F2)..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-inner"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Barcode Scanner Indicator / Hardware Simulation */}
          <div
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              isScanning
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/30 animate-pulse'
                : 'bg-white border-slate-300 text-slate-700'
            }`}
            title="USB Barcode Scanner is Active & Ready"
          >
            <Barcode className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isScanning ? 'Scanned!' : 'Scanner Ready'}
            </span>
          </div>

          {/* Camera Scanner Trigger */}
          <button
            onClick={() => setCameraModalOpen(true)}
            className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
            title="Camera Barcode Scanner / Barcode Tester"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Pills & Item Count Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap hidden md:inline">
            {filteredProducts.length.toLocaleString()} items
          </span>
        </div>
      </div>

      {/* Product Results Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6">
            <Barcode className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No products found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              No matching SKU for "{searchQuery}". Check the barcode or add this item in Inventory.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
              {displayedProducts.map((p) => {
                const isLowStock = p.stock > 0 && p.stock <= p.minStockLevel;
                const isOutOfStock = p.stock <= 0;
                const discountPercent =
                  p.mrp > p.sellingPrice
                    ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100)
                    : 0;

                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    disabled={isOutOfStock}
                    className={`group text-left relative flex flex-col justify-between p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isOutOfStock
                        ? 'opacity-50 bg-slate-100 border-slate-200 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Top Visual & Badges */}
                    <div>
                      <div className="relative w-full h-14 sm:h-16 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 mb-1.5 flex items-center justify-center">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50/50 flex flex-col items-center justify-center p-2 text-center">
                            <span className="text-xs font-black text-blue-700 font-mono tracking-tight truncate max-w-full">
                              {p.name.slice(0, 16)}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 truncate max-w-full">
                              {p.category.split(' ')[0]}
                            </span>
                          </div>
                        )}

                        {discountPercent > 0 && (
                          <span className="absolute top-1 left-1 bg-rose-600 text-white text-[9px] font-extrabold px-1 py-0.2 rounded shadow-xs">
                            {discountPercent}% OFF
                          </span>
                        )}

                        {/* Stock badge */}
                        <span
                          className={`absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs ${
                            isOutOfStock
                              ? 'bg-rose-600 text-white'
                              : isLowStock
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-900/80 text-white backdrop-blur-xs'
                          }`}
                        >
                          {isOutOfStock ? 'Out of stock' : `${p.stock} ${p.unit}`}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug group-hover:text-blue-600 transition-colors" title={p.name}>
                        {p.name}
                      </h4>
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5 truncate">{p.barcode}</p>
                    </div>

                    {/* Bottom Price & Add Action */}
                    <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                            {settings.currencySymbol}
                            {p.sellingPrice.toFixed(2)}
                          </span>
                          {p.mrp > p.sellingPrice && (
                            <span className="text-[9px] text-slate-500 font-medium">
                              MRP {settings.currencySymbol}{p.mrp.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500">GST: {p.gstRate}%</span>
                      </div>

                      <div className="w-6 h-6 rounded-md bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors shadow-xs flex-shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Load More Button */}
            {filteredProducts.length > visibleCount && (
              <div className="text-center pt-2 pb-4">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 60)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Load More Items (Showing {displayedProducts.length} of {filteredProducts.length.toLocaleString()})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera Barcode Scanner & Quick Barcode Tester Modal */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Quick Barcode Scanner & Emulator</h3>
              </div>
              <button
                onClick={() => setCameraModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 text-center text-white relative overflow-hidden">
                <div className="w-full h-32 border-2 border-dashed border-emerald-400/70 rounded-lg flex flex-col items-center justify-center relative">
                  <div className="w-full h-0.5 bg-rose-500 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-lg shadow-rose-500/80" />
                  <Camera className="w-8 h-8 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-300 font-mono">Camera / Laser Aim Target</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Hold physical barcode in front of the lens or choose a fast test barcode below.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type or Paste Raw Barcode:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cameraBarcode}
                    onChange={(e) => setCameraBarcode(e.target.value)}
                    placeholder="e.g. 8906007280014"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                  <button
                    onClick={() => handleSimulateCameraScan(cameraBarcode)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    Scan
                  </button>
                </div>
              </div>

              {/* Sample Quick Barcodes to test */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Click Sample Barcode to Scan:
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  {products.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSimulateCameraScan(p.barcode)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-colors"
                    >
                      <p className="text-[11px] font-bold text-slate-800 truncate">{p.name}</p>
                      <span className="text-[10px] font-mono text-blue-600">{p.barcode}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setCameraModalOpen(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
