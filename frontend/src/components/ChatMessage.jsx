import React from 'react';

const ChatMessage = ({ message }) => {
  const { role, content, sources, timestamp } = message;
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-3xl ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            isUser ? 'bg-blue-500' : 'bg-gray-500'
          }`}>
            {isUser ? 'U' : 'AI'}
          </div>
        </div>
        
        {/* Message bubble */}
        <div className={`px-4 py-3 rounded-lg ${
          isUser 
            ? 'bg-blue-500 text-white ml-12' 
            : 'bg-white border border-gray-200 mr-12'
        }`}>
          <div className="prose prose-sm max-w-none">
            {content.split('\n').map((paragraph, index) => (
              <p key={index} className={`${index === 0 ? 'mt-0' : 'mt-2'} ${
                isUser ? 'text-white' : 'text-gray-900'
              }`}>
                {paragraph}
              </p>
            ))}
          </div>
          
          {/* Sources (only for assistant messages) */}
          {!isUser && sources && sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2 font-medium">
                Nguồn tham khảo:
              </p>
              <div className="space-y-1">
                {sources.map((source, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <div className="font-medium text-gray-700">
                      {source.document_name || `Tài liệu ${index + 1}`}
                      {source.page_number && ` - Trang ${source.page_number}`}
                    </div>
                    <div className="mt-1 line-clamp-2">
                      {source.content.substring(0, 100)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        {timestamp && (
          <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right mr-12' : 'text-left ml-12'}`}>
            {new Date(timestamp).toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;