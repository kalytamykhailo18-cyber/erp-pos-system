import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Input } from '../../components/ui';
import type { ChatConversation, ChatMessage, UUID } from '../../types';
import { MdSend, MdAttachFile, MdStore } from 'react-icons/md';
import { Link } from 'react-router-dom';

interface ChatWindowProps {
  conversation: ChatConversation;
  messages: ChatMessage[];
  onSendMessage: (content: string, transferId?: UUID) => void;
  currentUserId?: UUID;
  loading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  onSendMessage,
  currentUserId,
  loading
}) => {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!messageInput.trim()) return;
    onSendMessage(messageInput);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getConversationTitle = () => {
    if (conversation.title) return conversation.title;
    if (conversation.branchA && conversation.branchB) {
      return `${conversation.branchA.name} ↔ ${conversation.branchB.name}`;
    }
    return 'Conversación';
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Ayer ' + date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <Card className="flex flex-col h-[600px] overflow-hidden animate-fade-left duration-normal">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <MdStore className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="font-medium text-gray-900 dark:text-white">
              {getConversationTitle()}
            </h2>
            <p className="text-sm text-gray-500">
              {conversation.conversation_type === 'BRANCH' ? 'Chat de sucursales' : 'Chat directo'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p>No hay mensajes en esta conversación</p>
              <p className="text-sm mt-2">Envía el primer mensaje para empezar</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId;

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fade-up duration-fast`}
              >
                <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                  {/* Sender info for other users */}
                  {!isOwnMessage && message.sender && (
                    <span className="text-xs text-gray-500 mb-1 ml-3">
                      {message.sender.first_name} {message.sender.last_name}
                    </span>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`
                      px-4 py-2 rounded-lg
                      ${isOwnMessage
                        ? 'bg-primary-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-none'}
                    `}
                  >
                    {message.is_deleted ? (
                      <p className="text-sm italic opacity-60">🚫 Mensaje eliminado</p>
                    ) : message.message_type === 'TRANSFER_REQUEST' && message.transfer ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MdAttachFile />
                          <span>Solicitud de Traslado</span>
                        </div>
                        <div className="text-sm">
                          <p>N° {message.transfer.transfer_number}</p>
                          <p className="text-xs opacity-80 mt-1">
                            {message.transfer.source_branch?.name} → {message.transfer.destination_branch?.name}
                          </p>
                        </div>
                        <Link
                          to={`/stock?transfer=${message.transfer.id}`}
                          className={`
                            text-xs underline inline-block mt-2
                            ${isOwnMessage ? 'text-white' : 'text-primary-600 dark:text-primary-400'}
                          `}
                        >
                          Ver detalles
                        </Link>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-gray-400 mt-1 mx-3">
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            disabled={loading}
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!messageInput.trim() || loading}
            icon={<MdSend />}
          >
            Enviar
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Presiona Enter para enviar, Shift+Enter para nueva línea
        </p>
      </div>
    </Card>
  );
};

export default ChatWindow;
