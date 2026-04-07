import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ordersApi from '../api/orders';
import withAuth from '../components/withAuth';

const MyOrdersScreen = () => {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        try {
            setError(null);
            const data = await ordersApi.getMyOrders();
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

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusColor = (order) => {
        if (order.isRejected) return '#f44336';
        if (order.isDelivered) return '#4CAF50';
        if (order.isAccepted) return '#2196F3';
        if (order.isPaid) return '#FF9800';
        return '#999';
    };

    const getStatusText = (order) => {
        if (order.isRejected) return 'Rejected';
        if (order.isDelivered) return 'Delivered';
        if (order.isAccepted) return 'Preparing';
        if (order.isPaid) return 'Paid';
        return 'Pending';
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

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
            <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={80} color="#ccc" />
                <Text style={styles.emptyText}>No orders yet</Text>
                <Text style={styles.emptySubtext}>Your orders will appear here</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Orders</Text>
            <FlatList
                data={orders}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} />}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.orderCard} onPress={() => router.push(`/order/${item.id}`)}>
                        <View style={styles.orderHeader}>
                            <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
                                <Text style={styles.statusText}>{getStatusText(item)}</Text>
                            </View>
                        </View>
                        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                        {item.isRejected && (
                            <Text style={styles.rejectedNote}>
                                ❌ This order was rejected by the cook.
                            </Text>
                        )}
                        <View style={styles.orderFooter}>
                            <Text style={styles.orderTotal}>EGP {item.totalPrice.toFixed(2)}</Text>
                            <Text style={styles.orderItems}>{item.orderItems?.length || 0} items</Text>
                            <Ionicons name="chevron-forward" size={20} color="#999" />
                        </View>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 16, marginBottom: 20 },
    retryBtn: { backgroundColor: '#ff6b35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryBtnText: { color: '#fff', fontWeight: 'bold' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#999', marginTop: 8 },
    title: { fontSize: 28, fontWeight: 'bold', padding: 20, backgroundColor: '#fff', color: '#333' },
    list: { padding: 16 },
    orderCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    orderDate: { fontSize: 13, color: '#666', marginBottom: 12 },
    rejectedNote: { fontSize: 13, color: '#f44336', marginBottom: 8, fontStyle: 'italic' },
    orderFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee',
    },
    orderTotal: { fontSize: 18, fontWeight: 'bold', color: '#ff6b35' },
    orderItems: { fontSize: 14, color: '#666' },
});

export default withAuth(MyOrdersScreen);