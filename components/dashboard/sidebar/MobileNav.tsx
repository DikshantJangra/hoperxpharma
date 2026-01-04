"use client"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { FiX, FiChevronDown } from "react-icons/fi"
import { motion, AnimatePresence } from "framer-motion"
import { sidebarConfig, MenuItem } from "./sidebarConfig"
import Logo from "@/components/ui/Logo"
import { usePermissions } from "@/contexts/PermissionContext"
import { useAuthStore } from "@/lib/store/auth-store"
import { useBusinessType } from "@/contexts/BusinessTypeContext"

interface MobileNavProps {
    isOpen: boolean
    onClose: () => void
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
    const pathname = usePathname()
    const { permissions } = usePermissions()
    const { user } = useAuthStore()
    const { businessType } = useBusinessType()
    const [expandedItem, setExpandedItem] = useState<string | null>(null)

    // Close menu on route change
    useEffect(() => {
        if (isOpen) {
            onClose()
        }
    }, [pathname])

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
            setExpandedItem(null) // Reset expanded state when closing
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    const isAdmin = user?.role === 'ADMIN'

    // Filter items based on permissions and business type
    const filterItems = (items: MenuItem[]) => {
        return items.filter((item) => {
            if (item.businessTypes && Array.isArray(item.businessTypes) && businessType) {
                if (!item.businessTypes.includes(businessType)) return false
            }
            if (isAdmin) return true
            if (!item.requiredPermission) return true
            return permissions.includes(item.requiredPermission)
        })
    }

    // Get main quick access items (most used)
    const quickAccessItems = [
        { icon: sidebarConfig[0]?.items[0]?.icon, label: "Dashboard", path: "/dashboard/overview" },
        { icon: sidebarConfig[0]?.items[1]?.icon, label: "Prescriptions", path: "/prescriptions/all-prescriptions" },
        { icon: sidebarConfig[2]?.items[0]?.icon, label: "POS", path: "/pos/new-sale" },
        { icon: sidebarConfig[1]?.items[0]?.icon, label: "Inventory", path: "/inventory/stock" },
    ]

    const handleItemClick = (item: MenuItem, itemKey: string) => {
        if (item.subItems && item.subItems.length > 0) {
            // Toggle expansion for items with sub-items
            setExpandedItem(expandedItem === itemKey ? null : itemKey)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 md:hidden"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Fullscreen Menu - Slides from TOP */}
                    <motion.div
                        initial={{ y: "-100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "-100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 350 }}
                        className="absolute inset-0 bg-white flex flex-col"
                    >
                        {/* Header - Logo Centered */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                            <div className="w-10" /> {/* Spacer for centering */}
                            <Logo size="md" showText={true} />
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                <FiX size={22} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Quick Access Grid */}
                        <div className="p-4 bg-gray-50 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Access</p>
                            <div className="grid grid-cols-4 gap-2">
                                {quickAccessItems.map((item, idx) => (
                                    <Link
                                        key={idx}
                                        href={item.path}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${pathname === item.path
                                            ? 'bg-emerald-500 text-white shadow-lg'
                                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                                            }`}
                                    >
                                        <span className="text-lg mb-1">{item.icon}</span>
                                        <span className="text-[10px] font-medium">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Scrollable Sections with Expandable Items */}
                        <div className="flex-1 overflow-y-auto">
                            {sidebarConfig.map((section, sectionIdx) => {
                                const visibleItems = filterItems(section.items)
                                if (visibleItems.length === 0) return null

                                return (
                                    <div key={sectionIdx} className="border-b border-gray-50">
                                        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {section.title}
                                        </p>
                                        <div className="px-2 pb-2">
                                            {visibleItems.map((item, itemIdx) => {
                                                const itemKey = `${sectionIdx}-${itemIdx}`
                                                const hasSubItems = item.subItems && item.subItems.length > 0
                                                const isExpanded = expandedItem === itemKey
                                                const mainPath = item.path || item.subItems?.[0]?.path || '#'
                                                const isActive = pathname?.startsWith(mainPath.split('/').slice(0, 2).join('/'))

                                                return (
                                                    <div key={itemIdx} className="mb-1">
                                                        {/* Main Item */}
                                                        {hasSubItems ? (
                                                            <button
                                                                onClick={() => handleItemClick(item, itemKey)}
                                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isActive
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'text-gray-700 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`text-lg ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                                        {item.icon}
                                                                    </span>
                                                                    <span className="text-sm font-medium">{item.label}</span>
                                                                    {hasSubItems && (
                                                                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                                                            {item.subItems?.length}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <FiChevronDown
                                                                    size={18}
                                                                    className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                                                />
                                                            </button>
                                                        ) : (
                                                            <Link
                                                                href={mainPath}
                                                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'text-gray-700 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                <span className={`text-lg ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                                    {item.icon}
                                                                </span>
                                                                <span className="text-sm font-medium">{item.label}</span>
                                                            </Link>
                                                        )}

                                                        {/* Sub Items - Expandable */}
                                                        <AnimatePresence>
                                                            {hasSubItems && isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="ml-8 mt-1 space-y-1 pb-2">
                                                                        {item.subItems?.map((subItem, subIdx) => {
                                                                            const isSubActive = pathname === subItem.path
                                                                            return (
                                                                                <Link
                                                                                    key={subIdx}
                                                                                    href={subItem.path}
                                                                                    className={`block px-3 py-2 rounded-lg text-sm transition-all ${isSubActive
                                                                                        ? 'bg-emerald-500 text-white font-medium'
                                                                                        : 'text-gray-600 hover:bg-gray-100'
                                                                                        }`}
                                                                                >
                                                                                    {subItem.label}
                                                                                </Link>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Bottom Safe Area */}
                        <div className="h-6 bg-white border-t border-gray-100" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
