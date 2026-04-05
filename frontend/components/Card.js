import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const Card = ({ 
    children, 
    style, 
    onPress,
    padding = 16,
    elevated = true,
}) => {
    const CardWrapper = onPress ? TouchableOpacity : View;
    
    return (
        <CardWrapper 
            style={[
                styles.card, 
                elevated && styles.elevated,
                { padding },
                style
            ]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            {children}
        </CardWrapper>
    );
};

export const MealCard = ({ 
    meal, 
    onPress, 
    onAddToCart,
    style,
}) => {
    return (
        <TouchableOpacity 
            style={[styles.mealCard, style]} 
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.mealCardImage}>
                <View style={styles.placeholderImage}>
                    <Ionicons name="restaurant" size={32} color="#ccc" />
                </View>
            </View>
            <View style={styles.mealCardContent}>
                <Text style={styles.mealCardName} numberOfLines={1}>{meal.name}</Text>
                {meal.cook && (
                    <View style={styles.cookBadge}>
                        <Ionicons name="restaurant" size={12} color="#ff9800" />
                        <Text style={styles.cookBadgeText}>By {meal.cook.name}</Text>
                    </View>
                )}
                <Text style={styles.mealCardDesc} numberOfLines={1}>{meal.description}</Text>
                <View style={styles.mealCardFooter}>
                    <Text style={styles.mealCardPrice}>EGP {meal.price.toFixed(2)}</Text>
                    {onAddToCart && (
                        <TouchableOpacity style={styles.mealCardAddBtn} onPress={onAddToCart}>
                            <Ionicons name="add" size={18} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export const OrderCard = ({ 
    order, 
    onPress,
    style,
}) => {
    const getStatusColor = (isPaid, isDelivered) => {
        if (isDelivered) return '#4CAF50';
        if (isPaid) return '#2196F3';
        return '#FF9800';
    };

    const getStatusText = (isPaid, isDelivered) => {
        if (isDelivered) return 'Delivered';
        if (isPaid) return 'Preparing';
        return 'Pending';
    };

    return (
        <TouchableOpacity 
            style={[styles.orderCard, style]} 
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.orderCardHeader}>
                <Text style={styles.orderCardId}>
                    Order #{order.id?.slice(-6).toUpperCase()}
                </Text>
                <View style={[styles.orderStatusBadge, { backgroundColor: getStatusColor(order.isPaid, order.isDelivered) }]}>
                    <Text style={styles.orderStatusText}>
                        {getStatusText(order.isPaid, order.isDelivered)}
                    </Text>
                </View>
            </View>
            <View style={styles.orderCardBody}>
                <Text style={styles.orderCardDate}>
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                    })}
                </Text>
                <Text style={styles.orderCardItems}>
                    {order.orderItems?.length || 0} items
                </Text>
            </View>
            <View style={styles.orderCardFooter}>
                <Text style={styles.orderCardTotal}>EGP {order.totalPrice.toFixed(2)}</Text>
                <View style={styles.orderCardArrow}>
                    <Ionicons name="chevron-forward" size={20} color="#888" />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
    },
    elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    mealCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 16,
    },
    mealCardImage: {
        height: 140,
        backgroundColor: '#f5f5f5',
    },
    placeholderImage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    mealCardContent: {
        padding: 14,
    },
    mealCardName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    mealCardDesc: {
        fontSize: 12,
        color: '#888',
        marginBottom: 10,
    },
    cookBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3e0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginBottom: 6,
        gap: 4,
    },
    cookBadgeText: {
        fontSize: 11,
        color: '#ff9800',
        fontWeight: '600',
    },
    mealCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mealCardPrice: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ff6b35',
    },
    mealCardAddBtn: {
        backgroundColor: '#ff6b35',
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 12,
    },
    orderCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderCardId: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    orderStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    orderStatusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    orderCardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    orderCardDate: {
        fontSize: 13,
        color: '#666',
    },
    orderCardItems: {
        fontSize: 13,
        color: '#666',
    },
    orderCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    orderCardTotal: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ff6b35',
    },
    orderCardArrow: {
        padding: 4,
    },
});

export default Card;
