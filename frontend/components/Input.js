import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const Input = ({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType = 'default',
    autoCapitalize = 'none',
    error,
    icon,
    rightIcon,
    onRightIconPress,
    style,
    inputStyle,
    multiline,
    numberOfLines,
    maxLength,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const getInputStyle = () => {
        const baseStyle = [styles.input];
        if (isFocused) {
            baseStyle.push(styles.inputFocused);
        }
        if (error) {
            baseStyle.push(styles.inputError);
        }
        if (inputStyle) {
            baseStyle.push(inputStyle);
        }
        return baseStyle;
    };

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
                {icon && (
                    <Ionicons 
                        name={icon} 
                        size={20} 
                        color={isFocused ? '#ff6b35' : '#888'} 
                        style={styles.icon} 
                    />
                )}
                <TextInput
                    style={[styles.input, icon && styles.inputWithIcon]}
                    placeholder={placeholder}
                    placeholderTextColor="#aaa"
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !showPassword}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    maxLength={maxLength}
                />
                {secureTextEntry && (
                    <TouchableOpacity 
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons 
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                            size={20} 
                            color="#888" 
                        />
                    </TouchableOpacity>
                )}
                {rightIcon && !secureTextEntry && (
                    <TouchableOpacity onPress={onRightIconPress} style={styles.eyeIcon}>
                        <Ionicons name={rightIcon} size={20} color="#888" />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e8e8e8',
    },
    inputContainerFocused: {
        borderColor: '#ff6b35',
        backgroundColor: '#fff',
    },
    icon: {
        marginLeft: 14,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 14,
        fontSize: 16,
        color: '#1a1a1a',
    },
    inputWithIcon: {
        paddingLeft: 10,
    },
    inputFocused: {
        borderColor: '#ff6b35',
    },
    inputError: {
        borderColor: '#ff4444',
    },
    eyeIcon: {
        padding: 14,
    },
    errorText: {
        fontSize: 12,
        color: '#ff4444',
        marginTop: 6,
        marginLeft: 4,
    },
});

export default Input;
