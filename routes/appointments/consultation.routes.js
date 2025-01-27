import express from 'express';
import {
  createConsultation,
  getAllConsultations,
  getConsultationById,
  updateConsultation,
  deleteConsultation,
  getPaidConsultations,
} from '../../controllers/appointments/consultation.controller.js';
import {
  authenticatedUser,
  authorizePermissions,
} from '../../middleware/authentication.js';
const router = express.Router();

router
  .route('/consultation')
  .post([authenticatedUser, authorizePermissions('ADMIN')], createConsultation)
  .get([authenticatedUser], getAllConsultations);

router
  .route('/consultation/paid')
  .get([authenticatedUser], getPaidConsultations);

router
  .route('/consultation/:id')
  .get([authenticatedUser], getConsultationById)
  .patch([authenticatedUser, authorizePermissions('ADMIN'), updateConsultation])
  .delete([
    authenticatedUser,
    authorizePermissions('ADMIN'),
    deleteConsultation,
  ]);

export default router;
