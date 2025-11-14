import { FiUpload, FiFile } from "react-icons/fi";

export default function DocumentsCard({ docs, onUpload }: any) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
      </div>
      
      <div className="space-y-3">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer">
          <FiUpload className="mx-auto text-gray-400 mb-2" size={24} />
          <p className="text-sm text-gray-600">Upload Aadhaar/License/Prescription</p>
          <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG</p>
        </div>

        {docs.map((doc: any) => (
          <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FiFile className="text-gray-400" size={16} />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{doc.name}</p>
              <p className="text-xs text-gray-500">{doc.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
