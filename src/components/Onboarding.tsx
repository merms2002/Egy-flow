import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, Loader2, BookOpen, Clock, Target } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { analyzeStudyProfile } from '../services/ai';

interface OnboardingProps {
  user: any;
  onComplete: () => void;
}

const Onboarding = ({ user, onComplete }: OnboardingProps) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subjects: '',
    hoursPerDay: '',
    upcomingExams: '',
    goals: ''
  });

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        // Analyze with AI
        const analysis = await analyzeStudyProfile(formData);
        
        // Save to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          ...formData,
          ...analysis,
          isOnboarded: true,
          isStudent: true,
          createdAt: new Date()
        }, { merge: true });
        
        onComplete();
      } catch (error) {
        console.error("Onboarding failed:", error);
        setLoading(false);
      }
    }
  };

  const steps = [
    {
      title: "What are you studying?",
      icon: BookOpen,
      field: "subjects",
      placeholder: "e.g., Math, Physics, Computer Science..."
    },
    {
      title: "Daily Study Goal?",
      icon: Clock,
      field: "hoursPerDay",
      placeholder: "e.g., 2 hours, 4 hours..."
    },
    {
      title: "Any upcoming exams?",
      icon: Target,
      field: "upcomingExams",
      placeholder: "e.g., Finals in May, SAT..."
    },
    {
      title: "What's your main goal?",
      icon: Target,
      field: "goals",
      placeholder: "e.g., Get an A, Learn a new skill..."
    }
  ];

  const currentStep = steps[step];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0f0f13] text-white overflow-y-auto"
    >
      <div className="min-h-full flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-md relative">
          <div className="mb-8 flex justify-center">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 w-full mx-1 rounded-full transition-colors duration-300 ${
                  i <= step ? 'bg-indigo-500' : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
                  {React.createElement(currentStep.icon, { size: 24 })}
                </div>
                <h2 className="text-xl md:text-2xl font-bold">{currentStep.title}</h2>
              </div>
              
              <textarea
                value={(formData as any)[currentStep.field]}
                onChange={(e) => setFormData({ ...formData, [currentStep.field]: e.target.value })}
                placeholder={currentStep.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500 min-h-[120px] resize-none mb-6 transition-colors text-base"
                autoFocus
              />

              <button
                onClick={handleNext}
                disabled={!(formData as any)[currentStep.field] || loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analyzing Profile...
                  </>
                ) : (
                  <>
                    {step === steps.length - 1 ? 'Finish Setup' : 'Next'}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Onboarding;
