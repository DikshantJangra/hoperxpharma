'use client';

import React from 'react';
import { FiFileText, FiDollarSign, FiImage, FiExternalLink } from 'react-icons/fi';

interface RelatedObjectPreviewProps {
  related: {
    type: string;
    id: string;
    path: string;
  };
}

const OBJECT_ICONS = {
  PRESCRIPTION: FiFileText,
  INVOICE: FiDollarSign,
  DOCUMENT: FiImage,
  LAB_RESULT: FiFileText
};

const OBJECT_COLORS = {
  PRESCRIPTION: 'bg-blue-100 text-blue-600',
  INVOICE: 'bg-orange-100 text-orange-600',
  DOCUMENT: 'bg-gray-100 text-gray-600',
  LAB_RESULT: 'bg-purple-100 text-purple-600'
};

export default function RelatedObjectPreview({ related }: RelatedObjectPreviewProps) {
  const Icon = OBJECT_ICONS[related.type as keyof typeof OBJECT_ICONS] || FiFileText;
  const colorClass = OBJECT_COLORS[related.type as keyof typeof OBJECT_COLORS] || 'bg-gray-100 text-gray-600';

  const handleClick = () => {
    // Navigate to related object
    console.log('Navigate to:', related.path);
  };

  const getObjectTitle = () => {
    switch (related.type) {
      case 'PRESCRIPTION':
        return `Prescription ${related.id}`;
      case 'INVOICE':
        return `Invoice ${related.id}`;
      case 'DOCUMENT':
        return `Document ${related.id}`;
      case 'LAB_RESULT':
        return `Lab Result ${related.id}`;
      default:
        return `${related.type} ${related.id}`;
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
    >
      <div className={`w-8 h-8 rounded flex items-center justify-center ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {getObjectTitle()}
        </div>
        <div className="text-xs text-gray-500">
          {related.type.toLowerCase().replace('_', ' ')}
        </div>
      </div>

      <FiExternalLink className="w-4 h-4 text-gray-400" />
    </div>
  );
}