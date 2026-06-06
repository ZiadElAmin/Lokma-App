import express from 'express';
const router = express.Router();
import {
    authUser,
    registerUser,
    getUserProfile,
    toggleAvailability,
    savePushToken,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').post(registerUser);
router.post('/login', authUser);
router.route('/profile').get(protect, getUserProfile);
router.route('/availability').put(protect, toggleAvailability);
router.route('/push-token').put(protect, savePushToken);

export default router;
