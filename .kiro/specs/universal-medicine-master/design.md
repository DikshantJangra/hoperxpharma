# Design Document: Universal Medicine Master Database

## Overview

This design document outlines the architecture for a Universal Medicine Master Database that serves as the single source of truth for medicine data across the pharmacy platform. The system addresses the current chaos of fragmented data sources (CSV files, store-level databases, scan enrollments) by establishing a canonical medicine knowledge base with store-level overlays.

### Key Design Principles

1. **Separation of Concerns**: Global medicine truth vs store-specific customizations
2. **Read-Optimized Architecture**: Fast search is non-negotiable (sub-100ms)
3. **Cost Efficiency**: Cheap at rest, fast in use
4. **Organic Growth**: Platform becomes smarter as pharmacies contribute data
5. **Zero Duplication**: Core medicine attributes exist exactly once

### Technology Stack

- **Primary Database**: PostgreSQL (existing infrastructure)
  - *Why PostgreSQL?*: 3-5 lakh records = ~150MB, which is tiny. PostgreSQL handles this easily. The key is we DON'T use PostgreSQL for search - only for canonical storage and relationships with existing tables (Salt, Inventory, Suppliers).
  - *Storage Impact*: Currently you have duplicated drug records per store. The master consolidates this - net storage may actually DECREASE.
  
- **Search Engine**: Typesense (self-hosted, cost-efficient alternative to Elasticsearch)
  - *Why Typesense?*: Sub-50ms search on 3L+ records, typo tolerance, easy to self-host, ~$5-10/month on a small VPS
  - *Migration from CSV*: One-time script parses existing medicine-index.json → normalizes → loads into Typesense
  
- **Cache Layer**: Redis for hot data caching
- **Object Storage**: Cloudflare R2 for images (S3-compatible, no egress fees)
- **Message Queue**: Redis Pub/Sub for event propagation

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATIONS                                │
│  (POS, PO Composer, Inventory Management, Mobile Apps)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│  - Rate Limiting (1000 req/min per store)                                   │
│  - Authentication & Authorization                                            │
│  - Request Validation                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│   SEARCH SERVICE     │  │   MASTER SERVICE │  │   OVERLAY SERVICE    │
│                      │  │                  │  │                      │
│  - Typesense Client  │  │  - CRUD Ops      │  │  - Store-specific    │
│  - Query Builder     │  │  - Validation    │  │    pricing           │
│  - Result Merger     │  │  - Versioning    │  │  - Inventory links   │
│  - Autocomplete      │  │  - Governance    │  │  - Custom attributes │
└──────────────────────┘  └──────────────────┘  └──────────────────────┘
          │                        │                      │
          ▼                        ▼                      ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│     TYPESENSE        │  │    POSTGRESQL    │  │    POSTGRESQL        │
│   (Search Index)     │  │  (Medicine       │  │  (Store Overlays)    │
│                      │  │   Master)        │  │                      │
│  - 3L+ documents     │  │                  │  │  - Per-store data    │
│  - Sub-50ms queries  │  │  - Canonical     │  │  - Pricing rules     │
│  - Fuzzy matching    │  │    records       │  │  - Batch inventory   │
└──────────────────────┘  │  - Version       │  └──────────────────────┘
                          │    history       │
                          └──────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │   REDIS CACHE    │
                          │                  │
                          │  - Hot medicines │
                          │  - Search cache  │
                          │  - Session data  │
                          └──────────────────┘
```

## Components and Interfaces

### 1. Medicine Master Service

Responsible for managing the canonical medicine database.

```typescript
interface MedicineMasterService {
  // Core CRUD
  create(medicine: CreateMedicineInput): Promise<MedicineMaster>;
  getById(canonicalId: string): Promise<MedicineMaster | null>;
  getByIds(canonicalIds: string[]): Promise<MedicineMaster[]>;
  update(canonicalId: string, updates: UpdateMedicineInput): Promise<MedicineMaster>;
  softDelete(canonicalId: string, reason: string): Promise<void>;
  
