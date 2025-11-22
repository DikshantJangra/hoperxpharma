'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const TemplateSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 animate-pulse">
        <div className="flex items-start justify-between mb-3">
            <div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-24"></div>
            </div>
            <div className="flex items-center gap-1">
                <div className="h-7 w-7 bg-gray-200 rounded"></div>
                <div className="h-7 w-7 bg-gray-200 rounded"></div>
            </div>
        </div>
        <div className="h-10 bg-gray-100 rounded"></div>
        <div className="h-3 bg-gray-100 rounded w-1/2 mt-3"></div>
    </div>
)

export default function Templates({ isLoading: parentLoading }: { isLoading: boolean }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setTemplates([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0f172a]">Templates</h2>
        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2" disabled={isLoading || parentLoading}>
          <FiPlus className="w-4 h-4" />
          New Template
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading || parentLoading ? (
            <>
                <TemplateSkeleton/>
                <TemplateSkeleton/>
                <TemplateSkeleton/>
            </>
        ) : templates.length > 0 ? (
            templates.map((template) => (
                <div key={template.id} className="bg-white border border-[#e2e8f0] rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-semibold text-[#0f172a]">{template.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-[#f0fdfa] text-[#0ea5a3] text-xs rounded">{template.category}</span>
                        <span className="text-xs text-[#64748b]">Used {template.uses} times</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-[#f8fafc] rounded">
                        <FiEdit2 className="w-4 h-4 text-[#64748b]" />
                        </button>
                        <button className="p-1.5 hover:bg-[#fef2f2] rounded">
                        <FiTrash2 className="w-4 h-4 text-[#ef4444]" />
                        </button>
                    </div>
                    </div>
                    <p className="text-sm text-[#64748b] bg-[#f8fafc] p-3 rounded">{template.body}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#94a3b8]">
                    <span>Variables: {template.body.match(/\{[^}]+\}/g)?.join(', ')}</span>
                    </div>
                </div>
            ))
        ) : (
            <div className="text-center py-10 text-gray-500">
                No templates created yet.
            </div>
        )}
      </div>
    </div>
  );
}
