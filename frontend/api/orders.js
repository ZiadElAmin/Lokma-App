import api from './client';

const createOrder = async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
};

const getOrders = async () => {
    const response = await api.get('/orders');
    return response.data;
};

const getOrderById = async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
};

const updateOrderStatus = async (id, status) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
};

export default {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
};
