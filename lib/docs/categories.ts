import { DocCategory } from '@/types/docs';
import { IconType } from 'react-icons';
import {
    MdRocketLaunch,
    MdBolt,
    MdInventory,
    MdPointOfSale,
    MdDescription,
    MdPeople,
    MdLocalShipping,
    MdBarChart,
    MdIntegrationInstructions,
    MdSettings,
    MdSecurity,
    MdReceipt,
    MdBuild,
    MdCode,
    MdSchool,
    MdGavel,
    MdHelp
} from 'react-icons/md';

export const DOC_CATEGORIES: DocCategory[] = [
    {
        id: 'getting-started',
        label: 'Getting Started',
        icon: 'MdRocketLaunch',
        description: 'Quick start guides and initial setup',
        order: 1,
        color: 'from-blue-500 to-cyan-500',
    },
    {
        id: 'quick-tasks',
        label: 'Quick Tasks',
        icon: 'MdBolt',
        description: 'Common tasks and workflows',
        order: 2,
        color: 'from-amber-500 to-orange-500',
    },
    {
        id: 'inventory',
        label: 'Inventory Management',
        icon: 'MdInventory',
        description: 'Product, batch, and stock management',
        order: 3,
        color: 'from-purple-500 to-pink-500',
    },
    {
        id: 'pos',
        label: 'Sales & POS',
        icon: 'MdPointOfSale',
        description: 'Point of sale and payment processing',
        order: 4,
        color: 'from-emerald-500 to-teal-500',
    },
    {
        id: 'prescriptions',
        label: 'Prescriptions',
        icon: 'MdDescription',
        description: 'Prescription handling and pharmacist workflows',
        order: 5,
        color: 'from-indigo-500 to-purple-500',
    },
    {
        id: 'customers',
        label: 'Customers & Loyalty',
        icon: 'MdPeople',
        description: 'Customer management and loyalty programs',
        order: 6,
        color: 'from-rose-500 to-pink-500',
    },
    {
        id: 'suppliers',
        label: 'Suppliers & Purchase Orders',
        icon: 'MdLocalShipping',
        description: 'Supplier management and procurement',
        order: 7,
        color: 'from-cyan-500 to-blue-500',
    },
    {
        id: 'reports',
        label: 'Reports & Analytics',
        icon: 'MdBarChart',
        description: 'Business intelligence and reporting',
        order: 8,
        color: 'from-green-500 to-emerald-500',
    },
    {
        id: 'integrations',
        label: 'Integrations & APIs',
        icon: 'MdIntegrationInstructions',
        description: 'Third-party integrations and API documentation',
        order: 9,
        color: 'from-violet-500 to-purple-500',
    },
    {
        id: 'settings',
        label: 'Settings & Administration',
        icon: 'MdSettings',
        description: 'System configuration and user management',
        order: 10,
        color: 'from-slate-500 to-gray-500',
    },
    {
        id: 'compliance',
        label: 'Security & Compliance',
        icon: 'MdSecurity',
        description: 'Audit logs, e-invoicing, and data privacy',
        order: 11,
        color: 'from-red-500 to-rose-500',
    },
    {
        id: 'billing',
        label: 'Billing & Receipts',
        icon: 'MdReceipt',
        description: 'Invoicing, GST, and receipt management',
        order: 12,
        color: 'from-yellow-500 to-amber-500',
    },
    {
        id: 'troubleshooting',
        label: 'Troubleshooting',
        icon: 'MdBuild',
        description: 'Common issues and solutions',
        order: 13,
        color: 'from-orange-500 to-red-500',
    },
    {
        id: 'developers',
        label: 'Developers',
        icon: 'MdCode',
        description: 'API, Webhooks, and SDKs',
        order: 14,
        color: 'from-blue-600 to-indigo-600',
    },
    {
        id: 'tutorials',
        label: 'Video Tutorials',
        icon: 'MdSchool',
        description: 'Training videos and playlists',
        order: 15,
        color: 'from-pink-500 to-rose-500',
    },
    {
        id: 'legal',
        label: 'Legal',
        icon: 'MdGavel',
        description: 'Terms of Service and Privacy Policy',
        order: 16,
        color: 'from-gray-600 to-slate-600',
    },
    {
        id: 'other',
        label: 'Other Resources',
        icon: 'MdHelp',
        description: 'Changelog, Glossary, and Contribution',
        order: 17,
        color: 'from-teal-500 to-cyan-500',
    },
];

// Icon mapping for runtime use
export const CATEGORY_ICONS: Record<string, IconType> = {
    MdRocketLaunch,
    MdBolt,
    MdInventory,
    MdPointOfSale,
    MdDescription,
    MdPeople,
    MdLocalShipping,
    MdBarChart,
    MdIntegrationInstructions,
    MdSettings,
    MdSecurity,
    MdReceipt,
    MdBuild,
    MdCode,
    MdSchool,
    MdGavel,
    MdHelp,
};

export function getCategoryById(id: string): DocCategory | undefined {
    return DOC_CATEGORIES.find((cat) => cat.id === id);
}

export function getCategoryLabel(id: string): string {
    return getCategoryById(id)?.label || 'Unknown Category';
}

export function getCategoryIcon(iconName: string): IconType {
    return CATEGORY_ICONS[iconName] || MdRocketLaunch;
}
