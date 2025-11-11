"use client"
import { useState } from "react"
import { 
    FiMenu, FiSearch, FiChevronDown, FiChevronRight, FiMessageSquare, FiBell, 
    FiUser, FiSettings, FiHelpCircle, FiLogOut, FiX
} from "react-icons/fi"
import { MdStore, MdShoppingCart } from "react-icons/md"
import { TbPrescription } from "react-icons/tb"

interface NavbarProps {
    onToggleSidebar: () => void
    sidebarOpen: boolean
}

export default function Navbar({ onToggleSidebar, sidebarOpen }: NavbarProps) {
    const [showStoreMenu, setShowStoreMenu] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 z-10 shadow-sm">
            <LeftSection onToggleSidebar={onToggleSidebar} showStoreMenu={showStoreMenu} setShowStoreMenu={setShowStoreMenu} sidebarOpen={sidebarOpen} />
            <CenterSection />
            <RightSection 
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                showUserMenu={showUserMenu}
                setShowUserMenu={setShowUserMenu}
            />
        </header>
    )
}

function LeftSection({ onToggleSidebar, showStoreMenu, setShowStoreMenu }: any) {
    return (
        <div className="flex items-center gap-4">
            <button 
                onClick={onToggleSidebar} 
                className="text-gray-500 hover:text-gray-900"
                aria-label="Toggle sidebar"
            >
                <FiMenu size={22} />
            </button>

            <div className="relative">
                <button 
                    onClick={() => setShowStoreMenu(!showStoreMenu)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    <MdStore size={18} className="text-emerald-600" />
                    <div className="text-left">
                        <p className="text-sm font-medium text-gray-800">Main Store</p>
                        <p className="text-xs text-gray-500">GST: 27AABCU9603R1ZX</p>
                    </div>
                    <FiChevronDown size={16} className="text-gray-400" />
                </button>
            </div>
        </div>
    )
}

function CenterSection() {
    return (
        <div className="flex-1 flex items-center gap-4 mx-6">
            <div className="relative flex-1 max-w-xl">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search patients, drugs, invoices... (/)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium text-gray-800">Dashboard</span>
                <FiChevronRight size={14} className="text-gray-400" />
                <span>Overview</span>
            </div>
        </div>
    )
}

function RightSection({ showNotifications, setShowNotifications, showUserMenu, setShowUserMenu }: any) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-3 pr-3 border-r border-gray-200">
                <button className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1.5">
                    <TbPrescription size={16} />
                    New Rx
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                    <MdShoppingCart size={16} />
                    POS
                </button>
            </div>

            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
                <FiMessageSquare size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
            </button>

            <NotificationButton show={showNotifications} setShow={setShowNotifications} />

            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">Synced</span>
            </div>

            <UserMenu show={showUserMenu} setShow={setShowUserMenu} />
        </div>
    )
}

function NotificationButton({ show, setShow }: any) {
    return (
        <div className="relative">
            <button 
                onClick={() => setShow(!show)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
                <FiBell size={20} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold border-2 border-white">3</span>
            </button>
            {show && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                    </div>
                    <NotificationItem type="critical" title="Critical Stock Alert" desc="Atorvastatin 10mg - 4 units left" time="2m ago" />
                    <NotificationItem type="warning" title="Near Expiry" desc="2 items expiring in 5 days" time="1h ago" />
                    <NotificationItem type="info" title="New e-Prescription" desc="3 new prescriptions received" time="2h ago" />
                </div>
            )}
        </div>
    )
}

function NotificationItem({ type, title, desc, time }: any) {
    const bgColor = type === 'critical' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
    return (
        <button className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${bgColor}`}></div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
                    <p className="text-xs text-gray-400 mt-1">{time}</p>
                </div>
            </div>
        </button>
    )
}

function UserMenu({ show, setShow }: any) {
    return (
        <div className="relative ml-2">
            <button 
                onClick={() => setShow(!show)}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-sm">
                    KK
                </div>
                <FiChevronDown size={16} className="text-gray-400" />
            </button>
            {show && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">Krishan Kumar</p>
                        <p className="text-xs text-gray-500">Admin Pharmacist</p>
                    </div>
                    <UserMenuItem icon={<FiUser size={16} />} label="Profile" />
                    <UserMenuItem icon={<FiSettings size={16} />} label="Settings" />
                    <UserMenuItem icon={<FiHelpCircle size={16} />} label="Help & Support" />
                    <div className="border-t border-gray-100 mt-2 pt-2">
                        <UserMenuItem icon={<FiLogOut size={16} />} label="Logout" danger />
                    </div>
                </div>
            )}
        </div>
    )
}

function UserMenuItem({ icon, label, danger }: any) {
    return (
        <button className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${danger ? 'text-red-600' : 'text-gray-700'}`}>
            {icon}
            <span className="text-sm">{label}</span>
        </button>
    )
}
