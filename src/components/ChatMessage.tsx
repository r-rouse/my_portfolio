import type { ChatMessage as ChatMessageType } from '../../lib/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-assistant'}`}>
      <div className="chat-message-bubble">{message.content}</div>
    </div>
  );
}

export default ChatMessage;
