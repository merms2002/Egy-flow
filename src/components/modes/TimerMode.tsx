import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Flame, Zap, RotateCcw, AlertTriangle } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AppSettings } from '../SettingsModal';
import { useGamificationStore } from '../../store/useGamificationStore';

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
  const totalSessions = 5;
  
  const { addPoints, updateStreak, focusPoints, currentStreak } = useGamificationStore();

  const modes = {
    focus: { label: 'Focus', time: settings.focusWorkDuration * 60 },
    shortBreak: { label: 'Short Break', time: settings.focusShortBreak * 60 },
    longBreak: { label: 'Long Break', time: settings.focusLongBreak * 60 },
  };

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
        setCurrentSession(prev => prev + 1);
        setMode('focus');
        setTimeLeft(modes.focus.time);
        setIsActive(true);
      } else if (mode === 'longBreak') {
        // Long break finished - Reset cycle
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

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center text-white w-full max-w-4xl relative p-4 md:p-8"
    >
      {/* Gamification Stats */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 right-0 flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
        onClick={() => setIsGamificationOpen(true)}
      >
        <div className="flex items-center gap-1.5 text-sm font-bold text-orange-400" title="Daily Streak">
          <Flame size={16} className="fill-orange-400" />
          {currentStreak}
        </div>
        <div className="w-px h-4 bg-white/20"></div>
        <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-400" title="Focus Points">
          <Zap size={16} className="fill-indigo-400" />
          {focusPoints}
        </div>
      </motion.div>

      {!settings.focusMinimal && (
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-8 opacity-90 tracking-wide text-center flex items-center gap-2 drop-shadow-md mt-12"
        >
          What do you want to focus on? <Pencil size={20} className="opacity-50" />
        </motion.h2>
      )}

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap justify-center gap-4 mb-8"
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

      <div className="relative group">
        <motion.h1 
          layoutId="timer-display"
          className="text-6xl md:text-8xl lg:text-[12rem] font-bold leading-none tracking-tighter mb-12 tabular-nums drop-shadow-2xl font-[Inter]"
        >
          {formatTime(timeLeft)}
        </motion.h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4"
      >
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTimer}
          className="bg-[#6366f1] text-white px-12 py-3 rounded-full text-lg font-bold hover:bg-[#4f46e5] transition-all shadow-xl"
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
