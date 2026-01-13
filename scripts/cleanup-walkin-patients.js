#!/usr/bin/env node

/**
 * Cleanup Script: Remove ALL Walk-in Patients
 * 
 * This script:
 * 1. Finds all walk-in patients
 * 2. Unlinks them from sales (sets patientId to null)
 * 3. Soft-deletes all walk-in patients
 * 4. Logs all changes for audit
 * 
 * Usage: node scripts/cleanup-walkin-patients.js [--dry-run]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const isDryRun = process.argv.includes('--dry-run');

async function cleanupWalkInPatients() {
    console.log('🧹 Starting Walk-in Patient Cleanup...\n');
    console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '⚠️  LIVE MODE (changes will be applied)'}\n`);

    try {
        // Step 1: Find all walk-in patients grouped by store
        console.log('📊 Step 1: Finding all walk-in patients...');
        
        const walkInPatients = await prisma.patient.findMany({
            where: {
                phoneNumber: {
                    startsWith: 'WALKIN-'
                },
                deletedAt: null
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                sales: {
                    select: {
                        id: true,
                        invoiceNumber: true
                    }
                }
            }
        });

        console.log(`Found ${walkInPatients.length} walk-in patients\n`);

        // Step 2: Group by store
        const patientsByStore = {};
        for (const patient of walkInPatients) {
            if (!patientsByStore[patient.storeId]) {
                patientsByStore[patient.storeId] = [];
            }
            patientsByStore[patient.storeId].push(patient);
        }

        console.log(`📍 Found walk-in patients in ${Object.keys(patientsByStore).length} stores\n`);

        // Step 3: Process all walk-in patients
        let totalDeleted = 0;
        let totalSalesUnlinked = 0;

        for (const [storeId, patients] of Object.entries(patientsByStore)) {
            const store = await prisma.store.findUnique({
                where: { id: storeId },
                select: { name: true }
            });
            const storeName = store?.name || 'Unknown Store';
            console.log(`\n🏪 Store: ${storeName} (${storeId})`);
            console.log(`   Found ${patients.length} walk-in patient(s)`);

            // Delete all walk-in patients
            for (const patient of patients) {
                console.log(`\n   ❌ Removing: ${patient.firstName} ${patient.lastName} (${patient.phoneNumber})`);
                console.log(`      ID: ${patient.id}`);
                console.log(`      Sales: ${patient.sales.length}`);

                if (!isDryRun) {
                    // Unlink sales from patient
                    if (patient.sales.length > 0) {
                        console.log(`      🔄 Unlinking ${patient.sales.length} sale(s)...`);
                        
                        await prisma.sale.updateMany({
                            where: {
                                patientId: patient.id
                            },
                            data: {
                                patientId: null
                            }
                        });

                        totalSalesUnlinked += patient.sales.length;
                        console.log(`      ✅ Sales unlinked`);
                    }

                    // Soft delete patient
                    await prisma.patient.update({
                        where: {
                            id: patient.id
                        },
                        data: {
                            deletedAt: new Date(),
                            deletedBy: 'cleanup-script'
                        }
                    });

                    console.log(`      ✅ Patient soft-deleted`);
                    totalDeleted++;
                } else {
                    console.log(`      🔍 Would unlink ${patient.sales.length} sale(s)`);
                    console.log(`      🔍 Would soft-delete patient`);
                    totalDeleted++;
                    totalSalesUnlinked += patient.sales.length;
                }
            }
        }

        // Step 4: Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 CLEANUP SUMMARY');
        console.log('='.repeat(60));
        console.log(`Stores processed:     ${Object.keys(patientsByStore).length}`);
        console.log(`Patients deleted:     ${totalDeleted}`);
        console.log(`Sales unlinked:       ${totalSalesUnlinked}`);
        console.log('='.repeat(60));

        if (isDryRun) {
            console.log('\n🔍 DRY RUN COMPLETE - No changes were made');
            console.log('   Run without --dry-run to apply changes');
        } else {
            console.log('\n✅ CLEANUP COMPLETE');
        }

        // Step 5: Verification
        if (!isDryRun) {
            console.log('\n🔍 Verification...');
            
            const remainingWalkIns = await prisma.patient.groupBy({
                by: ['storeId'],
                where: {
                    phoneNumber: {
                        startsWith: 'WALKIN-'
                    },
                    deletedAt: null
                },
                _count: {
                    id: true
                }
            });

            console.log('\n📊 Walk-in patients remaining (should be 0):');
            for (const group of remainingWalkIns) {
                const store = await prisma.store.findUnique({
                    where: { id: group.storeId },
                    select: { name: true }
                });
                const storeName = store?.name || 'Unknown Store';
                console.log(`   ${storeName}: ${group._count.id} patient(s)`);
                
                if (group._count.id > 0) {
                    console.log(`   ⚠️  WARNING: Still has walk-in patients!`);
                }
            }
            
            if (remainingWalkIns.length === 0) {
                console.log('   ✅ All walk-in patients removed successfully!');
            }
        }

    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup
cleanupWalkInPatients()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
