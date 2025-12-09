const patientService = require('../../services/patients/patientService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const { parsePagination, parseSort, buildPaginationMeta } = require('../../utils/queryParser');
const { SORTABLE_FIELDS } = require('../../config/sortableFields');

/**
 * Get all patients
 */
const getPatients = asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const sortConfig = parseSort(req.query, SORTABLE_FIELDS.patients);

    const { patients, total } = await patientService.getPatients({
        storeId: req.storeId,
        page,
        limit,
        search: req.query.search || '',
        sortConfig,
    });

    const response = ApiResponse.paginated(patients, buildPaginationMeta(total, page, limit));
    res.status(response.statusCode).json(response);
});

/**
 * Search patients (for autocomplete)
 */
const searchPatients = asyncHandler(async (req, res) => {
    const query = req.query.q || '';

    if (query.length < 2) {
        return res.json(ApiResponse.success([]));
    }

    const patients = await patientService.searchPatients(req.storeId, query);
    const response = ApiResponse.success(patients);
    res.status(response.statusCode).json(response);
});

/**
 * Get patient by ID
 */
const getPatientById = asyncHandler(async (req, res) => {
    const patient = await patientService.getPatientById(req.params.id, req.storeId);

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
    const patient = await patientService.updatePatient(req.params.id, req.body, req.storeId);

    const response = ApiResponse.success(patient, 'Patient updated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Delete patient
 */
const deletePatient = asyncHandler(async (req, res) => {
    const result = await patientService.deletePatient(req.params.id, req.user.id, req.storeId);

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
    const consents = await patientService.getPatientConsents(req.params.patientId || req.params.id, req.storeId);

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

/**
 * Get patient history
 */
const getPatientHistory = asyncHandler(async (req, res) => {
    const history = await patientService.getPatientHistory(req.params.id, req.storeId, req.query);

    const response = ApiResponse.success(history);
    res.status(response.statusCode).json(response);
});

/**
 * Get refills due
 */
const getRefillsDue = asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const sortConfig = parseSort(req.query, SORTABLE_FIELDS.refills);

    const { refills, total } = await patientService.getRefillsDue(req.storeId, {
        status: req.query.status || 'all',
        search: req.query.search || '',
        page,
        limit,
        sortConfig,
    });

    const response = ApiResponse.paginated(refills, buildPaginationMeta(total, page, limit));
    res.status(response.statusCode).json(response);
});

/**
 * Process refill
 */
const processRefill = asyncHandler(async (req, res) => {
    const adherence = await patientService.processRefill(req.params.id, req.body);

    const response = ApiResponse.created(adherence, 'Refill processed successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get adherence
 */
const getAdherence = asyncHandler(async (req, res) => {
    const adherence = await patientService.getAdherence(req.params.id, req.storeId);

    const response = ApiResponse.success(adherence);
    res.status(response.statusCode).json(response);
});

/**
 * Record adherence
 */
const recordAdherence = asyncHandler(async (req, res) => {
    const adherence = await patientService.recordAdherence(req.params.id, req.body);

    const response = ApiResponse.created(adherence, 'Adherence recorded successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get all consents
 */
const getAllConsents = asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const sortConfig = parseSort(req.query, SORTABLE_FIELDS.consents);

    const { consents, total } = await patientService.getAllConsents(req.storeId, {
        status: req.query.status || 'all',
        page,
        limit,
        sortConfig,
    });

    const response = ApiResponse.paginated(consents, buildPaginationMeta(total, page, limit));
    res.status(response.statusCode).json(response);
});

module.exports = {
    getPatients,
    searchPatients,
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
    getPatientHistory,
    getRefillsDue,
    processRefill,
    getAdherence,
    recordAdherence,
    getAllConsents,
};
