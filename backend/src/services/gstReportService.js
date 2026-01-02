const gstReportRepository = require('../repositories/gstReportRepository');

class GSTReportService {
    /**
     * Get GST dashboard data
     */
    async getDashboard(storeId, month) {
        const { startDate, endDate } = this.getMonthDates(month);
        return await gstReportRepository.getDashboardData(storeId, startDate, endDate);
    }

    /**
     * Get GSTR-1 summary
     */
    async getGSTR1Summary(storeId, month) {
        const { startDate, endDate } = this.getMonthDates(month);
        return await gstReportRepository.getGSTR1Summary(storeId, startDate, endDate);
    }

    /**
     * Get GSTR-3B summary
     */
    async getGSTR3BSummary(storeId, month) {
        const { startDate, endDate } = this.getMonthDates(month);
        return await gstReportRepository.getGSTR3BSummary(storeId, startDate, endDate);
    }

    /**
     * Get monthly trend
     */
    async getMonthlyTrend(storeId, months = 6) {
        return await gstReportRepository.getMonthlyTrend(storeId, months);
    }

    /**
     * Helper: Parse month string and return date range
     * @param {string} month - Format: YYYY-MM or empty for current month
     */
    getMonthDates(month) {
        let date;

        if (month) {
            // Parse YYYY-MM format
            const [year, monthNum] = month.split('-').map(Number);
            date = new Date(year, monthNum - 1, 1);
        } else {
            // Current month
            date = new Date();
            date.setDate(1);
        }

        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        return { startDate, endDate };
    }
}

module.exports = new GSTReportService();
