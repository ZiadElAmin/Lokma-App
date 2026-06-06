import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ordersApi from '../../api/orders';

export default function PaymentScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [order, setOrder] = useState<any>(null);
    const [method, setMethod] = useState<'cash' | 'card'>('cash');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardName, setCardName] = useState('');
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

    const formatCardNumber = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
        return digits;
    };

    const handlePay = async () => {
        if (method === 'card') {
            const rawCard = cardNumber.replace(/\s/g, '');
            if (rawCard.length < 16) return Alert.alert('Invalid Card', 'Enter a valid 16-digit card number');
            if (expiry.length < 5)   return Alert.alert('Invalid Expiry', 'Enter expiry as MM/YY');
            if (cvv.length < 3)      return Alert.alert('Invalid CVV', 'Enter a 3-digit CVV');
            if (!cardName.trim())    return Alert.alert('Missing Name', 'Enter the name on the card');
        }

        setLoading(true);
        try {
            await ordersApi.updateOrderToPaid(id, {
                id: `mock_${Date.now()}`,
                status: 'COMPLETED',
                update_time: new Date().toISOString(),
                email_address: '',
            });
            Alert.alert(
                '✅ Payment Successful',
                method === 'cash'
                    ? 'Your order is confirmed. Pay the rider on delivery.'
                    : 'Payment confirmed. Your order is being prepared!',
                [{ text: 'OK', onPress: () => router.replace('/my-orders') }]
            );
        } catch {
            Alert.alert('Payment Failed', 'Something went wrong. Please try again.');
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

                {/* Card Form */}
                {method === 'card' && (
                    <View style={s.cardForm}>
                        <Text style={s.sectionTitle}>Card Details</Text>

                        <Text style={s.fieldLabel}>Card Number</Text>
                        <TextInput
                            style={s.input}
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChangeText={(v) => setCardNumber(formatCardNumber(v))}
                            keyboardType="numeric"
                            maxLength={19}
                            placeholderTextColor="#bbb"
                        />

                        <Text style={s.fieldLabel}>Name on Card</Text>
                        <TextInput
                            style={s.input}
                            placeholder="John Doe"
                            value={cardName}
                            onChangeText={setCardName}
                            autoCapitalize="words"
                            placeholderTextColor="#bbb"
                        />

                        <View style={s.row}>
                            <View style={s.halfField}>
                                <Text style={s.fieldLabel}>Expiry</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="MM/YY"
                                    value={expiry}
                                    onChangeText={(v) => setExpiry(formatExpiry(v))}
                                    keyboardType="numeric"
                                    maxLength={5}
                                    placeholderTextColor="#bbb"
                                />
                            </View>
                            <View style={s.halfField}>
                                <Text style={s.fieldLabel}>CVV</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="123"
                                    value={cvv}
                                    onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 3))}
                                    keyboardType="numeric"
                                    maxLength={3}
                                    secureTextEntry
                                    placeholderTextColor="#bbb"
                                />
                            </View>
                        </View>
                    </View>
                )}

                {method === 'cash' && (
                    <View style={s.cashNote}>
                        <Ionicons name="information-circle-outline" size={20} color="#666" />
                        <Text style={s.cashNoteText}>Pay the rider in cash when your order arrives.</Text>
                    </View>
                )}

                {/* Pay Button */}
                <TouchableOpacity style={[s.payBtn, loading && s.payBtnDisabled]} onPress={handlePay} disabled={loading}>
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
    cardForm: { marginBottom: 24 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
    input: {
        backgroundColor: '#fff', borderRadius: 10, padding: 14,
        fontSize: 16, borderWidth: 1, borderColor: '#eee', marginBottom: 16, color: '#333',
    },
    row: { flexDirection: 'row', gap: 12 },
    halfField: { flex: 1 },
    cashNote: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24,
    },
    cashNoteText: { fontSize: 14, color: '#666', flex: 1 },
    payBtn: {
        backgroundColor: '#4CAF50', borderRadius: 14, padding: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    payBtnDisabled: { backgroundColor: '#ccc' },
    payBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
