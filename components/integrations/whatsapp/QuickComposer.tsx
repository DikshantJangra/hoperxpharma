'use client';

import { useState } from 'react';
import { FiSend, FiPaperclip, FiUser, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function QuickComposer() {
  const [recipient, setRecipient] = useState('');
  const [template, setTemplate] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
      <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Quick Send Message</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-[#64748b] mb-2">Recipient</label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Search patient by phone or name..."
              className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm"
            />
          </div>
          {recipient && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <FiCheckCircle className="w-3 h-3 text-[#10b981]" />
              <span className="text-[#10b981]">Opted-in (Transactional)</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#64748b] mb-2">Template</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm"
          >
            <option value="">Select template or free text</option>
            <option value="pickup">Pickup Ready</option>
            <option value="invoice">Invoice</option>
            <option value="refill">Refill Reminder</option>
            <option value="recall">Batch Recall</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-[#64748b] mb-2">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message or select a template..."
          rows={4}
          className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <button className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a]">
            <FiPaperclip className="w-4 h-4" />
            Attach Invoice/Media
          </button>
          <span className="text-xs text-[#64748b]">{message.length} / 1000 characters</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="track" className="w-4 h-4 text-[#0ea5a3] rounded" />
          <label htmlFor="track" className="text-sm text-[#64748b]">Track delivery</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="confidential" className="w-4 h-4 text-[#0ea5a3] rounded" />
          <label htmlFor="confidential" className="text-sm text-[#64748b]">Mark as confidential</label>
        </div>
        <div className="flex-1"></div>
        <div className="text-sm text-[#64748b]">Cost: <span className="font-semibold text-[#0f172a]">₹0.50/msg</span></div>
        <button className="px-4 py-2 bg-[#f1f5f9] text-[#64748b] rounded-lg hover:bg-[#e2e8f0] text-sm font-medium">
          Test
        </button>
        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm font-medium">
          <FiSend className="w-4 h-4" />
          Send Now
        </button>
      </div>

      {!recipient && (
        <div className="mt-4 p-3 bg-[#fef3c7] border border-[#fde68a] rounded-lg flex items-start gap-2">
          <FiAlertCircle className="w-4 h-4 text-[#92400e] mt-0.5" />
          <div className="text-xs text-[#92400e]">
            <span className="font-semibold">No opt-in</span> — must obtain consent before sending templates
          </div>
        </div>
      )}
    </div>
  );
}
