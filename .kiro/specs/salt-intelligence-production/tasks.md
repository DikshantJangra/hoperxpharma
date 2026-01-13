# Implementation Plan: Salt Intelligence Production System

## Overview

This implementation plan transforms the existing Salt Intelligence prototype into a production-grade system through incremental, testable steps. Each task builds on previous work, with checkpoints to ensure quality and gather feedback.

## Tasks

- [x] 1. Database Schema Enhancements
  - Add ingestionStatus, ocrMetadata, stripImageUrl, confirmedBy, confirmedAt fields to Drug model
  - Create SaltMappingAudit model for change tracking
  - Add database indexes for performance optimization
  - Create migration script for existing data
  - _Requirements: 1.5, 9.1, 9.2, 9.3_

- [x] 1.1 Write property test for ingestion status transitions
  - **Property 15: SALT_PENDING Default for Unmapped Imports**
  - **Validates: Requirements 7.4**

- [x] 2. Enhanced Salt Service and Repository
  - [x] 2.1 Implement salt search with alias matching
    - Add searchSalts method supporting name and alias queries
    - Implement case-insensitive matching
    - Add pagination support
    - _Requirements: 3.3, 4.3_

  - [x] 2.2 Write property test for salt name matching
    - **Property 3: Salt Name Matching Against Master**
    - **Validates: Requirements 3.3, 4.3**

  - [x] 2.3 Implement salt deduplication logic
    - Add findByNameOrAlias method
    - Check for duplicates before creation
    - Handle alias conflicts
    - _Requirements: 3.2_

  - [x] 2.4 Write property test for duplicate detection
    - **Property 3: Salt Name Matching Against Master** (covers deduplication)
    - **Validates: Requirements 3.2**

  - [x] 2.5 Add high-risk salt flagging
    - Implement markHighRisk method
    - Add filtering by highRisk flag
    - _Requirements: 3.5_

- [x] 3. Substitute Discovery Engine
  - [x] 3.1 Create SubstituteService with exact matching algorithm
    - Implement findSubstitutes method
    - Query DrugSaltLink for identical compositions
    - Filter by store inventory availability
    - _Requirements: 5.2_

  - [x] 3.2 Write property test for exact substitute matching
    - **Property 4: Substitute Discovery Exact Matching**
    - **Validates: Requirements 5.2**

  - [x] 3.3 Implement substitute ranking logic
    - Rank by stock availability > price > manufacturer
    - Add configurable ranking weights
    - _Requirements: 5.3_

  - [x] 3.4 Write property test for ranking consistency
    - **Property 5: Substitute Ranking Consistency**
    - **Validates: Requirements 5.3**

  - [x] 3.5 Add caching layer for substitute queries
    - Integrate Redis for result caching
    - Set 1-hour TTL for cached results
    - Implement cache invalidation on drug updates
    - _Requirements: 8.4_

  - [x] 3.6 Write property test for cache behavior
    - **Property 14: Cache Invalidation on Update**
    - **Property 20: Substitute Cache TTL**
    - **Validates: Requirements 8.4**

  - [x] 3.7 Add partial matching for fallback suggestions
    - Implement findPartialMatches method
    - Calculate match scores
    - Add clear warnings for partial matches
    - _Requirements: 5.4_

- [x] 4. Checkpoint - Test substitute engine with sample data
  - Create test dataset with 100+ medicines
  - Verify exact matching works correctly
  - Verify ranking is consistent
  - Verify cache invalidation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Enhanced Regex Matcher
  - [x] 5.1 Implement multiple regex patterns
    - Add parenthesized pattern: "Paracetamol (500mg)"
    - Add spaced pattern: "Paracetamol 500mg"
    - Add suffix pattern: "Paracetamol IP 500mg"
    - Try patterns in order until match found
    - _Requirements: 2.3_

  - [x] 5.2 Write property test for composition parsing
    - **Property 11: Regex Matcher Preserves Salt Order**
    - **Property 19: Salt Composition Round-Trip**
    - **Validates: Requirements 2.3, 2.4**

  - [x] 5.3 Implement salt name cleaning
    - Remove IP/BP/USP suffixes
    - Normalize whitespace
    - Handle special characters
    - _Requirements: 2.3_

  - [x] 5.4 Implement unit normalization
    - Convert all units to lowercase
    - Handle common variations (MG → mg, Mg → mg)
    - _Requirements: 2.3_

  - [x] 5.5 Add confidence calculation logic
    - HIGH: name + strength + unit present
    - MEDIUM: name + partial strength/unit
    - LOW: name only or parsing failed
    - _Requirements: 2.5_

  - [x] 5.6 Write property test for confidence scoring
    - **Property 12: Confidence Score Threshold Flagging**
    - **Validates: Requirements 2.5**

