import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F1', desc: 'Focus Product Search box', context: 'Billing / Global' },
    { key: 'F2', desc: 'Focus Hardware Barcode Scanner Buffer', context: 'Billing' },
    { key: 'F4', desc: 'Clear Current Cart / Cancel Order', context: 'Billing' },
    { key: 'F8', desc: 'Hold Current Cart / View Held Bills', context: 'Billing' },
    { key: 'F9', desc: 'Attach Customer / Loyalty Lookup', context: 'Billing' },
    { key: 'F10 or ?', desc: 'Open this Keyboard Shortcuts cheat-sheet', context: 'Global' },
    { key: 'F12 / Space', desc: 'Quick Checkout & Open Payment Tender', context: 'Billing' },
    { key: 'Enter', desc: 'Add selected item or Confirm dialog', context: 'Forms & Lists' },
    { key: 'Esc', desc: 'Close any active modal / clear selection', context: 'Global' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30">
                <Keyboard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-base">POS Keyboard Shortcuts</h3>
                <p className="text-xs text-slate-300">Fast cashier hotkeys for high-speed counter billing</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Table */}
          <div className="p-5 max-h-[70vh] overflow-y-auto space-y-2.5">
            {shortcuts.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <kbd className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 shadow-sm font-mono font-bold text-xs text-slate-800 min-w-[65px] text-center">
                    {s.key}
                  </kbd>
                  <span className="text-xs font-semibold text-slate-800">{s.desc}</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                  {s.context}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Command className="w-3.5 h-3.5" /> Hardware USB scanners trigger instantly without focus.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors"
            >
              Got it (Esc)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
