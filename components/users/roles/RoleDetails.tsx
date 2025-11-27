"use client";
import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2, FiAlertTriangle, FiUsers, FiUserMinus } from "react-icons/fi";
import PermissionMatrix from "./PermissionMatrix";
import UserAssignmentModal from "./UserAssignmentModal";
import { rbacApi, Role } from "@/lib/api/rbac";

interface RoleDetailsProps {
  roleId: string;
  onEdit?: (role: any) => void;
  onDelete?: () => void;
}

interface AssignedUser {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedAt: string;
  store?: {
    id: string;
    name: string;
  };
}

export default function RoleDetails({ roleId, onEdit, onDelete }: RoleDetailsProps) {
  const [roleData, setRoleData] = useState<Role | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchRoleData = async () => {
    if (!roleId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [roleResponse, usersResponse] = await Promise.all([
        rbacApi.getRole(roleId),
        rbacApi.getUsersWithRole(roleId),
      ]);

      if (roleResponse.success) {
        setRoleData(roleResponse.data);
      }

      if (usersResponse.success) {
        setAssignedUsers(usersResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch role data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleData();
  }, [roleId, refreshKey]);

  const handleDelete = async () => {
    if (!roleData || deleting) return;

    try {
      setDeleting(true);
      const response = await rbacApi.deleteRole(roleData.id);

      if (response.success) {
        setShowDeleteConfirm(false);
        if (onDelete) onDelete();
      } else {
        alert(response.message || "Failed to delete role");
      }
    } catch (error: any) {
      console.error("Failed to delete role:", error);
      alert(error.message || "Failed to delete role");
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveUser = async (userId: string, userRoleId: string) => {
    if (!confirm("Are you sure you want to remove this user from the role?")) return;

    try {
      // Note: The API might expect userId and roleId, or userRoleId. 
      // Based on rbacApi.removeRole(userId, roleId), we need userId and roleId.
      // But we might need to pass storeId if it's store specific.
      // Let's assume global removal for now or check the API definition again.
      // rbacApi.removeRole definition: removeRole: (userId: string, roleId: string, storeId?: string)

      const userRole = assignedUsers.find(u => u.id === userRoleId);
      if (!userRole) return;

      await rbacApi.removeRole(userRole.userId, roleId, userRole.store?.id);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Failed to remove user:", error);
      alert("Failed to remove user from role");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 animate-pulse shadow-sm">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-100 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!roleData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="text-red-500" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Role Not Found</h3>
          <p className="text-gray-500">The requested role data could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Role Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-900">{roleData.name}</h2>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${roleData.builtIn
                ? "bg-blue-50 text-blue-700 border border-blue-100"
                : "bg-green-50 text-green-700 border border-green-100"
                }`}>
                {roleData.builtIn ? "System Role" : "Custom Role"}
              </span>
            </div>
            <p className="text-gray-600 text-lg">{roleData.description || "No description provided for this role."}</p>
          </div>
          <div className="flex items-center gap-3">
            {!roleData.builtIn && onEdit && (
              <button
                onClick={() => onEdit(roleData)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium shadow-sm"
              >
                <FiEdit2 size={16} />
                Edit Role
              </button>
            )}
            {!roleData.builtIn && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Role"
              >
                <FiTrash2 size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 pt-6 border-t border-gray-100">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Category</div>
            <div className="text-base font-medium text-gray-900 capitalize">
              {roleData.category || "General"}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Users Assigned</div>
            <div className="text-base font-medium text-gray-900">
              {roleData._count?.userRoles || assignedUsers.length || 0}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Last Modified</div>
            <div className="text-base font-medium text-gray-900">
              {new Date(roleData.updatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">ID</div>
            <div className="text-base font-medium text-gray-900 font-mono text-xs truncate" title={roleData.id}>
              {roleData.id}
            </div>
          </div>
        </div>
      </div>

      {/* Permission Matrix */}
      <PermissionMatrix roleId={roleId} />

      {/* Assigned Users */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">Assigned Users</h3>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <FiUsers size={16} />
            Assign User
          </button>
        </div>

        {assignedUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiUsers className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-500 font-medium">No users assigned to this role yet.</p>
            <p className="text-sm text-gray-400 mt-1">Assign users to give them these permissions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Store</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned At</th>
                  <th className="px-8 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignedUsers.map((userRole) => (
                  <tr key={userRole.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                          {userRole.user.firstName[0]}{userRole.user.lastName[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {userRole.user.firstName} {userRole.user.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-600">{userRole.user.email}</td>
                    <td className="px-8 py-4 text-sm text-gray-600">
                      {userRole.store?.name || <span className="text-gray-400 italic">Global</span>}
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-600">
                      {new Date(userRole.assignedAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button
                        onClick={() => handleRemoveUser(userRole.userId, userRole.id)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium hover:underline flex items-center justify-end gap-1 ml-auto"
                      >
                        <FiUserMinus size={14} />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all">
            <div className="flex items-start gap-5 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <FiAlertTriangle className="text-red-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Role?</h3>
                <p className="text-gray-600 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{roleData.name}"</span>?
                  This action cannot be undone.
                </p>
                {assignedUsers.length > 0 && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-lg">
                    <p className="text-sm text-orange-800 font-medium flex items-start gap-2">
                      <FiAlertTriangle className="mt-0.5 flex-shrink-0" />
                      <span>
                        This role is currently assigned to <strong>{assignedUsers.length} user(s)</strong>.
                        Deleting it will remove these assignments immediately.
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? "Deleting..." : "Delete Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Assignment Modal */}
      {showAssignModal && roleData && (
        <UserAssignmentModal
          roleId={roleId}
          roleName={roleData.name}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => setRefreshKey(prev => prev + 1)}
        />
      )}
    </div>
  );
}
