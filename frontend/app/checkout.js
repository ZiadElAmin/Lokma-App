import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, ScrollView, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../hooks/useCart';
import { SafeAreaView } from 'react-native-safe-area-context';
import ordersApi from '../api/orders';
import addressesApi from '../api/addresses';
import withAuth from '../components/withAuth';

// Default center: Cairo
const DEFAULT_LAT = 30.0444;
const DEFAULT_LNG = 31.2357;

const mapHTML = (lat, lng) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .instruction {
      position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.65); color: #fff; padding: 6px 14px;
      border-radius: 20px; font-size: 13px; z-index: 999; white-space: nowrap;
      font-family: sans-serif;
    }
  </style>
</head>
<body>
  <div class="instruction">📍 Tap to place your delivery pin</div>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var pinIcon = L.divIcon({
      html: '<div style="font-size:32px;line-height:1;">📍</div>',
      iconSize: [32, 32], iconAnchor: [16, 32], className: ''
    });

    var marker = L.marker([${lat}, ${lng}], { icon: pinIcon, draggable: true }).addTo(map);

    function sendLocation(latlng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        lat: latlng.lat, lng: latlng.lng
      }));
    }

    // Drag marker
    marker.on('dragend', function(e) {
      sendLocation(e.target.getLatLng());
    });

    // Tap map to move marker
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      sendLocation(e.latlng);
    });

    // Send initial position
    sendLocation(marker.getLatLng());
  </script>
