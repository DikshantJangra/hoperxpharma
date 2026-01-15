/**
 * Typesense Collection Schema for Medicine Search
 * 
 * Defines the structure and configuration for the medicines collection in Typesense.
 * This schema is optimized for fast, fuzzy, and prefix-based searches.
 */

import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

/**
 * Medicine search collection schema
 * 
 * Fields:
 * - canonicalId: Unique identifier from MedicineMaster
 * - name: Medicine brand name (searchable, high boost)
 * - genericName: Generic/INN name (searchable)
 * - compositionText: Denormalized composition for search
 * - manufacturerName: Manufacturer name (facetable)
 * - form: Dosage form (facetable)
 * - schedule: Regulatory schedule (facetable)
 * - requiresPrescription: Boolean flag (facetable)
 * - status: Medicine status (facetable)
 * - defaultGstRate: GST rate (facetable)
 * - usageCount: Number of stores using this medicine (for sorting)
 * - confidenceScore: Data quality score (for sorting)
 * - primaryBarcode: Manufacturer barcode (searchable)
 * - packSize: Pack size information
 * - updatedAt: Last update timestamp (for sorting)
 */
export const medicineCollectionSchema: CollectionCreateSchema = {
  name: 'medicines',
  fields: [
    {
      name: 'canonicalId',
      type: 'string',
      facet: false,
    },
    {
      name: 'name',
      type: 'string',
      facet: false,
    },
    {
      name: 'genericName',
      type: 'string',
      facet: false,
      optional: true,
    },
    {
      name: 'compositionText',
      type: 'string',
      facet: false,
    },
    {
      name: 'manufacturerName',
      type: 'string',
      facet: true,
    },
    {
      name: 'form',
      type: 'string',
      facet: true,
    },
    {
      name: 'schedule',
      type: 'string',
      facet: true,
      optional: true,
    },
    {
      name: 'requiresPrescription',
      type: 'bool',
      facet: true,
    },
    {
      name: 'status',
      type: 'string',
      facet: true,
    },
    {
      name: 'defaultGstRate',
      type: 'float',
      facet: true,
    },
    {
      name: 'usageCount',
      type: 'int32',
      facet: false,
    },
    {
      name: 'confidenceScore',
      type: 'int32',
      facet: false,
    },
    {
      name: 'primaryBarcode',
      type: 'string',
      facet: false,
      optional: true,
    },
    {
      name: 'packSize',
      type: 'string',
      facet: false,
    },
    {
      name: 'updatedAt',
      type: 'int64',
      facet: false,
    },
  ],
  // default_sorting_field: 'usageCount', // Not supported in this Typesense version
  token_separators: ['-', '+', '/', '(', ')', ','],
};

/**
 * Create the medicines collection in Typesense
 * @param client - Typesense client instance
 * @returns Promise with collection creation result
 */
export async function createMedicineCollection(client: any) {
  try {
    const collection = await client.collections().create(medicineCollectionSchema);
    console.log('✅ Medicine collection created successfully');
    return collection;
  } catch (error: any) {
    if (error.httpStatus === 409) {
      console.log('ℹ️  Medicine collection already exists');
      return await client.collections('medicines').retrieve();
    }
    console.error('❌ Failed to create medicine collection:', error);
    throw error;
  }
}

/**
 * Delete the medicines collection (useful for testing/reset)
 * @param client - Typesense client instance
 */
export async function deleteMedicineCollection(client: any) {
  try {
    await client.collections('medicines').delete();
    console.log('✅ Medicine collection deleted successfully');
  } catch (error: any) {
    if (error.httpStatus === 404) {
      console.log('ℹ️  Medicine collection does not exist');
      return;
    }
    console.error('❌ Failed to delete medicine collection:', error);
    throw error;
  }
}

/**
 * Get collection information
 * @param client - Typesense client instance
 */
export async function getMedicineCollectionInfo(client: any) {
  try {
    const collection = await client.collections('medicines').retrieve();
    return collection;
  } catch (error) {
    console.error('Failed to retrieve medicine collection info:', error);
    throw error;
  }
}