- [x] 6. Enhanced OCR Service
  - [x] 6.1 Add image preprocessing
    - Convert to grayscale
    - Enhance contrast
    - Resize if too large
    - _Requirements: 2.2_

  - [x] 6.2 Implement keyword-based line filtering
    - Define composition keywords array
    - Filter OCR text to relevant lines only
    - Reduce processing by 80-90%
    - _Requirements: 2.2_

  - [x] 6.3 Add performance monitoring
    - Track processing time per image
    - Log slow operations (> 3 seconds)
    - Add timeout after 5 seconds
    - _Requirements: 1.3, 8.1_

  - [x] 6.4 Write property test for OCR performance
    - **Property 2: OCR Processing Performance Bound**
    - **Validates: Requirements 1.3, 8.1**

  - [x] 6.5 Implement worker pool for parallel processing
    - Create reusable Tesseract worker instances
    - Pool size: 2 workers
    - Reuse workers to avoid re-initialization
    - _Requirements: 1.3_

- [x] 7. Validation Service
  - [x] 7.1 Implement salt mapping validation
    - Validate at least one salt present
    - Check for duplicate salts
    - Validate strength/unit pairing
    - _Requirements: 4.6, 12.1, 12.2, 12.4_

  - [x] 7.2 Write property tests for validation rules
    - **Property 1: Salt Mapping Activation Requires At Least One Salt**
    - **Property 6: Strength Value Requires Unit**
    - **Property 7: Duplicate Salt Detection**
    - **Validates: Requirements 4.6, 12.1, 12.2, 12.4**

  - [x] 7.3 Add strength value range validation
    - Warn if value ≤ 0 or > 10000
    - Allow submission with warning
    - Log unusual values for review
    - _Requirements: 12.5_

  - [x] 7.4 Write property test for strength warnings
    - **Property 16: Unrealistic Strength Value Warning**
    - **Validates: Requirements 12.5**

  - [x] 7.5 Implement image validation
    - Check file size (< 5MB)
    - Check dimensions (min 800x600)
    - Validate file format (jpg, png, webp)
    - _Requirements: 2.1_

  - [x] 7.6 Write property test for image validation
    - **Property 2: OCR Processing Performance Bound** (includes validation)
    - **Validates: Requirements 2.1**

- [x] 8. Checkpoint - Validate all core services
  - Test regex matcher with 50+ composition strings
  - Test OCR service with 20+ strip images
  - Test validation with edge cases
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Audit Service
  - [x] 9.1 Create SaltMappingAudit repository
    - Implement createAuditLog method
    - Add query methods with filtering
    - Support pagination for large result sets
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 9.2 Integrate audit logging into drug service
    - Log on salt mapping creation
    - Log on salt mapping updates
    - Log on bulk corrections
    - Capture old and new values
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 9.3 Write property test for audit completeness
    - **Property 8: Comprehensive Audit Logging**
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [x] 9.4 Add audit log export functionality
    - Implement CSV export
    - Include all relevant fields
    - Support date range filtering
    - _Requirements: 9.6_

- [x] 10. Enhanced Drug Service
  - [x] 10.1 Update createDrug to set default ingestion status
    - Set SALT_PENDING if no salt links provided
    - Set ACTIVE if salt links provided and validated
    - _Requirements: 7.4_

  - [x] 10.2 Implement activateMedicine method
    - Validate salt mappings
    - Update ingestion status to ACTIVE
    - Record confirmedBy and confirmedAt
    - Trigger audit log
    - Invalidate substitute cache
    - _Requirements: 1.5, 4.7_

  - [x] 10.3 Write property test for activation logic
    - **Property 1: Salt Mapping Activation Requires At Least One Salt**
    - **Validates: Requirements 1.5, 4.7**

  - [x] 10.4 Enhance import logic with auto-mapping
    - Parse genericName using RegexMatcher
    - Attempt auto-mapping to Salt Master
    - Set status based on confidence
    - _Requirements: 13.2, 13.3, 13.4_

  - [x] 10.5 Write property test for import status assignment
    - **Property 9: Import Status Assignment Based on Confidence**
    - **Validates: Requirements 13.3, 13.4**

  - [x] 10.6 Add bulk update method with batching
    - Process updates in batches of 100
    - Track progress and errors
    - Return summary report
    - _Requirements: 6.4, 8.5_

  - [x] 10.7 Write property test for bulk batching
    - **Property 13: Bulk Update Batching**
    - **Validates: Requirements 8.5**

