import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API_BASE_URL from '../config';
import { useAuth } from './useAuth';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const listenersRef = useRef([]);

    useEffect(() => {
        if (!user?.id) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            return;
        }

        const socket = io(SOCKET_URL, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join_user', user.id);
            if (user.role === 'Rider') {
                socket.emit('join_riders');
            }
        });

        socket.on('order_update', (data) => {
            listenersRef.current.forEach(fn => fn(data));
        });

        socket.on('compliance_due', ({ orderId }) => {
            listenersRef.current.forEach(fn => fn({ orderId, status: 'compliance_due' }));
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user?.id, user?.role]);

    const subscribe = (fn) => {
        listenersRef.current.push(fn);
        return () => {
            listenersRef.current = listenersRef.current.filter(f => f !== fn);
        };
    };

    return (
        <SocketContext.Provider value={{ subscribe }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
