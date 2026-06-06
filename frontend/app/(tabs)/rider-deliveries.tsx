import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    RefreshControl, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import ordersApi from '../../api/orders';
import { useAuth } from '../../hooks/useAuth';
import API_BASE_URL from '../../config';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

export default function RiderDeliveriesScreen() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const socketRef = useRef<any>(null);
    const locationSubRef = useRef<any>(null);

    // Start broadcasting location for an active delivery
    const startLocationBroadcast = async (orderId: string) => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        if (!socketRef.current) {
            socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
        }
        socketRef.current.emit('join_order', orderId);

        locationSubRef.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
            (loc) => {
                socketRef.current?.emit('rider_location', {
                    orderId,
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                });
            }
        );
    };

    const stopLocationBroadcast = () => {
        locationSubRef.current?.remove();
        locationSubRef.current = null;
        socketRef.current?.disconnect();
        socketRef.current = null;
    };

    useEffect(() => {
        return () => stopLocationBroadcast();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await ordersApi.getRiderOrders();
            setOrders(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => { fetchOrders(); }, []);

    const handlePickup = (orderId: string) => {
        Alert.alert('Confirm Pickup', 'You have collected the order from the cook?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Yes, Picked Up',
                onPress: async () => {
                    try {
                        await ordersApi.pickupOrder(orderId);
                        await startLocationBroadcast(orderId);
                        fetchOrders();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to update pickup status');
                    }
                },
            },
        ]);
    };

    const handleDeliver = (orderId: string) => {
        Alert.alert('Confirm Delivery', 'You have delivered this order to the customer?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Yes, Delivered',
                onPress: async () => {
                    try {
                        await ordersApi.deliverOrder(orderId);
                        stopLocationBroadcast();
                        fetchOrders();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to update delivery status');
                    }
                },
            },
        ]);
    };

    const getStatusText = (order: any) => {
        if (order.isDelivered) return 'Delivered';
        if (order.isPickedUp) return 'On the Way';
        return 'Go Pick Up';
    };

    const getStatusColor = (order: any) => {
        if (order.isDelivered) return '#4CAF50';
        if (order.isPickedUp) return '#9C27B0';
        return '#FF9800';
    };

    if (user?.role !== 'Rider' && user?.role !== 'Admin') {
        return (
            <View style={styles.center}>
                <Ionicons name="lock-closed" size={64} color="#ccc" />
                <Text style={styles.accessDeniedText}>Riders Only</Text>
            </View>
        );
    }

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#ff6b35" /></View>;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Deliveries</Text>
                <Text style={styles.headerSubtitle}>{orders.length} total</Text>
            </View>

            {orders.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="cube-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No deliveries yet</Text>
                    <Text style={styles.emptySubtext}>Claim orders from Available tab</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={['#ff6b35']} />}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
                                <View style={[styles.badge, { backgroundColor: getStatusColor(item) }]}>
                                    <Text style={styles.badgeText}>{getStatusText(item)}</Text>
                                </View>
                            </View>

                            <View style={styles.row}>
                                <Ionicons name="person-outline" size={14} color="#666" />
                                <Text style={styles.detail}>{item.user?.name}</Text>
                            </View>
                            <View style={styles.row}>
                                <Ionicons name="location-outline" size={14} color="#666" />
                                <Text style={styles.detail} numberOfLines={2}>{item.shippingAddress}</Text>
                            </View>

                            <View style={styles.itemsList}>
                                {item.orderItems?.map((oi: any) => (
                                    <Text key={oi.id} style={styles.itemText}>• {oi.qty}x {oi.name}</Text>
                                ))}
                            </View>

                            <View style={styles.cardFooter}>
                                <Text style={styles.price}>EGP {item.totalPrice.toFixed(2)}</Text>
                                {!item.isPickedUp && !item.isDelivered && (
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handlePickup(item.id)}>
                                        <Ionicons name="bag-check-outline" size={16} color="#fff" />
                                        <Text style={styles.actionBtnText}>Mark Picked Up</Text>
                                    </TouchableOpacity>
                                )}
                                {item.isPickedUp && !item.isDelivered && (
                                    <TouchableOpacity style={[styles.actionBtn, styles.deliverBtn]} onPress={() => handleDeliver(item.id)}>
                                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                                        <Text style={styles.actionBtnText}>Mark Delivered</Text>
                                    </TouchableOpacity>
                                )}
                                {item.isDelivered && (
                                    <View style={styles.doneBadge}>
                                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                        <Text style={styles.actionBtnText}>Done</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    accessDeniedText: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 16 },
    header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a1a' },
    headerSubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
    list: { padding: 16 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
    detail: { fontSize: 14, color: '#555', flex: 1 },
    itemsList: { marginTop: 8, marginBottom: 12 },
    itemText: { fontSize: 13, color: '#444', marginBottom: 2 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
    price: { fontSize: 16, fontWeight: 'bold', color: '#ff6b35' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#9C27B0', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, gap: 6 },
    deliverBtn: { backgroundColor: '#4CAF50' },
    doneBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, gap: 6 },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    emptyText: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#999', marginTop: 8 },
});
