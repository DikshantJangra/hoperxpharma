import { useState, useRef, useEffect } from 'react';
import { FiX, FiPrinter, FiDownload, FiCopy } from 'react-icons/fi';
import { toast } from 'sonner';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrData: {
        qrDataURL: string;
        batchId: string;
        batchNumber: string;
        drugName: string;
        expiryDate?: string;
    };
}

export default function QRCodeModal({ isOpen, onClose, qrData }: QRCodeModalProps) {
    const [isPrinting, setIsPrinting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !qrData) return null;

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            const printContent = printRef.current?.innerHTML;
            const originalContents = document.body.innerHTML;

            if (printContent) {
                // Create a hidden iframe for printing to avoid messing with current page styles 
                // or just use a simple window print approach with print-specific CSS

                // Simple approach: Add a print-only style block
                const style = document.createElement('style');
                style.innerHTML = `
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #print-section, #print-section * {
                            visibility: visible;
                        }
                        #print-section {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        @page {
                            size: 2in 1in; /* Standard small label size */
                            margin: 0;
                        }
                    }
                `;
                document.head.appendChild(style);

                window.print();

                // Cleanup
                document.head.removeChild(style);
                setIsPrinting(false);
            }
        }, 100);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = qrData.qrDataURL;
        link.download = `QR-${qrData.batchNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR Code downloaded');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-800">Internal Batch QR</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col items-center space-y-6">
                    {/* Visual Preview Card */}
                    <div
                        id="print-section"
                        ref={printRef}
                        className="w-full bg-white border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-row items-center gap-4"
                    >
                        {/* QR Code */}
                        <div className="shrink-0">
                            <img
                                src={qrData.qrDataURL}
                                alt="Batch QR"
                                className="w-24 h-24 object-contain"
                            />
                        </div>

                        {/* Label Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                            <h4 className="font-bold text-sm text-gray-900 truncate leading-tight mb-1">
                                {qrData.drugName}
                            </h4>
                            <div className="text-[10px] text-gray-600 space-y-0.5">
                                <p><span className="font-semibold">Batch:</span> {qrData.batchNumber}</p>
                                {qrData.expiryDate && (
                                    <p><span className="font-semibold">Exp:</span> {new Date(qrData.expiryDate).toLocaleDateString()}</p>
                                )}
                                <p className="text-[8px] text-gray-400 mt-1">HopeRx Internal</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-center text-gray-500 max-w-[200px]">
                        Scan this code at POS or GRN to instantly identify this specific batch.
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <FiPrinter className="w-4 h-4" />
                        Print Label
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                        title="Download Image"
                    >
                        <FiDownload className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
