# Implementation Plan: Inventory Ingest Integration

## Overview

This plan breaks down the feature into discrete implementation steps, starting with backend fixes, then frontend components, and finally integration into existing pages.

## Tasks

- [x] 1. Fix Backend API Composition Filtering
  - Update `/api/drugs/bulk` endpoint to properly filter medicines by composition status
  - Add `hasComposition` query parameter support
  - Fix null/empty composition checks in database queries
  - Test with medicines that have no saltLinks
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2_

- [ ]* 1.1 Write property test for composition filter accuracy
  - **Property 2: Filter Returns Medicines Without Composition**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ] 2. Create SaltSuggestionService
  - Implement salt suggestion logic based on medicine names
  - Extract common pharmaceutical patterns (e.g., "Crocin 500" → "Paracetamol 500mg")
  - Query database for similar medicines
  - Rank suggestions by confidence
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 2.1 Write property test for suggestion relevance
  - **Property 3: Salt Suggestions Are Relevant**
  - **Validates: Requirements 3.1, 3.2**

- [ ]* 2.2 Write property test for confidence ranking
  - **Property 4: Suggestion Ranking by Confidence**
  - **Validates: Requirements 3.5**

- [x] 3. Create SaltSuggestions Component
  - Build React component to display suggested salts
  - Show confidence badges for each suggestion
  - Allow user to select or manually enter salt
  - Integrate with SaltSuggestionService
  - _Requirements: 3.1, 3.2, 3.5, 3.6_

- [ ] 4. Create IngestModal Component
  - Wrap existing ingest page logic in a modal
  - Accept `isOpen`, `onClose`, `onSuccess` props
  - Maintain all existing ingest functionality
  - Handle success callback to refresh parent page
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [ ]* 4.1 Write property test for modal functionality preservation
  - **Property 1: Ingest Modal Preserves Functionality**
  - **Validates: Requirements 1.1, 1.2, 1.4**

- [x] 5. Create CompositionEditor Component
  - Build component for editing medicine composition
  - Integrate SaltSuggestions for recommendations
  - Allow manual salt entry
  - Show confidence indicators
  - _Requirements: 3.1, 3.2, 3.6_

- [x] 6. Update Maintenance Page
  - Add filter for medicines without composition
  - Integrate SaltSuggestions component
  - Allow inline editing with suggestions
  - Fix "No medicines found" issue
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

- [ ]* 6.1 Write property test for maintenance page filtering
  - **Property 2: Filter Returns Medicines Without Composition**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 7. Update Inventory Stock Page
  - Replace "+ New SKU" button with IngestModal trigger
  - Add modal state management
  - Refresh table after successful medicine addition
  - _Requirements: 1.1, 1.3, 1.5, 4.1_

- [ ]* 7.1 Write property test for page refresh after addition
  - **Property 5: Page Refresh After Medicine Addition**
  - **Validates: Requirements 1.3, 1.5**

- [x] 8. Update Batches Page
  - Replace "+ New SKU" button with IngestModal trigger
  - Add modal state management
  - Refresh table after successful medicine addition
  - _Requirements: 1.2, 1.3, 1.5, 4.1_

- [x] 9. Create Centralized Drugs API Module
  - Extract API calls into reusable functions
  - Handle error responses consistently
  - Add request/response logging
  - _Requirements: 1.4, 4.1_

- [x] 10. Checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Verify no console errors
  - _Requirements: All_

- [x] 11. Integration Testing
  - Test full ingest flow from stock page
  - Test full ingest flow from batches page
  - Test maintenance page filtering and suggestions
  - Test salt suggestion workflow
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1_

- [x] 12. Performance Optimization
  - Cache salt suggestions
  - Optimize database queries for filtering
  - Add pagination to maintenance page
  - _Requirements: 5.4, 5.5_

- [x] 13. Final checkpoint - Production readiness
  - Verify all features work end-to-end
  - Check error handling
  - Verify mobile responsiveness
  - Test with real data
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end workflows
