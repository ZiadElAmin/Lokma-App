import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

export const Button = ({ 
    title, 
    onPress, 
    variant = 'primary', 
    size = 'medium',
    loading = false,
    disabled = false,
    icon = null,
    style,
    textStyle,
}) => {
    const getButtonStyle = () => {
        const baseStyle = [styles.button, styles[`button_${variant}`], styles[`button_${size}`]];
        if (disabled || loading) {
            baseStyle.push(styles.buttonDisabled);
        }
        if (style) {
            baseStyle.push(style);
        }
        return baseStyle;
    };

    const getTextStyle = () => {
        const baseStyle = [styles.text, styles[`text_${variant}`], styles[`text_${size}`]];
        if (disabled || loading) {
            baseStyle.push(styles.textDisabled);
        }
        if (textStyle) {
            baseStyle.push(textStyle);
        }
        return baseStyle;
    };

    return (
        <TouchableOpacity
            style={getButtonStyle()}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator 
                    color={variant === 'primary' ? '#fff' : '#ff6b35'} 
                    size="small" 
                />
            ) : (
                <View style={styles.content}>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <Text style={getTextStyle()}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button_primary: {
        backgroundColor: '#ff6b35',
    },
    button_secondary: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#ff6b35',
    },
    button_outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    button_small: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    button_medium: {
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    button_large: {
        paddingVertical: 18,
        paddingHorizontal: 32,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        borderColor: '#ccc',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 8,
    },
    text: {
        fontWeight: '600',
    },
    text_primary: {
        color: '#fff',
    },
    text_secondary: {
        color: '#ff6b35',
    },
    text_outline: {
        color: '#666',
    },
    text_small: {
        fontSize: 14,
    },
    text_medium: {
        fontSize: 16,
    },
    text_large: {
        fontSize: 18,
    },
    textDisabled: {
        color: '#fff',
    },
});

export default Button;
