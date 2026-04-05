import React, { useState, useEffect } from 'react';
import { StyleSheet, Button, FlatList, Text as RNText, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'expo-router';
import api from '@/api/meals';

const MealItem = ({ item }) => {
    const { addToCart } = useCart();

    const handleAddToCart = () => {
        addToCart(item);
        Alert.alert('Success', 'Meal added to cart');
    };

    return (
        <View style={styles.mealItem}>
            <RNText style={styles.mealTitle}>{item.title}</RNText>
            <RNText>EGP {item.price}</RNText>
            <Button title="Add to Cart" onPress={handleAddToCart} />
        </View>
    );
};

export default function HomeScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeals = async () => {
            try {
                const response = await api.getMeals();
                setMeals(response.data);
            } catch (error) {
                console.error(error);
            }
            setLoading(false);
        };
        fetchMeals();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Meals</Text>
            {user?.role === 'Cook' && (
                <Button
                    title="Add Meal"
                    onPress={() => router.push('/AddMealScreen')}
                />
            )}
            <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
            {loading ? (
                <RNText>Loading meals...</RNText>
            ) : (
                <FlatList
                    data={meals}
                    renderItem={({ item }) => <MealItem item={item} />}
                    keyExtractor={(item) => item._id}
                    style={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 50,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    separator: {
        marginVertical: 30,
        height: 1,
        width: '80%',
    },
    list: {
        width: '100%',
    },
    mealItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    mealTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});
