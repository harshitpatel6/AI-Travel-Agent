import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader, MessageSquare, Plus, History } from 'lucide-react';
import { chatAPI } from '../utils/api';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const response = await chatAPI.getSessions();
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const loadSession = async (sid) => {
    try {
      const response = await chatAPI.getSessionMessages(sid);
      const sessionMessages = response.data.messages || [];
      setMessages(sessionMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
      setSessionId(sid);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(input, sessionId);
      console.log('Chat response:', response.data);
      
      const { response: aiResponse, session_id, usage_remaining } = response.data;

      if (!sessionId && session_id) {
        setSessionId(session_id);
        console.log('Session ID set:', session_id);
      }

      const aiMessage = { role: 'assistant', content: aiResponse };
      setMessages(prev => [...prev, aiMessage]);
      
      if (usage_remaining) {
        console.log('Usage remaining:', usage_remaining);
        // You can display this to the user if needed
        // For example: "Messages remaining today: X"
      }

      // Refresh sessions list
      fetchSessions();
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: error.response?.data?.detail || 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = [
    'Find me a hotel in Paris',
    'Book a flight to Tokyo',
    'Plan a weekend trip to New York',
    'Show me beach destinations'
  ];

  return (
    <div className="chat-page">
      <div className={`chat-sidebar ${showSidebar ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>
            <History size={20} />
            Chat History
          </h2>
          <button className="btn btn-primary btn-sm" onClick={startNewChat}>
            <Plus size={16} />
            New Chat
          </button>
        </div>
        <div className="sidebar-sessions">
          {sessions.length === 0 ? (
            <div className="no-sessions">
              <MessageSquare size={48} />
              <p>No chat history yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.session_id}
                className={`session-item ${sessionId === session.session_id ? 'active' : ''}`}
                onClick={() => loadSession(session.session_id)}
              >
                <MessageSquare size={18} />
                <div className="session-info">
                  <div className="session-title">{session.title || 'Untitled Chat'}</div>
                  <div className="session-date">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-container">
        <button 
          className="sidebar-toggle"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <History size={20} />
        </button>

        <div className="chat-header">
          <div className="chat-header-content">
            <Bot size={28} />
            <div>
              <h1>AI Travel Assistant</h1>
              <p>Ask me anything about your travel plans</p>
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <Bot size={64} />
              <h2>Welcome to TravelAI Assistant</h2>
              <p>I can help you plan trips, book hotels, find flights, and more!</p>
              
              <div className="suggested-prompts">
                <p className="prompts-label">Try asking:</p>
                <div className="prompts-grid">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      className="prompt-button"
                      onClick={() => setInput(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.role}`}>
                  <div className="message-avatar">
                    {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  <div className="message-content">
                    {message.content.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < message.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message assistant">
                  <div className="message-avatar">
                    <Bot size={20} />
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <form onSubmit={handleSend} className="chat-input-form">
            <input
              type="text"
              className="chat-input"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="chat-send-button"
              disabled={loading || !input.trim()}
            >
              {loading ? <Loader size={20} className="spinning" /> : <Send size={20} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
