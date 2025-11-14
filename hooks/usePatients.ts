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
      const mockPatients = [
        {
          id: "p_001",
          mrn: "MRN-1001",
          name: "Riya Sharma",
          dob: "1988-04-02",
          age: 37,
          sex: "F",
          primaryPhone: "+919812345678",
          phoneVerified: true,
          maskedPhone: "+91-98****5678",
          lastVisit: "2025-11-10T14:20:00Z",
          allergies: ["Penicillin"],
          activeMedsCount: 3,
          pendingRefillsCount: 2,
          tags: ["chronic", "vip"]
        },
        {
          id: "p_002",
          mrn: "MRN-1002",
          name: "Amit Kumar",
          dob: "1975-08-15",
          age: 49,
          sex: "M",
          primaryPhone: "+919823456789",
          phoneVerified: false,
          maskedPhone: "+91-98****6789",
          lastVisit: "2025-10-25T10:15:00Z",
          allergies: [],
          activeMedsCount: 1,
          pendingRefillsCount: 0,
          tags: ["senior"]
        }
      ];

      setPatients(mockPatients);
      setTotalPages(5);
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
