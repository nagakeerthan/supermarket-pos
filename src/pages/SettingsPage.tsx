import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  Store,
  Printer,
  Users,
  Database,
  Volume2,
  ShieldCheck,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { StoreSettings, CashierUser } from '../types';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToDemoData,
    exportDatabaseBackup,
    restoreDatabaseBackup,
  } = usePosStore();

  const [activeTab, setActiveTab] = useState<'store' | 'printer' | 'database'>('store');
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [restoreJson, setRestoreJson] = useState<string>('');
  const [restoreModalOpen, setRestoreModalOpen] = useState<boolean>(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSuccessMsg('Settings updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `supermarket_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreBackup = () => {
    if (!restoreJson.trim()) return;
    const success = restoreDatabaseBackup(restoreJson.trim());
    if (success) {
      setRestoreModalOpen(false);
      setRestoreJson('');
      setSuccessMsg('Database restored successfully from JSON backup!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert('Invalid backup JSON format. Please verify file.');
    }
  };

  const handleResetDemo = () => {
    resetToDemoData();
    setResetConfirmOpen(false);
    setSuccessMsg('Database reset to enterprise demo baseline!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Top Header & Settings Tabs */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>Supermarket System Configuration & Settings</span>
            </h3>
            <p className="text-xs text-slate-400">
              Manage store profile, GST taxes, thermal printer sizing, staff PINs, and database backups
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'store', label: 'Store & GST', icon: Store },
              { id: 'printer', label: 'Receipt & Thermal', icon: Printer },
              { id: 'database', label: 'Backup & Restore', icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Tab 1: Store & GST Settings */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Supermarket Identity & Tax Registration
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supermarket / Store Name *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Tagline / Slogan</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Address Line</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City & State</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Care Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Tax Registration Number</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">FSSAI License Number</label>
              <input
                type="text"
                value={formData.fssaiNumber}
                onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-700"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Store Details</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Printer & Receipt Settings */}
      {activeTab === 'printer' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white">Full Visual Bill Print & Format Designer</h4>
                <p className="text-xs text-blue-200 mt-0.5">Customize live columns, typography, GST tables, barcodes & UPI QR codes</p>
              </div>
            </div>
            <Link
              to="/bill-print"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-extrabold rounded-xl transition-colors shadow-md flex items-center gap-1.5 whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Open Bill Designer</span>
            </Link>
          </div>

          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Thermal ESC/POS Printer & Quick Defaults
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default Thermal Paper Width</label>
              <select
                value={formData.thermalPaperSize}
                onChange={(e) => setFormData({ ...formData, thermalPaperSize: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
              >
                <option value="58mm">58 mm (Compact Thermal POS)</option>
                <option value="80mm">80 mm (Standard Enterprise POS)</option>
                <option value="A4">A4 Full Sheet (Laser Printer)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tax Display Mode</label>
              <select
                value={formData.taxInclusive ? 'inclusive' : 'exclusive'}
                onChange={(e) => setFormData({ ...formData, taxInclusive: e.target.value === 'inclusive' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
              >
                <option value="inclusive">Prices are Inclusive of GST (Standard Retail)</option>
                <option value="exclusive">Add GST Extra at Checkout (Wholesale B2B)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sound FX Audio Chimes</label>
              <select
                value={formData.soundEnabled ? 'enabled' : 'disabled'}
                onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.value === 'enabled' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
              >
                <option value="enabled">Enabled (Audio feedback on scan & payment)</option>
                <option value="disabled">Disabled (Silent POS)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Header Text</label>
              <textarea
                rows={2}
                value={formData.receiptHeader}
                onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Footer Note</label>
              <textarea
                rows={2}
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Return & Exchange Policy</label>
              <textarea
                rows={2}
                value={formData.returnPolicy}
                onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Printer & Receipt Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Backup & Restore */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Database Maintenance & State Management
            </h4>
            <p className="text-xs text-slate-400">
              Export comprehensive JSON snapshots of all products, orders, customers, and store configurations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export JSON Card */}
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2">
                  <Download className="w-5 h-5" />
                </div>
                <h5 className="font-bold text-sm text-blue-950">Export JSON Backup</h5>
                <p className="text-xs text-slate-600 mt-1">
                  Download full database snapshot file to secure offsite storage.
                </p>
              </div>

              <button
                onClick={handleDownloadBackup}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                Download Snapshot (.json)
              </button>
            </div>

            {/* Restore JSON Card */}
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <h5 className="font-bold text-sm text-emerald-950">Restore from JSON</h5>
                <p className="text-xs text-slate-600 mt-1">
                  Restore previously exported database snapshot into current session.
                </p>
              </div>

              <button
                onClick={() => setRestoreModalOpen(true)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                Restore Database
              </button>
            </div>

            {/* Reset to Master Catalog Card */}
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h5 className="font-bold text-sm text-amber-950">Reset to Master Catalog</h5>
                <p className="text-xs text-slate-600 mt-1">
                  Reload 8,914 Kalaasagar supermarket SKUs and reset registers for clean live billing.
                </p>
              </div>

              <button
                onClick={() => setResetConfirmOpen(true)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Reset Database
              </button>
            </div>
          </div>

          {/* Restore JSON Modal */}
          {restoreModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200">
                <h4 className="font-bold text-sm text-slate-900 mb-2">Paste JSON Backup Data</h4>
                <textarea
                  rows={8}
                  value={restoreJson}
                  onChange={(e) => setRestoreJson(e.target.value)}
                  placeholder="Paste contents of exported .json file here..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />

                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => setRestoreModalOpen(false)}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRestoreBackup}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    Confirm Restore
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reset Confirmation Modal */}
          {resetConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Reset to Master Catalog?</h4>
                <p className="text-xs text-slate-500 mb-4">
                  This will reload the full 8,914 Kalaasagar product catalog, suppliers, customers, and initialize fresh registers for live billing.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setResetConfirmOpen(false)}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetDemo}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
