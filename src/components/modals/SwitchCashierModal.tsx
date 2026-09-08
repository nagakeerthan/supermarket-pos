import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';

interface SwitchCashierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwitchCashierModal: React.FC<SwitchCashierModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { cashiers, currentCashier, switchCashier } = usePosStore();
  const [selectedCashierId, setSelectedCashierId] = useState<string>(currentCashier.id);
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter the password / PIN');
      return;
    }

    const success = switchCashier(selectedCashierId, pin.trim());
    if (success) {
      setError('');
      setPin('');
      onClose();
    } else {
      setError('Invalid password / PIN for the selected staff profile.');
    }
  };

  const handleQuickNum = (num: string) => {
    setPin((prev) => prev + num);
    setError('');
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-600/30 border border-emerald-400/30">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-base">Cashier Register Lock</h3>
                <p className="text-xs text-slate-300">Select user profile and authenticate</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSwitch} className="p-5 space-y-4">
            {/* User selector list */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Active Staff Profile
              </label>
              <div className="grid grid-cols-2 gap-2">
                {cashiers.map((c) => {
                  const isSelected = c.id === selectedCashierId;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => {
                        setSelectedCashierId(c.id);
                        setError('');
                        setPin('');
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-600'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {c.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          {c.role}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password / PIN input field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password / Security PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter password or PIN"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Numeric Keypad for touch / fast numeric entry */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => (
                <button
                  type="button"
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') setPin('');
                    else if (btn === '⌫') handleBackspace();
                    else handleQuickNum(btn);
                  }}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-blue-600 active:text-white font-bold text-sm text-slate-800 transition-colors shadow-xs cursor-pointer"
                >
                  {btn}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                Unlock & Switch
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