- [x] 11. Checkpoint - Test enhanced drug service
  - Test activation with various salt configurations
  - Test import with 500+ records
  - Test bulk updates with 200+ medicines
  - Verify audit logs are created correctly
  - Ensure all tests pass, ask the user if questions arise.

- [-] 12. Ingestion Interface (Frontend)
  - [x] 12.1 Create enhanced ingestion page layout
    - Implement split-screen design (image left, form right)
    - Add image upload with drag-and-drop
    - Add camera capture button for mobile
    - Make responsive (stack vertically on mobile)
    - _Requirements: 1.1, 1.2, 4.1, 11.1, 11.5_

  - [x] 12.2 Write property test for mobile layout
    - **Property 18: Mobile Responsive Layout Stacking**
    - **Validates: Requirements 11.5**

  - [x] 12.3 Integrate OCR service with UI
    - Show processing indicator during OCR
    - Display extracted salts with confidence badges
    - Handle OCR errors gracefully
    - _Requirements: 1.3, 1.4, 1.6_

  - [x] 12.4 Implement salt editing interface
    - Editable salt rows with autocomplete
    - Add/remove salt buttons
    - Inline validation feedback
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 12.5 Add confirmation and activation flow
    - "Confirm & Activate" button
    - Validation before submission
    - Success/error feedback
    - Navigate to inventory on success
    - _Requirements: 1.5, 4.6, 4.7_

  - [x] 12.6 Add mobile camera capture
    - Implement camera API integration
    - Add crop guide overlay
    - Allow retake or proceed
    - _Requirements: 11.1, 11.2, 11.3_

- [-] 13. Bulk Correction Tool (Frontend)
  - [x] 13.1 Create bulk correction page
    - Implement filterable table layout
    - Add filters: status, salt, manufacturer, search
    - Show medicine name, composition, status in rows
    - _Requirements: 6.1, 6.2_

  - [x] 13.2 Implement inline editing
    - Click to edit composition
    - Autocomplete for salt names
    - Same validation as single-medicine editing
    - _Requirements: 6.3_

  - [x] 13.3 Add batch save functionality
    - Collect all pending changes
    - Show confirmation dialog with change count
    - Display progress during save
    - Show success/error summary
    - _Requirements: 6.4, 6.5_

  - [x] 13.4 Add priority highlighting
    - Highlight medicines pending > 7 days
    - Sort SALT_PENDING to top
    - Show days pending badge
    - _Requirements: 6.6_

- [x] 14. Dashboard Widget
  - [x] 14.1 Create SaltIntelligenceWidget component
    - Display unmapped medicine count
    - Show color-coded status (green/yellow/red)
    - Display oldest pending medicine
    - _Requirements: 7.1, 7.2_

  - [x] 14.2 Implement widget click navigation
    - Navigate to bulk correction tool
    - Apply SALT_PENDING filter automatically
    - _Requirements: 7.3_

  - [x] 14.3 Add real-time updates
    - Refresh count every 5 minutes
    - Update on medicine creation/activation
    - _Requirements: 7.1_

  - [x] 14.4 Integrate widget into main dashboard
    - Add to dashboard layout
    - Position prominently
    - _Requirements: 7.1_

