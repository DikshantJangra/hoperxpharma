'use client';

import { useState } from 'react';
import { FiSearch, FiSend, FiClock } from 'react-icons/fi';

interface ComposerProps {
  isLoading: boolean;
}

export default function Composer({ isLoading }: ComposerProps = { isLoading: false }) {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [template, setTemplate] = useState('');

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / 160) || 1;
  const cost = smsCount * 0.12;

  return (
    <div className="h-full flex">
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-[#0f172a] mb-6">Quick Send</h2>

        <div className="max-w-2xl space-y-4">
          {/* Recipient */}
          <div>
            <label className="text-sm font-medium text-[#64748b] mb-2 block">Recipient</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Search patient by phone or name..."
                className="w-full pl-10 pr-4 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
              />
            </div>
          </div>

          {/* Template */}
          <div>
            <label className="text-sm font-medium text-[#64748b] mb-2 block">Template (Optional)</label>
            <select
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value);
                if (e.target.value === 'pickup') {
                  setMessage('Hi {name}, your prescription {order_no} is ready at {store_name}. Show this code {code}.');
                } else if (e.target.value === 'refill') {
                  setMessage('Hi {name}, time to refill {medicine}. Reply REFILL to order.');
                }
              }}
              className="w-full px-3 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
            >
              <option value="">Select template...</option>
              <option value="pickup">Pickup Ready</option>
              <option value="refill">Refill Reminder</option>
              <option value="invoice">Invoice Link</option>
              <option value="otp">OTP</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium text-[#64748b] mb-2 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type message or select template — 160 chars per SMS. Variables: {name}, {order_no}"
              rows={6}
              className="w-full px-3 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
            />
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-[#64748b]">
                {charCount} chars • {smsCount} SMS {smsCount > 1 && 'parts'}
              </span>
              <span className="text-[#64748b]">Variables: {'{name}'}, {'{order_no}'}, {'{store_name}'}</span>
            </div>
          </div>

          {/* Sender ID */}
          <div>
            <label className="text-sm font-medium text-[#64748b] mb-2 block">Sender ID</label>
            <select className="w-full px-3 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]">
              <option>+91 98XXXX (Default)</option>
              <option>5XXXX (Shortcode)</option>
              <option>PHARMA (Masked)</option>
            </select>
          </div>

          {/* Schedule */}
          <div>
            <label className="text-sm font-medium text-[#64748b] mb-2 block">Schedule</label>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2.5 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] font-medium">
                Send Now
              </button>
              <button className="px-4 py-2.5 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2">
                <FiClock className="w-4 h-4" />
                Schedule
              </button>
            </div>
          </div>

          {/* Cost Preview */}
          <div className="p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#64748b]">Estimated Cost:</span>
              <span className="font-semibold text-[#0f172a]">₹{cost.toFixed(2)}</span>
            </div>
          </div>

          {/* Send Button */}
          <button className="w-full py-3 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] font-semibold flex items-center justify-center gap-2">
            <FiSend className="w-4 h-4" />
            Send ({smsCount} SMS • est ₹{cost.toFixed(2)})
          </button>
        </div>
      </div>

      {/* Right Context */}
      <div className="w-80 bg-white border-l border-[#e2e8f0] p-4">
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Consent Status</h3>
        <div className="p-3 bg-[#d1fae5] border border-[#a7f3d0] rounded-lg">
          <p className="text-xs text-[#065f46]">✓ Opted-in for transactional messages</p>
        </div>

        <h3 className="text-sm font-semibold text-[#0f172a] mt-4 mb-3">Recent Messages</h3>
        <div className="space-y-2">
          <div className="p-2 bg-[#f8fafc] rounded text-xs">
            <p className="text-[#64748b]">2 days ago</p>
            <p className="text-[#0f172a] mt-1">Invoice sent</p>
          </div>
        </div>
      </div>
    </div>
  );
}
