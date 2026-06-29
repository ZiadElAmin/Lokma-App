import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    RefreshControl, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ordersApi from '../../api/orders';
import { useAuth } from '../../hooks/useAuth';

export default function RiderAvailableScreen() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            setError(null);
            const data = await ordersApi.getAvailableOrders();
            setOrders(data);
        } catch (err) {
            setError('Failed to load available orders');
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleClaim = (orderId: string) => {
        Alert.alert(
            'Claim Order',
            'Accept this delivery?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept',
                    onPress: async () => {
                        try {
                            await ordersApi.claimOrder(orderId);
                            Alert.alert('Order claimed!', 'Go pick it up from the cook.');
                            fetchOrders();
                        } catch (err: any) {
                            const msg = err?.response?.data?.message || '';
                            if (msg.includes('already claimed')) {
                                Alert.alert('Too slow!', 'Another rider claimed this order first.');
                            } else {
                                Alert.alert('Error', 'Could not claim order. Please try again.');
                            }
                            fetchOrders();
                        }
                    },
                },
            ]
        );
    };

    if (user?.role !== 'Rider' && user?.role !== 'Admin') {
        return (
            <View style={styles.accessDenied}>
                <Ionicons name="lock-closed" size={64} color="#ccc" />
                <Text style={styles.accessDeniedText}>Riders Only</Text>
            </View>
        );
    }

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#ff6b35" /></View>;

    if (error) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle" size={60} color="#ff6b35" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
                    <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Available Deliveries</Text>
                <Text style={styles.headerSubtitle}>{orders.length} order{orders.length !== 1 ? 's' : ''} ready</Text>
            </View>

            {orders.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="bicycle-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No deliveries available</Text>
                    <Text style={styles.emptySubtext}>Pull to refresh</Text>
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
                                <View style={styles.readyBadge}>
                                    <Ionicons name="bag-check-outline" size={12} color="#fff" />
                                    <Text style={styles.badgeText}>Ready</Text>
                                </View>
                            </View>

                            <View style={styles.row}>
                                <Ionicons name="person-outline" size={14} color="#666" />
                                <Text style={styles.detail}>{item.user?.name}</Text>
                            </View>

                            {/* Cook pickup location */}
                            {(() => {
                                const cook = item.orderItems?.[0]?.meal?.cook;
                                return cook ? (
                                    <View style={styles.cookRow}>
                                        <Ionicons name="restaurant-outline" size={14} color="#ff6b35" />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.cookLabel}>Pickup from: {cook.name}</Text>
                                            {cook.cookAddress
                                                ? <Text style={styles.cookAddress}>{cook.cookAddress}</Text>
                                                : !cook.cookLat
                                                    ? <Text style={styles.cookNoLocation}>⚠️ Cook hasn't set location yet</Text>
                                                    : <Text style={styles.cookAddress}>{cook.cookLat?.toFixed(4)}, {cook.cookLng?.toFixed(4)}</Text>
                                            }
                                        </View>
                                    </View>
                                ) : null;
                            })()}

                            <View style={styles.row}>
                                <Ionicons name="location-outline" size={14} color="#666" />
                                <Text style={styles.detail} numberOfLines={2}>Deliver to: {item.shippingAddress}</Text>
                            </View>

                            <View style={styles.itemsList}>
                                {item.orderItems?.map((oi: any) => (
                                    <Text key={oi.id} style={styles.itemText}>• {oi.qty}x {oi.name}</Text>
                                ))}
                            </View>

                            <View style={styles.cardFooter}>
                                <Text style={styles.price}>EGP {item.totalPrice.toFixed(2)}</Text>
                                <TouchableOpacity style={styles.claimBtn} onPress={() => handleClaim(item.id)}>
                                    <Ionicons name="bicycle" size={16} color="#fff" />
                                    <Text style={styles.claimBtnText}>Claim Delivery</Text>
                                </TouchableOpacity>
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
    accessDenied: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
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
    readyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#009688', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
    detail: { fontSize: 14, color: '#555', flex: 1 },
    cookRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6,
        backgroundColor: '#fff5f0', borderRadius: 8, padding: 8,
    },
    cookLabel: { fontSize: 13, fontWeight: '600', color: '#ff6b35' },
    cookAddress: { fontSize: 12, color: '#888', marginTop: 2 },
    cookNoLocation: { fontSize: 12, color: '#FF9800', marginTop: 2 },
    itemsList: { marginTop: 8, marginBottom: 12 },
    itemText: { fontSize: 13, color: '#444', marginBottom: 2 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
    price: { fontSize: 16, fontWeight: 'bold', color: '#ff6b35' },
    claimBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff6b35', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
    claimBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    emptyText: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#999', marginTop: 8 },
    errorText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 16, marginBottom: 20 },
    retryBtn: { backgroundColor: '#ff6b35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryBtnText: { color: '#fff', fontWeight: 'bold' },
});
