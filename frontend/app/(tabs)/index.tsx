import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    TouchableOpacity, Image, RefreshControl, Alert, ScrollView, TextInput
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import mealsApi from '../../api/meals';
import { useCart } from '../../hooks/useCart';

const CATEGORIES = ['Egyptian', 'Grilled', 'Vegetarian', 'Seafood', 'Pasta', 'Sandwiches', 'Desserts', 'Soups', 'Other'];

const MealsScreen = () => {
    const router = useRouter();
    const [meals, setMeals] = useState([]);
    const [cooks, setCooks] = useState([]);
    const [selectedCook, setSelectedCook] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<any>(null);
    const { addToCart, cartItems } = useCart();

    const fetchData = async (searchTerm = search) => {
        try {
            setError(null);
            const [mealsData, cooksData] = await Promise.all([
                mealsApi.getMeals(searchTerm, selectedCook || '', selectedCategory || ''),
                mealsApi.getCooks(),
            ]);
            setMeals(mealsData);
            setCooks(cooksData);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to connect to server.');
        }
        setLoading(false);
        setRefreshing(false);
    };

    // Search with debounce
    useEffect(() => {
        const timer = setTimeout(() => fetchData(search), 400);
        return () => clearTimeout(timer);
    }, [search, selectedCook, selectedCategory]);

    // Auto refresh every time the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleAddToCart = (item) => {
        addToCart(item);
        Alert.alert('Added to Cart', `${item.name} has been added to your cart.`);
    };

    const getCartCount = () => cartItems.reduce((sum, item) => sum + item.qty, 0);

    const getDisplayedMeals = () => {
        if (selectedCook) {
            return meals.filter((meal) => meal.cook?.id === selectedCook);
        }
        return meals;
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
                <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
                    <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const ListHeader = () => (
        <View>
            {/* Header */}
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

            {/* Promo Banner */}
            <View style={styles.promoBanner}>
                <View style={styles.promoContent}>
                    <Text style={styles.promoTitle}>Free Delivery</Text>
                    <Text style={styles.promoSubtitle}>On your first order</Text>
                </View>
                <View style={styles.promoIcon}>
                    <Ionicons name="car" size={32} color="#fff" />
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search meals..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor="#999"
                    returnKeyType="search"
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Category Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScrollContent}
            >
                <TouchableOpacity
                    style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
                    onPress={() => setSelectedCategory(null)}
                >
                    <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>All</Text>
                </TouchableOpacity>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                        onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    >
                        <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Cooks Section */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Our Cooks</Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cooksScrollContent}
            >
                <TouchableOpacity
                    style={[styles.cookChip, !selectedCook && styles.cookChipActive]}
                    onPress={() => setSelectedCook(null)}
                >
                    <Text style={[styles.cookChipText, !selectedCook && styles.cookChipTextActive]}>
                        All
                    </Text>
                </TouchableOpacity>
                {cooks.map((cook) => (
                    <TouchableOpacity
                        key={cook.id}
                        style={[styles.cookChip, selectedCook === cook.id && styles.cookChipActive]}
                        onPress={() => setSelectedCook(selectedCook === cook.id ? null : cook.id)}
                    >
                        <Ionicons
                            name="restaurant"
                            size={14}
                            color={selectedCook === cook.id ? '#fff' : '#ff6b35'}
                        />
                        <Text style={[styles.cookChipText, selectedCook === cook.id && styles.cookChipTextActive]}>
                            {cook.name}
                        </Text>
                        <Text style={[styles.cookChipCount, selectedCook === cook.id && styles.cookChipCountActive]}>
                            {cook.meals?.length || 0} meals
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Meals Section Title */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {selectedCook ? `${cooks.find(c => c.id === selectedCook)?.name}'s Meals` : 'Popular Meals'}
                </Text>
                {selectedCook && (
                    <TouchableOpacity onPress={() => setSelectedCook(null)}>
                        <Text style={styles.seeAllText}>Show All</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={getDisplayedMeals()}
                numColumns={2}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListHeaderComponent={ListHeader}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="restaurant-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No meals available</Text>
                        <Text style={styles.emptySubtext}>
                            {selectedCook ? 'This cook has no meals yet' : 'Check back later!'}
                        </Text>
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
                            {item.category && item.category !== 'Other' && (
                                <View style={styles.categoryTag}>
                                    <Text style={styles.categoryTagText}>{item.category}</Text>
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
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f5f5f5' },
    errorText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 16, marginBottom: 24 },
    retryBtn: { backgroundColor: '#ff6b35', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
    headerGreeting: { fontSize: 14, color: '#888', marginBottom: 4 },
    headerTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.5 },
    locationBtn: {
        flexDirection: 'row', alignItems: 'center', marginTop: 12,
        backgroundColor: '#fff5f0', alignSelf: 'flex-start',
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    },
    locationText: { fontSize: 13, color: '#666', marginLeft: 6, fontWeight: '500' },
    promoBanner: {
        backgroundColor: '#ff6b35', marginHorizontal: 20, marginTop: 16,
        borderRadius: 16, padding: 20, flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'center',
    },
    promoContent: { flex: 1 },
    promoTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    promoSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    promoIcon: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12,
    },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
    seeAllText: { fontSize: 14, color: '#ff6b35', fontWeight: '600' },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16,
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1, borderColor: '#eee',
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: '#333' },
    categoryScrollContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    categoryChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#e0e0e0',
    },
    categoryChipActive: { backgroundColor: '#333', borderColor: '#333' },
    categoryChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
    categoryChipTextActive: { color: '#fff' },
    cooksScrollContent: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    cookChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#ff6b35',
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    },
    cookChipActive: { backgroundColor: '#ff6b35', borderColor: '#ff6b35' },
    cookChipText: { fontSize: 13, fontWeight: '600', color: '#ff6b35' },
    cookChipTextActive: { color: '#fff' },
    cookChipCount: { fontSize: 11, color: '#ff9800' },
    cookChipCountActive: { color: 'rgba(255,255,255,0.8)' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#888', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#aaa', marginTop: 8 },
    listContainer: { paddingHorizontal: 12, paddingBottom: 100 },
    mealCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, overflow: 'hidden',
    },
    mealCardLeft: { marginRight: 8 },
    mealCardRight: { marginLeft: 8 },
    imageContainer: { position: 'relative' },
    mealImage: { width: '100%', height: 140, backgroundColor: '#f0f0f0' },
    cartBadgeSmall: {
        position: 'absolute', top: 10, right: 10, backgroundColor: '#ff6b35',
        width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center',
    },
    cartBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
    mealInfo: { padding: 14 },
    mealName: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
    cookBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff3e0',
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
        alignSelf: 'flex-start', marginBottom: 4, gap: 4,
    },
    cookBadgeText: { fontSize: 11, color: '#ff9800', fontWeight: '600' },
    categoryTag: {
        backgroundColor: '#f0f4ff', paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: 8, alignSelf: 'flex-start', marginBottom: 4,
    },
    categoryTagText: { fontSize: 10, color: '#4a6fa5', fontWeight: '600' },
    mealDesc: { fontSize: 12, color: '#aaa', marginBottom: 8 },
    mealFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceContainer: { flexDirection: 'row', alignItems: 'center' },
    mealPrice: { fontSize: 17, fontWeight: '700', color: '#ff6b35' },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    ratingText: { fontSize: 12, color: '#666', marginLeft: 2, fontWeight: '500' },
    addBtn: {
        backgroundColor: '#ff6b35', width: 32, height: 32,
        borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    },
});

export default MealsScreen;