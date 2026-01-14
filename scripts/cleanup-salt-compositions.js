#!/usr/bin/env node

/**
 * Cleanup Script: Remove All Salt Compositions from Drugs
 * 
 * This script:
 * 1. Finds all drugs with salt links
 * 2. Deletes all DrugSaltLink records
 * 3. Logs all changes for audit
 * 
 * Usage: node scripts/cleanup-salt-compositions.js [--dry-run]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const isDryRun = process.argv.includes('--dry-run');

async function cleanupSaltCompositions() {
    console.log('🧹 Starting Salt Composition Cleanup...\n');
    console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '⚠️  LIVE MODE (changes will be applied)'}\n`);

    try {
        // Step 1: Count all salt links
        console.log('📊 Step 1: Counting salt compositions...');
        
        const totalLinks = await prisma.drugSaltLink.count();
        console.log(`Found ${totalLinks} salt composition links\n`);

        if (totalLinks === 0) {
            console.log('✅ No salt compositions found. Nothing to clean up.');
            return;
        }

        // Step 2: Get drugs with salt links
        const drugsWithSalts = await prisma.drugSaltLink.groupBy({
            by: ['drugId'],
            _count: {
                id: true
            }
        });

        console.log(`📍 Found ${drugsWithSalts.length} drugs with salt compositions\n`);

        // Step 3: Delete all salt links
        if (!isDryRun) {
            console.log('🗑️  Deleting all salt compositions...');
            
            const result = await prisma.drugSaltLink.deleteMany({});
            
            console.log(`✅ Deleted ${result.count} salt composition links\n`);
        } else {
            console.log(`🔍 Would delete ${totalLinks} salt composition links\n`);
        }

        // Step 4: Summary
        console.log('='.repeat(60));
        console.log('📊 CLEANUP SUMMARY');
        console.log('='.repeat(60));
        console.log(`Drugs affected:       ${drugsWithSalts.length}`);
        console.log(`Salt links removed:   ${totalLinks}`);
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
            
            const remainingLinks = await prisma.drugSaltLink.count();
            
            if (remainingLinks === 0) {
                console.log('✅ All salt compositions removed successfully!');
            } else {
                console.log(`⚠️  WARNING: ${remainingLinks} salt links still remain!`);
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
cleanupSaltCompositions()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
