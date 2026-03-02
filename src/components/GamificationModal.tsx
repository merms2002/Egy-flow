import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Zap, Flame, Lock, X } from 'lucide-react';
import { useGamificationStore } from '../store/useGamificationStore';

const GamificationModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { focusPoints, currentStreak, badges } = useGamificationStore();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-[95%] max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar rounded-[32px] border border-white/10 bg-[#1a1a1a]/90 text-white shadow-2xl backdrop-blur-xl p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-6 md:mb-8">
              <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
                <Award size={24} className="text-white md:w-8 md:h-8" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Achievements</h2>
                <p className="text-sm md:text-base text-white/60">Track your focus milestones</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 md:mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center text-center">
                <Zap size={24} className="text-indigo-400 mb-2 md:w-8 md:h-8" />
                <div className="text-2xl md:text-3xl font-bold">{focusPoints}</div>
                <div className="text-xs md:text-sm text-white/60">Total Focus Points</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center text-center">
                <Flame size={24} className="text-orange-400 mb-2 md:w-8 md:h-8" />
                <div className="text-2xl md:text-3xl font-bold">{currentStreak}</div>
                <div className="text-xs md:text-sm text-white/60">Day Streak</div>
              </div>
            </div>

            <h3 className="text-lg md:text-xl font-bold mb-4">Badges</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
              {badges.map((badge) => (
                <div 
                  key={badge.id} 
                  className={`relative overflow-hidden rounded-2xl border p-3 md:p-4 flex flex-col items-center text-center transition-all ${
                    badge.unlockedAt 
                      ? 'bg-gradient-to-b from-white/10 to-white/5 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                      : 'bg-white/5 border-white/5 opacity-50 grayscale'
                  }`}
                >
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3">{badge.icon}</div>
                  <h4 className="font-bold text-xs md:text-sm mb-1">{badge.name}</h4>
                  <p className="text-[10px] md:text-xs text-white/60">{badge.description}</p>
                  
                  {!badge.unlockedAt && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                      <Lock size={20} className="text-white/40 md:w-6 md:h-6" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GamificationModal;
