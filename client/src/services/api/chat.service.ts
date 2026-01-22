import { get, post, put, del as deleteRequest } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  ChatConversation,
  ChatMessage,
  SendMessageRequest,
  CreateConversationRequest,
  UUID,
} from '../../types';

const BASE_PATH = '/chat';

export const chatService = {
  /**
   * Get all conversations for current user
   */
  getConversations: (): Promise<ApiResponse<ChatConversation[]>> => {
    return get<ChatConversation[]>(`${BASE_PATH}/conversations`);
  },

  /**
   * Get or create conversation between two branches
   */
  getOrCreateBranchConversation: (
    data: CreateConversationRequest
  ): Promise<ApiResponse<ChatConversation>> => {
    return post<ChatConversation>(`${BASE_PATH}/conversations/branch`, data);
  },

  /**
   * Get messages for a conversation with pagination
   */
  getMessages: (
    conversationId: UUID,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<ChatMessage>> => {
    return get<ChatMessage[]>(`${BASE_PATH}/conversations/${conversationId}/messages`, params) as Promise<PaginatedResponse<ChatMessage>>;
  },

  /**
   * Send message to conversation
   */
  sendMessage: (
    conversationId: UUID,
    data: SendMessageRequest
  ): Promise<ApiResponse<ChatMessage>> => {
    return post<ChatMessage>(`${BASE_PATH}/conversations/${conversationId}/messages`, data);
  },

  /**
   * Delete message (soft delete)
   */
  deleteMessage: (
    messageId: UUID
  ): Promise<ApiResponse<void>> => {
    return deleteRequest<void>(`${BASE_PATH}/messages/${messageId}`);
  },

  /**
   * Mark conversation as read
   */
  markAsRead: (conversationId: UUID): Promise<ApiResponse<void>> => {
    return put<void>(`${BASE_PATH}/conversations/${conversationId}/read`);
  },
};

export default chatService;
