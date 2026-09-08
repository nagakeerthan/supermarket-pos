import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Sliders,
  Settings,
} from 'lucide-react';
import { Order } from '../../types';
import { usePosStore } from '../../store/usePosStore';
import { generateInvoicePdf } from '../../utils/pdfExport';
import { BillReceiptView } from '../common/BillReceiptView';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { settings, billFormat } = usePosStore();
  const [paperFormat, setPaperFormat] = useState<'58mm' | '80mm' | 'A4'>(
    billFormat?.paperSize || settings.thermalPaperSize || '80mm'
  );

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateInvoicePdf(order, settings, billFormat);
  };

  const handleCustomizeFormat = () => {
    onClose();
    navigate('/bill-print');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
        {/* Isolated Print Style for Receipt Modal */}
        <style>{`
          @media print {
            @page {
              margin: 0 !important;
              size: auto;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-receipt,
            #printable-receipt * {
              visibility: visible !important;
            }
            #printable-receipt {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: ${paperFormat === '58mm' ? '58mm' : paperFormat === '80mm' ? '80mm' : '100%'} !important;
              margin: 0 !important;
              padding-top: 1mm !important;
              padding-bottom: 2mm !important;
              padding-left: ${paperFormat === '58mm' ? '1mm' : '2mm'} !important;
              padding-right: ${paperFormat === '58mm' ? '1mm' : '2mm'} !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
              color: black !important;
            }
          }
        `}</style>

        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Top Bar */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Bill Generated: {order.invoiceNumber}</h3>
                <p className="text-[11px] text-slate-300">
                  {order.totalQuantity} items • Net Total:{' '}
                  {billFormat?.customCurrencySymbol || settings.currencySymbol || '₹'}
                  {order.grandTotal.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Paper Size selector */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                {(['58mm', '80mm', 'A4'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setPaperFormat(fmt)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      paperFormat === fmt
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Close receipt window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Receipt Viewport (Scrollable with Thermal Paper Preview using Custom Bill Format) */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-200 flex justify-center items-start">
            <BillReceiptView
              order={order}
              config={billFormat}
              settings={settings}
              paperSizeOverride={paperFormat}
              containerId="printable-receipt"
              isLiveEditMode={false}
            />
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                + New Sale (Esc)
              </button>

              <button
                onClick={handleCustomizeFormat}
                className="px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open Bill Format Designer to customize layout, text, totals, or charges"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Customize Format ⚙️</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                className="px-4 py-2.5 rounded-xl border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>PDF Download</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt (Ctrl+P)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
