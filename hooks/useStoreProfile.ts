"use client";
// Hook for store profile management

import { useState, useEffect, useCallback } from "react";
import { storesApi, Store } from "@/lib/api/stores";
import toast from "react-hot-toast";

export interface StoreProfileState {
  id: string;
  code: string;
  name: string;
  displayName: string;
  logoUrl: string;
  brandColor: string;
  primaryContact: {
    name: string;
    role: string;
    phone: string;
    phoneVerified: boolean;
    email: string;
    emailVerified: boolean;
    whatsapp?: string;
  };
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    landmark?: string;
  };
  gst: {
    gstin: string;
    verified: boolean;
  };
  licenses: {
    dlNumber: string;
  };
  bank: {
    last4: string;
    ifsc: string;
    settlement: string;
  };
  businessType: string;
  taxMode: string;
  timezone: string;
  locale: string;
  currency: string;
  publicProfile: boolean;
  kycStatus: string;
  lastUpdated: string;
  lastUpdatedBy: { id: string; name: string };
  operations: {
    is24x7: boolean;
    homeDelivery: boolean;
  };
}

export function useStoreProfile(storeId: string) {
  const [profile, setProfile] = useState<StoreProfileState | null>(null);
  const [draftProfile, setDraftProfile] = useState<StoreProfileState | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<any>({});
  const [isDirty, setIsDirty] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  // Load profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        let storeData: Store;

        if (storeId === "store_01" || !storeId) {
          storeData = await storesApi.getMyStore();
        } else {
          storeData = await storesApi.getStoreById(storeId);
        }

        if (!storeData) {
          throw new Error("Store not found");
        }

        const mappedProfile: StoreProfileState = {
          id: storeData.id,
          code: "-", // Not in API yet
          name: storeData.name,
          displayName: storeData.displayName || "",
          logoUrl: storeData.logoUrl || "",
          brandColor: "#0ea5a3", // Default
          primaryContact: {
            name: "-", // Not in store record directly
            role: "Owner",
            phone: storeData.phoneNumber,
            phoneVerified: true,
            email: storeData.email || "",
            emailVerified: !!storeData.email,
            whatsapp: storeData.whatsapp || ""
          },
          address: {
            line1: storeData.addressLine1,
            line2: storeData.addressLine2 || "",
            city: storeData.city,
            state: storeData.state,
            postalCode: storeData.pinCode,
            country: "IN",
            landmark: storeData.landmark || ""
          },
          gst: {
            gstin: storeData.gstin || "",
            verified: !!storeData.gstin
          },
          licenses: {
            dlNumber: storeData.dlNumber || ""
          },
          bank: {
            last4: "-",
            ifsc: "-",
            settlement: "-"
          },
          businessType: storeData.businessType || "pharmacy",
          taxMode: "inclusive",
          timezone: "Asia/Kolkata",
          locale: "en-IN",
          currency: "INR",
          publicProfile: true,
          kycStatus: "verified", // Assuming verified for now
          lastUpdated: storeData.createdAt, // Using createdAt as proxy for now
          lastUpdatedBy: { id: "-", name: "-" },
          operations: {
            is24x7: storeData.is24x7 || false,
            homeDelivery: storeData.homeDelivery || false
          }
        };

        setProfile(mappedProfile);
        setDraftProfile(mappedProfile);
      } catch (error) {
        console.error("Failed to fetch store profile:", error);
        toast.error("Failed to load store profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [storeId]);

  // Update field
  const updateField = useCallback((field: string, value: any) => {
    setDraftProfile((prev: any) => {
      if (!prev) return null;

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
  }, []);

  const toggleEdit = () => {
    if (isEditing) {
      // Cancel editing - revert to profile
      setDraftProfile(profile);
      setErrors({});
    }
    setIsEditing(!isEditing);
  };

  // Save
  const save = async () => {
    if (!draftProfile || !profile) return;

    // Validate
    const newErrors: any = {};
    if (!draftProfile.name || draftProfile.name.length < 3) {
      newErrors.name = "Store name must be at least 3 characters";
    }
    if (!draftProfile.primaryContact.phone) {
      newErrors["primaryContact.phone"] = "Phone number is required";
    }
    if (!draftProfile.address.line1) {
      newErrors["address.line1"] = "Address is required";
    }
    if (!draftProfile.address.city) {
      newErrors["address.city"] = "City is required";
    }
    if (!draftProfile.address.state) {
      newErrors["address.state"] = "State is required";
    }
    if (!draftProfile.address.postalCode) {
      newErrors["address.postalCode"] = "PIN Code is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix validation errors");
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      // Map back to API structure
      const updateData: Partial<Store> = {
        name: draftProfile.name,
        displayName: draftProfile.displayName,
        phoneNumber: draftProfile.primaryContact.phone,
        email: draftProfile.primaryContact.email,
        whatsapp: draftProfile.primaryContact.whatsapp,
        addressLine1: draftProfile.address.line1,
        addressLine2: draftProfile.address.line2,
        city: draftProfile.address.city,
        state: draftProfile.address.state,
        pinCode: draftProfile.address.postalCode,
        landmark: draftProfile.address.landmark,
        gstin: draftProfile.gst.gstin,
        dlNumber: draftProfile.licenses.dlNumber,
        businessType: draftProfile.businessType,
        is24x7: draftProfile.operations.is24x7,
        homeDelivery: draftProfile.operations.homeDelivery,
        logoUrl: draftProfile.logoUrl
      };

      const updatedStore = await storesApi.updateStore(profile.id, updateData);

      // Update local state with returned data (or just keep draft)
      setProfile(draftProfile);
      setIsDirty(false);
      setIsEditing(false); // Exit edit mode
      toast.success("Store profile updated successfully");
    } catch (error) {
      console.error("Failed to update store:", error);
      toast.error("Failed to update store profile");
    } finally {
      setSaving(false);
    }
  };

  // Undo
  const undo = () => {
    setDraftProfile(profile);
    setIsDirty(false);
    setErrors({});
    setIsEditing(false);
  };

  return {
    profile,
    draftProfile,
    updateField,
    save,
    saving,
    loading,
    isDirty,
    undo,
    errors,
    isEditing,
    toggleEdit
  };
}
