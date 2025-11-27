"use client";
import { useState, useEffect } from "react";
import { FiChevronDown, FiChevronRight, FiAlertTriangle } from "react-icons/fi";
import { rbacApi, Permission, Role } from "@/lib/api/rbac";

interface PermissionMatrixProps {
  roleId: string;
}

export default function PermissionMatrix({ roleId }: PermissionMatrixProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [permsResponse, roleResponse] = await Promise.all([
          rbacApi.getPermissions(),
          rbacApi.getRole(roleId)
        ]);

        if (permsResponse.success) {
          setPermissions(permsResponse.data);
          // Expand all categories by default
          const initialExpanded: Record<string, boolean> = {};
          Object.keys(permsResponse.data).forEach(key => {
            initialExpanded[key] = true;
          });
          setExpanded(initialExpanded);
        }

        if (roleResponse.success) {
          setRole(roleResponse.data);
          const currentPerms = new Set<string>(roleResponse.data.permissions.map((p: any) => p.permission.id as string));
          setRolePermissions(currentPerms);
        }
      } catch (error) {
        console.error("Failed to fetch permission data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (roleId) {
      fetchData();
    }
  }, [roleId]);

  const toggleCategory = (category: string) => {
    setExpanded({ ...expanded, [category]: !expanded[category] });
  };

  const handleTogglePermission = async (permissionId: string) => {
    if (!role || role.builtIn) return;

    const isEnabled = rolePermissions.has(permissionId);

    // Optimistic update
    const newPermissions = new Set(rolePermissions);
    if (isEnabled) {
      newPermissions.delete(permissionId);
    } else {
      newPermissions.add(permissionId);
    }
    setRolePermissions(newPermissions);

    try {
      if (isEnabled) {
        await rbacApi.removePermissionFromRole(roleId, permissionId);
      } else {
        await rbacApi.addPermissionsToRole(roleId, [permissionId]);
      }
    } catch (error) {
      console.error("Failed to update permission:", error);
      // Revert on error
      setRolePermissions(rolePermissions);
    }
  };

  const getRiskColor = (risk: string) => {
    if (risk === "high") return "bg-red-50 text-red-700 border-red-100";
    if (risk === "semi") return "bg-orange-50 text-orange-700 border-orange-100";
    return "bg-green-50 text-green-700 border-green-100";
  };

  const getRiskLevel = (perm: Permission) => {
    const lowerName = perm.name.toLowerCase();
    if (lowerName.includes("delete") || lowerName.includes("manage") || lowerName.includes("admin") || lowerName.includes("api") || lowerName.includes("override") || lowerName.includes("void") || lowerName.includes("approve refund")) return "high";
    if (lowerName.includes("edit") || lowerName.includes("update") || lowerName.includes("create") || lowerName.includes("adjust") || lowerName.includes("modify") || lowerName.includes("refund")) return "semi";
    return "normal";
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
        <h3 className="text-lg font-bold text-gray-900">Permission Matrix</h3>
        <p className="text-sm text-gray-500 mt-1">Configure what users with this role can access and modify</p>
      </div>

      <div className="divide-y divide-gray-100">
        {Object.entries(permissions).map(([category, categoryPerms]) => (
          <div key={category} className="group transition-colors hover:bg-gray-50/30">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-8 py-4 focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1 rounded-md transition-colors ${expanded[category] ? 'bg-teal-50 text-teal-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {expanded[category] ? (
                    <FiChevronDown size={20} />
                  ) : (
                    <FiChevronRight size={20} />
                  )}
                </div>
                <span className="font-semibold text-gray-900 text-base capitalize">{category}</span>
              </div>
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {categoryPerms.filter(p => rolePermissions.has(p.id)).length} / {categoryPerms.length} enabled
              </span>
            </button>

            {expanded[category] && (
              <div className="px-8 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 animate-in slide-in-from-top-2 duration-200">
                {categoryPerms.map((perm) => {
                  const risk = getRiskLevel(perm);
                  const isEnabled = rolePermissions.has(perm.id);
                  const isDisabled = role?.builtIn;

                  return (
                    <div
                      key={perm.id}
                      className={`flex items-center justify-between py-3 px-4 rounded-lg border transition-all ${isDisabled ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <label className={`relative inline-flex items-center ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleTogglePermission(perm.id)}
                            disabled={isDisabled}
                            className="sr-only peer"
                          />
                          <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isDisabled ? 'peer-checked:bg-teal-400' : 'peer-checked:bg-teal-600'}`}></div>
                        </label>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{perm.name}</span>
                          {risk === "high" && (
                            <span className="text-[10px] text-red-600 flex items-center gap-1 mt-0.5 font-medium">
                              <FiAlertTriangle size={10} /> High Sensitivity
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${getRiskColor(risk)}`}>
                        {risk === "high" ? "High Risk" : risk === "semi" ? "Sensitive" : "Standard"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
