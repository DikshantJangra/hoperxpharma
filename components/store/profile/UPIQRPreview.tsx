'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface UPIQRPreviewProps {
    upiId: string;
    amount?: number;
    storeName?: string;
}

export default function UPIQRPreview({ upiId, amount = 100, storeName = 'Store' }: UPIQRPreviewProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!upiId) {
            setQrDataUrl('');
            setError('');
            return;
        }

        // Generate UPI payment string
        const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(storeName)}&am=${amount}&cu=INR&tn=Invoice%20Payment`;

        // Generate QR code
        QRCode.toDataURL(upiString, {
            width: 200,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        })
            .then(url => {
                setQrDataUrl(url);
                setError('');
            })
            .catch(err => {
                console.error('QR generation error:', err);
                setError('Failed to generate QR code');
                setQrDataUrl('');
            });
    }, [upiId, amount, storeName]);

    if (!upiId) {
        return (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-500">Enter UPI ID to preview QR code</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-48 bg-red-50 rounded-xl border-2 border-dashed border-red-300">
                <p className="text-sm text-red-600">{error}</p>
            </div>
        );
    }

    if (!qrDataUrl) {
        return (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col items-center">
                <img src={qrDataUrl} alt="UPI QR Code" className="w-48 h-48" />
                <div className="mt-3 text-center">
                    <p className="text-xs font-medium text-gray-700">Scan to pay ₹{amount}</p>
                    <p className="text-xs text-gray-500 mt-1">{upiId}</p>
                </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                    <strong>Preview:</strong> This QR code will appear on invoices with the actual bill amount.
                </p>
            </div>
        </div>
    );
}
