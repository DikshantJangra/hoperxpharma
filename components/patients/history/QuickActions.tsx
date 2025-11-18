'use client';

import React from 'react';
import { FiPlus, FiFileText, FiMail, FiPhone, FiCalendar } from 'react-icons/fi';

interface QuickActionsProps {
  patientId: string;
  onNewPrescription?: () => void;
  onScheduleVisit?: () => void;
  onSendMessage?: () => void;
  onAddNote?: () => void;
}

export default function QuickActions({ 
  patientId, 
  onNewPrescription, 
  onScheduleVisit, 
  onSendMessage, 
  onAddNote 
}: QuickActionsProps) {
  const actions = [
    {
      label: 'New Prescription',
      icon: FiFileText,
      onClick: onNewPrescription,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      label: 'Schedule Visit',
      icon: FiCalendar,
      onClick: onScheduleVisit,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      label: 'Send Message',
      icon: FiMail,
      onClick: onSendMessage,
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      label: 'Add Note',
      icon: FiPlus,
      onClick: onAddNote,
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`flex items-center gap-2 px-3 py-2 text-white text-sm rounded-lg transition-colors ${action.color}`}
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}