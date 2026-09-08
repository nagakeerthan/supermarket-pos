import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  Barcode,
  Sparkles,
  Save,
  Image as ImageIcon,
  Calculator,
  Building,
  Percent,
} from 'lucide-react';
import { Product, CategoryType } from '../../types';
import { usePosStore } from '../../store/usePosStore';
import { BarcodeSvg } from '../common/BarcodeSvg';

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

const CATEGORIES: CategoryType[] = [
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

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct, suppliers, settings } = usePosStore();

  const [name, setName] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [category, setCategory] = useState<CategoryType>('Groceries & Staples');
  const [brand, setBrand] = useState<string>('');
  const [mrp, setMrp] = useState<number>(100);
  const [costPrice, setCostPrice] = useState<number>(75);
  const [sellingPrice, setSellingPrice] = useState<number>(90);
  const [stock, setStock] = useState<number>(50);
  const [minStockLevel, setMinStockLevel] = useState<number>(10);
  const [unit, setUnit] = useState<Product['unit']>('pcs');
  const [gstRate, setGstRate] = useState<number>(5);
  const [supplier, setSupplier] = useState<string>('ITC FMCG Supply Chain');
  const [image, setImage] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setBarcode(productToEdit.barcode);
      setCategory(productToEdit.category);
      setBrand(productToEdit.brand);
      setMrp(productToEdit.mrp);
      setCostPrice(productToEdit.costPrice);
      setSellingPrice(productToEdit.sellingPrice);
      setStock(productToEdit.stock);
      setMinStockLevel(productToEdit.minStockLevel);
      setUnit(productToEdit.unit);
      setGstRate(productToEdit.gstRate);
      setSupplier(productToEdit.supplier);
      setImage(productToEdit.image || '');
      setDescription(productToEdit.description);
    } else {
      // Defaults for new product
      setName('');
      setBarcode(`890${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setCategory('Groceries & Staples');
      setBrand('');
      setMrp(100);
      setCostPrice(75);
      setSellingPrice(90);
      setStock(50);
      setMinStockLevel(10);
      setUnit('pcs');
      setGstRate(5);
      setSupplier(suppliers[0]?.name || 'Direct Wholesale');
      setImage('');
      setDescription('');
    }
  }, [productToEdit, suppliers, isOpen]);

  if (!isOpen) return null;

  const profitPerUnit = sellingPrice - costPrice;
  const marginPercent = sellingPrice > 0 ? ((profitPerUnit / sellingPrice) * 100).toFixed(1) : '0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !barcode) return;

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        name,
        barcode,
        category,
        brand,
        mrp,
        costPrice,
        sellingPrice,
        stock,
        minStockLevel,
        unit,
        gstRate,
        supplier,
        image,
        description,
      });
    } else {
      addProduct({
        name,
        barcode,
        category,
        brand: brand || 'Generic',
        mrp,
        costPrice,
        sellingPrice,
        stock,
        minStockLevel,
        unit,
        gstRate,
        supplier,
        image,
        description,
      });
    }

    onClose();
  };

  const generateRandomBarcode = () => {
    setBarcode(`890${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-base">
                  {productToEdit ? 'Edit Supermarket SKU' : 'Add New Supermarket Item'}
                </h3>
                <p className="text-xs text-slate-300">
                  Configure pricing, GST tax slab, stock thresholds, and barcode
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Product Name & Brand */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fortune Refined Sunflower Oil 1L"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Fortune"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Barcode with Generator & Live SVG Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 items-center">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Barcode className="w-3.5 h-3.5 text-blue-600" /> Barcode Number (EAN / UPC) *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomBarcode}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="890XXXXXXXXXX"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200">
                <BarcodeSvg value={barcode || '8901234567890'} height={28} width={1.2} fontSize={9} />
              </div>
            </div>

            {/* Category & Unit & GST */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as Product['unit'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="L">Litre (L)</option>
                  <option value="ml">Millilitre (ml)</option>
                  <option value="pack">Pack</option>
                  <option value="box">Box</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GST Tax Slab</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST</option>
                  <option value={28}>28% GST</option>
                </select>
              </div>
            </div>

            {/* Financial Pricing: MRP, Cost Price, Selling Price & Live Margin */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" /> Pricing & Unit Economics
                </span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Profit: {settings.currencySymbol}{profitPerUnit.toFixed(2)} ({marginPercent}% Margin)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    MRP ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={mrp}
                    onChange={(e) => setMrp(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Cost Price ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Selling Price ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-blue-400 ring-1 ring-blue-400 rounded-xl text-xs font-black text-blue-900"
                  />
                </div>
              </div>
            </div>

            {/* Stock Quantities & Supplier */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Min Reorder Alert</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Supplier</label>
                <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Image URL (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Photo URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="e.g. https://example.com/item.jpg (Optional)"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
                {image ? (
                  <img src={image} alt="Preview" className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                    None
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key highlights, packaging details, storage advice..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{productToEdit ? 'Save Changes' : 'Create Product SKU'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
