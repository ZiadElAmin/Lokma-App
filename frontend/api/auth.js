import api from './client';

const register = async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
};

const getProfile = async () => {
    const response = await api.get('/users/profile');
    return response.data;
};

const updateProfile = async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
};

export default {
    register,
    getProfile,
    updateProfile,
};
