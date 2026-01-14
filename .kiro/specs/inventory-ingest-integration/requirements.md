# Requirements Document

## Introduction

This feature integrates the medicine ingest functionality into the inventory management pages (stock and batches), replacing the "+ New SKU" button. It also fixes the salt mapping/maintenance page filtering issues and introduces an intelligent salt suggestion system to reduce manual data entry.

## Glossary

- **Ingest**: The process of adding a new medicine/drug to the inventory system by scanning or manually entering details
- **SKU**: Stock Keeping Unit - a unique identifier for each medicine product
- **Salt Mapping**: The process of associating active pharmaceutical ingredients (salts/compositions) with medicines
- **Maintenance Page**: The inventory maintenance interface where users manage salt compositions for medicines
- **Salt Intelligence**: An AI-powered system that suggests appropriate salts/compositions for medicines based on their names
- **Inventory_System**: The system managing stock, batches, and medicine data
- **Filter_Engine**: The component responsible for filtering medicines based on composition status
- **Suggestion_Service**: The intelligent service that recommends salts for medicines

## Requirements

### Requirement 1: Integrate Ingest Functionality into Inventory Pages

**User Story:** As a pharmacy staff member, I want to add new medicines directly from the inventory stock and batches pages, so that I can quickly add products without navigating to a separate page.

#### Acceptance Criteria

1. WHEN a user clicks the "+ New SKU" button on the inventory stock page, THEN THE Inventory_System SHALL open the ingest interface inline or as a modal
2. WHEN a user clicks the "+ New SKU" button on the batches page, THEN THE Inventory_System SHALL open the ingest interface inline or as a modal
3. WHEN a user completes the ingest process, THEN THE Inventory_System SHALL add the medicine to the database and refresh the current page view
4. WHEN the ingest interface is opened from inventory pages, THEN THE Inventory_System SHALL maintain the same functionality as the standalone ingest page
5. WHEN a medicine is successfully added via ingest, THEN THE Inventory_System SHALL display a success notification and show the new medicine in the list

### Requirement 2: Fix Salt Mapping Filter Issues

**User Story:** As a pharmacy manager, I want to see all medicines that lack composition data on the maintenance page, so that I can systematically add missing salt information.

#### Acceptance Criteria

1. WHEN the maintenance page loads with "No composition" filter active, THEN THE Filter_Engine SHALL return all medicines where composition is null, empty, or undefined
2. WHEN medicines exist with missing composition data, THEN THE Inventory_System SHALL display them in the maintenance page list
3. WHEN a user applies the "No composition" filter, THEN THE Filter_Engine SHALL correctly identify medicines without salt data
4. WHEN the backend API receives a filter request for medicines without composition, THEN THE Filter_Engine SHALL query the database using appropriate null/empty checks
5. WHEN displaying medicine cards on the maintenance page, THEN THE Inventory_System SHALL show "No composition" for medicines lacking salt data

### Requirement 3: Intelligent Salt Suggestion System

**User Story:** As a pharmacy staff member, I want the system to suggest appropriate salts for a medicine based on its name, so that I don't need to scan or manually research composition data every time.

#### Acceptance Criteria

1. WHEN a user selects a medicine without composition data, THEN THE Suggestion_Service SHALL analyze the medicine name and suggest likely salts
2. WHEN salt suggestions are generated, THEN THE Suggestion_Service SHALL display them as selectable options for the user
3. WHEN a user accepts a suggested salt, THEN THE Inventory_System SHALL update the medicine's composition with the selected salt
4. WHEN the medicine name contains common pharmaceutical patterns, THEN THE Suggestion_Service SHALL extract and suggest the active ingredients
5. WHEN multiple salt suggestions are available, THEN THE Suggestion_Service SHALL rank them by confidence and display the most likely options first
6. WHEN no confident suggestions can be made, THEN THE Suggestion_Service SHALL allow manual salt entry as a fallback
7. WHEN a user adds a salt manually for a medicine, THEN THE Inventory_System SHALL store this mapping for future reference and learning

### Requirement 4: Unified Medicine Addition Workflow

**User Story:** As a pharmacy staff member, I want a consistent experience when adding medicines regardless of which page I'm on, so that I can work efficiently without learning multiple interfaces.

#### Acceptance Criteria

1. WHEN the ingest interface is accessed from any inventory page, THEN THE Inventory_System SHALL provide the same fields and validation
2. WHEN a medicine is added via ingest, THEN THE Inventory_System SHALL support both scanning and manual entry methods
3. WHEN the ingest process completes, THEN THE Inventory_System SHALL return the user to the page they started from
4. WHEN validation errors occur during ingest, THEN THE Inventory_System SHALL display clear error messages and allow correction
5. WHEN a duplicate medicine is detected during ingest, THEN THE Inventory_System SHALL warn the user and offer to update the existing record

### Requirement 5: Backend API Enhancement for Composition Filtering

**User Story:** As a system administrator, I want the backend API to correctly handle composition filter queries, so that the frontend can reliably display medicines needing salt data.

#### Acceptance Criteria

1. WHEN the API receives a request with hasComposition=false parameter, THEN THE Filter_Engine SHALL return medicines where composition is null or empty
2. WHEN the API receives a request with hasComposition=true parameter, THEN THE Filter_Engine SHALL return medicines where composition exists and is not empty
3. WHEN the API processes filter requests, THEN THE Filter_Engine SHALL handle edge cases like whitespace-only compositions
4. WHEN the API returns filtered results, THEN THE Filter_Engine SHALL include pagination support for large datasets
5. WHEN database queries are executed for composition filtering, THEN THE Filter_Engine SHALL use efficient indexing to maintain performance
