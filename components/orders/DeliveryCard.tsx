'use client';

import React from 'react';
import { MdLocationOn, MdCalendarToday } from 'react-icons/md';

interface DeliveryAddress {
  line1: string;
  city: string;
  pin: string;
}

interface DeliveryCardProps {
  value: DeliveryAddress;
  expectedDate?: string;
  onChange: (address: DeliveryAddress) => void;
  onDateChange: (date: string) => void;
}

export default function DeliveryCard({ value, expectedDate, onChange, onDateChange }: DeliveryCardProps) {
  const handleAddressChange = (field: keyof DeliveryAddress, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
          <MdLocationOn className="h-4 w-4" />
          Delivery Details
        </h3>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Delivery Address
          </label>
          <input
            type="text"
            placeholder="Street address"
            value={value.line1}
            onChange={(e) => handleAddressChange('line1', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            placeholder="City"
            value={value.city}
            onChange={(e) => handleAddressChange('city', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            PIN Code
          </label>
          <input
            type="text"
            placeholder="PIN"
            value={value.pin}
            onChange={(e) => handleAddressChange('pin', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
            <MdCalendarToday className="h-3 w-3" />
            Expected Delivery Date
          </label>
          <input
            type="date"
            value={expectedDate ? expectedDate.split('T')[0] : ''}
            onChange={(e) => onDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}