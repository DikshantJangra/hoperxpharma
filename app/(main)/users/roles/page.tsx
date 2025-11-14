"use client";
import { useState } from "react";
import { FiPlus, FiCheckCircle, FiUsers, FiShield } from "react-icons/fi";
import RoleSidebar from "@/components/users/roles/RoleSidebar";
import RoleDetails from "@/components/users/roles/RoleDetails";
import CreateRoleDrawer from "@/components/users/roles/CreateRoleDrawer";

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState("admin");
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-sm text-gray-500 mt-1">
              Control what each staff member can see and do across HopeRxPharma
            </p>
          </div>
          <button
            onClick={() => setShowCreateDrawer(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <FiPlus size={18} />
            Create Role
          </button>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FiShield size={16} className="text-gray-600" />
            <span className="text-sm text-gray-600">Total Roles:</span>
            <span className="text-sm font-medium text-gray-900">7</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">System:</span>
            <span className="text-sm font-medium text-gray-900">5</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Custom:</span>
            <span className="text-sm font-medium text-gray-900">2</span>
          </div>
          <div className="flex items-center gap-2">
            <FiUsers size={16} className="text-gray-600" />
            <span className="text-sm text-gray-600">Users Assigned:</span>
            <span className="text-sm font-medium text-gray-900">13</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCheckCircle size={16} className="text-green-600" />
            <span className="text-sm text-green-600">Access Safety: Healthy</span>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Role Sidebar */}
        <RoleSidebar selectedRole={selectedRole} onSelectRole={setSelectedRole} />

        {/* Right: Role Details */}
        <div className="flex-1 overflow-auto">
          <RoleDetails roleId={selectedRole} />
        </div>
      </div>

      {/* Create Role Drawer */}
      {showCreateDrawer && <CreateRoleDrawer onClose={() => setShowCreateDrawer(false)} />}
    </div>
  );
}