  // Lookup
  findByBarcode(barcode: string): Promise<MedicineMaster | null>;
  findByComposition(saltIds: string[]): Promise<MedicineMaster[]>;
  findByManufacturer(manufacturerId: string): Promise<MedicineMaster[]>;
  
  // Versioning
  getVersionHistory(canonicalId: string): Promise<MedicineVersion[]>;
  rollback(canonicalId: string, versionId: string): Promise<MedicineMaster>;
  
  // Bulk operations
  bulkCreate(medicines: CreateMedicineInput[]): Promise<BulkResult>;
  bulkUpdate(updates: BulkUpdateInput[]): Promise<BulkResult>;
}
```

### 2. Search Service

Handles all search operations using Typesense.

```typescript
interface SearchService {
  // Search operations
  search(query: SearchQuery): Promise<SearchResult>;
  autocomplete(prefix: string, options?: AutocompleteOptions): Promise<AutocompleteResult>;
  searchByComposition(salt: string): Promise<SearchResult>;
  searchByManufacturer(manufacturer: string): Promise<SearchResult>;
  
  // Index management
  indexMedicine(medicine: MedicineMaster): Promise<void>;
  bulkIndex(medicines: MedicineMaster[]): Promise<void>;
  removefromIndex(canonicalId: string): Promise<void>;
  rebuildIndex(): Promise<void>;
  
  // Health
  getIndexStats(): Promise<IndexStats>;
}

interface SearchQuery {
  query: string;
  filters?: {
    manufacturer?: string;
    schedule?: string;
    requiresPrescription?: boolean;
    discontinued?: boolean;
  };
  limit?: number;
  offset?: number;
  boost?: {
    name?: number;
    composition?: number;
    manufacturer?: number;
  };
}
```

### 3. Store Overlay Service

Manages store-specific customizations.

```typescript
interface StoreOverlayService {
  // Overlay CRUD
  getOverlay(storeId: string, canonicalId: string): Promise<StoreOverlay | null>;
  setOverlay(storeId: string, canonicalId: string, overlay: OverlayInput): Promise<StoreOverlay>;
  removeOverlay(storeId: string, canonicalId: string): Promise<void>;
  
  // Bulk operations
  getOverlaysForStore(storeId: string, canonicalIds: string[]): Promise<Map<string, StoreOverlay>>;
  
  // Merged view
  getMergedMedicine(storeId: string, canonicalId: string): Promise<MergedMedicine>;
  getMergedMedicines(storeId: string, canonicalIds: string[]): Promise<MergedMedicine[]>;
}

