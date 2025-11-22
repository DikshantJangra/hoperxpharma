'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiCopy, FiTrash2, FiCheckCircle, FiClock, FiXCircle, FiSend } from 'react-icons/fi';

const TemplateCardSkeleton = () => (
    <div className="bg-white rounded-lg border border-[#e2e8f0] p-4 animate-pulse">
        <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
        <div className="h-3 bg-gray-100 rounded w-1/4"></div>
    </div>
)

export default function TemplatesLibrary() {
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'rejected' | 'all'>('approved');
  const [showEditor, setShowEditor] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setTemplates([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, [activeTab]);

  const filteredTemplates = activeTab === 'all' 
    ? templates 
    : templates.filter(t => t.status === activeTab);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#0f172a]">Templates Library</h2>
          <button onClick={() => setShowEditor(true)} className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm font-medium" disabled={isLoading}>
            <FiPlus className="w-4 h-4" />
            Create Template
          </button>
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: 'approved', label: 'Approved', count: templates.filter(t => t.status === 'approved').length },
            { id: 'pending', label: 'Pending', count: templates.filter(t => t.status === 'pending').length },
            { id: 'rejected', label: 'Rejected', count: templates.filter(t => t.status === 'rejected').length },
            { id: 'all', label: 'All', count: templates.length }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-[#0ea5a3] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
              }`} disabled={isLoading}>
              {tab.label} ({isLoading ? '...' : tab.count})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-3">
          {isLoading ? (
            <>
                <TemplateCardSkeleton/>
                <TemplateCardSkeleton/>
                <TemplateCardSkeleton/>
            </>
          ) : filteredTemplates.map(template => (
            <div key={template.id} className="bg-white rounded-lg border border-[#e2e8f0] p-4 hover:border-[#0ea5a3] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-[#0f172a]">{template.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.status === 'approved' ? 'bg-[#d1fae5] text-[#065f46]' :
                      template.status === 'pending' ? 'bg-[#fef3c7] text-[#92400e]' :
                      'bg-[#fee2e2] text-[#991b1b]'
                    }`}>
                      {template.status === 'approved' && <FiCheckCircle className="inline w-3 h-3 mr-1" />}
                      {template.status === 'pending' && <FiClock className="inline w-3 h-3 mr-1" />}
                      {template.status === 'rejected' && <FiXCircle className="inline w-3 h-3 mr-1" />}
                      {template.status}
                    </span>
                    <span className="px-2 py-1 bg-[#f1f5f9] text-[#64748b] rounded text-xs">{template.category}</span>
                    <span className="px-2 py-1 bg-[#f1f5f9] text-[#64748b] rounded text-xs">{template.language}</span>
                  </div>
                  <p className="text-sm text-[#64748b] mb-2">{template.body}</p>
                  <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                    <span>Used: {template.usageCount} times</span>
                    <span>Last used: {template.lastUsed}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {template.status === 'approved' && (
                    <button className="p-2 hover:bg-[#f1f5f9] rounded-lg" title="Use template">
                      <FiSend className="w-4 h-4 text-[#0ea5a3]" />
                    </button>
                  )}
                  <button className="p-2 hover:bg-[#f1f5f9] rounded-lg" title="Edit">
                    <FiEdit className="w-4 h-4 text-[#64748b]" />
                  </button>
                  <button className="p-2 hover:bg-[#f1f5f9] rounded-lg" title="Duplicate">
                    <FiCopy className="w-4 h-4 text-[#64748b]" />
                  </button>
                  <button className="p-2 hover:bg-[#fee2e2] rounded-lg" title="Delete">
                    <FiTrash2 className="w-4 h-4 text-[#ef4444]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-[#e2e8f0]">
              <h3 className="text-lg font-semibold text-[#0f172a]">Create New Template</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#64748b] mb-2">Template Name</label>
                <input type="text" placeholder="e.g., Pickup Ready" className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748b] mb-2">Category</label>
                <select className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm">
                  <option>Transactional</option>
                  <option>Reminder</option>
                  <option>OTP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748b] mb-2">Message Body</label>
                <textarea placeholder="Use {{variable}} for dynamic content" rows={6} className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm resize-none" />
                <p className="text-xs text-[#64748b] mt-2">Available variables: {`{{name}}, {{order_no}}, {{store_name}}, {{amount}}`}</p>
              </div>
            </div>
            <div className="p-6 border-t border-[#e2e8f0] flex items-center justify-end gap-3">
              <button onClick={() => setShowEditor(false)} className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] text-sm font-medium">
                Cancel
              </button>
              <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] text-sm font-medium">
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
