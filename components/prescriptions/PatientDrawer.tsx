import { FiX, FiPhone, FiMail, FiMapPin, FiClock } from "react-icons/fi"

export default function PatientDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-end z-50" onClick={onClose}>
      <div className="bg-white w-full max-w-md h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Patient Details</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <FiX size={20} className="text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
              JD
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-900">Anoop Jangra</div>
              <div className="text-sm text-gray-500">Patient ID: P-2025-00456</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <FiPhone className="text-gray-400" />
                <span className="text-gray-900">+1 234-567-8900</span>
              </div>
              <div className="flex items-center gap-3">
                <FiMail className="text-gray-400" />
                <span className="text-gray-900">anoop.jangra@email.com</span>
              </div>
              <div className="flex items-start gap-3">
                <FiMapPin className="text-gray-400 mt-0.5" />
                <span className="text-gray-900">123 Main Street, Apt 4B<br />New York, NY 10001</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Demographics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-500 mb-1">Age</div>
                <div className="text-gray-900">45 years</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Gender</div>
                <div className="text-gray-900">Male</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">DOB</div>
                <div className="text-gray-900">Jan 15, 1980</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Blood Type</div>
                <div className="text-gray-900">O+</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Allergies</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">Penicillin</span>
              <span className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">Sulfa drugs</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Chronic Conditions</h4>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="font-medium text-gray-900">Type 2 Diabetes</div>
                <div className="text-xs text-gray-500 mt-1">Diagnosed: 2018</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="font-medium text-gray-900">Hypertension</div>
                <div className="text-xs text-gray-500 mt-1">Diagnosed: 2020</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Insurance</h4>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Aetna Health Plus</span>
                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Active</span>
              </div>
              <div className="text-sm text-gray-600">
                <div>Policy #: AET-2025-789456</div>
                <div>Group #: GRP-12345</div>
                <div className="text-xs text-gray-500 mt-2">Valid until: Dec 31, 2025</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Prescriptions</h4>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">Metformin 500mg</span>
                  <span className="text-xs text-gray-500">30 days ago</span>
                </div>
                <div className="text-xs text-gray-500">Dr. Sarah Patel</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">Lisinopril 10mg</span>
                  <span className="text-xs text-gray-500">45 days ago</span>
                </div>
                <div className="text-xs text-gray-500">Dr. Michael Chen</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Access Log (HIPAA)</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="text-gray-900">Viewed by: Sarah Johnson</div>
                  <div className="text-gray-500">Action: Prescription fill</div>
                </div>
                <div className="text-gray-500">2h ago</div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="text-gray-900">Viewed by: Mike Davis</div>
                  <div className="text-gray-500">Action: Insurance verification</div>
                </div>
                <div className="text-gray-500">1d ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
