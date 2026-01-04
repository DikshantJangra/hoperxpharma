"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
    FiMenu, FiChevronDown, FiChevronRight, FiMessageSquare,
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
        <header className="sticky top-0 h-14 md:h-16 bg-white border-b border-gray-100 flex items-center justify-between px-3 sm:px-4 md:px-6 z-40 shadow-sm">
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
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button
                onClick={onToggleSidebar}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                aria-label="Toggle sidebar"
            >
                {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>

            {/* Store Selector - Hidden on mobile */}
            <div className="relative hidden md:block" ref={storeMenuRef}>
                <button
                    onClick={() => setShowStoreMenu(!showStoreMenu)}
                    className="flex items-center gap-2 px-2 md:px-3 py-1.5 hover:bg-gray-50 rounded-lg transition-all border border-transparent hover:border-gray-200"
                    title={primaryStore?.displayName || primaryStore?.name || 'My Store'}
                >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <MdStore size={18} className="text-emerald-600" />
                    </div>
                    <div className="hidden md:block text-left min-w-0 max-w-[140px] lg:max-w-[200px]">
                        <p className="text-sm font-medium text-gray-800 truncate">
                            {isLoading ? 'Loading...' : (primaryStore?.displayName || primaryStore?.name || 'My Store')}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {isLoading ? '-' : (primaryStore?.city ? `${primaryStore.city}, ${primaryStore.state}` : '-')}
                        </p>
                    </div>
                    <FiChevronDown size={16} className={`text-gray-400 transition-transform ${showStoreMenu ? 'rotate-180' : ''} hidden md:block`} />
                </button>

                {showStoreMenu && (
                    <div className="absolute left-0 sm:left-auto top-14 w-[calc(100vw-24px)] sm:w-80 max-w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
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
    const pathname = usePathname()

    const getBreadcrumb = () => {
        if (!pathname) return { section: 'Dashboard', page: 'Overview' }
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
            'multi-store': 'Multi-Store',
            'store': 'Store',
            'finance': 'Finance',
            'users': 'Team'
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
            'interactions': 'Interactions',
            'billing': 'Plan & Billing',
            'overview': 'Overview',
            'sales': 'Sales',
            'list': 'All Patients'
        }

        const section = sectionMap[segments[0]] || segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
        const page = segments[1] ? (pageMap[segments[1]] || segments[1].charAt(0).toUpperCase() + segments[1].slice(1)) : 'Overview'

        return { section, page }
    }

    const { section, page } = getBreadcrumb()

    return (
        <>
            {/* Mobile: Show page title */}
            <div className="flex-1 md:hidden px-2">
                <h1 className="text-sm font-semibold text-gray-800 truncate">{section}</h1>
                <p className="text-xs text-gray-500 truncate">{page}</p>
            </div>
            {/* Desktop: Show breadcrumb in center */}
            <div className="hidden md:flex flex-1 items-center justify-center">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-800">{section}</span>
                    <FiChevronRight size={14} className="text-gray-400 hidden lg:block" />
                    <span className="text-gray-600 hidden lg:block">{page}</span>
                </div>
            </div>
        </>
    )
}

function RightSection({ showNotifications, setShowNotifications, showUserMenu, setShowUserMenu }: any) {
    const router = useRouter()

    return (
        <div className="flex items-center shrink-0">
            {/* Quick Actions - Only primary action on mobile */}
            <div className="flex items-center gap-1 md:gap-2 pr-2 md:pr-4 md:mr-4 md:border-r border-gray-200" data-tour="quick-actions">
                <Link
                    href="/prescriptions/all-prescriptions"
                    data-tour="quick-new-rx"
                    className="p-2 md:px-3 md:py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-all flex items-center gap-1.5"
                    title="New Prescription"
                >
                    <TbPrescription size={18} />
                    <span className="hidden lg:inline">New Rx</span>
                </Link>
                <Link
                    href="/pos"
                    data-tour="quick-pos"
                    className="p-2 md:px-3 md:py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all flex items-center gap-1.5"
                    title="Point of Sale"
                >
                    <MdShoppingCart size={18} />
                    <span className="hidden lg:inline">POS</span>
                </Link>
            </div>

            {/* Utilities - Hide messages on small mobile */}
            <div className="flex items-center gap-1 md:gap-2">
                <Link
                    href="/messages"
                    className="hidden xs:flex p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all relative"
                    title="Messages"
                >
                    <FiMessageSquare size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
                </Link>

                <NotificationButton show={showNotifications} setShow={setShowNotifications} />

                {/* Synced Status - visible on lg+ */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg ml-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700">Synced</span>
                </div>
            </div>

            {/* User Menu - always visible */}
            <div className="ml-1 md:ml-3 pl-1 md:pl-3 border-l border-gray-200">
                <UserMenu show={showUserMenu} setShow={setShowUserMenu} />
            </div>
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
                // Using validated API URL
                const response = await fetch(`${apiBaseUrl}/avatar/me`, {
                    headers: {
                        'Authorization': `Bearer ${tokenManager.getAccessToken()}`
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
                        <p className="text-sm font-semibold text-gray-800 truncate">
                            {user ? `${user.firstName} ${user.lastName}` : 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate" title={user?.email || '-'}>{user?.email || '-'}</p>
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
