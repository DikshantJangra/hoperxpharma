# Requirements Document: Salt Intelligence Production System

## Introduction

This document specifies requirements for transforming the existing Salt Intelligence system from a prototype into a production-grade, high-scale platform for retail pharmacy operations. The system enables pharmacists to efficiently manage medicine salt compositions through assisted ingestion, intelligent matching, and substitute discovery while maintaining clinical accuracy through human confirmation.

## Glossary

- **Salt**: The active pharmaceutical ingredient (API) in a medicine (e.g., "Paracetamol", "Amoxicillin")
- **Salt_Master**: A global, deduplicated database of all pharmaceutical salts with aliases
- **Medicine**: A commercial drug product with brand name, manufacturer, and dosage form
- **Drug_Salt_Link**: The mapping between a medicine and its constituent salts with strengths
- **Ingestion_Status**: The lifecycle state of a medicine (DRAFT, SALT_PENDING, ACTIVE)
- **OCR_Service**: Optical Character Recognition service for extracting text from medicine strips
- **Regex_Matcher**: Pattern-based parser for extracting salt names and strengths from composition strings
- **Substitute**: An alternative medicine containing the same salt composition
- **Strip_Image**: Photograph of the back of a medicine strip or carton showing composition
- **Confidence_Score**: A measure (HIGH, MEDIUM, LOW) of how certain the system is about extracted data
- **Pharmacist**: The primary user who confirms salt compositions
- **POS**: Point of Sale system where medicines are sold
- **Bulk_Correction_Tool**: Interface for fixing salt mappings across multiple medicines simultaneously

## Requirements

### Requirement 1: Streamlined Medicine Ingestion Workflow

**User Story:** As a pharmacist, I want a fast and intuitive way to add new medicines with their salt compositions, so that I can quickly make them available for sale without typing everything manually.

#### Acceptance Criteria

1. WHEN a pharmacist navigates to add a new medicine, THE System SHALL display a dedicated ingestion interface with clear visual guidance
2. WHEN the ingestion interface loads, THE System SHALL provide prominent access to image upload, manual entry, and bulk import options
3. WHEN a pharmacist uploads a strip image, THE System SHALL process it within 3 seconds and display extracted salts
4. WHEN salt extraction completes, THE System SHALL pre-fill salt fields with detected values and confidence indicators
5. WHEN a pharmacist confirms the salt composition, THE System SHALL activate the medicine and make it immediately available at POS
6. WHEN the ingestion process encounters an error, THE System SHALL display a clear error message and preserve entered data

### Requirement 2: Intelligent Strip Image Processing

**User Story:** As a pharmacist, I want the system to automatically extract salt information from medicine strip photos, so that I can reduce manual typing and errors.

#### Acceptance Criteria

1. WHEN a pharmacist uploads an image, THE System SHALL validate that the image is readable (minimum resolution 800x600, file size under 5MB)
2. WHEN processing a strip image, THE OCR_Service SHALL focus on composition-related text regions using keyword detection
3. WHEN composition text is detected, THE Regex_Matcher SHALL parse salt names, strength values, and units
4. WHEN multiple salts are detected in a combination, THE System SHALL preserve their order and relationships
5. WHEN OCR confidence is below 60%, THE System SHALL flag the extraction as LOW confidence and require manual review
6. WHEN no salts are detected, THE System SHALL provide clear guidance to manually add salts or retake the photo

### Requirement 3: Salt Master Management

**User Story:** As a system administrator, I want a clean, deduplicated salt database with aliases, so that salt matching is fast and accurate across all medicines.

#### Acceptance Criteria

1. THE Salt_Master SHALL store each unique salt with a canonical name, aliases, and metadata
2. WHEN a new salt is added, THE System SHALL check for duplicates using name and alias matching
3. WHEN searching for salts, THE System SHALL match against both canonical names and aliases
4. WHEN a salt has multiple common names, THE System SHALL store them as aliases (e.g., "PCM", "Acetaminophen" for "Paracetamol")
5. THE System SHALL mark high-risk salts (e.g., controlled substances) with a boolean flag
6. WHEN displaying salts, THE System SHALL show the canonical name with aliases in parentheses

### Requirement 4: Human-Confirmed Salt Mapping

**User Story:** As a pharmacist, I want to review and confirm automatically detected salts before activating a medicine, so that I can ensure clinical accuracy.

#### Acceptance Criteria

1. WHEN reviewing detected salts, THE System SHALL display the uploaded strip image alongside editable salt fields
2. WHEN a salt field is pre-filled, THE System SHALL show a confidence badge (HIGH, MEDIUM, LOW)
3. WHEN a pharmacist edits a salt name, THE System SHALL provide autocomplete suggestions from Salt_Master
4. WHEN a pharmacist adds a new salt row, THE System SHALL allow manual entry of salt name, strength, and unit
5. WHEN a pharmacist removes a detected salt, THE System SHALL update the composition without requiring re-upload
6. WHEN confirming the composition, THE System SHALL require at least one salt to be present
7. WHEN the pharmacist clicks "Confirm & Activate", THE System SHALL create Drug_Salt_Link records and set ingestion status to ACTIVE

