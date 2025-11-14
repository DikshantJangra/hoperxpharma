"use client";

import React from "react";
import HistoryHeader from "@/components/patients/history/HistoryHeader";
import HistoryFiltersBar from "@/components/patients/history/HistoryFiltersBar";
import TimelineList from "@/components/patients/history/TimelineList";
import TimelineDetailPane from "@/components/patients/history/TimelineDetailPane";
import ExportHistoryModal from "@/components/patients/history/ExportHistoryModal";
import { usePatientHistory } from "@/hooks/usePatientHistory";

export default function PatientHistoryPage() {
  const patientId = "p_001"; // In real app: from URL params
  const { items, loading, selected, setSelected, filters, setFilters, fetchMore } = usePatientHistory(patientId);
  const [showExport, setShowExport] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <HistoryHeader
        patientName="Riya Sharma"
        mrn="MRN-1001"
        onExport={() => setShowExport(true)}
      />

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Timeline */}
          <div className="col-span-8">
            <HistoryFiltersBar filters={filters} onChange={setFilters} />
            <div className="mt-4">
              <TimelineList
                items={items}
                loading={loading}
                selected={selected}
                onSelect={setSelected}
                onLoadMore={fetchMore}
              />
            </div>
          </div>

          {/* Detail Pane */}
          <aside className="col-span-4">
            <TimelineDetailPane event={selected} onClose={() => setSelected(null)} />
          </aside>
        </div>
      </div>

      {showExport && (
        <ExportHistoryModal
          patientId={patientId}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
