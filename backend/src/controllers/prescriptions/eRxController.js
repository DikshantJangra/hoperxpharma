const eRxService = require('../../services/prescriptions/eRxService');
const logger = require('../../config/logger');
const ApiResponse = require('../../utils/ApiResponse');

class ERxController {
    /**
     * GET /api/v1/prescriptions/erx/pending
     * Fetch pending prescriptions from external hub simulation
     */
    async getPending(req, res) {
        try {
            const pendingScripts = await eRxService.fetchPendingERx(req.user?.storeId);
            const response = ApiResponse.success(pendingScripts, "Pending E-Rx fetched successfully");
            return res.status(response.statusCode).json(response);
        } catch (error) {
            logger.error('Fetch Pending E-Rx Error:', error);
            return res.status(500).json({
                success: false,
                statusCode: 500,
                message: error.message,
                data: null
            });
        }
    }

    /**
     * POST /api/v1/prescriptions/erx/import
     * Import a specific external E-Rx into local db
     */
    async importScript(req, res) {
        try {
            const { eRxData } = req.body;
            if (!eRxData) {
                return res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: "Missing E-Rx data",
                    data: null
                });
            }

            const prescription = await eRxService.importERx(eRxData, req.user?.id);
            const response = ApiResponse.success(prescription, "E-Rx imported successfully");
            return res.status(response.statusCode).json(response);
        } catch (error) {
            logger.error('Import E-Rx Error:', error);
            return res.status(500).json({
                success: false,
                statusCode: 500,
                message: error.message,
                data: null
            });
        }
    }
}

module.exports = new ERxController();
