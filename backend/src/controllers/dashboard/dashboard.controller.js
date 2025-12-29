const database = require('../../config/database');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

const prisma = database.getClient();

/**
 * @desc    Get dashboard stats (all KPIs)
 * @route   GET /api/v1/dashboard/stats
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
    const storeId = req.storeId;

    // If user has no store, return zero stats
    if (!storeId) {
        return res.status(200).json(new ApiResponse(200, {
            revenue: 0,
            salesCount: 0,
            prescriptions: 0,
            readyForPickup: 0,
            criticalStock: 0,
            expiringSoon: 0,
            yesterdayRevenue: 0
        }));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Fetch all stats in parallel
    const [
        todaySales,
        yesterdaySales,
        prescriptionsCount,
        prescriptionDetails,
        readyForPickupCount,
        lowStockCount,
        expiringCount
    ] = await Promise.all([
        // Today's revenue
        prisma.sale.aggregate({
            where: {
                storeId,
                createdAt: {
                    gte: today,
                    lt: tomorrow
                },
                status: { not: 'CANCELLED' }
            },
            _sum: { total: true },
            _count: true
        }),

        // Yesterday's revenue for comparison
        prisma.sale.aggregate({
            where: {
                storeId,
                createdAt: {
                    gte: yesterday,
                    lt: today
                },
                status: { not: 'CANCELLED' }
            },
            _sum: { total: true }
        }),

        // Prescriptions - ACTIVE/VERIFIED (implies refills remaining) or DRAFT status
        prisma.prescription.count({
            where: {
                storeId,
                status: { in: ['ACTIVE', 'VERIFIED', 'DRAFT'] },
                deletedAt: null
            }
        }),

        // Detailed Prescription Breakdown
        prisma.prescription.groupBy({
            by: ['status'],
            where: {
                storeId,
                deletedAt: null
            },
            _count: true
        }),

        // Orders ready for pickup
        prisma.sale.count({
            where: {
                storeId,
                status: 'COMPLETED' // Assuming ready for pickup needs a better query, using COMPLETED for now to prevent crash
            }
        }),

        // Critical stock items
        prisma.inventoryBatch.count({
            where: {
                storeId,
                quantityInStock: { lte: 10 }, // Low stock threshold
                quantityInStock: { gt: 0 },
                deletedAt: null
            }
        }),

        // Expiring soon (next 30 days)
        prisma.inventoryBatch.count({
            where: {
                storeId,
                expiryDate: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                },
                deletedAt: null
            }
        })
    ]);

    const stats = {
        revenue: todaySales._sum.total || 0,
        salesCount: todaySales._count || 0,
        prescriptions: prescriptionsCount,
        prescriptionDetails: {
            active: (prescriptionDetails.find(d => d.status === 'ACTIVE')?._count || 0) + (prescriptionDetails.find(d => d.status === 'VERIFIED')?._count || 0),
            draft: prescriptionDetails.find(d => d.status === 'DRAFT')?._count || 0,
            refill: (prescriptionDetails.find(d => d.status === 'ACTIVE')?._count || 0) + (prescriptionDetails.find(d => d.status === 'VERIFIED')?._count || 0) // Updated logic: Verified/Active implies refills available
        },
        readyForPickup: readyForPickupCount,
        criticalStock: lowStockCount,
        expiringSoon: expiringCount,
        yesterdayRevenue: yesterdaySales._sum.total || 0
    };

    return res.status(200).json(new ApiResponse(200, stats));
});

/**
 * @desc    Get sales chart data (time-series)
 * @route   GET /api/v1/dashboard/sales-chart
 * @access  Private
 */
