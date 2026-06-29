import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Alert, ActivityIndicator, Modal, TextInput, ScrollView
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import addressesApi from '../api/addresses';
import LocationPicker from '../components/LocationPicker';

const DEFAULT_LAT = 30.0444;
const DEFAULT_LNG = 31.2357;

const LABELS = ['Home', 'Work', 'Other'];

export default function AddressesScreen() {
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [pin, setPin] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
    const [pinSet, setPinSet] = useState(false);
    const [label, setLabel] = useState('Home');
    const [building, setBuilding] = useState('');
    const [floor, setFloor] = useState('');
    const [apartment, setApartment] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchAddresses = async () => {
        try {
            const data = await addressesApi.getAddresses();
            setAddresses(data);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchAddresses(); }, []);

    const resetForm = () => {
        setPin({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        setPinSet(false);
        setLabel('Home');
        setBuilding('');
        setFloor('');
        setApartment('');
        setNotes('');
    };

    const handleAdd = async () => {
        if (!pinSet) { Alert.alert('Set location', 'Tap the map to drop a pin.'); return; }
        if (!building.trim()) { Alert.alert('Missing info', 'Please enter a building or street name.'); return; }
        setSaving(true);
        try {
            await addressesApi.createAddress({
                label,
                lat: pin.lat,
                lng: pin.lng,
                building: building.trim(),
                floor: floor.trim() || null,
                apartment: apartment.trim() || null,
                notes: notes.trim() || null,
            });
            setShowModal(false);
            resetForm();
            fetchAddresses();
        } catch {
            Alert.alert('Error', 'Failed to save address');
        }
        setSaving(false);
    };

    const handleDelete = (id: string, lbl: string) => {
        Alert.alert('Delete Address', `Delete "${lbl}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await addressesApi.deleteAddress(id);
                        fetchAddresses();
                    } catch {
                        Alert.alert('Error', 'Failed to delete address');
                    }
                },
            },
        ]);
    };

    const getLabelIcon = (lbl: string) => {
        if (lbl === 'Home') return 'home-outline';
        if (lbl === 'Work') return 'business-outline';
        return 'location-outline';
    };

    const formatAddress = (addr: any) => {
        const parts = [addr.building];
        if (addr.floor) parts.push(`Floor ${addr.floor}`);
        if (addr.apartment) parts.push(`Apt ${addr.apartment}`);
        if (addr.notes) parts.push(addr.notes);
        return parts.join(', ');
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Delivery Addresses', headerBackTitle: 'Back' }} />
            <SafeAreaView style={styles.container} edges={['bottom']}>
                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color="#ff6b35" /></View>
                ) : (
                    <FlatList
                        data={addresses}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Ionicons name="location-outline" size={64} color="#ccc" />
                                <Text style={styles.emptyText}>No saved addresses</Text>
                                <Text style={styles.emptySubtext}>Add your home, work, or any frequent location</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <View style={styles.cardLeft}>
                                    <View style={styles.iconBadge}>
                                        <Ionicons name={getLabelIcon(item.label)} size={20} color="#ff6b35" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cardLabel}>{item.label}</Text>
                                        <Text style={styles.cardAddress}>{formatAddress(item)}</Text>
                                        <Text style={styles.cardCoords}>{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.label)}>
                                    <Ionicons name="trash-outline" size={18} color="#ff4444" />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}

                <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setShowModal(true); }}>
                    <Ionicons name="add" size={22} color="#fff" />
                    <Text style={styles.addBtnText}>Add New Address</Text>
                </TouchableOpacity>

                {/* Add Address Modal */}
                <Modal visible={showModal} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Add Address</Text>
                                <TouchableOpacity onPress={() => setShowModal(false)}>
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Label picker */}
                                <Text style={styles.fieldLabel}>Label</Text>
                                <View style={styles.labelRow}>
                                    {LABELS.map(l => (
                                        <TouchableOpacity
                                            key={l}
                                            style={[styles.labelChip, label === l && styles.labelChipActive]}
                                            onPress={() => setLabel(l)}
                                        >
                                            <Text style={[styles.labelChipText, label === l && styles.labelChipTextActive]}>{l}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Map */}
                                <Text style={styles.fieldLabel}>Pin Location *</Text>
                                {showModal && (
                                    <LocationPicker
                                        autoLocate
                                        height={220}
                                        onChange={(c) => { setPin(c); setPinSet(true); }}
                                    />
                                )}
                                {pinSet && (
                                    <Text style={styles.pinConfirmed}>
                                        ✅ {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                                    </Text>
                                )}

                                {/* Fields */}
                                <Text style={styles.fieldLabel}>Building / Street *</Text>
                                <TextInput style={styles.input} value={building} onChangeText={setBuilding}
                                    placeholder="e.g. Building 12, El Nozha" placeholderTextColor="#bbb" />

                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.fieldLabel}>Floor</Text>
                                        <TextInput style={styles.input} value={floor} onChangeText={setFloor}
                                            placeholder="3" placeholderTextColor="#bbb" keyboardType="numeric" />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={styles.fieldLabel}>Apartment</Text>
                                        <TextInput style={styles.input} value={apartment} onChangeText={setApartment}
                                            placeholder="Apt 5" placeholderTextColor="#bbb" />
                                    </View>
                                </View>

                                <Text style={styles.fieldLabel}>Notes (optional)</Text>
                                <TextInput style={styles.input} value={notes} onChangeText={setNotes}
                                    placeholder="Ring bell, ask for gate code..." placeholderTextColor="#bbb" />

                                <TouchableOpacity
                                    style={[styles.saveBtn, (!pinSet || saving) && styles.saveBtnDisabled]}
                                    onPress={handleAdd}
                                    disabled={!pinSet || saving}
                                >
                                    {saving
                                        ? <ActivityIndicator color="#fff" />
                                        : <Text style={styles.saveBtnText}>Save Address</Text>
                                    }
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16, paddingBottom: 100 },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#888', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#aaa', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
    card: {
        backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: 12 },
    iconBadge: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#fff5f0', justifyContent: 'center', alignItems: 'center',
    },
    cardLabel: { fontSize: 15, fontWeight: '700', color: '#333' },
    cardAddress: { fontSize: 13, color: '#666', marginTop: 2 },
    cardCoords: { fontSize: 11, color: '#aaa', marginTop: 2 },
    deleteBtn: { padding: 8 },
    addBtn: {
        position: 'absolute', bottom: 24, left: 20, right: 20,
        backgroundColor: '#ff6b35', padding: 16, borderRadius: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 20, maxHeight: '92%',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
    labelRow: { flexDirection: 'row', gap: 10 },
    labelChip: {
        paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    labelChipActive: { backgroundColor: '#ff6b35' },
    labelChipText: { fontSize: 14, color: '#555', fontWeight: '600' },
    labelChipTextActive: { color: '#fff' },
    locateBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#ff6b35', paddingVertical: 11, borderRadius: 10, marginTop: 6, marginBottom: 8,
    },
    locateBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    mapContainer: { height: 220, borderRadius: 12, overflow: 'hidden', marginTop: 4 },
    mapLocating: {
        position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    },
    mapLocatingText: { fontSize: 12, color: '#555', fontWeight: '600' },
    pinConfirmed: { fontSize: 12, color: '#4CAF50', marginTop: 6, fontWeight: '600' },
    input: {
        backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12,
        fontSize: 15, borderWidth: 1, borderColor: '#eee', color: '#333',
    },
    row: { flexDirection: 'row', gap: 0 },
    saveBtn: {
        backgroundColor: '#ff6b35', padding: 16, borderRadius: 12,
        alignItems: 'center', marginTop: 20, marginBottom: 20,
    },
    saveBtnDisabled: { backgroundColor: '#ccc' },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
