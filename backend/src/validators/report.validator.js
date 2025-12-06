const Joi = require('joi');

/**
 * Validation schema for report date range filters
 */
const reportFiltersSchema = Joi.object({
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().min(Joi.ref('from')).optional(),
    dateRange: Joi.string()
        .valid('today', '7d', '30d', '90d', 'mtd', 'lastMonth', 'thisQuarter', 'thisYear', 'custom')
        .optional(),
    storeId: Joi.string().optional(), // For multi-store reports (future)
    channel: Joi.string().optional(),
    category: Joi.string().optional(),
    sku: Joi.string().optional(),
}).custom((value, helpers) => {
    // If dateRange is 'custom', from and to are required
    if (value.dateRange === 'custom' && (!value.from || !value.to)) {
        return helpers.error('any.invalid', {
            message: 'from and to dates are required when dateRange is custom',
        });
    }
    return value;
});

/**
 * Validation schema for export request
 */
const exportReportSchema = Joi.object({
    format: Joi.string().valid('pdf', 'excel', 'csv').default('pdf'),
    includeRaw: Joi.boolean().default(false),
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().min(Joi.ref('from')).optional(),
    dateRange: Joi.string()
        .valid('today', '7d', '30d', '90d', 'mtd', 'lastMonth', 'thisQuarter', 'thisYear', 'custom')
        .optional(),
});

module.exports = {
    reportFiltersSchema,
    exportReportSchema,
};
