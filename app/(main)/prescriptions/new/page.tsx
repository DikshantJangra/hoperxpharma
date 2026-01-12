'use client';

import { useRouter } from 'next/navigation';
import PrescriptionForm from '../components/PrescriptionForm';
import { prescriptionApi } from '@/lib/api/prescriptions';

export default function NewPrescriptionPage() {
  const router = useRouter();

  const handleCreatePrescription = async (formData: any) => {
    // The API client should handle FormData correctly if it's passed as creating body
    // If your apiClient forces JSON, you might need to adjust content-type headers
    const response = await prescriptionApi.createPrescription(formData);
    return response;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">New Prescription</h1>
          <p className="text-xs text-gray-500 mt-0.5">Create a new prescription for a patient</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex-1 overflow-hidden">
        <PrescriptionForm
          onSubmit={handleCreatePrescription}
          onCancel={() => router.push('/prescriptions')}
        />
      </div>
    </div>
  );
}
