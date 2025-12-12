
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Chat } from '@google/genai';
import { createCuratorChat, sendMessageToCurator } from '../services/geminiService';
import { Product, ChatMessage } from '../types';

interface CuratorChatProps {
  activeProduct?: Product;
}

const CuratorChat: React.FC<CuratorChatProps> = ({ activeProduct }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initChat = () => {
    setHasError(false);
    try {
        chatSessionRef.current = createCuratorChat(activeProduct);
        setMessages([
          {
            role: 'model',
            text: activeProduct 
              ? `Tenayistilign! I see you are admiring the ${activeProduct.name}. How can I assist you with its history or styling today?`
              : "Tenayistilign! I am Ato Kassa. I can help you discover the perfect piece of Ethiopian heritage for your home or wardrobe. What are you looking for?"
          }
        ]);
    } catch (error) {
        console.error("Failed to initialize chat:", error);
        setHasError(true);
        setMessages([
          {
            role: 'model',
            text: "I apologize, but I am having trouble connecting to the cultural archives right now. Please check your internet connection or try again later.",
            isError: true
          }
        ]);
    }
  };

  // Initialize or reset chat when product context changes or opened
  useEffect(() => {
    if (isOpen) {
        initChat();
    }
  }, [isOpen, activeProduct]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Safety check if chat failed to init
    if (!chatSessionRef.current || hasError) {
        setMessages(prev => [...prev, { role: 'user', text: input }, { role: 'model', text: "Service is unavailable. Please try reloading.", isError: true}]);
        setInput('');
        return;
    }

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const responseText = await sendMessageToCurator(chatSessionRef.current, userMsg);

    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-emerald-900 text-white p-4 rounded-full shadow-lg hover:bg-emerald-800 transition-all hover:scale-105 z-30 group"
        >
          <MessageCircle size={28} />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white text-stone-800 px-3 py-1 rounded-md text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Ask the Curator
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-full max-w-sm h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-40 border border-stone-200 overflow-hidden font-sans">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-full">
                <Sparkles size={16} className="text-gold-accent" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm">Ato Kassa</h3>
                <p className="text-xs text-emerald-100">Cultural Curator AI</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-parchment">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-stone-800 text-white rounded-br-none'
                      : msg.isError 
                        ? 'bg-red-50 border border-red-200 text-red-800 rounded-bl-none'
                        : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-emerald-900" />
                </div>
              </div>
            )}
            
            {hasError && (
                <div className="flex justify-center mt-4">
                    <button 
                        onClick={initChat}
                        className="flex items-center gap-2 text-xs bg-white border border-stone-300 px-3 py-1.5 rounded-full text-stone-600 hover:bg-stone-50"
                    >
                        <RefreshCw size={12} /> Retry Connection
                    </button>
                </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-stone-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about history, styling, or materials..."
                disabled={hasError}
                className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || hasError}
                className="p-2 bg-emerald-900 text-white rounded-full hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CuratorChat;
