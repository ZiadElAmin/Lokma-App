import React, { useState, useContext, createContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (item) => {
        const existingItem = cartItems.find((i) => i.id === item.id);
        if (existingItem) {
            setCartItems(cartItems.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + 1 } : i
            ));
        } else {
            setCartItems([...cartItems, { ...item, qty: 1 }]);
        }
    };

    const removeFromCart = (itemId) => {
        setCartItems(cartItems.filter((item) => item.id !== itemId));
    };

    const updateCartItemQuantity = (itemId, qty) => {
        if (qty <= 0) {
            removeFromCart(itemId);
        } else {
            setCartItems(cartItems.map((i) =>
                i.id === itemId ? { ...i, qty } : i
            ));
        }
    };

    const updateCartItemNote = (itemId, note) => {
        setCartItems(cartItems.map((i) =>
            i.id === itemId ? { ...i, note } : i
        ));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const getCartTotal = () => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateCartItemQuantity, updateCartItemNote, clearCart, getCartTotal }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    return useContext(CartContext);
};
