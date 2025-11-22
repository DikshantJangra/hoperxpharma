import React from "react";
import { FiX, FiPhone, FiMail, FiMapPin, FiAlertCircle, FiFileText } from "react-icons/fi";

interface PatientDetailDrawerProps {
  patientId: string;
  onClose: () => void;
}

export default function PatientDetailDrawer({ patientId, onClose }: PatientDetailDrawerProps) {
  const [loading, setLoading] = React.useState(true);
  const [patient, setPatient] = React.useState<any>(null);

  React.useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPatient({
        id: patientId,
        mrn: "-",
        name: "-",
        dob: "-",
        age: 0,
        sex: "-",
        primaryPhone: "-",
        email: "-",
        address: "-",
        allergies: [],
        activeMeds: [],
        lastVisit: "-",
        consent: { signed: false, signedAt: "-" }
      });
      setLoading(false);
    }, 500);
  }, [patientId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-end z-50">
      <div className="bg-white w-full max-w-2xl h-full shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{patient?.name || "Loading..."}</h2>
            <p className="text-sm text-gray-500 mt-1">{patient?.mrn}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={24} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading patient details...</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Age / DOB</p>
                  <p className="text-gray-900 mt-1">{patient.age} years • {new Date(patient.dob).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Sex</p>
                  <p className="text-gray-900 mt-1">{patient.sex === "M" ? "Male" : patient.sex === "F" ? "Female" : "Other"}</p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <FiPhone className="text-gray-400" />
                  <span className="text-gray-900">{patient.primaryPhone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FiMail className="text-gray-400" />
                  <span className="text-gray-900">{patient.email}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <FiMapPin className="text-gray-400 mt-0.5" />
                  <span className="text-gray-900">{patient.address}</span>
                </div>
              </div>
            </section>

            {/* Allergies */}
            {patient.allergies?.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiAlertCircle className="text-red-600" />
                  Allergies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((allergy: string) => (
                    <span key={allergy} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm">
                      {allergy}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Active Medications */}
            {patient.activeMeds?.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Medications</h3>
                <div className="space-y-2">
                  {patient.activeMeds.map((med: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FiFileText className="text-gray-400" />
                      <span className="text-sm text-gray-900">{med}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Last Visit */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
              <div className="text-sm">
                <p className="text-gray-500">Last Visit</p>
                <p className="text-gray-900 mt-1">
                  {new Date(patient.lastVisit).toLocaleDateString("en-IN", { 
                    day: "numeric", 
                    month: "long", 
                    year: "numeric" 
                  })}
                </p>
              </div>
            </section>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                New Sale
              </button>
              <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Edit Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
