import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Session {
  id: string;
  subject: string;
  taskName: string;
  durationMin: number;
  date: string; // ISO string
}

interface EgyFlowState {
  dailyGoalMinutes: number;
  sessions: Session[];
  addSession: (subject: string, taskName: string, durationMin: number) => void;
  getTotalTodayMinutes: () => number;
  resetSessions: () => void;
  setDailyGoalMinutes: (minutes: number) => void;
}

export const useEgyFlowStore = create<EgyFlowState>()(
  persist(
    (set, get) => ({
      dailyGoalMinutes: 300,
      sessions: [],
      addSession: (subject, taskName, durationMin) => {
        const newSession: Session = {
          id: crypto.randomUUID(),
          subject,
          taskName,
          durationMin,
          date: new Date().toISOString(),
        };
        set((state) => ({ sessions: [newSession, ...state.sessions] }));
      },
      getTotalTodayMinutes: () => {
        const today = new Date().toDateString();
        return get().sessions
          .filter((session) => new Date(session.date).toDateString() === today)
          .reduce((total, session) => total + session.durationMin, 0);
      },
      resetSessions: () => set({ sessions: [] }),
      setDailyGoalMinutes: (minutes) => set({ dailyGoalMinutes: minutes }),
    }),
    {
      name: 'egyflow-storage',
    }
  )
);
