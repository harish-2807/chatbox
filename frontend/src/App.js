import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const initialSuggestedQuestions = [
    "Show me pricing plans",
    "reset password", 
    "refund policy"
  ];

  // Generate or retrieve session ID on component mount
  useEffect(() => {
    let storedSessionId = localStorage.getItem('chatSessionId');
    
    if (!storedSessionId) {
      // Generate new session ID
      storedSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chatSessionId', storedSessionId);
    }
    
    setSessionId(storedSessionId);
    loadConversation(storedSessionId);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async (sid) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/conversations/${sid}`);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      // Don't show error to user on initial load, just start fresh
    }
  };

  const generateNewSession = () => {
    const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatSessionId', newSessionId);
    setSessionId(newSessionId);
    setMessages([]);
    setError('');
    setInputMessage('');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) {
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError('');
    setIsLoading(true);

    // Add user message to UI immediately
    const userMsgObj = {
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsgObj]);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        sessionId: sessionId,
        message: userMessage
      });

      // Add assistant response to UI
      const assistantMsgObj = {
        role: 'assistant',
        content: response.data.reply,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsgObj]);

    } catch (err) {
      console.error('Error sending message:', err);
      
      // Check if the error is due to no information found
      if (err.response?.data?.error && err.response.data.error.includes("don't have information")) {
        setError("Sorry, I couldn't get that. Please select a suggested question.");
      } else {
        setError(err.response?.data?.error || 'Failed to send message. Please try again.');
      }
      
      // Remove the user message if the request failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = async (question) => {
    setInputMessage(question);
    
    // Directly call the message sending logic
    if (!isLoading) {
      setIsLoading(true);
      setError('');
      
      // Add user message to UI immediately
      const userMsgObj = {
        role: 'user',
        content: question,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsgObj]);
      setInputMessage('');

      try {
        const response = await axios.post(`${API_BASE_URL}/api/chat`, {
          sessionId: sessionId,
          message: question
        });

        // Add assistant response to UI
        const assistantMsgObj = {
          role: 'assistant',
          content: response.data.reply,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsgObj]);

      } catch (err) {
        console.error('Error sending message:', err);
        
        // Check if the error is due to no information found
        if (err.response?.data?.error && err.response.data.error.includes("don't have information")) {
          setError("Sorry, I couldn't get that. Please select a suggested question.");
        } else {
          setError(err.response?.data?.error || 'Failed to send message. Please try again.');
        }
        
        // Remove the user message if the request failed
        setMessages(prev => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="App">
      <div className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">🤖</div>
            <div className="header-text">
              <h1>AI Support Assistant</h1>
              <p className="header-subtitle">Your friendly AI helper</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="new-chat-btn" onClick={generateNewSession}>
              🔄 New Chat
            </button>
            <div className="session-info">
              Session: {sessionId.substring(0, 20)}...
            </div>
          </div>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👋</div>
              <h3>Welcome to AI Support Assistant!</h3>
              <p>Ask me anything about our products and services. I'm here to help!</p>
              <div className="suggested-questions">
                <p>💡 Try asking:</p>
                <div className="suggestion-buttons">
                  {initialSuggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="suggestion-btn"
                      onClick={() => handleSuggestedQuestion(question)}
                      disabled={isLoading}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">{message.content}</div>
                <div className="message-time">{formatTime(message.created_at)}</div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="message assistant">
              <div className="loading">
                Thinking
                <div className="loading-dots">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="input-container">
          <form className="input-form" onSubmit={sendMessage}>
            <div className="input-wrapper">
              <input
                type="text"
                className="message-input"
                placeholder="Type your message here..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
              />
              <div className="input-decorations">
                <div className="sticker sticker-1">💬</div>
                <div className="sticker sticker-2">✨</div>
                <div className="sticker sticker-3">🤖</div>
              </div>
            </div>
            <button 
              type="submit" 
              className="send-btn"
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? (
                <div className="loading-spinner">⏳</div>
              ) : (
                <div className="send-icon">
                  <span>📤</span>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
