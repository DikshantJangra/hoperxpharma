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
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiInbox } from "react-icons/fi";

export default function PatientsListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { primaryStore } = useAuthStore();

  const {
    patients: searchResults,
    loading: searchLoading,
    error: searchError,
    search,
    refresh: refreshSearch
  } = usePatientSearch({ enableCache: true });

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
  const [showFilters, setShowFilters] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  usePatientHotkeys({
    onSearch: () => {
      const input = document.querySelector('input[type="search"]') as HTMLInputElement;
      input?.focus();
    },
    onQuickAdd: () => setShowQuickAdd(true),
    onEdit: () => {
      if (selectedRows.length === 1) {
        const patient = (searchQuery ? searchResults : listPatients).find(p => p.id === selectedRows[0]);
        if (patient) handleEditPatient(patient);
      }
    },
  });

  const patients = searchQuery ? searchResults : listPatients;
  const loading = searchQuery ? searchLoading : listLoading;
  const error = searchQuery ? searchError : listError;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    search(query);
  };

  React.useEffect(() => {
    if (searchParams?.get('openDrawer') === 'true') {
      handleNewPatient();
      window.history.replaceState({}, '', '/patients/list');
    }
  }, [searchParams]);

  const handleNewPatient = () => {
    setEditPatientData(null);
    setShowFormDrawer(true);
  };

  const handleEditPatient = (patient: any) => {
    setEditPatientData(patient);
    setShowFormDrawer(true);
  };

  const handlePatientSaved = () => {
    refreshSearch();
    refreshList();
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <ErrorBoundary>
      <div className="h-full flex flex-col bg-white overflow-hidden font-sans">
        <PatientsHeader
          search={searchQuery}
          onSearch={handleSearch}
          onNew={handleNewPatient}
          onToggleFilters={() => setShowFilters(!showFilters)}
          showFilters={showFilters}
          totalCount={patients.length}
        />

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
            <div className="flex-1 overflow-y-auto px-8 py-8">
              <div className="max-w-7xl mx-auto space-y-4">
                {/* Bulk Actions Bar */}
                <AnimatePresence>
                  {selectedRows.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mb-6"
                    >
                      <BulkActionsBar
                        selectedCount={selectedRows.length}
                        onClear={() => setSelectedRows([])}
                        onExport={() => { }}
                        onMessage={() => { }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* List Content */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                  {/* Sticky Table Header */}
                  <div className="hidden md:flex items-center gap-6 px-8 py-4 bg-gray-50/50 border-b border-gray-100 sticky top-0 z-20">
                    <div className="w-5 h-5" /> {/* Checkbox spacer */}
                    <div className="flex-1 min-w-[280px] text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Patient Identity
                    </div>
                    <div className="w-32 hidden lg:block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Status
                    </div>
                    <div className="w-40 hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Primary Contact
                    </div>
                    <div className="w-32 hidden xl:block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Last Visit
                    </div>
                    <div className="w-32 hidden 2xl:block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Avg Volume
                    </div>
                    <div className="flex-1 text-right pr-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Actions
                    </div>
                  </div>

                  {loading ? (
                    <div className="divide-y divide-gray-50">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-8 animate-pulse flex items-center gap-6">
                          <div className="w-10 h-10 bg-gray-100 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-1/4" />
                            <div className="h-3 bg-gray-50 rounded w-1/6" />
                          </div>
                          <div className="w-24 h-8 bg-gray-50 rounded-xl" />
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="p-16 text-center">
                      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FiInbox size={32} />
                      </div>
                      <h3 className="text-lg font-black text-gray-900 mb-2">Something went wrong</h3>
                      <p className="text-sm text-gray-500 mb-6">{error}</p>
                      <button
                        onClick={() => searchQuery ? refreshSearch() : refreshList()}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : patients.length === 0 ? (
                    <div className="p-20 text-center">
                      <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiInbox size={40} />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-2">No patients found</h3>
                      <p className="text-gray-500 mb-8 max-w-xs mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={handleNewPatient}
                          className="px-6 py-3 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-100"
                        >
                          Add New Patient
                        </button>
                        <button
                          onClick={() => setShowQuickAdd(true)}
                          className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Quick Add (F3)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {patients.map((patient) => (
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
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {!searchQuery && !loading && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 px-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      Showing Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="p-3 bg-white border border-gray-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-teal-50 hover:text-teal-600 transition-colors shadow-sm"
                      >
                        <FiChevronLeft size={20} />
                      </button>
                      <div className="flex items-center gap-1 mx-2">
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === i + 1
                              ? "bg-teal-600 text-white shadow-lg shadow-teal-100 scale-110"
                              : "text-gray-400 hover:text-gray-900"
                              }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="p-3 bg-white border border-gray-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-teal-50 hover:text-teal-600 transition-colors shadow-sm"
                      >
                        <FiChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Sidebar Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-80 border-l border-gray-100 bg-white overflow-y-auto"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Advanced Filters</h3>
                  </div>
                  <FiltersPanel filters={filters} onChange={setFilters} />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Modals & Drawers */}
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
            setSelectedPatient({ id: patientId });
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
