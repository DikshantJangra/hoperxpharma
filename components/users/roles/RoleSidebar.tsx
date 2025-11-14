"use client";
import { FiShield, FiUsers } from "react-icons/fi";

interface RoleSidebarProps {
  selectedRole: string;
  onSelectRole: (roleId: string) => void;
}

const roles = {
  system: [
    { id: "admin", name: "Admin", users: 2 },
    { id: "pharmacist", name: "Pharmacist", users: 5 },
    { id: "cashier", name: "Cashier", users: 3 },
    { id: "auditor", name: "Auditor", users: 1 },
    { id: "owner", name: "Owner", users: 2 },
  ],
  custom: [
    { id: "inventory_manager", name: "Inventory Manager", users: 1 },
    { id: "billing_staff", name: "Billing Staff", users: 2 },
  ],
  templates: [
    { id: "basic_staff", name: "Basic Staff" },
    { id: "read_only", name: "Read-Only" },
    { id: "finance", name: "Finance" },
  ],
};

export default function RoleSidebar({ selectedRole, onSelectRole }: RoleSidebarProps) {
  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* System Roles */}
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase mb-2">
            <FiShield size={12} />
            System Roles
          </div>
          <div className="space-y-1">
            {roles.system.map((role) => (
              <button
                key={role.id}
                onClick={() => onSelectRole(role.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                  selectedRole === role.id
                    ? "bg-teal-100 text-teal-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{role.name}</span>
                <span className="text-xs bg-white px-2 py-0.5 rounded">{role.users}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Roles */}
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase mb-2">
            <FiUsers size={12} />
            Custom Roles
          </div>
          <div className="space-y-1">
            {roles.custom.map((role) => (
              <button
                key={role.id}
                onClick={() => onSelectRole(role.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                  selectedRole === role.id
                    ? "bg-teal-100 text-teal-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{role.name}</span>
                <span className="text-xs bg-white px-2 py-0.5 rounded">{role.users}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Permission Templates */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">Permission Templates</div>
          <div className="space-y-1">
            {roles.templates.map((template) => (
              <button
                key={template.id}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
