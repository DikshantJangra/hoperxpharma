"use client"

import { useState } from "react"
import { FiX, FiPrinter } from "react-icons/fi"

export default function LabelModal({ onClose }: { onClose: () => void }) {
  const [template, setTemplate] = useState("default")

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Print Label</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <FiX className="text-gray-500" size={22} />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">Label Template</label>
            <select
              id="template"
              value={template}
              onChange={e => setTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Default (50mm x 25mm)</option>
              <option value="large">Large (70mm x 35mm)</option>
              <option value="hindi">Hindi (50mm x 25mm)</option>
            </select>
          </div>

          <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
            <h4 className="font-semibold text-gray-800">HopeRx Pharmacy</h4>
            <p className="text-xs text-gray-600">123 Health St, Wellness City</p>
            <hr className="my-2" />
            <div className="text-left text-sm">
              <p><strong>Patient:</strong> Anoop Jangra</p>
              <p><strong>Rx#:</strong> 123456</p>
              <p className="mt-2"><strong>Atorvastatin 10mg</strong></p>
              <p className="font-bold">Take 1 tablet daily at bedtime</p>
              <p className="text-xs mt-1">Qty: 30 | Refills: 2</p>
              <p className="text-xs">Dr. Patel</p>
            </div>
            <div className="mt-2 flex justify-center">
              {/* Placeholder for barcode */}
              <svg className="w-32 h-8">
                <rect width="100%" height="100%" fill="#f0f0f0" />
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-xs">BARCODE</text>
              </svg>
            </div>
          </div>
        </div>
        <div className="p-5 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={() => { alert('Printing...'); onClose(); }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
            <FiPrinter size={16} /> Print
          </button>
        </div>
      </div>
    </div>
  )
}