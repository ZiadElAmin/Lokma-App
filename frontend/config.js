import { Platform } from 'react-native';

const getApiUrl = () => {
    if (Platform.OS === 'web') {
        return 'http://localhost:3000/api';
    }
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000/api';
    }
    return 'http://192.168.100.106:3000/api';
};

const API_BASE_URL = getApiUrl();

export const CONFIG = {
    API_BASE_URL,
    TIMEOUT: 15000,
};

export default API_BASE_URL;
