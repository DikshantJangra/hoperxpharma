'use client';

import React from 'react';
import { MdLocationOn, MdCalendarToday } from 'react-icons/md';

interface DeliveryAddress {
  line1: string;
  city: string;
  pin: string;
}

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
  const handleAddressChange = (field: keyof DeliveryAddress, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      value={expectedDate ? expectedDate.split('T')[0] : ''}
      onChange={(e) => onDateChange(e.target.value)}
      min={new Date().toISOString().split('T')[0]}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
    </div>
      </div >
    </div >
  );
}