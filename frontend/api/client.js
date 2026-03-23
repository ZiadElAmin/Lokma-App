import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import API_BASE_URL, { CONFIG } from '../config';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            await SecureStore.deleteItemAsync('userToken');
        }

        return Promise.reject(error);
    }
);

export const setAuthToken = async (token) => {
    await SecureStore.setItemAsync('userToken', token);
};

export const clearAuthToken = async () => {
    await SecureStore.deleteItemAsync('userToken');
};

export default api;
