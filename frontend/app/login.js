import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const GOOGLE_WEB_CLIENT_ID = '458326856465-j1jglm3t96ekrbjd9oir7gis0j55hh13.apps.googleusercontent.com';

try { GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID }); } catch (e) { }

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { login, googleLogin } = useAuth();

    const onGooglePress = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            await GoogleSignin.signOut();
            await GoogleSignin.signIn();
            const { accessToken } = await GoogleSignin.getTokens();
            handleGoogleLogin(accessToken);
        } catch (e) {
            if (e?.code !== statusCodes.SIGN_IN_CANCELLED) {
                Alert.alert('Google Sign-In Failed', e?.message || 'Please try again.');
            }
        }
    };

    const handleGoogleLogin = async (accessToken) => {
        setLoading(true);
        try {
            const data = await googleLogin(accessToken);
            if (!data.roleChosen) {
                router.replace('/role-select');
            } else {
                router.replace('/(tabs)');
            }
        } catch (error) {
            Alert.alert('Google Sign-In Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            const data = await login(email, password);
            router.replace(data?.roleChosen === false ? '/role-select' : '/(tabs)');
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Connection failed';
            Alert.alert('Login Failed', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Sign in to continue</Text>
                        </View>

                        <View style={styles.form}>
                            <TouchableOpacity
                                style={[styles.googleBtn, loading && styles.btnDisabled]}
                                onPress={onGooglePress}
                                disabled={loading}
                            >
                                <Text style={styles.googleIcon}>G</Text>
                                <Text style={styles.googleBtnText}>Continue with Google</Text>
                            </TouchableOpacity>

                            <View style={styles.dividerRow}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>or sign in with email</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor="#999"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.loginBtnText}>Sign In</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Don't have an account? </Text>
                                <Link href="/signup" asChild>
                                    <TouchableOpacity>
                                        <Text style={styles.signupLink}>Sign Up</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    content: { flex: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 16, color: '#666', marginTop: 8 },
    form: { width: '100%' },
    googleBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', borderRadius: 12, padding: 14,
        borderWidth: 1.5, borderColor: '#ddd', gap: 10, marginBottom: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    btnDisabled: { opacity: 0.5 },
    googleIcon: { fontSize: 18, fontWeight: 'bold', color: '#4285F4' },
    googleBtnText: { fontSize: 16, fontWeight: '600', color: '#333' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#eee' },
    dividerText: { fontSize: 13, color: '#999' },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f8f9fa', borderRadius: 12,
        marginBottom: 16, paddingHorizontal: 16,
        borderWidth: 1, borderColor: '#eee',
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#333' },
    eyeBtn: { padding: 4 },
    loginBtn: {
        backgroundColor: '#ff6b35', borderRadius: 12,
        padding: 16, alignItems: 'center', marginTop: 4,
    },
    loginBtnDisabled: { backgroundColor: '#ccc' },
    loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { fontSize: 14, color: '#666' },
    signupLink: { fontSize: 14, color: '#ff6b35', fontWeight: '600' },
});

export default LoginScreen;
