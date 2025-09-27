import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';

const ChatInput = () => {
  const [question, setQuestion] = useState('');
  const { askQuestion, loading } = useChat();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim() || loading) {
      return;
    }

    const trimmedQuestion = question.trim();
    setQuestion(''); // Clear input immediately
    
    try {
      await askQuestion(trimmedQuestion);
    } catch (error) {
      console.error('Error submitting question:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Đặt câu hỏi về tài liệu của bạn..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Gửi...</span>
              </div>
            ) : (
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                />
              </svg>
            )}
          </button>
        </div>
        
        <div className="mt-2 text-sm text-gray-500">
          Nhấn Enter để gửi, Shift+Enter để xuống dòng
        </div>
      </form>
    </div>
  );
};

export default ChatInput;