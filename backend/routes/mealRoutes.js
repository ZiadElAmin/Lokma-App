import express from 'express';
const router = express.Router();
import {
    getMeals,
    getMealById,
    createMeal,
    updateMeal,
    deleteMeal,
    getCookMeals,
} from '../controllers/mealController.js';
import { protect, cook } from '../middleware/authMiddleware.js';

router.route('/').get(getMeals).post(protect, cook, createMeal);
router.route('/my-meals').get(protect, cook, getCookMeals);
router
    .route('/:id')
    .get(getMealById)
    .put(protect, cook, updateMeal)
    .delete(protect, cook, deleteMeal);

export default router;
