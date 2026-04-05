import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, Redirect, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

const WelcomeScreen = () => {
    const router = useRouter();
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b35" />
            </View>
        );
    }

    if (user) {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.heroSection}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="restaurant" size={50} color="#ff6b35" />
                    </View>
                </View>
                <Text style={styles.title}>Lokma</Text>
                <Text style={styles.subtitle}>Delicious homemade meals,{'\n'}cooked with love</Text>
            </View>

            <View style={styles.features}>
                <View style={styles.featureCard}>
                    <View style={styles.featureIcon}>
                        <Ionicons name="leaf" size={24} color="#4CAF50" />
                    </View>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>Fresh Ingredients</Text>
                        <Text style={styles.featureDesc}>Made with the freshest local ingredients</Text>
                    </View>
                </View>
                <View style={styles.featureCard}>
                    <View style={styles.featureIcon}>
                        <Ionicons name="heart" size={24} color="#E91E63" />
                    </View>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>Made with Love</Text>
                        <Text style={styles.featureDesc}>Traditional recipes from home cooks</Text>
                    </View>
                </View>
                <View style={styles.featureCard}>
                    <View style={styles.featureIcon}>
                        <Ionicons name="bicycle" size={24} color="#2196F3" />
                    </View>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>Fast Delivery</Text>
                        <Text style={styles.featureDesc}>Quick and reliable to your door</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Link href="/login" asChild style={styles.fullWidth}>
                    <TouchableOpacity style={styles.loginBtn}>
                        <Text style={styles.loginBtnText}>Sign In</Text>
                    </TouchableOpacity>
                </Link>
                <Link href="/signup" asChild style={styles.fullWidth}>
                    <TouchableOpacity style={styles.signupBtn}>
                        <Text style={styles.signupBtnText}>Create Account</Text>
                    </TouchableOpacity>
                </Link>
                <Text style={styles.termsText}>By continuing, you agree to our Terms of Service</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 24,
    },
    heroSection: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 32,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff5f0',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ff6b35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    features: {
        flex: 1,
        paddingTop: 20,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fafafa',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 13,
        color: '#888',
        lineHeight: 18,
    },
    footer: {
        paddingVertical: 24,
    },
    fullWidth: {
        width: '100%',
    },
    loginBtn: {
        backgroundColor: '#ff6b35',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#ff6b35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    signupBtn: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#1a1a1a',
        marginBottom: 16,
    },
    signupBtnText: {
        color: '#1a1a1a',
        fontSize: 17,
        fontWeight: '600',
    },
    termsText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
});

export default WelcomeScreen;
