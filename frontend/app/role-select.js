import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';

const ROLES = [
    {
        key: 'Customer',
        icon: 'person',
        title: 'Customer',
        description: 'Browse and order\nhome-cooked meals',
        color: '#4CAF50',
        bg: '#E8F5E9',
    },
    {
        key: 'Cook',
        icon: 'restaurant',
        title: 'Cook',
        description: 'Sell your home-cooked\nfood to customers',
        color: '#ff6b35',
        bg: '#FFF3EE',
    },
    {
        key: 'Rider',
        icon: 'bicycle',
        title: 'Rider',
        description: 'Pick up and deliver\norders to customers',
        color: '#2196F3',
        bg: '#E3F2FD',
    },
];

const RoleSelectScreen = () => {
    const [selected, setSelected] = useState(null);
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { setUserRole } = useAuth();

    const handleContinue = async () => {
        if (!selected) {
            Alert.alert('Choose a role', 'Please select how you want to use Lokma.');
            return;
        }
        if (phone.trim().length < 7) {
            Alert.alert('Phone number', 'Please enter a valid phone number so we can reach you about orders.');
            return;
        }
        setLoading(true);
        try {
            await setUserRole(selected, phone.trim());
            router.replace('/(tabs)');
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome to Lokma!</Text>
                    <Text style={styles.subtitle}>How will you use the app?{'\n'}You can only pick one role.</Text>
                </View>

                <View style={styles.cards}>
                    {ROLES.map((role) => {
                        const isSelected = selected === role.key;
                        return (
                            <TouchableOpacity
                                key={role.key}
                                style={[
                                    styles.card,
                                    isSelected && { borderColor: role.color, borderWidth: 2.5 },
                                ]}
                                onPress={() => setSelected(role.key)}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: role.bg }]}>
                                    <Ionicons name={role.icon} size={32} color={role.color} />
                                </View>
                                <Text style={styles.cardTitle}>{role.title}</Text>
                                <Text style={styles.cardDesc}>{role.description}</Text>
                                {isSelected && (
                                    <View style={[styles.checkBadge, { backgroundColor: role.color }]}>
                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.phoneLabel}>Your phone number</Text>
                <TextInput
                    style={styles.phoneInput}
                    placeholder="e.g. 01012345678"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholderTextColor="#aaa"
                />

                <TouchableOpacity
                    style={[styles.continueBtn, (!selected || phone.trim().length < 7) && styles.continueBtnDisabled]}
                    onPress={handleContinue}
                    disabled={loading || !selected || phone.trim().length < 7}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.continueBtnText}>
                            {selected ? `Continue as ${selected}` : 'Select a role to continue'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 24,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
    },
    cards: {
        flex: 1,
        gap: 16,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: '#fafafa',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#eee',
        position: 'relative',
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
        color: '#888',
        lineHeight: 20,
    },
    checkBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    phoneLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 8, marginBottom: 8 },
    phoneInput: {
        backgroundColor: '#fafafa', borderRadius: 12, borderWidth: 1, borderColor: '#eee',
        paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#333',
    },
    continueBtn: {
        backgroundColor: '#ff6b35',
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
        marginTop: 16,
    },
    continueBtnDisabled: {
        backgroundColor: '#ccc',
    },
    continueBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
});

export default RoleSelectScreen;
