import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { chatAPI } from '../services/api';

const ChatContext = createContext();

// Chat actions
const CHAT_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_CONVERSATION_ID: 'SET_CONVERSATION_ID',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  SET_MESSAGES: 'SET_MESSAGES',
};

// Initial state
const initialState = {
  messages: [],
  conversationId: null,
  loading: false,
  error: null,
};

// Reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null,
      };

    case CHAT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case CHAT_ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case CHAT_ACTIONS.SET_CONVERSATION_ID:
      return {
        ...state,
        conversationId: action.payload,
      };

    case CHAT_ACTIONS.CLEAR_MESSAGES:
      return {
        ...state,
        messages: [],
        conversationId: null,
        error: null,
      };

    case CHAT_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload,
      };

    default:
      return state;
  }
};

// Provider component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Add user message to chat
  const addUserMessage = useCallback((content) => {
    dispatch({
      type: CHAT_ACTIONS.ADD_MESSAGE,
      payload: {
        id: Date.now(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      },
    });
  }, []);

  // Add assistant message to chat
  const addAssistantMessage = useCallback((messageData) => {
    dispatch({
      type: CHAT_ACTIONS.ADD_MESSAGE,
      payload: {
        ...messageData,
        timestamp: messageData.timestamp || new Date().toISOString(),
      },
    });
  }, []);

  // Ask question to chatbot
  const askQuestion = useCallback(async (question) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });

      // Add user message immediately
      addUserMessage(question);

      // Call API
      const response = await chatAPI.askQuestion(question, state.conversationId);

      // Set conversation ID if it's a new conversation
      if (!state.conversationId && response.conversation) {
        dispatch({
          type: CHAT_ACTIONS.SET_CONVERSATION_ID,
          payload: response.conversation,
        });
      }

      // Add assistant message with proper format
      addAssistantMessage({
        id: response.id || Date.now(),
        role: response.role || 'assistant',
        content: response.content,
        sources: response.sources || [],
        timestamp: response.created_at || new Date().toISOString(),
      });

    } catch (error) {
      console.error('Error asking question:', error);
      dispatch({
        type: CHAT_ACTIONS.SET_ERROR,
        payload: error.response?.data?.message || 'Có lỗi xảy ra khi gửi câu hỏi',
      });
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.conversationId, addUserMessage, addAssistantMessage]);

  // Clear chat
  const clearChat = useCallback(() => {
    dispatch({ type: CHAT_ACTIONS.CLEAR_MESSAGES });
  }, []);

  // Set error
  const setError = useCallback((error) => {
    dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: error });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: null });
  }, []);

  const value = {
    ...state,
    askQuestion,
    clearChat,
    setError,
    clearError,
    addUserMessage,
    addAssistantMessage,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;