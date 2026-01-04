"use client";
import { useState, useEffect } from "react";
import { FiSearch, FiDownload, FiShield, FiAlertTriangle, FiCheckCircle, FiLock, FiUsers } from "react-icons/fi";
import { MdPlayArrow, MdPause } from "react-icons/md";
import AccessFilters from "@/components/audit/access/AccessFilters";
import AccessTable from "@/components/audit/access/AccessTable";
import AccessDetailDrawer from "@/components/audit/access/AccessDetailDrawer";

const StatCardSkeleton = () => (
  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 animate-pulse">
    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
      <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
      <div className="h-3 w-20 bg-gray-200 rounded"></div>
    </div>
    <div className="text-2xl h-7 w-12 bg-gray-300 rounded mt-1"></div>
    <div className="text-xs h-3 w-16 bg-gray-200 rounded mt-1"></div>
  </div>
)

import { auditApi } from "@/lib/api/audit";

export default function AccessLogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("24h");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await auditApi.getAccessStats();
        console.log('Stats response:', response);
        const statsData = response.data || response || {};

        setStats({
          successful: statsData.successfulLogins || 0,
          failed: statsData.failedLogins || 0,
          locked: 0, // Not tracked yet
          mfa: 0, // Not tracked yet
          newDevices: 0, // Not tracked yet
          blockedIps: 0 // Not tracked yet
        });
      } catch (error) {
        console.error('Failed to fetch access stats:', error);
        // Set default values on error
        setStats({
          successful: 0,
          failed: 0,
          locked: 0,
          mfa: 0,
          newDevices: 0,
          blockedIps: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [dateRange]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Access Log</h1>
            <p className="text-sm text-gray-500 mt-1">
              Access logs are immutable and include all authentication and entry events.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isLive
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
            >
              {isLive ? <MdPause size={18} /> : <MdPlayArrow size={18} />}
              {isLive ? "Live" : "Replay"}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              <FiDownload size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user, email, IP, device, session ID... (Press /)"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter(activeFilter === "failed" ? null : "failed")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeFilter === "failed"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            🔴 Login Failures
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === "suspicious" ? null : "suspicious")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeFilter === "suspicious"
              ? "bg-orange-100 text-orange-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            🟠 Suspicious
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === "success" ? null : "success")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeFilter === "success"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            🟢 Successful
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === "mfa" ? null : "mfa")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeFilter === "mfa"
              ? "bg-purple-100 text-purple-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            🔒 MFA Events
          </button>
        </div>
      </div>

      {/* Security Summary Cards */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="grid grid-cols-6 gap-4">
          {isLoading ? (
            <>
              <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-green-700 text-xs font-medium">
                  <FiCheckCircle size={14} />
                  Successful Logins
                </div>
                <div className="text-2xl font-bold text-green-900 mt-1">{stats.successful}</div>
                <div className="text-xs text-green-600 mt-1">Last 24h</div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-red-700 text-xs font-medium">
                  <FiAlertTriangle size={14} />
                  Failed Attempts
                </div>
                <div className="text-2xl font-bold text-red-900 mt-1">{stats.failed}</div>
                <div className="text-xs text-red-600 mt-1">Last 24h</div>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-orange-700 text-xs font-medium">
                  <FiLock size={14} />
                  Locked Accounts
                </div>
                <div className="text-2xl font-bold text-orange-900 mt-1">{stats.locked}</div>
                <div className="text-xs text-orange-600 mt-1">Active</div>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-purple-700 text-xs font-medium">
                  <FiShield size={14} />
                  MFA Challenges
                </div>
                <div className="text-2xl font-bold text-purple-900 mt-1">{stats.mfa}</div>
                <div className="text-xs text-purple-600 mt-1">Last 24h</div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-blue-700 text-xs font-medium">
                  <FiUsers size={14} />
                  New Devices
                </div>
                <div className="text-2xl font-bold text-blue-900 mt-1">{stats.newDevices}</div>
                <div className="text-xs text-blue-600 mt-1">Registered</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-gray-300 text-xs font-medium">
                  <FiAlertTriangle size={14} />
                  Blocked IPs
                </div>
                <div className="text-2xl font-bold text-white mt-1">{stats.blockedIps}</div>
                <div className="text-xs text-gray-400 mt-1">Active blocks</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left: Filters */}
        <AccessFilters />

        {/* Center: Access Table */}
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 overflow-auto">
            <AccessTable
              searchQuery={searchQuery}
              isLive={isLive}
              activeFilter={activeFilter}
              onEventClick={setSelectedEvent}
              isLoading={isLoading}
              dateRange={dateRange}
            />
          </div>
        </div>

        {/* Right: Event Detail Drawer - Overlays without backdrop */}
        {selectedEvent && (
          <div className="absolute right-0 top-0 bottom-0 w-[600px] z-10">
            <AccessDetailDrawer
              eventId={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
