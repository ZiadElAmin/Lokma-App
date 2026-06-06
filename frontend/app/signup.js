import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import API_BASE_URL from '../config';

const SignupScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Customer');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

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
                body: JSON.stringify({ name, email, password, role }),
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

                    <Text style={styles.roleLabel}>I am a:</Text>
                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'Customer' && styles.roleBtnActive]}
                            onPress={() => setRole('Customer')}
                        >
                            <Ionicons name="person" size={24} color={role === 'Customer' ? '#fff' : '#666'} />
                            <Text style={[styles.roleBtnText, role === 'Customer' && styles.roleBtnTextActive]}>Customer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'Cook' && styles.roleBtnActive]}
                            onPress={() => setRole('Cook')}
                        >
                            <Ionicons name="restaurant" size={24} color={role === 'Cook' ? '#fff' : '#666'} />
                            <Text style={[styles.roleBtnText, role === 'Cook' && styles.roleBtnTextActive]}>Cook</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'Rider' && styles.roleBtnActive]}
                            onPress={() => setRole('Rider')}
                        >
                            <Ionicons name="bicycle" size={24} color={role === 'Rider' ? '#fff' : '#666'} />
                            <Text style={[styles.roleBtnText, role === 'Rider' && styles.roleBtnTextActive]}>Rider</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.signupBtn, loading && styles.signupBtnDisabled]} onPress={handleSignup} disabled={loading}>
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
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#333',
    },
    eyeBtn: {
        padding: 4,
    },
    roleLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
        marginTop: 8,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    roleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        borderWidth: 2,
        borderColor: '#eee',
        gap: 8,
    },
    roleBtnActive: {
        backgroundColor: '#ff6b35',
        borderColor: '#ff6b35',
    },
    roleBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    roleBtnTextActive: {
        color: '#fff',
    },
    signupBtn: {
        backgroundColor: '#ff6b35',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    signupBtnDisabled: {
        backgroundColor: '#ccc',
    },
    signupBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 14,
        color: '#666',
    },
    loginLink: {
        fontSize: 14,
        color: '#ff6b35',
        fontWeight: '600',
    },
});

export default SignupScreen;

