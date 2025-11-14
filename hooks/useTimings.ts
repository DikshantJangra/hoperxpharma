import { useState, useEffect } from "react";

export function useTimings(storeId: string) {
  const [timings, setTimings] = useState<any>(null);
  const [draft, setDraft] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Load timings
  useEffect(() => {
    const mockTimings = {
      storeId,
      timezone: "Asia/Kolkata",
      weekly: {
        monday: [{ start: "09:00", end: "13:00" }, { start: "17:00", end: "20:00" }],
        tuesday: [{ start: "09:00", end: "13:00" }, { start: "17:00", end: "20:00" }],
        wednesday: [{ start: "09:00", end: "13:00" }, { start: "17:00", end: "20:00" }],
        thursday: [{ start: "09:00", end: "13:00" }, { start: "17:00", end: "20:00" }],
        friday: [{ start: "09:00", end: "13:00" }, { start: "17:00", end: "20:00" }],
        saturday: [{ start: "09:00", end: "14:00" }],
        sunday: []
      },
      exceptions: [
        {
          id: "exc_001",
          type: "holiday",
          startDate: "2025-08-15",
          endDate: "2025-08-15",
          hours: [],
          public: true,
          note: "Independence Day"
        }
      ],
      publishedAt: new Date().toISOString()
    };

    setTimings(mockTimings);
    setDraft(mockTimings);
  }, [storeId]);

  // Save draft
  const saveDraft = (newDraft: any) => {
    setDraft(newDraft);
    setIsDirty(true);
    setSaving(true);

    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      // Toast: Draft saved • Publish when ready
    }, 500);
  };

  // Publish draft
  const publishDraft = (reason?: string) => {
    setPublishing(true);

    // Simulate API call
    setTimeout(() => {
      setTimings(draft);
      setIsDirty(false);
      setPublishing(false);
      // Toast: Hours published • Audit #EVT-3402 created
      // Trigger webhook: store.timing.published
    }, 1500);
  };

  return {
    timings,
    draft,
    saveDraft,
    publishDraft,
    saving,
    publishing,
    isDirty
  };
}
