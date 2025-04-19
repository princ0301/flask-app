import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';

interface Message {
  role: string;
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  mode: 'upload' | 'azure';
  chatHistory: Message[];
  onSendMessage: (message: string) => void;
  onClearHistory: () => void;
  isLoading: boolean;
  additionalInfo?: React.ReactNode;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  mode, 
  chatHistory, 
  onSendMessage, 
  onClearHistory, 
  isLoading,
  additionalInfo 
}) => {
  const [message, setMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3">
        <h2 className="text-lg font-semibold">
          {mode === 'upload' ? 'Local Document Chat' : 'Azure Document Chat'}
        </h2>
        <button
          onClick={onClearHistory}
          className="p-1 hover:bg-blue-700 rounded transition-colors duration-200"
          title="Clear chat history"
        >
          <Trash2 size={18} />
        </button>
      </div>
      
      {additionalInfo && (
        <div className="bg-blue-50 px-4 py-2 border-b border-blue-100">
          {additionalInfo}
        </div>
      )}
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-center">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <>
            {chatHistory.map((msg, index) => (
              <div 
                key={index} 
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className={`max-w-[80%] px-4 py-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}
          </>
        )}
        
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-pulse flex space-x-1">
              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              <div className="h-2 w-2 bg-blue-600 rounded-full animation-delay-200"></div>
              <div className="h-2 w-2 bg-blue-600 rounded-full animation-delay-400"></div>
            </div>
            <span>Thinking...</span>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your medical documents..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`p-2 rounded-lg ${
              isLoading || !message.trim() 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition-colors duration-200`}
            disabled={isLoading || !message.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;