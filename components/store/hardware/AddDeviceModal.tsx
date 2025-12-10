'use client';

import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

export default function AddDeviceModal({ onClose }: any) {
  const [form, setForm] = useState({ name: '', type: 'printer', model: '', serial: '', connection: 'usb', ip: '', mac: '', location: '' });

  // Enable enhanced keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div
        className="bg-white rounded-xl w-full max-w-3xl"
        onKeyDown={handleKeyDown}
        data-focus-trap="true"
      >
        <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#0f172a]">Add Device</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#f1f5f9] rounded">
            <FiX className="w-5 h-5 text-[#64748b]" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-1">Device Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="POS-1" className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm">
              <option value="printer">Printer</option>
              <option value="pos_terminal">POS Terminal</option>
              <option value="scanner">Scanner</option>
              <option value="soundbox">UPI SoundBox</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-1">Model</label>
            <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Epson TM-T82" className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-1">Serial Number</label>
            <input type="text" value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} placeholder="SN-12345" className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-1">Connection</label>
            <select value={form.connection} onChange={(e) => setForm({ ...form, connection: e.target.value })} className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm">
              <option value="usb">USB</option>
              <option value="ethernet">Ethernet</option>
              <option value="bluetooth">Bluetooth</option>
              <option value="wifi">Wi-Fi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-1">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Counter 1" className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-1">IP Address (optional)</label>
            <input type="text" value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} placeholder="192.168.1.250" className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#64748b] mb-1">MAC Address (optional)</label>
            <input type="text" value={form.mac} onChange={(e) => setForm({ ...form, mac: e.target.value })} placeholder="AA:BB:CC:DD:EE:FF" className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
          </div>
        </div>
        <div className="p-6 border-t border-[#e2e8f0] flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] text-sm font-medium">
            Cancel
          </button>
          <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] text-sm font-medium">
            Register Device
          </button>
        </div>
      </div>
    </div>
  );
}
