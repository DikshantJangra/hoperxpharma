const prisma = require('../../db/prisma');
const logger = require('../../config/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Demo Data Service - Generates and seeds realistic demo data
 */
class DemoDataService {
    /**
     * Create a demo store for the user with seeded data
     * @param {string} userId - The ID of the user creating the demo store
     * @returns {Promise<Object>} The created demo store
     */
    async createDemoStore(userId) {
        logger.info(`Creating demo store for user ${userId}`);

        return await prisma.$transaction(async (tx) => {
            // 1. Create the Demo Store
            const store = await tx.store.create({
                data: {
                    name: 'HopeRx Demo Pharmacy',
                    displayName: 'HopeRx Demo Pharmacy',
                    email: `demo-${uuidv4().substring(0, 8)}@hoperx.com`, // Unique dummy email
                    phoneNumber: '9876543210',
                    businessType: 'Retail Pharmacy',
                    addressLine1: '123 Health Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pinCode: '400001',
                    gstin: '27AAAAA0000A1Z5', // Demo GSTIN
                    isDemo: true,
                    is24x7: false,
                    homeDelivery: true,
                    settings: {
                        create: {
                            lowStockThreshold: 10,
                            nearExpiryThreshold: 90,
                            invoiceFormat: 'DEMO/INV/',
                            paymentMethods: 'Cash,Card,UPI',
                        }
                    }
                },
            });

            // 2. Link User to Store
            await tx.storeUser.create({
                data: {
                    storeId: store.id,
                    userId: userId,
                    isPrimary: true,
                },
            });

            // 3. REMOVED: Do NOT create a subscription. 
            // The user explicitly requested "should not activate any subscription".

            // 4. Seed Inventory (Real-world Drugs - Expanded)
            const inventoryItems = await this._seedInventory(tx, store.id);

            // 5. Seed Patients (Expanded)
            const patients = await this._seedPatients(tx, store.id);

            // 6. Seed Prescribers (Expanded)
            const prescribers = await this._seedPrescribers(tx, store.id);

            // 7. Seed Prescriptions (Active & Past)
            await this._seedPrescriptions(tx, store.id, patients, prescribers, inventoryItems);

            // 8. Seed Sales/Invoices (30 Days History)
            await this._seedSales(tx, store.id, patients, inventoryItems, userId);

            return store;
        }, {
            timeout: 60000 // Increase timeout significantly for heavy seeding
        });
    }

    /**
     * Seed Inventory with popular medicines
     */
    async _seedInventory(tx, storeId) {
        const drugs = [
            // Tablets & Capsules
            { name: 'Dolo 650', composition: 'Paracetamol 650mg', manufacturer: 'Micro Labs', type: 'Tablet', mrp: 30.00, cost: 22.00 },
            { name: 'Augmentin 625', composition: 'Amoxicillin + Clavulanic Acid', manufacturer: 'GSK', type: 'Tablet', mrp: 200.00, cost: 160.00 },
            { name: 'Pan 40', composition: 'Pantoprazole 40mg', manufacturer: 'Alkem', type: 'Tablet', mrp: 155.00, cost: 110.00 },
            { name: 'Thyronorm 50mcg', composition: 'Thyroxine Sodium', manufacturer: 'Abbott', type: 'Tablet', mrp: 220.00, cost: 180.00 },
            { name: 'Shelcal 500', composition: 'Calcium + Vitamin D3', manufacturer: 'Torrent', type: 'Tablet', mrp: 130.00, cost: 95.00 },
            { name: 'Becosules', composition: 'B-Complex + Vitamin C', manufacturer: 'Pfizer', type: 'Capsule', mrp: 45.00, cost: 35.00 },
            { name: 'Telma 40', composition: 'Telmisartan 40mg', manufacturer: 'Glenmark', type: 'Tablet', mrp: 240.00, cost: 170.00 },
            { name: 'Azithral 500', composition: 'Azithromycin 500mg', manufacturer: 'Alembic', type: 'Tablet', mrp: 120.00, cost: 85.00 },
            { name: 'Metrogyl 400', composition: 'Metronidazole 400mg', manufacturer: 'J.B. Chemicals', type: 'Tablet', mrp: 22.00, cost: 15.00 },
            { name: 'Combiflam', composition: 'Ibuprofen + Paracetamol', manufacturer: 'Sanofi', type: 'Tablet', mrp: 40.00, cost: 30.00 },

            // Syrups
            { name: 'Ascoril LS', composition: 'Ambroxol + Levosalbutamol', manufacturer: 'Glenmark', type: 'Syrup', mrp: 118.00, cost: 90.00 },
            { name: 'Benadryl Cough Formula', composition: 'Diphenhydramine', manufacturer: 'Johnson & Johnson', type: 'Syrup', mrp: 135.00, cost: 105.00 },
            { name: 'Digene Gel', composition: 'Antacid', manufacturer: 'Abbott', type: 'Syrup', mrp: 180.00, cost: 140.00 },

            // Topical & Injections
            { name: 'Volini Gel', composition: 'Diclofenac', manufacturer: 'Sun Pharma', type: 'Gel', mrp: 140.00, cost: 110.00 },
            { name: 'Betnovate-N', composition: 'Betamethasone + Neomycin', manufacturer: 'GSK', type: 'Cream', mrp: 55.00, cost: 42.00 },
            { name: 'Insulin Lantus', composition: 'Insulin Glargine', manufacturer: 'Sanofi', type: 'Injection', mrp: 850.00, cost: 720.00 },
            { name: 'Otrivin Oxy', composition: 'Xylometazoline', manufacturer: 'GSK', type: 'Drops', mrp: 95.00, cost: 75.00 },
        ];

        const createdItems = [];

        for (let i = 0; i < drugs.length; i++) {
            const drug = drugs[i];

            // Create Drug
            const newDrug = await tx.drug.create({
                data: {
                    storeId,
                    name: drug.name,
                    genericName: drug.composition, // Mapped from composition
                    manufacturer: drug.manufacturer,
                    form: drug.type, // Mapped from type
                }
            });

            // Determine if this drug should have multiple batches
            // Every other drug (50%) will have 2 batches
            const batchCount = i % 2 === 0 ? 2 : 1;

            for (let batchNum = 0; batchNum < batchCount; batchNum++) {
                // Create Batch with varying details
                const batch = await tx.inventoryBatch.create({
                    data: {
                        storeId,
                        drugId: newDrug.id,
                        batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}-${batchNum + 1}`,
                        expiryDate: new Date(Date.now() + (180 + batchNum * 90 + Math.random() * 200) * 24 * 60 * 60 * 1000), // Staggered expiry
                        quantityInStock: 20 + Math.floor(Math.random() * 80), // 20-100 stock
                        mrp: drug.mrp,
                        purchasePrice: drug.cost, // Mapped from cost to purchasePrice
                        location: batchNum === 0 ? 'Rack A, Shelf 1' : 'Rack B, Shelf 2' // Use valid location field
                    }
                });

                if (batchNum === 0) {
                    createdItems.push({ drug: newDrug, batch });
                }
            }
        }

        return createdItems;
    }

    /**
     * Seed Demo Patients
     */
    async _seedPatients(tx, storeId) {
        const patients = await Promise.all([
            tx.patient.create({ data: { storeId, firstName: 'Rahul', lastName: 'Sharma', phoneNumber: '9800000001', dateOfBirth: new Date('1985-06-15'), gender: 'Male', addressLine1: 'Flat 101, Sunshine Apts', city: 'Mumbai', chronicConditions: ['Hypertension'] } }),
            tx.patient.create({ data: { storeId, firstName: 'Priya', lastName: 'Sharma', phoneNumber: '9800000002', dateOfBirth: new Date('1992-09-20'), gender: 'Female', addressLine1: 'Flat 101, Sunshine Apts', city: 'Mumbai', allergies: ['Penicillin'] } }),
            tx.patient.create({ data: { storeId, firstName: 'Amit', lastName: 'Verma', phoneNumber: '9800000003', dateOfBirth: new Date('1978-01-10'), gender: 'Male', addressLine1: 'Villa 45, Green Valley', city: 'Pune' } }),
            tx.patient.create({ data: { storeId, firstName: 'Sneha', lastName: 'Reddy', phoneNumber: '9800000004', dateOfBirth: new Date('2000-11-05'), gender: 'Female', addressLine1: 'Room 12, Hostel Block A', city: 'Mumbai' } }),
            tx.patient.create({ data: { storeId, firstName: 'Vikram', lastName: 'Singh', phoneNumber: '9800000005', dateOfBirth: new Date('1965-03-30'), gender: 'Male', addressLine1: '5th Avenue, High Street', city: 'Delhi', chronicConditions: ['Diabetes'] } }),
        ]);

        // Create family connections
        // Rahul & Priya are Spouse (same address, same last name)
        await tx.patientRelation.create({
            data: {
                patientId: patients[0].id, // Rahul
                relatedPatientId: patients[1].id, // Priya
                relationType: 'SPOUSE'
            }
        });

        // Priya is also connected to Rahul (bidirectional)
        await tx.patientRelation.create({
            data: {
                patientId: patients[1].id, // Priya
                relatedPatientId: patients[0].id, // Rahul
                relationType: 'SPOUSE'
            }
        });

        return patients;
    }

    /**
     * Seed Prescribers
     */
    async _seedPrescribers(tx, storeId) {
        return await Promise.all([
            tx.prescriber.create({ data: { storeId, name: 'Dr. Amit Gupta', specialty: 'Cardiologist', phoneNumber: '9900000001', licenseNumber: 'MCI-1001' } }),
            tx.prescriber.create({ data: { storeId, name: 'Dr. Sarah Thomas', specialty: 'General Physician', phoneNumber: '9900000002', licenseNumber: 'MCI-1002' } }),
            tx.prescriber.create({ data: { storeId, name: 'Dr. Rajesh Kumar', specialty: 'Orthopedic', phoneNumber: '9900000003', licenseNumber: 'MCI-1003' } }),
            tx.prescriber.create({ data: { storeId, name: 'Dr. Neha Kapoor', specialty: 'Dermatologist', phoneNumber: '9900000004', licenseNumber: 'MCI-1004' } }),
        ]);
    }

    /**
     * Seed Prescriptions
     */
    async _seedPrescriptions(tx, storeId, patients, prescribers, inventoryItems) {
        // Create an active prescription for Rahul (Hypertension)
        const telma = inventoryItems.find(i => i.drug.name.includes('Telma'));

        if (telma) {
            const prescription = await tx.prescription.create({
                data: {
                    storeId,
                    patientId: patients[0].id, // Rahul
                    prescriberId: prescribers[0].id, // Dr. Amit (Cardio)
                    status: 'ACTIVE',
                    issueDate: new Date(),
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    notes: 'Diagnosis: Hypertension Management',
                    prescriptionNumber: `RX-DEMO-${Date.now().toString().slice(-6)}`,
                }
            });

            await tx.prescriptionItem.create({
                data: {
                    prescriptionId: prescription.id,
                    drugId: telma.drug.id,
                    sig: '1-0-0 (Morning)',
                    daysSupply: 30,
                    quantityPrescribed: 30,
                    isControlled: false,
                }
            });
        }
    }

    /**
     * Seed Past Sales (Realistic History)
     */
    async _seedSales(tx, storeId, patients, inventoryItems, userId) {
        // Generate sales for the past 7 days (reduced for faster seeding)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const now = new Date();
        let invoiceCounter = 1;

        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
            // Randomly skip some days (Sundays or slow days) to look realistic
            if (Math.random() > 0.7) continue;

            // 1 to 2 sales per day (reduced for faster seeding)
            const dailySalesCount = Math.floor(Math.random() * 2) + 1;

            for (let i = 0; i < dailySalesCount; i++) {
                // Pick a random patient (or null for walk-in)
                const patient = Math.random() > 0.3 ? patients[Math.floor(Math.random() * patients.length)] : null;

                // Pick 1-3 random items
                const itemCount = Math.floor(Math.random() * 3) + 1;
                const saleItems = [];
                let subTotal = 0;

                for (let j = 0; j < itemCount; j++) {
                    const item = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
                    const qty = Math.floor(Math.random() * 2) + 1; // 1 or 2 quantity
                    const lineTotal = item.batch.mrp * qty; // Simple calculation ignoring GST logic for demo speed

                    subTotal += Number(lineTotal);
                    saleItems.push({
                        drugId: item.drug.id,
                        batchId: item.batch.id,
                        quantity: qty,
                        mrp: item.batch.mrp,
                        gstRate: 12, // Defaulting for demo
                        lineTotal: lineTotal
                    });
                }

                // Create Sale
                const saleDate = new Date(d);
                saleDate.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60)); // Random time 9am-7pm

                const sale = await tx.sale.create({
                    data: {
                        storeId,
                        patientId: patient ? patient.id : null,
                        invoiceNumber: `DEMO/INV/${uuidv4().substring(0, 5).toUpperCase()}/${String(invoiceCounter).padStart(3, '0')}`,
                        status: 'COMPLETED',
                        paymentStatus: 'PAID',
                        subtotal: subTotal,
                        taxAmount: 0, // Simplified for demo
                        discountAmount: 0,  // Simplified for demo (renamed from discount)
                        total: subTotal,
                        createdAt: saleDate, // Historic date
                        soldBy: userId // Assuming the user did it
                    }
                });

                // Create Sale Items
                for (const si of saleItems) {
                    await tx.saleItem.create({
                        data: {
                            saleId: sale.id,
                            drugId: si.drugId,
                            batchId: si.batchId,
                            quantity: si.quantity,
                            mrp: si.mrp,
                            gstRate: 12,
                            lineTotal: si.lineTotal
                        }
                    });
                }

                invoiceCounter++;
            }
        }
    }
}

module.exports = new DemoDataService();