interface StoreOverlay {
  storeId: string;
  canonicalId: string;
  customMrp?: number;
  customPurchasePrice?: number;
  discountPercentage?: number;
  internalBarcode?: string;
  internalQrCode?: string;
  customNotes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. Ingestion Pipeline Service

Handles new medicine additions with validation. **Important: Pharmacies can use new medicines INSTANTLY - no waiting for review.**

```typescript
interface IngestionPipelineService {
  // Ingestion - INSTANT for the submitting store
  ingest(input: IngestionInput): Promise<IngestionResult>;
  bulkIngest(inputs: IngestionInput[]): Promise<BulkIngestionResult>;
  
  // Validation (runs async, doesn't block pharmacy)
  validateMedicine(input: IngestionInput): Promise<ValidationResult>;
  checkDuplicates(input: IngestionInput): Promise<DuplicateCheckResult>;
  
  // Review workflow (Phase 2 - Admin Panel)
  // For now, auto-promotion based on confidence + usage
  getPendingReviews(): Promise<PendingMedicine[]>;
  approveMedicine(pendingId: string, reviewerId: string): Promise<MedicineMaster>;
  rejectMedicine(pendingId: string, reviewerId: string, reason: string): Promise<void>;
  
  // Auto-promotion (Phase 1 - No manual review needed)
  checkPromotionEligibility(pendingId: string): Promise<PromotionEligibility>;
  promoteToVerified(pendingId: string): Promise<MedicineMaster>;
}

/*
 * INSTANT AVAILABILITY FLOW:
 * 1. Pharmacy adds new medicine → Immediately available in THEIR store
 * 2. Background: System creates "pending" entry in global master
 * 3. Background: Validation runs (de-duplication, data quality)
 * 4. Auto-promotion: When confidence >= 80 AND 3+ stores use it → becomes "verified"
 * 5. Phase 2: Admin can manually review/approve pending medicines
 */

interface IngestionInput {
  source: 'OCR' | 'MANUAL' | 'BARCODE' | 'IMPORT';
  name: string;
  genericName?: string;
  composition?: string;
  strength?: string;
  form?: string;
  manufacturer?: string;
  packSize?: string;
  hsnCode?: string;
  gstRate?: number;
  schedule?: string;
  barcode?: string;
  sourceStoreId: string;
  ocrConfidence?: number;
  rawOcrText?: string;
}
```

### 5. Migration Service

Handles CSV/JSON to database migration. **This is a ONE-TIME operation, not ongoing storage duplication.**

```typescript
interface MigrationService {
  // Migration operations
  importFromCsv(filePath: string, options?: ImportOptions): Promise<MigrationResult>;
  importFromJson(filePath: string, options?: ImportOptions): Promise<MigrationResult>;
  validateCsvFormat(filePath: string): Promise<ValidationResult>;
  
  // Normalization
  normalizeName(name: string): string;
  normalizeStrength(strength: string): NormalizedStrength;
  normalizePackSize(packSize: string): NormalizedPackSize;
  
  // De-duplication
  findPotentialDuplicates(medicine: MedicineInput): Promise<DuplicateCandidate[]>;
  mergeDuplicates(primaryId: string, duplicateIds: string[]): Promise<MedicineMaster>;
  
  // ID mapping
  createIdMapping(oldId: string, newCanonicalId: string): Promise<void>;
  lookupByOldId(oldId: string): Promise<string | null>;
  
  // Reporting
  generateMigrationReport(): Promise<MigrationReport>;
}

/*
 * MIGRATION STRATEGY (Addressing Storage Concerns):
 * 
 * CURRENT STATE:
 * - medicine-index.json: ~50MB, 253,973 records
 * - Loaded into browser memory for PO search
 * - Store-level Drug table: Duplicated per store
 * 
 * AFTER MIGRATION:
 * - PostgreSQL MedicineMaster: ~150MB (one canonical record per medicine)
 * - Typesense index: ~100MB (optimized for search)
 * - Store Drug table: References canonical_id (no duplication)
 * 
 * NET EFFECT:
 * - Browser no longer loads 50MB JSON (faster PO page load)
 * - Store Drug records shrink (only store-specific fields)
 * - Total storage may DECREASE due to deduplication
 * 
 * MIGRATION SCRIPT:
 * 1. Parse medicine-index.json
 * 2. Normalize names, strengths, pack sizes
 * 3. Deduplicate (same name + composition + manufacturer + pack)
 * 4. Insert into PostgreSQL MedicineMaster
 * 5. Index into Typesense
 * 6. Create ID mappings for backward compatibility
 * 7. Update existing Drug records to reference canonical_ids
 */

### 6. Export Service

Handles data serialization and export.

```typescript
interface ExportService {
  // Full exports (INTERNAL USE ONLY - not exposed to external API)
  exportAll(format: 'JSON' | 'CSV'): Promise<ExportResult>;
  exportForStore(storeId: string, format: 'JSON' | 'CSV'): Promise<ExportResult>;
  
  // Incremental exports
  exportChanges(since: Date): Promise<ExportResult>;
  exportChangesForStore(storeId: string, since: Date): Promise<ExportResult>;
  
  // Serialization
  serialize(medicine: MedicineMaster): string;
  deserialize(json: string): MedicineMaster;
  
  // Pretty printing
  prettyPrint(medicine: MedicineMaster): string;
  prettyPrintBatch(medicines: MedicineMaster[]): string;
}
```

### 7. Image Contribution Service

Handles medicine image uploads with contribution workflow.

```typescript
interface ImageContributionService {
  // Upload
  uploadImage(input: ImageUploadInput): Promise<ImageUploadResult>;
  
