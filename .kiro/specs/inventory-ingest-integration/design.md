# Design Document: Inventory Ingest Integration

## Overview

This design integrates the medicine ingest functionality into the inventory management system, fixes salt mapping filters, and adds intelligent salt suggestions. The system will allow users to add medicines from any inventory page, automatically suggest salts based on medicine names, and properly filter medicines by composition status.

## Architecture

### Component Structure

```
inventory/
├── stock/page.tsx (updated with ingest modal)
├── batches/page.tsx (updated with ingest modal)
├── maintenance/page.tsx (fixed filters + salt suggestions)
├── ingest/page.tsx (refactored as reusable component)
└── components/
    ├── IngestModal.tsx (modal wrapper for ingest)
    ├── SaltSuggestions.tsx (intelligent suggestions)
    └── CompositionEditor.tsx (edit composition with suggestions)

lib/
├── salt-intelligence/
│   ├── salt-suggestion-service.ts (NEW - suggests salts)
│   └── ocr-service.ts (existing)
└── api/
    └── drugs-api.ts (NEW - centralized API calls)
```

### Data Flow

1. **Add Medicine Flow**:
   - User clicks "+ New SKU" on stock/batches page
   - IngestModal opens with full ingest interface
   - User completes ingest (scan or manual)
   - Medicine saved to database
   - Modal closes, page refreshes with new medicine

2. **Salt Suggestion Flow**:
   - User enters medicine name
   - SaltSuggestionService analyzes name
   - Suggests likely salts with confidence scores
   - User accepts suggestion or enters manually
   - System learns from user choices

3. **Maintenance/Mapping Flow**:
   - User opens maintenance page
   - Filter shows medicines with missing composition
   - User selects medicine
   - SaltSuggestions component shows recommendations
   - User accepts or manually edits
   - Changes saved to database

## Components and Interfaces

### IngestModal Component

```typescript
interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  returnPath?: string;
}

// Wraps existing ingest page functionality in a modal
// Maintains all existing ingest logic
// Handles success callback to refresh parent page
```

### SaltSuggestions Component

```typescript
interface SaltSuggestionsProps {
  medicineName: string;
  onSelect: (salt: SuggestedSalt) => void;
  onManualEntry: () => void;
}

interface SuggestedSalt {
  name: string;
  strength?: number;
  unit?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  source: 'database' | 'pattern' | 'ml';
}
```

### SaltSuggestionService

```typescript
class SaltSuggestionService {
  // Analyze medicine name and suggest salts
  async suggestSalts(medicineName: string): Promise<SuggestedSalt[]>
  
  // Extract active ingredients from name patterns
  private extractFromName(name: string): SuggestedSalt[]
  
  // Query database for similar medicines
  private queryDatabase(name: string): Promise<SuggestedSalt[]>
  
  // Learn from user selections
  recordUserChoice(medicineName: string, selectedSalt: SuggestedSalt): Promise<void>
}
```

## Data Models

### Medicine (existing, enhanced)

```typescript
interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  form: string;
  hsnCode: string;
  requiresPrescription: boolean;
  storeId: string;
  ingestionStatus: 'DRAFT' | 'SALT_PENDING' | 'ACTIVE';
  saltLinks: SaltLink[];
  stripImageUrl?: string;
  ocrMetadata?: {
    confidence: number;
    extractedSalts: SaltEntry[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### SaltLink (existing, enhanced)

```typescript
interface SaltLink {
  id: string;
  medicineId: string;
  saltId: string;
  name: string;
  strengthValue: number;
  strengthUnit: string;
  order: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  source: 'manual' | 'ocr' | 'suggestion';
  createdAt: Date;
}
```

### SaltSuggestionRecord (NEW)

```typescript
interface SaltSuggestionRecord {
  id: string;
  medicineName: string;
  suggestedSalt: string;
  userAccepted: boolean;
  userSelectedSalt?: string;
  storeId: string;
  createdAt: Date;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Ingest Modal Preserves Functionality
*For any* medicine data entered in the ingest modal, the modal should produce the same result as the standalone ingest page when submitted.
**Validates: Requirements 1.1, 1.2, 1.4**

### Property 2: Filter Returns Medicines Without Composition
*For any* set of medicines in the database, filtering by "no composition" should return exactly those medicines where saltLinks is empty or null.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Salt Suggestions Are Relevant
*For any* medicine name, the suggested salts should match common pharmaceutical patterns or exist in the database for similar medicines.
**Validates: Requirements 3.1, 3.2**

### Property 4: Suggestion Ranking by Confidence
*For any* set of suggested salts, salts with HIGH confidence should appear before MEDIUM, which should appear before LOW.
**Validates: Requirements 3.5**

### Property 5: Page Refresh After Medicine Addition
*For any* medicine successfully added via ingest modal, the parent page should refresh and display the new medicine in the list.
**Validates: Requirements 1.3, 1.5**

### Property 6: Composition Filter Handles Edge Cases
*For any* medicine with whitespace-only or empty composition, the filter should treat it as "no composition".
**Validates: Requirements 2.4**

### Property 7: API Filter Consistency
*For any* filter request with hasComposition parameter, the API should return consistent results across multiple calls with identical parameters.
**Validates: Requirements 5.1, 5.2**

## Error Handling

### Frontend Error Handling

1. **Ingest Modal Errors**:
   - Display validation errors inline
   - Show OCR failures gracefully
   - Allow manual entry as fallback
   - Prevent submission with invalid data

2. **Salt Suggestion Errors**:
   - If suggestion service fails, show manual entry option
   - Log errors for debugging
   - Gracefully degrade to manual entry

3. **Filter Errors**:
   - Show "No medicines found" only when truly empty
   - Display error message if API fails
   - Retry mechanism for transient failures

### Backend Error Handling

1. **API Validation**:
   - Validate storeId on all requests
   - Check composition data format
   - Handle null/undefined gracefully

2. **Database Queries**:
   - Use proper null checks in filters
   - Handle missing relationships
   - Log query errors

## Testing Strategy

### Unit Tests

- Test SaltSuggestionService suggestion logic
- Test filter logic for composition status
- Test IngestModal callback handling
- Test SaltSuggestions component rendering
- Test API response parsing

### Property-Based Tests

- **Property 1**: Generate random medicine data, verify modal produces same result
- **Property 2**: Generate medicines with/without composition, verify filter accuracy
- **Property 3**: Generate medicine names, verify suggestions are relevant
- **Property 4**: Generate suggestion lists, verify confidence ordering
- **Property 5**: Generate ingest submissions, verify page refresh
- **Property 6**: Generate edge case compositions, verify filter handling
- **Property 7**: Generate filter requests, verify API consistency

### Integration Tests

- Test full ingest flow from modal open to page refresh
- Test salt suggestion workflow end-to-end
- Test maintenance page filtering and editing
- Test API endpoints with various filter combinations

## Implementation Notes

1. **Reuse Existing Code**: The ingest page logic remains unchanged; we wrap it in a modal component
2. **Backward Compatibility**: Standalone ingest page continues to work
3. **Database Learning**: Salt suggestions improve over time as users make choices
4. **Performance**: Cache suggestion results to avoid repeated API calls
5. **Mobile Friendly**: Ensure modal works well on mobile devices
