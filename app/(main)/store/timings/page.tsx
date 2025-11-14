"use client";

import React from "react";
import TimingsHeader from "@/components/store/timings/TimingsHeader";
import WeeklyEditor from "@/components/store/timings/WeeklyEditor";
import ExceptionsList from "@/components/store/timings/ExceptionsList";
import PreviewCard from "@/components/store/timings/PreviewCard";
import TodayCard from "@/components/store/timings/TodayCard";
import MiniCalendar from "@/components/store/timings/MiniCalendar";
import AuditList from "@/components/store/timings/AuditList";
import AddExceptionModal from "@/components/store/timings/AddExceptionModal";
import PublishModal from "@/components/store/timings/PublishModal";
import { useTimings } from "@/hooks/useTimings";

export default function TimingsPage() {
  const { timings, draft, saveDraft, publishDraft, saving, publishing, isDirty } = useTimings("store_01");
  const [showAddException, setShowAddException] = React.useState(false);
  const [showPublish, setShowPublish] = React.useState(false);

  const handleUpdateWeekly = (weekly: any) => {
    saveDraft({ ...draft, weekly });
  };

  const handleUpdateExceptions = (exceptions: any[]) => {
    saveDraft({ ...draft, exceptions });
  };

  const handleAddException = (exception: any) => {
    const newExceptions = [...(draft?.exceptions || timings?.exceptions || []), exception];
    saveDraft({ ...draft, exceptions: newExceptions });
    setShowAddException(false);
  };

  const handlePublish = (reason?: string) => {
    publishDraft(reason);
    setShowPublish(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <TimingsHeader
        timezone={timings?.timezone}
        isDirty={isDirty}
        saving={saving}
        onPublish={() => setShowPublish(true)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Editor */}
          <div className="col-span-8 space-y-6">
            {/* Weekly Schedule */}
            <WeeklyEditor
              weekly={draft?.weekly || timings?.weekly}
              onChange={handleUpdateWeekly}
            />

            {/* Exceptions & Holidays */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Exceptions & Holidays</h2>
                <button
                  onClick={() => setShowAddException(true)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                >
                  + Add Exception
                </button>
              </div>
              <ExceptionsList
                exceptions={draft?.exceptions || timings?.exceptions || []}
                onChange={handleUpdateExceptions}
              />
            </div>
          </div>

          {/* Right Column - Preview & Actions */}
          <aside className="col-span-4 space-y-6">
            <TodayCard timings={draft || timings} />
            <PreviewCard timings={draft || timings} />
            <MiniCalendar exceptions={draft?.exceptions || timings?.exceptions || []} />
            <AuditList storeId="store_01" />
          </aside>
        </div>
      </div>

      {/* Modals */}
      {showAddException && (
        <AddExceptionModal
          onClose={() => setShowAddException(false)}
          onCreate={handleAddException}
        />
      )}

      {showPublish && (
        <PublishModal
          onClose={() => setShowPublish(false)}
          onPublish={handlePublish}
          publishing={publishing}
        />
      )}
    </div>
  );
}
