import React, { useEffect, useRef } from 'react';
import { ChatProvider, useChat } from '../context/ChatContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Navigation from './Navigation';

const ChatPageContent = () => {
  const { messages, loading, error, clearChat, clearError } = useChat();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex flex-col h-screen pt-16"> {/* pt-16 to account for fixed navigation */}
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Chat Assistant</h1>
              <p className="text-gray-600">Đặt câu hỏi về tài liệu của bạn</p>
            </div>
            
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Xóa cuộc trò chuyện
              </button>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 mx-4 mt-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chào mừng đến với AI Chat Assistant!</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Bắt đầu bằng cách đặt một câu hỏi về tài liệu của bạn. 
                  AI sẽ tìm kiếm thông tin liên quan và đưa ra câu trả lời chi tiết.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 mr-12">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                        <span className="text-sm">AI đang suy nghĩ...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <ChatInput />
      </div>
    </div>
  );
};

// Main ChatPage component with provider
const ChatPage = () => {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
};

export default ChatPage;