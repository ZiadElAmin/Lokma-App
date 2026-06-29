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

const updateOrderToPaid = async (id, paymentResult) => {
    const response = await api.put(`/orders/${id}/pay`, paymentResult);
    return response.data;
};

const updateOrderStatus = async (id, status) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
};

const markOrderReady = async (id) => {
    const response = await api.put(`/orders/${id}/ready`);
    return response.data;
};

const getAvailableOrders = async () => {
    const response = await api.get('/orders/available');
    return response.data;
};

const claimOrder = async (id) => {
    const response = await api.put(`/orders/${id}/claim`);
    return response.data;
};

const pickupOrder = async (id) => {
    const response = await api.put(`/orders/${id}/pickup`);
    return response.data;
};

const deliverOrder = async (id) => {
    const response = await api.put(`/orders/${id}/deliver`);
    return response.data;
};

const getRiderOrders = async () => {
    const response = await api.get('/orders/riderorders');
    return response.data;
};

const submitCompliance = async (id, aiVerified) => {
    const response = await api.post(`/orders/${id}/compliance`, { aiVerified });
    return response.data;
};

const envCheck = async (id, image, mimeType = 'image/jpeg') => {
    const response = await api.post(`/orders/${id}/env-check`, { image, mimeType });
    return response.data;
};

const getRecommendations = async (id) => {
    const response = await api.get(`/orders/${id}/recommendations`);
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
    updateOrderToPaid,
    updateOrderStatus,
    markOrderReady,
    getAvailableOrders,
    claimOrder,
    pickupOrder,
    deliverOrder,
    getRiderOrders,
    submitCompliance,
    envCheck,
    getRecommendations,
};