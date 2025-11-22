import { useState, useEffect } from "react";

export function usePatients(storeId: string) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    loadPatients();
  }, [page, search, filters]);

  const loadPatients = () => {
    setLoading(true);
    
    // Mock data
    setTimeout(() => {
      setPatients([]);
      setTotalPages(0);
      setLoading(false);
    }, 500);
  };

  const refresh = () => {
    loadPatients();
  };

  return {
    patients,
    loading,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    filters,
    setFilters,
    refresh
  };
}
