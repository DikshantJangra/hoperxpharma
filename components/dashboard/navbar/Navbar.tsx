"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
    FiMenu, FiSearch, FiChevronDown, FiChevronRight, FiMessageSquare, FiBell,
    FiUser, FiSettings, FiHelpCircle, FiLogOut, FiCheck, FiX
} from "react-icons/fi"
import { MdStore, MdShoppingCart } from "react-icons/md"
import { TbPrescription } from "react-icons/tb"

interface NavbarProps {
    onToggleSidebar: () => void
    sidebarOpen?: boolean
}

export default function Navbar({ onToggleSidebar, sidebarOpen }: NavbarProps) {
    const [showStoreMenu, setShowStoreMenu] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)

    return (
        <header className="sticky top-0 h-16 bg-white border-b border-gray-100 flex items-center px-6 z-50 shadow-sm">
            <LeftSection
                onToggleSidebar={onToggleSidebar}
                showStoreMenu={showStoreMenu}
                setShowStoreMenu={setShowStoreMenu}
                sidebarOpen={sidebarOpen}
            />
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

function LeftSection({ onToggleSidebar, showStoreMenu, setShowStoreMenu, sidebarOpen }: any) {
    const storeMenuRef = useRef<HTMLDivElement>(null);
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch all stores for the user
    useEffect(() => {
        const fetchStores = async () => {
            try {
                const { storeApi } = await import('@/lib/api/store');
                const storesData = await storeApi.getMyStores();
                setStores(storesData);
            } catch (error) {
                console.error('Failed to fetch stores:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStores();
    }, []);

    // Determine primary store (first or isPrimary flag)
    const primaryStore = stores.find((s) => s.isPrimary) || stores[0] || null;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (storeMenuRef.current && !storeMenuRef.current.contains(event.target as Node)) {
                setShowStoreMenu(false);
            }
        }
        if (showStoreMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showStoreMenu, setShowStoreMenu]);

    return (
        <div className="flex items-center gap-4">
            <button
                onClick={onToggleSidebar}
                className="text-gray-500 hover:text-gray-900 transition-colors"
                aria-label="Toggle sidebar"
            >
                {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>

            <div className="relative" ref={storeMenuRef}>
                <button
                    onClick={() => setShowStoreMenu(!showStoreMenu)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    <MdStore size={18} className="text-emerald-600" />
                    <div className="text-left">
                        <p className="text-sm font-medium text-gray-800">
                            {loading ? 'Loading...' : (primaryStore?.name || primaryStore?.displayName || 'My Store')}
                        </p>
                        <p className="text-xs text-gray-500">
                            {loading ? '-' : (primaryStore?.city ? `${primaryStore.city}, ${primaryStore.state}` : '-')}
                        </p>
                    </div>
                    <FiChevronDown size={16} className={`text-gray-400 transition-transform ${showStoreMenu ? 'rotate-180' : ''}`} />
                </button>

                {showStoreMenu && (
                    <div className="absolute left-0 top-14 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-800">Your Stores</h3>
                        </div>
                        {loading ? (
                            <div className="px-4 py-8 text-center text-sm text-gray-500">Loading stores...</div>
                        ) : stores.length > 0 ? (
                            stores.map((s) => (
                                <StoreMenuItem
                                    key={s.id}
                                    name={s.name || s.displayName}
                                    location={`${s.city || ''}, ${s.state || ''}`}
                                    gst={s.gstin}
                                    active={primaryStore && s.id === primaryStore.id}
                                    onClick={() => {
                                        // Future: switch store logic could go here
                                        setShowStoreMenu(false);
                                    }}
                                />
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-gray-500">No stores available</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StoreMenuItem({ name, location, gst, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left ${active ? 'bg-emerald-50' : ''}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{name}</p>
                        {active && <FiCheck size={14} className="text-emerald-600" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{location}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">GST: {gst}</p>
                </div>
            </div>
        </button>
    )
}

function CenterSection() {
    const router = useRouter()
    const pathname = usePathname()
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault()
                document.getElementById('global-search')?.focus()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            console.log('Searching for:', searchQuery)
        }
    }

    const getBreadcrumb = () => {
        const segments = pathname.split('/').filter(Boolean)

        if (segments.length === 0) {
            return { section: 'Dashboard', page: 'Overview' }
        }

        const sectionMap: Record<string, string> = {
            'dashboard': 'Dashboard',
            'prescriptions': 'Prescriptions',
            'dispense': 'Dispense',
            'inventory': 'Inventory',
            'orders': 'Orders',
            'claims': 'Claims',
            'pos': 'POS',
            'gst': 'GST & Tax',
            'reports': 'Reports',
            'patients': 'Patients',
            'messages': 'Messages',
            'settings': 'Settings',
            'profile': 'Profile',
            'help': 'Help',
            'knowledge': 'Knowledge',
            'multi-store': 'Multi-Store'
        }

        const pageMap: Record<string, string> = {
            'new': 'New',
            'stock': 'Stock',
            'batches': 'Batches',
            'expiry': 'Expiry',
            'invoices': 'Invoices',
            'returns': 'GSTR Filing',
            'tax-slabs': 'Tax Slabs',
            'hsn-codes': 'HSN Codes',
            'mismatches': 'Mismatches',
            'exports': 'Exports',
            'chat': 'Chat',
            'docs': 'Docs',
            'updates': 'Updates',
            'feedback': 'Feedback',
            'switch': 'Switch Store',
            'transfer': 'Transfer',
            'summary': 'Summary',
            'drug-info': 'Drug Info',
            'interactions': 'Interactions'
        }

        const section = sectionMap[segments[0]] || segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
        const page = segments[1] ? (pageMap[segments[1]] || segments[1].charAt(0).toUpperCase() + segments[1].slice(1)) : 'Overview'

        return { section, page }
    }

    const { section, page } = getBreadcrumb()

    return (
        <div className="flex-1 flex items-center gap-4 mx-6">
            <form onSubmit={handleSearch} className="relative flex-1 max-w-xl">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    id="global-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patients, drugs, invoices... (Press /)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                />
            </form>

            <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium text-gray-800">{section}</span>
                <FiChevronRight size={14} className="text-gray-400" />
                <span>{page}</span>
            </div>
        </div>
    )
}

function RightSection({ showNotifications, setShowNotifications, showUserMenu, setShowUserMenu }: any) {
    const router = useRouter()

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-3 pr-3 border-r border-gray-200">
                <Link
                    href="/prescriptions/new"
                    className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
                >
                    <TbPrescription size={16} />
                    New Rx
                </Link>
                <Link
                    href="/pos"
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                >
                    <MdShoppingCart size={16} />
                    POS
                </Link>
            </div>

            <Link
                href="/messages"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
                <FiMessageSquare size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
            </Link>

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
    const notifRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShow(false)
            }
        }

        if (show) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [show, setShow])

    return (
        <div className="relative" ref={notifRef}>
            <button
                onClick={() => setShow(!show)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
                <FiBell size={20} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold border-2 border-white">3</span>
            </button>
            {show && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                        <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                            Mark all read
                        </button>
                    </div>
                    <NotificationItem type="critical" title="Critical Stock Alert" desc="Atorvastatin 10mg - 4 units left" time="2m ago" />
                    <NotificationItem type="warning" title="Near Expiry" desc="2 items expiring in 5 days" time="1h ago" />
                    <NotificationItem type="info" title="New e-Prescription" desc="3 new prescriptions received" time="2h ago" />
                    <div className="border-t border-gray-100 mt-2 pt-2 px-4">
                        <Link
                            href="/notifications"
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                            onClick={() => setShow(false)}
                        >
                            View all notifications →
                        </Link>
                    </div>
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
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    // Fetch user info on mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { useAuthStore } = await import('@/lib/store/auth-store');
                const authUser = useAuthStore.getState().user;
                setUser(authUser);
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };
        fetchUser();
    }, []);

    // Helper to get user initials
    const getInitials = () => {
        if (!user?.name) return '?';
        const parts = user.name.split(' ');
        if (parts.length >= 2) {
            return parts[0][0] + parts[1][0];
        }
        return parts[0][0];
    };

    // Logout handler
    const handleLogout = async () => {
        setShow(false);
        try {
            const { useAuthStore } = await import('@/lib/store/auth-store');
            const { logout } = useAuthStore.getState();
            await logout();
            router.push('/login');
        } catch (e) {
            console.error('Logout failed:', e);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShow(false);
            }
        }
        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [show, setShow]);

    return (
        <div className="relative ml-2" ref={userMenuRef}>
            <button
                onClick={() => setShow(!show)}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-sm">
                    {user ? getInitials() : '-'}
                </div>
                <FiChevronDown size={16} className={`text-gray-400 transition-transform ${show ? 'rotate-180' : ''}`} />
            </button>
            {show && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">{user?.firstName || 'User'}</p>
                        <p className="text-xs text-gray-500">{user?.email || '-'}
                        </p>
                    </div>
                    <UserMenuItem icon={<FiUser size={16} />} label="Profile" href="/profile" onClick={() => setShow(false)} />
                    <UserMenuItem icon={<FiSettings size={16} />} label="Settings" href="/settings" onClick={() => setShow(false)} />
                    <UserMenuItem icon={<FiHelpCircle size={16} />} label="Help & Support" href="/help/chat" onClick={() => setShow(false)} />
                    <div className="border-t border-gray-100 mt-2 pt-2">
                        <UserMenuItem icon={<FiLogOut size={16} />} label="Logout" danger onClick={handleLogout} />
                    </div>
                </div>
            )}
        </div>
    );
}

function UserMenuItem({ icon, label, danger, href, onClick }: any) {
    const content = (
        <div className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${danger ? 'text-red-600' : 'text-gray-700'}`}>
            {icon}
            <span className="text-sm">{label}</span>
        </div>
    );

    if (href) {
        return (
            <Link href={href} onClick={onClick}>
                {content}
            </Link>
        );
    }

    return <button className="w-full" onClick={onClick}>{content}</button>;
}
