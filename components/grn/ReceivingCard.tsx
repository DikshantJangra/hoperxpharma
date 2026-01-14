import React, { useState } from 'react';
import { HiChevronDown, HiChevronUp, HiCheck, HiOutlineQrCode, HiOutlineCog } from 'react-icons/hi2';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

interface ReceivingCardProps {
    item: any;
    drugName: string;
    isExpanded: boolean;
    isComplete: boolean;
    inventoryStatus?: any;
    onExpand: () => void;
    onUpdate: (updates: any) => void;
    onScan: () => void;
    onSplit?: () => void;
}

export default function ReceivingCard({
    item,
    drugName,
    isExpanded,
    isComplete,
    inventoryStatus,
    onExpand,
    onUpdate,
    onScan,
    onSplit
}: ReceivingCardProps) {
    const [showPricing, setShowPricing] = useState(false);
    const [showBatchInfo, setShowBatchInfo] = useState(false);
    const [expiryInput, setExpiryInput] = useState('');

    const handleReceivedChange = (value: string) => {
        const qty = value === '' ? 0 : parseInt(value);
        onUpdate({ receivedQty: qty });
    };

    const handleFieldChange = (field: string, value: any) => {
        onUpdate({ [field]: value });
    };

    const isMandatoryComplete = () => {
        return item.receivedQty > 0 && 
               item.batchNumber && 
               item.batchNumber !== 'TBD' && 
               item.expiryDate &&
               item.mrp > 0;
    };

    const getBatchStatusBadge = () => {
        // Force re-render by using item.batchNumber as key dependency
        const key = `${item.id}-${item.batchNumber}-${inventoryStatus?.exists}`;
        
        if (!inventoryStatus) return null;
        
        if (inventoryStatus.exists) {
            const scanned = item.manufacturerBarcode;
            const stored = inventoryStatus.manufacturerBarcode;
            
            if (scanned && stored) {
                if (scanned === stored) {
                    return <span key={key} className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">✓ Verified</span>;
                } else {
                    return <span key={key} className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">⚠ Mismatch</span>;
                }
            }
            return <span key={key} className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Stocked</span>;
        } else if (inventoryStatus.exists === false && item.batchNumber && item.batchNumber !== 'TBD') {
            return <span key={key} className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">New Batch</span>;
        }
        return null;
    };

    return (
        <div 
            className={`
                bg-white rounded-lg border-l-4 transition-all duration-300 relative
                ${isComplete ? 'border-emerald-500 opacity-80' : isExpanded ? 'border-blue-500 shadow-lg' : 'border-gray-300 shadow-sm hover:shadow-md'}
            `}
        >
            {/* Top-Left Sticker Badge */}
            {inventoryStatus?.exists && (
                <div className="absolute -top-2 -left-2 z-20 transform -rotate-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg shadow-lg border-2 border-white">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold">📦 IN STOCK</span>
                            {inventoryStatus.currentStock && (
                                <span className="text-xs font-semibold bg-white/20 px-1.5 py-0.5 rounded">
                                    {inventoryStatus.currentStock} units
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Compact View */}
            <div 
                className={`p-4 cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''}`}
                onClick={onExpand}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            {isComplete && <HiCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">{drugName}</h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                    <span>Ordered: <span className="font-medium">{item.orderedQty}</span></span>
                                    <span>→</span>
                                    <span>Received: <span className={`font-medium ${item.receivedQty > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {item.receivedQty || 0}
                                    </span></span>
                                    {item.freeQty > 0 && (
                                        <span className="text-emerald-600">+{item.freeQty} free</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {getBatchStatusBadge()}
                        {onSplit && !item.isSplit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSplit();
                                }}
                                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Split Batch"
                            >
                                <HiOutlineCog className="w-5 h-5" />
                            </button>
                        )}
                        {isExpanded ? <HiChevronUp className="w-5 h-5 text-gray-400" /> : <HiChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                </div>
            </div>

            {/* Expanded View */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                    {/* Quantities */}
                    <div className="pt-4">
                        <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Quantities</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Received *</label>
                                <input
                                    type="number"
                                    value={item.receivedQty || 0}
                                    onChange={(e) => handleReceivedChange(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Free Qty</label>
                                <input
                                    type="number"
                                    value={item.freeQty || 0}
                                    onChange={(e) => handleFieldChange('freeQty', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Batch Information */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Batch Information</label>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Batch Number *</label>
                                <input
                                    type="text"
                                    value={item.batchNumber || ''}
                                    onChange={(e) => handleFieldChange('batchNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter batch number"
                                />
                            </div>

                            {/* Show QR Code Panel for existing batches */}
                            {inventoryStatus?.exists && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-3">
                                    <button
                                        onClick={() => setShowBatchInfo(!showBatchInfo)}
                                        className="flex items-center justify-between w-full text-sm text-blue-800 font-medium mb-2"
                                    >
                                        <span className="flex items-center gap-1">
                                            <span>📋</span>
                                            <span>Existing Batch Details</span>
                                        </span>
                                        {showBatchInfo ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
                                    </button>

                                    {showBatchInfo && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex gap-3 items-start flex-wrap">
                                                {/* Internal QR Code */}
                                                {(inventoryStatus.internalQR || inventoryStatus.internalQRCode || inventoryStatus.batchId) && (
                                                    <div className="flex flex-col items-center bg-white p-2 rounded border border-gray-200">
                                                        <div className="text-[9px] text-gray-500 mb-1 font-medium">Internal QR</div>
                                                        <QRCodeSVG
                                                            value={inventoryStatus.internalQR || inventoryStatus.internalQRCode || inventoryStatus.batchId || ''}
                                                            size={70}
                                                            className="border p-1"
                                                            level="M"
                                                        />
                                                    </div>
                                                )}

                                                {/* Manufacturer Barcode */}
                                                {inventoryStatus.manufacturerBarcode && (
                                                    <div className="flex-1 min-w-[200px] bg-white p-2 rounded border border-gray-200">
                                                        <div className="text-[9px] text-gray-500 mb-1 font-medium">Manufacturer Barcode</div>
                                                        <div className="font-mono text-xs text-gray-900 mb-1">
                                                            {inventoryStatus.manufacturerBarcode}
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <Barcode
                                                                value={inventoryStatus.manufacturerBarcode}
                                                                width={1.2}
                                                                height={25}
                                                                displayValue={false}
                                                                margin={0}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Batch Details */}
                                            <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2 rounded border border-gray-200">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 font-medium">Location</span>
                                                    <span className="text-gray-900">{inventoryStatus.location || 'Not set'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 font-medium">Current MRP</span>
                                                    <span className="text-gray-900 font-semibold">₹{inventoryStatus.mrp}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 font-medium">Expiry</span>
                                                    <span className="text-gray-900">
                                                        {inventoryStatus.expiry ? new Date(inventoryStatus.expiry).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: '2-digit'
                                                        }) : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 font-medium">Current Stock</span>
                                                    <span className="text-blue-600 font-bold">{inventoryStatus.currentStock} units</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Prompt to link internal QR for existing batches without internal QR */}
                            {inventoryStatus?.exists &&
                                inventoryStatus?.manufacturerBarcode &&
                                !inventoryStatus?.internalQR &&
                                !inventoryStatus?.internalQRCode && (
                                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                        <p className="text-blue-800 font-medium">⚠️ Internal QR Missing</p>
                                        <p className="text-blue-600 text-[10px] mt-1">
                                            This batch has manufacturer barcode but no internal QR. Link will be created upon completion.
                                        </p>
                                    </div>
                                )}

                            {/* Prompt to create QR for new batches */}
                            {inventoryStatus?.exists === false && item.batchNumber && item.batchNumber !== 'TBD' && (
                                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                                    <p className="text-amber-800 font-medium">New batch detected</p>
                                    <p className="text-amber-600 text-[10px] mt-1">
                                        Internal QR code will be generated automatically upon completion
                                    </p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Expiry (MM/YYYY) *</label>
                                    <input
                                        type="text"
                                        value={expiryInput !== '' ? expiryInput : (item.expiryDate ? (() => {
                                            const date = new Date(item.expiryDate);
                                            if (isNaN(date.getTime()) || date.getFullYear() === 1970) return '';
                                            return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                                        })() : '')}
                                        onChange={(e) => {
                                            let value = e.target.value;
                                            
                                            // Auto-format: add slash after 2 digits
                                            if (value.length === 2 && !value.includes('/') && expiryInput.length < 2) {
                                                value = value + '/';
                                            }
                                            
                                            // Only allow valid characters (digits and one slash)
                                            if (!/^[\d\/]*$/.test(value)) return;
                                            if ((value.match(/\//g) || []).length > 1) return;
                                            if (value.length > 7) return;
                                            
                                            setExpiryInput(value);
                                            
                                            // Check if complete MM/YYYY format
                                            if (value.match(/^(0?[1-9]|1[0-2])\/(\d{4})$/)) {
                                                const [month, year] = value.split('/');
                                                const monthNum = parseInt(month);
                                                const yearNum = parseInt(year);
                                                
                                                // Validate year is reasonable (not too far in past or future)
                                                if (yearNum >= 2020 && yearNum <= 2050) {
                                                    const lastDay = new Date(yearNum, monthNum, 0).getDate();
                                                    handleFieldChange('expiryDate', `${year}-${month.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
                                                }
                                            }
                                        }}
                                        onBlur={() => {
                                            // On blur, if we have a valid date saved, clear the input to show formatted value
                                            if (item.expiryDate) {
                                                const date = new Date(item.expiryDate);
                                                if (!isNaN(date.getTime()) && date.getFullYear() !== 1970) {
                                                    setExpiryInput('');
                                                }
                                            }
                                        }}
                                        onFocus={(e) => {
                                            // On focus, if there's a saved date, populate the input for editing
                                            if (item.expiryDate && expiryInput === '') {
                                                const date = new Date(item.expiryDate);
                                                if (!isNaN(date.getTime()) && date.getFullYear() !== 1970) {
                                                    setExpiryInput(`${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`);
                                                    e.target.select();
                                                }
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="MM/YYYY"
                                        maxLength={7}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">MRP *</label>
                                    <input
                                        type="number"
                                        value={item.mrp || 0}
                                        onChange={(e) => handleFieldChange('mrp', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Barcode</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item.manufacturerBarcode || ''}
                                        onChange={(e) => handleFieldChange('manufacturerBarcode', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Scan or enter barcode"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onScan();
                                        }}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <HiOutlineQrCode className="w-5 h-5 text-gray-700" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Details (Collapsed) */}
                    <div>
                        <button
                            onClick={() => setShowPricing(!showPricing)}
                            className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900 py-2"
                        >
                            <span className="font-medium">Pricing & Details (Optional)</span>
                            {showPricing ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
                        </button>
                        {showPricing && (
                            <div className="space-y-3 pt-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Purchase Rate</label>
                                        <input
                                            type="number"
                                            value={item.unitPrice || 0}
                                            onChange={(e) => handleFieldChange('unitPrice', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Discount %</label>
                                        <input
                                            type="number"
                                            value={item.discountPercent || 0}
                                            onChange={(e) => handleFieldChange('discountPercent', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">GST %</label>
                                        <select
                                            value={item.gstPercent || 5}
                                            onChange={(e) => handleFieldChange('gstPercent', parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {[0, 5, 12, 18, 28].map(rate => (
                                                <option key={rate} value={rate}>{rate}%</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Location</label>
                                        <input
                                            type="text"
                                            value={item.location || ''}
                                            onChange={(e) => handleFieldChange('location', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., Rack A-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                        {isMandatoryComplete() ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onExpand(); // This will collapse and move to next
                                }}
                                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <HiCheck className="w-5 h-5" />
                                Mark Complete
                            </button>
                        ) : (
                            <div className="text-sm text-gray-500 text-center py-2">
                                Fill required fields (*) to complete
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
