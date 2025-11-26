const adminPinService = require('../../services/adminPinService');
const asyncHandler = require('../../middlewares/asyncHandler');

/**
 * @route   POST /api/rbac/admin/pin/setup
 * @desc    Setup admin PIN
 * @access  Admin
 */
exports.setupPin = asyncHandler(async (req, res) => {
    const { pin } = req.body;

    if (!pin) {
        return res.status(400).json({
            success: false,
            message: 'PIN is required',
        });
    }

    const result = await adminPinService.setupPin(req.user.id, pin);

    res.json({
        success: true,
        message: result.message,
    });
});

/**
 * @route   POST /api/rbac/admin/pin/verify
 * @desc    Verify admin PIN
 * @access  Admin
 */
exports.verifyPin = asyncHandler(async (req, res) => {
    const { pin } = req.body;

    if (!pin) {
        return res.status(400).json({
            success: false,
            message: 'PIN is required',
        });
    }

    const isValid = await adminPinService.verifyPin(req.user.id, pin);

    res.json({
        success: true,
        data: { valid: isValid },
        message: 'PIN verified successfully',
    });
});

/**
 * @route   PUT /api/rbac/admin/pin/change
 * @desc    Change admin PIN
 * @access  Admin
 */
exports.changePin = asyncHandler(async (req, res) => {
    const { oldPin, newPin } = req.body;

    if (!oldPin || !newPin) {
        return res.status(400).json({
            success: false,
            message: 'Both old and new PIN are required',
        });
    }

    const result = await adminPinService.changePin(req.user.id, oldPin, newPin);

    res.json({
        success: true,
        message: result.message,
    });
});

/**
 * @route   GET /api/rbac/admin/pin/status
 * @desc    Check if admin PIN is set up
 * @access  Admin
 */
exports.getPinStatus = asyncHandler(async (req, res) => {
    const hasPin = await adminPinService.hasPinSetup(req.user.id);

    res.json({
        success: true,
        data: { hasPin },
    });
});
