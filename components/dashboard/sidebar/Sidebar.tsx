"use client"
import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { FiChevronRight } from "react-icons/fi"
import { sidebarConfig } from "./sidebarConfig"
import Logo from "@/components/ui/Logo"
import { usePermissions } from "@/contexts/PermissionContext"
import { useAuthStore } from "@/lib/store/auth-store"

interface SidebarProps {
    isOpen: boolean
    expandedItems: string[]
    onToggleItem: (item: string) => void
}

export default function Sidebar({ isOpen, expandedItems, onToggleItem }: SidebarProps) {
    if (!Array.isArray(sidebarConfig)) return null;

    return (
        <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-100 transition-all duration-300 flex flex-col`}>
            <SidebarHeader isOpen={isOpen} />
            <nav className="flex-1 py-4 px-3 overflow-y-auto">
                {sidebarConfig.map((section, idx) => (
                    <SidebarSection
                        key={idx}
                        section={section}
                        isOpen={isOpen}
                        expandedItems={expandedItems || []}
                        onToggleItem={onToggleItem}
                    />
                ))}
            </nav>
        </aside>
    )
}

function SidebarHeader({ isOpen }: { isOpen: boolean }) {
    return (
        <div className="h-16 flex items-center justify-center border-b border-gray-100 px-4">
            <div className="flex items-center gap-3">
                <Logo size="md" showText={isOpen} subtitle={isOpen ? "Dashboard" : undefined} />
            </div>
        </div>
    )
}

function SidebarSection({ section, isOpen, expandedItems, onToggleItem }: any) {
    const { permissions } = usePermissions();
    const { user } = useAuthStore();

    if (!section || !Array.isArray(section.items)) return null;

    // ADMIN users see everything - bypass permission checks
    const isAdmin = user?.role === 'ADMIN';

    // Filter items based on permissions
    const visibleItems = section.items.filter((item: any) => {
        // If user is ADMIN, show all items
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
    const { permissions } = usePermissions()
    const { user } = useAuthStore()

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
    const isActive = item.path ? pathname === item.path : (hasVisibleSubItems && visibleSubItems.some((sub: any) => pathname === sub.path))

    // If item has a direct path (no subitems), render as Link
    if (item.path && !hasVisibleSubItems) {
        return (
            <Link
                href={item.path}
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
    return (
        <div className="mb-0.5">
            <button
                onClick={hasVisibleSubItems ? onToggle : undefined}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md transition-colors ${isActive ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <span className="shrink-0">{item.icon}</span>
                    {isOpen && <span className="text-sm">{item.label}</span>}
                </div>
                {isOpen && hasVisibleSubItems && (
                    <FiChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
                )}
            </button>
            {isOpen && expanded && hasVisibleSubItems && (
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
