"use client";

import React from "react";
import HistoryHeader from "@/components/patients/history/HistoryHeader";
import HistoryFilters from "@/components/patients/history/HistoryFilters";
import TimelineList from "@/components/patients/history/TimelineList";
import EventDetailDrawer from "@/components/patients/history/EventDetailDrawer";
import ExportModal from "@/components/patients/history/ExportModal";
import TimelineSearchBar from "@/components/patients/history/TimelineSearchBar";
import JumpToDateCalendar from "@/components/patients/history/JumpToDateCalendar";
import { usePatientHistory } from "@/hooks/usePatientHistory";

export default function PatientHistoryPage() {
  const patientId = "p_001"; // In real app: from URL params
  const { events, loading, selectedEvent, selectEvent, filters, setFilters, loadMore, hasMore } = usePatientHistory(patientId);
  const [showExport, setShowExport] = React.useState(false);
  const [showCalendar, setShowCalendar] = React.useState(false);

  React.useEffect(() => {
    // Telemetry
    console.log('patient.history.view', { patientId, timeframe: filters });
  }, [patientId, filters]);

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-12 gap-6">
      {/* Left Sidebar - Controls */}
      <aside className="col-span-3">
        <HistoryHeader 
          patientId={patientId} 
          filters={filters} 
          onChange={setFilters}
          onExport={() => setShowExport(true)}
          onJumpToDate={() => setShowCalendar(true)}
        />
        
        <div className="mt-6">
          <TimelineSearchBar 
            value={filters.search}
            onChange={(search) => setFilters({ ...filters, search })}
          />
        </div>

        <div className="mt-6">
          <HistoryFilters 
            filters={filters}
            onChange={setFilters}
          />
        </div>

        {showCalendar && (
          <div className="mt-6">
            <JumpToDateCalendar 
              onDateSelect={(date) => {
                // Scroll to date logic would go here
                setShowCalendar(false);
              }}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        )}
      </aside>

      {/* Main Timeline */}
      <main className="col-span-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Activity & History</h1>
          <p className="text-sm text-gray-500 mt-1">Riya Sharma • MRN-1001 • Last visit: Jan 15, 2025</p>
        </div>
        
        <TimelineList 
          events={events.groups} 
          loading={loading}
          onLoadMore={loadMore}
          hasMore={hasMore}
          onSelect={selectEvent}
          selectedEventId={selectedEvent?.eventId}
        />
      </main>

      {/* Right Sidebar - Detail Drawer */}
      <aside className="col-span-3">
        {selectedEvent && (
          <EventDetailDrawer 
            eventId={selectedEvent.eventId}
            onClose={() => selectEvent(null)}
          />
        )}
      </aside>

      {/* Modals */}
      {showExport && (
        <ExportModal
          patientId={patientId}
          filters={filters}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
