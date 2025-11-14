import { FiPlus, FiCheckCircle } from "react-icons/fi";

export default function ConsentCard({ consents, onChange }: any) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Consents</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          <FiPlus size={16} className="inline mr-1" />Add
        </button>
      </div>
      
      <div className="space-y-3">
        {consents.length === 0 ? (
          <p className="text-sm text-gray-500">No consents recorded</p>
        ) : (
          consents.map((consent: any) => (
            <div key={consent.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <FiCheckCircle className="text-green-500 mt-0.5" size={16} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{consent.type}</p>
                <p className="text-xs text-gray-500">{consent.method} • {new Date(consent.signedAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
