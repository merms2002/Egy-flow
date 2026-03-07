import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Send,
  BrainCircuit,
  Loader2,
  Sparkles,
  Paperclip,
  FileText,
  X,
  Plus,
  MessageSquareText,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Type } from '@google/genai';

import { chatWithAI, thinkDeeply, generateSubjectPlan } from '../../services/ai';
import { useStudentStore } from '../../store/useStudentStore';
import { useTaskStore } from '../../store/useTaskStore';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isThinking?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
}

const initialMessage: Message = {
  id: 'welcome-1',
  role: 'ai',
  text: "Hi! I'm your EgyFlow AI assistant. I can help with planning, task management, and subject progress.",
};

const createInitialSession = (): ChatSession => ({
  id: crypto.randomUUID(),
  title: 'New Chat',
  createdAt: Date.now(),
  messages: [initialMessage],
});

const AIChatView = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('egyflow_chat_sessions');
    if (!saved) return [createInitialSession()];
    try {
      const parsed = JSON.parse(saved) as ChatSession[];
      return parsed.length ? parsed : [createInitialSession()];
    } catch {
      return [createInitialSession()];
    }
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const saved = localStorage.getItem('egyflow_chat_active_session');
    return saved || '';
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; mimeType: string; data: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    subjects,
    updateSubjectProgress,
    subjectPlans,
    setSubjectPlan,
  } = useStudentStore();
  const { tasks, addTask, toggleTask, deleteTask } = useTaskStore();

  useEffect(() => {
    if (!activeSessionId && sessions.length) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    localStorage.setItem('egyflow_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('egyflow_chat_active_session', activeSessionId);
    }
  }, [activeSessionId]);

  const activeSession = sessions.find((session) => session.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [initialMessage];

  const updateActiveSession = (nextMessages: Message[], userPrompt?: string) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== activeSession.id) return session;
        const derivedTitle =
          session.title === 'New Chat' && userPrompt
            ? userPrompt.slice(0, 40)
            : session.title;
        return { ...session, messages: nextMessages, title: derivedTitle };
      }),
    );
  };

  const createNewChat = () => {
    const nextSession = createInitialSession();
    setSessions((prev) => [nextSession, ...prev]);
    setActiveSessionId(nextSession.id);
    setInput('');
    setAttachedFile(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setAttachedFile({
        name: file.name,
        mimeType: file.type || 'text/plain',
        data: base64Data,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || isLoading || !activeSession) return;

    const userMessage = input.trim();
    setInput('');

    const currentFile = attachedFile;
    setAttachedFile(null);

    const composedText = currentFile
      ? `${userMessage || ''}${userMessage ? '\n' : ''}[Attached File: ${currentFile.name}]`
      : userMessage;

    const userEntry: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: composedText,
    };

    const baseMessages = [...messages, userEntry];
    updateActiveSession(baseMessages, userMessage);
    setIsLoading(true);

    try {
      if (isDeepThinking) {
        const deepResponse = await thinkDeeply(userMessage);
        updateActiveSession([
          ...baseMessages,
          { id: crypto.randomUUID(), role: 'ai', text: deepResponse, isThinking: true },
        ]);
        return;
      }

      const history = messages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

      const tools = {
        functionDeclarations: [
          {
            name: 'updateSubjectProgress',
            description: 'Update progress for a specific subject.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                subjectId: { type: Type.STRING },
                progress: { type: Type.NUMBER },
              },
              required: ['subjectId', 'progress'],
            },
          },
          {
            name: 'addTask',
            description: 'Create a new task in the student todo list.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
              },
              required: ['text'],
            },
          },
          {
            name: 'toggleTaskCompletion',
            description: 'Mark a task as completed/uncompleted by task id.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                taskId: { type: Type.STRING },
              },
              required: ['taskId'],
            },
          },
          {
            name: 'deleteTask',
            description: 'Delete a task by task id.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                taskId: { type: Type.STRING },
              },
              required: ['taskId'],
            },
          },
          {
            name: 'generateSubjectPlan',
            description: 'Generate a roadmap plan for a subject by subject id.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                subjectId: { type: Type.STRING },
                context: { type: Type.STRING },
              },
              required: ['subjectId'],
            },
          },
        ],
      };

      const contextMessage = `Current subjects:\n${subjects
        .map((subject) => `- ${subject.name} (ID: ${subject.id}, Progress: ${subject.progress || 0}%, Status: ${subject.status})`)
        .join('\n')}\n\nCurrent tasks:\n${tasks
        .map((task) => `- ${task.text} (ID: ${task.id}, Completed: ${task.completed})`)
        .join('\n') || '- No tasks'}\n\nUser: ${userMessage}`;

      const fileParts = currentFile
        ? [{ inlineData: { data: currentFile.data, mimeType: currentFile.mimeType } }]
        : undefined;

      const response = await chatWithAI(history, contextMessage, [tools], fileParts);
      let responseText = response.text;
      const actionLogs: string[] = [];

      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          const args = (call.args || {}) as Record<string, any>;

          if (call.name === 'updateSubjectProgress') {
            const subjectId = String(args.subjectId || '');
            const progress = Math.max(0, Math.min(100, Number(args.progress || 0)));
            updateSubjectProgress(subjectId, progress);
            const subjectName = subjects.find((subject) => subject.id === subjectId)?.name || subjectId;
            actionLogs.push(`Updated **${subjectName}** progress to **${progress}%**.`);
          }

          if (call.name === 'addTask' && args.text) {
            addTask(String(args.text));
            actionLogs.push(`Added task: **${String(args.text)}**.`);
          }

          if (call.name === 'toggleTaskCompletion' && args.taskId) {
            const taskId = String(args.taskId);
            toggleTask(taskId);
            const taskText = tasks.find((task) => task.id === taskId)?.text || taskId;
            actionLogs.push(`Toggled completion for task: **${taskText}**.`);
          }

          if (call.name === 'deleteTask' && args.taskId) {
            const taskId = String(args.taskId);
            const taskText = tasks.find((task) => task.id === taskId)?.text || taskId;
            deleteTask(taskId);
            actionLogs.push(`Deleted task: **${taskText}**.`);
          }

          if (call.name === 'generateSubjectPlan' && args.subjectId) {
            const subjectId = String(args.subjectId);
            const subject = subjects.find((item) => item.id === subjectId);
            if (subject) {
              const context = args.context ? String(args.context) : 'Generated from AI chat request';
              const plan = await generateSubjectPlan(subject.name, subject.status, context);
              setSubjectPlan(subjectId, plan);
              actionLogs.push(`Generated a study roadmap for **${subject.name}**.`);
            }
          }
        }
      }

      if (actionLogs.length > 0) {
        responseText += `\n\n### Actions completed\n${actionLogs.map((log) => `- ${log}`).join('\n')}`;
      }

      updateActiveSession([
        ...baseMessages,
        { id: crypto.randomUUID(), role: 'ai', text: responseText, isThinking: isDeepThinking },
      ]);
    } catch {
      updateActiveSession([
        ...baseMessages,
        {
          id: crypto.randomUUID(),
          role: 'ai',
          text: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Analyze my weak subjects and create a 7-day plan.',
    'Add three high-priority revision tasks for today.',
    'Give me a focused daily routine like a top student.',
  ];

  return (
    <div className="flex h-full bg-[#0f1115] rounded-2xl border border-white/5 overflow-hidden">
      <aside className="hidden md:flex w-72 border-r border-white/10 bg-[#0b0d11] p-4 flex-col gap-4">
        <button
          onClick={createNewChat}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={18} /> New chat
        </button>
        <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                session.id === activeSession.id
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/0 border-transparent text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-start gap-2">
                <MessageSquareText size={16} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-xs opacity-60 truncate">{session.messages.length} messages</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">EgyFlow AI</h2>
              <p className="text-xs md:text-sm text-white/60">ChatGPT-style workspace • Context-aware study assistant</p>
            </div>
          </div>
          <button
            onClick={() => setIsDeepThinking((prev) => !prev)}
            className={`px-3 py-2 rounded-lg text-xs md:text-sm flex items-center gap-2 border ${
              isDeepThinking
                ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                : 'bg-white/5 text-white/70 border-white/10'
            }`}
          >
            <BrainCircuit size={16} /> Deep mode
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[92%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white/5 text-white/90 border border-white/10 rounded-bl-sm'
                }`}
              >
                {msg.role === 'ai' ? (
                  <div className="markdown-body prose prose-invert max-w-none text-sm md:text-base">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm md:text-base">{msg.text}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/5 border border-white/10 text-white/70 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                {isDeepThinking ? 'Thinking deeply...' : 'Writing answer...'}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/10 p-4 md:p-6 bg-[#0b0d11]">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {attachedFile && (
            <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 mb-3 w-fit max-w-full">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={16} className="text-indigo-300 shrink-0" />
                <span className="text-sm text-indigo-200 truncate">{attachedFile.name}</span>
              </div>
              <button onClick={() => setAttachedFile(null)} className="ml-3 text-indigo-300/70 hover:text-indigo-200">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex gap-2 md:gap-3 items-end">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message EgyFlow AI..."
              rows={2}
              className="flex-1 resize-none bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !attachedFile) || isLoading}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatView;
