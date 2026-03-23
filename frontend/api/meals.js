import api from './client';

const getMeals = async () => {
    const response = await api.get('/meals');
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

export default {
    getMeals,
    getMyMeals,
    getMealById,
    createMeal,
    updateMeal,
    deleteMeal,
};
