'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiPlay, FiPause, FiEdit, FiTrash2, FiZap } from 'react-icons/fi';

const FlowCardSkeleton = () => (
    <div className="bg-white rounded-lg border border-[#e2e8f0] p-4 animate-pulse">
        <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/4"></div>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
    </div>
)

export default function AutomationFlows() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [flows, setFlows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setFlows([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0f172a]">Automation Flows</h2>
            <p className="text-sm text-[#64748b]">Configure triggers and automated message sequences</p>
          </div>
          <button onClick={() => setShowBuilder(true)} className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm font-medium" disabled={isLoading}>
            <FiPlus className="w-4 h-4" />
            Create Flow
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-3">
          {isLoading ? (
            <>
                <FlowCardSkeleton/>
                <FlowCardSkeleton/>
                <FlowCardSkeleton/>
            </>
          ) : flows.length > 0 ? (
            flows.map(flow => (
                <div key={flow.id} className="bg-white rounded-lg border border-[#e2e8f0] p-4 hover:border-[#0ea5a3] transition-colors">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <FiZap className="w-5 h-5 text-[#f59e0b]" />
                        <h3 className="font-semibold text-[#0f172a]">{flow.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        flow.status === 'active' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#f1f5f9] text-[#64748b]'
                        }`}>
                        {flow.status === 'active' ? <FiPlay className="inline w-3 h-3 mr-1" /> : <FiPause className="inline w-3 h-3 mr-1" />}
                        {flow.status}
                        </span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                        <span className="text-[#64748b]">Trigger:</span>
                        <span className="px-2 py-1 bg-[#f1f5f9] text-[#0f172a] rounded text-xs font-medium">{flow.trigger}</span>
                        <span className="text-[#64748b]">→</span>
                        <span className="text-[#64748b]">{flow.actions} actions</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                        <span>Last run: {flow.lastRun}</span>
                        {flow.successRate > 0 && (
                            <span className="flex items-center gap-1">
                            Success rate: <span className="font-semibold text-[#10b981]">{flow.successRate}%</span>
                            </span>
                        )}
                        </div>
                    </div>
                    </div>
                    <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-[#f1f5f9] rounded-lg" title={flow.status === 'active' ? 'Pause' : 'Activate'}>
                        {flow.status === 'active' ? <FiPause className="w-4 h-4 text-[#64748b]" /> : <FiPlay className="w-4 h-4 text-[#10b981]" />}
                    </button>
                    <button className="p-2 hover:bg-[#f1f5f9] rounded-lg" title="Edit">
                        <FiEdit className="w-4 h-4 text-[#64748b]" />
                    </button>
                    <button className="p-2 hover:bg-[#fee2e2] rounded-lg" title="Delete">
                        <FiTrash2 className="w-4 h-4 text-[#ef4444]" />
                    </button>
                    </div>
                </div>
                </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
                No automation flows created yet.
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg border border-[#e2e8f0] p-6">
          <h3 className="font-semibold text-[#0f172a] mb-4">Available Triggers</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              'Prescription finalized',
              'Sale completed',
              'Refill due',
              'Batch recall',
              'Low stock alert',
              'Customer birthday',
              'Appointment reminder',
              'Payment received',
              'Order shipped'
            ].map(trigger => (
              <div key={trigger} className="px-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm text-[#64748b] hover:border-[#0ea5a3] hover:text-[#0ea5a3] cursor-pointer transition-colors">
                {trigger}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-[#e2e8f0]">
              <h3 className="text-lg font-semibold text-[#0f172a]">Flow Builder</h3>
              <p className="text-sm text-[#64748b]">Create automated message sequences</p>
            </div>
            <div className="p-6">
              <div className="bg-[#f8fafc] rounded-lg border-2 border-dashed border-[#cbd5e1] p-12 text-center">
                <FiZap className="w-12 h-12 text-[#cbd5e1] mx-auto mb-3" />
                <p className="text-[#64748b] mb-4">Visual flow builder coming soon</p>
                <p className="text-sm text-[#94a3b8]">Drag and drop triggers, conditions, and actions to build your automation</p>
              </div>
            </div>
            <div className="p-6 border-t border-[#e2e8f0] flex items-center justify-end gap-3">
              <button onClick={() => setShowBuilder(false)} className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] text-sm font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
