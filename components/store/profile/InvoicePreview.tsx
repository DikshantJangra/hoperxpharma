import React from "react";
import { FiPrinter } from "react-icons/fi";

interface InvoicePreviewProps {
  profile: any;
}

export default function InvoicePreview({ profile }: InvoicePreviewProps) {
  return (
    <section className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Invoice Preview</h3>
        <FiPrinter className="text-gray-400" size={16} />
      </div>

      {/* Live Preview */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-xs">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {profile?.logoUrl && (
            <img src={profile.logoUrl} alt="Logo" className="w-12 h-12 rounded" />
          )}
          <div className="flex-1">
            <h4 className="font-bold text-sm" style={{ color: profile?.brandColor || "#2563EB" }}>
              {profile?.name || "Store Name"}
            </h4>
            <p className="text-gray-600 text-xs mt-1">
              {profile?.address?.line1 || "Address Line 1"}
            </p>
            <p className="text-gray-600 text-xs">
              {profile?.address?.city || "City"}, {profile?.address?.state || "State"} {profile?.address?.postalCode || "000000"}
            </p>
          </div>
        </div>

        {/* GSTIN */}
        <div className="border-t border-gray-300 pt-2 mb-3">
          <p className="text-gray-600">
            <span className="font-medium">GSTIN:</span> {profile?.gst?.gstin || "00XXXXX0000X0X0"}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Phone:</span> {profile?.primaryContact?.phone || "+91 00000 00000"}
          </p>
        </div>

        {/* Sample Items */}
        <div className="border-t border-gray-300 pt-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Qty</th>
                <th className="text-right py-1">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1">Sample Medicine</td>
                <td className="text-right">2</td>
                <td className="text-right">₹200.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="border-t border-gray-300 mt-2 pt-2">
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>₹200.00</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3">Updates live as you edit</p>
    </section>
  );
}
