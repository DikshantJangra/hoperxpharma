'use client';

import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiShield, FiAlertTriangle } from 'react-icons/fi';

interface SensitiveRevealProps {
  onReveal: () => void;
  data: any;
}

export default function SensitiveReveal({ onReveal, data }: SensitiveRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleReveal = async () => {
    setRequesting(true);
    
    // Mock permission check and 2FA flow
    setTimeout(() => {
      setRevealed(true);
      setRequesting(false);
      onReveal();
      
      // Telemetry
      console.log('patient.history.sensitive_reveal', { 
        timestamp: new Date().toISOString(),
        dataType: 'event_payload'
      });
    }, 1000);
  };

  const handleHide = () => {
    setRevealed(false);
  };

  if (revealed) {
    return (
      <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-orange-800">
            <FiShield className="w-4 h-4" />
            <span className="text-sm font-medium">Sensitive Data Revealed</span>
          </div>
          <button
            onClick={handleHide}
            className="text-orange-600 hover:text-orange-800 flex items-center gap-1 text-sm"
          >
            <FiEyeOff className="w-4 h-4" />
            Hide
          </button>
        </div>
        
        <div className="bg-white rounded border p-3">
          <pre className="text-xs text-gray-800 whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
        
        <div className="mt-2 text-xs text-orange-700 flex items-center gap-1">
          <FiAlertTriangle className="w-3 h-3" />
          This action has been logged for audit purposes
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
          <FiShield className="w-6 h-6 text-gray-500" />
        </div>
        
        <h4 className="text-sm font-medium text-gray-900 mb-2">Sensitive Data Protected</h4>
        <p className="text-xs text-gray-600 mb-4">
          This event contains sensitive information that requires additional permissions to view.
        </p>
        
        <button
          onClick={handleReveal}
          disabled={requesting}
          className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          {requesting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Requesting Access...
            </>
          ) : (
            <>
              <FiEye className="w-4 h-4" />
              Reveal Sensitive Data
            </>
          )}
        </button>
        
        <p className="text-xs text-gray-500 mt-2">
          This action will be logged for audit purposes
        </p>
      </div>
    </div>
  );
}