import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import ordersApi from '../../api/orders';
import api from '../../api/client';

export default function PaymentScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const [order, setOrder] = useState<any>(null);
    const [method, setMethod] = useState<'cash' | 'card'>('cash');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await ordersApi.getOrderById(id);
                setOrder(data);
            } catch {
                Alert.alert('Error', 'Could not load order');
            }
            setFetching(false);
        };
        load();
    }, [id]);

    const handlePay = async () => {
        setLoading(true);
        try {
            if (method === 'cash') {
                await ordersApi.updateOrderToPaid(id, {
                    id: `cash_${Date.now()}`,
                    status: 'CASH_ON_DELIVERY',
                    update_time: new Date().toISOString(),
                    email_address: '',
                });
                Alert.alert(
                    '✅ Order Confirmed',
                    'Pay the rider in cash when your order arrives.',
                    [{ text: 'OK', onPress: () => router.replace('/my-orders') }]
                );
            } else {
                // 1. Get client secret from backend
                const { data } = await api.post(`/orders/${id}/create-payment-intent`);
                const clientSecret = data.clientSecret;

                // 2. Init Stripe payment sheet
                const { error: initError } = await initPaymentSheet({
                    paymentIntentClientSecret: clientSecret,
                    merchantDisplayName: 'Lokma',
                    style: 'automatic',
                });
                if (initError) {
                    Alert.alert('Error', initError.message);
                    setLoading(false);
                    return;
                }

                // 3. Present Stripe payment UI
                const { error: payError } = await presentPaymentSheet();
                if (payError) {
                    if (payError.code !== 'Canceled') {
                        Alert.alert('Payment Failed', payError.message);
                    }
                    setLoading(false);
                    return;
                }

                // 4. Payment succeeded — mark order as paid in our DB
                await ordersApi.updateOrderToPaid(id, {
                    id: clientSecret.split('_secret')[0],
                    status: 'COMPLETED',
                    update_time: new Date().toISOString(),
                    email_address: '',
                });

                Alert.alert(
                    '✅ Payment Successful',
                    'Your payment was confirmed. Your order is being prepared!',
                    [{ text: 'OK', onPress: () => router.replace('/my-orders') }]
                );
            }
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    if (fetching) return <View style={s.center}><ActivityIndicator size="large" color="#ff6b35" /></View>;

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <ScrollView contentContainerStyle={s.scroll}>

                {/* Header */}
                <View style={s.header}>
                    <Ionicons name="card" size={40} color="#ff6b35" />
                    <Text style={s.title}>Payment</Text>
                    <Text style={s.orderId}>Order #{id?.slice(-6).toUpperCase()}</Text>
                </View>

                {/* Order Total */}
                <View style={s.totalCard}>
                    <Text style={s.totalLabel}>Amount Due</Text>
                    <Text style={s.totalAmount}>EGP {order?.totalPrice?.toFixed(2)}</Text>
                </View>

                {/* Method Selector */}
                <Text style={s.sectionTitle}>Payment Method</Text>
                <View style={s.methodRow}>
                    <TouchableOpacity
                        style={[s.methodBtn, method === 'cash' && s.methodBtnActive]}
                        onPress={() => setMethod('cash')}
                    >
                        <Ionicons name="cash-outline" size={24} color={method === 'cash' ? '#fff' : '#555'} />
                        <Text style={[s.methodText, method === 'cash' && s.methodTextActive]}>Cash on Delivery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.methodBtn, method === 'card' && s.methodBtnActive]}
                        onPress={() => setMethod('card')}
                    >
                        <Ionicons name="card-outline" size={24} color={method === 'card' ? '#fff' : '#555'} />
                        <Text style={[s.methodText, method === 'card' && s.methodTextActive]}>Credit / Debit Card</Text>
                    </TouchableOpacity>
                </View>

                {/* Info boxes */}
                {method === 'cash' && (
                    <View style={s.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#666" />
                        <Text style={s.infoText}>Pay the rider in cash when your order arrives.</Text>
                    </View>
                )}

                {method === 'card' && (
                    <View style={s.infoBox}>
                        <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" />
                        <Text style={s.infoText}>Secured by Stripe. You'll enter your card details on the next screen.</Text>
                    </View>
                )}

                {/* Pay Button */}
                <TouchableOpacity
                    style={[s.payBtn, loading && s.payBtnDisabled]}
                    onPress={handlePay}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <>
                            <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                            <Text style={s.payBtnText}>
                                {method === 'cash' ? 'Confirm Order' : `Pay EGP ${order?.totalPrice?.toFixed(2)}`}
                            </Text>
                          </>
                    }
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 26, fontWeight: '800', color: '#1a1a1a', marginTop: 8 },
    orderId: { fontSize: 14, color: '#888', marginTop: 4 },
    totalCard: {
        backgroundColor: '#ff6b35', borderRadius: 16, padding: 24,
        alignItems: 'center', marginBottom: 28,
    },
    totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    totalAmount: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
    methodRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    methodBtn: {
        flex: 1, alignItems: 'center', padding: 16, borderRadius: 12,
        backgroundColor: '#fff', borderWidth: 2, borderColor: '#eee', gap: 8,
    },
    methodBtnActive: { backgroundColor: '#ff6b35', borderColor: '#ff6b35' },
    methodText: { fontSize: 13, fontWeight: '600', color: '#555', textAlign: 'center' },
    methodTextActive: { color: '#fff' },
    infoBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24,
    },
    infoText: { fontSize: 14, color: '#666', flex: 1 },
    payBtn: {
        backgroundColor: '#4CAF50', borderRadius: 14, padding: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    payBtnDisabled: { backgroundColor: '#ccc' },
    payBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
