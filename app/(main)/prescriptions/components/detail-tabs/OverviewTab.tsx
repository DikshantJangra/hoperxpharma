'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FiUser, FiCalendar, FiFileText, FiMapPin, FiAlertCircle,
  FiRefreshCw, FiClock, FiActivity, FiPackage, FiTag
} from 'react-icons/fi';

interface OverviewTabProps {
  prescription: any;
}

export default function OverviewTab({ prescription }: OverviewTabProps) {
  const patient = prescription?.patient;
  const prescriber = prescription?.prescriber;
  const clinicalNotes = prescription?.versions?.[0]?.instructions;

  // Count valid refills - refills that have been dispensed (FULLY_USED or PARTIALLY_USED)
  const validRefills = prescription?.refills?.filter((r: any) =>
    r.status === 'FULLY_USED' || r.status === 'PARTIALLY_USED' || 
    r.items?.some((item: any) => item.dispensedAt)
  ) || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      VERIFIED: 'bg-green-100 text-green-800',
      DISPENSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800',
      ON_HOLD: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      ROUTINE: 'text-gray-600',
      URGENT: 'text-orange-600',
      STAT: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FiPackage className="h-4 w-4" />
              <span className="text-xs font-medium">Medications</span>
            </div>
            <p className="text-2xl font-bold">{prescription?.items?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FiRefreshCw className="h-4 w-4" />
              <span className="text-xs font-medium">Refills</span>
            </div>
            <p className="text-2xl font-bold">{validRefills.length}/{prescription?.totalRefills || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FiFileText className="h-4 w-4" />
              <span className="text-xs font-medium">Documents</span>
            </div>
            <p className="text-2xl font-bold">{prescription?.files?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FiActivity className="h-4 w-4" />
              <span className="text-xs font-medium">Version</span>
            </div>
            <p className="text-2xl font-bold">v{prescription?.currentVersion || 1}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiUser className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Patient Information</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                <p className="text-base font-semibold text-gray-900 mt-1">{patient?.firstName} {patient?.lastName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                  <p className="text-sm text-gray-900 mt-1">{patient?.phoneNumber || 'Not provided'}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender</label>
                  <p className="text-sm text-gray-900 mt-1">{patient?.gender || 'Not specified'}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of Birth</label>
                <p className="text-sm text-gray-900 mt-1">
                  {patient?.dateOfBirth
                    ? new Date(patient.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Not provided'
                  }
                  {patient?.dateOfBirth && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years old)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prescription Details */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg">
                <FiFileText className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Prescription Details</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prescription Number</label>
                <p className="text-sm font-mono font-semibold text-gray-900 mt-1">{prescription?.prescriptionNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prescription?.status)}`}>
                      {prescription?.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
                  <p className={`text-sm font-semibold mt-1 ${getPriorityColor(prescription?.priority)}`}>
                    {prescription?.priority || 'ROUTINE'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</label>
                  <p className="text-sm text-gray-900 mt-1">{prescription?.source || 'WALK_IN'}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {prescription?.createdAt
                      ? new Date(prescription.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prescriber Information */}
        {prescriber && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FiMapPin className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold">Prescriber Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    Dr. {prescriber?.firstName} {prescriber?.lastName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">License Number</label>
                    <p className="text-sm font-mono text-gray-900 mt-1">{prescriber?.licenseNumber || 'Not provided'}</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</label>
                    <p className="text-sm text-gray-900 mt-1">{prescriber?.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>

                {prescriber?.specialty && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Specialty</label>
                    <p className="text-sm text-gray-900 mt-1">{prescriber.specialty}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Refill Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiRefreshCw className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-semibold">Refill Information</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-lg font-bold text-gray-900">
                    {prescription?.totalRefills > 0 ? 'Repeat (Refillable)' : 'One-Time Only'}
                  </p>
                </div>
                <Badge variant="outline" className={prescription?.totalRefills > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600'}>
                  {prescription?.totalRefills > 0 ? `${prescription.totalRefills} Refills Allowed` : 'No Refills'}
                </Badge>
              </div>

              {prescription?.totalRefills > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <label className="text-xs font-medium text-green-700">Dispensed</label>
                      <p className="text-2xl font-bold text-green-700">{validRefills.length}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <label className="text-xs font-medium text-blue-700">Remaining</label>
                      <p className="text-2xl font-bold text-blue-700">{Math.max(0, prescription.totalRefills - validRefills.length)}</p>
                    </div>
                  </div>

                  {validRefills.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <label className="text-sm font-medium text-gray-500">Last Refill Date</label>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(validRefills[validRefills.length - 1].processedAt || validRefills[validRefills.length - 1].createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-100">
                    💡 Check <span className="font-semibold text-blue-600">Refills Tab</span> for detailed per-medication limits and history.
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clinical Notes */}
      {clinicalNotes && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiAlertCircle className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Clinical Notes</h3>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{clinicalNotes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiTag className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Metadata</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="text-xs font-medium text-gray-500">Created At</label>
              <p className="text-sm">
                {prescription?.createdAt
                  ? new Date(prescription.createdAt).toLocaleString()
                  : 'N/A'
                }
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Last Updated</label>
              <p className="text-sm">
                {prescription?.updatedAt
                  ? new Date(prescription.updatedAt).toLocaleString()
                  : 'N/A'
                }
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Prescription ID</label>
              <p className="text-xs font-mono text-gray-600">{prescription?.id?.slice(0, 12)}...</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Store ID</label>
              <p className="text-xs font-mono text-gray-600">{prescription?.storeId?.slice(0, 12)}...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}