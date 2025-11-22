import { useState, useEffect } from "react";

export function useStoreProfile(storeId: string) {
  const [profile, setProfile] = useState<any>(null);
  const [draftProfile, setDraftProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isDirty, setIsDirty] = useState(false);

  // Load profile
  useEffect(() => {
    const mockProfile = {
      id: storeId,
      code: "-",
      name: "HopeRx Pharmacy",
      displayName: "-",
      logoUrl: "",
      brandColor: "#0ea5a3",
      primaryContact: {
        name: "-",
        role: "-",
        phone: "-",
        phoneVerified: false,
        email: "-",
        emailVerified: false
      },
      address: {
        line1: "-",
        line2: "-",
        city: "-",
        state: "-",
        postalCode: "-",
        country: "IN"
      },
      gst: {
        gstin: "-",
        verified: false
      },
      bank: {
        last4: "-",
        ifsc: "-",
        settlement: "-"
      },
      businessType: "pharmacy",
      taxMode: "inclusive",
      timezone: "Asia/Kolkata",
      locale: "en-IN",
      currency: "INR",
      publicProfile: true,
      kycStatus: "pending",
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: { id: "-", name: "-" }
    };

    setProfile(mockProfile);
    setDraftProfile(mockProfile);
  }, [storeId]);

  // Update field
  const updateField = (field: string, value: any) => {
    setDraftProfile((prev: any) => {
      const keys = field.split(".");
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      }
      // Nested update
      const [parent, child] = keys;
      return {
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      };
    });
    setIsDirty(true);
  };

  // Save
  const save = async () => {
    // Validate
    const newErrors: any = {};
    if (!draftProfile?.name || draftProfile.name.length < 3) {
      newErrors.name = "Store name must be at least 3 characters";
    }
    if (!draftProfile?.primaryContact?.phone) {
      newErrors.phone = "Phone number is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setErrors({});

    // Simulate API call
    setTimeout(() => {
      setProfile(draftProfile);
      setIsDirty(false);
      setSaving(false);
      // Show toast: Profile saved • Audit #EVT-2305 created
    }, 1500);
  };

  // Undo
  const undo = () => {
    setDraftProfile(profile);
    setIsDirty(false);
    setErrors({});
  };

  return {
    profile,
    draftProfile,
    updateField,
    save,
    saving,
    isDirty,
    undo,
    errors
  };
}
