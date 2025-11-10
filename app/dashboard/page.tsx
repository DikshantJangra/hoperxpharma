"use client"
import { useState } from "react"
import { FiMenu, FiX, FiBell, FiUser, FiLogOut } from "react-icons/fi"
import { MdDashboard, MdInventory, MdPeople, MdShoppingCart, MdAnalytics, MdSettings } from "react-icons/md"

export default function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(true)

    return (
        <div className="h-screen w-screen bg-gray-50 flex overflow-hidden">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
                {/* Logo Section */}
                <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-lg">Rx</span>
                        </div>
                        {sidebarOpen && (
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-700">Hope<span className="text-emerald-500">Rx</span>Pharma</span>
                                <span className="text-xs text-gray-500">Dashboard</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    <NavItem icon={<MdDashboard size={20} />} label="Dashboard" active sidebarOpen={sidebarOpen} />
                    <NavItem icon={<MdInventory size={20} />} label="Inventory" sidebarOpen={sidebarOpen} />
                    <NavItem icon={<MdShoppingCart size={20} />} label="Sales" sidebarOpen={sidebarOpen} />
                    <NavItem icon={<MdPeople size={20} />} label="Customers" sidebarOpen={sidebarOpen} />
                    <NavItem icon={<MdAnalytics size={20} />} label="Analytics" sidebarOpen={sidebarOpen} />
                    <NavItem icon={<MdSettings size={20} />} label="Settings" sidebarOpen={sidebarOpen} />
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 hover:text-gray-900">
                            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative text-gray-600 hover:text-gray-900">
                            <FiBell size={20} />
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-700">John Doe</p>
                                <p className="text-xs text-gray-500">Admin</p>
                            </div>
                            <button className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <FiUser size={20} />
                            </button>
                        </div>
                        <button className="text-gray-600 hover:text-red-600">
                            <FiLogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <StatCard title="Total Sales" value="₹1,24,500" change="+12.5%" positive />
                        <StatCard title="Inventory Items" value="1,234" change="-3.2%" />
                        <StatCard title="Customers" value="856" change="+8.1%" positive />
                        <StatCard title="Low Stock" value="23" change="+5" alert />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                            <p className="text-gray-500">Activity content goes here...</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                            <p className="text-gray-500">Quick actions content goes here...</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

function NavItem({ icon, label, active, sidebarOpen }: { icon: React.ReactNode, label: string, active?: boolean, sidebarOpen: boolean }) {
    return (
        <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="flex-shrink-0">{icon}</span>
            {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
        </button>
    )
}

function StatCard({ title, value, change, positive, alert }: { title: string, value: string, change: string, positive?: boolean, alert?: boolean }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
            <p className={`text-sm ${alert ? 'text-red-600' : positive ? 'text-green-600' : 'text-gray-600'}`}>{change}</p>
        </div>
    )
}
