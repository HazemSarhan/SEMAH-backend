import express from 'express';
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  handlePaidAppointment,
  getAllAuthenticatedAppointments,
  getAuthenticatedAppointmentById,
} from '../../controllers/appointments/appointment.controller.js';
import {
  authenticatedUser,
  authorizePermissions,
} from '../../middleware/authentication.js';
const router = express.Router();
router.route('/success').get([authenticatedUser], handlePaidAppointment);

router
  .route('/')
  .post([authenticatedUser], createAppointment)
  .get([authenticatedUser, authorizePermissions('ADMIN')], getAllAppointments);
router
  .route('/myAppointments')
  .get([authenticatedUser], getAllAuthenticatedAppointments);

router.route('/:id').get([authenticatedUser, getAppointmentById]);
router
  .route('/myAppointments/:id')
  .get(authenticatedUser, getAuthenticatedAppointmentById);

export default router;
