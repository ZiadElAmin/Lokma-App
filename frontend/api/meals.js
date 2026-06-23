import api from './client';

const getMeals = async (search = '', cookId = '', category = '') => {
    const params = {};
    if (search) params.search = search;
    if (cookId) params.cookId = cookId;
    if (category) params.category = category;
    const response = await api.get('/meals', { params });
    return response.data;
};

const getMyMeals = async () => {
    const response = await api.get('/meals/my-meals');
    return response.data;
};

const getMealById = async (id) => {
    const response = await api.get(`/meals/${id}`);
    return response.data;
};

const createMeal = async (mealData) => {
    const response = await api.post('/meals', mealData);
    return response.data;
};

const updateMeal = async (id, mealData) => {
    const response = await api.put(`/meals/${id}`, mealData);
    return response.data;
};

const deleteMeal = async (id) => {
    await api.delete(`/meals/${id}`);
};
const getCooks = async () => {
    const response = await api.get('/meals/cooks');
    return response.data;
};

const createReview = async (mealId, reviewData) => {
    const response = await api.post(`/meals/${mealId}/reviews`, reviewData);
    return response.data;
};

const getMealReviews = async (mealId) => {
    const response = await api.get(`/meals/${mealId}/reviews`);
    return response.data;
};

const canReview = async (mealId) => {
    const response = await api.get(`/meals/${mealId}/can-review`);
    return response.data;
};

export default {
    getMeals,
    getMyMeals,
    getMealById,
    createMeal,
    updateMeal,
    deleteMeal,
    getCooks,
    createReview,
    getMealReviews,
    canReview,
};
