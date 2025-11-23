const patientService = require('../../services/patients/patientService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../Utils/ApiResponse');

/**
 * Get all patients
 */
const getPatients = asyncHandler(async (req, res) => {
    const { patients, total } = await patientService.getPatients({
        ...req.query,
        storeId: req.storeId,
    });

    const response = ApiResponse.paginated(patients, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        total,
    });

    res.status(response.statusCode).json(response);
});

/**
 * Get patient by ID
 */
const getPatientById = asyncHandler(async (req, res) => {
    const patient = await patientService.getPatientById(req.params.id);

    const response = ApiResponse.success(patient);
    res.status(response.statusCode).json(response);
});

/**
 * Create patient
 */
const createPatient = asyncHandler(async (req, res) => {
    const patient = await patientService.createPatient({
        ...req.body,
        storeId: req.storeId,
    });

    const response = ApiResponse.created(patient, 'Patient created successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Update patient
 */
const updatePatient = asyncHandler(async (req, res) => {
    const patient = await patientService.updatePatient(req.params.id, req.body);

    const response = ApiResponse.success(patient, 'Patient updated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Delete patient
 */
const deletePatient = asyncHandler(async (req, res) => {
    const result = await patientService.deletePatient(req.params.id, req.user.id);

    const response = ApiResponse.success(result);
    res.status(response.statusCode).json(response);
});

/**
 * Create patient consent
 */
const createConsent = asyncHandler(async (req, res) => {
    const consent = await patientService.createConsent(req.body);

    const response = ApiResponse.created(consent, 'Consent created successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Withdraw consent
 */
const withdrawConsent = asyncHandler(async (req, res) => {
    const consent = await patientService.withdrawConsent(req.params.id);

    const response = ApiResponse.success(consent, 'Consent withdrawn successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get patient consents
 */
const getPatientConsents = asyncHandler(async (req, res) => {
    const consents = await patientService.getPatientConsents(req.params.patientId);

    const response = ApiResponse.success(consents);
    res.status(response.statusCode).json(response);
});

/**
 * Create patient insurance
 */
const createInsurance = asyncHandler(async (req, res) => {
    const insurance = await patientService.createInsurance(req.body);

    const response = ApiResponse.created(insurance, 'Insurance created successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Update patient insurance
 */
const updateInsurance = asyncHandler(async (req, res) => {
    const insurance = await patientService.updateInsurance(req.params.id, req.body);

    const response = ApiResponse.success(insurance, 'Insurance updated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get patient statistics
 */
const getPatientStats = asyncHandler(async (req, res) => {
    const stats = await patientService.getPatientStats(req.storeId);

    const response = ApiResponse.success(stats);
    res.status(response.statusCode).json(response);
});

module.exports = {
    getPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
    createConsent,
    withdrawConsent,
    getPatientConsents,
    createInsurance,
    updateInsurance,
    getPatientStats,
};