  // Contribution workflow
  contributeAsGlobal(imageId: string, storeId: string): Promise<ContributionResult>;
  getContributionStatus(imageId: string): Promise<ContributionStatus>;
  
  // Deduplication
  findDuplicateByHash(contentHash: string): Promise<string | null>;
  
  // Retrieval
  getImagesForMedicine(canonicalId: string, storeId?: string): Promise<MedicineImage[]>;
}

interface ImageUploadInput {
  canonicalId: string;
  storeId: string;
  imageType: 'FRONT' | 'BACK' | 'STRIP' | 'BOX' | 'OTHER';
  file: Buffer;
  mimeType: string;
}

/*
 * IMAGE CONTRIBUTION FLOW:
 * 1. Pharmacy uploads image for a medicine → Stored as store-specific image
 * 2. If medicine has NO global image:
 *    - System prompts: "Would you like to contribute this as the global image?"
 *    - If yes: Image is marked as "contributed" and becomes global
 * 3. If medicine HAS global image:
 *    - Store image remains store-specific
 *    - Admin can later promote store images to global (Phase 2)
 * 
 * STORAGE:
 * - All images stored in Cloudflare R2
 * - Path: /medicines/{canonicalId}/global/{imageType}.webp
 *         /medicines/{canonicalId}/stores/{storeId}/{imageType}.webp
 * - Deduplication via content hash (SHA-256)
 */
```

### 8. Data Security Layer

Prevents unauthorized bulk access to medicine data.

```typescript
interface DataSecurityConfig {
  // Rate limiting
  maxRequestsPerMinute: 1000;        // Per store
  maxResultsPerQuery: 100;           // Pagination limit
  maxBulkOperationSize: 1000;        // For imports
  
  // Access control
  allowFullExport: false;            // No bulk download for external users
  requireStoreContext: true;         // All queries must have store context
  auditAllAccess: true;              // Log all data access
}

/*
 * SECURITY MEASURES:
 * 1. NO public endpoint for full database export
 * 2. Search results capped at 100 per request
 * 3. Rate limiting: 1000 requests/minute per store
 * 4. All API calls require authentication + store context
 * 5. Audit logging for all data access
 * 6. Export endpoints only for authorized store admins (their own data)
 * 
 * WHAT'S PROTECTED:
 * - Full medicine catalog cannot be downloaded in one request
 * - Competitors cannot scrape the entire database
 * - Each store can only export their own overlay data
 */
```

## Data Models

### Medicine Master Schema

```typescript
interface MedicineMaster {
  // Identity
  canonicalId: string;           // Globally unique ID (CUID)
  legacyIds: string[];           // Old IDs for backward compatibility
  
  // Core attributes (universal)
  name: string;                  // Brand name
  genericName: string | null;    // Generic/INN name
  
  // Composition
  saltComposition: SaltLink[];   // Links to Salt table with strengths
  compositionText: string;       // Denormalized text for search
  
  // Physical form
  strength: string | null;       // e.g., "500mg", "10mg/5ml"
  form: string;                  // Tablet, Capsule, Syrup, etc.
  packSize: string;              // e.g., "strip of 10 tablets"
  
  // Manufacturer
  manufacturerId: string | null;
  manufacturerName: string;      // Denormalized for search
  
  // Regulatory
  schedule: string | null;       // H, H1, X, G, etc.
  requiresPrescription: boolean;
  hsnCode: string | null;
  defaultGstRate: number;        // Default GST rate (can be overridden)
  
  // Barcodes
  primaryBarcode: string | null; // Manufacturer barcode
  alternativeBarcodes: string[]; // Additional barcodes
  
  // Status
  status: 'PENDING' | 'VERIFIED' | 'DISCONTINUED';
  confidenceScore: number;       // 0-100
  usageCount: number;            // Number of stores using this
  
  // Media
  globalImageUrls: string[];     // CDN URLs for product images
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;      // User who added it
  verifiedAt: Date | null;
  verifiedBy: string | null;
  discontinuedAt: Date | null;
  
