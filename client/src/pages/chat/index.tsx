import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchConversations,
  getOrCreateBranchConversation,
  fetchMessages,
  sendMessage,
  markAsRead,
  addMessageRealtime,
  removeMessageRealtime,
  updateUnreadCount
} from '../../store/slices/chatSlice';
import { Card, Button } from '../../components/ui';
import { MdChat, MdAdd } from 'react-icons/md';
import ConversationsList from './ConversationsList';
import ChatWindow from './ChatWindow';
import NewConversationModal from './NewConversationModal';
import type { ChatConversation, ChatMessage, UUID } from '../../types';
import { io } from 'socket.io-client';

const ChatPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { conversations, currentConversation, messages } = useAppSelector((state) => state.chat);
  const { user, currentBranch } = useAppSelector((state) => state.auth);
  const loading = useAppSelector((state) => state.ui.loading);

  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user?.id) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl, {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Chat WebSocket connected');
    });

    newSocket.on('chat:new_message', (data: { conversation_id: UUID; message: ChatMessage }) => {
      // Add message to current conversation if applicable
      dispatch(addMessageRealtime(data.message));

      // Update unread count for the conversation
      if (currentConversation?.id !== data.conversation_id) {
        // Increment unread count for other conversations
        const conversation = conversations.find(c => c.id === data.conversation_id);
        if (conversation) {
          dispatch(updateUnreadCount({
            conversationId: data.conversation_id,
            count: (conversation.unread_count || 0) + 1
          }));
        }
      }
    });

    newSocket.on('chat:message_deleted', (data: { message_id: UUID }) => {
      // Handle message deletion in real-time
      dispatch(removeMessageRealtime({ messageId: data.message_id }));
    });

    newSocket.on('disconnect', () => {
      console.log('Chat WebSocket disconnected');
    });

    return () => {
      newSocket.close();
    };
  }, [user?.id, dispatch, conversations, currentConversation]);

  // Load conversations on mount
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      dispatch(fetchMessages({ conversationId: currentConversation.id }));
      dispatch(markAsRead(currentConversation.id));
    }
  }, [currentConversation?.id, dispatch]);

  const handleSelectConversation = (conversation: ChatConversation) => {
    dispatch(fetchMessages({ conversationId: conversation.id }));
  };

  const handleCreateConversation = async (branchAId: UUID, branchBId: UUID) => {
    try {
      await dispatch(getOrCreateBranchConversation({
        branch_a_id: branchAId,
        branch_b_id: branchBId
      })).unwrap();
      setShowNewConversationModal(false);
    } catch (error) {
      // Error handled in slice
    }
  };

  const handleSendMessage = async (content: string, transferId?: UUID) => {
    if (!currentConversation?.id || !content.trim()) return;

    try {
      await dispatch(sendMessage({
        conversationId: currentConversation.id,
        data: {
          content,
          message_type: transferId ? 'TRANSFER_REQUEST' : 'TEXT',
          transfer_id: transferId
        }
      })).unwrap();
    } catch (error) {
      // Error handled in slice
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-down duration-fast">
          <div className="animate-fade-right duration-normal">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Chat entre Sucursales
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Comunicate con otras sucursales en tiempo real
            </p>
          </div>

          <div className="flex gap-3 animate-fade-left duration-normal">
            <Button
              variant="primary"
              onClick={() => setShowNewConversationModal(true)}
              icon={<MdAdd />}
            >
              Nueva Conversación
            </Button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up duration-normal">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <ConversationsList
              conversations={conversations}
              currentConversation={currentConversation}
              onSelect={handleSelectConversation}
              loading={loading}
            />
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            {currentConversation ? (
              <ChatWindow
                conversation={currentConversation}
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUserId={user?.id}
                loading={loading}
              />
            ) : (
              <Card className="p-12 text-center animate-zoom-in duration-normal">
                <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <MdChat className="w-10 h-10 text-primary-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Selecciona una conversación
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Elige una conversación de la lista o crea una nueva
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onSubmit={handleCreateConversation}
        currentBranchId={currentBranch?.id}
        loading={loading}
      />
    </>
  );
};

export default ChatPage;
