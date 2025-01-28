import express from 'express';
import {
  getChats,
  getMessages,
  sendMessage,
  getAllChats,
  getChatByUserId,
} from '../../controllers/chats/chat.controller.js';
import {
  authenticatedUser,
  authorizePermissions,
} from '../../middleware/authentication.js';
import { validate } from '../../middleware/validation.js';
import { chatMessageSchema } from '../../utils/validation/chat.validation.js';
const router = express.Router();

router.route('/').get([authenticatedUser], getChats);
router
  .route('/all')
  .get([authenticatedUser, authorizePermissions('ADMIN')], getAllChats);

router
  .route('/:userId')
  .get(authenticatedUser, authorizePermissions('ADMIN'), getChatByUserId);

router
  .route('/:chatId/messages')
  .get(authenticatedUser, getMessages)
  .post(authenticatedUser, sendMessage);

export default router;
