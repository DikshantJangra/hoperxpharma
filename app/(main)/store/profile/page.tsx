"use client";

import React from "react";
import { FiSave, FiRotateCcw, FiDownload, FiClock, FiAlertCircle } from "react-icons/fi";
import StoreHeader from "@/components/store/profile/StoreHeader";
import IdentityCard from "@/components/store/profile/IdentityCard";
import ContactCard from "@/components/store/profile/ContactCard";
import TaxCard from "@/components/store/profile/TaxCard";
import BankCard from "@/components/store/profile/BankCard";
import BusinessCard from "@/components/store/profile/BusinessCard";
import InvoicePreview from "@/components/store/profile/InvoicePreview";
import KycStatus from "@/components/store/profile/KycStatus";
import AuditTimeline from "@/components/store/profile/AuditTimeline";
import QuickActions from "@/components/store/profile/QuickActions";
import ExportProfileModal from "@/components/store/profile/ExportProfileModal";
import { useStoreProfile } from "@/hooks/useStoreProfile";

export default function StoreProfilePage() {
  const { profile, draftProfile, updateField, save, saving, isDirty, undo, errors } = useStoreProfile("store_01");
  const [showExport, setShowExport] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <StoreHeader
        name={draftProfile?.name}
        lastUpdated={profile?.lastUpdated}
        lastUpdatedBy={profile?.lastUpdatedBy}
        onSave={save}
        onUndo={undo}
        onExport={() => setShowExport(true)}
        saving={saving}
        isDirty={isDirty}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Forms */}
          <div className="col-span-8 space-y-6">
            <IdentityCard
              profile={draftProfile}
              onChange={updateField}
              errors={errors}
            />
            <ContactCard
              profile={draftProfile}
              onChange={updateField}
              errors={errors}
            />
            <TaxCard
              profile={draftProfile}
              onChange={updateField}
              errors={errors}
            />
            <BankCard
              profile={draftProfile}
              onChange={updateField}
            />
            <BusinessCard
              profile={draftProfile}
              onChange={updateField}
            />
          </div>

          {/* Right Column - Preview & Actions */}
          <aside className="col-span-4 space-y-6">
            <InvoicePreview profile={draftProfile} />
            <KycStatus status={profile?.kycStatus} storeId={profile?.id} />
            <QuickActions storeId={profile?.id} />
            <AuditTimeline storeId={profile?.id} />
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
