import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import './App.css';

const API_URL = "http://localhost:3001/api/conversation";

// Helper function to format AI output with basic markdown-like support
function formatMessage(text) {
  if (!text) return null;

  // Extract code blocks first (``````)
  const codeBlockRegex = /``````/g;
  let parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', content: match[1] });
    lastIndex = codeBlockRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  // Helper to render text with bold, italic, lists, and links
  function renderFormattedText(content, keyPrefix = '') {
    // Handle unordered lists
    const lines = content.split('\n');
    let elements = [];
    let inList = false;
    let listItems = [];
    lines.forEach((line, idx) => {
      const listMatch = line.match(/^\s*[\*\-]\s+(.*)/);
      if (listMatch) {
        inList = true;
        listItems.push(
          <li key={idx}>{renderInline(listMatch[1], `${keyPrefix}-li-${idx}`)}</li>
        );
      } else {
        if (inList) {
          elements.push(<ul key={`${keyPrefix}-ul-${idx}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        // Only add non-empty lines
        if (line.trim() !== '') {
          elements.push(
            <p key={`${keyPrefix}-p-${idx}`}>{renderInline(line, `${keyPrefix}-p-${idx}`)}</p>
          );
        }
      }
    });
    if (inList && listItems.length > 0) {
      elements.push(<ul key={`${keyPrefix}-ul-end`}>{listItems}</ul>);
    }
    return elements;
  }

  // Helper to render inline bold, italic, and links
  function renderInline(text, keyPrefix = '') {
    // Bold: **text**
    text = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');
    // Italic: *text* or _text_
    text = text.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
    // Auto-link URLs
    text = text.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    // Render as HTML
    return <span dangerouslySetInnerHTML={{ __html: text }} key={keyPrefix} />;
  }

  // Render everything
  return parts.map((part, idx) => {
    if (part.type === 'code') {
      return (
        <pre className="ai-code-block" key={`code-${idx}`}>
          <code>{part.content.trim()}</code>
        </pre>
      );
    } else {
      return <span key={`txt-${idx}`}>{renderFormattedText(part.content, `txt-${idx}`)}</span>;
    }
  });
}

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setMessages(prev => [...prev, { text: input, isUser: true }]);
    setIsLoading(true);

    try {
      const response = await axios.post(API_URL, { message: input });
      setMessages(prev => [...prev, { text: response.data.reply, isUser: false }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: "⚠️ Sorry, there was an error.", isUser: false }]);
      console.error(error);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <FiMessageSquare className="app-icon" />
        <h1 className="app-title">AI English Tutor</h1>
      </header>

      <main className="chat-window">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.isUser ? 'user' : 'ai'}`}>
            <div className="chat-bubble">
              {msg.isUser ? msg.text : formatMessage(msg.text)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message ai">
            <div className="chat-bubble typing">AI is typing...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your English sentence..."
          disabled={isLoading}
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn" disabled={isLoading}>
          <FiSend />
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default App;
