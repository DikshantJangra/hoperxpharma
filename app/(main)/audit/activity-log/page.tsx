"use client";
import { useState } from "react";
import { FiSearch, FiDownload, FiEye, FiClock, FiAlertTriangle, FiUsers, FiActivity } from "react-icons/fi";
import { MdPlayArrow, MdPause } from "react-icons/md";
import SavedFilters from "@/components/audit/activity-log/SavedFilters";
import ActivityTable from "@/components/audit/activity-log/ActivityTable";
import TimelineView from "@/components/audit/activity-log/TimelineView";
import EventDetailDrawer from "@/components/audit/activity-log/EventDetailDrawer";
import ExportModal from "@/components/audit/activity-log/ExportModal";
import AnnotateModal from "@/components/audit/activity-log/AnnotateModal";
import RevertModal from "@/components/audit/activity-log/RevertModal";

export default function ActivityLogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [isLive, setIsLive] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAnnotateModal, setShowAnnotateModal] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [dateRange, setDateRange] = useState("24h");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-sm text-gray-500 mt-1">
              Logs are immutable. Some actions (revert/annotate) create separate audit entries.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                isLive
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              {isLive ? <MdPause size={18} /> : <MdPlayArrow size={18} />}
              {isLive ? "Live" : "Replay"}
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <FiDownload size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Search & Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event ID, user, IP, order, batch, prescription... (Press /)"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="today">Today</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
              <FiActivity size={16} />
              Events (24h)
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1">2,847</div>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-purple-700 text-sm font-medium">
              <FiUsers size={16} />
              Unique Users
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-1">34</div>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-700 text-sm font-medium">
              <FiAlertTriangle size={16} />
              High Severity
            </div>
            <div className="text-2xl font-bold text-orange-900 mt-1">12</div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
              <FiEye size={16} />
              Pending Investigations
            </div>
            <div className="text-2xl font-bold text-red-900 mt-1">3</div>
          </div>
        </div>

        {/* Ingestion Status */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <FiClock size={12} />
          Last updated: 2 seconds ago • Ingestion lag: 0.3s
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Saved Filters */}
        <SavedFilters />

        {/* Center: Activity Table/Timeline */}
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  viewMode === "table"
                    ? "bg-teal-100 text-teal-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  viewMode === "timeline"
                    ? "bg-teal-100 text-teal-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Timeline
              </button>
            </div>
            {selectedEvents.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selectedEvents.length} selected</span>
                <button
                  onClick={() => setShowAnnotateModal(true)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Annotate
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Export
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {viewMode === "table" ? (
              <ActivityTable
                searchQuery={searchQuery}
                isLive={isLive}
                onEventClick={setSelectedEvent}
                selectedEvents={selectedEvents}
                onSelectionChange={setSelectedEvents}
              />
            ) : (
              <TimelineView
                searchQuery={searchQuery}
                isLive={isLive}
                onEventClick={setSelectedEvent}
              />
            )}
          </div>
        </div>

        {/* Right: Event Detail Drawer */}
        {selectedEvent && (
          <EventDetailDrawer
            eventId={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onAnnotate={() => setShowAnnotateModal(true)}
            onRevert={() => setShowRevertModal(true)}
          />
        )}
      </div>

      {/* Modals */}
      {showExportModal && (
        <ExportModal
          selectedEvents={selectedEvents}
          onClose={() => setShowExportModal(false)}
        />
      )}
      {showAnnotateModal && (
        <AnnotateModal
          eventIds={selectedEvents.length > 0 ? selectedEvents : selectedEvent ? [selectedEvent] : []}
          onClose={() => setShowAnnotateModal(false)}
        />
      )}
      {showRevertModal && selectedEvent && (
        <RevertModal
          eventId={selectedEvent}
          onClose={() => setShowRevertModal(false)}
        />
      )}
    </div>
  );
}
