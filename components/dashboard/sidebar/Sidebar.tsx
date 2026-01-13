"use client"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { FiChevronRight, FiLock } from "react-icons/fi"
import { sidebarConfig } from "./sidebarConfig"
import Logo from "@/components/ui/Logo"
import { usePermissions } from "@/contexts/PermissionContext"
import { useAuthStore } from "@/lib/store/auth-store"
import { useBusinessType } from "@/contexts/BusinessTypeContext"
import { TrialBadge } from "./TrialBadge"
import { useFeatureAccess } from "@/lib/hooks/useFeatureAccess"
import { usePremiumTheme } from "@/lib/hooks/usePremiumTheme"

interface SidebarProps {
    isOpen: boolean
    isMobile?: boolean
    expandedItems: string[]
    onToggleItem: (item: string) => void
    onClose?: () => void
}

export default function Sidebar({ isOpen, isMobile, expandedItems, onToggleItem, onClose }: SidebarProps) {
    const { isPremium, tokens } = usePremiumTheme();

    if (!Array.isArray(sidebarConfig)) return null;

    return (
        <aside
            className={`
                ${isMobile
                    ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform ${isPremium ? tokens.motion.duration + ' ' + tokens.motion.easing : 'duration-300 ease-in-out'} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
                    : `${isOpen ? 'w-64' : 'w-20'} h-full transition-all ${isPremium ? tokens.motion.duration + ' ' + tokens.motion.easing : 'duration-300'}`
                }
                ${tokens.sidebar.bg} ${tokens.sidebar.border} border-r flex flex-col overflow-hidden
                ${isPremium ? tokens.sidebar.shadow : ''}
            `}
            {...(isPremium ? { 'data-premium': 'true' } : {})}
        >
            <SidebarHeader isOpen={isOpen || !!isMobile} isPremium={isPremium} />
            <nav className="flex-1 py-4 px-3 overflow-y-auto">
                {sidebarConfig.map((section, idx) => (
                    <SidebarSection
                        key={idx}
                        section={section}
                        isOpen={isOpen || !!isMobile}
                        expandedItems={expandedItems || []}
                        onToggleItem={onToggleItem}
                        isPremium={isPremium}
                    />
                ))}
            </nav>
            {/* Trial Badge at bottom - hide for premium */}
            {!isPremium && <TrialBadge isOpen={isOpen || !!isMobile} />}
        </aside>
    )
}

function SidebarHeader({ isOpen, isPremium }: { isOpen: boolean; isPremium?: boolean }) {
    const { tokens } = usePremiumTheme();
    return (
        <div className={`h-14 md:h-16 flex items-center justify-center ${isPremium ? tokens.navbarGradient + ' border-white/10' : 'border-gray-100'} border-b px-4 transition-all ${isPremium ? tokens.motion.duration + ' ' + tokens.motion.easing : 'duration-300'}`}>
            <div className="flex items-center gap-3">
                <Logo size="md" showText={isOpen} subtitle={isOpen ? "Dashboard" : undefined} isWhite={isPremium} />
            </div>
        </div>
    )
}

function SidebarSection({ section, isOpen, expandedItems, onToggleItem, isPremium }: any) {
    const { permissions } = usePermissions();
    const { user } = useAuthStore();
    const { businessType } = useBusinessType();

    if (!section || !Array.isArray(section.items)) return null;

    // ADMIN users see everything - bypass permission checks
    const isAdmin = user?.role === 'ADMIN';

    // Filter items based on permissions AND business type
    const visibleItems = section.items.filter((item: any) => {
        // Business type filtering (if businessTypes array is defined)
        if (item.businessTypes && Array.isArray(item.businessTypes) && businessType) {
            // If item has businessTypes restriction and user's business type is not in the list, hide it
            const isAllowed = item.businessTypes.includes(businessType);
            if (!isAllowed) {
                return false;
            }
        }

        // If user is ADMIN, show all items (that passed business type filter)
        if (isAdmin) return true;

        // If no permission required, show the item
        if (!item.requiredPermission) return true;

        // Check if user has the required permission
        return permissions.includes(item.requiredPermission);
    });

    // Don't render section if no items are visible
    if (visibleItems.length === 0) return null;

    return (
        <div className="mb-3">
            {isOpen && <SectionLabel>{section.title}</SectionLabel>}
            {visibleItems.map((item: any, idx: number) => (
                <NavItem
                    key={idx}
                    item={item}
                    isOpen={isOpen}
                    expanded={Array.isArray(expandedItems) && expandedItems.includes(item.label.toLowerCase())}
                    onToggle={() => onToggleItem(item.label.toLowerCase())}
                />
            ))}
        </div>
    )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <div className="px-3 py-2 text-xs font-medium text-gray-400 mt-4 first:mt-0">{children}</div>
}

