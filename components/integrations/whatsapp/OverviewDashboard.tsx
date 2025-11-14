'use client';

import { FiActivity, FiCheckCircle, FiAlertCircle, FiDollarSign, FiClock, FiUsers } from 'react-icons/fi';

export default function OverviewDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#64748b]">Channel Health</h3>
            <FiActivity className="w-5 h-5 text-[#10b981]" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-[#10b981]" />
              <span className="text-xs text-[#64748b]">Webhook connected</span>
            </div>
            <div className="text-xs text-[#64748b]">Last webhook: <span className="font-semibold text-[#0f172a]">3s ago</span></div>
            <div className="text-xs text-[#64748b]">Last error: <span className="font-semibold text-[#10b981]">none</span></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#64748b]">Throughput</h3>
            <FiActivity className="w-5 h-5 text-[#0ea5a3]" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">Last 1h:</span>
              <span className="text-sm font-semibold text-[#0f172a]">45 msgs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">Last 24h:</span>
              <span className="text-sm font-semibold text-[#0f172a]">247 msgs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#f1f5f9] rounded-full h-2">
                <div className="bg-[#0ea5a3] h-2 rounded-full" style={{ width: '98%' }}></div>
              </div>
              <span className="text-xs font-semibold text-[#10b981]">98%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#64748b]">Costs</h3>
            <FiDollarSign className="w-5 h-5 text-[#f59e0b]" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">Today:</span>
              <span className="text-sm font-semibold text-[#0f172a]">₹124</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">This month:</span>
              <span className="text-sm font-semibold text-[#0f172a]">₹3,456</span>
            </div>
            <div className="text-xs text-[#64748b]">Avg per msg: <span className="font-semibold text-[#0f172a]">₹0.50</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#64748b]">Template Approval</h3>
            <FiClock className="w-5 h-5 text-[#f59e0b]" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">Pending:</span>
              <span className="text-sm font-semibold text-[#f59e0b]">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">Approved:</span>
              <span className="text-sm font-semibold text-[#10b981]">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">Rejected:</span>
              <span className="text-sm font-semibold text-[#ef4444]">1</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#64748b]">Consent Rate</h3>
            <FiUsers className="w-5 h-5 text-[#0ea5a3]" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-[#0f172a]">87%</div>
            <div className="text-xs text-[#64748b]">2,340 / 2,690 customers opted-in</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#f1f5f9] rounded-full h-2">
                <div className="bg-[#0ea5a3] h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#64748b]">Avg Response Time</h3>
            <FiClock className="w-5 h-5 text-[#0ea5a3]" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-[#0f172a]">4.2m</div>
            <div className="text-xs text-[#64748b]">For 2-way conversations</div>
            <div className="flex items-center gap-1 text-xs text-[#10b981]">
              <FiCheckCircle className="w-3 h-3" />
              <span>12% faster than last week</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
