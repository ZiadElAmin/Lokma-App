import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { useCart } from '../../hooks/useCart';
import ordersApi from '../../api/orders';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const CartScreen = () => {
    const { cartItems, removeFromCart, clearCart, updateCartItemQuantity } = useCart();
    const router = useRouter();
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    const handleCheckout = async () => {
        try {
            await ordersApi.createOrder({
                orderItems: cartItems.map(item => ({ meal: item.id, qty: item.qty })),
                totalPrice,
            });
            clearCart();
            router.replace('/my-orders');
            Alert.alert('Success', 'Order created successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to create order');
            console.error(error);
        }
    };
    
    const handleEmptyCart = () => {
        Alert.alert(
            'Empty Cart',
            'Are you sure you want to empty your cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Empty',
                    style: 'destructive',
                    onPress: () => clearCart(),
                },
            ]
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Cart</Text>
                {cartItems.length > 0 && (
                    <TouchableOpacity onPress={handleEmptyCart}>
                        <Ionicons name="trash-outline" size={24} color="#ff4444" />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={cartItems}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cart-outline" size={80} color="#ccc" />
                        <Text style={styles.emptyText}>Your cart is empty</Text>
                        <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)')}>
                            <Text style={styles.browseBtnText}>Browse Meals</Text>
                        </TouchableOpacity>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                        <Image source={{ uri: item.image || 'https://via.placeholder.com/100' }} style={styles.itemImage} />
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                        </View>
                        <View style={styles.quantityControl}>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartItemQuantity(item.id, item.qty - 1)}>
                                <Ionicons name="remove" size={20} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{item.qty}</Text>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartItemQuantity(item.id, item.qty + 1)}>
                                <Ionicons name="add" size={20} color="#333" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {cartItems.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                        <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    listContent: {
        padding: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#888',
        marginTop: 16,
    },
    browseBtn: {
        backgroundColor: '#ff6b35',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 24,
    },
    browseBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    itemPrice: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    qtyBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyText: {
        fontSize: 16,
        fontWeight: '700',
    },
    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    totalPrice: {
        fontSize: 22,
        color: '#1a1a1a',
        fontWeight: '800',
    },
    checkoutBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ff6b35',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    checkoutBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 18,
    },
});

export default CartScreen;
