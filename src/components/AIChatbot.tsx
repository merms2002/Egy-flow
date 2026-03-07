import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, BrainCircuit, Loader2, Sparkles, Paperclip, FileText } from 'lucide-react';
import { chatWithAI, thinkDeeply } from '../services/ai';
import Markdown from 'react-markdown';
import { useStudentStore } from '../store/useStudentStore';
import { Type } from '@google/genai';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isThinking?: boolean;
}

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('egyflow_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    }
    return [{ id: '1', role: 'ai', text: "Hi! I'm your EgyFlow AI assistant. How can I help you study today?" }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{name: string, mimeType: string, data: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { subjects, updateSubjectProgress } = useStudentStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    localStorage.setItem('egyflow_chat_history', JSON.stringify(messages));
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setAttachedFile({
        name: file.name,
        mimeType: file.type || 'text/plain',
        data: base64Data
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const currentFile = attachedFile;
    setAttachedFile(null);
    
    let messageText = userMessage;
    if (currentFile) {
      messageText = messageText ? `${messageText}\n[Attached File: ${currentFile.name}]` : `[Attached File: ${currentFile.name}]`;
    }
    
    const newMessages = [...messages, { id: Date.now().toString(), role: 'user' as const, text: messageText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      let responseText = '';
      if (isDeepThinking) {
        responseText = await thinkDeeply(userMessage);
        setMessages([...newMessages, { id: Date.now().toString(), role: 'ai', text: responseText, isThinking: isDeepThinking }]);
      } else {
        // Format history for the API
        const history = messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));
        
        const updateSubjectProgressTool = {
          functionDeclarations: [
            {
              name: "updateSubjectProgress",
              description: "Updates the progress percentage of a specific subject. Use this when the user tells you they have completed a certain amount of a subject.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  subjectId: {
                    type: Type.STRING,
                    description: "The ID of the subject to update.",
                  },
                  progress: {
                    type: Type.NUMBER,
                    description: "The new progress percentage (0-100).",
                  },
                },
                required: ["subjectId", "progress"],
              },
            }
          ]
        };

        const contextMessage = `Current subjects:\n${subjects.map(s => `- ${s.name} (ID: ${s.id}, Progress: ${s.progress || 0}%)`).join('\n')}\n\nUser: ${userMessage}`;
        
        const fileParts = currentFile ? [{
          inlineData: {
            data: currentFile.data,
            mimeType: currentFile.mimeType
          }
        }] : undefined;
        
        const response = await chatWithAI(history, contextMessage, [updateSubjectProgressTool], fileParts);
        
        responseText = response.text;

        if (response.functionCalls) {
          for (const call of response.functionCalls) {
            if (call.name === 'updateSubjectProgress') {
              const { subjectId, progress } = call.args as any;
              updateSubjectProgress(subjectId, progress);
              const subjectName = subjects.find(s => s.id === subjectId)?.name || 'the subject';
              responseText += `\n\n*I've updated your progress for ${subjectName} to ${progress}%!*`;
            }
          }
        }
        
        setMessages([...newMessages, { id: Date.now().toString(), role: 'ai', text: responseText, isThinking: isDeepThinking }]);
      }

    } catch (error) {
      setMessages([...newMessages, { id: Date.now().toString(), role: 'ai', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-40 transition-colors ${
          isOpen ? 'bg-indigo-700 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'
        }`}
      >
        <MessageSquare size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[350px] md:w-[400px] h-[500px] max-h-[80vh] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white">EgyFlow AI</h3>
                  <p className="text-xs text-white/60">Powered by Gemini</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-sm' 
                        : msg.isThinking
                          ? 'bg-purple-500/10 border border-purple-500/20 text-purple-100 rounded-bl-sm shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                          : 'bg-white/10 text-white/90 rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'ai' && msg.isThinking && (
                      <div className="flex items-center gap-1.5 mb-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                        <BrainCircuit size={12} />
                        Deep Thought
                      </div>
                    )}
                    {msg.role === 'ai' ? (
                      <div className="markdown-body text-sm prose prose-invert max-w-none">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white/90 p-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-indigo-400" />
                    <span className="text-sm text-white/60">
                      {isDeepThinking ? 'Thinking deeply...' : 'Typing...'}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              {attachedFile && (
                <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2 mb-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={16} className="text-indigo-400 shrink-0" />
                    <span className="text-sm text-indigo-300 truncate">{attachedFile.name}</span>
                  </div>
                  <button 
                    onClick={() => setAttachedFile(null)}
                    className="p-1 text-indigo-400/60 hover:text-indigo-400 hover:bg-indigo-500/20 rounded transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setIsDeepThinking(!isDeepThinking)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isDeepThinking 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                  }`}
                  title="Use advanced reasoning for complex questions"
                >
                  <BrainCircuit size={14} className={isDeepThinking ? "animate-pulse" : ""} />
                  Deep Think Mode
                </button>
              </div>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 hover:text-white transition-colors"
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachedFile) || isLoading}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
