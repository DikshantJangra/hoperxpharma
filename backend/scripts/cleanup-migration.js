const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up partial migration data...\n');
  
  try {
    // Delete in correct order due to foreign key constraints
    console.log('Deleting MedicineSaltLinks...');
    const saltLinks = await prisma.medicineSaltLink.deleteMany({});
    console.log(`✅ Deleted ${saltLinks.count} salt links`);
    
    console.log('Deleting IdMappings...');
    const mappings = await prisma.idMapping.deleteMany({
      where: { source: 'CSV_MIGRATION' }
    });
    console.log(`✅ Deleted ${mappings.count} ID mappings`);
    
    console.log('Deleting MedicineMaster records...');
    const medicines = await prisma.medicineMaster.deleteMany({
      where: { createdBy: 'csv_migration' }
    });
    console.log(`✅ Deleted ${medicines.count} medicine records`);
    
    console.log('Deleting Salts created by system...');
    const salts = await prisma.salt.deleteMany({
      where: { createdBy: 'system' }
    });
    console.log(`✅ Deleted ${salts.count} salt records`);
    
    console.log('\n✅ Cleanup complete!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
