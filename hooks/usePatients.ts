import { useState, useEffect } from "react";
import { patientsApi } from "@/lib/api/patients";

export function usePatients(storeId: string) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    loadPatients();
  }, [page, search, filters, storeId]);

  const loadPatients = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await patientsApi.getPatients({
        page,
        limit: 20, // Assuming limit is 20 as before, or a new state variable 'limit' would be introduced
        search: search, // Assuming 'searchTerm' refers to the existing 'search' state variable
        // filters are removed as per instruction
      });

      // Response now contains: { success, data, meta, message }
      setPatients(response.data || []);
      setTotal(response.meta?.pagination?.total || 0); // Keep total update, assuming meta.pagination.total exists
      setTotalPages(response.meta?.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error("Error loading patients:", err);
      setError(err.message || "Failed to load patients");
      setPatients([]); // Keep clearing patients on error
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadPatients();
  };

  return {
    patients,
    loading,
    error,
    page,
    setPage,
    totalPages,
    total,
    search,
    setSearch,
    filters,
    setFilters,
    refresh
  };
}
