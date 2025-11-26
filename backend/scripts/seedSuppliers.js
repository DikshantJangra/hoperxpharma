const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSuppliers() {
    try {
        console.log('🌱 Seeding suppliers...');

        const suppliers = [
            {
                name: 'Cipla Pharmaceuticals',
                category: 'Manufacturer',
                status: 'Active',
                gstin: '27AAACC1234A1Z5',
                dlNumber: 'DL-MH-2023-001',
                pan: 'AAACC1234A',
                contactName: 'Rajesh Kumar',
                phoneNumber: '+91-9876543210',
                email: 'contact@cipla.com',
                whatsapp: '+91-9876543210',
                addressLine1: '123, Industrial Area',
                city: 'Mumbai',
                state: 'Maharashtra',
                pinCode: '400001',
                paymentTerms: 'Net 30',
                creditLimit: 500000,
            },
            {
                name: 'Sun Pharma Distributors',
                category: 'Distributor',
                status: 'Active',
                gstin: '29BBBDD5678B2Z6',
                dlNumber: 'DL-KA-2023-002',
                pan: 'BBBDD5678B',
                contactName: 'Priya Sharma',
                phoneNumber: '+91-9876543211',
                email: 'sales@sunpharma.com',
                whatsapp: '+91-9876543211',
                addressLine1: '456, Pharma Complex',
                city: 'Bangalore',
                state: 'Karnataka',
                pinCode: '560001',
                paymentTerms: 'Net 45',
                creditLimit: 750000,
            },
            {
                name: 'Dr. Reddy\'s Laboratories',
                category: 'Manufacturer',
                status: 'Active',
                gstin: '36CCCEE9012C3Z7',
                dlNumber: 'DL-TG-2023-003',
                pan: 'CCCEE9012C',
                contactName: 'Amit Patel',
                phoneNumber: '+91-9876543212',
                email: 'info@drreddys.com',
                whatsapp: '+91-9876543212',
                addressLine1: '789, Biotech Park',
                city: 'Hyderabad',
                state: 'Telangana',
                pinCode: '500001',
                paymentTerms: 'Net 30',
                creditLimit: 1000000,
            },
            {
                name: 'Lupin Limited',
                category: 'Manufacturer',
                status: 'Active',
                gstin: '27DDDF2345D4Z8',
                dlNumber: 'DL-MH-2023-004',
                pan: 'DDDF2345D',
                contactName: 'Sneha Verma',
                phoneNumber: '+91-9876543213',
                email: 'contact@lupin.com',
                whatsapp: '+91-9876543213',
                addressLine1: '321, Pharma Hub',
                city: 'Pune',
                state: 'Maharashtra',
                pinCode: '411001',
                paymentTerms: 'Net 60',
                creditLimit: 600000,
            },
            {
                name: 'Torrent Pharmaceuticals',
                category: 'Distributor',
                status: 'Active',
                gstin: '24EEEG6789E5Z9',
                dlNumber: 'DL-GJ-2023-005',
                pan: 'EEEG6789E',
                contactName: 'Vikram Singh',
                phoneNumber: '+91-9876543214',
                email: 'sales@torrentpharma.com',
                whatsapp: '+91-9876543214',
                addressLine1: '654, Medical District',
                city: 'Ahmedabad',
                state: 'Gujarat',
                pinCode: '380001',
                paymentTerms: 'Net 30',
                creditLimit: 450000,
            },
        ];

        for (const supplier of suppliers) {
            // Check if supplier already exists
            const existing = await prisma.supplier.findFirst({
                where: { name: supplier.name, deletedAt: null }
            });

            if (existing) {
                console.log(`⏭️  Skipping ${supplier.name} (already exists)`);
                continue;
            }

            await prisma.supplier.create({ data: supplier });
            console.log(`✅ Created supplier: ${supplier.name}`);
        }

        const total = await prisma.supplier.count({ where: { deletedAt: null } });
        console.log(`\n🎉 Total suppliers in database: ${total}`);

    } catch (error) {
        console.error('❌ Error seeding suppliers:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedSuppliers();
