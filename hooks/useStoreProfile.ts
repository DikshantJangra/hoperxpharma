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
      code: "HOPRX001",
      name: "HopeRx Pharmacy",
      displayName: "HopeRx - Pahalgam",
      logoUrl: "",
      brandColor: "#0ea5a3",
      primaryContact: {
        name: "Aman Verma",
        role: "Owner",
        phone: "+919812345678",
        phoneVerified: true,
        email: "aman@hope.com",
        emailVerified: true
      },
      address: {
        line1: "12 Market Road",
        line2: "Near Temple",
        city: "Pahalgam",
        state: "Jammu & Kashmir",
        postalCode: "192123",
        country: "IN"
      },
      gst: {
        gstin: "07ABCDE1234F1Z5",
        verified: true
      },
      bank: {
        last4: "4321",
        ifsc: "HDFC0001234",
        settlement: "T+1"
      },
      businessType: "pharmacy",
      taxMode: "inclusive",
      timezone: "Asia/Kolkata",
      locale: "en-IN",
      currency: "INR",
      publicProfile: true,
      kycStatus: "verified",
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: { id: "u_aman", name: "Aman Verma" }
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
