'use client';

import { IoClose } from 'react-icons/io5';

const shortcuts = [
  { key: '/', description: 'Focus product search (scanner mode)' },
  { key: 'Enter', description: 'Add highlighted product to basket' },
  { key: 'Ctrl + Enter', description: 'Quick finalize payment' },
  { key: 'F2', description: 'Toggle scanner mode' },
  { key: 'F4', description: 'Open customer lookup' },
  { key: 'F9', description: 'Split payment modal' },
  { key: 'F10', description: 'Hold / Save draft' },
  { key: 'F12', description: 'Print last receipt' },
  { key: '↑ ↓', description: 'Navigate search results / basket' },
  { key: 'Del', description: 'Remove selected basket item' },
  { key: 'Shift + ?', description: 'Show this shortcuts overlay' },
];

export default function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#0f172a]">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-[#0f172a] p-1 rounded hover:bg-[#f8fafc]"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
              <span className="text-sm text-[#64748b]">{shortcut.description}</span>
              <kbd className="px-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs font-mono font-semibold text-[#0f172a]">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
