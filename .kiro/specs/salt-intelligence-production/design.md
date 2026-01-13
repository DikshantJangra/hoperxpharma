# Design Document: Salt Intelligence Production System

## Overview

This design transforms the existing Salt Intelligence prototype into a production-grade system for retail pharmacy operations. The system enables efficient medicine ingestion through assisted OCR, intelligent salt matching, human-confirmed mapping, and substitute discovery - all while maintaining sub-second POS performance.

### Design Philosophy

1. **Human Authority**: Machines assist, humans confirm. No automatic clinical decisions.
2. **Performance First**: POS operations must never lag. All heavy processing happens asynchronously or client-side.
3. **Progressive Enhancement**: Start with manual entry, enhance with OCR, scale with bulk tools.
4. **Fail-Safe Defaults**: Unknown medicines default to SALT_PENDING, requiring explicit confirmation.
5. **Audit Everything**: Every salt mapping change is logged for compliance and debugging.

### Key Improvements Over Current System

**Current State Problems:**
- No clear entry point for daily medicine ingestion
- Substitute discovery not implemented
- Bulk correction tool exists but is hidden
- No dashboard integration or alerts
- OCR processing is slow and unreliable
- No mobile support for strip capture

**Production Design Solutions:**
- Prominent "Add Medicine" workflow with three entry modes
- Fast substitute engine with caching and indexing
- Integrated bulk correction with smart filtering
- Dashboard widget showing unmapped medicine count
- Client-side OCR with optimized regex matching
- Mobile-responsive capture with camera integration

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Ingestion   │  │   Bulk       │  │  Dashboard   │     │
│  │  Interface   │  │  Correction  │  │   Widget     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│  ┌─────────────────────────▼──────────────────────────┐    │
│  │         Client-Side Services                        │    │
│  │  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ OCR Service  │  │ Regex Matcher│               │    │
│  │  │ (Tesseract)  │  │              │               │    │
│  │  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Drug       │  │    Salt      │  │  Substitute  │     │
│  │  Service     │  │   Mapping    │  │   Engine     │     │
│  │              │  │   Service    │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│  ┌─────────────────────────▼──────────────────────────┐    │
│  │              Repositories                           │    │
│  │  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │    Drug      │  │     Salt     │               │    │
│  │  │  Repository  │  │  Repository  │               │    │
│  │  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma ORM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Drug      │  │     Salt     │  │ DrugSaltLink │     │
│  │              │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Inventory    │  │    Audit     │  │    Cache     │     │
│  │   Batch      │  │     Log      │  │   (Redis)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Frontend Components:**
- **Ingestion Interface**: Handles strip upload, OCR processing, salt confirmation
- **Bulk Correction Tool**: Mass editing of salt mappings with filtering
- **Dashboard Widget**: Shows unmapped medicine count and alerts
- **OCR Service**: Client-side Tesseract.js for image processing
- **Regex Matcher**: Pattern-based salt extraction from composition strings

**Backend Services:**
- **Drug Service**: CRUD operations for medicines, import handling
- **Salt Mapping Service**: Auto-mapping logic, duplicate detection
- **Substitute Engine**: Fast substitute discovery with caching
- **Audit Service**: Comprehensive change tracking and logging

**Data Layer:**
- **Drug Repository**: Optimized queries with indexing
- **Salt Repository**: Fast name/alias matching
- **Cache Layer**: Redis for substitute results and frequent queries

## Components and Interfaces

### 1. Medicine Ingestion Interface

**Location**: `/app/(main)/inventory/ingest/page.tsx`

**Purpose**: Primary entry point for adding new medicines with salt composition.

**Interface Design:**
```typescript
interface IngestionPageProps {
  mode?: 'scan' | 'manual' | 'bulk';
}

interface IngestionState {
  image: string | null;
  processing: boolean;
  ocrConfidence: number;
  extractedSalts: ExtractedSalt[];
  formData: MedicineFormData;
  errors: ValidationError[];
}

interface ExtractedSalt {
  name: string;
  strengthValue: number | null;
  strengthUnit: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  saltId?: string; // Resolved from Salt Master
}

interface MedicineFormData {
  name: string;
  manufacturer: string;
  form: string;
  hsnCode: string;
  requiresPrescription: boolean;
}
```

