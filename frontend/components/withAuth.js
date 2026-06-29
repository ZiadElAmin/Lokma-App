import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

const withAuth = (WrappedComponent) => {
    return function ProtectedRoute(props) {
        const { user, loading } = useAuth();

        useEffect(() => {
            if (!loading && !user) {
            }
        }, [loading, user]);

        if (loading) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                    <ActivityIndicator size="large" color="#ff6b35" />
                </View>
            );
        }

        if (!user) {
            return <Redirect href="/login" />;
        }

        return <WrappedComponent {...props} />;
    };
};

export default withAuth;
