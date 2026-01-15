/**
 * Rebuild Typesense Search Index
 * 
 * Rebuilds the entire search index from the database
 */

const { indexManagementService } = require('../src/services/IndexManagementService');

async function rebuildSearchIndex() {
  console.log('🔄 Rebuilding Typesense search index...');
  console.log('');

  try {
    // Check index health before rebuild
    console.log('📊 Checking current index health...');
    try {
      const health = await indexManagementService.getIndexHealth();
      console.log(`  Collection: ${health.collectionName}`);
      console.log(`  Documents in index: ${health.documentsInIndex}`);
      console.log(`  Documents in database: ${health.documentsInDatabase}`);
      console.log(`  In sync: ${health.inSync ? '✅' : '❌'}`);
      console.log('');
    } catch (error) {
      console.log('⚠️  Could not check index health:', error.message);
      console.log('');
    }

    // Rebuild index
    const startTime = Date.now();
    const result = await indexManagementService.rebuildIndex();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('✅ Index rebuild complete!');
    console.log('');
    console.log('Results:');
    console.log(`  Total medicines: ${result.total}`);
    console.log(`  Successfully indexed: ${result.success}`);
    console.log(`  Failed: ${result.failed}`);
    console.log(`  Duration: ${duration}s`);
    console.log(`  Rate: ${(result.success / parseFloat(duration)).toFixed(0)} docs/sec`);
    console.log('');

    // Check health after rebuild
    console.log('📊 Checking index health after rebuild...');
    const health = await indexManagementService.getIndexHealth();
    console.log(`  Documents in index: ${health.documentsInIndex}`);
    console.log(`  Documents in database: ${health.documentsInDatabase}`);
    console.log(`  In sync: ${health.inSync ? '✅' : '❌'}`);
    console.log('');

    if (!health.inSync) {
      console.log('⚠️  Index is not in sync with database');
      console.log('   This may be due to failed indexing operations');
      console.log('   Consider running this script again');
    }

    console.log('Next Steps:');
    console.log('  1. Test search: curl "http://localhost:8108/collections/medicines/documents/search?q=paracetamol&query_by=name"');
    console.log('  2. Enable frontend API mode: NEXT_PUBLIC_USE_MEDICINE_API=true');
    console.log('');
  } catch (error) {
    console.error('❌ Failed to rebuild index:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  rebuildSearchIndex()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { rebuildSearchIndex };