  // Version control
  version: number;
  previousVersionId: string | null;
}

interface SaltLink {
  saltId: string;
  saltName: string;              // Denormalized
  strengthValue: number;
  strengthUnit: string;          // mg, ml, mcg, IU, etc.
  role: 'PRIMARY' | 'SECONDARY';
  order: number;
}
```

### Store Overlay Schema

```typescript
interface StoreOverlay {
  id: string;
  storeId: string;
  canonicalId: string;           // Reference to MedicineMaster
  
  // Pricing
  customMrp: number | null;
  customPurchasePrice: number | null;
  discountPercentage: number | null;
  marginPercentage: number | null;
  
  // Store-specific identifiers
  internalSku: string | null;
  internalBarcode: string | null;
  internalQrCode: string | null;
  
  // Inventory settings
  lowStockThreshold: number | null;
  reorderQuantity: number | null;
  preferredSupplierId: string | null;
  
  // Custom attributes
  customNotes: string | null;
  storeImageUrls: string[];      // Store-specific images
  
  // Status
  isActive: boolean;
  isFavorite: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### Pending Medicine Schema (Ingestion Queue)

```typescript
interface PendingMedicine {
  id: string;
  
  // Submitted data
  submittedData: IngestionInput;
  
  // Processing status
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'MERGED';
  
  // Validation results
  validationErrors: ValidationError[];
  duplicateCandidates: DuplicateCandidate[];
  
  // Scoring
  confidenceScore: number;
  dataCompletenessScore: number;
  
  // Usage tracking
  sourceStoreId: string;
  usedByStoreIds: string[];      // Stores that have used this pending entry
  
  // Review
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  
  // Resolution
  resolvedCanonicalId: string | null;  // If approved or merged
  rejectionReason: string | null;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### Medicine Version Schema

```typescript
interface MedicineVersion {
  id: string;
  canonicalId: string;
  version: number;
  
  // Snapshot of data at this version
  data: MedicineMaster;
  
  // Change tracking
  changedFields: string[];
  changeReason: string | null;
  changedBy: string;
  changedAt: Date;
  
