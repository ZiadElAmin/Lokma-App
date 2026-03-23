import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useCart } from '../../hooks/useCart';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import withAuth from '../../components/withAuth';

const CartScreen = () => {
    const { cartItems, removeFromCart, updateQty, getCartTotal } = useCart();
    const router = useRouter();

    if (cartItems.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                    <Ionicons name="cart-outline" size={64} color="#ccc" />
                </View>
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtitle}>Add some delicious meals to get started!</Text>
                <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/(tabs)')}>
                    <Text style={styles.browseBtnText}>Browse Meals</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const subtotal = getCartTotal();
    const deliveryFee = 2.99;
    const tax = subtotal * 0.05;
    const total = subtotal + deliveryFee + tax;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Cart</Text>
                <Text style={styles.headerSubtitle}>{cartItems.length} items</Text>
            </View>
            
            <FlatList
                data={cartItems}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                        <View style={styles.itemImage}>
                            <Image 
                                source={{ uri: item.image || 'https://via.placeholder.com/80' }}
                                style={styles.image}
                            />
                        </View>
                        <View style={styles.itemContent}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.deleteBtn}>
                                    <Ionicons name="trash-outline" size={18} color="#ff4444" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                            <View style={styles.itemFooter}>
                                <View style={styles.qtyContainer}>
                                    <TouchableOpacity 
                                        onPress={() => updateQty(item.id, item.qty - 1)} 
                                        style={[styles.qtyBtn, item.qty <= 1 && styles.qtyBtnDisabled]}
                                    >
                                        <Ionicons name="remove" size={16} color={item.qty <= 1 ? '#ccc' : '#333'} />
                                    </TouchableOpacity>
                                    <Text style={styles.qty}>{item.qty}</Text>
                                    <TouchableOpacity 
                                        onPress={() => updateQty(item.id, item.qty + 1)} 
                                        style={styles.qtyBtn}
                                    >
                                        <Ionicons name="add" size={16} color="#333" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.itemTotal}>${(item.price * item.qty).toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                )}
                keyExtractor={(item) => item.id}
            />
            
            <View style={styles.footer}>
                <View style={styles.couponRow}>
                    <View style={styles.couponInput}>
                        <Ionicons name="pricetag-outline" size={20} color="#888" />
                        <Text style={styles.couponText}>Add coupon code</Text>
                    </View>
                    <TouchableOpacity style={styles.applyBtn}>
                        <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee</Text>
                    <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax (5%)</Text>
                    <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                </View>
                
                <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
                    <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 32,
    },
    browseBtn: {
        backgroundColor: '#ff6b35',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    browseBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1a1a1a',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    listContent: {
        padding: 16,
    },
    cartItem: {
        flexDirection: 'row',
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
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 12,
    },
    image: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
    },
    itemContent: {
        flex: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginRight: 8,
    },
    deleteBtn: {
        padding: 4,
    },
    itemPrice: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    qtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        padding: 4,
    },
    qtyBtn: {
        width: 28,
        height: 28,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyBtnDisabled: {
        backgroundColor: '#f0f0f0',
    },
    qty: {
        fontSize: 14,
        fontWeight: '600',
        marginHorizontal: 12,
        minWidth: 20,
        textAlign: 'center',
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ff6b35',
    },
    footer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    couponRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    couponInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        paddingHorizontal: 14,
        marginRight: 10,
    },
    couponText: {
        fontSize: 14,
        color: '#888',
        marginLeft: 10,
    },
    applyBtn: {
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
    },
    applyBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
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
        marginTop: 10,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginBottom: 20,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ff6b35',
    },
    checkoutBtn: {
        backgroundColor: '#ff6b35',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        gap: 8,
    },
    checkoutText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});

export default withAuth(CartScreen);
