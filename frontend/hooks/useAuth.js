import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAuthToken, clearAuthToken, getAuthToken } from '../api/client';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

const registerForPushNotifications = async () => {
    try {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('lokma-orders', {
                name: 'Lokma Orders & Alerts',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#ff6b35',
                sound: 'default',
            });
        }
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') return null;
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        return token;
    } catch {
        return null;
    }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadUser = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getAuthToken();

            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            const response = await api.get('/users/profile');
            setUser(response.data);
            const pushToken = await registerForPushNotifications();
            if (pushToken) {
                api.put('/users/push-token', { token: pushToken }).catch(() => {});
            }
        } catch (err) {
            if (err.response?.status !== 401) {
                setError(err.message);
            }
            setUser(null);
            await clearAuthToken();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (email, password) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.post('/users/login', { email, password });
            if (response.data.token) {
                await setAuthToken(response.data.token);
                setUser(response.data);
                const pushToken = await registerForPushNotifications();
                if (pushToken) {
                    api.put('/users/push-token', { token: pushToken }).catch(() => {});
                }
            }
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const logout = useCallback(async () => {
        await clearAuthToken();
        setUser(null);
        delete api.defaults.headers.common.Authorization;
    }, []);

    const googleLogin = async (accessToken) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.post('/users/google', { accessToken });
            if (response.data.token) {
                await setAuthToken(response.data.token);
                setUser(response.data);
                const pushToken = await registerForPushNotifications();
                if (pushToken) {
                    api.put('/users/push-token', { token: pushToken }).catch(() => {});
                }
            }
            return response.data; // includes isNewUser flag
        } catch (err) {
            const message = err.response?.data?.message || 'Google sign-in failed';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const deleteAccount = async () => {
        try {
            await api.delete('/users/delete');
            await clearAuthToken();
            setUser(null);
            delete api.defaults.headers.common.Authorization;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to delete account';
            throw new Error(message);
        }
    };

    const setUserRole = async (role, phone) => {
        try {
            const response = await api.put('/users/role', { role, phone });
            setUser(prev => ({ ...prev, role: response.data.role, roleChosen: true, phone: response.data.phone ?? prev?.phone }));
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to set role';
            throw new Error(message);
        }
    };

    const updateUser = (updatedFields) => {
        setUser(prev => ({ ...prev, ...updatedFields }));
    };

    const value = {
        user,
        loading,
        error,
        login,
        googleLogin,
        logout,
        updateUser,
        setUserRole,
        deleteAccount,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'Admin',
        isCook: user?.role === 'Cook',
        isCustomer: user?.role === 'Customer',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default useAuth;
