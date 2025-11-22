"use client"

import { FiPaperclip, FiMaximize, FiEdit, FiChevronDown } from "react-icons/fi"
import { RiBarcodeLine } from "react-icons/ri"

export default function PrescriptionCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-5 flex gap-5">
        <div className="w-32 flex-shrink-0">
          <div className="relative group bg-gray-100 rounded-lg aspect-[3/4] flex items-center justify-center cursor-pointer">
            <FiPaperclip className="text-gray-400" size={32} />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <FiMaximize className="text-white" size={24} />
            </div>
          </div>
          <div className="text-xs text-center mt-2 text-gray-500">rx_scan_01.jpg</div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-gray-500">Prescription ID: <span className="text-gray-700 font-medium">-</span></div>
              <div className="text-xs text-gray-500 mt-1">Prescriber: <span className="text-gray-700 font-medium">-</span></div>
              <div className="text-xs text-gray-500 mt-1">Repeats: <span className="text-gray-700 font-medium">-</span></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Controlled</span>
              <RiBarcodeLine size={24} className="text-gray-500" />
            </div>
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-gray-800">OCR Data Preview</h4>
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <FiEdit size={12} /> Edit Raw OCR
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <label className="block text-xs text-gray-500">Drug Name</label>
                <input type="text" placeholder="Enter drug name" className="w-full bg-transparent text-gray-900 font-medium focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500">Strength</label>
                  <input type="text" placeholder="Enter strength" className="w-full bg-transparent text-gray-900 font-medium focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Quantity</label>
                  <input type="text" placeholder="Enter quantity" className="w-full bg-transparent text-gray-900 font-medium focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">SIG (Directions)</label>
                <input type="text" placeholder="Enter directions" className="w-full bg-transparent text-gray-900 font-medium focus:outline-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}