import express from 'express';
const router = express.Router();
import {
    authUser,
    registerUser,
    googleAuth,
    getUserProfile,
    updateProfile,
    toggleAvailability,
    savePushToken,
    saveLocation,
    setRole,
    uploadAvatar,
    deleteAccount,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').post(registerUser);
router.post('/login', authUser);
router.post('/google', googleAuth);
router.route('/profile').get(protect, getUserProfile).put(protect, updateProfile);
router.route('/availability').put(protect, toggleAvailability);
router.route('/push-token').put(protect, savePushToken);
router.route('/location').put(protect, saveLocation);
router.route('/role').put(protect, setRole);
router.route('/avatar').put(protect, uploadAvatar);
router.route('/delete').delete(protect, deleteAccount);

export default router;
