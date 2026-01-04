"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PatientsHeader from "@/components/patients/PatientsHeader";
import FiltersPanel from "@/components/patients/FiltersPanel";
import PatientRow from "@/components/patients/PatientRow";
import PatientFormDrawer from "@/components/patients/PatientFormDrawer";
import PatientDetailDrawer from "@/components/patients/PatientDetailDrawer";
import RefillModal from "@/components/patients/RefillModal";
import MessageComposer from "@/components/patients/MessageComposer";
import BulkActionsBar from "@/components/patients/BulkActionsBar";
import QuickAddModal from "@/components/patients/QuickAddModal";
import { usePatients } from "@/hooks/usePatients";
import { usePatientSearch } from "@/hooks/usePatientSearch";
import { usePatientHotkeys } from "@/hooks/usePatientHotkeys";
import { useAuthStore } from "@/lib/store/auth-store";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function PatientsListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { primaryStore } = useAuthStore();

  // Use local-first search hook
  const {
    patients: searchResults,
    loading: searchLoading,
    error: searchError,
    search,
    refresh: refreshSearch
  } = usePatientSearch({ enableCache: true });

  // Use original hook for pagination/filtering (fallback)
  const {
    patients: listPatients,
    loading: listLoading,
    error: listError,
    page,
    setPage,
    totalPages,
    filters,
    setFilters,
    refresh: refreshList
  } = usePatients(primaryStore?.id || "");

  const [selectedPatient, setSelectedPatient] = React.useState<any>(null);
  const [showFormDrawer, setShowFormDrawer] = React.useState(false);
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [editPatientData, setEditPatientData] = React.useState<any>(null);
  const [showRefillModal, setShowRefillModal] = React.useState<any>(null);
  const [showMessageModal, setShowMessageModal] = React.useState<any>(null);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [showFilters, setShowFilters] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Keyboard shortcuts
  usePatientHotkeys({
    onSearch: () => {
      const input = document.querySelector('input[type="search"]') as HTMLInputElement;
      input?.focus();
    },
    onQuickAdd: () => setShowQuickAdd(true),
    onEdit: () => {
      if (selectedRows.length === 1) {
        const patient = patients.find(p => p.id === selectedRows[0]);
        if (patient) handleEditPatient(patient);
      }
    },
  });

  // Determine which patients to show
  const patients = searchQuery ? searchResults : listPatients;
  const loading = searchQuery ? searchLoading : listLoading;
  const error = searchQuery ? searchError : listError;

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    search(query);
  };

  // Auto-open drawer if redirected from /patients/add
  React.useEffect(() => {
    if (searchParams.get('openDrawer') === 'true') {
      handleNewPatient();
      window.history.replaceState({}, '', '/patients/list');
    }
  }, [searchParams]);

  // Handle new patient
  const handleNewPatient = () => {
    setEditPatientData(null);
    setShowFormDrawer(true);
  };

  // Handle edit patient
  const handleEditPatient = (patient: any) => {
    setEditPatientData(patient);
    setShowFormDrawer(true);
  };

  // Handle patient saved
  const handlePatientSaved = () => {
    refreshSearch();
    refreshList();
  };

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
    <ErrorBoundary>
      <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0">
          <PatientsHeader
            search={searchQuery}
            onSearch={handleSearch}
            onNew={handleNewPatient}
            onToggleFilters={() => setShowFilters(!showFilters)}
            showFilters={showFilters}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="max-w-7xl mx-auto w-full px-6 py-6 flex gap-6 overflow-hidden">
            {/* Filters Sidebar - Fixed */}
            {showFilters && (
              <aside className="w-64 flex-shrink-0 overflow-y-auto">
                <FiltersPanel filters={filters} onChange={setFilters} />
              </aside>
            )}

            {/* Patient List - Scrollable */}
            <main className="flex-1 flex flex-col overflow-hidden">
              {/* Bulk Actions - Fixed */}
              {selectedRows.length > 0 && (
                <div className="flex-shrink-0 mb-4">
                  <BulkActionsBar
                    selectedCount={selectedRows.length}
                    onClear={() => setSelectedRows([])}
                    onExport={() => { }}
                    onMessage={() => { }}
                  />
                </div>
              )}

              {/* Table Container */}
              <div className="bg-white shadow-sm rounded-lg flex flex-col overflow-hidden flex-1">
                {/* Sticky Table Header */}
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider flex-shrink-0">
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

                {/* Scrollable Table Body */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading patients...</div>
                  ) : error ? (
                    <div className="p-8 text-center">
                      <p className="text-red-500 mb-2">{error}</p>
                      <button
                        onClick={() => searchQuery ? refreshSearch() : refreshList()}
                        className="text-sm text-teal-600 hover:text-teal-700"
                      >
                        Try again
                      </button>
                    </div>
                  ) : patients.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500 mb-2">No patients found.</p>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={handleNewPatient}
                          className="text-sm text-teal-600 hover:text-teal-700"
                        >
                          New Patient (Full)
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => setShowQuickAdd(true)}
                          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                        >
                          Quick Add (F3)
                        </button>
                      </div>
                    </div>
                  ) : (
                    patients.map((patient) => (
                      <PatientRow
                        key={patient.id}
                        patient={patient}
                        selected={selectedRows.includes(patient.id)}
                        onSelect={() => handleSelectRow(patient.id)}
                        onView={() => setSelectedPatient(patient)}
                        onEdit={() => handleEditPatient(patient)}
                        onRefill={() => setShowRefillModal(patient)}
                        onMessage={() => setShowMessageModal(patient)}
                      />
                    ))
                  )}
                </div>

                {/* Fixed Pagination Footer */}
                {!searchQuery && !loading && patients.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
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
              </div>
            </main>
          </div>
        </div>

        {/* Modals */}
        <PatientFormDrawer
          isOpen={showFormDrawer}
          onClose={() => setShowFormDrawer(false)}
          initialData={editPatientData}
          onSaved={handlePatientSaved}
        />

        <QuickAddModal
          isOpen={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          onSuccess={(patientId) => {
            refreshSearch();
            refreshList();
            // Open detail drawer for newly created patient
            const newPatient = { id: patientId };
            setSelectedPatient(newPatient);
          }}
        />

        {selectedPatient && (
          <PatientDetailDrawer
            patientId={selectedPatient.id}
            onClose={() => setSelectedPatient(null)}
            onEdit={(patient) => {
              setSelectedPatient(null);
              handleEditPatient(patient);
            }}
            onRefill={(patient) => {
              setSelectedPatient(null);
              setShowRefillModal(patient);
            }}
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
    </ErrorBoundary>
  );
}
