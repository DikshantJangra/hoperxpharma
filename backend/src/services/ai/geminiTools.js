const inventoryRepository = require('../../repositories/inventoryRepository');
const drugRepository = require('../../repositories/drugRepository');
const purchaseOrderRepository = require('../../repositories/purchaseOrderRepository');
const supplierRepository = require('../../repositories/supplierRepository');
const saleRepository = require('../../repositories/saleRepository');

/**
 * Gemini Function Calling Tools for HopeRx Pharmacy
 * Each tool has a declaration (schema) and a handler (implementation)
 */

// ============================================================================
// TOOL DECLARATIONS (for Gemini API)
// ============================================================================

const toolDeclarations = [
    {
        name: 'check_inventory',
        description: 'Check inventory stock levels and batch details for a drug. Returns batch numbers, quantities, expiry dates, and MRP.',
        parameters: {
            type: 'object',
            properties: {
                drugName: {
                    type: 'string',
                    description: 'Name of the drug to check (e.g., "Paracetamol", "Azithromycin")',
                },
                storeId: {
                    type: 'string',
                    description: 'Store ID to check inventory for',
                },
            },
            required: ['drugName', 'storeId'],
        },
    },
    {
        name: 'get_drug_info',
        description: 'Get detailed information about a drug including generic name, manufacturer, form, strength, HSN code, and GST rate.',
        parameters: {
            type: 'object',
            properties: {
                drugName: {
                    type: 'string',
                    description: 'Name of the drug to get information about',
                },
            },
            required: ['drugName'],
        },
    },
    {
        name: 'create_draft_po',
        description: 'Create a draft purchase order for specified items. Returns the PO number and ID.',
        parameters: {
            type: 'object',
            properties: {
                storeId: {
                    type: 'string',
                    description: 'Store ID creating the PO',
                },
                supplierId: {
                    type: 'string',
                    description: 'Supplier ID to order from',
                },
                items: {
                    type: 'array',
                    description: 'Array of items to order',
                    items: {
                        type: 'object',
                        properties: {
                            drugId: { type: 'string' },
                            quantity: { type: 'number' },
                            unitPrice: { type: 'number' },
                        },
                    },
                },
            },
            required: ['storeId', 'supplierId', 'items'],
        },
    },
    {
        name: 'get_sales_trends',
        description: 'Get sales trends and analytics for drugs. Useful for forecasting and reorder recommendations.',
        parameters: {
            type: 'object',
            properties: {
                storeId: {
                    type: 'string',
                    description: 'Store ID to analyze',
                },
                drugId: {
                    type: 'string',
                    description: 'Optional drug ID to get specific trends',
                },
                daysBack: {
                    type: 'number',
                    description: 'Number of days to analyze (default: 30)',
                },
            },
            required: ['storeId'],
        },
    },
    {
        name: 'search_suppliers',
        description: 'Search for suppliers with their contact info, performance ratings, and pricing.',
        parameters: {
            type: 'object',
            properties: {
                searchTerm: {
                    type: 'string',
                    description: 'Search term for supplier name or drug',
                },
                storeId: {
                    type: 'string',
                    description: 'Store ID for context',
                },
            },
            required: ['storeId'],
        },
    },
    {
        name: 'get_low_stock_alerts',
        description: 'Get list of drugs that are running low on stock and need reordering.',
        parameters: {
            type: 'object',
            properties: {
                storeId: {
                    type: 'string',
                    description: 'Store ID to check',
                },
            },
            required: ['storeId'],
        },
    },
];

// ============================================================================
// TOOL HANDLERS (implementations)
// ============================================================================

