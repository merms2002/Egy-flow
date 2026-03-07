import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Trash2, Search, Save, FileText, 
  Bold, Italic, List, CheckSquare, Code, 
  Maximize2, Minimize2, MoreVertical, FolderPlus, Mic, Loader2, Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { transcribeAudio, fastAIResponse } from '../services/ai';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  folder?: string;
}

interface NotepadProps {
  isOpen: boolean;
  onClose: () => void;
}

const Notepad: React.FC<NotepadProps> = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Audio Transcription State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('egyflow-notes');
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        setNotes(parsed);
        if (parsed.length > 0) {
          setActiveNoteId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse notes', e);
      }
    } else {
      // Create a welcome note if no notes exist
      const welcomeNote: Note = {
        id: crypto.randomUUID(),
        title: 'Welcome to EgyFlow Notes',
        content: '# Welcome to your new advanced notepad!\n\nThis notepad supports **Markdown**.\n\n- Create new notes\n- Organize your thoughts\n- Stay focused\n\nTry typing some code:\n```javascript\nconsole.log("Hello World");\n```',
        updatedAt: Date.now(),
      };
      setNotes([welcomeNote]);
      setActiveNoteId(welcomeNote.id);
      localStorage.setItem('egyflow-notes', JSON.stringify([welcomeNote]));
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('egyflow-notes', JSON.stringify(notes));
    }
  }, [notes]);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const createNewNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '',
      updatedAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      const newNotes = notes.filter(n => n.id !== id);
      setNotes(newNotes);
      if (activeNoteId === id) {
        setActiveNoteId(newNotes.length > 0 ? newNotes[0].id : null);
      }
      localStorage.setItem('egyflow-notes', JSON.stringify(newNotes));
    }
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(notes.map(n => 
      n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
    ));
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const insertMarkdown = (syntax: string) => {
    if (!activeNote) return;
    const textarea = document.getElementById('note-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = activeNote.content;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const selection = text.substring(start, end);

    let newText = '';
    let newCursorPos = 0;

    switch (syntax) {
      case 'bold':
        newText = `${before}**${selection || 'bold text'}**${after}`;
        newCursorPos = selection ? end + 4 : start + 2 + 9 + 2; // Approximate
        break;
      case 'italic':
        newText = `${before}_${selection || 'italic text'}_${after}`;
        break;
      case 'list':
        newText = `${before}\n- ${selection || 'list item'}${after}`;
        break;
      case 'heading':
        newText = `${before}\n# ${selection || 'Heading'}${after}`;
        break;
      case 'code':
        newText = `${before}\`\`\`\n${selection || 'code'}\n\`\`\`${after}`;
        break;
      case 'check':
        newText = `${before}\n- [ ] ${selection || 'task'}${after}`;
        break;
      default:
        return;
    }

    updateNote(activeNote.id, { content: newText });
    // Focus back would be ideal but tricky with React state updates
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          setIsTranscribing(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert Blob to Base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            const base64String = base64data.split(',')[1];
            
            const transcription = await transcribeAudio(base64String, 'audio/webm');
            
            if (activeNote && transcription) {
              const newContent = activeNote.content + (activeNote.content ? '\n\n' : '') + transcription;
              updateNote(activeNote.id, { content: newContent });
            }
            setIsTranscribing(false);
          };
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Could not access microphone. Please check permissions.");
      }
    }
  };

  const handleSummarize = async () => {
    if (!activeNote || !activeNote.content.trim()) return;
    
    const originalContent = activeNote.content;
    updateNote(activeNote.id, { content: originalContent + '\n\n> *Summarizing...*' });
    
    const summary = await fastAIResponse(`Please provide a concise summary of the following notes:\n\n${originalContent}`);
    
    if (summary) {
      updateNote(activeNote.id, { content: originalContent + `\n\n### AI Summary\n${summary}` });
    } else {
      updateNote(activeNote.id, { content: originalContent });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`${isFullscreen ? 'fixed inset-0 rounded-none' : 'w-full max-w-5xl h-[85vh] rounded-2xl'} bg-[#1a1a1a] border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-300`}
      >
        {/* Sidebar */}
        <div className={`${showSidebar ? 'flex w-full md:w-80 h-full md:h-auto' : 'hidden md:flex w-0 opacity-0 overflow-hidden'} flex-shrink-0 bg-black/20 border-r border-white/5 flex-col transition-all duration-300`}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <FileText size={18} className="text-indigo-400" />
              Notes
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={createNewNote}
                className="p-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-lg transition-colors"
                title="New Note"
              >
                <Plus size={18} />
              </button>
              <button 
                onClick={onClose}
                className="md:hidden p-2 hover:bg-white/10 text-white/60 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          <div className="p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input 
                type="text" 
                placeholder="Search notes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredNotes.map(note => (
              <div 
                key={note.id}
                onClick={() => {
                  setActiveNoteId(note.id);
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
                className={`group p-3 rounded-xl cursor-pointer transition-all ${activeNoteId === note.id ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 border-transparent'} border`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-white truncate pr-2">{note.title || 'Untitled'}</h3>
                  <button 
                    onClick={(e) => deleteNote(note.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-white/40 truncate">
                  {note.content.substring(0, 50) || 'No content'}
                </p>
                <p className="text-[10px] text-white/20 mt-2">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            
            {filteredNotes.length === 0 && (
              <div className="text-center py-8 text-white/30 text-sm">
                No notes found
              </div>
            )}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className={`${showSidebar ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full bg-[#1a1a1a] relative`}>
          {/* Mobile Header for Sidebar Toggle */}
          <div className="md:hidden p-4 border-b border-white/5 flex items-center justify-between">
             <button onClick={() => setShowSidebar(true)} className="text-white/60">
               <List size={20} />
             </button>
             <span className="text-white font-medium truncate max-w-[200px]">
               {activeNote?.title || 'Select a note'}
             </span>
             <button onClick={onClose} className="text-white/60">
               <X size={20} />
             </button>
          </div>

          {activeNote ? (
            <>
              {/* Toolbar */}
              <div className="p-3 border-b border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                  <button onClick={() => setShowSidebar(!showSidebar)} className="hidden md:flex p-2 hover:bg-white/5 rounded-lg text-white/60" title="Toggle Sidebar">
                    {showSidebar ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />
                  
                  <button onClick={() => insertMarkdown('bold')} className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white" title="Bold">
                    <Bold size={18} />
                  </button>
                  <button onClick={() => insertMarkdown('italic')} className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white" title="Italic">
                    <Italic size={18} />
                  </button>
                  <button onClick={() => insertMarkdown('list')} className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white" title="List">
                    <List size={18} />
                  </button>
                  <button onClick={() => insertMarkdown('check')} className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white" title="Checklist">
                    <CheckSquare size={18} />
                  </button>
                  <button onClick={() => insertMarkdown('code')} className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white" title="Code Block">
                    <Code size={18} />
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />
                  <button 
                    onClick={toggleRecording} 
                    disabled={isTranscribing}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                      isRecording 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse' 
                        : isTranscribing 
                          ? 'bg-white/5 text-white/40 cursor-not-allowed'
                          : 'hover:bg-white/5 text-white/60 hover:text-white'
                    }`} 
                    title={isRecording ? "Stop Recording" : "Transcribe Audio"}
                  >
                    {isTranscribing ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
                    {isRecording && <span className="text-xs font-medium">Recording...</span>}
                    {isTranscribing && <span className="text-xs font-medium">Transcribing...</span>}
                  </button>
                  <button 
                    onClick={handleSummarize} 
                    className="p-2 hover:bg-indigo-500/20 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1" 
                    title="Summarize with AI"
                  >
                    <Sparkles size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isPreviewMode ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                  >
                    {isPreviewMode ? 'Edit' : 'Preview'}
                  </button>
                  <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 hover:bg-white/5 rounded-lg text-white/60 hidden md:block"
                    title="Toggle Fullscreen"
                  >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-white/60 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div className="px-6 pt-6 pb-2">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                  placeholder="Note Title"
                  className="w-full bg-transparent text-2xl md:text-3xl font-bold text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              {/* Editor / Preview */}
              <div className="flex-1 overflow-hidden relative">
                {isPreviewMode ? (
                  <div className="absolute inset-0 p-6 overflow-y-auto prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeNote.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    id="note-textarea"
                    value={activeNote.content}
                    onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                    placeholder="Start typing..."
                    className="w-full h-full p-6 bg-transparent text-white/90 resize-none focus:outline-none font-mono text-sm md:text-base leading-relaxed"
                    spellCheck={false}
                  />
                )}
              </div>
              
              {/* Status Bar */}
              <div className="px-4 py-2 border-t border-white/5 text-[10px] text-white/30 flex justify-between items-center">
                <span>{activeNote.content.length} characters</span>
                <span>Last saved: {new Date(activeNote.updatedAt).toLocaleTimeString()}</span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/30">
              <FileText size={48} className="mb-4 opacity-20" />
              <p>Select a note or create a new one</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Notepad;
