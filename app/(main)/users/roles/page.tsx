"use client";
import { useState, useEffect } from "react";
import { FiPlus, FiCheckCircle, FiUsers, FiShield } from "react-icons/fi";
import RoleSidebar from "@/components/users/roles/RoleSidebar";
import RoleDetails from "@/components/users/roles/RoleDetails";
import CreateRoleDrawer from "@/components/users/roles/CreateRoleDrawer";
import { rbacApi, Role } from "@/lib/api/rbac";

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState("");
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    totalRoles: 0,
    systemRoles: 0,
    customRoles: 0,
    usersAssigned: 0,
  });
  const [loading, setLoading] = useState(true);

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await rbacApi.getRoles();
        if (response.success) {
          const roles: Role[] = response.data;
          const systemRoles = roles.filter((r) => r.builtIn);
          const customRoles = roles.filter((r) => !r.builtIn);
          const totalUsers = roles.reduce((sum, r) => sum + (r._count?.userRoles || 0), 0);

          setStats({
            totalRoles: roles.length,
            systemRoles: systemRoles.length,
            customRoles: customRoles.length,
            usersAssigned: totalUsers,
          });

          // Set first role as selected if none selected
          if (!selectedRole && roles.length > 0) {
            setSelectedRole(roles[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch role stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [refreshKey]);

  const handleEditRole = (role: any) => {
    setEditingRole(role);
    setShowCreateDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowCreateDrawer(false);
    setEditingRole(null);
  };

  const handleSuccess = () => {
    refreshData();
    handleCloseDrawer();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 flex-shrink-0 shadow-sm z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Roles & Permissions</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage access levels and permissions for your staff members
            </p>
          </div>
          <button
            onClick={() => setShowCreateDrawer(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm font-medium"
          >
            <FiPlus size={20} />
            Create New Role
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-md shadow-sm text-gray-600">
              <FiShield size={18} />
            </div>
            <div>
              <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Total Roles</span>
              <span className="block text-lg font-bold text-gray-900">
                {loading ? "..." : stats.totalRoles}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-md shadow-sm text-blue-600">
              <FiCheckCircle size={18} />
            </div>
            <div>
              <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">System</span>
              <span className="block text-lg font-bold text-gray-900">
                {loading ? "..." : stats.systemRoles}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-md shadow-sm text-green-600">
              <FiCheckCircle size={18} />
            </div>
            <div>
              <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Custom</span>
              <span className="block text-lg font-bold text-gray-900">
                {loading ? "..." : stats.customRoles}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-md shadow-sm text-purple-600">
              <FiUsers size={18} />
            </div>
            <div>
              <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Users Assigned</span>
              <span className="block text-lg font-bold text-gray-900">
                {loading ? "..." : stats.usersAssigned}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <RoleSidebar
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          refreshKey={refreshKey}
        />
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="max-w-5xl mx-auto">
            <RoleDetails
              roleId={selectedRole}
              onEdit={handleEditRole}
              onDelete={refreshData}
            />
          </div>
        </div>
      </div>

      {/* Create/Edit Role Drawer */}
      {showCreateDrawer && (
        <CreateRoleDrawer
          onClose={handleCloseDrawer}
          onSuccess={handleSuccess}
          editRole={editingRole}
        />
      )}
    </div>
  );
}
