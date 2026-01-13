'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiCamera, FiEdit, FiUpload, FiX } from 'react-icons/fi';

export default function QuickAddFAB() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Action Menu */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-2 space-y-2 animate-in slide-in-from-bottom-2">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/inventory/ingest');
              }}
              className="flex items-center gap-3 bg-white shadow-lg rounded-full px-4 py-3 hover:shadow-xl transition-all group w-full"
            >
              <div className="p-2 bg-[#0ea5a3] rounded-full text-white group-hover:scale-110 transition-transform">
                <FiCamera size={20} />
              </div>
              <span className="font-medium text-gray-900 pr-2">Scan Strip</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/inventory/ingest?mode=manual');
              }}
              className="flex items-center gap-3 bg-white shadow-lg rounded-full px-4 py-3 hover:shadow-xl transition-all group w-full"
            >
              <div className="p-2 bg-gray-600 rounded-full text-white group-hover:scale-110 transition-transform">
                <FiEdit size={20} />
              </div>
              <span className="font-medium text-gray-900 pr-2">Manual Entry</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/inventory/import');
              }}
              className="flex items-center gap-3 bg-white shadow-lg rounded-full px-4 py-3 hover:shadow-xl transition-all group w-full"
            >
              <div className="p-2 bg-blue-600 rounded-full text-white group-hover:scale-110 transition-transform">
                <FiUpload size={20} />
              </div>
              <span className="font-medium text-gray-900 pr-2">Bulk Import</span>
            </button>
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-14 h-14 rounded-full shadow-lg flex items-center justify-center
            transition-all duration-200 hover:scale-110
            ${isOpen 
              ? 'bg-gray-600 hover:bg-gray-700' 
              : 'bg-[#0ea5a3] hover:bg-[#0d9491]'
            }
          `}
        >
          {isOpen ? (
            <FiX size={24} className="text-white" />
          ) : (
            <FiPlus size={24} className="text-white" />
          )}
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
        />
      )}
    </>
  );
}
