import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { io } from 'socket.io-client';
import ordersApi from '../../api/orders';
import { useAuth } from '../../hooks/useAuth';
import API_BASE_URL from '../../config';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

const OrderDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const [riderLocation, setRiderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await ordersApi.getOrderById(id);
                setOrder(data);
                // Connect to socket if order is picked up / on the way
                if (data.isPickedUp && !data.isDelivered) {
                    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
                    socketRef.current.emit('join_order', id);
                    socketRef.current.on('location_update', (loc: any) => {
                        setRiderLocation(loc);
                    });
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load order');
            }
            setLoading(false);
        };
        fetchOrder();
        return () => {
            socketRef.current?.disconnect();
        };
    }, [id]);

    const getStatusColor = (order: any) => {
        if (order.isDelivered) return '#4CAF50';
        if (order.isPickedUp) return '#9C27B0';
        if (order.isReadyForPickup) return '#009688';
        if (order.isAccepted) return '#2196F3';
        if (order.isRejected) return '#f44336';
        if (order.isPaid) return '#FF9800';
        return '#999';
    };

    const getStatusText = (order: any) => {
        if (order.isDelivered) return '✅ Delivered';
        if (order.isPickedUp) return '🛵 Rider on the way';
        if (order.isReadyForPickup) return '🍱 Ready — awaiting rider';
        if (order.isAccepted) return '👨‍🍳 Being prepared';
        if (order.isRejected) return '❌ Rejected';
        if (order.isPaid) return '⏳ Waiting for cook';
        return '💳 Pending Payment';
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b35" />
            </View>
        );
    }

    if (error || !order) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={60} color="#ff6b35" />
                <Text style={styles.errorText}>{error || 'Order not found'}</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: `Order #${order.id.slice(-6).toUpperCase()}` }} />
            <ScrollView style={styles.container}>
                <View style={styles.statusCard}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order) }]}>
                        <Text style={styles.statusText}>{getStatusText(order)}</Text>
                    </View>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                </View>

                {/* Live Map
                    Cook  → sees rider approaching UNTIL pickup
                    Customer → sees rider on the way AFTER pickup            */}
                {((user?.role === 'Cook' && order.riderId && !order.isPickedUp) ||
                  (user?.role !== 'Cook' && order.isPickedUp && !order.isDelivered)) && (
                    <View style={styles.mapSection}>
                        <Text style={styles.sectionTitle}>
                            {user?.role === 'Cook' ? '🛵 Rider is coming to pick up' : '🛵 Live Tracking'}
                        </Text>
                        {riderLocation ? (
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
  var riderLat = ${riderLocation.latitude};
  var riderLng = ${riderLocation.longitude};
  var isCookView = ${user?.role === 'Cook' ? 'true' : 'false'};
  var destLat = ${order.deliveryLat || riderLocation.latitude};
  var destLng = ${order.deliveryLng || riderLocation.longitude};
  var hasDestination = ${(order.deliveryLat && user?.role !== 'Cook') ? 'true' : 'false'};

  var map = L.map('map').setView([riderLat, riderLng], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // Rider marker
  var riderIcon = L.divIcon({
    html: '<div style="font-size:28px;line-height:1;">🛵</div>',
    iconSize:[28,28], iconAnchor:[14,14], className:''
  });
  var riderMarker = L.marker([riderLat, riderLng], {icon: riderIcon}).addTo(map);
  riderMarker.bindPopup('Your rider').openPopup();

  // Customer destination marker
  if (hasDestination) {
    var destIcon = L.divIcon({
      html: '<div style="font-size:28px;line-height:1;">📍</div>',
      iconSize:[28,28], iconAnchor:[14,28], className:''
    });
    L.marker([destLat, destLng], {icon: destIcon}).addTo(map).bindPopup('Your location');

    // Fit map to show both markers
    var bounds = L.latLngBounds([[riderLat, riderLng],[destLat, destLng]]);
    map.fitBounds(bounds, {padding:[40,40]});

    // Draw route using OSRM (free, no API key)
    fetch('https://router.project-osrm.org/route/v1/driving/'
      + riderLng + ',' + riderLat + ';'
      + destLng + ',' + destLat
      + '?overview=full&geometries=geojson')
    .then(r => r.json())
    .then(data => {
      if (data.routes && data.routes[0]) {
        var route = data.routes[0];
        L.geoJSON(route.geometry, {
          style: { color: '#ff6b35', weight: 4, opacity: 0.8 }
        }).addTo(map);

        // ETA
        var mins = Math.ceil(route.duration / 60);
        var dist = (route.distance / 1000).toFixed(1);
        var info = L.control({position: 'bottomleft'});
        info.onAdd = function() {
          var d = L.DomUtil.create('div');
          d.style = 'background:white;padding:8px 12px;border-radius:10px;font-family:sans-serif;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.2)';
          d.innerHTML = '⏱ ~' + mins + ' min &nbsp;|&nbsp; ' + dist + ' km';
          return d;
        };
        info.addTo(map);
      }
    }).catch(function(){});
  }
</script>
</body>
</html>
                                `}}
                            />
                        ) : (
                            <View style={styles.mapPlaceholder}>
                                <ActivityIndicator color="#ff6b35" />
                                <Text style={styles.mapWaiting}>Waiting for rider location...</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Address</Text>
                    <View style={styles.addressCard}>
                        <Ionicons name="location" size={24} color="#ff6b35" />
                        <Text style={styles.address}>{order.shippingAddress}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Items</Text>
                    {order.orderItems?.map((item, index) => (
                        <View key={item.id || index} style={styles.itemCard}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemQty}>Qty: {item.qty}</Text>
                            </View>
                            <Text style={styles.itemPrice}>EGP {(item.price * item.qty).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Summary</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>EGP {order.itemsPrice?.toFixed(2) || '0.00'}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax</Text>
                            <Text style={styles.summaryValue}>EGP {order.taxPrice?.toFixed(2) || '0.00'}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Delivery</Text>
                            <Text style={styles.summaryValue}>EGP {order.shippingPrice?.toFixed(2) || '0.00'}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>EGP {order.totalPrice?.toFixed(2) || '0.00'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <View style={styles.paymentCard}>
                        <Ionicons name="card" size={24} color="#666" />
                        <Text style={styles.paymentMethod}>{order.paymentMethod}</Text>
                    </View>
                </View>
            </ScrollView>
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
    },
    statusCard: {
        backgroundColor: '#fff',
        padding: 20,
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    orderDate: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 12,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
    },
    address: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
    },
    itemQty: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    summaryCard: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        color: '#333',
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        marginBottom: 0,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ff6b35',
    },
    paymentCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f8f9fa', padding: 16, borderRadius: 8,
    },
    paymentMethod: { marginLeft: 12, fontSize: 15, color: '#333' },
    mapSection: { backgroundColor: '#fff', marginTop: 12, padding: 16 },
    map: { width: '100%', height: 250, borderRadius: 12, marginTop: 8, overflow: 'hidden' },
    mapPlaceholder: {
        height: 120, justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#f8f9fa', borderRadius: 12, marginTop: 8, gap: 8,
    },
    mapWaiting: { fontSize: 14, color: '#888' },
    riderMarker: {
        backgroundColor: '#ff6b35', borderRadius: 20, padding: 6,
        borderWidth: 2, borderColor: '#fff',
    },
});

export default OrderDetailScreen;