**Key Features:**
- Split-screen layout: image on left, form on right
- Real-time OCR processing with progress indicator
- Autocomplete for salt names from Salt Master
- Confidence badges for each detected salt
- Inline validation before confirmation
- Mobile-responsive with camera capture

### 2. OCR Service (Client-Side)

**Location**: `/lib/salt-intelligence/ocr-service.ts`

**Purpose**: Extract salt composition from strip images without server load.

**Enhanced Implementation:**
```typescript
interface OCRConfig {
  language: 'eng';
  tessedit_char_whitelist?: string;
  tessedit_pageseg_mode?: number;
}

interface OCRResult {
  rawText: string;
  extractedSalts: ExtractedComponent[];
  confidence: number;
  processingTime: number;
}

class SaltOCRService {
  private static readonly COMPOSITION_KEYWORDS = [
    /composition/i,
    /contains/i,
    /each.+tablet/i,
    /each.+capsule/i,
    /ip/i,
    /bp/i,
    /usp/i
  ];

  static async processImage(
    imageSource: string | File | Blob,
    config?: OCRConfig
  ): Promise<OCRResult>;

  private static filterRelevantLines(text: string): string[];
  private static enhanceImage(imageData: ImageData): ImageData;
}
```

**Optimizations:**
- Pre-process image: grayscale, contrast enhancement
- Focus OCR on keyword-containing lines only
- Use Tesseract.js worker pool for parallel processing
- Cache worker instances to avoid re-initialization
- Timeout after 5 seconds to prevent hanging

### 3. Regex Matcher (Enhanced)

**Location**: `/lib/salt-intelligence/regex-matcher.ts`

**Purpose**: Parse composition strings into structured salt data.

**Enhanced Implementation:**
```typescript
interface ParsingOptions {
  strictMode?: boolean;
  allowPartialMatch?: boolean;
}

class RegexMatcher {
  // Enhanced regex patterns
  private static readonly PATTERNS = {
    // "Paracetamol (500mg)"
    parenthesized: /^(.+?)\s*\(\s*([\d\.]+)\s*([a-zA-Z\/%]+)\s*\)$/,
    // "Paracetamol 500mg" or "Paracetamol 500 mg"
    spaced: /^(.+?)\s+([\d\.]+)\s*([a-zA-Z\/%]+)$/,
    // "Paracetamol IP 500mg"
    withSuffix: /^(.+?)\s+(IP|BP|USP)\s+([\d\.]+)\s*([a-zA-Z\/%]+)$/,
  };

  static parseComposition(
    composition: string,
    options?: ParsingOptions
  ): ExtractedComponent[];

  private static cleanSaltName(name: string): string;
  private static normalizeUnit(unit: string): string;
  private static calculateConfidence(
    component: ExtractedComponent
  ): 'HIGH' | 'MEDIUM' | 'LOW';
}
```

**Pattern Matching Strategy:**
1. Split by delimiters: `+`, `/`, `&`, `,`
2. Try each regex pattern in order
3. Clean salt name: remove IP/BP/USP, normalize whitespace
4. Normalize units: mg → mg, MG → mg, Mg → mg
5. Calculate confidence based on completeness

### 4. Salt Master Service

**Location**: `/backend/src/services/saltService.js`

**Purpose**: Manage the global salt database with aliases and metadata.

