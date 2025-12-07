const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUSINESS_TYPE_CONFIGS = [
    {
        businessType: "Retail Pharmacy",
        description: "Direct patient care, prescription dispensing, walk-in customers",
        icon: "store",
        featureConfig: {
            // Operations
            dashboard: "essential",
            prescriptions: "essential",
            dispense: "essential",
            patients: "essential",

            // Inventory & Supply
            inventory: "essential",
            orders: "essential",
            suppliers: "essential",
            claims: "optional",

            // Billing & Finance
            pos: "essential",
            gst: "essential",
            finance: "essential",

            // Analytics
            reports: "essential",
            insights: "essential",

            // Communication
            messages: "essential",
            engage: "essential",

            // Compliance
            audit: "essential",
            regulations: "essential",

            // Settings
            store: "essential",
            team: "essential",
            integrations: "essential",
            multiStore: "hidden",

            // Support
            knowledge: "essential",
            help: "essential"
        },
        enabledSections: [
            "Operations",
            "Inventory & Supply",
            "Billing & Finance",
            "Analytics",
            "Communication",
            "Compliance",
            "Settings",
            "Support"
        ],
        defaultPermissions: [
            "prescription.read",
            "prescription.create",
            "prescription.fulfill",
            "patient.read",
            "patient.create",
            "inventory.read",
            "po.read",
            "po.create",
            "sales.create",
            "sales.read",
            "communication.send",
            "marketing.loyalty"
        ]
    },
    {
        businessType: "Wholesale Pharmacy",
        description: "Bulk distribution to retailers, hospitals, and clinics",
        icon: "warehouse",
        featureConfig: {
            // Operations
            dashboard: "essential",
            prescriptions: "hidden",
            dispense: "hidden",
            patients: "hidden",

            // Inventory & Supply
            inventory: "essential",
            orders: "essential",
            suppliers: "essential",
            claims: "hidden",

            // Billing & Finance
            pos: "hidden",
            gst: "essential",
            finance: "essential",

            // Analytics
            reports: "essential",
            insights: "essential",

            // Communication
            messages: "optional",
            engage: "hidden",

            // Compliance
            audit: "essential",
            regulations: "essential",

            // Settings
            store: "essential",
            team: "essential",
            integrations: "optional",
            multiStore: "hidden",

            // Support
            knowledge: "optional",
            help: "essential"
        },
        enabledSections: [
            "Operations",
            "Inventory & Supply",
            "Billing & Finance",
            "Analytics",
            "Compliance",
            "Settings",
            "Support"
        ],
        defaultPermissions: [
            "inventory.read",
            "inventory.update",
            "inventory.adjust",
            "po.read",
            "po.create",
            "po.approve",
            "report.sales",
            "report.financial"
        ]
    },
    {
        businessType: "Hospital-based Pharmacy",
        description: "Inpatient medication management with clinical integration",
        icon: "hospital",
        featureConfig: {
            // Operations
            dashboard: "essential",
            prescriptions: "essential",
            dispense: "essential",
            patients: "essential",

            // Inventory & Supply
            inventory: "essential",
            orders: "essential",
            suppliers: "essential",
            claims: "essential",

            // Billing & Finance
            pos: "hidden",
            gst: "optional",
            finance: "essential",

            // Analytics
            reports: "essential",
            insights: "essential",

            // Communication
            messages: "optional",
            engage: "hidden",

            // Compliance
            audit: "essential",
            regulations: "essential",

            // Settings
            store: "essential",
            team: "essential",
            integrations: "essential",
            multiStore: "hidden",

            // Support
            knowledge: "essential",
            help: "essential"
        },
        enabledSections: [
            "Operations",
            "Inventory & Supply",
            "Billing & Finance",
            "Analytics",
            "Compliance",
            "Settings",
            "Support"
        ],
        defaultPermissions: [
            "prescription.read",
            "prescription.create",
            "prescription.fulfill",
            "patient.read",
            "inventory.read",
            "inventory.adjust",
            "po.read",
            "po.create",
            "report.compliance"
        ]
    },
    {
        businessType: "Multi-store Chain",
        description: "Centralized management of multiple retail locations",
        icon: "business",
        featureConfig: {
            // Operations
            dashboard: "essential",
            prescriptions: "essential",
            dispense: "essential",
            patients: "essential",

            // Inventory & Supply
            inventory: "essential",
            orders: "essential",
            suppliers: "essential",
            claims: "optional",

            // Billing & Finance
            pos: "essential",
            gst: "essential",
            finance: "essential",

            // Analytics
            reports: "essential",
            insights: "essential",

            // Communication
            messages: "essential",
            engage: "essential",

            // Compliance
            audit: "essential",
            regulations: "essential",

            // Settings
            store: "essential",
            team: "essential",
            integrations: "essential",
            multiStore: "essential",

            // Support
            knowledge: "essential",
            help: "essential"
        },
        enabledSections: [
            "Operations",
            "Inventory & Supply",
            "Billing & Finance",
            "Analytics",
            "Communication",
            "Compliance",
            "Settings",
            "Support"
        ],
        defaultPermissions: [
            "prescription.read",
            "prescription.create",
            "prescription.fulfill",
            "patient.read",
            "patient.create",
            "inventory.read",
            "po.read",
            "po.create",
            "sales.create",
            "sales.read",
            "communication.send",
            "marketing.loyalty",
            "system.store.manage"
        ]
    }
];

async function seedBusinessTypeConfigs() {
    console.log('🌱 Seeding business type configurations...');

    for (const config of BUSINESS_TYPE_CONFIGS) {
        await prisma.businessTypeConfig.upsert({
            where: { businessType: config.businessType },
            update: {
                description: config.description,
                icon: config.icon,
                featureConfig: config.featureConfig,
                enabledSections: config.enabledSections,
                defaultPermissions: config.defaultPermissions
            },
            create: config
        });

        console.log(`✅ Seeded config for: ${config.businessType}`);
    }

    console.log(`✅ Seeded ${BUSINESS_TYPE_CONFIGS.length} business type configurations`);
}

async function main() {
    try {
        await seedBusinessTypeConfigs();
    } catch (error) {
        console.error('❌ Error seeding business type configs:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    main()
        .then(() => {
            console.log('🎉 Business type config seeding complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { seedBusinessTypeConfigs, BUSINESS_TYPE_CONFIGS };