function NavItem({ item, isOpen, expanded, onToggle }: any) {
    const pathname = usePathname()
    const router = useRouter()
    const { permissions } = usePermissions()
    const { user } = useAuthStore()

    // Check if feature is gated
    // We must call the hook unconditionally to follow Rules of Hooks
    // Use a safe core feature (POS) as fallback for non-gated items
    const featureToCheck = item.gatedFeature || 'POS'
    const accessData = useFeatureAccess(featureToCheck)

    const featureAccess = item.gatedFeature
        ? accessData
        : { hasAccess: true, reason: '', upgradePrompt: '', requiredModules: [], isCore: false }
        
    const isLocked = !featureAccess.hasAccess

    const hasSubItems = item.subItems && Array.isArray(item.subItems) && item.subItems.length > 0

    // ADMIN users see everything - bypass permission checks
    const isAdmin = user?.role === 'ADMIN'

    // Filter sub-items based on permissions
    const visibleSubItems = hasSubItems
        ? item.subItems.filter((subItem: any) => {
            // If user is ADMIN, show all sub-items
            if (isAdmin) return true
            // If no permission required, show the sub-item
            if (!subItem.requiredPermission) return true
            // Check if user has the required permission
            return permissions.includes(subItem.requiredPermission)
        })
        : []

    const hasVisibleSubItems = visibleSubItems.length > 0

    // Check if this exact item path is active
    const isExactActive = item.path ? pathname === item.path : false
    // Check if any child is active (for parent highlighting)
    const hasActiveChild = hasVisibleSubItems && visibleSubItems.some((sub: any) => pathname === sub.path)
    // Combined: either exact match or has active child
    const isActive = isExactActive || hasActiveChild

    // If item has a direct path (no subitems), render as Link or locked button
    if (item.path && !hasVisibleSubItems) {
        // If locked, show as button that redirects to upgrade
        if (isLocked) {
            return (
                <button
                    onClick={() => router.push('/store/billing')}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md transition-colors text-gray-400 hover:bg-gray-50 opacity-60 cursor-help"
                    title={featureAccess.reason}
                >
                    <div className="flex items-center gap-3">
                        <span className="shrink-0">{item.icon}</span>
                        {isOpen && <span className="text-sm">{item.label}</span>}
                    </div>
                    {isOpen && <FiLock className="w-3.5 h-3.5" />}
                </button>
            )
        }

        // Not locked - normal link
        return (
            <Link
                href={item.path}
                data-tour={`sidebar-${item.label.toLowerCase().replace(/ /g, '-')}`}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md transition-colors ${isActive ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <span className="shrink-0">{item.icon}</span>
                    {isOpen && <span className="text-sm">{item.label}</span>}
                </div>
            </Link>
        )
    }

    // If item has subitems, render as expandable button
    // Show lock icon if gated
    const handleClick = () => {
        if (isLocked) {
            router.push('/store/billing')
        } else if (hasVisibleSubItems) {
            onToggle()
        }
    }

    return (
        <div className="mb-0.5">
            <button
                onClick={handleClick}
                data-tour={`sidebar-${item.label.toLowerCase().replace(/ /g, '-')}`}
                title={isLocked ? featureAccess.reason : undefined}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md transition-colors ${isLocked
                    ? 'text-gray-400 hover:bg-gray-50 opacity-60 cursor-help'
                    : hasActiveChild
                        ? 'text-emerald-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <span className={`shrink-0 ${hasActiveChild && !isLocked ? 'text-emerald-600' : ''}`}>{item.icon}</span>
                    {isOpen && <span className="text-sm">{item.label}</span>}
                </div>
                {isOpen && (
                    isLocked ? (
                        <FiLock className="w-3.5 h-3.5" />
                    ) : hasVisibleSubItems ? (
                        <FiChevronRight size={16} className={`${hasActiveChild ? 'text-emerald-500' : 'text-gray-400'} transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
                    ) : null
                )}
            </button>
            {isOpen && expanded && hasVisibleSubItems && !isLocked && (
                <div className="ml-9 mt-1 space-y-0.5">{visibleSubItems.map((subItem: any, idx: number) => (
                    <SubItem key={idx} label={subItem.label} path={subItem.path} active={pathname === subItem.path} />
                ))}</div>
            )}
        </div>
    )
}

function SubItem({ label, path, active }: { label: string, path: string, active: boolean }) {
    return (
        <Link href={path} className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${active ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}>
            {label}
        </Link>
    )
}
