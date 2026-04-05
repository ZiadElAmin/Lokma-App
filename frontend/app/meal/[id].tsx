import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import mealsApi from '../../api/meals';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';

const MealDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { addToCart } = useCart();
    const [meal, setMeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMeal = async () => {
            try {
                const data = await mealsApi.getMealById(id);
                setMeal(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load meal');
            }
            setLoading(false);
        };
        fetchMeal();
    }, [id]);

    const handleAddToCart = () => {
        if (meal) {
            addToCart(meal);
            Alert.alert('Added to Cart', `${meal.name} has been added to your cart.`, [
                { text: 'Continue Shopping', onPress: () => router.back() },
                { text: 'Go to Cart', onPress: () => router.push('/(tabs)/cart') },
            ]);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b35" />
            </View>
        );
    }

    if (error || !meal) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={60} color="#ff6b35" />
                <Text style={styles.errorText}>{error || 'Meal not found'}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
                    <Text style={styles.retryBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView style={styles.container}>
                <Image 
                    source={{ uri: meal.image || 'https://via.placeholder.com/400x300' }} 
                    style={styles.image}
                />
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.name}>{meal.name}</Text>
                        <Text style={styles.price}>EGP {meal.price.toFixed(2)}</Text>
                    </View>

                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={18} color="#FFD700" />
                        <Text style={styles.rating}>{meal.rating?.toFixed(1) || '0.0'}</Text>
                        <Text style={styles.reviews}>({meal.numReviews || 0} reviews)</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{meal.description}</Text>

                    <View style={styles.cookInfo}>
                        <Ionicons name="person-circle" size={40} color="#ff6b35" />
                        <View style={styles.cookDetails}>
                            <Text style={styles.cookLabel}>Prepared by</Text>
                            <Text style={styles.cookName}>Home Cook</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.priceTag}>
                    <Text style={styles.footerPrice}>EGP {meal.price.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
                    <Ionicons name="cart" size={20} color="#fff" />
                    <Text style={styles.addBtnText}>Add to Cart</Text>
                </TouchableOpacity>
            </View>
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
        marginBottom: 20,
    },
    retryBtn: {
        backgroundColor: '#ff6b35',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    image: {
        width: '100%',
        height: 300,
        backgroundColor: '#f0f0f0',
    },
    backBtn: {
        position: 'absolute',
        top: 50,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ff6b35',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    rating: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 4,
        color: '#333',
    },
    reviews: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
        marginBottom: 20,
    },
    cookInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
    },
    cookDetails: {
        marginLeft: 12,
    },
    cookLabel: {
        fontSize: 12,
        color: '#999',
    },
    cookName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    priceTag: {
        marginRight: 16,
    },
    footerPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    addBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ff6b35',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    addBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default MealDetailScreen;