</body>
</html>
`;

const CheckoutScreen = () => {
    const [pin, setPin] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
    const [pinSet, setPinSet] = useState(false);
    const [building, setBuilding] = useState('');
    const [floor, setFloor] = useState('');
    const [apartment, setApartment] = useState('');
    const [addressNote, setAddressNote] = useState('');
    const [loading, setLoading] = useState(false);

    // Saved addresses
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showNewPin, setShowNewPin] = useState(false);

    const { cartItems, clearCart, getCartTotal } = useCart();
    const router = useRouter();
    const webviewRef = useRef(null);

    useEffect(() => {
        addressesApi.getAddresses().then(data => {
            setSavedAddresses(data);
            if (data.length > 0) {
                // Auto-select first saved address
                setSelectedAddressId(data[0].id);
            } else {
                setShowNewPin(true);
            }
        }).catch(() => setShowNewPin(true));
    }, []);

    const handleMapMessage = (event) => {
        try {
            const { lat, lng } = JSON.parse(event.nativeEvent.data);
            setPin({ lat, lng });
            setPinSet(true);
        } catch {}
    };

    const handleCheckout = async () => {
        let deliveryLat, deliveryLng, fullAddress;

        if (selectedAddressId) {
            const addr = savedAddresses.find(a => a.id === selectedAddressId);
            deliveryLat = addr.lat;
            deliveryLng = addr.lng;
            const parts = [addr.building];
            if (addr.floor) parts.push(`Floor ${addr.floor}`);
            if (addr.apartment) parts.push(`Apt ${addr.apartment}`);
            if (addr.notes) parts.push(addr.notes);
            fullAddress = `${addr.label}: ${parts.join(', ')}`;
        } else {
            if (!pinSet) {
                Alert.alert('Set delivery location', 'Please tap the map to drop a pin at your delivery address.');
                return;
            }
            if (!building.trim()) {
                Alert.alert('Missing info', 'Please enter your building or street name.');
                return;
            }
            deliveryLat = pin.lat;
            deliveryLng = pin.lng;
            const parts = [building.trim()];
            if (floor.trim()) parts.push(`Floor ${floor.trim()}`);
            if (apartment.trim()) parts.push(`Apt ${apartment.trim()}`);
            if (addressNote.trim()) parts.push(addressNote.trim());
            fullAddress = parts.join(', ');
        }

        setLoading(true);
        const orderItems = cartItems.map(item => ({
            name: item.name,
            qty: item.qty,
            image: item.image,
            price: item.price,
            meal: item.id,
        }));

        const order = {
            orderItems,
            shippingAddress: fullAddress,
            paymentMethod: 'Cash on Delivery',
            itemsPrice: getCartTotal(),
            taxPrice: getCartTotal() * 0.05,
            shippingPrice: 2.99,
            totalPrice: getCartTotal() + (getCartTotal() * 0.05) + 2.99,
            deliveryLat,
            deliveryLng,
        };

        try {
            const createdOrder = await ordersApi.createOrder(order);
            clearCart();
            router.replace(`/payment/${createdOrder.id}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to place order. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Checkout</Text>

                {/* Delivery Location */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📍 Delivery Location</Text>

                    {/* Saved addresses */}
                    {savedAddresses.length > 0 && (
                        <>
                            {savedAddresses.map(addr => {
                                const parts = [addr.building];
                                if (addr.floor) parts.push(`Floor ${addr.floor}`);
                                if (addr.apartment) parts.push(`Apt ${addr.apartment}`);
                                const isSelected = selectedAddressId === addr.id;
                                return (
                                    <TouchableOpacity
                                        key={addr.id}
                                        style={[styles.addrCard, isSelected && styles.addrCardSelected]}
                                        onPress={() => { setSelectedAddressId(addr.id); setShowNewPin(false); }}
                                    >
                                        <View style={styles.addrRadio}>
                                            <Ionicons
                                                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                                size={20}
                                                color={isSelected ? '#ff6b35' : '#ccc'}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.addrLabel}>{addr.label}</Text>
                                            <Text style={styles.addrText}>{parts.join(', ')}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}

                            {/* Use new pin option */}
                            <TouchableOpacity
                                style={[styles.addrCard, (showNewPin && !selectedAddressId) && styles.addrCardSelected]}
                                onPress={() => { setSelectedAddressId(null); setShowNewPin(true); }}
                            >
                                <View style={styles.addrRadio}>
                                    <Ionicons
                                        name={(showNewPin && !selectedAddressId) ? 'radio-button-on' : 'radio-button-off'}
                                        size={20}
                                        color={(showNewPin && !selectedAddressId) ? '#ff6b35' : '#ccc'}
                                    />
                                </View>
                                <Text style={styles.addrLabel}>Use a different location</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Map — shown if no saved addresses or user chose new pin */}
                    {(showNewPin || savedAddresses.length === 0) && !selectedAddressId && (
                        <>
                            <Text style={styles.mapHint}>Tap anywhere on the map or drag the pin to your exact door</Text>
                            <View style={styles.mapContainer}>
                                <WebView
                                    ref={webviewRef}
                                    style={styles.map}
                                    originWhitelist={['*']}
                                    source={{ html: mapHTML(DEFAULT_LAT, DEFAULT_LNG) }}
                                    onMessage={handleMapMessage}
                                    scrollEnabled={false}
                                    javaScriptEnabled
                                />
                            </View>
                            {pinSet && (
                                <View style={styles.pinConfirmed}>
                                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                    <Text style={styles.pinConfirmedText}>
                                        Pin set at {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                                    </Text>
                                </View>
                            )}
                            <TextInput style={styles.input} placeholder="Building / Street name *"
                                value={building} onChangeText={setBuilding} placeholderTextColor="#aaa" />
                            <View style={styles.row}>
                                <TextInput style={[styles.input, styles.halfInput]} placeholder="Floor"
                                    value={floor} onChangeText={setFloor} keyboardType="numeric" placeholderTextColor="#aaa" />
                                <TextInput style={[styles.input, styles.halfInput]} placeholder="Apartment No."
                                    value={apartment} onChangeText={setApartment} placeholderTextColor="#aaa" />
                            </View>
                            <TextInput style={styles.input} placeholder="Additional notes (landmarks, ring bell, etc.)"
                                value={addressNote} onChangeText={setAddressNote} placeholderTextColor="#aaa" />
                        </>
                    )}
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>EGP {getCartTotal().toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tax (5%)</Text>
                        <Text style={styles.summaryValue}>EGP {(getCartTotal() * 0.05).toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery</Text>
                        <Text style={styles.summaryValue}>EGP 2.99</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalText}>Total</Text>
                        <Text style={styles.totalText}>
                            EGP {(getCartTotal() + (getCartTotal() * 0.05) + 2.99).toFixed(2)}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.orderBtn, (!selectedAddressId && !pinSet || loading) && styles.orderBtnDisabled]}
                    onPress={handleCheckout}
                    disabled={(!selectedAddressId && !pinSet) || loading}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.orderBtnText}>Place Order</Text>
                    }
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    flex: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#333' },
    section: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6, color: '#333' },
    mapHint: { fontSize: 13, color: '#888', marginBottom: 12 },
    mapContainer: { height: 280, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
    map: { flex: 1 },
    pinConfirmed: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, marginBottom: 6 },
    pinConfirmedText: { fontSize: 13, color: '#4CAF50', fontWeight: '600' },
    row: { flexDirection: 'row', gap: 10 },
    input: {
        backgroundColor: '#f8f9fa', borderRadius: 8, padding: 14,
        marginTop: 10, fontSize: 15, borderWidth: 1, borderColor: '#eee', color: '#333',
    },
    halfInput: { flex: 1 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: 15, color: '#666' },
    summaryValue: { fontSize: 15, color: '#333' },
    totalRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee', marginBottom: 0 },
    totalText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    addrCard: {
        flexDirection: 'row', alignItems: 'center', padding: 12,
        borderRadius: 10, borderWidth: 1.5, borderColor: '#eee',
        marginBottom: 8, backgroundColor: '#fafafa',
    },
    addrCardSelected: { borderColor: '#ff6b35', backgroundColor: '#fff5f0' },
    addrRadio: { marginRight: 10 },
    addrLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
    addrText: { fontSize: 12, color: '#888', marginTop: 2 },
    orderBtn: {
        backgroundColor: '#ff6b35', marginHorizontal: 16, marginVertical: 20,
        padding: 16, borderRadius: 12, alignItems: 'center',
    },
    orderBtnDisabled: { backgroundColor: '#ccc' },
    orderBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default withAuth(CheckoutScreen);
