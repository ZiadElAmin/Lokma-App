import express from 'express';
const router = express.Router();
import {
    getMeals,
    getMealById,
    createMeal,
    updateMeal,
    deleteMeal,
    getCookMeals,
    getCooks,
    createReview,
    getMealReviews,
    canReviewMeal,
} from '../controllers/mealController.js';
import { protect, cook } from '../middleware/authMiddleware.js';

router.route('/').get(getMeals).post(protect, cook, createMeal);
router.route('/my-meals').get(protect, cook, getCookMeals);
router.route('/cooks').get(getCooks);
router
    .route('/:id')
    .get(getMealById)
    .put(protect, cook, updateMeal)
    .delete(protect, cook, deleteMeal);
router.route('/:id/reviews').post(protect, createReview).get(getMealReviews);
router.route('/:id/can-review').get(protect, canReviewMeal);

export default router;
