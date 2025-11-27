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
                    { label: "New", path: "/prescriptions/new" },
                    { label: "Verified", path: "/prescriptions/verified" },
                    { label: "Ready", path: "/prescriptions/ready" },
                    { label: "Completed", path: "/prescriptions/completed" },
                    { label: "On Hold", path: "/prescriptions/on-hold" },
                    { label: "e-Rx", path: "/prescriptions/e-rx" }
                ]
            },
            {
                icon: <RiCapsuleLine size={18} />,
                label: "Dispense",
                subItems: [
                    { label: "Queue", path: "/dispense/queue" },
                    { label: "Verify", path: "/dispense/verify" },
                    { label: "Fill", path: "/dispense/fill" },
                    { label: "Label", path: "/dispense/label" },
                    { label: "Check", path: "/dispense/check" },
                    { label: "Dispense", path: "/dispense/dispense" }
                ]
            },
            {
                icon: <MdPeople size={18} />,
                label: "Patients",
                subItems: [
                    { label: "List", path: "/patients/list" },
                    { label: "Add / Edit", path: "/patients/add" },
                    { label: "History", path: "/patients/history" },
                    { label: "Refills", path: "/patients/refills" },
                    { label: "Consents", path: "/patients/consents" }
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
                    { label: "Stock", path: "/inventory/stock" },
                    { label: "Batches", path: "/inventory/batches" },
                    { label: "Expiry", path: "/inventory/expiry" },
                    { label: "Adjust", path: "/inventory/adjust" },
                    { label: "Forecast", path: "/inventory/forecast" }
                ]
            },
            {
                icon: <FiPackage size={18} />,
                label: "Orders",
                subItems: [
                    { label: "Overview", path: "/orders" },
                    { label: "New PO", path: "/orders/new-po" },
                    { label: "Pending", path: "/orders/pending" },
                    { label: "Received", path: "/orders/received" },
                    { label: "Returns", path: "/orders/returns" }
                ]
            },
            {
                icon: <FiUsers size={18} />,
                label: "Suppliers",
                subItems: [
                    { label: "Overview", path: "/suppliers" },
                    { label: "Payables", path: "/suppliers/payables" },
                    { label: "Compliance", path: "/suppliers/compliance" },
                    { label: "Analytics", path: "/suppliers/analytics" }
                ]
            },
            {
                icon: <HiOutlineClipboardList size={18} />,
                label: "Claims",
                subItems: [
                    { label: "Customer", path: "/claims/customer" },
                    { label: "Supplier", path: "/claims/supplier" },
                    { label: "Insurance", path: "/claims/insurance" }
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
                    { label: "New Sale", path: "/pos/new-sale" },
                    { label: "Invoices", path: "/pos/invoices" },
                    { label: "Drafts", path: "/pos/drafts" },
                    { label: "Refunds", path: "/pos/refunds" }
                ]
            },
            {
                icon: <MdReceipt size={18} />,
                label: "GST",
                subItems: [
                    { label: "Dashboard", path: "/gst" },
                    { label: "Invoices", path: "/gst/invoices" },
                    { label: "GSTR Filing", path: "/gst/returns" },
                    { label: "Tax Slabs", path: "/gst/tax-slabs" },
                    { label: "HSN Codes", path: "/gst/hsn-codes" },
                    { label: "Mismatches", path: "/gst/mismatches" },
                    { label: "Exports", path: "/gst/exports" }
                ]
            },
            {
                icon: <FiDollarSign size={18} />,
                label: "Finance",
                subItems: [
                    { label: "Sales", path: "/finance/sales" },
                    { label: "Expenses", path: "/finance/expenses" },
                    { label: "Reconcile", path: "/finance/reconcile" }
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
                    { label: "Sales", path: "/reports/sales" },
                    { label: "Purchase", path: "/reports/purchase" },
                    { label: "Inventory", path: "/reports/inventory" },
                    { label: "Profit", path: "/reports/profit" },
                    { label: "Trends", path: "/reports/trends" }
                ]
            },
            {
                icon: <FiTrendingUp size={18} />,
                label: "Insights",
                subItems: [
                    { label: "Forecast", path: "/insights/forecast" },
                    { label: "Adherence", path: "/insights/adherence" },
                    { label: "Performance", path: "/insights/performance" }
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
                    { label: "WhatsApp", path: "/messages/whatsapp" },
                    { label: "SMS", path: "/messages/sms" },
                    { label: "Email", path: "/messages/email" },
                    { label: "Templates", path: "/messages/templates" }
                ]
            },
            {
                icon: <BsGift size={18} />,
                label: "Engage",
                subItems: [
                    { label: "Loyalty", path: "/engage/loyalty" },
                    { label: "Coupons", path: "/engage/coupons" },
                    { label: "Campaigns", path: "/engage/campaigns" },
                    { label: "Feedback", path: "/engage/feedback" }
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
                    { label: "Activity Log", path: "/audit/activity-log" },
                    { label: "Access Log", path: "/audit/access" },
                    { label: "Exports", path: "/audit/exports" }
                ]
            },
            {
                icon: <FiShield size={18} />,
                label: "Regulations",
                subItems: [
                    { label: "DPDPA", path: "/regulations/dpdpa" },
                    { label: "HIPAA / GDPR", path: "/regulations/hipaa-gdpr" },
                    { label: "e-Rx Rules", path: "/regulations/erx" }
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
                    { label: "Profile", path: "/store/profile" },
                    { label: "Licenses", path: "/store/licenses" },
                    { label: "Hardware", path: "/store/hardware" },
                    { label: "Timings", path: "/store/timings" }
                ]
            },
            {
                icon: <FiUsers size={18} />,
                label: "Users",
                subItems: [
                    { label: "Roles", path: "/users/roles" },
                    { label: "Permissions", path: "/users/permissions" },
                    { label: "Manage Users", path: "/users" },
                    { label: "PIN Setup", path: "/users/pin" }
                ]
            },
            {
                icon: <MdIntegrationInstructions size={18} />,
                label: "Integrations",
                subItems: [
                    { label: "APIs", path: "/integrations/apis" },
                    { label: "WhatsApp", path: "/integrations/whatsapp" },
                    { label: "Payments", path: "/integrations/payments" },
                    { label: "Backups", path: "/integrations/backups" }
                ]
            },
            {
                icon: <MdStore size={18} />,
                label: "Multi-Store",
                subItems: [
                    { label: "Switch", path: "/multi-store/switch" },
                    { label: "Transfer", path: "/multi-store/transfer" },
                    { label: "Summary", path: "/multi-store/summary" }
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
                    { label: "Drug Info", path: "/knowledge/drug-info" },
                    { label: "Interactions", path: "/knowledge/interactions" },
                    { label: "Guides", path: "/knowledge/guides" }
                ]
            },
            {
                icon: <FiHelpCircle size={18} />,
                label: "Help",
                subItems: [
                    { label: "Chat", path: "/help/chat" },
                    { label: "Docs", path: "/help/docs" },
                    { label: "Updates", path: "/help/updates" },
                    { label: "Feedback", path: "/help/feedback" }
                ]
            }
        ]
    }
]
