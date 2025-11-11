"use client"
import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { FiChevronRight } from "react-icons/fi"
import { sidebarConfig } from "./sidebarConfig"

interface SidebarProps {
    isOpen: boolean
    expandedItems: string[]
    onToggleItem: (item: string) => void
}

export default function Sidebar({ isOpen, expandedItems, onToggleItem }: SidebarProps) {
    return (
        <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-100 transition-all duration-300 flex flex-col`}>
            <SidebarHeader isOpen={isOpen} />
            <nav className="flex-1 py-4 px-3 overflow-y-auto">
                {sidebarConfig.map((section, idx) => (
                    <SidebarSection 
                        key={idx}
                        section={section}
                        isOpen={isOpen}
                        expandedItems={expandedItems}
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
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">Rx</span>
                </div>
                {isOpen && (
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700">Hope<span className="text-emerald-500">Rx</span>Pharma</span>
                        <span className="text-xs text-gray-500">Dashboard</span>
                    </div>
                )}
            </div>
        </div>
    )
}

function SidebarSection({ section, isOpen, expandedItems, onToggleItem }: any) {
    return (
        <div className="mb-3">
            {isOpen && <SectionLabel>{section.title}</SectionLabel>}
            {section.items.map((item: any, idx: number) => (
                <NavItem 
                    key={idx}
                    item={item}
                    isOpen={isOpen}
                    expanded={expandedItems.includes(item.label.toLowerCase())}
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
    const hasSubItems = item.subItems && item.subItems.length > 0
    const isActive = hasSubItems && item.subItems.some((sub: any) => pathname === sub.path)
    
    return (
        <div className="mb-0.5">
            <button 
                onClick={hasSubItems ? onToggle : undefined}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md transition-colors ${
                    isActive ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
                <div className="flex items-center gap-3">
                    <span className="flex-shrink-0">{item.icon}</span>
                    {isOpen && <span className="text-sm">{item.label}</span>}
                </div>
                {isOpen && hasSubItems && (
                    <FiChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
                )}
            </button>
            {isOpen && expanded && hasSubItems && (
                <div className="ml-9 mt-1 space-y-0.5">{item.subItems.map((subItem: any, idx: number) => (
                    <SubItem key={idx} label={subItem.label} path={subItem.path} active={pathname === subItem.path} />
                ))}</div>
            )}
        </div>
    )
}

function SubItem({ label, path, active }: { label: string, path: string, active: boolean }) {
    return (
        <Link href={path} className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
            active ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}>
            {label}
        </Link>
    )
}
