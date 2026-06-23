import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    RefreshControl, TouchableOpacity, Alert, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import ordersApi from '../../api/orders';
import api from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import API_BASE_URL from '../../config';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

export default function RiderDeliveriesScreen() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [earnings, setEarnings] = useState<{ totalEarnings: number; completedDeliveries: number } | null>(null);
    const [riderLocation, setRiderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const socketRef = useRef<any>(null);
    const locationSubRef = useRef<any>(null);

    // Start broadcasting location for an active delivery
    const startLocationBroadcast = async (orderId: string) => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        if (!socketRef.current) {
            socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
        }
        socketRef.current.emit('join_order', orderId);

        locationSubRef.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
            (loc) => {
                const { latitude, longitude } = loc.coords;
                setRiderLocation({ latitude, longitude });
                socketRef.current?.emit('rider_location', { orderId, latitude, longitude });
            }
        );
        // Get initial position immediately
        const initial = await Location.getCurrentPositionAsync({});
        setRiderLocation({ latitude: initial.coords.latitude, longitude: initial.coords.longitude });
    };

    const stopLocationBroadcast = () => {
        locationSubRef.current?.remove();
        locationSubRef.current = null;
        socketRef.current?.disconnect();
        socketRef.current = null;
    };

    useEffect(() => {
        return () => stopLocationBroadcast();
    }, []);

    const fetchOrders = async () => {
        try {
            const [data, earningsData] = await Promise.all([
                ordersApi.getRiderOrders(),
                api.get('/orders/rider-earnings').then(r => r.data).catch(() => null),
            ]);
            setOrders(data);
            if (earningsData) setEarnings(earningsData);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => { fetchOrders(); }, []);

    const handlePickup = (orderId: string) => {
        Alert.alert('Confirm Pickup', 'You have collected the order from the cook?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Yes, Picked Up',
                onPress: async () => {
                    try {
                        await ordersApi.pickupOrder(orderId);
                        await startLocationBroadcast(orderId);
                        fetchOrders();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to update pickup status');
                    }
                },
            },
        ]);
    };

    const handleDeliver = (orderId: string) => {
        Alert.alert('Confirm Delivery', 'You have delivered this order to the customer?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Yes, Delivered',
                onPress: async () => {
                    try {
                        await ordersApi.deliverOrder(orderId);
                        stopLocationBroadcast();
                        fetchOrders();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to update delivery status');
                    }
                },
            },
        ]);
    };

    const getStatusText = (order: any) => {
        if (order.isDelivered) return 'Delivered';
        if (order.isPickedUp) return 'On the Way';
        return 'Go Pick Up';
    };

    const getStatusColor = (order: any) => {
        if (order.isDelivered) return '#4CAF50';
        if (order.isPickedUp) return '#9C27B0';
        return '#FF9800';
    };

    if (user?.role !== 'Rider' && user?.role !== 'Admin') {
        return (
            <View style={styles.center}>
                <Ionicons name="lock-closed" size={64} color="#ccc" />
                <Text style={styles.accessDeniedText}>Riders Only</Text>
            </View>
        );
    }

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#ff6b35" /></View>;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Deliveries</Text>
                <Text style={styles.headerSubtitle}>{orders.length} total</Text>
            </View>

            {earnings && (
                <View style={styles.earningsCard}>
                    <View style={styles.earningsStat}>
                        <Text style={styles.earningsValue}>EGP {earnings.totalEarnings.toFixed(2)}</Text>
                        <Text style={styles.earningsLabel}>Total Earned</Text>
                    </View>
                    <View style={styles.earningsDivider} />
                    <View style={styles.earningsStat}>
                        <Text style={styles.earningsValue}>{earnings.completedDeliveries}</Text>
                        <Text style={styles.earningsLabel}>Deliveries Done</Text>
                    </View>
                </View>
            )}

            {orders.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="cube-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No deliveries yet</Text>
                    <Text style={styles.emptySubtext}>Claim orders from Available tab</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={['#ff6b35']} />}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
                                <View style={[styles.badge, { backgroundColor: getStatusColor(item) }]}>
                                    <Text style={styles.badgeText}>{getStatusText(item)}</Text>
                                </View>
                            </View>

                            <View style={styles.row}>
                                <Ionicons name="person-outline" size={14} color="#666" />
                                <Text style={styles.detail}>{item.user?.name}</Text>
                            </View>
                            {item.user?.phone && (
                                <TouchableOpacity
                                    style={styles.phoneRow}
                                    onPress={() => Linking.openURL(`tel:${item.user.phone}`)}
                                >
                                    <Ionicons name="call-outline" size={14} color="#4CAF50" />
                                    <Text style={styles.phoneText}>{item.user.phone}</Text>
                                    <Text style={styles.callLabel}>Tap to call</Text>
                                </TouchableOpacity>
                            )}
                            <View style={styles.row}>
                                <Ionicons name="location-outline" size={14} color="#666" />
                                <Text style={styles.detail} numberOfLines={2}>{item.shippingAddress}</Text>
                            </View>

                            <View style={styles.itemsList}>
                                {item.orderItems?.map((oi: any) => (
                                    <Text key={oi.id} style={styles.itemText}>• {oi.qty}x {oi.name}</Text>
                                ))}
                            </View>

                            {/* Navigation map to COOK — shown before pickup */}
                            {!item.isPickedUp && !item.isDelivered && (() => {
                                const cook = item.orderItems?.[0]?.meal?.cook;
                                return cook?.cookLat ? (
                                    <View style={styles.mapContainer}>
                                        <Text style={styles.mapLabel}>🍳 Navigate to cook for pickup</Text>
                                        <WebView
                                            style={styles.map}
                                            originWhitelist={['*']}
                                            source={{ html: `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head>
<body>
<div id="map"></div>
<script>
  var cookLat = ${cook.cookLat};
  var cookLng = ${cook.cookLng};
  var riderLat = ${riderLocation?.latitude || cook.cookLat};
  var riderLng = ${riderLocation?.longitude || cook.cookLng};
  var map = L.map('map').setView([cookLat, cookLng], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'© OpenStreetMap'}).addTo(map);
  var cookIcon = L.divIcon({html:'<div style="font-size:28px;">🍳</div>',iconSize:[28,28],iconAnchor:[14,28],className:''});
  L.marker([cookLat, cookLng], {icon:cookIcon}).addTo(map).bindPopup('${(cook.name || 'Cook').replace(/'/g, "\\'")}');
  var riderIcon = L.divIcon({html:'<div style="font-size:26px;">🛵</div>',iconSize:[26,26],iconAnchor:[13,13],className:''});
  L.marker([riderLat, riderLng], {icon:riderIcon}).addTo(map).bindPopup('You');
  var bounds = L.latLngBounds([[riderLat,riderLng],[cookLat,cookLng]]);
  map.fitBounds(bounds, {padding:[40,40]});
  fetch('https://router.project-osrm.org/route/v1/driving/'+riderLng+','+riderLat+';'+cookLng+','+cookLat+'?overview=full&geometries=geojson')
  .then(r=>r.json()).then(data=>{
    if(data.routes&&data.routes[0]){
      var route=data.routes[0];
      L.geoJSON(route.geometry,{style:{color:'#2196F3',weight:4,opacity:0.9}}).addTo(map);
      var mins=Math.ceil(route.duration/60); var dist=(route.distance/1000).toFixed(1);
      var eta=L.control({position:'bottomleft'});
      eta.onAdd=function(){var d=L.DomUtil.create('div');d.style='background:white;padding:8px 12px;border-radius:10px;font-family:sans-serif;font-size:13px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.2)';d.innerHTML='⏱ ~'+mins+' min | '+dist+' km';return d;};
      eta.addTo(map);
      var nav=L.control({position:'topright'});
      nav.onAdd=function(){var d=L.DomUtil.create('div');d.style='background:#2196F3;padding:8px 12px;border-radius:8px;cursor:pointer;font-family:sans-serif;font-size:12px;color:white;font-weight:bold;';d.innerHTML='🗺 Navigate';d.onclick=function(){window.open('https://www.google.com/maps/dir/'+riderLat+','+riderLng+'/'+cookLat+','+cookLng);};return d;};
      nav.addTo(map);
    }
  }).catch(function(){});
</script>
</body>
</html>`}}
                                            javaScriptEnabled
                                        />
                                    </View>
                                ) : null;
                            })()}

                            {/* Navigation map to CUSTOMER — shown when on the way to customer */}
                            {item.isPickedUp && !item.isDelivered && item.deliveryLat && (
                                <View style={styles.mapContainer}>
                                    <Text style={styles.mapLabel}>📍 Navigate to customer</Text>
                                    <WebView
                                        style={styles.map}
                                        originWhitelist={['*']}
                                        source={{ html: `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head>
<body>
<div id="map"></div>
<script>
  var destLat = ${item.deliveryLat};
  var destLng = ${item.deliveryLng};
  var riderLat = ${riderLocation?.latitude || item.deliveryLat};
  var riderLng = ${riderLocation?.longitude || item.deliveryLng};

  var map = L.map('map').setView([destLat, destLng], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'© OpenStreetMap'}).addTo(map);

  // Customer pin
  var destIcon = L.divIcon({html:'<div style="font-size:28px;">📍</div>',iconSize:[28,28],iconAnchor:[14,28],className:''});
  L.marker([destLat, destLng], {icon:destIcon}).addTo(map).bindPopup("Customer's location");

  // Rider pin
  var riderIcon = L.divIcon({html:'<div style="font-size:26px;">🛵</div>',iconSize:[26,26],iconAnchor:[13,13],className:''});
  var riderMarker = L.marker([riderLat, riderLng], {icon:riderIcon}).addTo(map).bindPopup("You");

  // Fit both on screen
  var bounds = L.latLngBounds([[riderLat,riderLng],[destLat,destLng]]);
  map.fitBounds(bounds, {padding:[40,40]});

  // Draw route via OSRM
  fetch('https://router.project-osrm.org/route/v1/driving/'
    +riderLng+','+riderLat+';'+destLng+','+destLat
    +'?overview=full&geometries=geojson')
  .then(r=>r.json()).then(data=>{
    if(data.routes && data.routes[0]){
      var route = data.routes[0];
      L.geoJSON(route.geometry,{style:{color:'#ff6b35',weight:4,opacity:0.9}}).addTo(map);
      var mins = Math.ceil(route.duration/60);
      var dist = (route.distance/1000).toFixed(1);
      var eta = L.control({position:'bottomleft'});
      eta.onAdd = function(){
        var d = L.DomUtil.create('div');
        d.style='background:white;padding:8px 12px;border-radius:10px;font-family:sans-serif;font-size:13px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.2)';
        d.innerHTML='⏱ ~'+mins+' min &nbsp;|&nbsp; '+dist+' km';
        return d;
      };
      eta.addTo(map);

      // Open in Google Maps button
      var nav = L.control({position:'topright'});
      nav.onAdd = function(){
        var d = L.DomUtil.create('div');
        d.style='background:#ff6b35;padding:8px 12px;border-radius:8px;cursor:pointer;font-family:sans-serif;font-size:12px;color:white;font-weight:bold;';
        d.innerHTML='🗺 Google Maps';
        d.onclick = function(){
          window.open('https://www.google.com/maps/dir/'+riderLat+','+riderLng+'/'+destLat+','+destLng);
        };
        return d;
      };
      nav.addTo(map);
    }
  }).catch(function(){});
</script>
</body>
</html>
                                        `}}
                                        javaScriptEnabled
                                    />
                                </View>
                            )}

                            <View style={styles.cardFooter}>
                                <Text style={styles.price}>EGP {item.totalPrice.toFixed(2)}</Text>
                                {!item.isPickedUp && !item.isDelivered && (
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handlePickup(item.id)}>
                                        <Ionicons name="bag-check-outline" size={16} color="#fff" />
                                        <Text style={styles.actionBtnText}>Mark Picked Up</Text>
                                    </TouchableOpacity>
                                )}
                                {item.isPickedUp && !item.isDelivered && (
                                    <TouchableOpacity style={[styles.actionBtn, styles.deliverBtn]} onPress={() => handleDeliver(item.id)}>
                                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                                        <Text style={styles.actionBtnText}>Mark Delivered</Text>
                                    </TouchableOpacity>
                                )}
                                {item.isDelivered && (
                                    <View style={styles.doneBadge}>
                                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                        <Text style={styles.actionBtnText}>Done</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    accessDeniedText: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 16 },
    header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a1a' },
    headerSubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
    earningsCard: {
        flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16,
        marginTop: 12, borderRadius: 14, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
    },
    earningsStat: { flex: 1, alignItems: 'center' },
    earningsValue: { fontSize: 20, fontWeight: '800', color: '#2196F3' },
    earningsLabel: { fontSize: 12, color: '#888', marginTop: 2 },
    earningsDivider: { width: 1, backgroundColor: '#eee', marginVertical: 4 },
    list: { padding: 16 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
    detail: { fontSize: 14, color: '#555', flex: 1 },
    mapContainer: { marginBottom: 12 },
    mapLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
    map: { width: '100%', height: 220, borderRadius: 10, overflow: 'hidden' },
    phoneRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#f0faf0', borderRadius: 8, padding: 8, marginBottom: 6,
    },
    phoneText: { fontSize: 14, color: '#4CAF50', fontWeight: '600', flex: 1 },
    callLabel: { fontSize: 11, color: '#4CAF50' },
    itemsList: { marginTop: 8, marginBottom: 12 },
    itemText: { fontSize: 13, color: '#444', marginBottom: 2 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
    price: { fontSize: 16, fontWeight: 'bold', color: '#ff6b35' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#9C27B0', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, gap: 6 },
    deliverBtn: { backgroundColor: '#4CAF50' },
    doneBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, gap: 6 },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    emptyText: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#999', marginTop: 8 },
});
