const patientService = require('../../services/patients/patientService');
const logger = require('../../config/logger');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const { parsePagination, parseSort, buildPaginationMeta } = require('../../utils/queryParser');
const { SORTABLE_FIELDS } = require('../../config/sortableFields');
const httpStatus = require('http-status');

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

    // Explicitly cast Decimal to Number to prevent frontend serialization issues
    if (patient && patient.currentBalance) {
        patient.currentBalance = parseFloat(patient.currentBalance.toString());
    }

    // DEBUG (Optional - keep for confirmation)
    // logger.info(`[DEBUG] API getPatientById: CAST Balance=${patient?.currentBalance} (Type: ${typeof patient?.currentBalance})`);

    // DEBUG: Log patient balance
    logger.info(`[DEBUG] API getPatientById: ${patient?.firstName} Balance=${patient?.currentBalance} (Type: ${typeof patient?.currentBalance})`);

    const response = ApiResponse.success(patient);
    res.status(response.statusCode).json(response);
});

/**
 * Get patient insights (decision surface)
 */
const getPatientInsights = asyncHandler(async (req, res) => {
    const insights = await patientService.getPatientInsights(req.params.id, req.storeId);
    const response = ApiResponse.success(insights);
    res.status(response.statusCode).json(response);
});

/**
 * Get credit assessment for POS
 */
const getCreditAssessment = asyncHandler(async (req, res) => {
    const saleTotal = req.query.saleTotal ? Number(req.query.saleTotal) : 0;
    const assessment = await patientService.getCreditAssessment(req.params.id, req.storeId, saleTotal);
    const response = ApiResponse.success(assessment);
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
 * Get store credit policy
 */
const getStoreCreditPolicy = asyncHandler(async (req, res) => {
    const policy = await patientService.getStoreCreditPolicy(req.storeId);
    const response = ApiResponse.success(policy);
    res.status(response.statusCode).json(response);
});

/**
 * Update store credit policy
 */
const updateStoreCreditPolicy = asyncHandler(async (req, res) => {
    const policy = await patientService.updateStoreCreditPolicy(req.storeId, req.body);
    const response = ApiResponse.success(policy, 'Credit policy updated');
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

/**
 * Get Customer Ledger
 */
const getLedger = asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const { ledger, total } = await patientService.getLedger(req.params.id, req.storeId, {
        page,
        limit
    });

    const response = ApiResponse.paginated(ledger, buildPaginationMeta(total, page, limit));
    res.status(response.statusCode).json(response);
});

/**
 * Process Customer Payment
 */
const processPayment = asyncHandler(async (req, res) => {
    const result = await patientService.processCustomerPayment(req.params.id, req.body, req.storeId);

    const response = ApiResponse.created(result, 'Payment processed successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get Debtors
 */
const getDebtors = asyncHandler(async (req, res) => {
    logger.info('[getDebtors] StoreId:', req.storeId);
    const { page, limit } = parsePagination(req.query);
    const sortConfig = parseSort(req.query);
    const filters = {
        page,
        limit,
        search: req.query.search || '',
        minBalance: req.query.minBalance,
        maxBalance: req.query.maxBalance,
        sortConfig
    };

    const { debtors, total, totalOutstanding, totalDebtors } = await patientService.getDebtors(req.storeId, filters);
    
    logger.info('[getDebtors] Results:', { debtors: debtors.length, total, totalOutstanding, totalDebtors });
    logger.info('[getDebtors] First debtor:', debtors[0]);

    const response = ApiResponse.paginated(debtors, buildPaginationMeta(total, page, limit));
    // Add extra stats to response
    response.meta.totalOutstanding = totalOutstanding;
    response.meta.totalDebtors = totalDebtors;
    
    logger.info('[getDebtors] Response meta:', response.meta);

    res.status(response.statusCode).json(response);
});

/**
 * Get Unpaid Invoices
 */
const getUnpaidInvoices = asyncHandler(async (req, res) => {
    const result = await patientService.getUnpaidInvoices(req.params.id, req.storeId);
    const response = ApiResponse.success(result, 'Unpaid invoices fetched successfully');
    res.status(200).json(response);
});

const syncBalance = asyncHandler(async (req, res) => {
    const result = await patientService.syncPatientBalance(req.params.id, req.storeId);
    const response = ApiResponse.success(result, 'Balance synchronized successfully');
    res.status(200).json(response);
});

module.exports = {
    getPatients,
    searchPatients,
    getPatientById,
    getPatientInsights,
    getCreditAssessment,
    createPatient,
    updatePatient,
    deletePatient,
    createConsent,
    withdrawConsent,
    getPatientConsents,
    createInsurance,
    updateInsurance,
    getPatientStats,
    getStoreCreditPolicy,
    updateStoreCreditPolicy,
    getPatientHistory,
    getRefillsDue,
    processRefill,
    getAdherence,
    recordAdherence,
    getAllConsents,
    getLedger,
    processPayment,
    getDebtors,
    getUnpaidInvoices,
    syncBalance
};