**Interface:**
```typescript
interface Salt {
  id: string;
  name: string; // Canonical name
  aliases: string[]; // Common alternatives
  category?: string; // e.g., "Antibiotic", "Analgesic"
  therapeuticClass?: string;
  highRisk: boolean;
  createdAt: Date;
  createdBy: string;
}

interface SaltSearchOptions {
  query: string;
  includeAliases: boolean;
  limit: number;
}

class SaltService {
  async searchSalts(options: SaltSearchOptions): Promise<Salt[]>;
  async createSalt(data: CreateSaltDTO): Promise<Salt>;
  async addAlias(saltId: string, alias: string): Promise<void>;
  async findByNameOrAlias(name: string): Promise<Salt | null>;
  async markHighRisk(saltId: string): Promise<void>;
}
```

**Key Operations:**
- **Search**: Match against name OR any alias (case-insensitive)
- **Deduplication**: Check existing names and aliases before creation
- **Alias Management**: Add/remove aliases without changing canonical name
- **High-Risk Flagging**: Mark controlled substances for special handling

### 5. Substitute Discovery Engine

**Location**: `/backend/src/services/substituteService.js`

**Purpose**: Fast discovery of alternative medicines with identical salt composition.

**Interface:**
```typescript
interface SubstituteQuery {
  drugId: string;
  storeId: string;
  includePartialMatches?: boolean;
}

interface Substitute {
  drugId: string;
  name: string;
  manufacturer: string;
  form: string;
  mrp: number;
  availableStock: number;
  matchType: 'EXACT' | 'PARTIAL';
  matchScore: number; // 0-100
  salts: SaltComposition[];
}

interface SaltComposition {
  saltName: string;
  strengthValue: number;
  strengthUnit: string;
}

class SubstituteService {
  async findSubstitutes(query: SubstituteQuery): Promise<Substitute[]>;
  private async findExactMatches(saltLinks: DrugSaltLink[]): Promise<Drug[]>;
  private async findPartialMatches(saltLinks: DrugSaltLink[]): Promise<Drug[]>;
  private rankSubstitutes(substitutes: Substitute[]): Substitute[];
}
```

**Matching Algorithm:**
1. Get salt composition of source drug (from DrugSaltLink)
2. Query for drugs with identical salt IDs and strengths
3. Filter by store availability (inventory > 0)
4. Rank by: stock availability > price > manufacturer preference
5. Cache results for 1 hour (keyed by drugId + storeId)

**Performance Optimization:**
```sql
-- Optimized substitute query with indexes
CREATE INDEX idx_drug_salt_link_composite 
ON "DrugSaltLink" ("saltId", "strengthValue", "strengthUnit");

CREATE INDEX idx_inventory_stock 
ON "InventoryBatch" ("drugId", "storeId", "quantityInStock") 
WHERE "deletedAt" IS NULL;
```

### 6. Bulk Correction Tool

**Location**: `/app/(main)/inventory/maintenance/page.tsx`

**Purpose**: Mass editing of salt mappings with smart filtering.

**Interface:**
```typescript
interface BulkCorrectionFilters {
  ingestionStatus?: 'DRAFT' | 'SALT_PENDING' | 'ACTIVE';
  saltId?: string;
  manufacturer?: string;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

interface BulkEditRow {
  drugId: string;
  name: string;
  manufacturer: string;
  currentComposition: string;
  ingestionStatus: string;
  isEditing: boolean;
  pendingChanges?: SaltCompositionUpdate;
}

interface SaltCompositionUpdate {
  saltsToAdd: ExtractedSalt[];
  saltsToRemove: string[]; // Salt IDs
  saltsToUpdate: { saltId: string; strengthValue: number; strengthUnit: string }[];
}
```

**Key Features:**
- Inline editing with autocomplete
- Batch save with progress indicator
- Filter by status, salt, manufacturer
- Highlight medicines pending > 7 days
- Audit log integration
- Undo/redo support

### 7. Dashboard Widget

**Location**: `/components/dashboard/SaltIntelligenceWidget.tsx`

**Purpose**: Surface unmapped medicines and provide quick access to correction tools.

**Interface:**
```typescript
interface WidgetData {
  unmappedCount: number;
  pendingCount: number;
  activeCount: number;
  recentlyAdded: number; // Last 24 hours
  oldestPending?: {
    drugId: string;
    name: string;
    daysPending: number;
  };
}

interface WidgetProps {
  storeId: string;
  refreshInterval?: number; // milliseconds
}
```

