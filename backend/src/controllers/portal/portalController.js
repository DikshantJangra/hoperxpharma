const portalService = require('../../services/portal/portalService');
const logger = require('../../config/logger');

class PortalController {
    /**
     * Verify identity and get token
     */
    async verify(req, res) {
        try {
            const { phoneNumber, dateOfBirth } = req.body;

            if (!phoneNumber || !dateOfBirth) {
                return res.status(400).json({ error: 'Phone number and Date of Birth are required' });
            }

            const result = await portalService.verifyPatient(phoneNumber, dateOfBirth);
            res.json(result);
        } catch (error) {
            logger.error('Portal verification error:', error);
            res.status(401).json({ error: 'Verification failed. Please check your details.' });
        }
    }

    /**
     * Get active prescriptions
     */
    async getPrescriptions(req, res) {
        try {
            // req.user is set by auth middleware (we'll need a portal-specific one or reuse existing)
            const patientId = req.user.id;
            const prescriptions = await portalService.getActivePrescriptions(patientId);
            res.json(prescriptions);
        } catch (error) {
            logger.error('Portal fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch prescriptions' });
        }
    }

    /**
     * Request refill
     */
    async requestRefill(req, res) {
        try {
            const patientId = req.user.id;
            const { prescriptionId } = req.body;

            const result = await portalService.requestRefill(patientId, prescriptionId);
            res.json({ success: true, message: 'Refill requested successfully', data: result });
        } catch (error) {
            logger.error('Refill request error:', error);
            res.status(400).json({ error: error.message || 'Failed to request refill' });
        }
    }
}

module.exports = new PortalController();
