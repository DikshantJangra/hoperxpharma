import { 
    MdDashboard, MdInventory, MdPeople, MdShoppingCart, MdReceipt, MdStore, MdIntegrationInstructions 
} from "react-icons/md"
import { 
    TbPrescription, TbReportAnalytics 
} from "react-icons/tb"
import { 
    RiCapsuleLine 
} from "react-icons/ri"
import { 
    FiPackage, FiDollarSign, FiTrendingUp, FiMessageSquare, FiShield, FiBook, FiHelpCircle, FiUsers 
} from "react-icons/fi"
import { 
    HiOutlineClipboardList 
} from "react-icons/hi"
import { 
    BsGift 
} from "react-icons/bs"
import { 
    AiOutlineAudit 
} from "react-icons/ai"

export interface SubMenuItem {
    label: string
    path: string
}

export interface MenuItem {
    icon: React.ReactNode
    label: string
    path?: string
    subItems?: SubMenuItem[]
}

export interface SidebarSection {
    title: string
    items: MenuItem[]
}

export const sidebarConfig: SidebarSection[] = [
    {
        title: "Operations",
        items: [
            {
                icon: <MdDashboard size={18} />,
                label: "Dashboard",
                subItems: [
                    { label: "Overview", path: "/dashboard/overview" },
                    { label: "Alerts", path: "/dashboard/alerts" },
                    { label: "Summary", path: "/dashboard/summary" }
                ]
            },
            {
                icon: <TbPrescription size={18} />,
                label: "Prescriptions",
                subItems: [
                    { label: "New", path: "/dashboard/prescriptions/new" },
                    { label: "Verified", path: "/dashboard/prescriptions/verified" },
                    { label: "Ready", path: "/dashboard/prescriptions/ready" },
                    { label: "Completed", path: "/dashboard/prescriptions/completed" },
                    { label: "On Hold", path: "/dashboard/prescriptions/on-hold" },
                    { label: "e-Rx", path: "/dashboard/prescriptions/e-rx" }
                ]
            },
            {
                icon: <RiCapsuleLine size={18} />,
                label: "Dispense",
                subItems: [
                    { label: "Intake", path: "/dashboard/dispense/intake" },
                    { label: "Verify", path: "/dashboard/dispense/verify" },
                    { label: "Fill", path: "/dashboard/dispense/fill" },
                    { label: "Label", path: "/dashboard/dispense/label" },
                    { label: "Check", path: "/dashboard/dispense/check" },
                    { label: "Release", path: "/dashboard/dispense/release" }
                ]
            },
            {
                icon: <MdPeople size={18} />,
                label: "Patients",
                subItems: [
                    { label: "List", path: "/dashboard/patients/list" },
                    { label: "Add / Edit", path: "/dashboard/patients/add" },
                    { label: "History", path: "/dashboard/patients/history" },
                    { label: "Refills", path: "/dashboard/patients/refills" },
                    { label: "Consents", path: "/dashboard/patients/consents" }
                ]
            }
        ]
    },
    {
        title: "Inventory & Supply",
        items: [
            {
                icon: <MdInventory size={18} />,
                label: "Inventory",
                subItems: [
                    { label: "Stock", path: "/dashboard/inventory/stock" },
                    { label: "Batches", path: "/dashboard/inventory/batches" },
                    { label: "Expiry", path: "/dashboard/inventory/expiry" },
                    { label: "Adjust", path: "/dashboard/inventory/adjust" },
                    { label: "Forecast", path: "/dashboard/inventory/forecast" }
                ]
            },
            {
                icon: <FiPackage size={18} />,
                label: "Orders",
                subItems: [
                    { label: "New PO", path: "/dashboard/orders/new" },
                    { label: "Pending", path: "/dashboard/orders/pending" },
                    { label: "Received", path: "/dashboard/orders/received" },
                    { label: "Suppliers", path: "/dashboard/orders/suppliers" },
                    { label: "Returns", path: "/dashboard/orders/returns" }
                ]
            },
            {
                icon: <HiOutlineClipboardList size={18} />,
                label: "Claims",
                subItems: [
                    { label: "Customer", path: "/dashboard/claims/customer" },
                    { label: "Supplier", path: "/dashboard/claims/supplier" },
                    { label: "Insurance", path: "/dashboard/claims/insurance" }
                ]
            }
        ]
    },
    {
        title: "Billing & Finance",
        items: [
            {
                icon: <MdShoppingCart size={18} />,
                label: "POS",
                subItems: [
                    { label: "New Sale", path: "/dashboard/pos/new" },
                    { label: "Invoices", path: "/dashboard/pos/invoices" },
                    { label: "Drafts", path: "/dashboard/pos/drafts" },
                    { label: "Refunds", path: "/dashboard/pos/refunds" }
                ]
            },
            {
                icon: <MdReceipt size={18} />,
                label: "GST",
                subItems: [
                    { label: "Invoices", path: "/dashboard/gst/invoices" },
                    { label: "Reports", path: "/dashboard/gst/reports" },
                    { label: "Returns", path: "/dashboard/gst/returns" },
                    { label: "Tax Setup", path: "/dashboard/gst/setup" }
                ]
            },
            {
                icon: <FiDollarSign size={18} />,
                label: "Finance",
                subItems: [
                    { label: "Sales", path: "/dashboard/finance/sales" },
                    { label: "Expenses", path: "/dashboard/finance/expenses" },
                    { label: "Reconcile", path: "/dashboard/finance/reconcile" }
                ]
            }
        ]
    },
    {
        title: "Analytics",
        items: [
            {
                icon: <TbReportAnalytics size={18} />,
                label: "Reports",
                subItems: [
                    { label: "Sales", path: "/dashboard/reports/sales" },
                    { label: "Purchase", path: "/dashboard/reports/purchase" },
                    { label: "Inventory", path: "/dashboard/reports/inventory" },
                    { label: "Profit", path: "/dashboard/reports/profit" },
                    { label: "Trends", path: "/dashboard/reports/trends" }
                ]
            },
            {
                icon: <FiTrendingUp size={18} />,
                label: "Insights",
                subItems: [
                    { label: "Forecast", path: "/dashboard/insights/forecast" },
                    { label: "Adherence", path: "/dashboard/insights/adherence" },
                    { label: "Performance", path: "/dashboard/insights/performance" }
                ]
            }
        ]
    },
    {
        title: "Communication",
        items: [
            {
                icon: <FiMessageSquare size={18} />,
                label: "Messages",
                subItems: [
                    { label: "WhatsApp", path: "/dashboard/messages/whatsapp" },
                    { label: "SMS", path: "/dashboard/messages/sms" },
                    { label: "Email", path: "/dashboard/messages/email" },
                    { label: "Templates", path: "/dashboard/messages/templates" }
                ]
            },
            {
                icon: <BsGift size={18} />,
                label: "Engage",
                subItems: [
                    { label: "Loyalty", path: "/dashboard/engage/loyalty" },
                    { label: "Coupons", path: "/dashboard/engage/coupons" },
                    { label: "Campaigns", path: "/dashboard/engage/campaigns" },
                    { label: "Feedback", path: "/dashboard/engage/feedback" }
                ]
            }
        ]
    },
    {
        title: "Compliance",
        items: [
            {
                icon: <AiOutlineAudit size={18} />,
                label: "Audit",
                subItems: [
                    { label: "Activity Log", path: "/dashboard/audit/activity" },
                    { label: "Access Log", path: "/dashboard/audit/access" },
                    { label: "Exports", path: "/dashboard/audit/exports" }
                ]
            },
            {
                icon: <FiShield size={18} />,
                label: "Regulations",
                subItems: [
                    { label: "DPDPA", path: "/dashboard/regulations/dpdpa" },
                    { label: "HIPAA / GDPR", path: "/dashboard/regulations/hipaa-gdpr" },
                    { label: "e-Rx Rules", path: "/dashboard/regulations/erx" }
                ]
            }
        ]
    },
    {
        title: "Settings",
        items: [
            {
                icon: <MdStore size={18} />,
                label: "Store",
                subItems: [
                    { label: "Profile", path: "/dashboard/store/profile" },
                    { label: "Licenses", path: "/dashboard/store/licenses" },
                    { label: "Hardware", path: "/dashboard/store/hardware" },
                    { label: "Timings", path: "/dashboard/store/timings" }
                ]
            },
            {
                icon: <FiUsers size={18} />,
                label: "Users",
                subItems: [
                    { label: "Roles", path: "/dashboard/users/roles" },
                    { label: "Permissions", path: "/dashboard/users/permissions" },
                    { label: "PIN Setup", path: "/dashboard/users/pin" }
                ]
            },
            {
                icon: <MdIntegrationInstructions size={18} />,
                label: "Integrations",
                subItems: [
                    { label: "APIs", path: "/dashboard/integrations/apis" },
                    { label: "WhatsApp", path: "/dashboard/integrations/whatsapp" },
                    { label: "Payments", path: "/dashboard/integrations/payments" },
                    { label: "Backups", path: "/dashboard/integrations/backups" }
                ]
            },
            {
                icon: <MdStore size={18} />,
                label: "Multi-Store",
                subItems: [
                    { label: "Switch", path: "/dashboard/multi-store/switch" },
                    { label: "Transfer", path: "/dashboard/multi-store/transfer" },
                    { label: "Summary", path: "/dashboard/multi-store/summary" }
                ]
            }
        ]
    },
    {
        title: "Support",
        items: [
            {
                icon: <FiBook size={18} />,
                label: "Knowledge",
                subItems: [
                    { label: "Drug Info", path: "/dashboard/knowledge/drugs" },
                    { label: "Interactions", path: "/dashboard/interactions" },
                    { label: "Guides", path: "/dashboard/knowledge/guides" }
                ]
            },
            {
                icon: <FiHelpCircle size={18} />,
                label: "Help",
                subItems: [
                    { label: "Chat", path: "/dashboard/help/chat" },
                    { label: "Docs", path: "/dashboard/help/docs" },
                    { label: "Updates", path: "/dashboard/help/updates" },
                    { label: "Feedback", path: "/dashboard/help/feedback" }
                ]
            }
        ]
    }
]
