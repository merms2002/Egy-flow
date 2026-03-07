import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Pencil, Flame, Zap, RotateCcw, AlertTriangle, Plus, Check, X, Trash2, Bell, Clock, Volume2, VolumeX, CloudRain, Trees, Coffee, Waves, GripVertical } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AppSettings } from '../SettingsModal';
import { useGamificationStore } from '../../store/useGamificationStore';
import { useTaskStore } from '../../store/useTaskStore';
import { requestNotificationPermission, sendNotification } from '../../utils/notifications';

interface TimerModeProps {
  user: FirebaseUser | null;
  settings: AppSettings;
  setIsGamificationOpen: (isOpen: boolean) => void;
}

const TimerMode = ({ user, settings, setIsGamificationOpen }: TimerModeProps) => {
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(settings.focusWorkDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentSession, setCurrentSession] = useState(0);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Audio State
  const [selectedSound, setSelectedSound] = useState<string>('none');
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Task List State
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const { tasks, addTask, toggleTask, deleteTask, updateTask, reorderTasks } = useTaskStore();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [reminderTimeInput, setReminderTimeInput] = useState('');

  const totalSessions = 5;
  
  const { addPoints, updateStreak, focusPoints, currentStreak } = useGamificationStore();

  const modes = {
    focus: { label: 'Focus', time: settings.focusWorkDuration * 60 },
    shortBreak: { label: 'Short Break', time: settings.focusShortBreak * 60 },
    longBreak: { label: 'Long Break', time: settings.focusLongBreak * 60 },
  };

  const sounds: Record<string, string> = {
    rain: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3',
    forest: 'https://cdn.pixabay.com/audio/2021/09/06/audio_3325695032.mp3',
    cafe: 'https://cdn.pixabay.com/audio/2022/03/24/audio_0318365090.mp3',
    waves: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
  };

  const soundOptions = [
    { id: 'none', icon: VolumeX, label: 'Off' },
    { id: 'rain', icon: CloudRain, label: 'Rain' },
    { id: 'forest', icon: Trees, label: 'Forest' },
    { id: 'cafe', icon: Coffee, label: 'Cafe' },
    { id: 'waves', icon: Waves, label: 'Waves' },
  ];

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-orange-500',
    low: 'bg-blue-500'
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Audio Effect
  useEffect(() => {
    if (selectedSound !== 'none' && isActive && !isMuted) {
      if (!audioRef.current || audioRef.current.src !== sounds[selectedSound]) {
        audioRef.current = new Audio(sounds[selectedSound]);
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isActive, selectedSound, isMuted]);

  // Update timeLeft when settings change if we are not active
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(modes[mode].time);
    }
  }, [settings.focusWorkDuration, settings.focusShortBreak, settings.focusLongBreak]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
        if (mode === 'focus') {
          setAccumulatedTime((t) => t + 1);
        }
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished logic
      if (mode === 'focus') {
        // Focus session finished
        sendNotification("Focus Session Complete!", {
          body: "Great job! Time for a break.",
        });
        addPoints(10); // Award 10 points for a completed focus session
        updateStreak(); // Update daily streak
        
        if (currentSession < totalSessions - 1) {
          setMode('shortBreak');
          setTimeLeft(modes.shortBreak.time);
          setIsActive(true);
        } else {
          setMode('longBreak');
          setTimeLeft(modes.longBreak.time);
          setIsActive(true);
        }
      } else if (mode === 'shortBreak') {
        // Short break finished
        sendNotification("Break Over!", {
          body: "Ready to focus again?",
        });
        setCurrentSession(prev => prev + 1);
        setMode('focus');
        setTimeLeft(modes.focus.time);
        setIsActive(true);
      } else if (mode === 'longBreak') {
        // Long break finished - Reset cycle
        sendNotification("Long Break Over!", {
          body: "Cycle complete. Ready to start a new one?",
        });
        setCurrentSession(0);
        setMode('focus');
        setTimeLeft(modes.focus.time);
        setIsActive(false);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, currentSession, totalSessions, modes.focus.time, modes.shortBreak.time, modes.longBreak.time, addPoints, updateStreak]);

  const handleModeChange = (newMode: keyof typeof modes) => {
    setMode(newMode);
    setTimeLeft(modes[newMode].time);
    setIsActive(false);
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const formatDurationString = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const confirmReset = async () => {
    if (accumulatedTime > 0 && user) {
      try {
        await addDoc(collection(db, 'sessions'), {
          userId: user.uid,
          subject: 'Focus Session',
          duration: formatDurationString(accumulatedTime),
          seconds: accumulatedTime,
          score: 'Medium',
          createdAt: Timestamp.now()
        });
      } catch (e) {
        console.error("Error saving session:", e);
      }
    }
    setIsActive(false);
    setTimeLeft(modes[mode].time);
    setAccumulatedTime(0);
    setShowResetConfirm(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Task Handlers
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    addTask(newTask, priority);
    setNewTask('');
    setPriority('medium'); // Reset priority
  };

  const setReminder = (taskId: string, minutes: number) => {
    const reminderTime = Date.now() + minutes * 60 * 1000;
    updateTask(taskId, { reminderTime });
    setEditingTaskId(null);
    sendNotification("Reminder Set", { body: `We'll remind you about this task in ${minutes} minutes.` });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center text-white w-full max-w-5xl relative p-4 md:p-8 mx-auto min-h-[60vh] md:min-h-0"
    >
      {/* Gamification Stats */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-2 right-2 md:top-0 md:right-0 flex items-center gap-2 md:gap-4 bg-white/5 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-colors z-20"
        onClick={() => setIsGamificationOpen(true)}
      >
        <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-orange-400" title="Daily Streak">
          <Flame size={14} className="fill-orange-400 md:w-4 md:h-4" />
          {currentStreak}
        </div>
        <div className="w-px h-3 md:h-4 bg-white/20"></div>
        <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-indigo-400" title="Focus Points">
          <Zap size={14} className="fill-indigo-400 md:w-4 md:h-4" />
          {focusPoints}
        </div>
      </motion.div>

      {!settings.focus.minimal && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md mt-14 md:mt-12 mb-6 md:mb-8"
        >
          <form onSubmit={handleAddTask} className="relative mb-4 flex gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="What do you want to focus on?"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
              />
              <Pencil size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            </div>
            
            {/* Priority Selector */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    priority === p ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'
                  }`}
                  title={`${p.charAt(0).toUpperCase() + p.slice(1)} Priority`}
                >
                  <div className={`w-3 h-3 rounded-full ${priorityColors[p]}`} />
                </button>
              ))}
            </div>

            <button 
              type="submit"
              disabled={!newTask.trim()}
              className="p-3 bg-indigo-500/20 text-indigo-300 rounded-xl hover:bg-indigo-500/40 transition-colors disabled:opacity-0 disabled:pointer-events-none"
            >
              <Plus size={20} />
            </button>
          </form>

          <div className="max-h-[30vh] md:max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
            <Reorder.Group axis="y" values={tasks} onReorder={reorderTasks} className="space-y-2">
              <AnimatePresence mode="popLayout">
                {tasks.map(task => (
                  <Reorder.Item key={task.id} value={task} layout>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      className={`group flex items-center gap-3 p-3 rounded-xl border-l-4 transition-all cursor-pointer ${
                        task.completed 
                          ? 'bg-green-500/10 border-green-500/20 border-l-green-500/50' 
                          : `bg-white/5 hover:bg-white/10 ${
                              task.priority === 'high' ? 'border-l-red-500 border-y-white/5 border-r-white/5' :
                              task.priority === 'medium' ? 'border-l-orange-500 border-y-white/5 border-r-white/5' :
                              task.priority === 'low' ? 'border-l-blue-500 border-y-white/5 border-r-white/5' :
                              'border-white/5'
                            }`
                      }`}
                      onClick={() => toggleTask(task.id)}
                    >
                      <div className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/60 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <GripVertical size={16} />
                      </div>

                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                          task.completed
                            ? 'bg-green-500 border-green-500 scale-110'
                            : 'border-white/30 group-hover:border-white/60'
                        }`}
                      >
                        <AnimatePresence>
                          {task.completed && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <Check size={12} className="text-white stroke-[3]" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <span className={`flex-1 text-sm transition-all duration-300 relative flex items-center gap-2 ${
                        task.completed ? 'text-white/40' : 'text-white'
                      }`}>
                        {/* Priority Indicator */}
                        {task.priority && (
                          <div 
                            className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} 
                            title={`${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority`}
                          />
                        )}
                        
                        {task.text}
                        {task.reminderTime && task.reminderTime > Date.now() && (
                          <span className="ml-2 text-xs text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded flex items-center inline-flex gap-1">
                            <Clock size={10} />
                            {Math.ceil((task.reminderTime - Date.now()) / 60000)}m
                          </span>
                        )}
                        {task.completed && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="absolute left-0 top-1/2 h-px bg-white/40"
                          />
                        )}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTaskId(editingTaskId === task.id ? null : task.id);
                            setReminderTimeInput('');
                          }}
                          className={`p-1.5 rounded-lg transition-all ${
                            task.reminderTime && task.reminderTime > Date.now() 
                              ? 'text-indigo-400 bg-indigo-500/20' 
                              : 'text-white/60 hover:bg-white/10 hover:text-white'
                          }`}
                          title="Set Reminder"
                        >
                          <Bell size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                          className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                    
                    {editingTaskId === task.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-2 ml-10 p-2 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2"
                      >
                        <span className="text-xs text-white/60">Remind in:</span>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={reminderTimeInput}
                          onChange={(e) => setReminderTimeInput(e.target.value)}
                          placeholder="min"
                          className="w-12 bg-black/20 border border-white/10 rounded px-1 py-0.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (reminderTimeInput) {
                              setReminder(task.id, parseInt(reminderTimeInput));
                            }
                          }}
                          className="px-2 py-0.5 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600 transition-colors"
                        >
                          Set
                        </button>
                      </motion.div>
                    )}
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap justify-center gap-2 md:gap-4 mb-4 md:mb-8"
      >
        {(Object.keys(modes) as Array<keyof typeof modes>).map((m) => (
          <motion.button
            key={m}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleModeChange(m)}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${
              mode === m 
                ? 'bg-[#6366f1] border-[#6366f1] text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                : 'bg-transparent border-white/30 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {modes[m].label}
          </motion.button>
        ))}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3 mb-6"
      >
        {Array.from({ length: totalSessions }).map((_, i) => (
          <motion.div 
            key={i} 
            animate={
              (i === currentSession && mode === 'focus' && isActive) 
                ? { opacity: [1, 0.4, 1] } 
                : { opacity: i <= currentSession ? 1 : 0.2 }
            }
            transition={
              (i === currentSession && mode === 'focus' && isActive)
                ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                : { duration: 0.3 }
            }
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i <= currentSession ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'bg-white' 
            }`} 
          />
        ))}
      </motion.div>

      <div className="relative group w-full flex justify-center">
        <motion.h1 
          layoutId="timer-display"
          className="text-[18vw] md:text-[10rem] lg:text-[12rem] font-bold leading-none tracking-tighter mb-8 md:mb-12 tabular-nums drop-shadow-2xl font-[Inter] text-center"
        >
          {formatTime(timeLeft)}
        </motion.h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4 mb-8"
      >
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTimer}
          className="bg-[#6366f1] text-white px-8 md:px-12 py-3 md:py-4 rounded-full text-lg md:text-xl font-bold hover:bg-[#4f46e5] transition-all shadow-xl"
        >
          {isActive ? 'Pause' : 'Start'}
        </motion.button>
        
        <motion.button 
          whileHover={{ rotate: 180, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleResetClick}
          className="p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-500"
          title="Reset Timer"
        >
          <RotateCcw size={24} />
        </motion.button>
      </motion.div>

      {/* Sound Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-2 md:gap-4 bg-black/20 backdrop-blur-md p-2 md:p-3 rounded-2xl border border-white/10 overflow-x-auto max-w-full"
      >
        {soundOptions.map((sound) => (
          <button
            key={sound.id}
            onClick={() => {
              if (sound.id === 'none') {
                setSelectedSound('none');
              } else {
                if (selectedSound === sound.id) {
                  setIsMuted(!isMuted);
                } else {
                  setSelectedSound(sound.id);
                  setIsMuted(false);
                }
              }
            }}
            className={`p-2 md:p-3 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[50px] md:min-w-[60px] ${
              selectedSound === sound.id 
                ? 'bg-white text-indigo-900 shadow-lg scale-105' 
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            title={sound.label}
          >
            {sound.id !== 'none' && selectedSound === sound.id && isMuted ? (
              <VolumeX size={18} className="md:w-5 md:h-5" />
            ) : (
              <sound.icon size={18} className="md:w-5 md:h-5" />
            )}
            <span className="text-[9px] md:text-[10px] font-medium uppercase tracking-wider">{sound.label}</span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl shadow-2xl text-center w-[95%] max-w-sm mx-auto"
            >
              <div className="flex justify-center mb-4 text-yellow-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2">Reset Timer?</h3>
              <p className="text-sm text-white/60 mb-6">
                Current progress will be saved to your analysis.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReset}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                >
                  Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TimerMode;
