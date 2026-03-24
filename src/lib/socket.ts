/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';

/**
 * Socket Event Types
 * These should match the backend SOCKET_EVENTS enum
 */
export const SOCKET_EVENTS = {
  NEW_ORDER: 'new_order',
  SETTINGS_UPDATED: 'settings_updated',
  ORDER_UPDATED: 'order_updated',
  NEW_GROCERY_ORDER: 'new_grocery_order',
  GROCERY_ORDER_UPDATED: 'grocery_order_updated',
} as const;

type SocketEventType = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

/**
 * Get the socket server URL from environment variables
 * Uses the same base URL as the API but without the path
 */
function getSocketUrl(): string {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
  // Remove trailing slash and any path, then use the base URL
  const baseUrl = apiUrl.replace(/\/$/, '').split('/api')[0] || apiUrl.replace(/\/$/, '');
  return baseUrl;
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

let socketInstance: Socket | null = null;
let isConnecting = false;

/**
 * Initialize and get the socket connection instance
 * Connects with authentication token from localStorage
 * @returns Socket instance or null if not authenticated
 */
export function getSocket(): Socket | null {
  const token = getAuthToken();
  
  if (!token) {
    return null;
  }

  // Return existing connection if available and connected
  if (socketInstance?.connected) {
    return socketInstance;
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    return socketInstance;
  }

  // Create new connection
  isConnecting = true;
  const socketUrl = getSocketUrl();
  
  socketInstance = io(socketUrl, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socketInstance.on('connect', () => {
    isConnecting = false;
  });

  socketInstance.on('disconnect', () => {
    isConnecting = false;
  });

  socketInstance.on('connect_error', (error) => {
    console.error('Socket: Connection error', error.message);
    isConnecting = false;
  });

  return socketInstance;
}

/**
 * Disconnect the socket connection
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    isConnecting = false;
  }
}

/**
 * Subscribe to a socket event
 * @param eventType - The event type to listen to
 * @param callback - Callback function to handle the event
 * @returns Unsubscribe function
 */
export function subscribeToEvent<T = any>(
  eventType: SocketEventType,
  callback: (data: T) => void
): (() => void) | null {
  const socket = getSocket();
  
  if (!socket) {
    return null;
  }

  socket.on(eventType, callback);
  
  // Return unsubscribe function
  return () => {
    if (socket) {
      socket.off(eventType, callback);
    }
  };
}

/**
 * Unsubscribe from a socket event
 * @param eventType - The event type to unsubscribe from
 * @param callback - Optional callback to remove specific listener, otherwise removes all listeners
 */
export function unsubscribeFromEvent(
  eventType: SocketEventType,
  callback?: (...args: any[]) => void
): void {
  if (socketInstance) {
    if (callback) {
      socketInstance.off(eventType, callback);
    } else {
      socketInstance.off(eventType);
    }
  }
}

