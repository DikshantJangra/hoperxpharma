import {
    MdDashboard, MdInventory, MdPeople, MdShoppingCart, MdReceipt, MdStore, MdIntegrationInstructions, MdKeyboard, MdLocalHospital
} from "react-icons/md"
import {
    TbPrescription, TbReportAnalytics
} from "react-icons/tb"
import {
    RiCapsuleLine
} from "react-icons/ri"
import {
    FiPackage, FiDollarSign, FiTrendingUp, FiMessageSquare, FiShield, FiBook, FiHelpCircle, FiUsers, FiFileText
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
import { Feature } from "@/lib/constants/billing-states"

export interface SubMenuItem {
    label: string
    path: string
    requiredPermission?: string | null // Permission required for this specific sub-item
}

export interface MenuItem {
    icon: React.ReactNode
    label: string
    path?: string
    subItems?: SubMenuItem[]
    requiredPermission?: string | null // Permission code required to view this item (null = public)
    businessTypes?: string[] // Which business types can see this (undefined = all types)
    availability?: 'essential' | 'optional' | 'hidden' // Availability level for business type
    featureCode?: string // Feature code for business type filtering (e.g., 'prescriptions', 'pos')
    gatedFeature?: Feature // Billing feature gate (if requires subscription)
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
                requiredPermission: null,
                subItems: [
                    { label: "Overview", path: "/dashboard/overview" },
                    { label: "Alerts", path: "/dashboard/alerts" },
                    { label: "Summary", path: "/dashboard/summary" }
                ]
            },
            {
                icon: <TbPrescription size={18} />,
                label: "Prescriptions",
                path: "/prescriptions",
                requiredPermission: "prescription.read",
                subItems: [
                    { label: "All Prescriptions", path: "/prescriptions/all-prescriptions" },
                    { label: "Prescribers", path: "/prescribers", requiredPermission: "prescriber.read" }
                ]
            },
            {
                icon: <MdPeople size={18} />,
                label: "Patients",
                requiredPermission: "patient.read",
                featureCode: "patients",
                businessTypes: ["Retail Pharmacy", "Hospital-based Pharmacy", "Multi-store Chain"],
                subItems: [
                    { label: "List", path: "/patients/list", requiredPermission: "patient.read" },
                    { label: "Refills", path: "/patients/refills", requiredPermission: "prescription.refill" }
                    // Consents removed as requested
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
                path: "/inventory/stock",
                requiredPermission: "inventory.read",
                subItems: [
                    { label: "Overview", path: "/inventory/stock", requiredPermission: "inventory.read" },
                    { label: "Maintenance", path: "/inventory/maintenance", requiredPermission: "inventory.read" },
                    { label: "Batches", path: "/inventory/batches", requiredPermission: "inventory.read" },
                    { label: "Expiry", path: "/inventory/expiry", requiredPermission: "inventory.read" }
                ]
            },
            {
                icon: <FiPackage size={18} />,
                label: "Purchase Orders",
                requiredPermission: "po.read",
                path: "/orders/pending",
                subItems: [
                    { label: "New PO", path: "/orders/new-po", requiredPermission: "po.create" },
                    { label: "To Receive", path: "/orders/pending", requiredPermission: "po.read" },
                    { label: "Received", path: "/orders/received", requiredPermission: "po.receive" },
                    { label: "Returns", path: "/orders/returns", requiredPermission: "po.read" }
                ]
            },
            {
                icon: <FiUsers size={18} />,
                label: "Suppliers",
                requiredPermission: "po.read",
                subItems: [
                    { label: "Overview", path: "/suppliers" },
                    { label: "Invoices", path: "/supplier-invoices", requiredPermission: "po.read" }, // Consolidated here
                    { label: "Payables", path: "/suppliers/payables" },
                    { label: "Compliance", path: "/suppliers/compliance" },
                    { label: "Analytics", path: "/suppliers/analytics" }
                ]
            },
            {
                icon: <HiOutlineClipboardList size={18} />,
                label: "Claims",
                requiredPermission: "sales.read",
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
                requiredPermission: "sales.create",
                featureCode: "pos",
                businessTypes: ["Retail Pharmacy", "Multi-store Chain"],
                subItems: [
                    { label: "New Sale", path: "/pos/new-sale", requiredPermission: "sales.create" },
                    { label: "Invoices", path: "/pos/invoices", requiredPermission: "sales.read" },
                    { label: "Drafts", path: "/pos/drafts", requiredPermission: "sales.read" },
                    { label: "Refunds", path: "/pos/refunds", requiredPermission: "sales.refund" }
                ]
            },
            {
                icon: <MdReceipt size={18} />,
                label: "GST",
                requiredPermission: "report.financial",
                gatedFeature: Feature.REPORTS,
                subItems: [
                    { label: "Dashboard", path: "/gst" },
                    { label: "Invoices", path: "/gst/invoices" },
                    { label: "GSTR Filing", path: "/gst/returns" }
                    // Removed extra GST items as requested
                ]
            },
            {
                icon: <FiDollarSign size={18} />,
                label: "Accounts", // Renamed from Finance
                requiredPermission: "report.financial",
                subItems: [
                    { label: "Credit / Dues", path: "/finance/credit", requiredPermission: "report.financial" },
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
                requiredPermission: "report.sales",
                gatedFeature: Feature.REPORTS,
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
                requiredPermission: "report.sales",
                gatedFeature: Feature.ADVANCED_REPORTS,
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
                requiredPermission: "communication.send",
                gatedFeature: Feature.WHATSAPP,
                subItems: [
                    { label: "WhatsApp", path: "/messages/whatsapp", requiredPermission: "communication.send" },
                    { label: "SMS", path: "/messages/sms", requiredPermission: "communication.send" },
                    { label: "Email", path: "/messages/email", requiredPermission: "communication.send" },
                    { label: "Templates", path: "/messages/templates", requiredPermission: "communication.template" }
                ]
            },
            {
                icon: <BsGift size={18} />,
                label: "Engage",
                requiredPermission: "marketing.loyalty",
                featureCode: "engage",
                gatedFeature: Feature.LOYALTY,
                businessTypes: ["Retail Pharmacy", "Multi-store Chain"],
                subItems: [
                    { label: "Loyalty", path: "/engage/loyalty", requiredPermission: "marketing.loyalty" },
                    { label: "Coupons", path: "/engage/coupons", requiredPermission: "marketing.loyalty" },
                    { label: "Campaigns", path: "/engage/campaigns", requiredPermission: "marketing.campaign" },
                    { label: "Feedback", path: "/engage/feedback", requiredPermission: null }
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
                requiredPermission: "system.audit.view",
                subItems: [
                    { label: "Activity Log", path: "/audit/activity-log" },
                    { label: "Access Log", path: "/audit/access" },
                    { label: "Exports", path: "/audit/exports" }
                ]
            },
            {
                icon: <FiShield size={18} />,
                label: "Regulations",
                requiredPermission: "report.compliance",
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
                requiredPermission: "system.store.manage",
                subItems: [
                    { label: "Profile", path: "/store/profile" },
                    { label: "Plan & Billing", path: "/store/billing" },
                    { label: "Invoice Design", path: "/store/invoice-design" },
                    { label: "Licenses", path: "/store/licenses" },
                    { label: "Timings", path: "/store/timings" },
                    { label: "Keyboard Shortcuts", path: "/store/keyboard-shortcuts" }
                ]
            },
            {
                icon: <FiUsers size={18} />,
                label: "Team",
                requiredPermission: "system.user.manage",
                gatedFeature: Feature.AUTOMATION,
                subItems: [
                    { label: "Manage Users", path: "/users" },
                    { label: "Roles & Access", path: "/users?tab=roles" }
                ]
            },
            {
                icon: <MdIntegrationInstructions size={18} />,
                label: "Integrations",
                requiredPermission: "system.settings",
                gatedFeature: Feature.AUTOMATION,
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
                requiredPermission: "system.store.manage",
                featureCode: "multiStore",
                businessTypes: ["Multi-store Chain"],
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
                requiredPermission: null,
                subItems: [
                    { label: "Drug Info", path: "/knowledge/drug-info" },
                    { label: "Interactions", path: "/knowledge/interactions" },
                    { label: "Guides", path: "/knowledge/guides" }
                ]
            },
            {
                icon: <FiHelpCircle size={18} />,
                label: "Help",
                requiredPermission: null,
                subItems: [
                    { label: "Chat", path: "/help/chat" },
                    { label: "Docs", path: "/help/docs" },
                    { label: "Updates", path: "/help/updates" }, // Restored Updates
                    { label: "Feedback", path: "/help/feedback" }
                ]
            }
        ]
    }
]
