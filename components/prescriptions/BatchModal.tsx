"use client"

import { useState } from "react"
import { FiX } from "react-icons/fi"

const batches = [
  { id: "B2025-01", qty: 150, expiry: "2025-12-31", mrp: 18.50, location: "Aisle 3, Rack 2", recommended: true },
  { id: "B2025-02", qty: 200, expiry: "2025-10-31", mrp: 18.20, location: "Aisle 3, Rack 2" },
  { id: "B2024-33", qty: 50, expiry: "2024-11-30", mrp: 17.90, location: "Store Room" },
]

export default function BatchModal({ onClose }: { onClose: () => void }) {
  const [selectedBatch, setSelectedBatch] = useState("B2025-01")
  const [autoSelect, setAutoSelect] = useState(true)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Select Batch for Atorvastatin 10mg</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <FiX className="text-gray-500" size={22} />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-end mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={autoSelect} onChange={e => setAutoSelect(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
              Auto-select best batch (FEFO)
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map(batch => (
              <div
                key={batch.id}
                onClick={() => setSelectedBatch(batch.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedBatch === batch.id ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50' : 'border-gray-200 hover:border-gray-400'}`}
              >
                {batch.recommended && <div className="text-xs font-bold text-green-600 mb-1">Recommended</div>}
                <div className="font-semibold text-gray-800">Batch #{batch.id}</div>
                <div className="text-sm text-gray-600 mt-2">Qty: <span className="font-medium text-gray-800">{batch.qty}</span></div>
                <div className="text-sm text-gray-600">Expiry: <span className={`font-medium ${new Date(batch.expiry) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>{batch.expiry}</span></div>
                <div className="text-sm text-gray-600">MRP: <span className="font-medium text-gray-800">${batch.mrp.toFixed(2)}</span></div>
                <div className="text-sm text-gray-600">Location: <span className="font-medium text-gray-800">{batch.location}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={onClose} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Select Batch</button>
        </div>
      </div>
    </div>
  )
}