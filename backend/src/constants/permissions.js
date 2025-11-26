const PERMISSIONS = {
    // Patient Management
    PATIENT_CREATE: 'patient.create',
    PATIENT_READ: 'patient.read',
    PATIENT_UPDATE: 'patient.update',
    PATIENT_DELETE: 'patient.delete',
    PATIENT_EXPORT: 'patient.export',

    // Prescription Management
    PRESCRIPTION_CREATE: 'prescription.create',
    PRESCRIPTION_READ: 'prescription.read',
    PRESCRIPTION_UPDATE: 'prescription.update',
    PRESCRIPTION_DELETE: 'prescription.delete',
    PRESCRIPTION_FULFILL: 'prescription.fulfill',
    PRESCRIPTION_REFILL: 'prescription.refill',

    // Inventory Management
    INVENTORY_READ: 'inventory.read',
    INVENTORY_UPDATE: 'inventory.update',
    INVENTORY_ADJUST: 'inventory.adjust',
    INVENTORY_TRANSFER: 'inventory.transfer',

    // Sales & POS
    SALES_CREATE: 'sales.create',
    SALES_READ: 'sales.read',
    SALES_REFUND: 'sales.refund',
    SALES_VOID: 'sales.void',

    // Purchase Orders
    PO_CREATE: 'po.create',
    PO_READ: 'po.read',
    PO_UPDATE: 'po.update',
    PO_APPROVE: 'po.approve',
    PO_RECEIVE: 'po.receive',
    PO_CANCEL: 'po.cancel',

    // Expenses
    EXPENSE_CREATE: 'expense.create',
    EXPENSE_READ: 'expense.read',
    EXPENSE_APPROVE: 'expense.approve',
    EXPENSE_DELETE: 'expense.delete',

    // Reports
    REPORT_SALES: 'report.sales',
    REPORT_INVENTORY: 'report.inventory',
    REPORT_FINANCIAL: 'report.financial',
    REPORT_COMPLIANCE: 'report.compliance',

    // System Administration
    SYSTEM_USER_MANAGE: 'system.user.manage',
    SYSTEM_ROLE_MANAGE: 'system.role.manage',
    SYSTEM_PERMISSION_MANAGE: 'system.permission.manage',
    SYSTEM_STORE_MANAGE: 'system.store.manage',
    SYSTEM_SETTINGS: 'system.settings',
    SYSTEM_AUDIT_VIEW: 'system.audit.view',
};

const PERMISSION_CATEGORIES = {
    PATIENT: 'patient',
    PRESCRIPTION: 'prescription',
    INVENTORY: 'inventory',
    SALES: 'sales',
    PURCHASE: 'purchase',
    EXPENSE: 'expense',
    REPORT: 'report',
    SYSTEM: 'system',
};

