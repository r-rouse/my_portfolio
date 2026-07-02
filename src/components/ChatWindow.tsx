import { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { sendChatMessage } from '../services/chatService';
import { trackEvent } from '../../lib/analytics/trackEvent';
import type { ChatMessage as ChatMessageType } from '../../lib/types/chat';
import './Chat.css';

interface ChatWindowProps {
  onClose: () => void;
}

function createMessage(role: ChatMessageType['role'], content: string): ChatMessageType {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    content,
  };
}

function ChatWindow({ onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    createMessage(
      'assistant',
      "Hi! I'm Randall's portfolio assistant. Ask me about his experience, projects, skills, or background."
    ),
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = createMessage('user', trimmed);
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    trackEvent('chat_message_sent', { messageLength: trimmed.length });

    const startTime = performance.now();

    try {
      const answer = await sendChatMessage(trimmed);
      const responseTimeMs = Math.round(performance.now() - startTime);
      trackEvent('chat_response_received', {
        messageLength: trimmed.length,
        responseTimeMs,
        responseLength: answer.length,
      });
      setMessages((prev) => [...prev, createMessage('assistant', answer)]);
    } catch (error) {
      const errorText =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setMessages((prev) => [...prev, createMessage('assistant', errorText)]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-window" role="dialog" aria-label="Portfolio assistant chat">
      <header className="chat-header">
        <div className="chat-header-info">
          <h2 className="chat-header-title">Portfolio Assistant</h2>
          <p className="chat-header-subtitle">Ask about Randall's background</p>
        </div>
        <button
          type="button"
          className="chat-close"
          onClick={onClose}
          aria-label="Close chat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </header>

      <div className="chat-messages">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="chat-message chat-message-assistant">
            <div className="chat-message-bubble chat-loading">
              <span className="chat-loading-dot" />
              <span className="chat-loading-dot" />
              <span className="chat-loading-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="chat-footer">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isLoading}
        />
      </footer>
    </div>
  );
}

export default ChatWindow;
