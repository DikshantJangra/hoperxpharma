"use client";
import { FiEdit2, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import PermissionMatrix from "./PermissionMatrix";

interface RoleDetailsProps {
  roleId: string;
}

export default function RoleDetails({ roleId }: RoleDetailsProps) {
  const roleData = {
    name: "Admin",
    description: "Full system access with all permissions",
    category: "System",
    usersAssigned: 2,
    lastModified: "2 days ago",
    status: "Active",
  };

  const assignedUsers = [
    { name: "Priya Singh", email: "priya@hope.com", status: "Active", assignedAt: "12 Jan" },
    { name: "Vikram Rao", email: "vikram@hope.com", status: "Active", assignedAt: "5 Jan" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Role Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{roleData.name}</h2>
            <p className="text-sm text-gray-600">{roleData.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <FiEdit2 size={16} />
              Edit Role
            </button>
            {roleData.category === "Custom" && (
              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <FiTrash2 size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Category</div>
            <div className="text-sm font-medium text-gray-900">{roleData.category}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Users Assigned</div>
            <div className="text-sm font-medium text-gray-900">{roleData.usersAssigned}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Last Modified</div>
            <div className="text-sm font-medium text-gray-900">{roleData.lastModified}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Status</div>
            <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
              {roleData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Permission Matrix */}
      <PermissionMatrix roleId={roleId} />

      {/* Assigned Users */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Assigned Users</h3>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm">
            Assign User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned At</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignedUsers.map((user, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{user.assignedAt}</td>
                  <td className="px-4 py-3">
                    <button className="text-sm text-red-600 hover:text-red-700">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
