"use client";

import React from "react";
import PatientsHeader from "@/components/patients/PatientsHeader";
import FiltersPanel from "@/components/patients/FiltersPanel";
import PatientRow from "@/components/patients/PatientRow";
import NewPatientModal from "@/components/patients/NewPatientModal";
import PatientDetailDrawer from "@/components/patients/PatientDetailDrawer";
import RefillModal from "@/components/patients/RefillModal";
import MessageComposer from "@/components/patients/MessageComposer";
import BulkActionsBar from "@/components/patients/BulkActionsBar";
import { usePatients } from "@/hooks/usePatients";
import { useAuthStore } from "@/lib/store/auth-store";

export default function PatientsListPage() {
  const { primaryStore } = useAuthStore();
  const { patients, loading, error, page, setPage, totalPages, search, setSearch, filters, setFilters, refresh } = usePatients(primaryStore?.id || "");
  const [selectedPatient, setSelectedPatient] = React.useState<any>(null);
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [showRefillModal, setShowRefillModal] = React.useState<any>(null);
  const [showMessageModal, setShowMessageModal] = React.useState<any>(null);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [showFilters, setShowFilters] = React.useState(true);

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === patients.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(patients.map(p => p.id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <PatientsHeader
        search={search}
        onSearch={setSearch}
        onNew={() => setShowNewModal(true)}
        onToggleFilters={() => setShowFilters(!showFilters)}
        showFilters={showFilters}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <aside className="col-span-3">
              <FiltersPanel filters={filters} onChange={setFilters} />
            </aside>
          )}

          {/* Patient List */}
          <main className={showFilters ? "col-span-9" : "col-span-12"}>
            {/* Bulk Actions */}
            {selectedRows.length > 0 && (
              <BulkActionsBar
                selectedCount={selectedRows.length}
                onClear={() => setSelectedRows([])}
                onExport={() => { }}
                onMessage={() => { }}
              />
            )}

            {/* Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedRows.length === patients.length && patients.length > 0}
                  onChange={handleSelectAll}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1">Patient</div>
                <div className="w-32">Contact</div>
                <div className="w-24">Last Visit</div>
                <div className="w-32">Status</div>
                <div className="w-40">Actions</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading patients...</div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <p className="text-red-500 mb-2">{error}</p>
                    <button
                      onClick={refresh}
                      className="text-sm text-teal-600 hover:text-teal-700"
                    >
                      Try again
                    </button>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 mb-2">No patients found.</p>
                    <button
                      onClick={() => setShowNewModal(true)}
                      className="text-sm text-teal-600 hover:text-teal-700"
                    >
                      Click "New Patient" to add one.
                    </button>
                  </div>
                ) : (
                  patients.map((patient) => (
                    <PatientRow
                      key={patient.id}
                      patient={patient}
                      selected={selectedRows.includes(patient.id)}
                      onSelect={() => handleSelectRow(patient.id)}
                      onView={() => setSelectedPatient(patient)}
                      onRefill={() => setShowRefillModal(patient)}
                      onMessage={() => setShowMessageModal(patient)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Pagination */}
            {!loading && patients.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      {showNewModal && (
        <NewPatientModal
          onClose={() => setShowNewModal(false)}
          onCreated={refresh}
        />
      )}

      {selectedPatient && (
        <PatientDetailDrawer
          patientId={selectedPatient.id}
          onClose={() => setSelectedPatient(null)}
        />
      )}

      {showRefillModal && (
        <RefillModal
          patient={showRefillModal}
          onClose={() => setShowRefillModal(null)}
        />
      )}

      {showMessageModal && (
        <MessageComposer
          patient={showMessageModal}
          onClose={() => setShowMessageModal(null)}
        />
      )}
    </div>
  );
}
