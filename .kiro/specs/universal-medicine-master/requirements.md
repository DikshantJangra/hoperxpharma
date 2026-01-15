# Requirements Document

## Introduction

This document defines the requirements for a Universal Medicine Master Database - a single source of truth for medicine data across the entire pharmacy platform. The system will replace the current fragmented approach where medicine data exists in multiple forms (CSV files, store-level databases, scan enrollments) with a unified, scalable, and cost-efficient architecture.

The goal is to build a foundational data platform that acts as the canonical knowledge backbone for all medicine-related operations, enabling fast search across 3+ lakh medicines while maintaining cost efficiency and supporting organic growth through pharmacy contributions.

## Glossary

- **Medicine_Master**: The global, canonical database containing universal medicine information shared across all stores
- **Store_Overlay**: Store-specific customizations (MRP, discounts, stock) that reference the global master without duplicating core data
- **Salt**: The active pharmaceutical ingredient(s) in a medicine (e.g., Paracetamol, Amoxicillin)
- **Composition**: The complete salt/strength combination (e.g., "Paracetamol 500mg + Caffeine 65mg")
- **Search_Engine**: The fast lookup system providing sub-100ms search across the medicine catalog
- **Ingestion_Pipeline**: The system for adding new medicines to the master database with validation
- **Canonical_ID**: A globally unique identifier for each medicine in the master database
- **Crowdsourced_Entry**: A medicine added by a pharmacy that becomes available to all stores after validation

## Requirements

### Requirement 1: Global Medicine Master Data Model

**User Story:** As a platform architect, I want a single canonical medicine master database, so that all stores reference the same authoritative medicine data without duplication.

#### Acceptance Criteria

1. THE Medicine_Master SHALL store universal medicine attributes including: canonical_id, name, generic_name, salt_composition, strength, dosage_form, manufacturer, pack_size, HSN_code, default_GST_rate, schedule_type, and requires_prescription flag
2. THE Medicine_Master SHALL assign a globally unique canonical_id to each medicine entry
3. THE Medicine_Master SHALL NOT store store-specific data such as MRP, custom discounts, or stock levels
4. WHEN a medicine is queried, THE Medicine_Master SHALL return consistent data regardless of which store initiates the query
5. THE Medicine_Master SHALL support multiple name variants (brand names, aliases) linked to the same canonical entry
6. THE Medicine_Master SHALL maintain referential integrity with the Salt table for composition data

### Requirement 2: Store-Level Overlay System

**User Story:** As a pharmacy owner, I want to customize medicine pricing and track my inventory, so that I can manage my store-specific business rules while using the global medicine catalog.

#### Acceptance Criteria

1. THE Store_Overlay SHALL reference medicines by canonical_id from the Medicine_Master
2. THE Store_Overlay SHALL allow stores to set custom MRP, purchase_price, and discount_percentage per medicine
3. THE Store_Overlay SHALL NOT duplicate core medicine attributes (name, composition, manufacturer) from the master
4. WHEN a store queries a medicine, THE System SHALL merge global master data with store-specific overlay data
5. IF a store has no overlay for a medicine, THEN THE System SHALL return only the global master data with null store-specific fields
6. THE Store_Overlay SHALL support batch-level tracking with store-specific batch numbers, expiry dates, and quantities
7. THE Store_Overlay SHALL allow stores to attach internal QR codes and barcodes linked to their inventory

### Requirement 3: High-Performance Search System

**User Story:** As a pharmacist, I want to search medicines instantly by name, composition, or manufacturer, so that I can quickly find products during billing and ordering.

#### Acceptance Criteria

1. THE Search_Engine SHALL return results within 100 milliseconds for queries against 3+ lakh medicine records
2. THE Search_Engine SHALL support fuzzy matching with typo tolerance up to 2 character errors
3. THE Search_Engine SHALL support prefix-based autocomplete starting from 2 characters
4. THE Search_Engine SHALL rank results by relevance with configurable boost factors for name, composition, and manufacturer fields
5. WHEN searching, THE Search_Engine SHALL filter out discontinued medicines by default
6. THE Search_Engine SHALL support search by salt/composition to find all medicines containing a specific active ingredient
7. THE Search_Engine SHALL maintain a search index that syncs with the Medicine_Master within 5 minutes of updates

### Requirement 4: Medicine Ingestion Pipeline

**User Story:** As a pharmacy, I want to add new medicines that aren't in the master database, so that the platform grows organically and benefits all users.

#### Acceptance Criteria

1. WHEN a pharmacy adds a new medicine not in the master, THE Ingestion_Pipeline SHALL create a pending entry for validation
2. THE Ingestion_Pipeline SHALL extract medicine attributes from OCR scans, manual entry, or barcode lookups
3. THE Ingestion_Pipeline SHALL perform de-duplication checks against existing entries using name similarity, composition matching, and manufacturer comparison
4. IF a potential duplicate is detected, THEN THE Ingestion_Pipeline SHALL flag the entry for manual review instead of auto-creating
5. THE Ingestion_Pipeline SHALL assign a confidence score (0-100) to each ingested medicine based on data completeness and source reliability
6. WHEN a medicine reaches confidence score >= 80 and has been used by 3+ stores, THE Ingestion_Pipeline SHALL promote it to verified status
7. THE Ingestion_Pipeline SHALL maintain an audit trail of all ingestion events including source, timestamp, and validation status