- [x] 15. Checkpoint - Test all UI components
  - Test ingestion flow end-to-end
  - Test bulk correction with 50+ medicines
  - Test dashboard widget updates
  - Test mobile responsiveness
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. POS Integration
  - [x] 16.1 Add substitute search to POS
    - Implement "Find Substitutes" button on medicine detail
    - Show substitute modal with details
    - Allow one-click replacement
    - _Requirements: 5.1, 5.5, 5.6_

  - [x] 16.2 Implement automatic substitute suggestion
    - Check stock when adding medicine to sale
    - Trigger substitute search if out of stock
    - Show notification banner with substitute count
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 16.3 Write property test for automatic substitute search
    - **Property 10: Automatic Substitute Search on Out-of-Stock**
    - **Validates: Requirements 14.2**

  - [x] 16.4 Add substitute selection flow
    - Display substitute modal with ranking
    - Show stock, price, manufacturer
    - Replace item in sale on selection
    - Update pricing automatically
    - _Requirements: 14.4, 14.5_

  - [x] 16.5 Handle no substitutes case
    - Show "No alternatives found" message
    - Suggest ordering from supplier
    - Allow proceeding without substitute
    - _Requirements: 14.6_

- [x] 17. Entry Point Improvements
  - [x] 17.1 Add prominent "Add New Medicine" button
    - Place in inventory section top navigation
    - Make visually prominent
    - _Requirements: 10.1_

  - [x] 17.2 Create medicine addition modal
    - Show three options: Scan Strip, Manual Entry, Bulk Import
    - Clear descriptions for each option
    - Navigate to appropriate interface
    - _Requirements: 10.2_

  - [x] 17.3 Add inline "Quick Add" button
    - Place in inventory list view
    - Open quick add modal
    - _Requirements: 10.3_

  - [x] 17.4 Add SALT_PENDING visual indicators
    - Orange badge in inventory list
    - Tooltip on hover
    - Click to navigate to correction
    - _Requirements: 10.4, 10.5_

  - [x] 17.5 Create getting started guide
    - Write documentation for salt intelligence
    - Add to help section
    - Include screenshots and examples
    - _Requirements: 10.6_

- [x] 18. Analytics Dashboard
  - [x] 18.1 Create analytics service
    - Calculate ACTIVE percentage
    - Find top 20 salts by medicine count
    - Track substitute usage in sales
    - Calculate confidence score distribution
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [x] 18.2 Write property test for percentage calculation
    - **Property 17: Analytics Percentage Calculation**
    - **Validates: Requirements 15.1**

  - [x] 18.3 Create analytics dashboard page
    - Display all metrics with charts
    - Show weekly trends
    - Add date range filters
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 18.4 Add export functionality
    - Implement PDF export
    - Implement Excel export
    - Include all metrics and charts
    - _Requirements: 15.6_

- [x] 19. Performance Optimization
  - [x] 19.1 Add database indexes
    - Index on Drug(storeId, ingestionStatus)
    - Index on DrugSaltLink(saltId, strengthValue, strengthUnit)
    - Index on InventoryBatch(drugId, storeId, quantityInStock)
    - _Requirements: 8.1, 8.3, 8.6_

  - [x] 19.2 Implement query optimization
    - Use raw SQL for complex substitute queries
    - Add query result caching
    - Optimize N+1 query problems
    - _Requirements: 8.1, 8.6_

  - [x] 19.3 Write property test for query performance
    - **Property 2: OCR Processing Performance Bound** (covers overall performance)
    - **Validates: Requirements 8.1, 8.6**

  - [x] 19.4 Add Redis caching layer
    - Cache substitute query results
    - Cache salt search results
    - Cache analytics calculations
    - _Requirements: 8.4_

- [x] 20. Final Integration and Testing
  - [x] 20.1 Run full integration test suite
    - Test complete ingestion workflow
    - Test bulk correction workflow
    - Test POS substitute discovery
    - Test analytics generation
    - _Requirements: All_

  - [x] 20.2 Performance testing
    - Load test with 10,000 medicines
    - Verify substitute queries < 200ms
    - Verify OCR processing < 5 seconds
    - Verify bulk updates handle 500+ records
    - _Requirements: 8.1, 8.5, 8.6_

  - [x] 20.3 User acceptance testing
    - Test with real pharmacists
    - Gather feedback on usability
    - Identify pain points
    - _Requirements: All_

  - [x] 20.4 Documentation and deployment
    - Update API documentation
    - Create user guide
    - Write deployment instructions
    - Prepare production migration plan
    - _Requirements: All_

- [x] 21. Final Checkpoint - Production Readiness
  - All property tests passing (20 properties)
  - All unit tests passing (> 80% coverage)
  - All integration tests passing
  - Performance benchmarks met
  - User acceptance complete
  - Documentation complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property-based tests are required for comprehensive quality
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Property tests validate universal correctness properties (20 total)
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: services → UI → integration
