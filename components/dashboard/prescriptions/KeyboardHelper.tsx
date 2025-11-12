interface KeyboardHelperProps {
    onClose: () => void
}

export default function KeyboardHelper({ onClose }: KeyboardHelperProps) {
    const shortcuts = [
        { key: "/", action: "Global search" },
        { key: "g p", action: "Go to Prescriptions" },
        { key: "n", action: "Next Rx in queue" },
        { key: "p", action: "Previous Rx" },
        { key: "s", action: "Start Fill" },
        { key: "b", action: "Open Batch selector" },
        { key: "l", action: "Open Label print" },
        { key: "f", action: "Focus first drug row" },
        { key: "Ctrl+Enter", action: "Finalize & Mark Filled" },
        { key: "Shift+?", action: "Show shortcuts" }
    ]

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg w-[500px]" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h3>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-900">✕</button>
                </div>
                
                <div className="p-6 space-y-2">
                    {shortcuts.map((shortcut, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-700">{shortcut.action}</span>
                            <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">{shortcut.key}</kbd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
