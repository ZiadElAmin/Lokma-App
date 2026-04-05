import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import mealsApi from '../../api/meals';
import { useCart } from '../../hooks/useCart';

const MealsScreen = () => {
    const router = useRouter();
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const { addToCart, cartItems } = useCart();

    const fetchMeals = async () => {
        try {
            setError(null);
            const data = await mealsApi.getMeals();
            setMeals(data);
        } catch (err) {
            console.error('Failed to load meals:', err);
            setError(err.response?.data?.message || 'Failed to connect to server. Please check your connection.');
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchMeals();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMeals();
    };

    const handleAddToCart = (item) => {
        addToCart(item);
        Alert.alert('Added to Cart', `${item.name} has been added to your cart.`);
    };

    const getCartCount = () => {
        return cartItems.reduce((sum, item) => sum + item.qty, 0);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b35" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="cloud-offline" size={64} color="#ccc" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchMeals}>
                    <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerGreeting}>Good afternoon! 👋</Text>
                    <Text style={styles.headerTitle}>Lokma</Text>
                </View>
                <TouchableOpacity style={styles.locationBtn}>
                    <Ionicons name="location" size={18} color="#ff6b35" />
                    <Text style={styles.locationText}>Cairo, Egypt</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.promoBanner}>
                <View style={styles.promoContent}>
                    <Text style={styles.promoTitle}>Free Delivery</Text>
                    <Text style={styles.promoSubtitle}>On your first order</Text>
                </View>
                <View style={styles.promoIcon}>
                    <Ionicons name="car" size={32} color="#fff" />
                </View>
            </View>
            
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popular Meals</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>
            
            <FlatList
                data={meals}
                numColumns={2}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="restaurant-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No meals available</Text>
                        <Text style={styles.emptySubtext}>Check back later for delicious food!</Text>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <TouchableOpacity 
                        style={[styles.mealCard, index % 2 === 0 ? styles.mealCardLeft : styles.mealCardRight]} 
                        onPress={() => router.push(`/meal/${item.id}`)}
                    >
                        <View style={styles.imageContainer}>
                            <Image 
                                source={{ uri: item.image || 'https://via.placeholder.com/200' }} 
                                style={styles.mealImage}
                            />
                            {getCartCount() > 0 && (
                                <View style={styles.cartBadgeSmall}>
                                    <Text style={styles.cartBadgeText}>{getCartCount()}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.mealInfo}>
                            <Text style={styles.mealName} numberOfLines={1}>{item.name}</Text>
                            {item.cook && (
                                <View style={styles.cookBadge}>
                                    <Ionicons name="restaurant" size={12} color="#ff9800" />
                                    <Text style={styles.cookBadgeText}>By {item.cook.name}</Text>
                                </View>
                            )}
                            <Text style={styles.mealDesc} numberOfLines={1}>{item.description}</Text>
                            <View style={styles.mealFooter}>
                                <View style={styles.priceContainer}>
                                    <Text style={styles.mealPrice}>EGP {item.price.toFixed(2)}</Text>
                                    {item.rating > 0 && (
                                        <View style={styles.ratingContainer}>
                                            <Ionicons name="star" size={12} color="#FFD700" />
                                            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(item)}>
                                    <Ionicons name="add" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#f5f5f5',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    retryBtn: {
        backgroundColor: '#ff6b35',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
    },
    headerGreeting: {
        fontSize: 14,
        color: '#888',
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1a1a1a',
        letterSpacing: -0.5,
    },
    locationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: '#fff5f0',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    locationText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 6,
        fontWeight: '500',
    },
    promoBanner: {
        backgroundColor: '#ff6b35',
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    promoContent: {
        flex: 1,
    },
    promoTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    promoSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    promoIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    seeAllText: {
        fontSize: 14,
        color: '#ff6b35',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#888',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 8,
    },
    listContainer: {
        paddingHorizontal: 12,
        paddingBottom: 100,
    },
    mealCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
    },
    mealCardLeft: {
        marginRight: 8,
    },
    mealCardRight: {
        marginLeft: 8,
    },
    imageContainer: {
        position: 'relative',
    },
    mealImage: {
        width: '100%',
        height: 140,
        backgroundColor: '#f0f0f0',
    },
    cartBadgeSmall: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#ff6b35',
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 11,
    },
    mealInfo: {
        padding: 14,
    },
    mealName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    cookBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3e0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginBottom: 4,
        gap: 4,
    },
    cookBadgeText: {
        fontSize: 11,
        color: '#ff9800',
        fontWeight: '600',
    },
    cookRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    cookName: {
        fontSize: 11,
        color: '#888',
        marginLeft: 4,
    },
    mealDesc: {
        fontSize: 12,
        color: '#aaa',
        marginBottom: 8,
    },
    mealFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mealPrice: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ff6b35',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    ratingText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 2,
        fontWeight: '500',
    },
    addBtn: {
        backgroundColor: '#ff6b35',
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MealsScreen;
