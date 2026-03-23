import { Platform } from 'react-native';

const getApiUrl = () => {
    if (Platform.OS === 'web') {
        return '/api';
    }
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5000/api';
    }
    return 'http://192.168.100.11:5000/api';
};

const API_BASE_URL = getApiUrl();

export const CONFIG = {
    API_BASE_URL,
    TIMEOUT: 15000,
};

export default API_BASE_URL;
