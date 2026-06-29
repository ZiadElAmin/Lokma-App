import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [localAvatar, setLocalAvatar] = useState<string | null>(user?.avatar || null);

    const handlePickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow access to your photos to set a profile picture.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled && result.assets[0].base64) {
            const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setUploadingAvatar(true);
            try {
                await api.put('/users/avatar', { avatar: base64Uri });
                setLocalAvatar(base64Uri);
                updateUser({ avatar: base64Uri });
            } catch (err: any) {
                Alert.alert('Upload Failed', err.response?.data?.message || 'Could not save photo');
            }
            setUploadingAvatar(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }
        if (!email.trim()) {
            Alert.alert('Error', 'Email cannot be empty');
            return;
        }
        setSaving(true);
        try {
            const res = await api.put('/users/profile', {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || null,
                bio: bio.trim() || null,
            });
            updateUser(res.data);
            Alert.alert('✅ Saved', 'Your profile has been updated.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
        }
        setSaving(false);
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Edit Profile', headerBackTitle: 'Back' }} />
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.content}>
                        {/* Avatar */}
                        <View style={styles.avatarSection}>
                            <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrapper} disabled={uploadingAvatar}>
                                {localAvatar ? (
                                    <Image source={{ uri: localAvatar }} style={styles.avatarImage} />
                                ) : (
                                    <View style={styles.avatar}>
                                        <Ionicons name="person" size={48} color="#fff" />
                                    </View>
                                )}
                                <View style={styles.cameraOverlay}>
                                    {uploadingAvatar
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <Ionicons name="camera" size={18} color="#fff" />
                                    }
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.changePhotoText}>Tap to change photo</Text>
                            <View style={[styles.roleBadge]}>
                                <Text style={styles.roleText}>{user?.role}</Text>
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={styles.inputRow}>
                                    <Ionicons name="person-outline" size={18} color="#888" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Your name"
                                        placeholderTextColor="#bbb"
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.field}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputRow}>
                                    <Ionicons name="mail-outline" size={18} color="#888" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="you@example.com"
                                        placeholderTextColor="#bbb"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.field}>
                                <Text style={styles.label}>Phone Number</Text>
                                <View style={styles.inputRow}>
                                    <Ionicons name="call-outline" size={18} color="#888" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="+20 1XX XXX XXXX"
                                        placeholderTextColor="#bbb"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            {user?.role === 'Cook' && (
                                <>
                                    <View style={styles.divider} />
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Bio</Text>
                                        <TextInput
                                            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                                            value={bio}
                                            onChangeText={setBio}
                                            placeholder="Tell customers about yourself and your cooking..."
                                            placeholderTextColor="#bbb"
                                            multiline
                                            maxLength={200}
                                        />
                                        <Text style={{ fontSize: 11, color: '#bbb', marginTop: 4, textAlign: 'right' }}>{bio.length}/200</Text>
                                    </View>
                                </>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color="#fff" />
                                : <>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                  </>
                            }
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    content: { padding: 20, paddingBottom: 40 },
    avatarSection: { alignItems: 'center', marginBottom: 24 },
    avatarWrapper: { position: 'relative', marginBottom: 8 },
    avatarImage: { width: 90, height: 90, borderRadius: 45 },
    avatar: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: '#ff6b35', justifyContent: 'center', alignItems: 'center',
    },
    cameraOverlay: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#333', width: 28, height: 28,
        borderRadius: 14, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#fff',
    },
    changePhotoText: { fontSize: 13, color: '#888', marginBottom: 10 },
    roleBadge: {
        backgroundColor: '#fff5f0', paddingHorizontal: 16, paddingVertical: 6,
        borderRadius: 16,
    },
    roleText: { fontSize: 13, fontWeight: '600', color: '#ff6b35' },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    field: { padding: 16 },
    label: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#333' },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },
    saveBtn: {
        backgroundColor: '#ff6b35', marginTop: 24, padding: 16,
        borderRadius: 14, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
    },
    saveBtnDisabled: { backgroundColor: '#ccc' },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
