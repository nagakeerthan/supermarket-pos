import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';
import { parseProductCsv, downloadSampleCsvTemplate, CsvValidationResult } from '../../utils/csvHelper';
import { Product } from '../../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const { bulkAddOrUpdateProducts } = usePosStore();

  const [file, setFile] = useState<File | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<'overwrite' | 'skip'>('overwrite');
  const [validationResult, setValidationResult] = useState<CsvValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    updated: number;
    failed: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setIsProcessing(true);
      try {
        const result = await parseProductCsv(selected);
        setValidationResult(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleExecuteImport = () => {
    if (!validationResult || validationResult.validRows.length === 0) return;

    const res = bulkAddOrUpdateProducts(validationResult.validRows, duplicateMode);
    setImportSummary({
      total: validationResult.validRows.length + validationResult.invalidRows.length,
      imported: res.imported,
      updated: res.updated,
      failed: validationResult.invalidRows.length + res.skipped,
    });
  };

  const handleReset = () => {
    setFile(null);
    setValidationResult(null);
    setImportSummary(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-600/30 border border-emerald-400/30 text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Bulk CSV Inventory Import Wizard</h3>
                <p className="text-xs text-slate-300">
                  Upload spreadsheet with barcodes, prices, stock, and supplier metadata
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

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {!importSummary ? (
              <>
                {/* Step 1: File Dropzone & Template Download */}
                {!validationResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs">
                      <div>
                        <h4 className="font-bold text-blue-900">Need the Standard CSV Format?</h4>
                        <p className="text-slate-600 mt-0.5">
                          Download our ready-made CSV template with sample supermarket SKUs
                        </p>
                      </div>
                      <button
                        onClick={downloadSampleCsvTemplate}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Template</span>
                      </button>
                    </div>

                    <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50/20 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                        <Upload className="w-7 h-7" />
                      </div>
                      <span className="text-sm font-bold text-slate-800">
                        {file ? file.name : 'Click to select or drag CSV file here'}
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        Accepts UTF-8 .csv files with header columns
                      </span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Validation Badges */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs">
                        <span className="text-emerald-700 font-bold block">Valid SKUs Found:</span>
                        <span className="text-xl font-black text-emerald-900">
                          {validationResult.validRows.length}
                        </span>
                      </div>

                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs">
                        <span className="text-rose-700 font-bold block">Invalid / Errors:</span>
                        <span className="text-xl font-black text-rose-900">
                          {validationResult.invalidRows.length}
                        </span>
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs">
                        <span className="text-amber-700 font-bold block">Duplicate Barcodes:</span>
                        <span className="text-xl font-black text-amber-900">
                          {validationResult.duplicateBarcodes.length}
                        </span>
                      </div>
                    </div>

                    {/* Duplicate Resolution Strategy */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Duplicate Barcode Policy:</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                          <input
                            type="radio"
                            name="dupMode"
                            checked={duplicateMode === 'overwrite'}
                            onChange={() => setDuplicateMode('overwrite')}
                            className="text-blue-600"
                          />
                          <span>Overwrite Existing SKUs</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                          <input
                            type="radio"
                            name="dupMode"
                            checked={duplicateMode === 'skip'}
                            onChange={() => setDuplicateMode('skip')}
                            className="text-blue-600"
                          />
                          <span>Skip Duplicates</span>
                        </label>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Preview Parsed Rows (First 5 records):
                      </h4>
                      <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs max-h-48 overflow-y-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-100 text-slate-700 font-bold">
                            <tr>
                              <th className="p-2">Item Title</th>
                              <th className="p-2">Barcode</th>
                              <th className="p-2">Category</th>
                              <th className="p-2 text-right">Selling</th>
                              <th className="p-2 text-right">Cost</th>
                              <th className="p-2 text-center">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {validationResult.validRows.slice(0, 5).map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900 truncate max-w-[150px]">
                                  {row.name}
                                </td>
                                <td className="p-2 font-mono text-blue-600">{row.barcode}</td>
                                <td className="p-2 text-slate-500">{row.category}</td>
                                <td className="p-2 text-right font-bold">₹{row.sellingPrice}</td>
                                <td className="p-2 text-right text-slate-500">₹{row.costPrice}</td>
                                <td className="p-2 text-center font-bold">{row.stock}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Invalid Rows Report */}
                    {validationResult.invalidRows.length > 0 && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1 max-h-32 overflow-y-auto">
                        <span className="font-bold block">Skipped Invalid Rows:</span>
                        {validationResult.invalidRows.map((err, i) => (
                          <p key={i} className="text-[11px]">
                            Row #{err.rowNumber}: {err.error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Step 3: Success Import Summary */
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">CSV Import Completed</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Products have been synced to the live POS catalog and database.
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2 max-w-md mx-auto text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block font-bold">Total</span>
                    <span className="font-black text-slate-900 text-base">{importSummary.total}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-emerald-700 block font-bold">Imported</span>
                    <span className="font-black text-emerald-900 text-base">{importSummary.imported}</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-blue-700 block font-bold">Updated</span>
                    <span className="font-black text-blue-900 text-base">{importSummary.updated}</span>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                    <span className="text-rose-700 block font-bold">Failed/Skip</span>
                    <span className="font-black text-rose-900 text-base">{importSummary.failed}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              {importSummary ? 'Close' : 'Cancel'}
            </button>

            <div className="flex items-center gap-2">
              {validationResult && !importSummary && (
                <>
                  <button
                    onClick={handleReset}
                    className="px-3 py-2 border border-slate-300 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Upload Different</span>
                  </button>

                  <button
                    onClick={handleExecuteImport}
                    disabled={validationResult.validRows.length === 0}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Proceed & Import {validationResult.validRows.length} Items</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
