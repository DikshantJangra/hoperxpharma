import { HiOutlineDocumentText } from "react-icons/hi"
import { MdShoppingCart, MdLocalPharmacy } from "react-icons/md"
import { FiPackage, FiChevronRight } from "react-icons/fi"
import Link from "next/link"

export default function QuickActions() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 shrink-0">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-2">
                <ActionButton icon={<HiOutlineDocumentText size={20} />} label="Scan Script (OCR)" shortcut="N" color="emerald" href="/prescriptions/new" />
                <ActionButton icon={<MdShoppingCart size={20} />} label="New Sale (POS)" shortcut="P" color="blue" href="/pos" />
                <ActionButton icon={<MdLocalPharmacy size={20} />} label="Check Interaction" shortcut="I" color="purple" href="/knowledge/interactions" />
                <ActionButton icon={<FiPackage size={20} />} label="Create PO" shortcut="O" color="orange" href="/orders/new-po" />
            </div>
        </div>
    )
}

function ActionButton({ icon, label, shortcut, color, href }: { icon: React.ReactNode, label: string, shortcut: string, color: string, href?: string }) {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600'
    }
    const content = (
        <>
            <div className={`p-2 rounded-lg ${colors[color as keyof typeof colors]}`}>{icon}</div>
            <span className="text-sm font-medium text-gray-800 flex-1 text-left">{label}</span>
            <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600">{shortcut}</kbd>
                <FiChevronRight className="text-gray-400 group-hover:text-gray-600" />
            </div>
        </>
    )

    if (href) {
        return (
            <Link href={href} className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 group">
                {content}
            </Link>
        )
    }

    return (
        <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 group">
            {content}
        </button>
    )
}
