import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = () => {
    const router = useRouter();
    const { user, logout, deleteAccount } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This will permanently delete your account and all your data. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Forever',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAccount();
                        } catch (e: any) {
                            Alert.alert('Error', e.message);
                        }
                    },
                },
            ]
        );
    };

    const menuItems = [
        { icon: 'person-outline', label: 'My Profile', onPress: () => router.push('/edit-profile') },
        { icon: 'receipt-outline', label: 'My Orders', onPress: () => router.push('/my-orders') },
        { icon: 'location-outline', label: 'Delivery Addresses', onPress: () => router.push('/addresses') },
        { icon: 'card-outline', label: 'Payment Methods', onPress: () => {} },
    ];

    const adminMenuItems = [
        { icon: 'shield-checkmark-outline', label: 'Admin Panel', onPress: () => router.push('/admin'), color: '#e91e63' },
    ];

    const cookMenuItems = [
        { icon: 'restaurant-outline', label: 'My Kitchen', onPress: () => router.push('/(tabs)/cook'), color: '#ff9800' },
    ];

    const getRoleBadgeStyle = () => {
        if (user?.role === 'Admin') return { backgroundColor: '#fce4ec', textColor: '#e91e63' };
        if (user?.role === 'Cook') return { backgroundColor: '#fff3e0', textColor: '#ff9800' };
        return { backgroundColor: '#fff5f0', textColor: '#ff6b35' };
    };

    const roleStyle = getRoleBadgeStyle();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/edit-profile')} style={styles.avatarWrapper}>
                    {user?.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={40} color="#fff" />
                        </View>
                    )}
                    <View style={styles.editBadge}>
                        <Ionicons name="camera" size={12} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.name}>{user?.name || 'User'}</Text>
                <Text style={styles.email}>{user?.email || ''}</Text>
                <View style={[styles.roleBadge, { backgroundColor: roleStyle.backgroundColor }]}>
                    <Text style={[styles.roleText, { color: roleStyle.textColor }]}>{user?.role || 'Customer'}</Text>
                </View>
            </View>

            {(user?.role === 'Admin' || user?.role === 'Cook') && (
                <View style={styles.menuContainer}>
                    {user?.role === 'Admin' && adminMenuItems.map((item, index) => (
                        <TouchableOpacity key={`admin-${index}`} style={styles.menuItem} onPress={item.onPress}>
                            <View style={styles.menuLeft}>
                                <Ionicons name={item.icon} size={22} color={item.color} />
                                <Text style={[styles.menuLabel, { color: item.color }]}>{item.label}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    ))}
                    {user?.role === 'Cook' && cookMenuItems.map((item, index) => (
                        <TouchableOpacity key={`cook-${index}`} style={styles.menuItem} onPress={item.onPress}>
                            <View style={styles.menuLeft}>
                                <Ionicons name={item.icon} size={22} color={item.color} />
                                <Text style={[styles.menuLabel, { color: item.color }]}>{item.label}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.menuContainer}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
                        <View style={styles.menuLeft}>
                            <Ionicons name={item.icon} size={22} color="#666" />
                            <Text style={styles.menuLabel}>{item.label}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#ff4444" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
                <Ionicons name="trash-outline" size={20} color="#c00" />
                <Text style={styles.deleteText}>Delete Account</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Version 1.0.0</Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#fff',
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ff6b35',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    roleBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    menuContainer: {
        backgroundColor: '#fff',
        marginTop: 16,
        paddingHorizontal: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: 16,
        color: '#333',
        marginLeft: 16,
    },
    avatarWrapper: { position: 'relative', marginBottom: 16 },
    avatarImage: { width: 80, height: 80, borderRadius: 40 },
    editBadge: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#ff6b35', width: 22, height: 22,
        borderRadius: 11, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#fff',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginTop: 16,
        paddingVertical: 16,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ff4444',
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    deleteText: {
        fontSize: 14,
        color: '#c00',
    },
    version: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        marginTop: 8,
    },
});

export default ProfileScreen;
