const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPrescribers() {
    console.log('🔍 Checking existing prescribers...\n');

    // Step 1: Get all prescribers and their prescription info
    const prescribers = await prisma.prescriber.findMany({
        include: {
            prescriptions: {
                select: {
                    id: true,
                    storeId: true,
                },
            },
        },
    });

    console.log(`Found ${prescribers.length} prescribers\n`);

    const needsUpdate = [];
    const orphaned = [];

    for (const prescriber of prescribers) {
        console.log(`\n📋 Prescriber: ${prescriber.name} (${prescriber.licenseNumber})`);
        console.log(`   Current storeId: ${prescriber.storeId || 'NULL'}`);
        console.log(`   Prescriptions: ${prescriber.prescriptions.length}`);

        if (!prescriber.storeId) {
            if (prescriber.prescriptions.length > 0) {
                // Has prescriptions but no storeId - needs update
                const targetStoreId = prescriber.prescriptions[0].storeId;
                needsUpdate.push({
                    id: prescriber.id,
                    name: prescriber.name,
                    licenseNumber: prescriber.licenseNumber,
                    targetStoreId,
                });
                console.log(`   ⚠️  NEEDS UPDATE: Will assign to store ${targetStoreId}`);
            } else {
                // No prescriptions and no storeId - orphaned
                orphaned.push({
                    id: prescriber.id,
                    name: prescriber.name,
                    licenseNumber: prescriber.licenseNumber,
                });
                console.log(`   ⚠️  ORPHANED: No prescriptions, no storeId`);
            }
        } else {
            console.log(`   ✅ Already has storeId`);
        }
    }

    console.log('\n\n📊 Summary:');
    console.log(`   Total prescribers: ${prescribers.length}`);
    console.log(`   Need update: ${needsUpdate.length}`);
    console.log(`   Orphaned: ${orphaned.length}`);
    console.log(`   Already correct: ${prescribers.length - needsUpdate.length - orphaned.length}`);

    if (needsUpdate.length > 0) {
        console.log('\n\n🔧 Updating prescribers with storeId...');
        for (const prescriber of needsUpdate) {
            await prisma.prescriber.update({
                where: { id: prescriber.id },
                data: { storeId: prescriber.targetStoreId },
            });
            console.log(`   ✅ Updated ${prescriber.name} -> store ${prescriber.targetStoreId}`);
        }
    }

    if (orphaned.length > 0) {
        console.log('\n\n⚠️  Orphaned prescribers (no prescriptions):');
        for (const prescriber of orphaned) {
            console.log(`   - ${prescriber.name} (${prescriber.licenseNumber})`);
        }
        console.log('\n   These prescribers need manual assignment or deletion.');
        console.log('   You can either:');
        console.log('   1. Delete them if they were created by mistake');
        console.log('   2. Assign them to a specific store manually');
    }

    console.log('\n✅ Done!');
}

fixPrescribers()
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
