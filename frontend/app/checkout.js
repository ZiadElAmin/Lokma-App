import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../hooks/useCart';
import { SafeAreaView } from 'react-native-safe-area-context';
import ordersApi from '../api/orders';
import withAuth from '../components/withAuth';

const CheckoutScreen = () => {
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { cartItems, clearCart, getCartTotal } = useCart();
    const router = useRouter();

    const handleCheckout = async () => {
        if (!address || !city) {
            Alert.alert('Error', 'Please fill in address and city');
            return;
        }

        setLoading(true);
        const orderItems = cartItems.map(item => ({
            name: item.name,
            qty: item.qty,
            image: item.image,
            price: item.price,
            meal: item.id,
        }));

        const order = {
            orderItems,
            shippingAddress: `${address}, ${city}${postalCode ? ', ' + postalCode : ''}`,
            paymentMethod: 'Cash on Delivery',
            itemsPrice: getCartTotal(),
            taxPrice: getCartTotal() * 0.05,
            shippingPrice: 2.99,
            totalPrice: getCartTotal() + (getCartTotal() * 0.05) + 2.99,
        };

        try {
            await ordersApi.createOrder(order);
            clearCart();
            Alert.alert('Success', 'Your order has been placed!', [
                { text: 'OK', onPress: () => router.replace('/my-orders') }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to place order. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Checkout</Text>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Street Address" 
                    value={address} 
                    onChangeText={setAddress} 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="City" 
                    value={city} 
                    onChangeText={setCity} 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Postal Code (optional)" 
                    value={postalCode} 
                    onChangeText={setPostalCode} 
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                    <Text>Subtotal</Text>
                    <Text>EGP {getCartTotal().toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text>Tax (5%)</Text>
                    <Text>EGP {(getCartTotal() * 0.05).toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text>Delivery</Text>
                    <Text>EGP 2.99</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalText}>Total</Text>
                    <Text style={styles.totalText}>EGP {(getCartTotal() + (getCartTotal() * 0.05) + 2.99).toFixed(2)}</Text>
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.orderBtn, loading && styles.orderBtnDisabled]} 
                onPress={handleCheckout}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.orderBtnText}>Place Order</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
        color: '#333',
    },
    section: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        fontSize: 15,
        color: '#666',
    },
    totalRow: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginBottom: 0,
    },
    totalText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    orderBtn: {
        backgroundColor: '#ff6b35',
        marginHorizontal: 16,
        marginVertical: 20,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    orderBtnDisabled: {
        backgroundColor: '#ccc',
    },
    orderBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default withAuth(CheckoutScreen);
