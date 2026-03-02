import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const AmbientMode = () => {
  const [timeLeft, setTimeLeft] = useState(50 * 60);
  const [isActive, setIsActive] = useState(false);

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

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="absolute right-4 md:right-8 lg:right-24 top-1/2 -translate-y-1/2 flex flex-col items-center text-white p-4 md:p-8"
    >
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg md:text-xl font-bold mb-2 opacity-90 tracking-wide drop-shadow-md"
      >
        Focus
      </motion.div>
      <motion.div 
        layoutId="timer-display"
        className="text-5xl md:text-6xl lg:text-8xl font-bold leading-none tracking-tighter mb-4 md:mb-6 tabular-nums drop-shadow-2xl font-[Inter]"
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
    </motion.div>
  );
};

export default AmbientMode;
