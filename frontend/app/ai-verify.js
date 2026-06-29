import React, { useState, useRef, useEffect } from 'react';
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
    const { orderId, mode } = useLocalSearchParams();
    const isCompliance = mode === 'compliance';
    const router = useRouter();
    const cameraRef = useRef(null);
    const timerRef = useRef(null);
    const [permission, requestPermission] = useCameraPermissions();

    const [step, setStep] = useState('ppe');
    const [photo, setPhoto] = useState(null);
    const [photoBase64, setPhotoBase64] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);       // PPE result
    const [envResult, setEnvResult] = useState(null); // Gemini result
    const [showCamera, setShowCamera] = useState(false);
    const [countdown, setCountdown] = useState(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const resetPhoto = () => { setPhoto(null); setPhotoBase64(null); setResult(null); };

    const takePicture = async () => {
        if (cameraRef.current) {
            const photoData = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
            setPhoto(photoData.uri);
            setPhotoBase64(photoData.base64);
            setShowCamera(false);
        }
    };

    const startTimerAndTakePicture = () => {
        if (countdown !== null) return;
        let timeLeft = 5;
        setCountdown(timeLeft);
        timerRef.current = setInterval(async () => {
            timeLeft -= 1;
            if (timeLeft > 0) {
                setCountdown(timeLeft);
            } else {
                clearInterval(timerRef.current);
                setCountdown(null);
                await takePicture();
            }
        }, 1000);
    };

    const handleCancelCamera = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setCountdown(null);
        setShowCamera(false);
    };

    const pickFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });
        if (!res.canceled && res.assets.length > 0) {
            setPhoto(res.assets[0].uri);
            setPhotoBase64(res.assets[0].base64);
            setResult(null);
        }
    };

    const sendToAI = async () => {
        if (!photo) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', { uri: photo, type: 'image/jpeg', name: 'photo.jpg' });
            const response = await fetch(`${AI_SERVER_URL}/verify`, {
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const aiResult = await response.json();
            setResult(aiResult);

            if (aiResult.approved) {
                if (isCompliance) {
                    await ordersApi.submitCompliance(orderId, true);
                    Alert.alert('✅ Compliance Confirmed', 'Thanks! Your next check is in 10 minutes.', [
                        { text: 'OK', onPress: () => router.back() },
                    ]);
                } else {
                    Alert.alert('✅ PPE Approved', 'Now take a photo of your kitchen so we can check it is safe to cook.', [
                        { text: 'Continue', onPress: () => { setStep('env'); resetPhoto(); } },
                    ]);
                }
            } else {
                Alert.alert('❌ Not Approved', aiResult.message, [
                    { text: 'Try Again', onPress: resetPhoto },
                ]);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not connect to the PPE server. Make sure it is running.');
        }
        setLoading(false);
    };

    const sendEnvToAI = async () => {
        if (!photoBase64) {
            Alert.alert('No photo', 'Please retake the kitchen photo.');
            return;
        }
        setLoading(true);
        try {
            const res = await ordersApi.envCheck(orderId, photoBase64, 'image/jpeg');
            setEnvResult(res);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not run the kitchen safety check.');
        }
        setLoading(false);
    };

    const finalizeAccept = async () => {
        setLoading(true);
        try {
            await ordersApi.acceptOrder(orderId, true);
            Alert.alert('✅ Order Accepted', 'You are all set. Remember to re-check every 10 minutes!', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (err) {
            Alert.alert('Error', err?.response?.data?.message || 'Could not accept the order.');
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
                <CameraView ref={cameraRef} style={styles.camera} facing={step === 'env' ? 'back' : 'front'} />
                {countdown !== null && (
                    <View style={styles.countdownOverlay}>
                        <Text style={styles.countdownText}>{countdown}</Text>
                    </View>
                )}
                <View style={styles.cameraControls}>
                    <TouchableOpacity
                        style={[styles.captureBtn, countdown !== null && styles.captureBtnDisabled]}
                        onPress={startTimerAndTakePicture}
                        disabled={countdown !== null}
                    >
                        <Ionicons name="camera" size={36} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelCamera}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (step === 'env') {
        return (
            <ScrollView contentContainerStyle={styles.container}>
                <TouchableOpacity
                    style={styles.backRow}
                    onPress={() => { setStep('ppe'); resetPhoto(); setEnvResult(null); }}
                >
                    <Ionicons name="arrow-back" size={22} color="#ff6b35" />
                    <Text style={styles.backText}>Back to PPE check</Text>
                </TouchableOpacity>
                <Ionicons name="home-outline" size={60} color="#ff6b35" />
                <Text style={styles.title}>Kitchen Safety Check</Text>
                <Text style={styles.subtitle}>
                    Take a photo of your cooking area. Our AI will check it is clean and safe, and give you tips.
                </Text>

                {photo ? (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: photo }} style={styles.preview} />
                        <TouchableOpacity style={styles.retakeBtn} onPress={resetPhoto}>
                            <Text style={styles.retakeBtnText}>Choose Different Photo</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.photoOptions}>
                        <TouchableOpacity style={styles.photoOptionBtn} onPress={() => setShowCamera(true)}>
                            <Ionicons name="camera-outline" size={32} color="#fff" />
                            <Text style={styles.photoOptionText}>Take Photo</Text>
                        </TouchableOpacity>
                        {/* TESTING-ONLY: gallery upload. Uncomment to re-enable choosing a kitchen photo from the gallery.
                        <TouchableOpacity style={[styles.photoOptionBtn, styles.galleryBtn]} onPress={pickFromGallery}>
                            <Ionicons name="images-outline" size={32} color="#fff" />
                            <Text style={styles.photoOptionText}>Choose from Gallery</Text>
                        </TouchableOpacity>
                        */}
                    </View>
                )}

                {photo && !loading && !envResult && (
                    <TouchableOpacity style={styles.verifyBtn} onPress={sendEnvToAI}>
                        <Ionicons name="sparkles-outline" size={22} color="#fff" />
                        <Text style={styles.verifyBtnText}>Analyze Kitchen</Text>
                    </TouchableOpacity>
                )}

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#ff6b35" />
                        <Text style={styles.loadingText}>Checking your kitchen...</Text>
                    </View>
                )}

                {envResult && (
                    <View style={[styles.resultCard, {
                        borderColor: envResult.safe === false ? '#f44336' : envResult.safe === true ? '#4CAF50' : '#FF9800',
                    }]}>
                        <Text style={styles.resultTitle}>
                            {envResult.safe === true ? '✅ Yes — you can continue'
                                : envResult.safe === false ? '❌ No — please fix the issues below'
                                : 'ℹ️ Advisory'}
                        </Text>
                        <Text style={styles.resultDetail}>{envResult.recommendations}</Text>
                    </View>
                )}

                {envResult && envResult.safe !== false && (
                    <TouchableOpacity style={[styles.verifyBtn, { backgroundColor: '#4CAF50' }]} onPress={finalizeAccept} disabled={loading}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                        <Text style={styles.verifyBtnText}>Accept Order</Text>
                    </TouchableOpacity>
                )}

                {envResult && envResult.safe === false && (
                    <TouchableOpacity style={[styles.verifyBtn, { backgroundColor: '#ff6b35' }]} onPress={() => { resetPhoto(); setEnvResult(null); }} disabled={loading}>
                        <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
                        <Text style={styles.verifyBtnText}>Clean Up & Retake</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Ionicons name="shield-checkmark-outline" size={60} color="#ff6b35" />
            <Text style={styles.title}>{isCompliance ? 'Compliance Re-Check' : 'AI Hygiene Check'}</Text>
            <Text style={styles.subtitle}>
                {isCompliance
                    ? 'Take a new photo to confirm you are still wearing your hairnet and gloves.'
                    : 'Before accepting this order, take a photo showing you are wearing your hairnet and gloves.'}
            </Text>

            {photo ? (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: photo }} style={styles.preview} />
                    <TouchableOpacity style={styles.retakeBtn} onPress={resetPhoto}>
                        <Text style={styles.retakeBtnText}>Choose Different Photo</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.photoOptions}>
                    <TouchableOpacity style={styles.photoOptionBtn} onPress={() => setShowCamera(true)}>
                        <Ionicons name="camera-outline" size={32} color="#fff" />
                        <Text style={styles.photoOptionText}>Take Selfie</Text>
                    </TouchableOpacity>
                    {/* TESTING-ONLY: gallery upload. Uncomment to re-enable choosing a PPE selfie from the gallery.
                    <TouchableOpacity style={[styles.photoOptionBtn, styles.galleryBtn]} onPress={pickFromGallery}>
                        <Ionicons name="images-outline" size={32} color="#fff" />
                        <Text style={styles.photoOptionText}>Choose from Gallery</Text>
                    </TouchableOpacity>
                    */}
                </View>
            )}

            {photo && !loading && !result && (
                <TouchableOpacity style={styles.verifyBtn} onPress={sendToAI}>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                    <Text style={styles.verifyBtnText}>{isCompliance ? 'Verify' : 'Verify & Continue'}</Text>
                </TouchableOpacity>
            )}

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff6b35" />
                    <Text style={styles.loadingText}>Analysing your photo...</Text>
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
    backRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginBottom: 8 },
    backText: { color: '#ff6b35', fontSize: 16, fontWeight: '600' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    permissionText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
    cameraContainer: { flex: 1 },
    camera: { flex: 1 },
    cameraControls: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
    captureBtn: {
        backgroundColor: '#ff6b35', width: 80, height: 80,
        borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    captureBtnDisabled: { backgroundColor: '#ccc' },
    countdownOverlay: { position: 'absolute', top: '40%', width: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    countdownText: {
        fontSize: 100, fontWeight: 'bold', color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10,
    },
    cancelBtn: { padding: 12 },
    cancelText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 5 },
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
    resultCard: { width: '100%', borderWidth: 2, borderRadius: 12, padding: 16, marginTop: 16, marginBottom: 16, backgroundColor: '#fff' },
    resultTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    resultDetail: { fontSize: 14, color: '#666', marginBottom: 4, lineHeight: 20 },
    btn: { backgroundColor: '#ff6b35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    btnText: { color: '#fff', fontWeight: 'bold' },
});
