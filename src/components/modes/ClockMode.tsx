import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const ClockMode = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  let greeting = "Wednesday's over, Indense. Enjoy your sleep!";
  if (hours > 5 && hours < 12) greeting = "Good morning, Indense. Have a great day!";
  else if (hours >= 12 && hours < 18) greeting = "Good afternoon, Indense. Keep it up!";

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center text-white w-full max-w-4xl p-4 md:p-8"
    >
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-lg md:text-2xl lg:text-3xl font-bold mb-4 opacity-100 tracking-wide text-center drop-shadow-md"
      >
        {greeting}
      </motion.h2>
      <motion.h1 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="text-6xl md:text-8xl lg:text-[12rem] font-bold leading-none tracking-tighter tabular-nums drop-shadow-2xl font-[Inter]"
      >
        {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })}
      </motion.h1>
    </motion.div>
  );
};

export default ClockMode;
