'use client';

import { useState } from 'react';
import { FiSend, FiPaperclip, FiUser, FiCheckCircle, FiAlertTriangle, FiEye } from 'react-icons/fi';

export default function Composer() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-[#e2e8f0]">
        <h2 className="text-lg font-semibold text-[#0f172a]">Quick Send</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-2">To</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
              <input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Search patient by email or name..." className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
            </div>
            {to && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <FiCheckCircle className="w-3 h-3 text-[#10b981]" />
                <span className="text-[#10b981]">Opted-in (Transactional)</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#64748b] mb-2">From</label>
              <select className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm">
                <option>noreply@hoperxpharma.com</option>
                <option>support@hoperxpharma.com</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#64748b] mb-2">Template</label>
              <select className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm">
                <option value="">Blank</option>
                <option>Invoice</option>
                <option>Prescription Summary</option>
                <option>Refill Reminder</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-2">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Your invoice #12345 from HopeRxPharma" className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-2">Message Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write message or use variables like {{name}}, {{invoice_no}}..." rows={12} className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm resize-none" />
            <div className="flex items-center justify-between mt-2">
              <button className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a]">
                <FiPaperclip className="w-4 h-4" />
                Attach PDF/Invoice
              </button>
              <span className="text-xs text-[#64748b]">{body.length} characters</span>
            </div>
          </div>

          <div className="p-4 bg-[#fef3c7] border border-[#fde68a] rounded-lg">
            <div className="flex items-start gap-2">
              <FiAlertTriangle className="w-4 h-4 text-[#92400e] mt-0.5" />
              <div className="text-xs text-[#92400e]">
                <span className="font-semibold">Preflight Check:</span> Missing variable {`{{invoice_link}}`} — fill or confirm fallback
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-[#e2e8f0] bg-[#f8fafc]">
        <div className="max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[#64748b]">
              <input type="checkbox" className="w-4 h-4 text-[#0ea5a3] rounded" />
              Track opens
            </label>
            <label className="flex items-center gap-2 text-sm text-[#64748b]">
              <input type="checkbox" className="w-4 h-4 text-[#0ea5a3] rounded" />
              HIPAA mode
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-white text-sm font-medium flex items-center gap-2">
              <FiEye className="w-4 h-4" />
              Preview
            </button>
            <button className="px-4 py-2 bg-[#f1f5f9] text-[#64748b] rounded-lg hover:bg-[#e2e8f0] text-sm font-medium">
              Save Draft
            </button>
            <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm font-medium">
              <FiSend className="w-4 h-4" />
              Send Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
