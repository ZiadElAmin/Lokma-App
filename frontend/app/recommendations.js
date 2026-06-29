import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image,
    TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ordersApi from '../api/orders';
import { useCart } from '../hooks/useCart';

export default function RecommendationsScreen() {
    const { orderId } = useLocalSearchParams();
    const router = useRouter();
    const { addToCart } = useCart();
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await ordersApi.getRecommendations(orderId);
                setMeals(data);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        if (orderId) load();
    }, [orderId]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#ff6b35" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.banner}>
                <Ionicons name="sad-outline" size={28} color="#ff6b35" />
                <Text style={styles.bannerText}>
                    That order was declined. Here are some other meals you might enjoy instead.
                </Text>
            </View>

            <FlatList
                data={meals}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Ionicons name="restaurant-outline" size={56} color="#ccc" />
                        <Text style={styles.emptyText}>No alternatives available right now</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} onPress={() => router.push(`/meal/${item.id}`)}>
                        <Image source={{ uri: item.image || 'https://via.placeholder.com/100' }} style={styles.image} />
                        <View style={styles.info}>
                            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.cook} numberOfLines={1}>By {item.cook?.name || 'Home Cook'}</Text>
                            <View style={styles.row}>
                                <Text style={styles.price}>EGP {item.price.toFixed(2)}</Text>
                                {item.rating > 0 && (
                                    <View style={styles.rating}>
                                        <Ionicons name="star" size={12} color="#FFD700" />
                                        <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                            <Ionicons name="add" size={22} color="#fff" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 15, color: '#888', marginTop: 12 },
    banner: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#fff5f0', margin: 16, padding: 16, borderRadius: 12,
    },
    bannerText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 19 },
    list: { paddingHorizontal: 16, paddingBottom: 24 },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 14, padding: 10, marginBottom: 12, gap: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    image: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#f0f0f0' },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
    cook: { fontSize: 12, color: '#ff9800', marginTop: 2 },
    row: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 },
    price: { fontSize: 15, fontWeight: '700', color: '#ff6b35' },
    rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    ratingText: { fontSize: 12, color: '#666' },
    addBtn: {
        backgroundColor: '#ff6b35', width: 36, height: 36, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
});