  // Rollback info
  isRolledBack: boolean;
  rolledBackAt: Date | null;
  rolledBackBy: string | null;
}
```

## Search Index Schema (Typesense)

```typescript
// Typesense collection schema
const medicineSearchSchema = {
  name: 'medicines',
  fields: [
    { name: 'canonicalId', type: 'string', facet: false },
    { name: 'name', type: 'string', facet: false },
    { name: 'genericName', type: 'string', facet: false, optional: true },
    { name: 'compositionText', type: 'string', facet: false },
    { name: 'manufacturerName', type: 'string', facet: true },
    { name: 'form', type: 'string', facet: true },
    { name: 'schedule', type: 'string', facet: true, optional: true },
    { name: 'requiresPrescription', type: 'bool', facet: true },
    { name: 'status', type: 'string', facet: true },
    { name: 'defaultGstRate', type: 'float', facet: true },
    { name: 'usageCount', type: 'int32', facet: false },
    { name: 'confidenceScore', type: 'int32', facet: false },
    { name: 'primaryBarcode', type: 'string', facet: false, optional: true },
    { name: 'packSize', type: 'string', facet: false },
    { name: 'updatedAt', type: 'int64', facet: false },
  ],
  default_sorting_field: 'usageCount',
  token_separators: ['-', '+', '/', '(', ')'],
};
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Medicine Master Data Completeness

*For any* medicine created in the Medicine_Master, the record SHALL contain all required universal attributes: canonical_id, name, form, manufacturer_name, and default_gst_rate.

**Validates: Requirements 1.1**

### Property 2: Canonical ID Uniqueness

*For any* two medicines created in the Medicine_Master, their canonical_ids SHALL be different.

**Validates: Requirements 1.2**

### Property 3: Store-Specific Data Exclusion from Master

*For any* MedicineMaster record, the schema SHALL NOT contain fields for: custom_mrp, custom_purchase_price, discount_percentage, or stock_quantity.

**Validates: Requirements 1.3**

### Property 4: Query Consistency Across Stores

*For any* medicine and any two stores, querying the Medicine_Master by the same canonical_id SHALL return identical data.

**Validates: Requirements 1.4**

### Property 5: Salt Referential Integrity

*For any* medicine with salt_composition links, all referenced salt_ids SHALL exist in the Salt table.

**Validates: Requirements 1.6**

### Property 6: Overlay References Valid Master

*For any* StoreOverlay record, the canonical_id SHALL reference a valid medicine in the Medicine_Master.

**Validates: Requirements 2.1**

### Property 7: Overlay Schema Exclusion

*For any* StoreOverlay record, the schema SHALL NOT contain fields for: name, generic_name, composition_text, or manufacturer_name.

**Validates: Requirements 2.3**

### Property 8: Merged Data Completeness

*For any* medicine with a store overlay, the merged result SHALL contain both master fields (name, composition) and overlay fields (custom_mrp, discount_percentage).

**Validates: Requirements 2.4**

### Property 9: Default Overlay Behavior

*For any* medicine without a store overlay, querying getMergedMedicine SHALL return master data with null values for overlay-specific fields.

**Validates: Requirements 2.5**

### Property 10: Search Performance

*For any* search query against the medicine index with 3+ lakh records, the response time SHALL be less than 100 milliseconds.

**Validates: Requirements 3.1**

### Property 11: Fuzzy Search Tolerance

*For any* medicine name with up to 2 character substitutions, deletions, or insertions, the search SHALL return the original medicine in the results.

**Validates: Requirements 3.2**

### Property 12: Prefix Autocomplete

*For any* medicine name, typing the first 2 or more characters as a prefix query SHALL return that medicine in the autocomplete results.

**Validates: Requirements 3.3**

### Property 13: Relevance Boost Ordering

*For any* search query matching multiple fields, results with name matches SHALL rank higher than results with only composition or manufacturer matches when name boost is configured higher.

**Validates: Requirements 3.4**

### Property 14: Discontinued Medicine Filtering

*For any* search query with default filters, discontinued medicines SHALL NOT appear in the results.

**Validates: Requirements 3.5**

### Property 15: Salt-Based Search

*For any* salt in the database, searching by that salt name SHALL return all medicines containing that salt in their composition.

**Validates: Requirements 3.6**

### Property 16: Ingestion Creates Pending Entry

*For any* new medicine submission not matching an existing master record, the Ingestion_Pipeline SHALL create a PendingMedicine entry with status 'PENDING'.

**Validates: Requirements 4.1**

### Property 17: Duplicate Detection

*For any* medicine submission with name similarity > 80% to an existing medicine with matching manufacturer, the system SHALL flag it as a potential duplicate.

**Validates: Requirements 4.3, 4.4**

### Property 18: Confidence Score Bounds

*For any* ingested medicine, the assigned confidence_score SHALL be between 0 and 100 inclusive.

**Validates: Requirements 4.5**

### Property 19: Promotion Criteria

*For any* pending medicine with confidence_score >= 80 AND used_by_store_count >= 3, calling checkPromotionEligibility SHALL return eligible = true.

**Validates: Requirements 4.6**

### Property 20: Ingestion Audit Trail

*For any* ingestion event, an audit record SHALL be created containing: source, timestamp, source_store_id, and validation_status.

**Validates: Requirements 4.7**

### Property 21: Name Normalization Idempotence

*For any* medicine name, applying normalizeName twice SHALL produce the same result as applying it once: normalizeName(normalizeName(name)) === normalizeName(name).

**Validates: Requirements 5.2**

### Property 22: Deduplication Determinism

*For any* set of medicines with identical (name, composition, manufacturer, pack_size), migration SHALL produce exactly one canonical record.

**Validates: Requirements 5.3**

### Property 23: ID Mapping Round-Trip

*For any* migrated medicine, looking up by old_id SHALL return the same canonical_id, and looking up by canonical_id SHALL return a record whose legacy_ids contains the old_id.

**Validates: Requirements 5.4, 5.5**

### Property 24: Cache Hit for Frequent Queries

*For any* medicine queried more than 10 times within the cache TTL period, subsequent queries SHALL be served from cache (cache hit).

**Validates: Requirements 6.3**

### Property 25: Image Deduplication

*For any* two identical images (same content hash) uploaded for different medicines, only one copy SHALL be stored in object storage.

**Validates: Requirements 7.3**

### Property 26: Image Compression Validity

*For any* uploaded image, the compressed version SHALL be a valid image file that can be decoded and displayed.

**Validates: Requirements 7.6**

### Property 27: Version History Preservation

*For any* medicine update, a new version record SHALL be created, and both the previous version and new version SHALL be retrievable via getVersionHistory.

**Validates: Requirements 8.1, 8.2**

### Property 28: Verified Medicine Protection

*For any* update attempt to a verified medicine by a non-authorized user, the system SHALL reject the update with an authorization error.

**Validates: Requirements 8.3**

### Property 29: Rollback Restoration

*For any* medicine with version history, rolling back to a previous version SHALL restore the medicine data to match that version exactly.

**Validates: Requirements 8.4**

### Property 30: Incomplete Data Flagging

*For any* medicine missing composition_text, manufacturer_name, or hsn_code, the data quality check SHALL flag it as incomplete.

**Validates: Requirements 8.5**

### Property 31: Soft Delete Preservation

*For any* discontinued medicine, the record SHALL remain queryable with a filter for historical data, and status SHALL be 'DISCONTINUED'.

**Validates: Requirements 8.7**

### Property 32: Rate Limiting Enforcement

*For any* store exceeding 1000 requests per minute, subsequent requests SHALL be rejected with a 429 status code.

**Validates: Requirements 9.3**

### Property 33: API Response Schema Consistency

*For any* API response, the structure SHALL match the defined response schema with proper status codes and error messages.

**Validates: Requirements 9.4**

### Property 34: Event Publication on Mutation

*For any* medicine create or update operation, an event SHALL be published to the message queue with the operation type and affected canonical_id.

**Validates: Requirements 9.5**

### Property 35: Input Validation Rejection

*For any* API request with invalid input (missing required fields, wrong types, constraint violations), the system SHALL reject it with a 400 status code and validation error details.

**Validates: Requirements 9.7**

### Property 36: Serialization Round-Trip

*For any* valid MedicineMaster record, serializing to JSON then deserializing back SHALL produce an equivalent object: deserialize(serialize(medicine)) equals medicine.

**Validates: Requirements 10.1, 10.4, 10.5**

### Property 37: Incremental Export Correctness

*For any* export since timestamp T, the result SHALL contain exactly the medicines with updatedAt > T and no medicines with updatedAt <= T.

**Validates: Requirements 10.2**

### Property 38: Store Export Merge Correctness

*For any* store-specific export, each medicine record SHALL contain merged data from both the master and the store's overlay (if exists).

**Validates: Requirements 10.6**

## Error Handling

### Error Categories

1. **Validation Errors (4xx)**
   - Invalid input data format
   - Missing required fields
   - Constraint violations (duplicate canonical_id, invalid references)
   - Schema validation failures

2. **Authorization Errors (401/403)**
   - Unauthenticated requests
   - Insufficient permissions for operation
   - Store access violations

3. **Not Found Errors (404)**
   - Medicine not found by canonical_id
   - Store overlay not found
   - Version not found for rollback

4. **Conflict Errors (409)**
   - Duplicate medicine detection during ingestion
   - Concurrent update conflicts (optimistic locking)
   - ID mapping conflicts during migration

5. **Rate Limit Errors (429)**
   - Store exceeds request quota
   - Bulk operation size limits exceeded

6. **Server Errors (5xx)**
   - Database connection failures
   - Search index unavailable
   - Cache service failures
   - External service timeouts

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: {
      field?: string;       // Field that caused the error
      reason?: string;      // Specific reason
      suggestion?: string;  // How to fix
    }[];
    requestId: string;      // For debugging/support
    timestamp: string;      // ISO 8601
  };
}
```

### Retry Strategy

| Error Type | Retry | Backoff |
|------------|-------|---------|
| 4xx Validation | No | N/A |
| 401/403 Auth | No | N/A |
| 404 Not Found | No | N/A |
| 409 Conflict | Yes (with refresh) | None |
| 429 Rate Limit | Yes | Exponential (1s, 2s, 4s) |
| 5xx Server | Yes | Exponential (1s, 2s, 4s, max 30s) |

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

1. **Medicine Master Service**
   - Create medicine with valid data
   - Create medicine with missing required fields (should fail)
   - Update medicine attributes
   - Soft delete and verify status change
   - Version creation on update

2. **Search Service**
   - Search with exact match
   - Search with typos (fuzzy)
   - Autocomplete with prefix
   - Filter by manufacturer
   - Filter out discontinued

3. **Store Overlay Service**
   - Create overlay for existing medicine
   - Create overlay for non-existent medicine (should fail)
   - Merge master with overlay
   - Merge master without overlay

4. **Ingestion Pipeline**
   - Ingest new medicine (creates pending)
   - Ingest duplicate (flags for review)
   - Calculate confidence score
   - Promote eligible medicine

5. **Migration Service**
   - Normalize name casing
   - Normalize strength units
   - Detect duplicates
   - Create ID mappings

6. **Export Service**
   - Serialize single medicine
   - Serialize batch
   - Incremental export
   - Store-specific export

### Property-Based Tests

Property-based tests verify universal properties across many generated inputs using a PBT library (fast-check for TypeScript).

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: universal-medicine-master, Property {N}: {description}**

**Test Categories:**

1. **Data Integrity Properties**
   - Property 1: Data completeness
   - Property 2: ID uniqueness
   - Property 5: Salt referential integrity
   - Property 6: Overlay references valid master

2. **Schema Constraint Properties**
   - Property 3: Master excludes store-specific fields
   - Property 7: Overlay excludes master fields

3. **Query Behavior Properties**
   - Property 4: Query consistency across stores
   - Property 8: Merged data completeness
   - Property 9: Default overlay behavior

4. **Search Properties**
   - Property 10: Performance bounds
   - Property 11: Fuzzy tolerance
   - Property 12: Prefix autocomplete
   - Property 13: Relevance ordering
   - Property 14: Discontinued filtering
   - Property 15: Salt-based search

5. **Ingestion Properties**
   - Property 16: Pending entry creation
   - Property 17: Duplicate detection
   - Property 18: Confidence score bounds
   - Property 19: Promotion criteria
   - Property 20: Audit trail

6. **Migration Properties**
   - Property 21: Normalization idempotence
   - Property 22: Deduplication determinism
   - Property 23: ID mapping round-trip

7. **Caching Properties**
   - Property 24: Cache hit for frequent queries

8. **Media Properties**
   - Property 25: Image deduplication
   - Property 26: Compression validity

9. **Governance Properties**
   - Property 27: Version history preservation
   - Property 28: Verified medicine protection
   - Property 29: Rollback restoration
   - Property 30: Incomplete data flagging
   - Property 31: Soft delete preservation

10. **API Properties**
    - Property 32: Rate limiting
    - Property 33: Response schema consistency
    - Property 34: Event publication
    - Property 35: Input validation

11. **Serialization Properties**
    - Property 36: Round-trip consistency
    - Property 37: Incremental export correctness
    - Property 38: Store export merge correctness

### Integration Tests

1. **End-to-End Flows**
   - Create medicine → Index → Search → Find
   - Create medicine → Create overlay → Query merged
   - Ingest → Review → Approve → Verify in master
   - Migrate CSV → Verify counts → Search migrated

2. **Cross-Service Integration**
   - Medicine update → Search index sync
   - Medicine update → Event publication → Consumer receipt
   - Cache invalidation on update

### Performance Tests

1. **Search Latency**
   - P50, P95, P99 latency for search queries
   - Latency under load (100 concurrent users)

2. **Bulk Operations**
   - Bulk import 10,000 medicines
   - Bulk export full catalog

3. **Index Rebuild**
   - Time to rebuild search index from scratch
