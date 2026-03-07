import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  reminderTime?: number; // Timestamp for reminder
  priority: 'low' | 'medium' | 'high';
}

interface TaskState {
  tasks: Task[];
  addTask: (text: string, priority?: 'low' | 'medium' | 'high', reminderTime?: number) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  reorderTasks: (tasks: Task[]) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (text, priority = 'medium', reminderTime) => set((state) => ({
        tasks: [{ 
          id: crypto.randomUUID(), 
          text, 
          completed: false, 
          createdAt: Date.now(), 
          reminderTime,
          priority 
        }, ...state.tasks]
      })),
      toggleTask: (id) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      reorderTasks: (tasks) => set({ tasks }),
    }),
    {
      name: 'task-storage',
    }
  )
);
