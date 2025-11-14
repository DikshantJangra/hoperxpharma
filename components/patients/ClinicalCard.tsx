import { FiPlus, FiX } from "react-icons/fi";

export default function ClinicalCard({ value, onChange }: any) {
  const addAllergy = () => {
    const allergy = prompt("Enter allergy:");
    if (allergy) onChange({ ...value, allergies: [...value.allergies, allergy] });
  };

  const addCondition = () => {
    const condition = prompt("Enter chronic condition:");
    if (condition) onChange({ ...value, chronicConditions: [...value.chronicConditions, condition] });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinical Data</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={value?.weightKg || ""}
              onChange={(e) => onChange({ ...value, weightKg: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input
              type="number"
              value={value?.heightCm || ""}
              onChange={(e) => onChange({ ...value, heightCm: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
            <select
              value={value?.bloodGroup || ""}
              onChange={(e) => onChange({ ...value, bloodGroup: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="B+">B+</option>
              <option value="O+">O+</option>
              <option value="AB+">AB+</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {value?.allergies?.map((allergy: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                {allergy}
                <FiX size={14} className="cursor-pointer" onClick={() => onChange({ ...value, allergies: value.allergies.filter((_: any, idx: number) => idx !== i) })} />
              </span>
            ))}
          </div>
          <button onClick={addAllergy} className="flex items-center gap-2 text-sm text-blue-600">
            <FiPlus size={16} />Add allergy
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chronic Conditions</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {value?.chronicConditions?.map((condition: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                {condition}
                <FiX size={14} className="cursor-pointer" onClick={() => onChange({ ...value, chronicConditions: value.chronicConditions.filter((_: any, idx: number) => idx !== i) })} />
              </span>
            ))}
          </div>
          <button onClick={addCondition} className="flex items-center gap-2 text-sm text-blue-600">
            <FiPlus size={16} />Add condition
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
          <textarea
            value={value?.notes || ""}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            rows={3}
            placeholder="Patient prefers morning dosing..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
