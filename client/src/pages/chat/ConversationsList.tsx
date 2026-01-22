import React from 'react';
import { Card } from '../../components/ui';
import type { ChatConversation } from '../../types';
import { MdStore } from 'react-icons/md';

interface ConversationsListProps {
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  onSelect: (conversation: ChatConversation) => void;
  loading: boolean;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  currentConversation,
  onSelect,
  loading
}) => {
  const getConversationTitle = (conversation: ChatConversation) => {
    if (conversation.title) return conversation.title;
    if (conversation.branchA && conversation.branchB) {
      return `${conversation.branchA.name} - ${conversation.branchB.name}`;
    }
    return 'Conversación';
  };

  const formatLastMessage = (conversation: ChatConversation) => {
    const lastMessage = conversation.messages?.[conversation.messages.length - 1];
    if (!lastMessage) return 'Sin mensajes';

    if (lastMessage.message_type === 'TRANSFER_REQUEST') {
      return '📦 Solicitud de traslado';
    }

    if (lastMessage.is_deleted) {
      return '🚫 Mensaje eliminado';
    }

    return lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '');
  };

  return (
    <Card className="overflow-hidden animate-fade-right duration-normal">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-medium text-gray-900 dark:text-white">Conversaciones</h2>
        {conversations.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">{conversations.length} conversaciones</p>
        )}
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-4">Cargando conversaciones...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MdStore className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay conversaciones</p>
            <p className="text-sm mt-1">Crea una nueva conversación para empezar</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const isActive = currentConversation?.id === conversation.id;
            const unreadCount = conversation.unread_count || 0;

            return (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                className={`
                  w-full p-4 text-left transition-colors
                  ${isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MdStore className="text-gray-400 flex-shrink-0" />
                      <h3 className={`
                        text-sm font-medium truncate
                        ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}
                      `}>
                        {getConversationTitle(conversation)}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {formatLastMessage(conversation)}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default ConversationsList;
