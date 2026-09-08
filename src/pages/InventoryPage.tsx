import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  Package,
  Edit2,
  Trash2,
  Barcode,
  Tag,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { Product, CategoryType } from '../types';
import { AddEditProductModal } from '../components/inventory/AddEditProductModal';
import { CsvImportModal } from '../components/inventory/CsvImportModal';
import { exportProductsToCsv } from '../utils/csvHelper';
import { BarcodeSvg } from '../components/common/BarcodeSvg';

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

export const InventoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shouldOpenAdd = searchParams.get('add') === 'true';

  const { products, deleteProduct, reloadKalaaSagarInventory, settings } = usePosStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | CategoryType>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [page, setPage] = useState<number>(1);
  const pageSize = 50;

  const [addModalOpen, setAddModalOpen] = useState<boolean>(shouldOpenAdd);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [csvModalOpen, setCsvModalOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [reloadSuccess, setReloadSuccess] = useState<boolean>(false);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;

      if (stockFilter === 'low' && (p.stock > p.minStockLevel || p.stock === 0)) return false;
      if (stockFilter === 'out' && p.stock > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBarcode = p.barcode.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesSupplier = p.supplier.toLowerCase().includes(q);
        if (!matchesName && !matchesBarcode && !matchesBrand && !matchesSupplier) return false;
      }

      return true;
    });
  }, [products, selectedCategory, stockFilter, searchQuery]);

  // Reset page when filter changes
  React.useEffect(() => {
    setPage(1);
  }, [selectedCategory, stockFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setAddModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setDeleteConfirmId(null);
  };

  const handleReloadCatalog = () => {
    if (window.confirm('Reload all 8,914 master products from the Kalaa Sagar Excel dataset?')) {
      reloadKalaaSagarInventory();
      setReloadSuccess(true);
      setTimeout(() => setReloadSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Top Header & Actions Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product by title, barcode, brand, or supplier..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Action Buttons: Add Item, Upload CSV, Export CSV, Reload Master */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => {
                setProductToEdit(null);
                setAddModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>

            <button
              onClick={() => setCsvModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload CSV</span>
            </button>

            <button
              onClick={handleReloadCatalog}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors flex-shrink-0 cursor-pointer"
              title="Reload all 8,914 items from Excel catalog"
            >
              <Package className="w-4 h-4 text-indigo-600" />
              <span>{reloadSuccess ? '✓ Loaded 8,914!' : 'Reload 8.9K Items'}</span>
            </button>

            <button
              onClick={() => exportProductsToCsv(products)}
              className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-2 transition-colors flex-shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Category Pills & Stock Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 no-scrollbar flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stock Filter Pills & Counter */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              Total: <b>{filteredProducts.length.toLocaleString()}</b> SKUs
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['all', 'low', 'out'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setStockFilter(mode)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer ${
                    stockFilter === mode
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  {mode === 'all' ? 'All Stock' : mode === 'low' ? 'Low Stock' : 'Out of Stock'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Data Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Photo</th>
                <th className="py-3.5 px-4">Product Name & SKU</th>
                <th className="py-3.5 px-4">Barcode</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">MRP</th>
                <th className="py-3.5 px-4 text-right">Cost</th>
                <th className="py-3.5 px-4 text-right">Selling</th>
                <th className="py-3.5 px-4 text-center">Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= p.minStockLevel;

                  return (
                    <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Photo / Icon */}
                      <td className="py-3 px-4">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </td>

                      {/* Name & Brand */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <p className="font-bold text-slate-900 leading-snug">{p.name}</p>
                        <span className="text-[10px] text-slate-400">
                          Brand: {p.brand} • Unit: {p.unit}
                        </span>
                      </td>

                      {/* Barcode */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {p.barcode}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                          {p.category}
                        </span>
                      </td>

                      {/* MRP - Clean without slash */}
                      <td className="py-3 px-4 text-right text-slate-600 font-medium">
                        {settings.currencySymbol}{p.mrp.toFixed(2)}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-4 text-right text-slate-600 font-mono">
                        {settings.currencySymbol}{p.costPrice.toFixed(2)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                        {settings.currencySymbol}{p.sellingPrice.toFixed(2)}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {p.stock} {p.unit}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-block ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => navigate(`/labels?sku=${p.id}`)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-700 text-slate-600 transition-colors cursor-pointer"
                            title="Print Shelf Price Tag / Barcode Label"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-600 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredProducts.length > 0 && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Showing <b>{((page - 1) * pageSize + 1).toLocaleString()}</b> to{' '}
              <b>{Math.min(page * pageSize, filteredProducts.length).toLocaleString()}</b> of{' '}
              <b>{filteredProducts.length.toLocaleString()}</b> products
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                « First
              </button>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                ‹ Prev
              </button>
              <span className="px-3 py-1 font-bold text-slate-800 bg-white border border-slate-300 rounded-lg">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                Next ›
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                Last »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Delete Product SKU?</h4>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to remove this product from the inventory catalog? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddEditProductModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      {/* CSV Import Wizard */}
      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
      />
    </div>
  );
};
