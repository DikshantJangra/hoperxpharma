"use client"
import { useState } from "react"
import Sidebar from "@/components/dashboard/sidebar/Sidebar"
import Navbar from "@/components/dashboard/navbar/Navbar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [expandedItems, setExpandedItems] = useState<string[]>(['dashboard'])

    const toggleItem = (item: string) => {
        setExpandedItems(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        )
    }

    return (
        <div className="h-screen w-screen bg-gray-50 flex overflow-hidden">
            <Sidebar isOpen={sidebarOpen} expandedItems={expandedItems} onToggleItem={toggleItem} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
                <main className="flex-1 overflow-y-auto bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    )
}