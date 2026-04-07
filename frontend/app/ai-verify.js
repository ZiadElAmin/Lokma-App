import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Image, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ordersApi from '../api/orders';

const AI_SERVER_URL = 'http://192.168.100.106:8000';

export default function AIVerifyScreen() {
    const { orderId } = useLocalSearchParams();
    const router = useRouter();
    const cameraRef = useRef(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [showCamera, setShowCamera] = useState(false);

    const takePicture = async () => {
        if (cameraRef.current) {
            const photoData = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
            setPhoto(photoData.uri);
            setShowCamera(false);
        }
    };

    const pickFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled && result.assets.length > 0) {
            setPhoto(result.assets[0].uri);
            setResult(null);
        }
    };

    const sendToAI = async () => {
        if (!photo) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: photo,
                type: 'image/jpeg',
                name: 'photo.jpg',
            });
            const response = await fetch(`${AI_SERVER_URL}/verify`, {
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const aiResult = await response.json();
            setResult(aiResult);
            if (aiResult.approved) {
                await ordersApi.acceptOrder(orderId, true);
                Alert.alert(
                    '✅ Approved!',
                    'You are wearing both hairnet and gloves. Order accepted!',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                Alert.alert(
                    '❌ Not Approved',
                    aiResult.message,
                    [{ text: 'Try Again', onPress: () => { setPhoto(null); setResult(null); } }]
                );
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not connect to AI server. Make sure it is running.');
        }
        setLoading(false);
    };

    if (!permission) return <View />;

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>Camera permission is required</Text>
                <TouchableOpacity style={styles.btn} onPress={requestPermission}>
                    <Text style={styles.btnText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (showCamera) {
        return (
            <View style={styles.cameraContainer}>
                <CameraView ref={cameraRef} style={styles.camera} facing="front" />
                <View style={styles.cameraControls}>
                    <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                        <Ionicons name="camera" size={36} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCamera(false)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Ionicons name="shield-checkmark-outline" size={60} color="#ff6b35" />
            <Text style={styles.title}>AI Hygiene Check</Text>
            <Text style={styles.subtitle}>
                Before accepting this order, please take a photo or choose from gallery showing you are wearing your hairnet and gloves.
            </Text>

            {photo ? (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: photo }} style={styles.preview} />
                    <TouchableOpacity style={styles.retakeBtn} onPress={() => { setPhoto(null); setResult(null); }}>
                        <Text style={styles.retakeBtnText}>Choose Different Photo</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.photoOptions}>
                    <TouchableOpacity style={styles.photoOptionBtn} onPress={() => setShowCamera(true)}>
                        <Ionicons name="camera-outline" size={32} color="#fff" />
                        <Text style={styles.photoOptionText}>Take Selfie</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.photoOptionBtn, styles.galleryBtn]} onPress={pickFromGallery}>
                        <Ionicons name="images-outline" size={32} color="#fff" />
                        <Text style={styles.photoOptionText}>Choose from Gallery</Text>
                    </TouchableOpacity>
                </View>
            )}

            {photo && !loading && !result && (
                <TouchableOpacity style={styles.verifyBtn} onPress={sendToAI}>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                    <Text style={styles.verifyBtnText}>Verify & Accept Order</Text>
                </TouchableOpacity>
            )}

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff6b35" />
                    <Text style={styles.loadingText}>Analyzing your photo...</Text>
                </View>
            )}

            {result && (
                <View style={[styles.resultCard, { borderColor: result.approved ? '#4CAF50' : '#f44336' }]}>
                    <Text style={styles.resultTitle}>{result.message}</Text>
                    <Text style={styles.resultDetail}>Hairnet: {result.hairnet ? '✅' : '❌'}</Text>
                    <Text style={styles.resultDetail}>Gloves: {result.gloves ? '✅' : '❌'}</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, alignItems: 'center', padding: 24, backgroundColor: '#f8f9fa' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    permissionText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
    cameraContainer: { flex: 1 },
    camera: { flex: 1 },
    cameraControls: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
    captureBtn: {
        backgroundColor: '#ff6b35', width: 80, height: 80,
        borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    cancelBtn: { padding: 12 },
    cancelText: { color: '#fff', fontSize: 16 },
    photoOptions: { width: '100%', gap: 16, marginBottom: 24 },
    photoOptionBtn: {
        backgroundColor: '#ff6b35', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', paddingVertical: 18, borderRadius: 12, gap: 12,
    },
    galleryBtn: { backgroundColor: '#1a1a1a' },
    photoOptionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    previewContainer: { alignItems: 'center', marginBottom: 24, width: '100%' },
    preview: { width: 280, height: 280, borderRadius: 12, marginBottom: 12 },
    retakeBtn: { padding: 8 },
    retakeBtnText: { color: '#ff6b35', fontSize: 14 },
    verifyBtn: {
        backgroundColor: '#4CAF50', flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, marginBottom: 24, gap: 8,
    },
    verifyBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    loadingContainer: { alignItems: 'center', marginTop: 24 },
    loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
    resultCard: { width: '100%', borderWidth: 2, borderRadius: 12, padding: 16, marginTop: 16 },
    resultTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    resultDetail: { fontSize: 14, color: '#666', marginBottom: 4 },
    btn: { backgroundColor: '#ff6b35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    btnText: { color: '#fff', fontWeight: 'bold' },
});