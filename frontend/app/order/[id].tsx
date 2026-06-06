import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { io } from 'socket.io-client';
import ordersApi from '../../api/orders';
import { useAuth } from '../../hooks/useAuth';
import API_BASE_URL from '../../config';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

const OrderDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const [riderLocation, setRiderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await ordersApi.getOrderById(id);
                setOrder(data);
                // Connect to socket if order is picked up / on the way
                if (data.isPickedUp && !data.isDelivered) {
                    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
                    socketRef.current.emit('join_order', id);
                    socketRef.current.on('location_update', (loc: any) => {
                        setRiderLocation(loc);
                    });
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load order');
            }
            setLoading(false);
        };
        fetchOrder();
        return () => {
            socketRef.current?.disconnect();
        };
    }, [id]);

    const getStatusColor = (order: any) => {
        if (order.isDelivered) return '#4CAF50';
        if (order.isPickedUp) return '#9C27B0';
        if (order.isReadyForPickup) return '#009688';
        if (order.isAccepted) return '#2196F3';
        if (order.isRejected) return '#f44336';
        if (order.isPaid) return '#FF9800';
        return '#999';
    };

    const getStatusText = (order: any) => {
        if (order.isDelivered) return '✅ Delivered';
        if (order.isPickedUp) return '🛵 Rider on the way';
        if (order.isReadyForPickup) return '🍱 Ready — awaiting rider';
        if (order.isAccepted) return '👨‍🍳 Being prepared';
        if (order.isRejected) return '❌ Rejected';
        if (order.isPaid) return '⏳ Waiting for cook';
        return '💳 Pending Payment';
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b35" />
            </View>
        );
    }

    if (error || !order) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={60} color="#ff6b35" />
                <Text style={styles.errorText}>{error || 'Order not found'}</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: `Order #${order.id.slice(-6).toUpperCase()}` }} />
            <ScrollView style={styles.container}>
                <View style={styles.statusCard}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order) }]}>
                        <Text style={styles.statusText}>{getStatusText(order)}</Text>
                    </View>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                </View>

                {/* Live Map — only visible when rider is on the way */}
                {order.isPickedUp && !order.isDelivered && (
                    <View style={styles.mapSection}>
                        <Text style={styles.sectionTitle}>🛵 Rider Location</Text>
                        {riderLocation ? (
                            <MapView
                                style={styles.map}
                                provider={PROVIDER_GOOGLE}
                                region={{
                                    latitude: riderLocation.latitude,
                                    longitude: riderLocation.longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                            >
                                <Marker
                                    coordinate={riderLocation}
                                    title="Your Rider"
                                    description="On the way to you"
                                >
                                    <View style={styles.riderMarker}>
                                        <Ionicons name="bicycle" size={20} color="#fff" />
                                    </View>
                                </Marker>
                            </MapView>
                        ) : (
                            <View style={styles.mapPlaceholder}>
                                <ActivityIndicator color="#ff6b35" />
                                <Text style={styles.mapWaiting}>Waiting for rider location...</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Address</Text>
                    <View style={styles.addressCard}>
                        <Ionicons name="location" size={24} color="#ff6b35" />
                        <Text style={styles.address}>{order.shippingAddress}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Items</Text>
                    {order.orderItems?.map((item, index) => (
                        <View key={item.id || index} style={styles.itemCard}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemQty}>Qty: {item.qty}</Text>
                            </View>
                            <Text style={styles.itemPrice}>EGP {(item.price * item.qty).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Summary</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>EGP {order.itemsPrice?.toFixed(2) || '0.00'}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax</Text>
                            <Text style={styles.summaryValue}>EGP {order.taxPrice?.toFixed(2) || '0.00'}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Delivery</Text>
                            <Text style={styles.summaryValue}>EGP {order.shippingPrice?.toFixed(2) || '0.00'}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>EGP {order.totalPrice?.toFixed(2) || '0.00'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <View style={styles.paymentCard}>
                        <Ionicons name="card" size={24} color="#666" />
                        <Text style={styles.paymentMethod}>{order.paymentMethod}</Text>
                    </View>
                </View>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    statusCard: {
        backgroundColor: '#fff',
        padding: 20,
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    orderDate: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 12,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
    },
    address: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
    },
    itemQty: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    summaryCard: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        color: '#333',
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        marginBottom: 0,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ff6b35',
    },
    paymentCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f8f9fa', padding: 16, borderRadius: 8,
    },
    paymentMethod: { marginLeft: 12, fontSize: 15, color: '#333' },
    mapSection: { backgroundColor: '#fff', marginTop: 12, padding: 16 },
    map: { width: '100%', height: 220, borderRadius: 12, marginTop: 8 },
    mapPlaceholder: {
        height: 120, justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#f8f9fa', borderRadius: 12, marginTop: 8, gap: 8,
    },
    mapWaiting: { fontSize: 14, color: '#888' },
    riderMarker: {
        backgroundColor: '#ff6b35', borderRadius: 20, padding: 6,
        borderWidth: 2, borderColor: '#fff',
    },
});

export default OrderDetailScreen;