**Display Logic:**
- Green: unmappedCount === 0
- Yellow: unmappedCount 1-10
- Red: unmappedCount > 10 OR oldest > 7 days
- Click: Navigate to bulk correction with SALT_PENDING filter

## Data Models

### Enhanced Drug Model

```prisma
model Drug {
  id                  String              @id @default(cuid())
  storeId             String
  name                String
  genericName         String?
  strength            String?
  form                String?
  manufacturer        String?
  hsnCode             String?
  gstRate             Decimal             @default(0)
  requiresPrescription Boolean            @default(false)
  
  // Salt Intelligence Fields
  ingestionStatus     DrugIngestionStatus @default(SALT_PENDING)
  ocrMetadata         Json?               // Stores OCR confidence, raw text
  stripImageUrl       String?             // S3/local path to strip image
  confirmedBy         String?             // User ID who confirmed
  confirmedAt         DateTime?
  
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  
  store               Store               @relation(fields: [storeId], references: [id])
  saltLinks           DrugSaltLink[]
  inventory           InventoryBatch[]
  
  @@index([storeId, ingestionStatus])
  @@index([storeId, name])
}

enum DrugIngestionStatus {
  DRAFT          // Initial state, incomplete data
  SALT_PENDING   // Needs salt mapping confirmation
  ACTIVE         // Confirmed and available
}
```

### Salt Model (Existing, Enhanced)

```prisma
model Salt {
  id               String         @id @default(cuid())
  name             String         @unique  // Canonical name
  aliases          String[]                // Common alternatives
  category         String?
  therapeuticClass String?
  highRisk         Boolean        @default(false)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  createdById      String?
  
  createdBy        User?          @relation("SaltCreator", fields: [createdById], references: [id])
  drugSaltLinks    DrugSaltLink[]
  
  @@index([name])
  @@index([highRisk])
}
```

### DrugSaltLink Model (Existing)

```prisma
model DrugSaltLink {
  id            String   @id @default(cuid())
  drugId        String
  saltId        String
  strengthValue Decimal  @db.Decimal(10, 3)
  strengthUnit  String
  role          String   @default("PRIMARY")  // PRIMARY | SECONDARY
  order         Int      @default(1)
  createdAt     DateTime @default(now())
  
  drug          Drug     @relation(fields: [drugId], references: [id], onDelete: Cascade)
  salt          Salt     @relation(fields: [saltId], references: [id], onDelete: Cascade)
  
  @@unique([drugId, saltId])
  @@index([saltId, strengthValue, strengthUnit])
}
```

### Audit Log Model (New)

