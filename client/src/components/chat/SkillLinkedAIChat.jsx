import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaPaperclip, FaPaperPlane, FaMicrophone, FaStop,
  FaFilePdf, FaFileWord, FaFileAlt, FaImage, FaTrash, FaCopy
} from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

import { sendAIMessage, fetchAIHistory, addLocalMessage } from '../../redux/slices/aiSlice';

// ─── AI Quick Actions Component ─────────────────────────────────
const AIQuickActions = ({ onSelectAction }) => {
  const actions = [
    { label: 'Analyze Resume', icon: '📄', prompt: 'Please review my resume and provide an ATS score and suggestions.' },
    { label: 'Interview Practice', icon: '🎤', prompt: 'Act as a strict HR manager and conduct a mock interview with me.' },
    { label: 'Fix Code', icon: '💻', prompt: 'I have a bug in my code. Can you help me debug it?' },
    { label: 'Write Cover Letter', icon: '📝', prompt: 'Write a professional cover letter for a Software Engineering role.' },
    { label: 'Summarize', icon: '✂️', prompt: 'Summarize the following text concisely: ' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-4 mb-2 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-[#111b21]/50 backdrop-blur-md">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={() => onSelectAction(action.prompt)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1f2c34] border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-500 transition-all shadow-sm"
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
};

// ─── AI Message Bubble Component ────────────────────────────────
const AIMessageBubble = ({ msg, isUser }) => {
  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-md mr-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </div>
      )}
      
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-white dark:bg-[#1f2c34] text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-700'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{msg.content}</div>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="relative group mt-2 mb-2 rounded-lg overflow-hidden border border-gray-700">
                        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800/80 rounded-bl-lg z-10">
                          <button 
                            onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                            className="p-1 text-gray-300 hover:text-white"
                            title="Copy code"
                          >
                            <FaCopy size={12} />
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={materialDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: 0, padding: '1rem', fontSize: '0.85rem' }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-500 dark:text-pink-400" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};


// ─── Main AI Chat Component ──────────────────────────────────────
const SkillLinkedAIChat = ({ onBack }) => {
  const dispatch = useDispatch();
  const { currentConversation, isTyping } = useSelector(s => s.ai);
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAIHistory());
  }, [dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, isTyping]);

  const handleSend = (text = null) => {
    const prompt = text || input.trim();
    if (!prompt) return;

    setInput('');
    dispatch(addLocalMessage({ role: 'user', content: prompt, createdAt: new Date().toISOString() }));
    dispatch(sendAIMessage({ 
      prompt, 
      conversationId: currentConversation?._id, 
      category: 'general' 
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] relative w-full">
      {/* Header */}
      <div className="px-3 md:px-5 py-2.5 flex justify-between items-center bg-white dark:bg-[#202c33] border-b border-gray-200/60 dark:border-gray-700/40 flex-shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="md:hidden p-1.5 -ml-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 transition-colors">
            <FaArrowLeft size={16} />
          </button>
          
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">SkillLinked AI</h2>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-blue-500 flex-shrink-0" title="Verified AI">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <p className="text-xs font-medium text-green-500 flex items-center gap-1">
              Online & Ready
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-2">
        {(!currentConversation || currentConversation.messages?.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-10 opacity-80">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl mb-6">
              <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Welcome to SkillLinked AI</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Your intelligent assistant for career growth, interview prep, resume building, and coding help. Just ask!
            </p>
          </div>
        )}

        {currentConversation?.messages?.map((msg, idx) => (
          <AIMessageBubble key={idx} msg={msg} isUser={msg.role === 'user'} />
        ))}

        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-md mr-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
            </div>
            <div className="bg-white dark:bg-[#1f2c34] px-4 py-3 rounded-2xl rounded-bl-sm border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-1.5 h-11">
              <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] z-10 flex flex-col">
        <AIQuickActions onSelectAction={handleSend} />
        
        <div className="px-3 md:px-4 py-3 flex items-end gap-2">
          <button className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0" title="Attach File (Resume/Code)">
            <FaPaperclip size={20} />
          </button>
          
          <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-2xl overflow-hidden border border-transparent focus-within:border-blue-500/50 transition-colors shadow-sm flex items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask SkillLinked AI (e.g. Write a React component...)"
              className="w-full max-h-32 min-h-[44px] bg-transparent text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-500 px-4 py-3 resize-none outline-none"
              rows={1}
            />
          </div>

          {input.trim() ? (
            <button onClick={() => handleSend()} className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex-shrink-0 shadow-md">
              <FaPaperPlane size={18} className="-ml-0.5" />
            </button>
          ) : (
            <button className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex-shrink-0 shadow-md">
              <FaMicrophone size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillLinkedAIChat;
