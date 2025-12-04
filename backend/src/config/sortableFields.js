/**
 * Sortable Fields Configuration
 * Defines allowed sortable fields per resource to prevent SQL injection
 * and ensure only valid fields are used in ORDER BY clauses
 */

const SORTABLE_FIELDS = {
    // Patient Management
    patients: [
        'firstName',
        'lastName',
        'phoneNumber',
        'email',
        'dateOfBirth',
        'gender',
        'createdAt',
        'updatedAt',
    ],

    // Supplier Management
    suppliers: [
        'name',
        'category',
        'status',
        'gstin',
        'contactName',
        'phoneNumber',
        'city',
        'state',
        'createdAt',
        'updatedAt',
    ],

    // Drug/Medicine Catalog
    drugs: [
        'name',
        'genericName',
        'manufacturer',
        'form',
        'strength',
        'hsnCode',
        'gstRate',
        'schedule',
        'requiresPrescription',
        'createdAt',
        'updatedAt',
    ],

    // Purchase Orders
    purchaseOrders: [
        'poNumber',
        'status',
        'totalAmount',
        'expectedDeliveryDate',
        'createdAt',
        'updatedAt',
    ],

    // Inventory/Stock
    inventory: [
        'batchNumber',
        'expiryDate',
        'quantityInStock',
        'mrp',
        'purchasePrice',
        'createdAt',
        'updatedAt',
    ],

    // Sales/Invoices
    sales: [
        'invoiceNumber',
        'total',
        'subtotal',
        'taxAmount',
        'discountAmount',
        'paymentStatus',
        'createdAt',
        'updatedAt',
    ],

    // User Management
    users: [
        'firstName',
        'lastName',
        'email',
        'phoneNumber',
        'role',
        'status',
        'createdAt',
        'updatedAt',
    ],

    // RBAC - Roles
    roles: [
        'name',
        'category',
        'builtIn',
        'createdAt',
        'updatedAt',
    ],

    // RBAC - Permissions
    permissions: [
        'code',
        'name',
        'category',
        'resource',
        'createdAt',
    ],

    // Prescriptions
    prescriptions: [
        'prescriptionNumber',
        'status',
        'prescribedDate',
        'createdAt',
        'updatedAt',
    ],

    // GRN (Goods Receipt Notes)
    grns: [
        'grnNumber',
        'status',
        'receivedDate',
        'totalAmount',
        'createdAt',
        'updatedAt',
    ],

    // Stores
    stores: [
        'name',
        'licenseNumber',
        'city',
        'state',
        'status',
        'createdAt',
        'updatedAt',
    ],

    // Refills/Adherence
    refills: [
        'expectedRefillDate',
        'actualRefillDate',
        'adherenceRate',
        'createdAt',
    ],

    // Consents
    consents: [
        'type',
        'status',
        'grantedDate',
        'expiryDate',
        'createdAt',
    ],

    // Messages (WhatsApp)
    messages: [
        'direction',
        'status',
        'createdAt',
        'sentAt',
        'deliveredAt',
        'readAt',
    ],

    // Conversations
    conversations: [
        'lastMessageAt',
        'unreadCount',
        'createdAt',
        'updatedAt',
    ],
};

/**
 * Get sortable fields for a resource
 * @param {string} resource - Resource name
 * @returns {Array<string>} Array of sortable field names
 */
function getSortableFields(resource) {
    return SORTABLE_FIELDS[resource] || [];
}

/**
 * Check if a field is sortable for a resource
 * @param {string} resource - Resource name
 * @param {string} field - Field name to check
 * @returns {boolean} True if field is sortable
 */
function isSortable(resource, field) {
    const fields = SORTABLE_FIELDS[resource] || [];
    return fields.includes(field);
}

module.exports = {
    SORTABLE_FIELDS,
    getSortableFields,
    isSortable,
};