### Requirement 5: Substitute Discovery Engine

**User Story:** As a pharmacist, I want to quickly find substitute medicines with the same salt composition, so that I can offer alternatives when a specific brand is unavailable.

#### Acceptance Criteria

1. WHEN viewing a medicine detail page, THE System SHALL display a "Find Substitutes" button
2. WHEN searching for substitutes, THE System SHALL match medicines with identical salt composition (same salts, same strengths)
3. WHEN multiple substitutes exist, THE System SHALL rank them by availability, price, and manufacturer
4. WHEN no exact substitutes exist, THE System SHALL suggest partial matches (same salts, different strengths) with clear warnings
5. WHEN displaying substitutes, THE System SHALL show brand name, manufacturer, price, and stock availability
6. WHEN a substitute is selected at POS, THE System SHALL allow one-click replacement in the current sale

### Requirement 6: Bulk Salt Correction Tool

**User Story:** As a pharmacist, I want to fix incorrect salt mappings across multiple medicines at once, so that I can quickly correct systematic errors without editing each medicine individually.

#### Acceptance Criteria

1. WHEN accessing the bulk correction tool, THE System SHALL display all medicines filtered by ingestion status, salt, or manufacturer
2. WHEN viewing the bulk correction table, THE System SHALL show medicine name, current salt composition, and edit controls in a single row
3. WHEN editing a salt composition in the bulk tool, THE System SHALL provide the same autocomplete and validation as single-medicine editing
4. WHEN saving bulk changes, THE System SHALL update all Drug_Salt_Link records and recompute substitutes
5. WHEN bulk changes affect POS availability, THE System SHALL log the changes for audit purposes
6. WHEN filtering by SALT_PENDING status, THE System SHALL prioritize medicines that need immediate attention

### Requirement 7: Dashboard Integration and Alerts

**User Story:** As a pharmacist, I want to see unmapped medicines and salt-related alerts on my main dashboard, so that I can proactively maintain data quality.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE System SHALL display a "Salt Intelligence" widget showing unmapped medicine count
2. WHEN unmapped medicines exceed 10, THE System SHALL display a warning badge on the widget
3. WHEN clicking the widget, THE System SHALL navigate to the bulk correction tool with SALT_PENDING filter applied
4. WHEN a new medicine is added via import or API, THE System SHALL automatically set its status to SALT_PENDING if no salt mapping exists
5. WHEN daily operations begin, THE System SHALL send a notification if unmapped medicines exist
6. WHEN a medicine has been in SALT_PENDING status for more than 7 days, THE System SHALL escalate the alert

### Requirement 8: Performance and Scalability

**User Story:** As a system architect, I want the salt intelligence system to handle high transaction volumes without impacting POS performance, so that sales operations remain fast and reliable.

#### Acceptance Criteria

1. WHEN searching for substitutes at POS, THE System SHALL return results within 200ms for databases with up to 10,000 medicines
2. WHEN processing OCR on strip images, THE System SHALL use client-side processing to avoid server load
3. WHEN matching salt names, THE System SHALL use indexed database queries on Salt_Master
4. WHEN computing substitutes, THE System SHALL cache results for 1 hour to reduce repeated calculations
5. WHEN bulk updating salt mappings, THE System SHALL process updates in batches of 100 to prevent database locks
6. WHEN the Salt_Master grows beyond 5,000 salts, THE System SHALL maintain sub-100ms query performance

### Requirement 9: Data Integrity and Audit Trail

**User Story:** As a compliance officer, I want complete audit logs of all salt mapping changes, so that I can track data quality and accountability.

#### Acceptance Criteria

1. WHEN a pharmacist confirms a salt mapping, THE System SHALL log the user ID, timestamp, and detected vs confirmed values
2. WHEN a salt composition is edited, THE System SHALL create an audit record showing old and new values
3. WHEN bulk corrections are applied, THE System SHALL log each individual change with batch identifier
4. WHEN viewing audit logs, THE System SHALL allow filtering by medicine, salt, user, and date range
5. WHEN a medicine's salt mapping changes, THE System SHALL version the Drug_Salt_Link records
6. WHEN exporting audit data, THE System SHALL provide CSV format with all relevant fields

### Requirement 10: Entry Point Discoverability

**User Story:** As a new pharmacist, I want to easily find where to add new medicines and manage salt compositions, so that I can start using the system without extensive training.

#### Acceptance Criteria

