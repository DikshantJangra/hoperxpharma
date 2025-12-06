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
    const storeId = req.user.primaryStoreId;

    if (!storeId) {
        throw new ApiError(400, 'User has no associated store');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all stats in parallel
    const [
        todaySales,
        prescriptionsCount,
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
            _sum: { finalAmount: true },
            _count: true
        }),

        // Prescriptions pending review
        prisma.prescription.count({
            where: {
                storeId,
                status: 'PENDING'
            }
        }),

        // Orders ready for pickup
        prisma.sale.count({
            where: {
                storeId,
                status: 'READY_FOR_PICKUP'
            }
        }),

        // Critical stock items
        prisma.inventoryBatch.count({
            where: {
                storeId,
                currentStock: { lte: 10 }, // Low stock threshold
                currentStock: { gt: 0 }
            }
        }),

        // Expiring soon (next 30 days)
        prisma.inventoryBatch.count({
            where: {
                storeId,
                expiryDate: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            }
        })
    ]);

    const stats = {
        revenue: todaySales._sum.finalAmount || 0,
        salesCount: todaySales._count || 0,
        prescriptions: prescriptionsCount,
        readyForPickup: readyForPickupCount,
        criticalStock: lowStockCount,
        expiringSoon: expiringCount
    };

    return res.status(200).json(new ApiResponse(200, stats));
});

/**
 * @desc    Get sales chart data (time-series)
 * @route   GET /api/v1/dashboard/sales-chart
 * @access  Private
 */
const getSalesChart = asyncHandler(async (req, res) => {
    const storeId = req.user.primaryStoreId;

    if (!storeId) {
        throw new ApiError(400, 'User has no associated store');
    }

    const period = req.query.period || 'daily'; // daily, weekly, monthly
    const days = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 1;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get sales grouped by date
    const sales = await prisma.sale.findMany({
        where: {
            storeId,
            createdAt: { gte: startDate },
            status: { not: 'CANCELLED' }
        },
        select: {
            createdAt: true,
            finalAmount: true
        },
        orderBy: { createdAt: 'asc' }
    });

    // Group by date
    const chartData = {};
    sales.forEach(sale => {
        const date = sale.createdAt.toISOString().split('T')[0];
        if (!chartData[date]) {
            chartData[date] = { revenue: 0, count: 0 };
        }
        chartData[date].revenue += parseFloat(sale.finalAmount);
        chartData[date].count += 1;
    });

    // Convert to array format
    const data = Object.entries(chartData).map(([date, stats]) => ({
        date,
        revenue: stats.revenue,
        count: stats.count
    }));

    return res.status(200).json(new ApiResponse(200, { period, data }));
});

/**
 * @desc    Get action queues
 * @route   GET /api/v1/dashboard/action-queues
 * @access  Private
 */
const getActionQueues = asyncHandler(async (req, res) => {
    const storeId = req.user.primaryStoreId;

    if (!storeId) {
        throw new ApiError(400, 'User has no associated store');
    }

    const [
        pendingPrescriptions,
        lowStockItems,
        expiringItems,
        readyForPickup
    ] = await Promise.all([
        // Pending prescriptions
        prisma.prescription.findMany({
            where: {
                storeId,
                status: 'PENDING'
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
                currentStock: { lte: 10, gt: 0 }
            },
            take: 5,
            orderBy: { currentStock: 'asc' },
            select: {
                id: true,
                currentStock: true,
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
                status: 'READY_FOR_PICKUP'
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
            patientName: `${p.patient.firstName} ${p.patient.lastName}`,
            time: p.createdAt
        })),
        lowStockItems: lowStockItems.map(i => ({
            id: i.id,
            drugName: i.drug.name,
            stock: i.currentStock
        })),
        expiringItems: expiringItems.map(i => ({
            id: i.id,
            drugName: i.drug.name,
            expiryDate: i.expiryDate
        })),
        readyForPickup: readyForPickup.map(s => ({
            id: s.id,
            invoiceNumber: s.invoiceNumber,
            patientName: `${s.patient.firstName} ${s.patient.lastName}`,
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
    const storeId = req.user.primaryStoreId;

    if (!storeId) {
        throw new ApiError(400, 'User has no associated store');
    }

    // Get top 3 critical/high alerts as insights
    const alerts = await prisma.alert.findMany({
        where: {
            storeId,
            status: { in: ['NEW', 'ACKNOWLEDGED'] },
            severity: { in: ['CRITICAL', 'HIGH'] }
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