```prisma
model SaltMappingAudit {
  id            String   @id @default(cuid())
  drugId        String
  userId        String
  action        String   // CREATED | UPDATED | DELETED
  batchId       String?  // For bulk operations
  
  // Change tracking
  oldValue      Json?    // Previous salt composition
  newValue      Json     // New salt composition
  
  // OCR metadata
  ocrConfidence Float?
  wasAutoMapped Boolean  @default(false)
  
  createdAt     DateTime @default(now())
  
  drug          Drug     @relation(fields: [drugId], references: [id])
  user          User     @relation(fields: [userId], references: [id])
  
  @@index([drugId, createdAt])
  @@index([userId, createdAt])
  @@index([batchId])
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Salt Mapping Activation Requires At Least One Salt

*For any* medicine confirmation attempt, the system should only allow activation (status change to ACTIVE) if at least one valid DrugSaltLink record exists.

**Validates: Requirements 4.6, 12.1**

### Property 2: OCR Processing Performance Bound

*For any* uploaded strip image under 5MB, the OCR processing should complete within 5 seconds and return either extracted salts or an error.

**Validates: Requirements 1.3, 8.1**

### Property 3: Salt Name Matching Against Master

*For any* salt name search query, the system should return matches from both canonical names and aliases in the Salt Master, case-insensitively.

**Validates: Requirements 3.3, 4.3**

### Property 4: Substitute Discovery Exact Matching

*For any* medicine with salt composition, finding substitutes should return only medicines with identical salt IDs, strength values, and strength units.

**Validates: Requirements 5.2**

### Property 5: Substitute Ranking Consistency

*For any* set of substitutes, the ranking order should be deterministic based on: (1) stock availability > 0, (2) lower price, (3) manufacturer preference.

**Validates: Requirements 5.3**

### Property 6: Strength Value Requires Unit

*For any* salt with a non-null strength value, validation should fail if the strength unit is null or empty.

**Validates: Requirements 12.2**

### Property 7: Duplicate Salt Detection

*For any* medicine with multiple salt entries, validation should fail if two or more entries have the same salt ID.

**Validates: Requirements 12.4**

### Property 8: Comprehensive Audit Logging

*For any* salt mapping change (create, update, delete), an audit record should be created containing user ID, timestamp, old value, new value, and action type.

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 9: Import Status Assignment Based on Confidence

*For any* imported medicine with auto-mapped salts, the ingestion status should be ACTIVE if confidence is HIGH, and SALT_PENDING if confidence is MEDIUM or LOW.

**Validates: Requirements 13.3, 13.4**

### Property 10: Automatic Substitute Search on Out-of-Stock

*For any* medicine added to a sale with zero inventory, the system should automatically trigger a substitute search and return results or an empty list.

**Validates: Requirements 14.2**

### Property 11: Regex Matcher Preserves Salt Order

*For any* composition string with multiple salts separated by delimiters, the parsed output should maintain the same order as the input.

**Validates: Requirements 2.4**

### Property 12: Confidence Score Threshold Flagging

*For any* OCR result with confidence below 60%, the system should flag all extracted salts as LOW confidence.

**Validates: Requirements 2.5**

### Property 13: Bulk Update Batching

*For any* bulk correction operation affecting more than 100 medicines, the system should process updates in batches of 100 to prevent database locks.

**Validates: Requirements 8.5**

### Property 14: Cache Invalidation on Update

*For any* medicine salt mapping update, the substitute cache for that medicine should be invalidated immediately.

**Validates: Requirements 8.4**

### Property 15: SALT_PENDING Default for Unmapped Imports

*For any* medicine created via import or API without salt links, the ingestion status should default to SALT_PENDING.

**Validates: Requirements 7.4**

### Property 16: Unrealistic Strength Value Warning

*For any* salt with strength value ≤ 0 or > 10000, the validation should display a warning (but not block submission).

**Validates: Requirements 12.5**

### Property 17: Analytics Percentage Calculation

*For any* store, the percentage of ACTIVE medicines should equal (count of ACTIVE medicines / total medicines) × 100.

**Validates: Requirements 15.1**

### Property 18: Mobile Responsive Layout Stacking

*For any* viewport width < 768px, the ingestion interface should stack the image and form vertically instead of side-by-side.

**Validates: Requirements 11.5**

### Property 19: Salt Composition Round-Trip

*For any* valid salt composition, parsing the composition string then formatting it back should produce an equivalent composition (same salts, strengths, units).

**Validates: Requirements 2.3**

### Property 20: Substitute Cache TTL

*For any* substitute query result, repeated queries within 1 hour should return cached results without database access.

**Validates: Requirements 8.4**

## Error Handling

### Client-Side Errors

**OCR Processing Failures:**
- Timeout after 5 seconds → Show "Processing taking too long, please retake photo"
- Tesseract initialization failure → Fallback to manual entry mode
- Image too large (> 5MB) → Show size error before processing
- Invalid image format → Show format error with supported types

**Validation Errors:**
- Empty medicine name → "Medicine name is required"
- No salts mapped → "At least one salt is required to activate"
- Duplicate salts → "Duplicate salt detected: [salt name]"
- Missing strength unit → "Strength unit required when value is provided"
- Unrealistic strength → "Warning: Strength value seems unusual"

### Server-Side Errors

**Database Errors:**
- Unique constraint violation → "Medicine already exists with this name and strength"
- Foreign key violation → "Invalid salt ID or store ID"
- Connection timeout → Retry with exponential backoff (3 attempts)

**Business Logic Errors:**
- Salt not found in master → Prompt to add new salt or correct spelling
- Substitute query timeout → Return empty list with warning
- Bulk update partial failure → Return success count + error list

**API Errors:**
- 400 Bad Request → Show validation errors to user
- 401 Unauthorized → Redirect to login
- 403 Forbidden → "You don't have permission to perform this action"
- 404 Not Found → "Medicine or salt not found"
- 500 Internal Server Error → "Something went wrong, please try again"

### Error Recovery Strategies

**Graceful Degradation:**
- OCR fails → Fall back to manual entry
- Substitute search fails → Allow sale to proceed without substitutes
- Cache unavailable → Query database directly (slower but functional)

**Data Preservation:**
- Form data persists in local storage during errors
- Uploaded images cached until successful submission
- Bulk edit changes saved to draft before submission

## Testing Strategy

### Dual Testing Approach

This system requires both **unit tests** and **property-based tests** for comprehensive coverage:

**Unit Tests** verify:
- Specific examples and edge cases
- UI component rendering
- API endpoint responses
- Error handling paths

**Property-Based Tests** verify:
- Universal properties across all inputs
- Correctness guarantees at scale
- Performance under load
- Data integrity constraints

Both types are complementary and necessary. Unit tests catch concrete bugs, while property tests verify general correctness.

### Property-Based Testing Configuration

**Framework**: Use `fast-check` for TypeScript/JavaScript property testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: salt-intelligence-production, Property N: [property text]`
- Timeout: 30 seconds per property test
- Seed: Random (logged for reproducibility)