const getSalesChart = asyncHandler(async (req, res) => {
    const storeId = req.storeId;

    if (!storeId) {
        throw new ApiError(400, 'User has no associated store');
    }

    const period = req.query.period || 'week'; // week, month, year
    let days;

    if (period === 'week') {
        days = 7;
    } else if (period === 'month') {
        days = 30;
    } else if (period === 'year') {
        days = 365;
    } else {
        days = 7; // default to week
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get sales grouped by date and workflow counts
    const [sales, workflowCounts] = await Promise.all([
        // Sales data for chart
        prisma.sale.findMany({
            where: {
                storeId,
                createdAt: { gte: startDate },
                status: { not: 'CANCELLED' }
            },
            select: {
                createdAt: true,
                total: true,
                status: true
            },
            orderBy: { createdAt: 'asc' }
        }),

        // Workflow status counts
        prisma.sale.groupBy({
            by: ['status'],
            where: {
                storeId,
                createdAt: { gte: startDate },
                status: { not: 'CANCELLED' }
            },
            _count: true
        })
    ]);

    // Group by date
    const chartData = {};
    let totalProcessingTime = 0;
    let processedSalesCount = 0;

    // Calculate processing time from dispense events
    const dispenseEvents = await prisma.dispenseEvent.findMany({
        where: {
            prescription: {
                storeId,
                createdAt: { gte: startDate }
            },
            workflowStatus: 'COMPLETED',
            completedAt: { not: null }
        },
        select: {
            createdAt: true,
            completedAt: true
        },
        take: 100
    });

    dispenseEvents.forEach(event => {
        if (event.completedAt) {
            const processingMs = new Date(event.completedAt).getTime() - new Date(event.createdAt).getTime();
            const processingHours = processingMs / (1000 * 60 * 60);
            if (processingHours > 0 && processingHours < 168) { // Sanity check: less than 7 days
                totalProcessingTime += processingHours;
                processedSalesCount += 1;
            }
        }
    });

    sales.forEach(sale => {
        // Adjust for IST (UTC+5:30) to ensure correct day grouping
        // 12:45 AM Dec 30 IST is 19:15 Dec 29 UTC, which caused the issue.
        // Adding 5.5 hours shifts it effectively to IST for correct YYYY-MM-DD extraction
        const istDate = new Date(sale.createdAt.getTime() + (5.5 * 60 * 60 * 1000));
        const date = istDate.toISOString().split('T')[0];
        if (!chartData[date]) {
            chartData[date] = { revenue: 0, count: 0 };
        }
        chartData[date].revenue += parseFloat(sale.total);
        chartData[date].count += 1;
    });

    // Convert to array format
    const data = Object.entries(chartData).map(([date, stats]) => ({
        date,
        revenue: stats.revenue,
        count: stats.count
    }));

    // Map workflow statuses to readable names
    const workflowStatusMap = {
        'PENDING': 'New',
        'PROCESSING': 'In Progress',
        'COMPLETED': 'Ready',
        'DELIVERED': 'Delivered'
    };

    const workflowStats = {
        new: 0,
        inProgress: 0,
        ready: 0,
        delivered: 0
    };

    workflowCounts.forEach(item => {
        const status = item.status;
        const count = item._count;

        if (status === 'PENDING') workflowStats.new = count;
        else if (status === 'PROCESSING') workflowStats.inProgress = count;
        else if (status === 'COMPLETED') workflowStats.ready = count;
        else if (status === 'DELIVERED') workflowStats.delivered = count;
    });

    const averageProcessingTime = processedSalesCount > 0
        ? (totalProcessingTime / processedSalesCount).toFixed(1) + 'h'
        : 'N/A';

    // Calculate growth percentage compared to previous period
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
    const previousPeriodSales = await prisma.sale.aggregate({
        where: {
            storeId,
            createdAt: {
                gte: previousPeriodStart,
                lt: startDate
            },
            status: { not: 'CANCELLED' }
        },
        _sum: { total: true }
    });

    const currentTotal = data.reduce((sum, item) => sum + item.revenue, 0);
    const previousTotal = parseFloat(previousPeriodSales._sum.total) || 0;
    const growthPercent = previousTotal > 0
        ? (((currentTotal - previousTotal) / previousTotal) * 100).toFixed(1)
        : currentTotal > 0 ? '100.0' : '0.0';

    return res.status(200).json(new ApiResponse(200, {
        period,
        data,
        workflowStats,
        averageProcessingTime,
        growthPercent,
        totalRevenue: currentTotal,
        totalOrders: data.reduce((sum, item) => sum + item.count, 0)
    }));
});

/**
 * @desc    Get action queues
 * @route   GET /api/v1/dashboard/action-queues
 * @access  Private
 */
const getActionQueues = asyncHandler(async (req, res) => {
    const storeId = req.storeId;

    if (!storeId) {
        throw new ApiError(400, 'User has no associated store');
    }

    const [
        pendingPrescriptions,
        lowStockItems,
        expiringItems,
        readyForPickup
    ] = await Promise.all([
        // Pending prescriptions (DRAFT or VERIFIED)
        prisma.prescription.findMany({
            where: {
                storeId,
                status: { in: ['DRAFT', 'VERIFIED'] }
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                patient: {
                    select: { firstName: true, lastName: true }
                },
                createdAt: true
            }
        }),

        // Low stock items
        prisma.inventoryBatch.findMany({
            where: {
                storeId,
                quantityInStock: { lte: 10, gt: 0 }
            },
            take: 5,
            orderBy: { quantityInStock: 'asc' },
            select: {
                id: true,
                quantityInStock: true,
                drug: {
                    select: { name: true }
                }
            }
        }),

        // Expiring items
        prisma.inventoryBatch.findMany({
            where: {
                storeId,
                expiryDate: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            },
            take: 5,
            orderBy: { expiryDate: 'asc' },
            select: {
                id: true,
                expiryDate: true,
                drug: {
                    select: { name: true }
                }
            }
        }),

        // Ready for pickup
        prisma.sale.findMany({
            where: {
                storeId,
                status: 'COMPLETED' // Assuming ready for pickup is tracked as part of completed sales logic or needs update
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                invoiceNumber: true,
                patient: {
                    select: { firstName: true, lastName: true }
                },
                createdAt: true
            }
        })
    ]);

    const queues = {
        pendingPrescriptions: pendingPrescriptions.map(p => ({
            id: p.id,
            patientName: p.patient ? `${p.patient.firstName} ${p.patient.lastName}` : 'Walk-in Customer',
            time: p.createdAt
        })),
        lowStockItems: lowStockItems.map(i => ({
            id: i.id,
            drugName: i.drug.name,
            stock: i.quantityInStock
        })),
        expiringItems: expiringItems.map(i => ({
            id: i.id,
            drugName: i.drug.name,
            expiryDate: i.expiryDate
        })),
        readyForPickup: readyForPickup.map(s => ({
            id: s.id,
            invoiceNumber: s.invoiceNumber,
            patientName: s.patient ? `${s.patient.firstName} ${s.patient.lastName}` : 'Walk-in Customer',
            time: s.createdAt
        }))
    };

    return res.status(200).json(new ApiResponse(200, queues));
});

/**
 * @desc    Get AI insights (real alerts as insights)
 * @route   GET /api/v1/dashboard/insights
 * @access  Private
 */
const getInsights = asyncHandler(async (req, res) => {
    const storeId = req.storeId;

    // If user has no store, return empty insights
    if (!storeId) {
        return res.status(200).json(new ApiResponse(200, []));
    }

    // Get top 3 critical/high alerts as insights
    const alerts = await prisma.alert.findMany({
        where: {
            storeId,
            status: { in: ['NEW'] },
            severity: { in: ['CRITICAL', 'WARNING'] }
        },
        take: 3,
        orderBy: [
            { severity: 'desc' },
            { createdAt: 'desc' }
        ],
        select: {
            id: true,
            title: true,
            description: true,
            severity: true,
            type: true,
            createdAt: true
        }
    });

    const insights = alerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        type: alert.type,
        icon: getIconForAlertType(alert.type),
        time: alert.createdAt
    }));

    return res.status(200).json(new ApiResponse(200, insights));
});

function getIconForAlertType(type) {
    const iconMap = {
        'inventory': 'package',
        'compliance': 'shield',
        'workflow': 'clock',
        'system': 'alert-triangle'
    };
    return iconMap[type] || 'info';
}

module.exports = {
    getDashboardStats,
    getSalesChart,
    getActionQueues,
    getInsights
};
