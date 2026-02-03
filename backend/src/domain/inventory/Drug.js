/**
 * Drug Entity
 * Represents a pharmaceutical product in the catalog
 */

const { Quantity, Unit } = require('../shared/valueObjects/Quantity');

class Drug {
    constructor(data) {
        this.id = data.id;
        this.storeId = data.storeId;

        // Identification
        this.name = data.name;
        this.genericName = data.genericName;
        this.manufacturer = data.manufacturer;
        this.rxcui = data.rxcui;

        // Physical characteristics
        this.strength = data.strength;
        this.form = data.form; // TABLET, CAPSULE, SYRUP, etc.
        this.defaultUnit = data.defaultUnit || Unit.TABLET;

        // Regulatory & Classification
        this.schedule = data.schedule; // H, H1, X, etc.
        this.requiresPrescription = data.requiresPrescription || false;
        this.hsnCode = data.hsnCode;
        this.gstRate = data.gstRate || 12;

        // Stock management
        this.lowStockThreshold = data.lowStockThreshold || 10;
        this.baseUnit = data.baseUnit || 'Tablet';
        this.displayUnit = data.displayUnit || data.form || 'Tablet';

        // Metadata
        this.description = data.description;
        this.isActive = data.isActive !== undefined ? data.isActive : true;

        // Extended fields for Ingestion & Master data
        this.saltLinks = data.saltLinks || [];
        this.ocrMetadata = data.ocrMetadata || null;
        this.stripImageUrl = data.stripImageUrl || null;

        // Inventory batches (when fetched with relations)
        this.inventory = data.inventory || [];

        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    static fromPrisma(prismaData) {
        return new Drug({
            id: prismaData.id,
            storeId: prismaData.storeId,
            name: prismaData.name,
            genericName: prismaData.genericName,
            manufacturer: prismaData.manufacturer,
            rxcui: prismaData.rxcui,
            strength: prismaData.strength,
            form: prismaData.form,
            defaultUnit: prismaData.defaultUnit,
            schedule: prismaData.schedule,
            requiresPrescription: prismaData.requiresPrescription,
            hsnCode: prismaData.hsnCode,
            gstRate: prismaData.gstRate,
            lowStockThreshold: prismaData.lowStockThreshold,
            description: prismaData.description,
            isActive: prismaData.isActive,
            baseUnit: prismaData.baseUnit,
            displayUnit: prismaData.displayUnit,
            saltLinks: prismaData.saltLinks,
            inventory: prismaData.inventory,
            ocrMetadata: prismaData.ocrMetadata,
            stripImageUrl: prismaData.stripImageUrl,
            createdAt: prismaData.createdAt,
            updatedAt: prismaData.updatedAt
        });
    }

    // ========== Business Logic Methods ==========

    /**
     * Check if drug is controlled substance
     */
    isControlledSubstance() {
        const controlledSchedules = ['H', 'H1', 'X'];
        return controlledSchedules.includes(this.schedule);
    }

    /**
     * Check if prescription is mandatory
     */
    needsPrescription() {
        return this.requiresPrescription || this.isControlledSubstance();
    }

    /**
     * Get full drug name with strength
     */
    getFullName() {
        return this.strength
            ? `${this.name} ${this.strength}`
            : this.name;
    }

    /**
     * Get display name with form
     */
    getDisplayName() {
        const parts = [this.name];
        if (this.strength) parts.push(this.strength);
        if (this.form) parts.push(`(${this.form})`);
        return parts.join(' ');
    }

    /**
     * Check if drug is similar to another (same active ingredient)
     */
    isSimilarTo(otherDrug) {
        if (!this.genericName || !otherDrug.genericName) {
            return false;
        }

        return (
            this.genericName.toLowerCase() === otherDrug.genericName.toLowerCase() &&
            this.strength === otherDrug.strength &&
            this.form === otherDrug.form
        );
    }

    /**
     * Validate drug data
     */
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Drug name is required');
        }

        if (!this.form) {
            errors.push('Drug form is required');
        }

        if (this.gstRate < 0 || this.gstRate > 28) {
            errors.push('GST rate must be between 0 and 28');
        }

        if (this.lowStockThreshold < 0) {
            errors.push('Low stock threshold cannot be negative');
        }

        if (errors.length > 0) {
            throw new Error(`Drug validation failed: ${errors.join(', ')}`);
        }
    }

    /**
     * Deactivate drug (soft delete)
     */
    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    /**
     * Reactivate drug
     */
    reactivate() {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    // ========== Data Mapping ==========

    toPrisma() {
        return {
            id: this.id,
            storeId: this.storeId,
            name: this.name,
            genericName: this.genericName,
            manufacturer: this.manufacturer,
            rxcui: this.rxcui,
            strength: this.strength,
            form: this.form,
            defaultUnit: this.defaultUnit,
            schedule: this.schedule,
            requiresPrescription: this.requiresPrescription,
            hsnCode: this.hsnCode,
            gstRate: this.gstRate,
            lowStockThreshold: this.lowStockThreshold,
            description: this.description,
            baseUnit: this.baseUnit,
            displayUnit: this.displayUnit,
            saltLinks: this.saltLinks,
            ocrMetadata: this.ocrMetadata,
            stripImageUrl: this.stripImageUrl
        };
    }

    toDTO() {
        return {
            id: this.id,
            storeId: this.storeId,
            name: this.name,
            genericName: this.genericName,
            manufacturer: this.manufacturer,
            fullName: this.getFullName(),
            displayName: this.getDisplayName(),
            strength: this.strength,
            form: this.form,
            defaultUnit: this.defaultUnit,
            schedule: this.schedule,
            requiresPrescription: this.requiresPrescription,
            isControlled: this.isControlledSubstance(),
            hsnCode: this.hsnCode,
            gstRate: this.gstRate,
            lowStockThreshold: this.lowStockThreshold,
            description: this.description,
            isActive: this.isActive,
            baseUnit: this.baseUnit,
            displayUnit: this.displayUnit,
            saltLinks: this.saltLinks,
            inventory: this.inventory,
            ocrMetadata: this.ocrMetadata,
            stripImageUrl: this.stripImageUrl,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    toJSON() {
        return this.toDTO();
    }
}

module.exports = Drug;
