/**
 * Rebuild Search Index Script
 * 
 * Rebuilds the Typesense search index from the medicine master database.
 * Useful after bulk imports or when search index is out of sync.
 * 
 * Usage:
 *   npm run rebuild-search-index
 */

import { PrismaClient } from '@prisma/client';
import { indexManagementService } from '../src/services/IndexManagementService';

const prisma = new PrismaClient();

async function rebuildIndex() {
  console.log('🔄 Rebuilding Typesense search index...');
  console.log('');

  try {
    // Get total count
    const totalCount = await prisma.medicineMaster.count();
    console.log(`📊 Total medicines in database: ${totalCount}`);
    console.log('');

    // Rebuild index
    const startTime = Date.now();
    await indexManagementService.rebuildIndex();
    const duration = Date.now() - startTime;

    console.log('');
    console.log('✅ Index rebuild complete!');
    console.log(`   Duration: ${Math.round(duration / 1000)}s`);
    console.log(`   Records/second: ${Math.round(totalCount / (duration / 1000))}`);
    console.log('');

    // Verify index
    const stats = await indexManagementService.getIndexStats();
    console.log('📈 Index Statistics:');
    console.log(`   Documents: ${stats.numDocuments}`);
    console.log(`   Collection: ${stats.name}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('💥 Index rebuild failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
rebuildIndex();