// Permission metadata for seeding
const PERMISSION_METADATA = [
    // Patient Management
    { code: 'patient.create', name: 'Create Patient', description: 'Create new patient records', category: 'patient', resource: 'patient' },
    { code: 'patient.read', name: 'View Patients', description: 'View patient information', category: 'patient', resource: 'patient' },
    { code: 'patient.update', name: 'Update Patient', description: 'Edit patient information', category: 'patient', resource: 'patient' },
    { code: 'patient.delete', name: 'Delete Patient', description: 'Delete patient records', category: 'patient', resource: 'patient' },
    { code: 'patient.export', name: 'Export Patients', description: 'Export patient data', category: 'patient', resource: 'patient' },

    // Prescription Management
    { code: 'prescription.create', name: 'Create Prescription', description: 'Create new prescriptions', category: 'prescription', resource: 'prescription' },
    { code: 'prescription.read', name: 'View Prescriptions', description: 'View prescription details', category: 'prescription', resource: 'prescription' },
    { code: 'prescription.update', name: 'Update Prescription', description: 'Edit prescription information', category: 'prescription', resource: 'prescription' },
    { code: 'prescription.delete', name: 'Delete Prescription', description: 'Delete prescriptions', category: 'prescription', resource: 'prescription' },
    { code: 'prescription.fulfill', name: 'Fulfill Prescription', description: 'Dispense medications', category: 'prescription', resource: 'prescription' },
    { code: 'prescription.refill', name: 'Refill Prescription', description: 'Process prescription refills', category: 'prescription', resource: 'prescription' },

    // Inventory Management
    { code: 'inventory.read', name: 'View Inventory', description: 'View inventory levels and batches', category: 'inventory', resource: 'inventory' },
    { code: 'inventory.update', name: 'Update Inventory', description: 'Update inventory information', category: 'inventory', resource: 'inventory' },
    { code: 'inventory.adjust', name: 'Adjust Inventory', description: 'Make inventory adjustments', category: 'inventory', resource: 'inventory' },
    { code: 'inventory.transfer', name: 'Transfer Inventory', description: 'Transfer inventory between stores', category: 'inventory', resource: 'inventory' },

    // Sales & POS
    { code: 'sales.create', name: 'Create Sale', description: 'Process sales transactions', category: 'sales', resource: 'sale' },
    { code: 'sales.read', name: 'View Sales', description: 'View sales records', category: 'sales', resource: 'sale' },
    { code: 'sales.refund', name: 'Process Refund', description: 'Process customer refunds', category: 'sales', resource: 'sale' },
    { code: 'sales.void', name: 'Void Sale', description: 'Void sales transactions', category: 'sales', resource: 'sale' },

    // Purchase Orders
    { code: 'po.create', name: 'Create PO', description: 'Create purchase orders', category: 'purchase', resource: 'purchase_order' },
    { code: 'po.read', name: 'View POs', description: 'View purchase orders', category: 'purchase', resource: 'purchase_order' },
    { code: 'po.update', name: 'Update PO', description: 'Edit purchase orders', category: 'purchase', resource: 'purchase_order' },
    { code: 'po.approve', name: 'Approve PO', description: 'Approve purchase orders', category: 'purchase', resource: 'purchase_order' },
    { code: 'po.receive', name: 'Receive PO', description: 'Receive purchase order items', category: 'purchase', resource: 'purchase_order' },
    { code: 'po.cancel', name: 'Cancel PO', description: 'Cancel purchase orders', category: 'purchase', resource: 'purchase_order' },

    // Expenses
    { code: 'expense.create', name: 'Create Expense', description: 'Record new expenses', category: 'expense', resource: 'expense' },
    { code: 'expense.read', name: 'View Expenses', description: 'View expense records', category: 'expense', resource: 'expense' },
    { code: 'expense.approve', name: 'Approve Expense', description: 'Approve expense claims', category: 'expense', resource: 'expense' },
    { code: 'expense.delete', name: 'Delete Expense', description: 'Delete expense records', category: 'expense', resource: 'expense' },

    // Reports
    { code: 'report.sales', name: 'Sales Reports', description: 'View sales reports and analytics', category: 'report', resource: 'report' },
    { code: 'report.inventory', name: 'Inventory Reports', description: 'View inventory reports', category: 'report', resource: 'report' },
    { code: 'report.financial', name: 'Financial Reports', description: 'View financial reports', category: 'report', resource: 'report' },
    { code: 'report.compliance', name: 'Compliance Reports', description: 'View compliance reports', category: 'report', resource: 'report' },

    // System Administration
    { code: 'system.user.manage', name: 'Manage Users', description: 'Create, edit, and delete users', category: 'system', resource: 'user' },
    { code: 'system.role.manage', name: 'Manage Roles', description: 'Create and manage roles and permissions', category: 'system', resource: 'role' },
    { code: 'system.permission.manage', name: 'Manage Permissions', description: 'Manage permission assignments', category: 'system', resource: 'permission' },
    { code: 'system.store.manage', name: 'Manage Stores', description: 'Manage store settings and configuration', category: 'system', resource: 'store' },
    { code: 'system.settings', name: 'System Settings', description: 'Access system settings', category: 'system', resource: 'settings' },
    { code: 'system.audit.view', name: 'View Audit Logs', description: 'View system audit logs', category: 'system', resource: 'audit' },
];

module.exports = {
    PERMISSIONS,
    PERMISSION_CATEGORIES,
    PERMISSION_METADATA,
};
