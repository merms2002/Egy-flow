import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

interface GamificationState {
  focusPoints: number;
  currentStreak: number;
  lastFocusDate: string | null;
  badges: Badge[];
  addPoints: (points: number) => void;
  updateStreak: () => void;
  unlockBadge: (badgeId: string) => void;
}

const INITIAL_BADGES: Badge[] = [
  { id: 'first_session', name: 'First Step', description: 'Completed your first focus session', icon: '🎯', unlockedAt: null },
  { id: '10_sessions', name: 'Focus Novice', description: 'Completed 10 focus sessions', icon: '🥉', unlockedAt: null },
  { id: '50_sessions', name: 'Focus Pro', description: 'Completed 50 focus sessions', icon: '🥈', unlockedAt: null },
  { id: '100_sessions', name: 'Focus Master', description: 'Completed 100 focus sessions', icon: '🥇', unlockedAt: null },
  { id: '3_day_streak', name: 'On Fire', description: 'Achieved a 3-day streak', icon: '🔥', unlockedAt: null },
  { id: '7_day_streak', name: 'Unstoppable', description: 'Achieved a 7-day streak', icon: '🚀', unlockedAt: null },
];

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      focusPoints: 0,
      currentStreak: 0,
      lastFocusDate: null,
      badges: INITIAL_BADGES,
      
      addPoints: (points) => set((state) => ({ focusPoints: state.focusPoints + points })),
      
      updateStreak: () => {
        const today = new Date().toDateString();
        const state = get();
        
        if (state.lastFocusDate === today) {
          return; // Already focused today
        }
        
        let newStreak = 1;
        if (state.lastFocusDate) {
          const lastDate = new Date(state.lastFocusDate);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastDate.toDateString() === yesterday.toDateString()) {
            newStreak = state.currentStreak + 1;
          }
        }
        
        set({ currentStreak: newStreak, lastFocusDate: today });
        
        // Check for streak badges
        if (newStreak === 3) get().unlockBadge('3_day_streak');
        if (newStreak === 7) get().unlockBadge('7_day_streak');
      },
      
      unlockBadge: (badgeId) => set((state) => ({
        badges: state.badges.map(b => 
          b.id === badgeId && !b.unlockedAt 
            ? { ...b, unlockedAt: new Date().toISOString() } 
            : b
        )
      }))
    }),
    {
      name: 'gamification-storage',
    }
  )
);
