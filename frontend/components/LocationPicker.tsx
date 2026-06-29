import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export const DEFAULT_LAT = 30.0444;   // Cairo
export const DEFAULT_LNG = 31.2357;

export type Coords = { lat: number; lng: number };

const mapHTML = (lat: number, lng: number) => `
<!DOCTYPE html><html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html,body,#map{height:100%;margin:0;padding:0;}
  .tip{position:absolute;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.65);color:#fff;padding:6px 14px;border-radius:20px;font-size:13px;z-index:999;white-space:nowrap;font-family:sans-serif;}</style>
</head>
<body>
  <div class="tip">📍 Drag the pin or tap to adjust</div>
  <div id="map"></div>
  <script>
    var map = L.map('map',{attributionControl:false}).setView([${lat},${lng}],15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);
    var icon = L.divIcon({html:'<div style="font-size:32px;line-height:1;">📍</div>',iconSize:[32,32],iconAnchor:[16,32],className:''});
    var marker = L.marker([${lat},${lng}],{icon:icon,draggable:true}).addTo(map);
    function send(ll){window.ReactNativeWebView.postMessage(JSON.stringify({lat:ll.lat,lng:ll.lng}));}
    marker.on('dragend',function(e){send(e.target.getLatLng());});
    map.on('click',function(e){marker.setLatLng(e.latlng);send(e.latlng);});
    send(marker.getLatLng());
  </script>
</body></html>`;

type Props = {
    initial?: Coords | null;
    onChange: (c: Coords) => void;
    height?: number;
    autoLocate?: boolean;
};

export default function LocationPicker({ initial, onChange, height = 220, autoLocate = true }: Props) {
    const [pin, setPin] = useState<Coords>(initial || { lat: DEFAULT_LAT, lng: DEFAULT_LNG });
    const [mapKey, setMapKey] = useState(0);
    const [locating, setLocating] = useState(false);

    const locateMe = async () => {
        setLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Location permission needed', 'Allow location access to use your current position.');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const c = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            setPin(c);
            onChange(c);
            setMapKey(k => k + 1);
        } catch {
            Alert.alert('Could not get location', 'Make sure location services are on and try again.');
        } finally {
            setLocating(false);
        }
    };

    useEffect(() => {
        if (autoLocate) locateMe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View>
            <TouchableOpacity style={styles.locateBtn} onPress={locateMe} disabled={locating}>
                <Ionicons name="locate" size={18} color="#fff" />
                <Text style={styles.locateBtnText}>
                    {locating ? 'Locating…' : 'Use my current location'}
                </Text>
            </TouchableOpacity>
            <View
                style={[styles.mapContainer, { height }]}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderTerminationRequest={() => false}
            >
                <WebView
                    key={mapKey}
                    originWhitelist={['*']}
                    source={{ html: mapHTML(pin.lat, pin.lng) }}
                    onMessage={(e) => {
                        try {
                            const { lat, lng } = JSON.parse(e.nativeEvent.data);
                            setPin({ lat, lng });
                            onChange({ lat, lng });
                        } catch { }
                    }}
                    javaScriptEnabled
                    nestedScrollEnabled
                    scrollEnabled={false}
                    style={{ flex: 1 }}
                />
                {locating && (
                    <View style={styles.mapLocating}>
                        <ActivityIndicator color="#ff6b35" />
                        <Text style={styles.mapLocatingText}>Finding your location…</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    locateBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#ff6b35', paddingVertical: 11, borderRadius: 10, marginTop: 6, marginBottom: 8,
    },
    locateBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    mapContainer: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
    mapLocating: {
        position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    },
    mapLocatingText: { fontSize: 12, color: '#555', fontWeight: '600' },
});
