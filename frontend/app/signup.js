import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import API_BASE_URL from '../config';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '458326856465-j1jglm3t96ekrbjd9oir7gis0j55hh13.apps.googleusercontent.com';

const SignupScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Customer');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { login, googleLogin } = useAuth();

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_CLIENT_ID,
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            handleGoogleSignup(authentication.accessToken);
        }
    }, [response]);

    const handleGoogleSignup = async (accessToken) => {
        setLoading(true);
        try {
            const data = await googleLogin(accessToken);
            if (data.isNewUser) {
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

    const handleSignup = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, password, role }),
            });
            const data = await response.json();

            if (response.ok) {
                await login(email, password);
                router.replace('/(tabs)');
            } else {
                Alert.alert('Signup Failed', data.message || 'Email may already be in use');
            }
        } catch (error) {
            Alert.alert('Signup Failed', 'Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Sign up to get started</Text>
                    </View>

                    <View style={styles.form}>
                        <TouchableOpacity
                            style={[styles.googleBtn, (loading || !request) && styles.btnDisabled]}
                            onPress={() => promptAsync()}
                            disabled={loading || !request}
                        >
                            <Text style={styles.googleIcon}>G</Text>
                            <Text style={styles.googleBtnText}>Sign up with Google</Text>
                        </TouchableOpacity>

                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or sign up with email</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor="#999"
                            />
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
                            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password (min. 6 characters)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.roleLabel}>I am a:</Text>
                        <View style={styles.roleContainer}>
                            {['Customer', 'Cook', 'Rider'].map((r) => (
                                <TouchableOpacity
                                    key={r}
                                    style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                                    onPress={() => setRole(r)}
                                >
                                    <Ionicons
                                        name={r === 'Customer' ? 'person' : r === 'Cook' ? 'restaurant' : 'bicycle'}
                                        size={20}
                                        color={role === r ? '#fff' : '#666'}
                                    />
                                    <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>{r}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.signupBtn, loading && styles.signupBtnDisabled]}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.signupBtnText}>Create Account</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <Link href="/login" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.loginLink}>Sign In</Text>
                                </TouchableOpacity>
                            </Link>
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
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 28 },
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
    roleLabel: { fontSize: 16, color: '#333', marginBottom: 12, marginTop: 4 },
    roleContainer: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    roleBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        padding: 14, borderRadius: 12, backgroundColor: '#f8f9fa',
        borderWidth: 2, borderColor: '#eee', gap: 6,
    },
    roleBtnActive: { backgroundColor: '#ff6b35', borderColor: '#ff6b35' },
    roleBtnText: { fontSize: 13, fontWeight: '600', color: '#666' },
    roleBtnTextActive: { color: '#fff' },
    signupBtn: {
        backgroundColor: '#ff6b35', borderRadius: 12,
        padding: 16, alignItems: 'center',
    },
    signupBtnDisabled: { backgroundColor: '#ccc' },
    signupBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { fontSize: 14, color: '#666' },
    loginLink: { fontSize: 14, color: '#ff6b35', fontWeight: '600' },
});

export default SignupScreen;
