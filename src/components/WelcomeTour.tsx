import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, LayoutDashboard, Clock, Leaf, BookOpen, 
  Check, ChevronRight, X 
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface WelcomeTourProps {
  user: any;
  onClose: () => void;
}

const WelcomeTour = ({ user, onClose }: WelcomeTourProps) => {
  const [step, setStep] = useState(0);

  const handleComplete = async () => {
    try {
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          hasSeenTour: true
        });
      }
    } catch (error) {
      console.error("Failed to update tour status:", error);
    }
    onClose();
  };

  const tourSteps = [
    {
      title: "Welcome to EgyFlow!",
      description: "Your ultimate study companion is ready. Let's take a quick tour to get you started.",
      icon: Zap,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10"
    },
    {
      title: "Your Command Center",
      description: "The Dashboard gives you a bird's-eye view of your tasks, recent sessions, and AI insights. Everything you need, in one place.",
      icon: LayoutDashboard,
      color: "text-indigo-400",
      bg: "bg-indigo-400/10"
    },
    {
      title: "Focus Mode",
      description: "Need to concentrate? Switch to Focus Mode for a Pomodoro timer, task tracking, and distraction-free studying.",
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    {
      title: "Ambient Mode",
      description: "Set the mood. Customize your background, play ambient sounds, and create the perfect environment for deep work.",
      icon: Leaf,
      color: "text-green-400",
      bg: "bg-green-400/10"
    },
    {
      title: "AI Study Plans",
      description: "Go to the 'Subjects' tab to generate personalized AI study plans, schedules, and resource recommendations for each course.",
      icon: BookOpen,
      color: "text-purple-400",
      bg: "bg-purple-400/10"
    }
  ];

  const currentStep = tourSteps[step];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div 
        layout
        className="bg-[#1a1a1e] border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full relative overflow-hidden shadow-2xl"
      >
        {/* Background Decoration */}
        <div className={`absolute top-0 right-0 w-64 h-64 ${currentStep.bg} blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none transition-colors duration-500`} />

        <button 
          onClick={handleComplete}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors z-20"
        >
          <X size={20} />
        </button>

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              <div className={`p-4 rounded-2xl ${currentStep.bg} ${currentStep.color} mb-6 shadow-lg`}>
                {React.createElement(currentStep.icon, { size: 48 })}
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{currentStep.title}</h2>
              <p className="text-white/60 text-base md:text-lg leading-relaxed mb-8">
                {currentStep.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {tourSteps.map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-indigo-500' : 'w-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 rounded-xl font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (step < tourSteps.length - 1) {
                  setStep(step + 1);
                } else {
                  handleComplete();
                }
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {step === tourSteps.length - 1 ? (
                <>Get Started <Check size={18} /></>
              ) : (
                <>Next <ChevronRight size={18} /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeTour;
