"use client"
import { useState, useEffect } from "react"
import { dashboardApi, ActionQueues as ActionQueuesData } from "@/lib/api/dashboard"
import { useAuthStore } from "@/lib/store/auth-store"
import { usePremiumTheme } from "@/lib/hooks/usePremiumTheme";

export default function ActionQueues() {
    const [activeTab, setActiveTab] = useState('verification')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [queues, setQueues] = useState<ActionQueuesData | null>(null)
    const hasStore = useAuthStore(state => state.hasStore)
    const { isPremium, tokens } = usePremiumTheme();

    useEffect(() => {
        const fetchQueues = async () => {
            if (!hasStore) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await dashboardApi.getActionQueues();
                setQueues(data);
            } catch (error) {
                console.error('Failed to fetch action queues:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQueues();
    }, [hasStore]);

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

    const getCurrentQueueData = () => {
        if (!queues) return [];

        switch (activeTab) {
            case 'verification':
                return queues.pendingPrescriptions || [];
            case 'erx':
                return queues.readyForPickup || [];
            case 'dispensing':
                return queues.lowStockItems || [];
            case 'returns':
                return queues.expiringItems || [];
            default:
                return [];
        }
    };

    const currentQueue = getCurrentQueueData();

    return (
        <div
            className={`
                rounded-xl h-full flex flex-col border transition-all 
                ${isPremium ? 'duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.01]' : 'duration-200'}
                ${isPremium
                    ? 'bg-white border-white/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(16,185,129,0.1)] hover:border-emerald-500/20'
                    : 'bg-white border-gray-100 shadow-sm'
                }
            `}
            style={!isPremium ? {} : {}}
            {...(isPremium ? { 'data-premium': 'true' } : {})}
        >
            <div className="px-6 pt-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-800">Action Queues</h3>
                    <div className={`flex items-center gap-2 border rounded-lg p-1 ${isPremium ? 'border-gray-100 bg-gray-50/50' : 'border-gray-200'}`}>
                        <TabButton label="Verification" count={queues?.pendingPrescriptions?.length || 0} active={activeTab === 'verification'} onClick={() => setActiveTab('verification')} isPremium={isPremium} />
                        <TabButton label="e-Rx" count={queues?.readyForPickup?.length || 0} active={activeTab === 'erx'} onClick={() => setActiveTab('erx')} isPremium={isPremium} />
                        <TabButton label="Dispensing" count={queues?.lowStockItems?.length || 0} active={activeTab === 'dispensing'} onClick={() => setActiveTab('dispensing')} isPremium={isPremium} />
                        <TabButton label="Returns" count={queues?.expiringItems?.length || 0} active={activeTab === 'returns'} onClick={() => setActiveTab('returns')} isPremium={isPremium} />
                    </div>
                </div>
            </div>
            <div className="p-6 space-y-3 flex-1 overflow-y-auto min-h-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0ea5a3] rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Fetching action queues...</p>
                    </div>
                ) : currentQueue.length > 0 ? (
                    <div className="space-y-2">
                        {currentQueue.map((item: any, index: number) => (
                            <QueueItem
                                key={item.id}
                                item={item}
                                type={activeTab}
                                selected={index === selectedIndex}
                                isPremium={isPremium}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-sm text-gray-500">No items in queue</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function TabButton({ label, count, active, onClick, isPremium }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${active
                    ? isPremium
                        ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                        : 'bg-emerald-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
        >
            {label} <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${active
                    ? isPremium
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-white text-emerald-600'
                    : 'bg-gray-200 text-gray-700'
                }`}>{count}</span>
        </button>
    )
}

function QueueItem({ item, type, selected, isPremium }: { item: any; type: string; selected: boolean; isPremium?: boolean }) {
    const renderContent = () => {
        switch (type) {
            case 'verification':
                return (
                    <>
                        <span className="text-sm font-semibold text-[#0f172a]">{item.patientName}</span>
                        <div className="text-xs text-[#6b7280] mt-0.5">
                            Prescription • {new Date(item.time).toLocaleString()}
                        </div>
                    </>
                );
            case 'erx':
                return (
                    <>
                        <span className="text-sm font-semibold text-[#0f172a]">{item.patientName}</span>
                        <div className="text-xs text-[#6b7280] mt-0.5">
                            {item.invoiceNumber} • Ready for pickup
                        </div>
                    </>
                );
            case 'dispensing':
                return (
                    <>
                        <span className="text-sm font-semibold text-[#0f172a]">{item.drugName}</span>
                        <div className="text-xs text-[#6b7280] mt-0.5">
                            Stock: {item.stock} units • Low stock alert
                        </div>
                    </>
                );
            case 'returns':
                return (
                    <>
                        <span className="text-sm font-semibold text-[#0f172a]">{item.drugName}</span>
                        <div className="text-xs text-[#6b7280] mt-0.5">
                            Expires: {new Date(item.expiryDate).toLocaleDateString()}
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${selected
                ? isPremium
                    ? 'border-emerald-500/30 bg-emerald-50/50 ring-1 ring-emerald-500/20 shadow-sm'
                    : 'border-[#0ea5a3] bg-[#0ea5a3]/5 ring-2 ring-[#0ea5a3]/20'
                : isPremium
                    ? 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                    : 'border-[#e6eef2] hover:border-[#0ea5a3]/30 bg-white'
            }`}>
            <div className="flex items-center gap-3 flex-1">
                <input type="checkbox" className="w-4 h-4 text-[#0ea5a3] border-gray-300 rounded focus:ring-[#0ea5a3]" />
                <div className="flex-1">
                    {renderContent()}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-[#0ea5a3] text-white text-xs font-semibold rounded-lg hover:bg-[#0ea5a3]/90 transition-colors">
                    {type === 'verification' && 'Review'}
                    {type === 'erx' && 'Notify'}
                    {type === 'dispensing' && 'Order'}
                    {type === 'returns' && 'Manage'}
                </button>
            </div>
        </div>
    )
}
