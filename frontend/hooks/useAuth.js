import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAuthToken, clearAuthToken } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadUser = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await api.defaults.headers.common.Authorization?.split(' ')[1];
            
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            const response = await api.get('/users/profile');
            setUser(response.data);
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

    const value = {
        user,
        loading,
        error,
        login,
        logout,
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
