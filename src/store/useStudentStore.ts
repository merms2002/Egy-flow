import { create } from 'zustand';

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  completed?: boolean;
}

export interface SubjectPlan {
  topics: string[];
  schedule: string[];
  resources: string[];
  roadmap: RoadmapNode[];
}

export interface Subject {
  id: string;
  name: string;
  instructor: string;
  status: 'On Track' | 'Backlog' | 'New' | 'Completed';
  progress?: number;
  isCritical?: boolean;
}

interface StudentState {
  subjects: Subject[];
  subjectPlans: Record<string, SubjectPlan>;
  setSubjects: (subjects: Subject[]) => void;
  toggleSubjectCompletion: (id: string) => void;
  updateSubjectProgress: (id: string, progress: number) => void;
  setSubjectPlan: (subjectId: string, plan: SubjectPlan) => void;
  toggleRoadmapNode: (subjectId: string, nodeId: string) => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  subjects: [
    { id: '1', name: 'اللغة العربية', instructor: 'م. محمد صلاح', status: 'On Track', progress: 75 },
    { id: '2', name: 'الرياضيات', instructor: 'م. لطفي زهران', status: 'Backlog', isCritical: true, progress: 30 },
    { id: '3', name: 'العلوم المتكاملة', instructor: 'د. الجوهري', status: 'On Track', progress: 60 },
    { id: '4', name: 'التاريخ', instructor: 'م. جمعة السيد', status: 'Backlog', progress: 20 },
    { id: '5', name: 'اللغة الإنجليزية', instructor: 'م. انجلشاوي', status: 'New', progress: 0 },
    { id: '6', name: 'الفلسفة', instructor: 'م. نادر جورج', status: 'New', progress: 0 },
  ],
  subjectPlans: {},
  setSubjects: (subjects) => set({ subjects }),
  toggleSubjectCompletion: (id) => set((state) => ({
    subjects: state.subjects.map(subject => 
      subject.id === id 
        ? { ...subject, status: subject.status === 'Completed' ? 'On Track' : 'Completed', progress: subject.status === 'Completed' ? (subject.progress || 0) : 100 } 
        : subject
    )
  })),
  updateSubjectProgress: (id, progress) => set((state) => ({
    subjects: state.subjects.map(subject => {
      if (subject.id === id) {
        const newStatus = progress === 100 ? 'Completed' : (progress < 40 ? 'Backlog' : 'On Track');
        return { ...subject, progress, status: newStatus };
      }
      return subject;
    })
  })),
  setSubjectPlan: (subjectId, plan) => set((state) => ({
    subjectPlans: { ...state.subjectPlans, [subjectId]: plan }
  })),
  toggleRoadmapNode: (subjectId, nodeId) => set((state) => {
    const plan = state.subjectPlans[subjectId];
    if (!plan) return state;
    
    const updatedRoadmap = plan.roadmap.map(node => 
      node.id === nodeId ? { ...node, completed: !node.completed } : node
    );
    
    // Calculate new progress based on completed nodes
    const completedCount = updatedRoadmap.filter(n => n.completed).length;
    const totalCount = updatedRoadmap.length;
    const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    // Update subject progress as well
    const updatedSubjects = state.subjects.map(subject => {
      if (subject.id === subjectId) {
        const newStatus = newProgress === 100 ? 'Completed' : (newProgress < 40 ? 'Backlog' : 'On Track');
        return { ...subject, progress: newProgress, status: newStatus as any };
      }
      return subject;
    });

    return {
      subjectPlans: {
        ...state.subjectPlans,
        [subjectId]: { ...plan, roadmap: updatedRoadmap }
      },
      subjects: updatedSubjects
    };
  }),
}));
