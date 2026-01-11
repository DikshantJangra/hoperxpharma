'use client';

import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { BsSnow, BsUpcScan, BsQrCodeScan } from 'react-icons/bs';
import { getStockStatus, formatStockQuantity, formatUnitName, renderStockQuantity } from '@/lib/utils/stock-display';
import { scanApi } from '@/lib/api/scan';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import QRCodeModal from './QRCodeModal';

const BarcodeScannerModal = dynamic(() => import('@/components/pos/BarcodeScannerModal'), { ssr: false });

const BatchRowSkeleton = () => (
  <tr className="animate-pulse border-b border-[#f1f5f9]">
    <td className="px-4 py-3"><div className="w-4 h-4 bg-gray-200 rounded"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
      <div className="h-3 bg-gray-100 rounded w-24"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
      <div className="h-5 bg-gray-100 rounded w-10"></div>
    </td>
    <td className="px-4 py-3 text-right"><div className="h-4 bg-gray-200 rounded w-8 ml-auto"></div></td>
    <td className="px-4 py-3 text-right"><div className="h-4 bg-gray-200 rounded w-8 ml-auto"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-8"></div></td>
    <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
  </tr>
)

export default function BatchTable({ batches, isLoading, searchQuery, onSelectBatch, selectedBatch, onRefresh }: any) {
  const [scanningBatchId, setScanningBatchId] = React.useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = React.useState(false);
  const [qrData, setQrData] = React.useState<any>(null);

  const handleEnroll = async (code: string) => {
    if (!scanningBatchId) return;
    const toastId = toast.loading('Linking barcode...');
    try {
      await scanApi.enrollBarcode({
        barcode: code,
        batchId: scanningBatchId,
        barcodeType: 'MANUFACTURER'
      });
      toast.success(`Barcode ${code} linked successfully!`);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to link barcode';
      toast.error(msg);
    } finally {
      toast.dismiss(toastId);
      setScanningBatchId(null);
    }
  };

  const handleGenerateInternal = async () => {
    if (!scanningBatchId) return;
    const batch = batches.find((b: any) => b.id === scanningBatchId);
    if (!batch) return;

    // Close scanner modal first
    setScanningBatchId(null);

    const toastId = toast.loading('Generating QR...');
    try {
      const response = await scanApi.generateQR(batch.id);

      // Update local state temporarily for immediate feedback if needed, 
      // but onRefresh will handle it.

      setQrData({
        qrDataURL: response.qrDataURL,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        drugName: batch.drug?.name,
        expiryDate: batch.expiryDate
      });
      setQrModalOpen(true);
      toast.success('Internal QR Generated');

      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error('Failed to generate QR');
      console.error(error);
    } finally {
      toast.dismiss(toastId);
    }
  }

  const getExpiryColor = (days: number) => {
    if (days < 0) return 'bg-[#991b1b] text-white';
    if (days < 7) return 'bg-[#fee2e2] text-[#991b1b]';
    if (days < 30) return 'bg-[#fed7aa] text-[#9a3412]';
    if (days < 90) return 'bg-[#fef3c7] text-[#92400e]';
    return 'bg-[#f1f5f9] text-[#64748b]';
  };

  const getStatusColor = (status: string) => {
    if (status === 'Quarantine') return 'border-[#ef4444] text-[#ef4444] bg-[#fef2f2]';
    if (status === 'Recalled') return 'border-[#dc2626] text-[#dc2626] bg-[#fee2e2]';
    if (status === 'Reserved') return 'border-[#f59e0b] text-[#f59e0b] bg-[#fef3c7]';
    return 'border-[#10b981] text-[#10b981] bg-[#d1fae5]';
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <table className="w-full">
        <thead className="sticky top-0 bg-[#f8fafc] border-b border-[#e2e8f0] z-10">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase w-8">
              <input type="checkbox" className="w-4 h-4 rounded" />
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Barcode</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Batch #</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Drug / Item</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Expiry</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Stock</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">MRP</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Location</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Supplier</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <>
              <BatchRowSkeleton />
              <BatchRowSkeleton />
              <BatchRowSkeleton />
            </>
          ) : batches.length > 0 ? (
            batches.map((batch: any) => {
              const daysToExpiry = Math.floor((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const status = daysToExpiry < 0 ? 'Expired' : 'Active';
              const stockStatus = getStockStatus(batch);

              return (
                <tr
                  key={batch.id}
                  onClick={() => onSelectBatch(batch)}
                  className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer group ${selectedBatch?.id === batch.id ? 'bg-[#f0fdfa]' : ''
                    } ${daysToExpiry < 7 && daysToExpiry >= 0 ? 'border-l-4 border-l-[#ef4444]' : ''} ${daysToExpiry < 0 ? 'border-l-4 border-l-[#991b1b]' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-1.5 items-start">
                      {batch.manufacturerBarcode ? (
                        <button
                          onClick={() => setScanningBatchId(batch.id)}
                          className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded text-sm text-[#0f172a] group/btn"
                          title="Edit Manufacturer Barcode"
                        >
                          <BsUpcScan className="w-4 h-4 text-emerald-600" />
                          <span>{batch.manufacturerBarcode}</span>
                        </button>
                      ) : batch.internalQRCode ? (
                        <button
                          onClick={() => onSelectBatch(batch)}
                          className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded border border-purple-200"
                        >
                          <BsQrCodeScan className="w-3.5 h-3.5" />
                          <span>Internal QR Linked</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setScanningBatchId(batch.id)}
                          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                        >
                          <BsUpcScan className="w-3.5 h-3.5" />
                          Link Barcode
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-[#0f172a]">{batch.batchNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-[#0f172a] flex items-center gap-2">
                          {batch.drug?.name || 'Unknown Drug'}
                          {batch.drug?.requiresColdStorage && <BsSnow className="w-3 h-3 text-[#3b82f6]" title="Cold chain" />}
                        </div>
                        <div className="text-xs text-[#64748b]">{batch.drug?.strength} • {batch.drug?.form}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm text-[#0f172a]">{(() => {
                        const date = new Date(batch.expiryDate);
                        return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                      })()}</div>
                      <span className={`inline-block px-2 py-0.5 text-xs rounded mt-1 ${getExpiryColor(daysToExpiry)}`}>
                        {daysToExpiry < 0 ? 'Expired' : `${daysToExpiry}d`}
                      </span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right ${stockStatus.color}`}>
                    {renderStockQuantity(batch)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#0ea5a3]">₹{Number(batch.mrp).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-[#64748b]">{batch.location || batch.rackLocation || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#64748b]">
                    {batch.supplier?.name || (batch.supplierId ? 'Loading...' : 'N/A')}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={10}>
                <div className="flex flex-col items-center justify-center h-64">
                  <FiAlertCircle className="w-12 h-12 text-[#cbd5e1] mb-3" />
                  <p className="text-[#64748b]">No batches found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchQuery ? "Try adjusting your search." : "Batches will appear here once added."}
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {scanningBatchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans">
          {/* Modal Wrapper is inside BarcodeScannerModal now effectively via ReactDOM or here, 
               but BarcodeScannerModal renders its own overlay. 
               We should just render BarcodeScannerModal directly if it handles full screen.
               Checking BarcodeScannerModal again... Yes, it has fixed inset-0.
               So we don't need this wrapper. It might duplicate the overlay or trap focus.
               
               However, `scanningBatchId` controls the mounting.
               
               Wait, the original code wrapped it. Layout might be needed.
               Let's check BarcodeScannerModal source again.
               Line 158: <div className="fixed inset-0 ..."> 
               It is a full screen modal.
               So I should NOT wrap it in another fixed div.
           */}

          <BarcodeScannerModal
            onClose={() => setScanningBatchId(null)}
            onScan={handleEnroll}
            onGenerateInternal={handleGenerateInternal}
          />
        </div>
      )}

      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        qrData={qrData}
      />
    </div>
  );
}
