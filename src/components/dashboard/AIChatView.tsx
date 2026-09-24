import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, BrainCircuit, Loader2, Sparkles, Paperclip, FileText, X } from 'lucide-react';
import { chatWithAI, thinkDeeply } from '../../services/ai';
import Markdown from 'react-markdown';
import { useStudentStore } from '../../store/useStudentStore';
import { Type } from '@google/genai';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isThinking?: boolean;
}

const AIChatView = () => {
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
    <div className="flex flex-col h-full bg-[#190019] rounded-2xl border border-[#522B5B]/30 overflow-hidden shadow-[0_0_40px_rgba(43,18,76,0.3)]">
      {/* Header */}
      <div className="p-6 border-b border-[#522B5B]/30 bg-[#2B124C] flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#2B124C] to-[#522B5B] opacity-50"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 bg-[#DFB6B2]/20 rounded-xl text-[#FBE4D8] shadow-[0_0_15px_rgba(223,182,178,0.2)]">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#FBE4D8]">EgyFlow AI Assistant</h2>
            <p className="text-sm text-[#DFB6B2]">Powered by Gemini 3.1 Pro</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-[#190019] to-[#2B124C]/20">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-[#522B5B] text-[#FBE4D8] rounded-br-sm shadow-lg' 
                  : msg.isThinking
                    ? 'bg-[#854F6C]/20 border border-[#854F6C]/40 text-[#DFB6B2] rounded-bl-sm shadow-[0_0_15px_rgba(133,79,108,0.2)]'
                    : 'bg-[#2B124C] border border-[#522B5B]/50 text-[#FBE4D8] rounded-bl-sm shadow-md'
              }`}
            >
              {msg.role === 'ai' && msg.isThinking && (
                <div className="flex items-center gap-1.5 mb-3 text-[#DFB6B2] text-xs font-bold uppercase tracking-wider">
                  <BrainCircuit size={14} />
                  Deep Thought
                </div>
              )}
              {msg.role === 'ai' ? (
                <div className="markdown-body text-base prose prose-invert max-w-none prose-p:text-[#FBE4D8] prose-headings:text-[#FBE4D8] prose-a:text-[#DFB6B2] prose-strong:text-[#FBE4D8]">
                  <Markdown>{msg.text}</Markdown>
                </div>
              ) : (
                <p className="text-base whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#2B124C] border border-[#522B5B]/50 text-[#FBE4D8] p-4 rounded-2xl rounded-bl-sm flex items-center gap-3 shadow-md">
              <Loader2 size={18} className="animate-spin text-[#DFB6B2]" />
              <span className="text-base text-[#DFB6B2]">
                {isDeepThinking ? 'Thinking deeply...' : 'Typing...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-[#522B5B]/30 bg-[#190019]">
        <div className="max-w-4xl mx-auto">
          {attachedFile && (
            <div className="flex items-center justify-between bg-[#522B5B]/30 border border-[#854F6C]/50 rounded-xl p-3 mb-4 w-fit max-w-full">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={18} className="text-[#DFB6B2] shrink-0" />
                <span className="text-sm text-[#FBE4D8] truncate">{attachedFile.name}</span>
              </div>
              <button 
                onClick={() => setAttachedFile(null)}
                className="p-1.5 ml-4 text-[#DFB6B2]/60 hover:text-[#FBE4D8] hover:bg-[#854F6C]/40 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setIsDeepThinking(!isDeepThinking)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isDeepThinking 
                  ? 'bg-[#854F6C]/30 text-[#FBE4D8] border border-[#854F6C]/50 shadow-[0_0_15px_rgba(133,79,108,0.3)]' 
                  : 'bg-[#2B124C] text-[#DFB6B2] hover:bg-[#522B5B]/50 border border-transparent'
              }`}
              title="Use advanced reasoning for complex questions"
            >
              <BrainCircuit size={16} className={isDeepThinking ? "animate-pulse" : ""} />
              Deep Think Mode
            </button>
          </div>
          <div className="flex gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.txt,.md,.csv,.png,.jpg,.jpeg,.webp"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-[#2B124C] text-[#DFB6B2] rounded-xl hover:bg-[#522B5B] hover:text-[#FBE4D8] transition-colors shadow-sm"
              title="Attach file"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 bg-[#2B124C]/50 border border-[#522B5B]/50 rounded-xl px-5 py-3 text-base text-[#FBE4D8] placeholder:text-[#DFB6B2]/50 focus:outline-none focus:border-[#854F6C] focus:bg-[#2B124C] transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !attachedFile) || isLoading}
              className="p-3 bg-[#522B5B] text-[#FBE4D8] rounded-xl hover:bg-[#854F6C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-md"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatView;
