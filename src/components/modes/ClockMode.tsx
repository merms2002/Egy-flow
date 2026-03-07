import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AppSettings } from '../SettingsModal';

interface ClockModeProps {
  settings: AppSettings;
}

const ClockMode = ({ settings }: ClockModeProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  let greeting = "Wednesday's over, Indense. Enjoy your sleep!";
  if (hours > 5 && hours < 12) greeting = "Good morning, Indense. Have a great day!";
  else if (hours >= 12 && hours < 18) greeting = "Good afternoon, Indense. Keep it up!";

  const timeString = time.toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit', 
    second: settings.showSeconds ? '2-digit' : undefined,
    hour12: settings.clockFormat === '12h' 
  });

  const dateString = time.toLocaleDateString([], { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const getThemeStyles = () => {
    switch (settings.clockTheme) {
      case 'minimal':
        return {
          container: "font-light tracking-wide",
          clock: "text-6xl md:text-8xl lg:text-[10rem] font-extralight",
          greeting: "text-base md:text-lg font-normal opacity-80 uppercase tracking-widest"
        };
      case 'retro':
        return {
          container: "font-mono",
          clock: "text-5xl md:text-7xl lg:text-[8rem] font-bold tracking-tighter",
          greeting: "text-sm md:text-base opacity-90"
        };
      case 'neon':
        return {
          container: "",
          clock: "text-6xl md:text-8xl lg:text-[11rem] font-bold tracking-tighter",
          greeting: "text-lg md:text-xl font-medium"
        };
      default: // modern
        return {
          container: "font-[Inter]",
          clock: "text-6xl md:text-8xl lg:text-[12rem] font-bold tracking-tighter",
          greeting: "text-lg md:text-2xl lg:text-3xl font-bold tracking-wide"
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex flex-col items-center text-white w-full max-w-5xl p-4 md:p-8 ${styles.container}`}
      style={{ color: settings.clockColor }}
    >
      {settings.showGreeting && (
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-4 text-center drop-shadow-md ${styles.greeting}`}
          style={settings.clockTheme === 'neon' ? { textShadow: `0 0 10px ${settings.clockColor}` } : {}}
        >
          {greeting}
        </motion.h2>
      )}
      
      <motion.h1 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className={`leading-none tabular-nums drop-shadow-2xl ${styles.clock}`}
        style={settings.clockTheme === 'neon' ? { textShadow: `0 0 20px ${settings.clockColor}, 0 0 40px ${settings.clockColor}` } : {}}
      >
        {timeString}
      </motion.h1>

      {settings.showDate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-lg md:text-2xl opacity-80 font-medium"
          style={settings.clockTheme === 'neon' ? { textShadow: `0 0 10px ${settings.clockColor}` } : {}}
        >
          {dateString}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ClockMode;
