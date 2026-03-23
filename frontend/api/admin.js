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

const getAllOrders = async () => {
    const response = await api.get('/admin/orders');
    return response.data;
};

const deleteUser = async (id) => {
    await api.delete(`/admin/users/${id}`);
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
    getAllOrders,
    deleteUser,
    deleteOrder,
    updateOrderStatus,
};
