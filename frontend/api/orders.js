import api from './client';

const createOrder = async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
};

const getOrders = async () => {
    const response = await api.get('/orders');
    return response.data;
};

const getMyOrders = async () => {
    const response = await api.get('/orders/myorders');
    return response.data;
};

const getCookOrders = async () => {
    const response = await api.get('/orders/cookorders');
    return response.data;
};

const acceptOrder = async (id, aiVerified) => {
    const response = await api.put(`/orders/${id}/accept`, { aiVerified });
    return response.data;
};

const rejectOrder = async (id) => {
    const response = await api.put(`/orders/${id}/reject`);
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
    getMyOrders,
    getCookOrders,
    acceptOrder,
    rejectOrder,
    getOrderById,
    updateOrderStatus,
};