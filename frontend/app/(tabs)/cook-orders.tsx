import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    RefreshControl, TouchableOpacity, Alert, Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ordersApi from '../../api/orders';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';

const CookOrdersScreen = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { subscribe } = useSocket();
    const [orders, setOrders] = useState<any>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<any>(null);

    const fetchOrders = async () => {
        try {
            setError(null);
            const data = await ordersApi.getCookOrders();
            setOrders(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load orders');
        }
        setLoading(false);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    useEffect(() => {
        if (!subscribe) return;
        const unsubscribe = subscribe(({ orderId, status }) => {
            if (status === 'cancelled') {
                setOrders(prev => prev.filter(o => o.id !== orderId));
            } else if (status === 'compliance_due') {
                setOrders(prev => prev.map(o =>
                    o.id === orderId ? { ...o, complianceReminderSent: true } : o
                ));
            }
        });
        return unsubscribe;
    }, [subscribe]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const handleRejectOrder = (orderId: string) => {
        Alert.alert(
            'Reject Order',
            'Are you sure you want to reject this order?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await ordersApi.rejectOrder(orderId);
                            fetchOrders();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to reject order');
                        }
                    },
                },
            ]
        );
    };

    const handleMarkReady = async (orderId: string) => {
        try {
            await ordersApi.markOrderReady(orderId);
            fetchOrders();
        } catch (err) {
            Alert.alert('Error', 'Failed to mark order as ready');
        }
    };

    const getStatusText = (order: any) => {
        if (order.isDelivered) return 'Delivered';
        if (order.isPickedUp) return 'With Rider';
        if (order.isRejected) return 'Rejected';
        if (order.isReadyForPickup) return 'Ready for Pickup';
        if (order.isAccepted) return 'Accepted';
        return 'New Order';
    };

    const getStatusColor = (order: any) => {
        if (order.isDelivered) return '#4CAF50';
        if (order.isPickedUp) return '#9C27B0';
        if (order.isRejected) return '#f44336';
        if (order.isReadyForPickup) return '#009688';
        if (order.isAccepted) return '#2196F3';
        return '#FF9800';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (user?.role !== 'Cook' && user?.role !== 'Admin') {
        return (
            <View style={styles.accessDenied}>
                <Ionicons name="lock-closed" size={64} color="#ccc" />
                <Text style={styles.accessDeniedText}>Access Denied</Text>
                <Text style={styles.accessDeniedSubtext}>This section is for cooks only</Text>
            </View>
        );
    }

    if (loading) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#ff6b35" /></View>;
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={60} color="#ff6b35" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
                    <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (orders.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Incoming Orders</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No orders yet</Text>
                    <Text style={styles.emptySubtext}>New orders will appear here</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Incoming Orders</Text>
                <Text style={styles.headerSubtitle}>{orders.length} orders</Text>
            </View>
            <FlatList
                data={orders}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} />}
                renderItem={({ item }) => (
                    <View style={styles.orderCard}>
                        <View style={styles.orderHeader}>
                            <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
                                <Text style={styles.statusText}>{getStatusText(item)}</Text>
                            </View>
                        </View>
                        <Text style={styles.customerName}>
                            <Ionicons name="person-outline" size={13} color="#666" /> {item.user?.name}
                        </Text>
                        {item.user?.phone && (
                            <TouchableOpacity
                                style={styles.phoneRow}
                                onPress={() => Linking.openURL(`tel:${item.user.phone}`)}
                            >
                                <Ionicons name="call-outline" size={13} color="#4CAF50" />
                                <Text style={styles.phoneText}>{item.user.phone}</Text>
                                <Text style={styles.callLabel}>Tap to call</Text>
                            </TouchableOpacity>
                        )}
                        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                        <View style={styles.itemsList}>
                            {item.orderItems?.map((orderItem: any) => (
                                <View key={orderItem.id}>
                                    <Text style={styles.itemText}>
                                        • {orderItem.qty}x {orderItem.name} — EGP {orderItem.price.toFixed(2)}
                                    </Text>
                                    {orderItem.note ? (
                                        <Text style={{ fontSize: 12, color: '#ff6b35', fontStyle: 'italic', marginLeft: 12, marginBottom: 2 }}>
                                            📝 {orderItem.note}
                                        </Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                        <View style={styles.orderFooter}>
                            <Text style={styles.orderTotal}>EGP {item.totalPrice.toFixed(2)}</Text>
                            {!item.isAccepted && !item.isRejected ? (
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={styles.rejectBtn}
                                        onPress={() => handleRejectOrder(item.id)}
                                    >
                                        <Ionicons name="close-circle-outline" size={16} color="#fff" />
                                        <Text style={styles.rejectBtnText}>Reject</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.acceptBtn}
                                        onPress={() => router.push(`/ai-verify?orderId=${item.id}`)}
                                    >
                                        <Ionicons name="camera-outline" size={16} color="#fff" />
                                        <Text style={styles.acceptBtnText}>Accept</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : item.isAccepted && !item.isReadyForPickup ? (
                                <View style={styles.actionButtons}>
                                    {}
                                    {item.complianceReminderSent && (
                                        <TouchableOpacity
                                            style={styles.complianceBtn}
                                            onPress={() => router.push(`/ai-verify?orderId=${item.id}&mode=compliance`)}
                                        >
                                            <Ionicons name="camera-reverse-outline" size={16} color="#fff" />
                                            <Text style={styles.readyBtnText}>Re-verify</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={styles.readyBtn}
                                        onPress={() => handleMarkReady(item.id)}
                                    >
                                        <Ionicons name="bag-check-outline" size={16} color="#fff" />
                                        <Text style={styles.readyBtnText}>Ready</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : item.isReadyForPickup && item.riderId && !item.isPickedUp ? (
                                <TouchableOpacity
                                    style={styles.trackBtn}
                                    onPress={() => router.push(`/order/${item.id}`)}
                                >
                                    <Ionicons name="bicycle" size={16} color="#fff" />
                                    <Text style={styles.readyBtnText}>Track Rider</Text>
                                </TouchableOpacity>
                            ) : item.isReadyForPickup ? (
                                <View style={styles.readyBadge}>
                                    <Ionicons name="bicycle-outline" size={16} color="#fff" />
                                    <Text style={styles.readyBtnText}>Awaiting Rider</Text>
                                </View>
                            ) : (
                                <View style={styles.rejectedBadge}>
                                    <Ionicons name="close-circle" size={16} color="#fff" />
                                    <Text style={styles.rejectedText}>Rejected</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 16, marginBottom: 20 },
    retryBtn: { backgroundColor: '#ff6b35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryBtnText: { color: '#fff', fontWeight: 'bold' },
    accessDenied: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    accessDeniedText: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 16 },
    accessDeniedSubtext: { fontSize: 14, color: '#999', marginTop: 8 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#999', marginTop: 8 },
    header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a1a' },
    headerSubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
    list: { padding: 16 },
    orderCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    customerName: { fontSize: 14, color: '#666', marginBottom: 4 },
    orderDate: { fontSize: 13, color: '#999', marginBottom: 8 },
    itemsList: { marginBottom: 12 },
    itemText: { fontSize: 14, color: '#444', marginBottom: 4 },
    orderFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee',
    },
    orderTotal: { fontSize: 16, fontWeight: 'bold', color: '#ff6b35' },
    actionButtons: { flexDirection: 'row', gap: 8 },
    rejectBtn: {
        backgroundColor: '#f44336', flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6,
    },
    rejectBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    acceptBtn: {
        backgroundColor: '#ff6b35', flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6,
    },
    acceptBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    acceptedBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4,
    },
    acceptedText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    phoneRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#f0faf0', borderRadius: 8, padding: 6, marginBottom: 4,
    },
    phoneText: { fontSize: 13, color: '#4CAF50', fontWeight: '600', flex: 1 },
    callLabel: { fontSize: 11, color: '#4CAF50' },
    trackBtn: {
        backgroundColor: '#9C27B0', flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6,
    },
    readyBtn: {
        backgroundColor: '#009688', flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6,
    },
    complianceBtn: {
        backgroundColor: '#ff6b35', flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6,
    },
    readyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    readyBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#009688',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4,
    },
    rejectedBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f44336',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4,
    },
    rejectedText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});

export default CookOrdersScreen;