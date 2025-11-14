"use client";
import { FiDownload, FiPrinter, FiVolume2, FiPlus } from "react-icons/fi";
import { MdQrCode2 } from "react-icons/md";

export default function QRSetupTab() {
  return (
    <div className="max-w-6xl space-y-6">
      {/* Active QR Codes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Active QR Codes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "BharatPe Static QR", upi: "hope.pahalgam@paytm", type: "Static", provider: "BharatPe" },
            { name: "PhonePe Business QR", upi: "hoperx@ybl", type: "Static", provider: "PhonePe" },
            { name: "Razorpay Dynamic QR", upi: "razorpay@icici", type: "Dynamic", provider: "Razorpay" },
          ].map((qr, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-center w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-lg">
                <MdQrCode2 size={80} className="text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-900 text-center mb-2">{qr.name}</h4>
              <div className="text-xs text-gray-600 text-center mb-1">{qr.upi}</div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{qr.type}</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{qr.provider}</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
                  <FiDownload size={14} />
                  PDF
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
                  <FiPrinter size={14} />
                  Print
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate New QR */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New QR Code</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
            <input
              type="text"
              defaultValue="HopeRx Pharmacy - Pahalgam"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
            <input
              type="text"
              defaultValue="hoperx.pahalgam@paytm"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
            <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option>Razorpay (Dynamic)</option>
              <option>BharatPe (Static)</option>
              <option>PhonePe (Static)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (Optional)</label>
            <input
              type="number"
              placeholder="Leave empty for any amount"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
          <FiPlus size={18} />
          Generate QR Code
        </button>
      </div>

      {/* Smart UPI Features */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart UPI Features</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <div>
              <div className="text-sm font-medium text-gray-900">Auto-receipt via WhatsApp/SMS</div>
              <div className="text-xs text-gray-500">Send receipt automatically after UPI payment</div>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <div>
              <div className="text-sm font-medium text-gray-900">Auto-map payment to POS sale</div>
              <div className="text-xs text-gray-500">Automatically link UPI payments to invoices</div>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4" />
            <div>
              <div className="text-sm font-medium text-gray-900">Fallback QR (if primary down)</div>
              <div className="text-xs text-gray-500">Switch to backup QR during downtime</div>
            </div>
          </label>
        </div>
      </div>

      {/* SoundBox Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">SoundBox Status</h3>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Connected</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Device</div>
            <div className="font-medium text-gray-900">BharatPe SoundBox Pro</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Battery</div>
            <div className="font-medium text-green-600">87%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Volume</div>
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="100" defaultValue="75" className="flex-1" />
              <FiVolume2 size={16} className="text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
