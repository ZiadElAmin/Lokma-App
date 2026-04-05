import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, ScrollView } from 'react-native';
import { Image } from 'react-native-elements';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import mealsApi from '../../api/meals';
import * as ImagePicker from 'expo-image-picker';

const CookDashboard = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const [editingMeal, setEditingMeal] = useState(null);
    
    // Meal form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState('');
    const [saving, setSaving] = useState(false);
    
    // Calculator state
    const [ingredients, setIngredients] = useState([{ name: '', grams: '', cost: '' }]);
    const [profitPercent, setProfitPercent] = useState('20');
    const [calculatedPrice, setCalculatedPrice] = useState(0);
    const [pricePer100g, setPricePer100g] = useState(0);
    const [totalGrams, setTotalGrams] = useState(0);

    useEffect(() => {
        if (user?.role === 'Cook' || user?.role === 'Admin') {
            fetchMyMeals();
        }
    }, [user]);

    const fetchMyMeals = async () => {
        try {
            const data = await mealsApi.getMyMeals();
            setMeals(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const calculatePrice = () => {
        const totalCost = ingredients.reduce((sum, ing) => {
            return sum + (parseFloat(ing.cost) || 0);
        }, 0);
        const totalWeight = ingredients.reduce((sum, ing) => {
            return sum + (parseFloat(ing.grams) || 0);
        }, 0);
        const profit = totalCost * (parseFloat(profitPercent) / 100);
        const finalPrice = totalCost + profit;
        
        setCalculatedPrice(finalPrice);
        setTotalGrams(totalWeight);
        
        if (totalWeight > 0) {
            const per100g = (finalPrice / totalWeight) * 100;
            setPricePer100g(per100g);
        } else {
            setPricePer100g(0);
        }
    };

    const addIngredient = () => {
        setIngredients([...ingredients, { name: '', cost: '' }]);
    };

    const updateIngredient = (index, field, value) => {
        const newIngredients = [...ingredients];
        newIngredients[index][field] = value;
        setIngredients(newIngredients);
    };

    const removeIngredient = (index) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const useCalculatedPrice = () => {
        setPrice(calculatedPrice.toFixed(2));
        setShowCalculator(false);
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setPrice('');
        setImage('');
        setEditingMeal(null);
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const openEditModal = (meal) => {
        setEditingMeal(meal);
        setName(meal.name);
        setDescription(meal.description);
        setPrice(meal.price.toString());
        setImage(meal.image || '');
        setShowAddModal(true);
    };

    const handleSubmit = async () => {
        if (!name || !price) {
            Alert.alert('Error', 'Please fill in name and price');
            return;
        }

        setSaving(true);
        try {
            const mealData = { name, description, price: parseFloat(price), image };
            
            if (editingMeal) {
                await mealsApi.updateMeal(editingMeal.id, mealData);
                Alert.alert('Success', 'Meal updated successfully');
            } else {
                await mealsApi.createMeal(mealData);
                Alert.alert('Success', 'Meal added successfully');
            }
            
            setShowAddModal(false);
            resetForm();
            fetchMyMeals();
        } catch (err) {
            Alert.alert('Error', 'Failed to save meal');
            console.error(err);
        }
        setSaving(false);
    };

    const handleDelete = (meal) => {
        Alert.alert(
            'Delete Meal',
            `Are you sure you want to delete "${meal.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await mealsApi.deleteMeal(meal.id);
                            fetchMyMeals();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete meal');
                        }
                    },
                },
            ]
        );
    };

    if (user?.role !== 'Cook' && user?.role !== 'Admin') {
        return (
            <View style={styles.accessDenied}>
                <Ionicons name="lock-closed" size={64} color="#ccc" />
                <Text style={styles.accessDeniedText}>Access Denied</Text>
                <Text style={styles.accessDeniedSubtext}>This section is for cooks only</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b35" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Kitchen</Text>
                <Text style={styles.headerSubtitle}>{meals.length} meals</Text>
            </View>

            <View style={styles.actionBar}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setShowCalculator(true)}>
                    <Ionicons name="calculator" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Calculator</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.addBtn]} onPress={() => { resetForm(); setShowAddModal(true); }}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Add Meal</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={meals}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="restaurant-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No meals yet</Text>
                        <Text style={styles.emptySubtext}>Add your first meal to get started</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.mealCard}>
                        <Image source={{ uri: item.image || 'https://via.placeholder.com/100' }} style={styles.mealImage} />
                        <View style={styles.mealInfo}>
                            <Text style={styles.mealName}>{item.name}</Text>
                            <Text style={styles.mealDesc} numberOfLines={2}>{item.description}</Text>
                            <Text style={styles.mealPrice}>EGP {item.price.toFixed(2)}</Text>
                        </View>
                        <View style={styles.mealActions}>
                            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                                <Ionicons name="pencil" size={18} color="#2196F3" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                                <Ionicons name="trash" size={18} color="#ff4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* Add/Edit Meal Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingMeal ? 'Edit Meal' : 'Add New Meal'}</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g., Koshari"
                                />
                            </View>
                            
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Describe your meal..."
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                            
                            <View style={styles.priceRow}>
                                <View style={[styles.inputGroup, {flex: 1}]}>
                                    <Text style={styles.inputLabel}>Price *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={price}
                                        onChangeText={setPrice}
                                        placeholder="0.00"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <TouchableOpacity style={styles.calcBtn} onPress={() => setShowCalculator(true)}>
                                    <Ionicons name="calculator" size={20} color="#ff6b35" />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Meal Image</Text>
                                {image ? (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image source={{ uri: image }} style={styles.imagePreview} />
                                        <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
                                            <Text style={styles.changeImageBtnText}>Change Image</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.uploadImageBtn} onPress={pickImage}>
                                        <Ionicons name="image-outline" size={32} color="#ff6b35" />
                                        <Text style={styles.uploadImageText}>Tap to select an image</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>{editingMeal ? 'Update Meal' : 'Add Meal'}</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Calculator Modal */}
            <Modal visible={showCalculator} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Price Calculator</Text>
                            <TouchableOpacity onPress={() => setShowCalculator(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.sectionTitle}>Ingredients</Text>
                                {ingredients.map((ing, index) => (
                                    <View key={index} style={styles.ingredientRow}>
                                        <TextInput
                                            style={[styles.input, {flex: 2}]}
                                            value={ing.name}
                                            onChangeText={(val) => updateIngredient(index, 'name', val)}
                                            placeholder="Ingredient name"
                                        />
                                        <TextInput
                                            style={[styles.input, {flex: 1}]}
                                            value={ing.grams}
                                            onChangeText={(val) => updateIngredient(index, 'grams', val)}
                                            placeholder="Grams"
                                            keyboardType="decimal-pad"
                                        />
                                        <TextInput
                                            style={[styles.input, {flex: 1}]}
                                            value={ing.cost}
                                            onChangeText={(val) => updateIngredient(index, 'cost', val)}
                                            placeholder="Cost"
                                            keyboardType="decimal-pad"
                                        />
                                        <TouchableOpacity onPress={() => removeIngredient(index)}>
                                            <Ionicons name="remove-circle-outline" size={24} color="#ff4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.addIngredientBtn} onPress={addIngredient}>
                                    <Ionicons name="add-circle" size={24} color="#ff6b35" />
                                    <Text style={styles.addIngredientText}>Add Ingredient</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Profit Margin (%)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profitPercent}
                                    onChangeText={setProfitPercent}
                                    placeholder="20"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                            
                            <TouchableOpacity style={styles.calculateBtn} onPress={calculatePrice}>
                                <Text style={styles.calculateBtnText}>Calculate Price</Text>
                            </TouchableOpacity>
                            
                            {calculatedPrice > 0 && (
                                <View style={styles.resultCard}>
                                    <Text style={styles.resultLabel}>Suggested Price</Text>
                                    <Text style={styles.resultPrice}>EGP {calculatedPrice.toFixed(2)}</Text>
                                    <View style={styles.resultDetails}>
                                        <Text style={styles.resultDetailText}>Total Weight: {totalGrams}g</Text>
                                        <Text style={styles.resultDetailText}>Price per 100g: EGP {pricePer100g.toFixed(2)}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.usePriceBtn} onPress={useCalculatedPrice}>
                                        <Text style={styles.usePriceBtnText}>Use This Price</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
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
    },
    accessDenied: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    accessDeniedText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
    },
    accessDeniedSubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
    header: {
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
    headerSubtitle: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    actionBar: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    addBtn: {
        backgroundColor: '#ff6b35',
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    listContent: {
        padding: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
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
    mealImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 16,
    },
    mealCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    mealInfo: {
        flex: 1,
    },
    mealName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    mealDesc: {
        fontSize: 13,
        color: '#888',
        marginTop: 4,
    },
    mealPrice: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ff6b35',
        marginTop: 8,
    },
    mealActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    editBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffebee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e8e8e8',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    calcBtn: {
        backgroundColor: '#fff5f0',
        padding: 14,
        borderRadius: 12,
        height: 50,
        marginTop: 30,
    },
    submitBtn: {
        backgroundColor: '#ff6b35',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 20,
    },
    submitBtnDisabled: {
        backgroundColor: '#ccc',
    },
    submitBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    addIngredientBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ff6b35',
        borderRadius: 12,
        borderStyle: 'dashed',
        marginTop: 8,
        gap: 8,
    },
    addIngredientText: {
        color: '#ff6b35',
        fontWeight: '600',
    },
    calculateBtn: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    calculateBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    resultCard: {
        backgroundColor: '#fff5f0',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    resultLabel: {
        fontSize: 14,
        color: '#666',
    },
    resultPrice: {
        fontSize: 36,
        fontWeight: '800',
        color: '#ff6b35',
        marginVertical: 8,
    },
    resultDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 8,
    },
    resultDetailText: {
        fontSize: 12,
        color: '#888',
    },
    usePriceBtn: {
        backgroundColor: '#ff6b35',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    usePriceBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    imagePreviewContainer: {
        alignItems: 'center',
        marginTop: 8,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#f0f0f0',
    },
    changeImageBtn: {
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    changeImageBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    uploadImageBtn: {
        height: 150,
        backgroundColor: '#fff5f0',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ff6b35',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    uploadImageText: {
        color: '#ff6b35',
        fontWeight: '600',
        marginTop: 8,
    },
});

export default CookDashboard;
