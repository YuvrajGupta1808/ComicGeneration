import { Send } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import ComicGrid from '../components/comic/ComicGrid';
import ComicPages from '../components/comic/ComicPages';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[];
  isComicGrid?: boolean;
  isComposedPages?: boolean;
}

const Chat: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initialPrompt = location.state?.initialPrompt;
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    } else {
      navigate('/create');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea (1 line = ~52px with padding, max 2 lines = ~76px)
    if (inputRef.current) {
      inputRef.current.style.height = '52px'; // Reset to min height (1 line)
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = Math.min(scrollHeight, 76) + 'px';
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = '52px';
    }

    try {
      // Call the backend API
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);

      // Automatically display composed pages if page URLs are received (prioritize over panels)
      if (data.pageUrls && Array.isArray(data.pageUrls) && data.pageUrls.length > 0) {
        const composedPagesMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          images: data.pageUrls,
          isComposedPages: true,
        };
        setMessages((prev) => [...prev, composedPagesMessage]);
        console.log(`✅ Loaded ${data.pageUrls.length} composed page images from backend`);
      } else if (data.panelUrls && Array.isArray(data.panelUrls) && data.panelUrls.length > 0) {
        // Display comic grid inline if panel URLs are received
        const comicGridMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          images: data.panelUrls,
          isComicGrid: true,
        };
        setMessages((prev) => [...prev, comicGridMessage]);
        console.log(`✅ Loaded ${data.panelUrls.length} panel images from backend`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the backend server is running (npm run langchain in comic-backend folder).',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 via-blue-50/50 to-indigo-50/50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 flex flex-col">
      <AppNavbar />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 pt-32 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div key={message.id}>
              {message.isComposedPages && message.images ? (
                // Display composed pages with download options
                <div className="w-full">
                  <ComicPages pages={message.images} />
                </div>
              ) : message.isComicGrid && message.images ? (
                // Display comic grid inline
                <div className="w-full">
                  <ComicGrid images={message.images} />
                </div>
              ) : (
                // Display regular message
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-3xl px-5 py-4 ${
                      message.role === 'user'
                        ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white border-2 border-indigo-200 dark:border-1 dark:border-indigo-900 shadow-lg'
                        : 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-800 shadow-sm'
                    }`}
                  >
                    <div 
                      className="text-base leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ 
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                    <p className="text-xs mt-2 text-gray-400 dark:text-neutral-500">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-2xl px-5 py-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-neutral-400">Generating...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-gradient-to-b from-purple-50/50 via-blue-50/50 to-indigo-50/50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 border-t border-gray-200 dark:border-neutral-800 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative mb-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Refine your comic or ask for changes..."
              className="w-full h-[52px] max-h-[76px] py-3 px-4 pr-14 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-indigo-600/30 focus:border-indigo-400/70 dark:focus:border-indigo-600/70 resize-none text-base shadow-lg transition-all overflow-hidden leading-6"
              disabled={isGenerating}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isGenerating}
              className="absolute bottom-3 right-3 p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-110 disabled:hover:scale-100 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-neutral-500 text-center">
            Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-xs font-mono">Enter</kbd> to send or <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-xs font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
