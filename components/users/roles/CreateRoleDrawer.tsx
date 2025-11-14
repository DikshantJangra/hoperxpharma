"use client";
import { useState } from "react";
import { FiX, FiLock } from "react-icons/fi";

interface CreateRoleDrawerProps {
  onClose: () => void;
}

export default function CreateRoleDrawer({ onClose }: CreateRoleDrawerProps) {
  const [step, setStep] = useState(1);
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end z-50">
      <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Create New Role</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        {/* Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {s}
                </div>
                <span className={`text-sm ${step >= s ? "text-gray-900" : "text-gray-500"}`}>
                  {s === 1 && "Info"}
                  {s === 2 && "Permissions"}
                  {s === 3 && "Scope"}
                  {s === 4 && "Review"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Inventory Manager"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this role can do..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>Custom</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">💡 Quick Start</div>
                  <div className="text-xs">You can copy permissions from an existing role and customize them.</div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-12 text-gray-500">
              Permission selection interface would go here
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12 text-gray-500">
              Scope controls would go here
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-800">
                  <div className="font-medium mb-2">Review Your Role</div>
                  <div className="space-y-1 text-xs">
                    <div>Name: {roleName || "Not set"}</div>
                    <div>Permissions: 12 enabled</div>
                    <div>Scope: All stores</div>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiLock size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <div className="font-medium mb-1">Admin PIN Required</div>
                    <div className="text-xs">Creating a role requires admin PIN confirmation for security.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <button
            onClick={() => (step < 4 ? setStep(step + 1) : onClose())}
            disabled={step === 1 && !roleName.trim()}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 4 ? "Create Role" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
