import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import API_BASE_URL, { CONFIG } from '../config';

const getSecureItemAsync = async (key) => {
    if (Platform.OS === 'web') {
        return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
};

const setSecureItemAsync = async (key, value) => {
    if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
    } else {
        await SecureStore.setItemAsync(key, value);
    }
};

const deleteSecureItemAsync = async (key) => {
    if (Platform.OS === 'web') {
        localStorage.removeItem(key);
    } else {
        await SecureStore.deleteItemAsync(key);
    }
};
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
            const token = await getSecureItemAsync('userToken');
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
            await deleteSecureItemAsync('userToken');
        }

        return Promise.reject(error);
    }
);

export const setAuthToken = async (token) => {
    await setSecureItemAsync('userToken', token);
};

export const clearAuthToken = async () => {
    await deleteSecureItemAsync('userToken');
};

export const getAuthToken = async () => {
    return await getSecureItemAsync('userToken');
};

export default api;
