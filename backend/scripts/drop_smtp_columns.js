/**
 * Script to drop SMTP columns from PlatformEmailConfig table
 * 
 * This script will:
 * 1. Drop the legacy SMTP columns that are no longer needed
 * 2. Only affects PlatformEmailConfig table, nothing else
 * 
 * Run with: node scripts/drop_smtp_columns.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function dropSMTPColumns() {
    console.log('🚀 Starting SMTP column removal...\n');

    const columnsToDrop = [
        'smtpHost',
        'smtpPort',
        'smtpUser',
        'smtpPasswordEncrypted',
        'smtpFromName',
        'useTLS'
    ];

    try {
        // First, check if the table exists and log current state
        const existingConfig = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'PlatformEmailConfig'
        `;

        console.log('📋 Current columns in PlatformEmailConfig:');
        console.log(existingConfig.map(c => c.column_name).join(', '));
        console.log('');

        // Drop each column one by one
        for (const column of columnsToDrop) {
            try {
                await prisma.$executeRawUnsafe(`
                    ALTER TABLE "PlatformEmailConfig" DROP COLUMN IF EXISTS "${column}"
                `);
                console.log(`✅ Dropped column: ${column}`);
            } catch (error) {
                if (error.message.includes('does not exist')) {
                    console.log(`⏭️  Column ${column} doesn't exist, skipping...`);
                } else {
                    console.error(`❌ Error dropping ${column}:`, error.message);
                }
            }
        }

        console.log('\n✅ SMTP columns removed successfully!');
        console.log('\n📋 Remaining columns in PlatformEmailConfig:');

        const remainingColumns = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'PlatformEmailConfig'
        `;
        console.log(remainingColumns.map(c => c.column_name).join(', '));

        console.log('\n🎉 Done! You can now safely deploy without data loss warnings.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

dropSMTPColumns();
