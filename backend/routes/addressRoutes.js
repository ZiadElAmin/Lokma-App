import express from 'express';
const router = express.Router();
import { getAddresses, createAddress, deleteAddress } from '../controllers/addressController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').get(protect, getAddresses).post(protect, createAddress);
router.route('/:id').delete(protect, deleteAddress);

export default router;
