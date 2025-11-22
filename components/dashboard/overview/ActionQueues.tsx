"use client"
import { useState, useEffect } from "react"

export default function ActionQueues() {
    const [activeTab, setActiveTab] = useState('verification')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'j') {
                e.preventDefault()
                setSelectedIndex(prev => Math.min(prev + 1, 3))
            }
            if (e.key === 'k') {
                e.preventDefault()
                setSelectedIndex(prev => Math.max(prev - 1, 0))
            }
            if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault()
                console.log('Open item', selectedIndex)
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [selectedIndex])

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="px-6 pt-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-800">Action Queues</h3>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
                        <TabButton label="Verification" count={0} active={activeTab === 'verification'} onClick={() => setActiveTab('verification')} />
                        <TabButton label="e-Rx" count={0} active={activeTab === 'erx'} onClick={() => setActiveTab('erx')} />
                        <TabButton label="Dispensing" count={0} active={activeTab === 'dispensing'} onClick={() => setActiveTab('dispensing')} />
                        <TabButton label="Returns" count={0} active={activeTab === 'returns'} onClick={() => setActiveTab('returns')} />
                    </div>
                </div>
            </div>
            <div className="p-6 space-y-3 flex-1 overflow-y-auto min-h-0 flex flex-col items-center justify-center">
                {loading ? (
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0ea5a3] rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Fetching action queues...</p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No items in queue</p>
                )}
            </div>
        </div>
    )
}

function TabButton({ label, count, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${active ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
        >
            {label} <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${active ? 'bg-white text-emerald-600' : 'bg-gray-200 text-gray-700'}`}>{count}</span>
        </button>
    )
}

function QueueItem({ patient, drug, prescriber, priority, selected }: any) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${selected ? 'border-[#0ea5a3] bg-[#0ea5a3]/5 ring-2 ring-[#0ea5a3]/20' : 'border-[#e6eef2] hover:border-[#0ea5a3]/30 bg-white'}`}>
            <div className="flex items-center gap-3 flex-1">
                <input type="checkbox" className="w-4 h-4 text-[#0ea5a3] border-gray-300 rounded focus:ring-[#0ea5a3]" />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#0f172a]">{patient}</span>
                        {priority === 'high' && (
                            <span className="px-2 py-0.5 bg-[#ef4444]/10 text-[#ef4444] text-xs font-bold rounded-full">URGENT</span>
                        )}
                    </div>
                    <div className="text-xs text-[#6b7280] mt-0.5">{drug} • {prescriber}</div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-[#0ea5a3] text-white text-xs font-semibold rounded-lg hover:bg-[#0ea5a3]/90 transition-colors">
                    Start
                </button>
                <button className="px-3 py-2 text-xs font-semibold text-[#6b7280] hover:text-[#0f172a] transition-colors">
                    Message
                </button>
            </div>
        </div>
    )
}
