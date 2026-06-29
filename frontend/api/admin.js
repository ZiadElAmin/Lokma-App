import api from './client';

const getStats = async () => {
    const response = await api.get('/admin/stats');
    return response.data;
};

const getAllUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data;
};

const getAllCooks = async () => {
    const response = await api.get('/admin/cooks');
    return response.data;
};

const getAllRiders = async () => {
    const response = await api.get('/admin/riders');
    return response.data;
};

const getAllOrders = async () => {
    const response = await api.get('/admin/orders');
    return response.data;
};

const deleteUser = async (id) => {
    await api.delete(`/admin/users/${id}`);
};

const disableUser = async (id) => {
    const response = await api.put(`/admin/users/${id}/disable`);
    return response.data;
};

const enableUser = async (id) => {
    const response = await api.put(`/admin/users/${id}/enable`);
    return response.data;
};

const getViolations = async () => {
    const response = await api.get('/admin/violations');
    return response.data;
};

const deleteOrder = async (id) => {
    await api.delete(`/admin/orders/${id}`);
};

const updateOrderStatus = async (id, isPaid, isDelivered) => {
    const response = await api.put('/admin/orders', { id, isPaid, isDelivered });
    return response.data;
};

export default {
    getStats,
    getAllUsers,
    getAllCooks,
    getAllRiders,
    getAllOrders,
    deleteUser,
    disableUser,
    enableUser,
    getViolations,
    deleteOrder,
    updateOrderStatus,
};
