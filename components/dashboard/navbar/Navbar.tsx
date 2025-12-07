"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
    FiMenu, FiSearch, FiChevronDown, FiChevronRight, FiMessageSquare,
    FiUser, FiSettings, FiHelpCircle, FiLogOut, FiCheck, FiX
} from "react-icons/fi"
import { MdStore, MdShoppingCart } from "react-icons/md"
import { TbPrescription } from "react-icons/tb"
import { useAuthStore } from "@/lib/store/auth-store"
import NotificationButton from "./NotificationButton"

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
    const { user, primaryStore, isLoading } = useAuthStore();

    // Get all stores from user's storeUsers
    const stores = user?.storeUsers?.map((su: any) => ({
        ...su.store,
        isPrimary: su.isPrimary
    })) || [];

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
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors max-w-xs"
                >
                    <MdStore size={18} className="text-emerald-600 shrink-0" />
                    <div className="text-left min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                            {isLoading ? 'Loading...' : (primaryStore?.displayName || primaryStore?.name || 'My Store')}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {isLoading ? '-' : (primaryStore?.city ? `${primaryStore.city}, ${primaryStore.state}` : '-')}
                        </p>
                    </div>
                    <FiChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ${showStoreMenu ? 'rotate-180' : ''}`} />
                </button>

                {showStoreMenu && (
                    <div className="absolute left-0 top-14 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-800">Your Stores</h3>
                        </div>
                        {isLoading ? (
                            <div className="px-4 py-8 text-center text-sm text-gray-500">Loading stores...</div>
                        ) : stores.length > 0 ? (
                            stores.map((s: any) => {
                                // Get GSTIN directly from store
                                const gstin = s.gstin || '-';

                                return (
                                    <StoreMenuItem
                                        key={s.id}
                                        name={s.displayName || s.name}
                                        location={`${s.city || ''}, ${s.state || ''}`}
                                        gst={gstin}
                                        active={s.isPrimary}
                                        onClick={() => {
                                            // Future: switch store logic could go here
                                            setShowStoreMenu(false);
                                        }}
                                    />
                                );
                            })
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
                    href="/prescriptions"
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


function UserMenu({ show, setShow }: any) {
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { user, isLoading } = useAuthStore();
    const router = useRouter();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Helper to get user initials
    const getInitials = () => {
        if (!user) return '?';
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';

        if (firstName && lastName) {
            return `${firstName[0]}${lastName[0]}`.toUpperCase();
        }

        if (firstName) {
            return firstName[0].toUpperCase();
        }

        return '?';
    };

    // Fetch user's avatar
    useEffect(() => {
        const fetchAvatar = async () => {
            if (!user) return;

            try {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
                const response = await fetch(`${apiBaseUrl}/avatar/me`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.avatarUrl) {
                        setAvatarUrl(data.avatarUrl);
                    }
                }
            } catch (error) {
                // Silently fail - will show initials
            }
        };

        fetchAvatar();
    }, [user]);

    // Logout handler
    const handleLogout = async () => {
        setShow(false);
        try {
            const { logout } = useAuthStore.getState();
            await logout();

            // Use window.location.href instead of router.push to ensure:
            // 1. Complete page reload
            // 2. Middleware runs and checks cookies
            // 3. All client-side state is cleared
            window.location.href = '/login';
        } catch (e) {
            console.error('Logout failed:', e);
            // Force redirect even if logout API fails
            window.location.href = '/login';
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
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="User avatar"
                        className="w-9 h-9 rounded-full object-cover border-2 border-emerald-200"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-sm">
                        {isLoading ? '-' : getInitials()}
                    </div>
                )}
                <FiChevronDown size={16} className={`text-gray-400 transition-transform ${show ? 'rotate-180' : ''}`} />
            </button>
            {show && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">
                            {user ? `${user.firstName} ${user.lastName}` : 'User'}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email || '-'}</p>
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
