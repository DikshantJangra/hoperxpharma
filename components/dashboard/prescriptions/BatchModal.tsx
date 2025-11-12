"use client"

interface Batch {
    id: string
    qty: number
    expiry: string
    mrp: number
    location: string
}

interface BatchModalProps {
    onClose: () => void
    drugId: number | null
}

export default function BatchModal({ onClose, drugId }: BatchModalProps) {
    const batches: Batch[] = [
        { id: "B2025-01", qty: 150, expiry: "Dec 2025", mrp: 225, location: "A-12" },
        { id: "B2024-33", qty: 80, expiry: "Aug 2025", mrp: 220, location: "A-13" },
        { id: "B2024-20", qty: 45, expiry: "Mar 2025", mrp: 215, location: "B-05" }
    ]

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg w-[600px] max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Select Batch</h3>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-900">✕</button>
                </div>
                
                <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                    {batches.map((batch, idx) => (
                        <button
                            key={batch.id}
                            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#0ea5a3] hover:bg-emerald-50 transition-all text-left"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-900">{batch.id}</span>
                                {idx === 0 && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">Recommended</span>}
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                                <div><span className="text-gray-600">Qty:</span> <span className="font-medium">{batch.qty}</span></div>
                                <div><span className="text-gray-600">Expiry:</span> <span className="font-medium">{batch.expiry}</span></div>
                                <div><span className="text-gray-600">MRP:</span> <span className="font-medium">₹{batch.mrp}</span></div>
                                <div><span className="text-gray-600">Location:</span> <span className="font-medium">{batch.location}</span></div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" defaultChecked className="rounded" />
                        Auto-select best batch (FEFO)
                    </label>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
