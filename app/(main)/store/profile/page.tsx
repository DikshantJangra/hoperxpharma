"use client";

import React from "react";
import { FiSave, FiRotateCcw, FiDownload, FiClock, FiAlertCircle, FiEdit2 } from "react-icons/fi";
import StoreHeader from "@/components/store/profile/StoreHeader";
import IdentityCard from "@/components/store/profile/IdentityCard";
import ContactCard from "@/components/store/profile/ContactCard";
import TaxCard from "@/components/store/profile/TaxCard";
import BankCard from "@/components/store/profile/BankCard";
import BusinessCard from "@/components/store/profile/BusinessCard";
import VisitingCard from "@/components/store/profile/VisitingCard";
import KycStatus from "@/components/store/profile/KycStatus";
import AuditTimeline from "@/components/store/profile/AuditTimeline";
import QuickActions from "@/components/store/profile/QuickActions";
import ExportProfileModal from "@/components/store/profile/ExportProfileModal";
import { useStoreProfile } from "@/hooks/useStoreProfile";

export default function StoreProfilePage() {
  const {
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
  } = useStoreProfile("store_01");

  const [showExport, setShowExport] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Store Profile</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your pharmacy's identity and settings</p>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setShowExport(true)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <FiDownload size={18} />
                  Export
                </button>
                <button
                  onClick={toggleEdit}
                  className="px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 flex items-center gap-2"
                >
                  <FiEdit2 size={18} />
                  Edit Profile
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleEdit}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSave size={18} />
                  )}
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Forms */}
          <div className="col-span-8 space-y-6">
            <IdentityCard
              profile={isEditing ? draftProfile : profile}
              onChange={updateField}
              errors={errors}
              isEditing={isEditing}
            />
            <ContactCard
              profile={isEditing ? draftProfile : profile}
              onChange={updateField}
              errors={errors}
              isEditing={isEditing}
            />
            <TaxCard
              profile={isEditing ? draftProfile : profile}
              onChange={updateField}
              errors={errors}
              isEditing={isEditing}
            />
            <BankCard
              profile={isEditing ? draftProfile : profile}
              onChange={updateField}
              isEditing={isEditing}
            />
            <BusinessCard
              profile={isEditing ? draftProfile : profile}
              onChange={updateField}
              isEditing={isEditing}
            />
          </div>

          {/* Right Column - Preview & Actions */}
          <aside className="col-span-4 space-y-6">
            <div className="sticky top-6 space-y-6">
              <VisitingCard profile={isEditing ? draftProfile : profile} />
              <KycStatus status={profile?.kycStatus} storeId={profile?.id} />
              <QuickActions storeId={profile?.id} />
              <AuditTimeline storeId={profile?.id} />
            </div>
          </aside>
        </div>
      </div>

      {/* Modals */}
      {showExport && (
        <ExportProfileModal
          storeId={profile?.id}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
