const express = require('express');
const saltController = require('../../controllers/salt/saltController');
const { authenticate } = require('../../middlewares/auth');
const { requirePharmacist, requireAdmin } = require('../../middlewares/rbac');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Salt search and retrieval routes (available to all authenticated users)
 */
router.get('/search', saltController.searchSalts);
router.get('/find/:name', saltController.findByNameOrAlias);
router.get('/', saltController.getAllSalts);


/**
 * CORE POS FEATURE: Get alternative medicines with same salt composition
 * This is the primary endpoint for salt intelligence at POS
 */
router.get('/alternatives', saltController.getAlternatives);

router.get('/:id', saltController.getSaltById);

/**
 * Salt management routes (require admin role) 
 */
router.post('/', requireAdmin, saltController.createSalt);
router.put('/:id', requireAdmin, saltController.updateSalt);
router.delete('/:id', requireAdmin, saltController.deleteSalt);

/**
 * Alias management routes (require admin role)
 */
router.post('/:id/aliases', requireAdmin, saltController.addAlias);
router.delete('/:id/aliases/:alias', requireAdmin, saltController.removeAlias);

/**
 * Drug-Salt mapping routes
 */
router.get('/drug/:drugId/salts', saltController.getDrugSalts);
router.post('/drug/:drugId/salts', requirePharmacist, saltController.linkSaltToDrug);
router.delete('/drug/:drugId/salts/:saltId', requirePharmacist, saltController.unlinkSaltFromDrug);



module.exports = router;
