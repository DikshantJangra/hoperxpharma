"use client";
import { useState, useEffect } from "react";
import { FiX, FiCheck } from "react-icons/fi";
import { rbacApi, Permission } from "@/lib/api/rbac";

interface CreateRoleDrawerProps {
  onClose: () => void;
  onSuccess?: () => void;
  editRole?: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    permissions: { permission: Permission }[];
  } | null;
}

export default function CreateRoleDrawer({ onClose, onSuccess, editRole }: CreateRoleDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [roleName, setRoleName] = useState(editRole?.name || "");
  const [description, setDescription] = useState(editRole?.description || "");
  const [category, setCategory] = useState(editRole?.category || "custom");

  // Permissions state
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Load permissions on mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setPermissionsLoading(true);
        const response = await rbacApi.getPermissions();
        if (response.success) {
          // Flatten grouped permissions
          const allPermissions: Permission[] = [];
          Object.values(response.data).forEach((group: any) => {
            allPermissions.push(...group);
          });
          setAvailablePermissions(allPermissions);

          // Pre-select permissions if editing
          if (editRole) {
            const preSelected = new Set(editRole.permissions.map(p => p.permission.id));
            setSelectedPermissions(preSelected);
          }
        }
      } catch (err) {
        console.error("Failed to fetch permissions:", err);
        setError("Failed to load permissions");
      } finally {
        setPermissionsLoading(false);
      }
    };

    fetchPermissions();
  }, [editRole]);

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      setError("Role name is required");
      return;
    }

    if (selectedPermissions.size === 0) {
      setError("Please select at least one permission");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const roleData = {
        name: roleName.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        permissionIds: Array.from(selectedPermissions),
      };

      let response;
      if (editRole) {
        response = await rbacApi.updateRole(editRole.id, roleData);
      } else {
        response = await rbacApi.createRole(roleData);
      }

      if (response.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(response.message || "Failed to save role");
      }
    } catch (err: any) {
      console.error("Failed to save role:", err);
      setError(err.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const filteredPermissions = availablePermissions.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group permissions by category
  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    const cat = perm.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-end z-50 transition-opacity">
      <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {editRole ? "Edit Role" : "Create New Role"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {editRole ? "Modify existing role details and permissions" : "Define a new role and assign permissions"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Basic Info */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Basic Information
            </h4>

            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Inventory Manager"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-gray-900 placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none bg-white"
                      disabled={loading}
                    >
                      <option value="custom">Custom</option>
                      <option value="clinical">Clinical</option>
                      <option value="operational">Operational</option>
                      <option value="administrative">Administrative</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this role can do..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-gray-900 placeholder-gray-400 resize-none"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Permissions <span className="ml-2 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs normal-case">{selectedPermissions.size} selected</span>
              </h4>
              <div className="relative w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search permissions..."
                  className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>

            {permissionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([cat, perms]) => (
                  <div key={cat} className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <div className="text-sm font-bold text-gray-900 mb-3 capitalize flex items-center gap-2">
                      {cat}
                      <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-100">
                        {perms.length} permissions
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {perms.map((perm) => (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPermissions.has(perm.id)
                              ? "bg-white border-teal-200 shadow-sm ring-1 ring-teal-500/10"
                              : "bg-white border-gray-100 hover:border-gray-300"
                            }`}
                        >
                          <div className="relative flex items-center mt-0.5">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.has(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                              disabled={loading}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{perm.name}</div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">{perm.code}</div>
                            {perm.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-1">{perm.description}</div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {Object.keys(groupedPermissions).length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500">No permissions found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
              <div className="text-red-500 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div className="text-sm text-red-800 font-medium">{error}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !roleName.trim() || selectedPermissions.size === 0}
            className="px-8 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <FiCheck size={18} />
                {editRole ? "Update Role" : "Create Role"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
