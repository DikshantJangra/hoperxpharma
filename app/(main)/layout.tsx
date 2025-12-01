"use client"
import { useState } from "react"
import Sidebar from "@/components/dashboard/sidebar/Sidebar"
import Navbar from "@/components/dashboard/navbar/Navbar"
import { PermissionProvider } from "@/contexts/PermissionContext"
import { useAuthStore } from "@/lib/store/auth-store"

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [expandedItems, setExpandedItems] = useState<string[]>([])
    const permissions = useAuthStore(state => state.permissions)

    const toggleItem = (item: string) => {
        setExpandedItems(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        )
    }

    return (
        <PermissionProvider initialPermissions={permissions}>
            <div className="flex h-screen bg-gray-50">
                <Sidebar
                    isOpen={sidebarOpen}
                    expandedItems={expandedItems}
                    onToggleItem={toggleItem}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </PermissionProvider>
    )
}