**Example Property Test:**
```typescript
import fc from 'fast-check';

// Feature: salt-intelligence-production, Property 1: Salt Mapping Activation Requires At Least One Salt
test('cannot activate medicine without salt links', () => {
  fc.assert(
    fc.property(
      fc.record({
        name: fc.string({ minLength: 1 }),
        manufacturer: fc.string(),
        form: fc.oneof(fc.constant('Tablet'), fc.constant('Capsule'), fc.constant('Syrup')),
        saltLinks: fc.constant([]) // Empty salt links
      }),
      async (medicine) => {
        const result = await drugService.activateMedicine(medicine);
        expect(result.success).toBe(false);
        expect(result.error).toContain('at least one salt');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Frontend Tests** (Jest + React Testing Library):
- Component rendering and interactions
- Form validation logic
- OCR service mocking
- Navigation flows

**Backend Tests** (Jest + Supertest):
- API endpoint responses
- Service layer business logic
- Repository query correctness
- Error handling

**Integration Tests** (Playwright):
- End-to-end ingestion workflow
- Bulk correction operations
- Substitute discovery at POS
- Mobile responsive behavior

### Test Coverage Goals

- Unit test coverage: > 80% for business logic
- Property test coverage: All 20 correctness properties
- Integration test coverage: All critical user flows
- Performance test coverage: All sub-200ms requirements

### Testing Priorities

**High Priority** (Must test before production):
1. Salt mapping activation validation (Property 1)
2. Substitute discovery exact matching (Property 4)
3. Audit logging completeness (Property 8)
4. OCR performance bounds (Property 2)
5. Import status assignment (Property 9)

**Medium Priority** (Test during development):
6. Duplicate salt detection (Property 7)
7. Strength validation (Property 6)
8. Cache invalidation (Property 14)
9. Bulk update batching (Property 13)
10. Regex parsing correctness (Property 11, 19)

**Low Priority** (Nice to have):
11. Analytics calculations (Property 17)
12. Mobile layout stacking (Property 18)
13. Warning thresholds (Property 16)
14. Cache TTL (Property 20)
15. Confidence flagging (Property 12)