1. WHEN viewing the inventory section, THE System SHALL display a prominent "Add New Medicine" button in the top navigation
2. WHEN clicking "Add New Medicine", THE System SHALL present three clear options: "Scan Strip", "Manual Entry", "Bulk Import"
3. WHEN in the main inventory list, THE System SHALL show an inline "Quick Add" button for rapid medicine creation
4. WHEN a medicine has SALT_PENDING status, THE System SHALL display a visual indicator (orange badge) in the inventory list
5. WHEN hovering over a SALT_PENDING medicine, THE System SHALL show a tooltip: "Click to complete salt mapping"
6. WHEN accessing help documentation, THE System SHALL provide a "Getting Started with Salt Intelligence" guide

### Requirement 11: Mobile-Responsive Strip Capture

**User Story:** As a pharmacist using a tablet or mobile device, I want to capture strip images directly from my device camera, so that I can add medicines without switching to a desktop computer.

#### Acceptance Criteria

1. WHEN accessing the ingestion interface on a mobile device, THE System SHALL provide a "Capture Photo" button that opens the device camera
2. WHEN capturing a photo, THE System SHALL display a crop guide overlay showing the optimal strip positioning
3. WHEN a photo is captured, THE System SHALL allow immediate retake or proceed to processing
4. WHEN processing on mobile, THE System SHALL show a progress indicator during OCR
5. WHEN the mobile screen is small, THE System SHALL stack the image and form vertically for better usability
6. WHEN network connectivity is poor, THE System SHALL process OCR locally and sync results when connection improves

### Requirement 12: Validation and Error Prevention

**User Story:** As a pharmacist, I want the system to prevent me from activating medicines with incomplete or invalid salt data, so that I don't create unusable records.

#### Acceptance Criteria

1. WHEN attempting to activate a medicine, THE System SHALL validate that at least one salt is mapped
2. WHEN a salt has a strength value, THE System SHALL require a strength unit (mg, ml, %, etc.)
3. WHEN a salt name doesn't match any entry in Salt_Master, THE System SHALL prompt to either add it or correct the spelling
4. WHEN duplicate salt entries are detected in a single medicine, THE System SHALL prevent activation and show an error
5. WHEN strength values are unrealistic (e.g., 0, negative, or > 10000), THE System SHALL display a warning
6. WHEN the dosage form doesn't match typical forms for the detected salts, THE System SHALL show a cautionary message

### Requirement 13: Import and Migration Support

**User Story:** As a system administrator, I want to import existing medicine data and automatically map salts, so that I can migrate from legacy systems without manual re-entry.

#### Acceptance Criteria

1. WHEN importing medicines via CSV, THE System SHALL accept columns for name, manufacturer, generic name, and form
2. WHEN a generic name is provided in import, THE Regex_Matcher SHALL attempt to parse and map salts automatically
3. WHEN auto-mapping succeeds with HIGH confidence, THE System SHALL set status to ACTIVE
4. WHEN auto-mapping has MEDIUM or LOW confidence, THE System SHALL set status to SALT_PENDING for review
5. WHEN import completes, THE System SHALL provide a summary report showing successful, pending, and failed records
6. WHEN viewing import results, THE System SHALL allow bulk review and correction of SALT_PENDING records

### Requirement 14: Substitute Notification at POS

**User Story:** As a pharmacist at the point of sale, I want to be notified when a prescribed medicine is out of stock but substitutes are available, so that I can offer alternatives to customers immediately.

#### Acceptance Criteria

1. WHEN adding a medicine to a sale, THE System SHALL check current stock levels
2. WHEN a medicine is out of stock, THE System SHALL automatically search for substitutes
3. WHEN substitutes are found, THE System SHALL display a notification banner with substitute count
4. WHEN clicking the notification, THE System SHALL show a modal with substitute details and "Replace" buttons
5. WHEN a substitute is selected, THE System SHALL replace the original item in the sale and update pricing
6. WHEN no substitutes are available, THE System SHALL display "No alternatives found" and suggest ordering

### Requirement 15: Salt Intelligence Analytics

**User Story:** As a pharmacy manager, I want to see analytics on salt mapping quality and substitute usage, so that I can measure system effectiveness and identify improvement areas.

#### Acceptance Criteria

1. WHEN viewing the analytics dashboard, THE System SHALL display the percentage of medicines with ACTIVE status
2. WHEN analyzing salt coverage, THE System SHALL show the top 20 most common salts and their medicine counts
3. WHEN reviewing substitute usage, THE System SHALL display how often substitutes are used in sales
4. WHEN examining data quality, THE System SHALL show the distribution of confidence scores across all medicines
5. WHEN tracking trends, THE System SHALL display weekly ingestion rates and time-to-activation metrics
6. WHEN exporting analytics, THE System SHALL provide downloadable reports in PDF and Excel formats