const toolHandlers = {
    /**
     * Check inventory for a drug
     */
    async check_inventory({ drugName, storeId }) {
        try {
            // Search for the drug
            const drugs = await drugRepository.searchDrugs(drugName);

            if (!drugs || drugs.length === 0) {
                return {
                    success: false,
                    message: `No drug found matching "${drugName}". Please check the spelling or try a different name.`,
                };
            }

            const drug = drugs[0];

            // Get inventory batches for this drug
            const batches = await inventoryRepository.findBatchesForDispense(storeId, drug.id, 10000);

            if (!batches || batches.length === 0) {
                return {
                    success: true,
                    drugName: drug.name,
                    totalStock: 0,
                    batches: [],
                    message: `${drug.name} is currently out of stock.`,
                };
            }

            const totalStock = batches.reduce((sum, b) => sum + Number(b.baseUnitQuantity), 0);

            const batchDetails = batches.map(b => ({
                batchNumber: b.batchNumber,
                quantity: b.baseUnitQuantity,
                expiryDate: b.expiryDate,
                mrp: b.mrp,
                purchasePrice: b.purchasePrice,
            }));

            return {
                success: true,
                drugName: drug.name,
                genericName: drug.genericName,
                strength: drug.strength,
                form: drug.form,
                manufacturer: drug.manufacturer,
                totalStock,
                batchCount: batches.length,
                batches: batchDetails,
            };
        } catch (error) {
            return {
                success: false,
                message: `Error checking inventory: ${error.message}`,
            };
        }
    },

    /**
     * Get drug information
     */
    async get_drug_info({ drugName }) {
        try {
            const drugs = await drugRepository.searchDrugs(drugName);

            if (!drugs || drugs.length === 0) {
                return {
                    success: false,
                    message: `No drug found matching "${drugName}".`,
                };
            }

            const drug = drugs[0];

            return {
                success: true,
                id: drug.id,
                name: drug.name,
                genericName: drug.genericName,
                strength: drug.strength,
                form: drug.form,
                manufacturer: drug.manufacturer,
                schedule: drug.schedule,
                hsnCode: drug.hsnCode,
                gstRate: drug.gstRate,
                requiresPrescription: drug.requiresPrescription,
                description: drug.description,
            };
        } catch (error) {
            return {
                success: false,
                message: `Error fetching drug info: ${error.message}`,
            };
        }
    },

    /**
     * Create draft purchase order
     */
    async create_draft_po({ storeId, supplierId, items }) {
        try {
            // Validate supplier exists
            const supplier = await supplierRepository.findById(supplierId);

            if (!supplier) {
                return {
                    success: false,
                    message: `Supplier not found with ID: ${supplierId}`,
                };
            }

            // Calculate totals
            let subtotal = 0;
            const lineItems = items.map((item, index) => {
                const lineTotal = item.quantity * item.unitPrice;
                subtotal += lineTotal;

                return {
                    lineId: `line_${index + 1}`,
                    drugId: item.drugId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    gstRate: parseFloat(item.gstRate || item.gst_rate || item.gst || 5),
                    total: lineTotal,
                };
            });

            const gstAmount = subtotal * 0.12; // Simplified GST calculation
            const total = subtotal + gstAmount;

            // Create draft PO
            const po = await purchaseOrderRepository.create({
                storeId,
                supplierId,
                status: 'DRAFT',
                subtotal,
                gstAmount,
                total,
                items: lineItems,
            });

            return {
                success: true,
                poId: po.id,
                poNumber: po.poNumber,
                supplierName: supplier.name,
                itemCount: items.length,
                subtotal,
                gstAmount,
                total,
                message: `Draft PO ${po.poNumber} created successfully for ${supplier.name}.`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Error creating PO: ${error.message}`,
            };
        }
    },

    /**
     * Get sales trends
     */
    async get_sales_trends({ storeId, drugId, daysBack = 30 }) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);

            // This is a simplified implementation
            // In production, you'd have more sophisticated analytics
            const sales = await saleRepository.findByStore(storeId, {
                startDate,
                endDate: new Date(),
                drugId,
            });

            if (!sales || sales.length === 0) {
                return {
                    success: true,
                    message: `No sales data found for the last ${daysBack} days.`,
                    totalSales: 0,
                    averageDaily: 0,
                };
            }

            const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
            const totalUnits = sales.reduce((sum, sale) => {
                return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
            }, 0);

            return {
                success: true,
                period: `${daysBack} days`,
                totalSales: sales.length,
                totalRevenue,
                totalUnits,
                averageDaily: totalUnits / daysBack,
                averageRevenueDaily: totalRevenue / daysBack,
            };
        } catch (error) {
            return {
                success: false,
                message: `Error fetching sales trends: ${error.message}`,
            };
        }
    },

    /**
     * Search suppliers
     */
    async search_suppliers({ searchTerm = '', storeId }) {
        try {
            const suppliers = await supplierRepository.search(searchTerm);

            if (!suppliers || suppliers.length === 0) {
                return {
                    success: true,
                    suppliers: [],
                    message: 'No suppliers found matching your search.',
                };
            }

            const supplierList = suppliers.map(s => ({
                id: s.id,
                name: s.name,
                contactPerson: s.contactPerson,
                phoneNumber: s.phoneNumber,
                email: s.email,
                city: s.city,
                state: s.state,
                rating: s.rating,
                status: s.status,
            }));

            return {
                success: true,
                count: suppliers.length,
                suppliers: supplierList,
            };
        } catch (error) {
            return {
                success: false,
                message: `Error searching suppliers: ${error.message}`,
            };
        }
    },

    /**
     * Get low stock alerts
     */
    async get_low_stock_alerts({ storeId }) {
        try {
            const lowStockItems = await inventoryRepository.getLowStockItems(storeId);

            if (!lowStockItems || lowStockItems.length === 0) {
                return {
                    success: true,
                    count: 0,
                    items: [],
                    message: 'All items are adequately stocked.',
                };
            }

            const items = lowStockItems.map(item => ({
                drugId: item.drugId,
                drugName: item.name,
                currentStock: Number(item.totalStock),
                threshold: item.lowStockThreshold,
                status: Number(item.totalStock) === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            }));

            return {
                success: true,
                count: items.length,
                items,
                outOfStock: items.filter(i => i.status === 'OUT_OF_STOCK').length,
                lowStock: items.filter(i => i.status === 'LOW_STOCK').length,
            };
        } catch (error) {
            return {
                success: false,
                message: `Error fetching low stock alerts: ${error.message}`,
            };
        }
    },
};

module.exports = {
    toolDeclarations,
    toolHandlers,
};
