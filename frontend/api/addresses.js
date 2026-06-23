import api from './client';

const getAddresses = async () => {
    const response = await api.get('/addresses');
    return response.data;
};

const createAddress = async (data) => {
    const response = await api.post('/addresses', data);
    return response.data;
};

const deleteAddress = async (id) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
};

export default { getAddresses, createAddress, deleteAddress };
