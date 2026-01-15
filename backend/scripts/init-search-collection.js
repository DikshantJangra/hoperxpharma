/**
 * Initialize Typesense Search Collection
 * 
 * Creates the medicines collection in Typesense with proper schema
 */

const { typesenseClient, typesenseConfig } = require('../src/lib/typesense/client');

async function initSearchCollection() {
  console.log('🔍 Initializing Typesense search collection...');
  console.log('');

  try {
    // Check if collection already exists
    try {
      const existing = await typesenseClient
        .collections(typesenseConfig.collectionName)
        .retrieve();
      
      console.log(`⚠️  Collection '${typesenseConfig.collectionName}' already exists`);
      console.log(`   Documents: ${existing.num_documents}`);
      console.log(`   Created: ${new Date(existing.created_at * 1000).toISOString()}`);
      console.log('');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        readline.question('Do you want to delete and recreate it? (y/N): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() === 'y') {
        console.log('🗑️  Deleting existing collection...');
        await typesenseClient
          .collections(typesenseConfig.collectionName)
          .delete();
        console.log('✅ Collection deleted');
      } else {
        console.log('ℹ️  Keeping existing collection');
        return;
      }
    } catch (error) {
      if (error.httpStatus !== 404) {
        throw error;
      }
      // Collection doesn't exist, continue with creation
    }

    // Create collection with schema
    console.log('📝 Creating collection with schema...');
    
    const schema = {
      name: typesenseConfig.collectionName,
      fields: [
        { name: 'canonicalId', type: 'string', facet: false },
        { name: 'name', type: 'string', facet: false },
        { name: 'genericName', type: 'string', facet: false, optional: true },
        { name: 'compositionText', type: 'string', facet: false },
        { name: 'manufacturerName', type: 'string', facet: true },
        { name: 'form', type: 'string', facet: true },
        { name: 'packSize', type: 'string', facet: false },
        { name: 'schedule', type: 'string', facet: true, optional: true },
        { name: 'requiresPrescription', type: 'bool', facet: true },
        { name: 'status', type: 'string', facet: true },
        { name: 'defaultGstRate', type: 'float', facet: false },
        { name: 'usageCount', type: 'int32', facet: false },
        { name: 'confidenceScore', type: 'float', facet: false },
        { name: 'primaryBarcode', type: 'string', facet: false, optional: true },
        { name: 'updatedAt', type: 'int64', facet: false },
      ],
      default_sorting_field: 'usageCount',
      token_separators: ['-', '/', '(', ')', '.', ','],
    };

    await typesenseClient.collections().create(schema);
    
    console.log('✅ Collection created successfully!');
    console.log('');
    console.log('Collection Details:');
    console.log(`  Name: ${schema.name}`);
    console.log(`  Fields: ${schema.fields.length}`);
    console.log(`  Default Sorting: ${schema.default_sorting_field}`);
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Run: npm run medicine:rebuild-index');
    console.log('  2. Test search: curl "http://localhost:8108/collections/medicines/documents/search?q=paracetamol&query_by=name"');
    console.log('');
  } catch (error) {
    console.error('❌ Failed to initialize collection:', error.message);
    if (error.importResults) {
      console.error('Import results:', error.importResults);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initSearchCollection()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initSearchCollection };
