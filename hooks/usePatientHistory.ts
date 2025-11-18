import { useState, useEffect, useMemo } from "react";

export interface HistoryEvent {
  eventId: string;
  patientId: string;
  type: "PRESCRIPTION_CREATED" | "PRESCRIPTION_VERIFIED" | "DISPENSE" | "INVOICE" | "VISIT" | "LAB_RESULT" | "DOCUMENT_UPLOAD" | "CONSENT" | "MESSAGE" | "NOTE" | "CLINICAL_FLAG";
  subType?: string;
  title: string;
  summary: string;
  timestamp: string;
  actor: { id: string; name: string; role: string };
  payload: any;
  sensitive: boolean;
  tags: string[];
  related: Array<{ type: string; id: string; path: string }>;
  auditEventId: string;
  meta: { deviceId?: string; ip?: string; userAgent?: string };
}

export interface HistoryFilters {
  from?: string;
  to?: string;
  types: string[];
  actor?: string;
  search: string;
  tags: string[];
}

export interface HistoryGroup {
  date: string;
  count: number;
  items: HistoryEvent[];
}

export function usePatientHistory(patientId: string) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);
  const [filters, setFilters] = useState<HistoryFilters>({
    types: [],
    search: "",
    tags: []
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const groups = useMemo(() => {
    const grouped = events.reduce((acc, event) => {
      const date = new Date(event.timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, HistoryEvent[]>);

    return Object.entries(grouped)
      .map(([date, items]) => ({ date, count: items.length, items }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events]);

  useEffect(() => {
    loadHistory();
  }, [patientId, filters, page]);

  const loadHistory = async () => {
    setLoading(true);
    
    // Mock comprehensive data
    setTimeout(() => {
      const mockEvents: HistoryEvent[] = [
        {
          eventId: "evt_001",
          patientId,
          type: "PRESCRIPTION_CREATED",
          subType: "e-rx",
          title: "Prescription created — Dr. Kumar",
          summary: "Paracetamol 500mg x 15; Amoxicillin 250mg x 10",
          timestamp: "2025-01-15T10:12:00Z",
          actor: { id: "u_reception1", name: "Reception1", role: "reception" },
          payload: { prescriptionId: "rx_001", itemCount: 2 },
          sensitive: true,
          tags: ["prescription", "initial"],
          related: [{ type: "PRESCRIPTION", id: "rx_001", path: "/prescriptions/rx_001" }],
          auditEventId: "audit_001",
          meta: { deviceId: "dev_kiosk1", ip: "192.168.1.10" }
        },
        {
          eventId: "evt_002",
          patientId,
          type: "PRESCRIPTION_VERIFIED",
          title: "Verified by Pharmacist Aman",
          summary: "Clinical review completed - no interactions found",
          timestamp: "2025-01-15T10:25:00Z",
          actor: { id: "u_aman", name: "Aman", role: "pharmacist" },
          payload: { verificationStatus: "approved", clinicalAlerts: [] },
          sensitive: false,
          tags: ["verification", "approved"],
          related: [{ type: "PRESCRIPTION", id: "rx_001", path: "/prescriptions/rx_001" }],
          auditEventId: "audit_002",
          meta: { deviceId: "dev_pos1" }
        },
        {
          eventId: "evt_003",
          patientId,
          type: "DISPENSE",
          title: "Dispensed by Aman (Packed)",
          summary: "Batch B-2025-01 qty 15, expiry 2026-06-01",
          timestamp: "2025-01-15T11:00:00Z",
          actor: { id: "u_aman", name: "Aman", role: "pharmacist" },
          payload: { batchNumber: "B-2025-01", quantity: 15, expiry: "2026-06-01" },
          sensitive: false,
          tags: ["dispense", "packed"],
          related: [{ type: "PRESCRIPTION", id: "rx_001", path: "/prescriptions/rx_001" }],
          auditEventId: "audit_003",
          meta: { deviceId: "dev_pos1" }
        },
        {
          eventId: "evt_004",
          patientId,
          type: "INVOICE",
          title: "Invoice #INV-12345 • Paid",
          summary: "Total ₹365 • Paid by UPI",
          timestamp: "2025-01-15T11:05:00Z",
          actor: { id: "u_reception1", name: "Reception1", role: "reception" },
          payload: { invoiceId: "INV-12345", amount: 365, paymentMethod: "UPI" },
          sensitive: false,
          tags: ["invoice", "paid"],
          related: [{ type: "INVOICE", id: "INV-12345", path: "/invoices/INV-12345" }],
          auditEventId: "audit_004",
          meta: { deviceId: "dev_kiosk1" }
        },
        {
          eventId: "evt_005",
          patientId,
          type: "MESSAGE",
          title: "WhatsApp message to patient - Pickup ready",
          summary: "Your prescription is ready for pickup. Store hours: 9 AM - 9 PM",
          timestamp: "2025-01-15T11:10:00Z",
          actor: { id: "system", name: "System", role: "system" },
          payload: { channel: "whatsapp", messageId: "msg_001", status: "delivered" },
          sensitive: true,
          tags: ["message", "notification"],
          related: [],
          auditEventId: "audit_005",
          meta: { deviceId: "server" }
        }
      ];

      setEvents(prev => page === 1 ? mockEvents : [...prev, ...mockEvents]);
      setHasMore(page < 3);
      setLoading(false);
    }, 300);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const selectEvent = (event: HistoryEvent | null) => {
    setSelectedEvent(event);
    if (event) {
      // Telemetry
      console.log('patient.history.event_open', { eventId: event.eventId, patientId });
    }
  };

  return {
    events: { groups, raw: events },
    loading,
    selectedEvent,
    selectEvent,
    filters,
    setFilters,
    loadMore,
    hasMore
  };
}