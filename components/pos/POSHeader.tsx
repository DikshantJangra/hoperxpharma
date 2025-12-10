'use client';
import { useState, useEffect } from 'react';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';

export default function POSHeader({ saleId, onOpenCustomer, onOpenPrescription, activePrescription, invoiceNumber, setInvoiceNumber }: any) {
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [tempInvoiceNumber, setTempInvoiceNumber] = useState('');

  useEffect(() => {
    if (invoiceNumber) {
      setTempInvoiceNumber(invoiceNumber);
    }
  }, [invoiceNumber]);

  const handleSaveInvoice = () => {
    if (tempInvoiceNumber.trim()) {
      setInvoiceNumber(tempInvoiceNumber.trim());
    }
    setIsEditingInvoice(false);
  };

  const handleCancelEdit = () => {
    setTempInvoiceNumber(invoiceNumber);
    setIsEditingInvoice(false);
  };

  return (
    <div className="bg-white border-b border-[#e2e8f0] px-6 py-3 flex items-center justify-between shadow-sm z-10 relative">
      <div className="flex items-center gap-4">
        {/* Branch / Context */}
        {activePrescription ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg shadow-sm animate-in fade-in">
            <span className="text-xs font-medium opacity-80 uppercase tracking-wide">Dispensing For</span>
            <span className="text-sm font-bold">{activePrescription.patient?.firstName} {activePrescription.patient?.lastName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
            <span className="text-[#0ea5a3]">POS</span>
            <span className="text-gray-300">|</span>
            <span>New Sale</span>
          </div>
        )}

        {/* Sync Status - subtle */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 border border-gray-100" title={syncStatus === 'synced' ? 'All changes saved' : 'Syncing...'}>
          <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-[#10b981]' :
            syncStatus === 'syncing' ? 'bg-[#f59e0b] animate-pulse' :
              'bg-[#ef4444]'
            }`} />
          <span className="text-xs font-medium text-[#64748b]">
            {syncStatus === 'synced' ? 'Online' : 'Offline'}
          </span>
        </div>

        <button
          onClick={onOpenPrescription}
          className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-200 uppercase tracking-wide"
          title="Import Verified Prescription (F6)"
        >
          <span>Import Rx</span>
          <kbd className="hidden sm:inline-block px-1 py-0.5 bg-white rounded border border-blue-200 text-[10px] font-mono">F6</kbd>
        </button>
      </div>

      <div className="flex items-center">
        <div className="text-right mr-4 border-r border-gray-200 pr-4">
          <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Invoice No.</div>

          {isEditingInvoice ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempInvoiceNumber}
                onChange={(e) => setTempInvoiceNumber(e.target.value)}
                className="w-32 px-1 py-0.5 text-sm font-mono border border-gray-300 rounded focus:border-teal-500 focus:outline-none"
                autoFocus
              />
              <button onClick={handleSaveInvoice} className="p-1 text-green-600 hover:bg-green-50 rounded"><FiCheck size={14} /></button>
              <button onClick={handleCancelEdit} className="p-1 text-red-500 hover:bg-red-50 rounded"><FiX size={14} /></button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 group">
              <div className="text-sm font-mono font-bold text-gray-700 tracking-tight">#{invoiceNumber || saleId}</div>
              <button
                onClick={() => setIsEditingInvoice(true)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-teal-600 transition-all"
                title="Edit Invoice Number"
              >
                <FiEdit2 size={12} />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 cursor-help transition-colors" title="Shortcuts: Shift + ?">
          <span className="font-bold text-sm">?</span>
        </div>
      </div>
    </div>
  );
}
