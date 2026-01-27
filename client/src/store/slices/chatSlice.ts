import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  UUID,
  ChatConversation,
  ChatMessage,
  SendMessageRequest,
  CreateConversationRequest
} from '../../types';
import { chatService } from '../../services/api/chat.service';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface ChatState {
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
  },
};

// Async Thunks

/**
 * Fetch all conversations for current user
 */
export const fetchConversations = createAsyncThunk<
  ChatConversation[],
  void,
  { rejectValue: string }
>(
  'chat/fetchConversations',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('conversations'));
      const response = await chatService.getConversations();

      if (!response.success) {
        throw new Error('Failed to load conversations');
      }

      return response.data;
    } catch (error) {
      dispatch(showToast({
        message: 'Error al cargar conversaciones',
        type: 'error'
      }));
      return rejectWithValue('Error al cargar conversaciones');
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * Get or create conversation between two branches
 */
export const getOrCreateBranchConversation = createAsyncThunk<
  ChatConversation,
  CreateConversationRequest,
  { rejectValue: string }
>(
  'chat/getOrCreateBranchConversation',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('conversation'));
      const response = await chatService.getOrCreateBranchConversation(data);

      if (!response.success) {
        throw new Error('Failed to get or create conversation');
      }

      return response.data;
    } catch (error) {
      dispatch(showToast({
        message: 'Error al crear conversación',
        type: 'error'
      }));
      return rejectWithValue('Error al crear conversación');
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * Fetch messages for a conversation
 */
export const fetchMessages = createAsyncThunk<
  { messages: ChatMessage[]; total: number },
  { conversationId: UUID; page?: number; limit?: number },
  { rejectValue: string }
>(
  'chat/fetchMessages',
  async ({ conversationId, page = 1, limit = 50 }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('messages'));
      const response = await chatService.getMessages(conversationId, { page, limit });

      if (!response.success) {
        throw new Error('Failed to load messages');
      }

      return {
        messages: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      dispatch(showToast({
        message: 'Error al cargar mensajes',
        type: 'error'
      }));
      return rejectWithValue('Error al cargar mensajes');
    } finally {
      dispatch(stopLoading());
    }
  }
);

/**
 * Send message to conversation
 */
export const sendMessage = createAsyncThunk<
  ChatMessage,
  { conversationId: UUID; data: SendMessageRequest },
  { rejectValue: string }
>(
  'chat/sendMessage',
  async ({ conversationId, data }, { dispatch, rejectWithValue }) => {
    try {
      const response = await chatService.sendMessage(conversationId, data);

      if (!response.success) {
        throw new Error('Failed to send message');
      }

      return response.data;
    } catch (error) {
      dispatch(showToast({
        message: 'Error al enviar mensaje',
        type: 'error'
      }));
      return rejectWithValue('Error al enviar mensaje');
    }
  }
);

/**
 * Delete message
 */
export const deleteMessage = createAsyncThunk<
  { messageId: UUID },
  { messageId: UUID },
  { rejectValue: string }
>(
  'chat/deleteMessage',
  async ({ messageId }, { dispatch, rejectWithValue }) => {
    try {
      await chatService.deleteMessage(messageId);

      dispatch(showToast({
        message: 'Mensaje eliminado',
        type: 'success'
      }));

      return { messageId };
    } catch (error) {
      dispatch(showToast({
        message: 'Error al eliminar mensaje',
        type: 'error'
      }));
      return rejectWithValue('Error al eliminar mensaje');
    }
  }
);

/**
 * Mark conversation as read
 */
export const markAsRead = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'chat/markAsRead',
  async (conversationId, { rejectWithValue }) => {
    try {
      await chatService.markAsRead(conversationId);
      return conversationId;
    } catch (error) {
      // Silent fail - not critical
      return rejectWithValue('Error al marcar como leído');
    }
  }
);

// Slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<ChatConversation>) => {
      state.currentConversation = action.payload;
    },
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
      state.messages = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    // Real-time message received via WebSocket
    addMessageRealtime: (state, action: PayloadAction<ChatMessage>) => {
      // Only add if message is for current conversation
      if (state.currentConversation?.id === action.payload.conversation_id) {
        // Check if message already exists
        const exists = state.messages.some(m => m.id === action.payload.id);
        if (!exists) {
          state.messages.push(action.payload);
        }
      }
    },
    // Message deleted via WebSocket
    removeMessageRealtime: (state, action: PayloadAction<{ messageId: UUID }>) => {
      const index = state.messages.findIndex(m => m.id === action.payload.messageId);
      if (index !== -1) {
        state.messages[index].is_deleted = true;
      }
    },
    // Update unread count
    updateUnreadCount: (state, action: PayloadAction<{ conversationId: UUID; count: number }>) => {
      const conversation = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conversation) {
        conversation.unread_count = action.payload.count;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar conversaciones';
      })

      // Get or create branch conversation
      .addCase(getOrCreateBranchConversation.fulfilled, (state, action) => {
        state.currentConversation = action.payload;
        // Add to conversations list if not exists
        const exists = state.conversations.some(c => c.id === action.payload.id);
        if (!exists) {
          state.conversations.unshift(action.payload);
        }
      })

      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns messages in DESC order (newest first)
        // Reverse for display: oldest at top, newest at bottom
        const reversedMessages = [...action.payload.messages].reverse();

        if (action.meta.arg.page === 1) {
          state.messages = reversedMessages;
        } else {
          // Prepend older messages at top (they come as newer-to-older, so reverse first)
          state.messages = [...reversedMessages, ...state.messages];
        }
        state.pagination.total = action.payload.total;
        state.pagination.page = action.meta.arg.page || 1;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar mensajes';
      })

      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Add message to current conversation
        const exists = state.messages.some(m => m.id === action.payload.id);
        if (!exists) {
          state.messages.push(action.payload);
        }
      })

      // Delete message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const index = state.messages.findIndex(m => m.id === action.payload.messageId);
        if (index !== -1) {
          state.messages[index].is_deleted = true;
        }
      })

      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const conversation = state.conversations.find(c => c.id === action.payload);
        if (conversation) {
          conversation.unread_count = 0;
        }
      });
  },
});

export const {
  setCurrentConversation,
  clearCurrentConversation,
  clearError,
  addMessageRealtime,
  removeMessageRealtime,
  updateUnreadCount
} = chatSlice.actions;

export default chatSlice.reducer;
