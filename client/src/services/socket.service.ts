import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addAlert } from '../store/slices/alertsSlice';
import { setOnlineStatus } from '../store/slices/uiSlice';
import type { Alert, UUID } from '../types';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

/**
 * Server wraps all events with this structure
 */
interface SocketEventPayload<T = unknown> {
  event: string;
  data: T;
  branch_id?: UUID;
  timestamp: string;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    // Clean up existing disconnected socket before creating new one
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Reset reconnect counter for fresh connection
    this.reconnectAttempts = 0;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      store.dispatch(setOnlineStatus(true));
      // Note: Server auto-joins branch room and owners room based on token
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      store.dispatch(setOnlineStatus(false));
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        store.dispatch(setOnlineStatus(false));
      }
    });

    // Business events - Server wraps data in { event, data, timestamp }
    this.socket.on('SALE_CREATED', (payload: SocketEventPayload) => {
      console.log('Sale created:', payload.data);
    });

    this.socket.on('SALE_VOIDED', (payload: SocketEventPayload) => {
      console.log('Sale voided:', payload.data);
    });

    this.socket.on('SESSION_OPENED', (payload: SocketEventPayload) => {
      console.log('Session opened:', payload.data);
    });

    this.socket.on('SESSION_CLOSED', (payload: SocketEventPayload) => {
      console.log('Session closed:', payload.data);
    });

    this.socket.on('ALERT_CREATED', (payload: SocketEventPayload<Alert>) => {
      console.log('New alert:', payload.data);
      if (payload.data) {
        store.dispatch(addAlert(payload.data));
      }
    });

    this.socket.on('STOCK_LOW', (payload: SocketEventPayload) => {
      console.log('Low stock warning:', payload.data);
    });

    this.socket.on('STOCK_UPDATED', (payload: SocketEventPayload) => {
      console.log('Stock updated:', payload.data);
    });

    this.socket.on('PRICE_UPDATED', (payload: SocketEventPayload) => {
      console.log('Price updated:', payload.data);
    });

    // Transfer events
    this.socket.on('TRANSFER_CREATED', (payload: SocketEventPayload) => {
      console.log('Transfer created:', payload.data);
    });

    this.socket.on('TRANSFER_APPROVED', (payload: SocketEventPayload) => {
      console.log('Transfer approved:', payload.data);
    });

    this.socket.on('TRANSFER_IN_TRANSIT', (payload: SocketEventPayload) => {
      console.log('Transfer in transit:', payload.data);
    });

    this.socket.on('TRANSFER_RECEIVED', (payload: SocketEventPayload) => {
      console.log('Transfer received:', payload.data);
    });

    this.socket.on('TRANSFER_CANCELLED', (payload: SocketEventPayload) => {
      console.log('Transfer cancelled:', payload.data);
    });
  }

  // Switch to different branch room
  subscribeToBranch(branchId: UUID): void {
    if (!this.socket?.connected) return;
    this.socket.emit('subscribe:branch', branchId);
  }

  // Join conversation room for real-time chat
  joinConversation(conversationId: UUID): void {
    if (!this.socket?.connected) return;
    this.socket.emit('join:conversation', conversationId);
  }

  // Leave conversation room
  leaveConversation(conversationId: UUID): void {
    if (!this.socket?.connected) return;
    this.socket.emit('leave:conversation', conversationId);
  }

  // Send typing indicator
  sendTyping(conversationId: UUID, typing: boolean): void {
    if (!this.socket?.connected) return;
    this.socket.emit('chat:typing', { conversationId, typing });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Emit custom events
  emit(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  // Subscribe to custom events
  // Note: Business events are wrapped { event, data, timestamp }
  // Chat events (chat:*) are NOT wrapped - they send raw data
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Unsubscribe from events
  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
