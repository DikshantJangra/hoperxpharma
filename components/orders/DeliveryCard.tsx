'use client';

import React from 'react';
import { MdLocationOn, MdCalendarToday } from 'react-icons/md';

interface DeliveryCardProps {
  storeAddress: string;
  deliveryDate: string;
  notes: string;
  onDeliveryDateChange: (date: string) => void;
  onNotesChange: (notes: string) => void;
}

export default function DeliveryCard({
  storeAddress,
  deliveryDate,
  notes,
  onDeliveryDateChange,
  onNotesChange,
}: DeliveryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
          <MdLocationOn className="h-4 w-4" />
          Delivery Details
        </h3>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
          Fixed - Store Address
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Delivery Address
          </label>
          <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-700 min-h-[60px] flex items-center">
            {storeAddress || 'Loading store address...'}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            📍 Medicines will be delivered to your registered store address.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
            <MdCalendarToday className="h-3 w-3" />
            Expected Delivery Date
          </label>
          <input
            type="date"
            value={deliveryDate ? deliveryDate.split('T')[0] : ''}
            onChange={(e) => onDeliveryDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Special Instructions (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            placeholder="Add any special delivery instructions..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}