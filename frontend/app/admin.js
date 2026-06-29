import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import adminApi from '../api/admin';
import withAuth from '../components/withAuth';

const AdminPanel = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('stats');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [cooks, setCooks] = useState([]);
    const [riders, setRiders] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (user?.role === 'Admin') {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [statsData, usersData, cooksData, ridersData, ordersData] = await Promise.all([
                adminApi.getStats(),
                adminApi.getAllUsers(),
                adminApi.getAllCooks(),
                adminApi.getAllRiders(),
                adminApi.getAllOrders(),
            ]);
            setStats(statsData);
            setUsers(usersData);
            setCooks(cooksData);
            setRiders(ridersData);
            setOrders(ordersData);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleDeleteUser = (userItem) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to delete "${userItem.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await adminApi.deleteUser(userItem.id);
                            fetchData();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete user');
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteOrder = (order) => {
        Alert.alert(
            'Delete Order',
            `Are you sure you want to delete order #${order.id.slice(-6).toUpperCase()}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await adminApi.deleteOrder(order.id);
                            fetchData();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete order');
                        }
                    },
                },
            ]
        );
    };

    const handleToggleDisable = (cook) => {
        const disabling = !cook.isDisabled;
        Alert.alert(
            disabling ? 'Disable Cook' : 'Re-enable Cook',
            disabling
                ? `Disable "${cook.name}"? They won't be able to go online or accept orders.`
                : `Re-enable "${cook.name}"? This also resets their violation count to 0.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: disabling ? 'Disable' : 'Enable',
                    style: disabling ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            if (disabling) await adminApi.disableUser(cook.id);
                            else await adminApi.enableUser(cook.id);
                            fetchData();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to update cook status');
                        }
                    },
                },
            ]
        );
    };

    const handleUpdateOrderStatus = (order, isPaid, isDelivered) => {
        Alert.alert(
            'Update Order Status',
            `Update order #${order.id.slice(-6).toUpperCase()}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: async () => {
                        try {
                            await adminApi.updateOrderStatus(order.id, isPaid, isDelivered);
                            fetchData();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to update order');
                        }
                    },
                },
            ]
        );
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'Cook': return '#fff3e0';
            case 'Rider': return '#f3e5f5';
            case 'Admin': return '#fce4ec';
            default: return '#e3f2fd';
        }
    };

    const getStatusColor = (isPaid, isDelivered) => {
        if (isDelivered) return '#4CAF50';
        if (isPaid) return '#2196F3';
        return '#FF9800';
    };

    const getStatusText = (isPaid, isDelivered) => {
        if (isDelivered) return 'Delivered';
        if (isPaid) return 'Preparing';
        return 'Pending';
    };

    if (user?.role !== 'Admin') {
        return (
            <View style={styles.accessDenied}>
                <Ionicons name="lock-closed" size={64} color="#ccc" />
                <Text style={styles.accessDeniedText}>Admin Access Only</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b35" />
            </View>
        );
    }

    const tabs = [
        { key: 'stats', label: 'Overview', icon: 'analytics' },
        { key: 'users', label: 'Users', icon: 'people' },
        { key: 'cooks', label: 'Cooks', icon: 'restaurant' },
        { key: 'riders', label: 'Riders', icon: 'bicycle' },
        { key: 'orders', label: 'Orders', icon: 'receipt' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'stats':
                return (
                    <View style={styles.statsContainer}>
                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
                                <Ionicons name="people" size={28} color="#2196F3" />
                                <Text style={styles.statValue}>{stats?.userCount || 0}</Text>
                                <Text style={styles.statLabel}>Customers</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
                                <Ionicons name="restaurant" size={28} color="#ff9800" />
                                <Text style={styles.statValue}>{stats?.cookCount || 0}</Text>
                                <Text style={styles.statLabel}>Cooks</Text>
                            </View>
                        </View>
                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, { backgroundColor: '#f3e5f5' }]}>
                                <Ionicons name="bicycle" size={28} color="#9C27B0" />
                                <Text style={styles.statValue}>{stats?.riderCount || 0}</Text>
                                <Text style={styles.statLabel}>Riders</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: '#fce4ec' }]}>
                                <Ionicons name="receipt" size={28} color="#e91e63" />
                                <Text style={styles.statValue}>{stats?.orderCount || 0}</Text>
                                <Text style={styles.statLabel}>Orders</Text>
                            </View>
                        </View>
                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
                                <Ionicons name="fast-food" size={28} color="#4CAF50" />
                                <Text style={styles.statValue}>{stats?.mealCount || 0}</Text>
                                <Text style={styles.statLabel}>Meals</Text>
                            </View>
                        </View>
                        <View style={styles.revenueCard}>
                            <Text style={styles.revenueLabel}>Total Revenue</Text>
                            <Text style={styles.revenueValue}>EGP {(stats?.totalRevenue || 0).toFixed(2)}</Text>
                        </View>
                    </View>
                );

            case 'users':
                return (
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.id}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No users found</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.listItem}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemEmail}>{item.email}</Text>
                                </View>
                                <View style={styles.itemActions}>
                                    <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
                                        <Text style={styles.roleBadgeText}>{item.role}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteUser(item)}>
                                        <Ionicons name="trash" size={18} color="#ff4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                );

            case 'cooks':
                return (
                    <FlatList
                        data={cooks}
                        keyExtractor={(item) => item.id}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No cooks found</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.listItem}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemEmail}>{item.email}</Text>
                                    <View style={styles.cookMetaRow}>
                                        <View style={[styles.violationPill, { backgroundColor: (item.violationCount || 0) >= 5 ? '#ffebee' : (item.violationCount || 0) > 0 ? '#fff3e0' : '#e8f5e9' }]}>
                                            <Ionicons name="warning-outline" size={12} color={(item.violationCount || 0) >= 5 ? '#f44336' : (item.violationCount || 0) > 0 ? '#ff9800' : '#4CAF50'} />
                                            <Text style={styles.violationPillText}>{item.violationCount || 0} violations</Text>
                                        </View>
                                        {item.isDisabled && (
                                            <View style={styles.disabledPill}>
                                                <Text style={styles.disabledPillText}>DISABLED</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[styles.statusToggleBtn, { backgroundColor: item.isDisabled ? '#e8f5e9' : '#ffebee' }]}
                                    onPress={() => handleToggleDisable(item)}
                                >
                                    <Ionicons
                                        name={item.isDisabled ? 'lock-open-outline' : 'lock-closed-outline'}
                                        size={16}
                                        color={item.isDisabled ? '#4CAF50' : '#f44336'}
                                    />
                                    <Text style={[styles.statusToggleText, { color: item.isDisabled ? '#4CAF50' : '#f44336' }]}>
                                        {item.isDisabled ? 'Enable' : 'Disable'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                );

            case 'riders':
                return (
                    <FlatList
                        data={riders}
                        keyExtractor={(item) => item.id}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No riders found</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.listItem}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemEmail}>{item.email}</Text>
                                </View>
                                <View style={styles.itemActions}>
                                    <View style={[styles.roleBadge, { backgroundColor: '#f3e5f5' }]}>
                                        <Ionicons name="bicycle" size={14} color="#9C27B0" />
                                        <Text style={[styles.roleBadgeText, { color: '#9C27B0' }]}>Rider</Text>
                                    </View>
                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteUser(item)}>
                                        <Ionicons name="trash" size={18} color="#ff4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                );

            case 'orders':
                return (
                    <FlatList
                        data={orders}
                        keyExtractor={(item) => item.id}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No orders found</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.orderCard}>
                                <View style={styles.orderHeader}>
                                    <Text style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.isPaid, item.isDelivered) }]}>
                                        <Text style={styles.statusText}>{getStatusText(item.isPaid, item.isDelivered)}</Text>
                                    </View>
                                </View>
                                <Text style={styles.orderCustomer}>{item.user?.name}</Text>
                                <Text style={styles.orderTotal}>EGP {item.totalPrice.toFixed(2)} - {item.orderItems?.length || 0} items</Text>
                                <View style={styles.orderActions}>
                                    {!item.isPaid && (
                                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateOrderStatus(item, true, false)}>
                                            <Text style={styles.actionBtnText}>Mark Paid</Text>
                                        </TouchableOpacity>
                                    )}
                                    {item.isPaid && !item.isDelivered && (
                                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateOrderStatus(item, true, true)}>
                                            <Text style={styles.actionBtnText}>Mark Delivered</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteOrder(item)}>
                                        <Ionicons name="trash" size={18} color="#ff4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                );
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Admin Panel</Text>
            </View>

            <View style={styles.tabBar}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Ionicons
                            name={tab.icon}
                            size={20}
                            color={activeTab === tab.key ? '#ff6b35' : '#888'}
                        />
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {renderContent()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    accessDenied: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    accessDeniedText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1a1a1a',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#ff6b35',
    },
    tabText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    tabTextActive: {
        color: '#ff6b35',
        fontWeight: '600',
    },
    statsContainer: {
        padding: 16,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1a1a1a',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    revenueCard: {
        backgroundColor: '#ff6b35',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    revenueLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    revenueValue: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
        marginTop: 4,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    itemEmail: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    itemActions: {
        flexDirection: 'row',
        gap: 8,
    },
    cookBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    cookMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    violationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    violationPillText: { fontSize: 11, fontWeight: '600', color: '#555' },
    disabledPill: { backgroundColor: '#f44336', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    disabledPillText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    statusToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    statusToggleText: { fontSize: 12, fontWeight: '700' },
    cookBadgeText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 4,
        marginRight: 8,
    },
    roleBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#ff9800',
    },
    deleteBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ffebee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderId: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    orderCustomer: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
    },
    orderTotal: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ff6b35',
        marginTop: 4,
    },
    orderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionBtn: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionBtnText: {
        color: '#2196F3',
        fontWeight: '600',
        fontSize: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
});

export default withAuth(AdminPanel);
