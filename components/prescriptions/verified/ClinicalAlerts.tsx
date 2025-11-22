'use client';

import { FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';

const AlertSkeleton = () => (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
        <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded-full mt-0.5 shrink-0"></div>
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-full"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
        </div>
    </div>
)

export default function ClinicalAlerts({ flags, isLoading }: any) {
  if (isLoading) {
    return (
        <div className="space-y-2">
            <AlertSkeleton/>
            <AlertSkeleton/>
        </div>
    )
  }

  if (!flags.allergyMatches?.length && !flags.interactions?.length && !flags.doseOutOfRange?.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      {flags.allergyMatches?.length > 0 && (
        <div className="p-4 bg-[#fee2e2] border border-[#fecaca] rounded-lg">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-[#991b1b] mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-[#991b1b] mb-1">Critical: Allergy Match Detected</h4>
              <p className="text-sm text-[#991b1b]">
                Patient is allergic to Penicillin. Amoxicillin (line 2) contains Penicillin.
              </p>
              <p className="text-sm text-[#991b1b] mt-2 font-medium">
                Action required: Override with PIN or request clarification from prescriber.
              </p>
            </div>
          </div>
        </div>
      )}

      {flags.interactions?.length > 0 && (
        <div className="p-4 bg-[#fef3c7] border border-[#fde68a] rounded-lg">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="w-5 h-5 text-[#92400e] mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-[#92400e] mb-1">High: Drug Interaction</h4>
              <p className="text-sm text-[#92400e]">
                Interaction detected between medications. Review recommended.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
