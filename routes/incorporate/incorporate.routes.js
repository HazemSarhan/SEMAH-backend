import express from 'express';
import {
  authenticatedUser,
  authorizePermissions,
} from '../../middleware/authentication.js';
import {
  createIncorporateService,
  getAllIncorporates,
  getIncorporateServiceById,
  purchaseIncorporateService,
  handleIncorporateService,
} from '../../controllers/incorporate/incorporate.controller.js';
const router = express.Router();

router
  .route('/')
  .post([
    authenticatedUser,
    authorizePermissions('ADMIN'),
    createIncorporateService,
  ])
  .get([authenticatedUser], getAllIncorporates);

router.route('/purchase').post([authenticatedUser], purchaseIncorporateService);
router.route('/success').get([authenticatedUser], handleIncorporateService);

router.route('/filter').get([authenticatedUser], getIncorporateServiceById);

export default router;
