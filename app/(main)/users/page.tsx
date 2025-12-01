"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FiPlus, FiUsers, FiShield } from "react-icons/fi";
import StaffDirectory from "@/components/users/StaffDirectory";
import RolesList from "@/components/users/RolesList";
import CreateUserDrawer from "@/components/users/CreateUserDrawer";

type Tab = "staff" | "roles";

export default function TeamPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("staff");

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "roles") {
            setActiveTab("roles");
        } else {
            setActiveTab("staff");
        }
    }, [searchParams]);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        if (tab === "roles") {
            router.push("/users?tab=roles");
        } else {
            router.push("/users");
        }
    };
    const [showCreateDrawer, setShowCreateDrawer] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUserCreated = () => {
        setShowCreateDrawer(false);
        setRefreshKey(prev => prev + 1); // Trigger refresh
    };

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] px-8 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0f172a]">Team</h1>
                        <p className="text-sm text-[#64748b] mt-1">
                            Manage staff and access control
                        </p>
                    </div>
                    {activeTab === "staff" && (
                        <button
                            onClick={() => setShowCreateDrawer(true)}
                            className="px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-sm transition-all flex items-center gap-2"
                        >
                            <FiPlus size={20} />
                            Add Staff
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-200">
                    <button
                        onClick={() => handleTabChange("staff")}
                        className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === "staff"
                            ? "text-teal-600"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <FiUsers size={18} />
                            Staff Directory
                        </div>
                        {activeTab === "staff" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange("roles")}
                        className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === "roles"
                            ? "text-teal-600"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <FiShield size={18} />
                            Roles & Access
                        </div>
                        {activeTab === "roles" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
                {activeTab === "staff" && <StaffDirectory key={refreshKey} />}
                {activeTab === "roles" && <RolesList />}
            </div>

            {/* Drawers */}
            {showCreateDrawer && (
                <CreateUserDrawer
                    onClose={() => setShowCreateDrawer(false)}
                    onSuccess={handleUserCreated}
                />
            )}
        </div>
    );
}
