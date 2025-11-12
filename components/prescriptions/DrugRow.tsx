"use client"

import { useState } from "react"
import { FiAlertTriangle, FiChevronDown, FiMoreVertical } from "react-icons/fi"
import { Drug } from "@/types/prescription"

interface DrugRowProps {
  drug: Drug
  onPickBatch: () => void
}

export default function DrugRow({ drug, onPickBatch }: DrugRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [qtyToDispense, setQtyToDispense] = useState(drug.qtyToDispense)

  const statusStyles = {
    "in-stock": "bg-green-100 text-green-700",
    "partial": "bg-yellow-100 text-yellow-700",
    "out-of-stock": "bg-red-100 text-red-700",
  }

  return (
    <div className={`p-4 rounded-lg transition-all ${isExpanded ? 'bg-gray-50 shadow-md' : 'hover:bg-gray-50'}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{drug.name} <span className="text-gray-500 font-normal">{drug.strength} {drug.form}</span></div>
          <div className="text-sm text-gray-600 mt-1">{drug.sig}</div>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div>
              <label className="text-xs text-gray-500">Prescribed</label>
              <div className="font-medium">{drug.qtyPrescribed}</div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Dispensing</label>
              <input
                type="number"
                value={qtyToDispense}
                onChange={(e) => setQtyToDispense(parseInt(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Days</label>
              <div className="font-medium">{drug.daysSupply}</div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[drug.status]}`}>{drug.status.replace('-', ' ')}</div>
          <button onClick={onPickBatch} className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            Batch: {drug.batchId}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-gray-200 rounded-full">
            <FiChevronDown className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          <div className="relative">
            <button className="p-2 hover:bg-gray-200 rounded-full"><FiMoreVertical /></button>
            {/* Dropdown for actions: Substitute, Add note, Hold, Delete */}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Details</h5>
              <div className="flex justify-between"><span className="text-gray-500">Price</span><span>${drug.price.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">GST</span><span>${drug.gst.toFixed(2)}</span></div>
              <div className="flex justify-between mt-1 pt-1 border-t"><span className="text-gray-500 font-medium">Total</span><span className="font-semibold">${(drug.price + drug.gst).toFixed(2)}</span></div>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">History & Suggestions</h5>
              <div className="text-gray-500">Last dispensed: <span className="text-gray-800 font-medium">3 months ago</span></div>
              <button className="mt-2 text-blue-600 hover:text-blue-700 font-medium">Suggest Generic Alternative</button>
            </div>
          </div>
          {drug.interactions && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <FiAlertTriangle className="text-amber-600 mt-0.5" size={16} />
              <div>
                <div className="text-sm font-medium text-amber-900">Interaction Warning</div>
                <div className="text-xs text-amber-700">{drug.interactions.join(", ")}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}