### Requirement 5: Data Migration from CSV

**User Story:** As a platform operator, I want to migrate existing CSV medicine data to the new master database, so that users experience no disruption during the transition.

#### Acceptance Criteria

1. THE Migration_System SHALL import all records from the existing 2.5 lakh medicine CSV file
2. THE Migration_System SHALL normalize inconsistent data formats (name casing, strength units, pack size formats)
3. THE Migration_System SHALL de-duplicate entries with matching name + composition + manufacturer + pack_size
4. THE Migration_System SHALL map existing medicine IDs to new canonical_ids with a lookup table for backward compatibility
5. WHEN migration completes, THE System SHALL support both old IDs and new canonical_ids for a transition period of 6 months
6. THE Migration_System SHALL generate a migration report showing: records imported, duplicates merged, errors encountered, and data quality issues

### Requirement 6: Cost-Optimized Storage Architecture

**User Story:** As a platform architect, I want the medicine database to be cost-efficient at scale, so that storing 3+ lakh medicines doesn't become prohibitively expensive.

#### Acceptance Criteria

1. THE System SHALL separate hot data (frequently accessed) from cold data (rarely accessed) using tiered storage
2. THE System SHALL use a dedicated search index for read-heavy operations instead of querying the primary database
3. THE System SHALL cache frequently searched medicines with a TTL-based invalidation strategy
4. THE System SHALL compress medicine data where applicable without impacting query performance
5. THE System SHALL support read replicas for search operations to reduce load on the primary database
6. WHEN storage costs are calculated, THE System SHALL target less than $50/month for storing 5 lakh medicine records

### Requirement 7: Image and Media Management

**User Story:** As a pharmacy, I want to attach product images to medicines, so that staff can visually verify products during dispensing.

#### Acceptance Criteria

1. THE Media_System SHALL support global images (shared across all stores) and store-specific images
2. THE Media_System SHALL store images in object storage (S3-compatible) with CDN delivery
3. THE Media_System SHALL deduplicate identical images using content-hash comparison
4. WHEN a store uploads an image for a medicine that has no global image, THE System SHALL offer to promote it as the global image
5. THE Media_System SHALL support multiple images per medicine (front, back, strip, box)
6. THE Media_System SHALL compress images to web-optimized formats while preserving readability
7. IF storage costs exceed thresholds, THEN THE Media_System SHALL archive older store-specific images to cold storage

### Requirement 8: Data Governance and Versioning

**User Story:** As a platform administrator, I want to track changes to medicine data and maintain data quality, so that the master database remains trustworthy.

#### Acceptance Criteria

1. THE Governance_System SHALL maintain version history for all medicine master records
2. WHEN a medicine record is updated, THE Governance_System SHALL create a new version while preserving the previous version
3. THE Governance_System SHALL require approval for changes to verified medicines from authorized users
4. THE Governance_System SHALL support rollback to previous versions if errors are discovered
5. THE Governance_System SHALL flag medicines with incomplete data (missing composition, manufacturer, or HSN code)
6. THE Governance_System SHALL generate data quality reports showing completeness scores across the catalog
7. IF a medicine is marked as discontinued by the manufacturer, THEN THE Governance_System SHALL soft-delete it while preserving historical references

### Requirement 9: API and Integration Layer

**User Story:** As a developer, I want well-defined APIs to interact with the medicine master, so that all platform components use consistent data access patterns.

#### Acceptance Criteria

1. THE API_Layer SHALL expose RESTful endpoints for medicine CRUD operations
2. THE API_Layer SHALL support bulk operations for importing/exporting medicine data
3. THE API_Layer SHALL implement rate limiting to prevent abuse (1000 requests/minute per store)
4. THE API_Layer SHALL return consistent response formats with proper error codes and messages
5. WHEN a medicine is created or updated, THE API_Layer SHALL publish events for downstream consumers
6. THE API_Layer SHALL support filtering, pagination, and sorting for list operations
7. THE API_Layer SHALL validate all input data against the medicine schema before persistence

### Requirement 10: Serialization and Data Export

**User Story:** As a pharmacy owner, I want to export medicine data for offline use or backup, so that I can operate even without internet connectivity.

#### Acceptance Criteria

1. THE Export_System SHALL serialize medicine data to JSON format for offline consumption
2. THE Export_System SHALL support incremental exports (only changed records since last export)
3. THE Export_System SHALL generate compact export files optimized for mobile bandwidth
4. WHEN exporting, THE Pretty_Printer SHALL format medicine data into valid, human-readable JSON
5. FOR ALL valid medicine records, parsing then printing then parsing SHALL produce an equivalent object (round-trip property)
6. THE Export_System SHALL support store-specific exports that merge master data with store overlays
