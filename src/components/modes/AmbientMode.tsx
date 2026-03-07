import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { AppSettings } from '../SettingsModal';
import { Volume2, VolumeX, CloudRain, Trees, Coffee, Music } from 'lucide-react';

interface AmbientModeProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const AmbientMode = ({ settings, updateSettings }: AmbientModeProps) => {
  const [timeLeft, setTimeLeft] = useState(50 * 60);
  const [isActive, setIsActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Sound definitions
  const sounds: Record<string, string> = {
    rain: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3',
    forest: 'https://cdn.pixabay.com/audio/2021/09/06/audio_3325695032.mp3',
    cafe: 'https://cdn.pixabay.com/audio/2022/03/24/audio_0318365090.mp3',
  };

  const soundsList = [
    { id: 'none', icon: VolumeX, label: 'Mute' },
    { id: 'rain', icon: CloudRain, label: 'Rain' },
    { id: 'forest', icon: Trees, label: 'Forest' },
    { id: 'cafe', icon: Coffee, label: 'Cafe' },
  ];

  useEffect(() => {
    // Handle audio playback
    const currentSound = settings.ambient.sound;
    
    if (currentSound && currentSound !== 'none' && sounds[currentSound]) {
      if (!audioRef.current) {
        audioRef.current = new Audio(sounds[currentSound]);
        audioRef.current.loop = true;
      } else if (audioRef.current.src !== sounds[currentSound]) {
        audioRef.current.pause();
        audioRef.current = new Audio(sounds[currentSound]);
        audioRef.current.loop = true;
      }

      if (!isMuted) {
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [settings.ambient.sound, isMuted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Circular progress calculations
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / (50 * 60);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="absolute right-4 md:right-8 lg:right-24 top-1/2 -translate-y-1/2 flex flex-col items-center text-white p-4 md:p-8"
    >
      <div className="relative flex items-center justify-center mb-8">
        {/* Progress Circle */}
        <svg className="absolute w-[320px] h-[320px] rotate-[-90deg] pointer-events-none">
          <circle
            cx="160"
            cy="160"
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
            fill="transparent"
          />
          <motion.circle
            cx="160"
            cy="160"
            r={radius}
            stroke="#ffffff"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "linear" }}
            strokeLinecap="round"
            style={{ opacity: 0.8 }}
          />
        </svg>

        <div className="flex flex-col items-center z-10">
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl font-bold mb-2 opacity-90 tracking-wide drop-shadow-md flex items-center gap-2"
          >
            Focus
            {settings.ambient.sound !== 'none' && (
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}
          </motion.div>
          
          <motion.div 
            layoutId="timer-display"
            className="text-5xl md:text-6xl lg:text-8xl font-bold leading-none tracking-tighter mb-6 tabular-nums drop-shadow-2xl font-[Inter]"
          >
            {formatTime(timeLeft)}
          </motion.div>

          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-8 md:px-10 py-2.5 md:py-3 rounded-full text-sm md:text-base font-bold transition-all shadow-xl w-full max-w-[140px] md:max-w-[160px]"
          >
            {isActive ? 'Pause' : 'Start'}
          </motion.button>
        </div>
      </div>

      {/* Sound Selector */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-4 bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/10"
      >
        {soundsList.map((sound) => (
          <button
            key={sound.id}
            onClick={() => updateSettings({ ambient: { ...settings.ambient, sound: sound.id } })}
            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[60px] ${
              settings.ambient.sound === sound.id 
                ? 'bg-white text-indigo-900 shadow-lg scale-105' 
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            title={sound.label}
          >
            <sound.icon size={20} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{sound.label}</span>
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default AmbientMode;
