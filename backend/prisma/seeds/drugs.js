const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleDrugs = [
    {
        name: 'Paracetamol',
        strength: '500mg',
        form: 'Tablet',
        manufacturer: 'Cipla Ltd',
        hsnCode: '30049099',
        gstRate: 12,
        requiresPrescription: false,
        defaultUnit: 'Strip',
        lowStockThreshold: 50,
    },
    {
        name: 'Amoxicillin',
        strength: '500mg',
        form: 'Capsule',
        manufacturer: 'Sun Pharma',
        hsnCode: '30042090',
        gstRate: 12,
        requiresPrescription: true,
        defaultUnit: 'Strip',
        lowStockThreshold: 30,
    },
    {
        name: 'Cetirizine',
        strength: '10mg',
        form: 'Tablet',
        manufacturer: 'Dr. Reddy's',
        hsnCode: '30049099',
        gstRate: 12,
        requiresPrescription: false,
        defaultUnit: 'Strip',
        lowStockThreshold: 40,
    },
    {
        name: 'Azithromycin',
        strength: '500mg',
        form: 'Tablet',
        manufacturer: 'Cipla Ltd',
        hsnCode: '30042090',
        gstRate: 12,
        requiresPrescription: true,
        defaultUnit: 'Strip',
        lowStockThreshold: 25,
    },
    {
        name: 'Omeprazole',
        strength: '20mg',
        form: 'Capsule',
        manufacturer: 'Lupin Ltd',
        hsnCode: '30049099',
        gstRate: 12,
        requiresPrescription: false,
        defaultUnit: 'Strip',
        lowStockThreshold: 35,
    },
    {
        name: 'Metformin',
        strength: '500mg',
        form: 'Tablet',
        manufacturer: 'Sun Pharma',
        hsnCode: '30049099',
        gstRate: 12,
        requiresPrescription: true,
        defaultUnit: 'Strip',
        lowStockThreshold: 50,
    },
    {
        name: 'Aspirin',
        strength: '75mg',
        form: 'Tablet',
        manufacturer: 'Bayer',
        hsnCode: '30049099',
        gstRate: 12,
        requiresPrescription: false,
        defaultUnit: 'Strip',
        lowStockThreshold: 60,
    },
    {
        name: 'Ibuprofen',
        strength: '400mg',
        form: 'Tablet',
        manufacturer: 'Abbott',
        hsnCode: '30049099',
        gstRate: 12,
        requiresPrescription: false,
        defaultUnit: 'Strip',
        lowStockThreshold: 45,
    },
    {
        name: 'Cough Syrup',
        strength: '100ml',
        form: 'Syrup',
        manufacturer: 'Himalaya',
        hsnCode: '30049099',
        gstRate: 12,
        requiresPrescription: false,
        defaultUnit: 'Bottle',
        lowStockThreshold: 20,
    },
    {
        name: 'Vitamin D3',
        strength: '60000 IU',
        form: 'Capsule',
        manufacturer: 'HealthKart',
        hsnCode: '30049099',
        gstRate: 18,
        requiresPrescription: false,
        defaultUnit: 'Strip',
        lowStockThreshold: 30,
    },
];

async function seedDrugs() {
    console.log('🌱 Seeding drugs...');

    try {
        // Get the first store to associate batches with
        const store = await prisma.store.findFirst();

        if (!store) {
            console.log('⚠️  No store found. Please create a store first.');
            return;
        }

        console.log(`   Using store: ${store.displayName || store.name}`);

        for (const drugData of sampleDrugs) {
            // Check if drug already exists
            const existing = await prisma.drug.findFirst({
                where: {
                    name: drugData.name,
                    strength: drugData.strength,
                },
            });

            if (existing) {
                console.log(`   ⏭️  Skipping ${drugData.name} ${drugData.strength} (already exists)`);
                continue;
            }

            // Create drug
            const drug = await prisma.drug.create({
                data: drugData,
            });

            // Create 2-3 batches for each drug
            const batchCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 batches

            for (let i = 0; i < batchCount; i++) {
                const expiryDate = new Date();
                expiryDate.setMonth(expiryDate.getMonth() + 12 + i * 6); // 12-24 months from now

                const mrp = (Math.random() * 200 + 50).toFixed(2); // Random MRP between 50-250
                const purchaseRate = (mrp * 0.7).toFixed(2); // 70% of MRP

                await prisma.batch.create({
                    data: {
                        drugId: drug.id,
                        storeId: store.id,
                        batchNumber: `BATCH-${Date.now()}-${i}`,
                        expiryDate,
                        quantity: Math.floor(Math.random() * 200) + 50, // 50-250 units
                        mrp: parseFloat(mrp),
                        purchaseRate: parseFloat(purchaseRate),
                        supplierId: null, // No supplier for seed data
                    },
                });
            }

            console.log(`   ✅ Created ${drugData.name} ${drugData.strength} with ${batchCount} batches`);
        }

        console.log('✅ Drugs seeding completed!');
    } catch (error) {
        console.error('❌ Error seeding drugs:', error);
        throw error;
    }
}

module.exports = { seedDrugs };
