"use client";
import { useEffect, useState } from "react";
import { FiShield, FiUsers } from "react-icons/fi";
import { rbacApi, Role } from "@/lib/api/rbac";

interface RoleSidebarProps {
  selectedRole: string;
  onSelectRole: (roleId: string) => void;
  refreshKey?: number;
}

export default function RoleSidebar({ selectedRole, onSelectRole, refreshKey }: RoleSidebarProps) {
  const [roles, setRoles] = useState<{ system: Role[]; custom: Role[] }>({
    system: [],
    custom: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const response = await rbacApi.getRoles();
        if (response.success) {
          const systemRoles = response.data.filter((role: Role) => role.builtIn);
          const customRoles = response.data.filter((role: Role) => !role.builtIn);
          setRoles({ system: systemRoles, custom: customRoles });
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [refreshKey]);

  const filteredSystemRoles = roles.system.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomRoles = roles.custom.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-100">
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-6">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-0">
      <div className="p-4 border-b border-gray-100">
        <input
          type="text"
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
        />
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-8 custom-scrollbar">
        {/* System Roles */}
        {filteredSystemRoles.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
              <FiShield size={12} />
              System Roles
            </div>
            <div className="space-y-1">
              {filteredSystemRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => onSelectRole(role.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm transition-all duration-200 group ${selectedRole === role.id
                      ? "bg-teal-50 text-teal-700 font-medium shadow-sm ring-1 ring-teal-100"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <span className="truncate">{role.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${selectedRole === role.id
                      ? "bg-white text-teal-600 shadow-sm"
                      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                    }`}>
                    {role._count?.userRoles || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Roles */}
        {filteredCustomRoles.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
              <FiUsers size={12} />
              Custom Roles
            </div>
            <div className="space-y-1">
              {filteredCustomRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => onSelectRole(role.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm transition-all duration-200 group ${selectedRole === role.id
                      ? "bg-teal-50 text-teal-700 font-medium shadow-sm ring-1 ring-teal-100"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <span className="truncate">{role.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${selectedRole === role.id
                      ? "bg-white text-teal-600 shadow-sm"
                      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                    }`}>
                    {role._count?.userRoles || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredSystemRoles.length === 0 && filteredCustomRoles.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No roles found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
