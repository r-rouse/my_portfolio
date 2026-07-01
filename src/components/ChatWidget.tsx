import { useState } from 'react';
import ChatWindow from './ChatWindow';
import { trackEvent } from '../../lib/analytics/trackEvent';
import './Chat.css';

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        trackEvent('chat_opened');
      }
      return next;
    });
  };

  return (
    <div className="chat-widget">
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}

      <button
        type="button"
        className={`chat-toggle ${isOpen ? 'chat-toggle-open' : ''}`}
        onClick={handleToggle}
        aria-label={isOpen ? 'Close portfolio assistant' : 'Open portfolio assistant'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default ChatWidget;
