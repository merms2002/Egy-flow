import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, BookOpen, Calendar, Settings, LogOut, 
  TrendingUp, Clock, Target, Zap, ChevronRight, Bell, Search, RefreshCw,
  Check, Plus, Trash2, ListTodo, HelpCircle, ChevronDown, ChevronUp, Loader2, FileText, CheckCircle, X, MessageSquare
} from 'lucide-react';
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { analyzeStudyProfile, generateSubjectPlan } from '../services/ai';
import { useStudentStore, SubjectPlan } from '../store/useStudentStore';
import { useTaskStore } from '../store/useTaskStore';
import SubjectsView from './dashboard/SubjectsView';
import ScheduleView from './dashboard/ScheduleView';
import WelcomeTour from './WelcomeTour';
import AnalyticsView from './dashboard/AnalyticsView';
import SubjectRoadmap from './dashboard/SubjectRoadmap';
import AIChatView from './dashboard/AIChatView';
import GoalsView from './dashboard/GoalsView';

interface StudentDashboardProps {
  user: any;
  onSwitchMode: (mode: 'focus' | 'home' | 'ambient') => void;
}

const StudentDashboard = ({ user, onSwitchMode }: StudentDashboardProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentView, setCurrentView] = useState('AI Chat');
  const [showTour, setShowTour] = useState(false);
  
  // Subject Plans State
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [activeSubjectForPlan, setActiveSubjectForPlan] = useState<any>(null);
  const [planContext, setPlanContext] = useState({ books: '', tests: '', syllabus: '' });
  
  const { tasks, addTask, toggleTask, deleteTask } = useTaskStore();
  const [newTask, setNewTask] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    addTask(newTask);
    setNewTask('');
  };

  const handleGeneratePlan = async (subjectId: string, subjectName: string, status: string) => {
    setActiveSubjectForPlan({ id: subjectId, name: subjectName, status });
    setPlanContext({ books: '', tests: '', syllabus: '' });
    setPlanModalOpen(true);
  };

  const executeGeneratePlan = async () => {
    if (!activeSubjectForPlan) return;
    setPlanModalOpen(false);
    setLoadingPlanId(activeSubjectForPlan.id);
    try {
      const contextStr = `
        Priority Books/Resources: ${planContext.books || 'None specified'}
        Upcoming Tests: ${planContext.tests || 'None specified'}
        Syllabus/Topics to cover: ${planContext.syllabus || 'Full subject'}
      `;
      const plan = await generateSubjectPlan(activeSubjectForPlan.name, activeSubjectForPlan.status, contextStr);
      setSubjectPlan(activeSubjectForPlan.id, plan);
      setExpandedSubjectId(activeSubjectForPlan.id);
    } catch (error) {
      console.error("Failed to generate plan", error);
    } finally {
      setLoadingPlanId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedSubjectId(expandedSubjectId === id ? null : id);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Profile listener
    const profileUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        if (data.isOnboarded && !data.hasSeenTour) {
          setShowTour(true);
        }
      }
      setLoading(false);
    });

    // Sessions listener
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid)
    );

    const sessionsUnsub = onSnapshot(q, (snapshot) => {
      let sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate()
      }));
      
      // Sort client-side to avoid index requirement
      sessions.sort((a, b) => {
        const timeA = a.date ? a.date.getTime() : 0;
        const timeB = b.date ? b.date.getTime() : 0;
        return timeB - timeA;
      });
      
      // Limit client-side
      sessions = sessions.slice(0, 3);
      
      setRecentSessions(sessions);
    });

    return () => {
      profileUnsub();
      sessionsUnsub();
    };
  }, [user]);

  const { subjects, toggleSubjectCompletion, updateSubjectProgress, subjectPlans, setSubjectPlan } = useStudentStore();
  const backlogSubjects = subjects.filter(s => s.status === 'Backlog');

  // Auto-generate plans for subjects that don't have them on first load
  useEffect(() => {
    const generateMissingPlans = async () => {
      for (const subject of subjects) {
        if (!subjectPlans[subject.id]) {
          try {
            const plan = await generateSubjectPlan(subject.name, subject.status, "Initial automatic generation");
            setSubjectPlan(subject.id, plan);
          } catch (error) {
            console.error(`Failed to auto-generate plan for ${subject.name}`, error);
          }
        }
      }
    };

    if (subjects.length > 0) {
      generateMissingPlans();
    }
  }, [subjects, subjectPlans, setSubjectPlan]);

  const handleAnalyze = async () => {
    if (!user) return;
    setIsAnalyzing(true);
    try {
      const analysisData = {
        subjects: subjects.map(s => s.name).join(", ") || "General Studies",
        recentSessions: recentSessions.map(s => ({ 
          subject: s.subject, 
          duration: s.duration, 
          score: s.score 
        })),
        goals: profile?.goals || [],
        tasks: tasks.filter(t => !t.completed).map(t => t.text)
      };
      
      const insight = await analyzeStudyProfile(analysisData);
      
      await setDoc(doc(db, 'users', user.uid), {
        recommendedFocus: insight.recommendedFocus,
        dailyGoal: insight.dailyGoal,
        motivationalQuote: insight.motivationalQuote,
        tags: insight.tags,
        currentSubject: insight.currentSubject,
        upcomingExams: insight.upcomingExams,
        lastAnalysis: new Date().toISOString()
      }, { merge: true });
      
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate stats
  const today = new Date();
  const todaysSessions = recentSessions.filter(s => {
    if (!s.date) return false;
    const d = s.date;
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  });
  
  const studyTimeSeconds = todaysSessions.reduce((acc, s) => acc + (s.seconds || 0), 0);
  const studyHours = Math.floor(studyTimeSeconds / 3600);
  const studyMinutes = Math.floor((studyTimeSeconds % 3600) / 60);
  const studyTimeDisplay = studyHours > 0 ? `${studyHours}h ${studyMinutes}m` : `${studyMinutes}m`;

  const currentSubject = profile?.currentSubject || (recentSessions[0]?.subject) || "General";
  const upcomingExams = profile?.upcomingExams || "No upcoming exams";

  const sidebarItems = [
    { id: 'AI Chat', icon: MessageSquare, label: 'AI Assistant' },
    { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'Subjects', icon: BookOpen, label: 'Subjects' },
    { id: 'Schedule', icon: Calendar, label: 'Schedule' },
    { id: 'Analytics', icon: TrendingUp, label: 'Analytics' },
    { id: 'Goals', icon: Target, label: 'Goals' },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f13] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "tween", ease: "easeInOut", duration: 0.5 }}
      className="flex h-[100dvh] w-full bg-[#0f0f13] text-white overflow-hidden font-sans relative"
    >
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-white/5 bg-[#141418] flex flex-col p-6 transition-transform duration-300 transform shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <LayoutDashboard className="text-white" size={16} />
            </div>
            <span className="font-bold text-xl tracking-tight">EgyFlow</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 text-white/60 hover:text-white"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
        </div>

        <div className="space-y-1 flex-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                currentView === item.id 
                  ? 'bg-indigo-600/10 text-indigo-400' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
          <button 
            onClick={() => onSwitchMode('ambient')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LayoutDashboard size={18} />
            Ambient Mode
          </button>
          <button 
            onClick={() => onSwitchMode('focus')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Clock size={18} />
            Focus Mode
          </button>
          <button 
            onClick={() => setShowTour(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <HelpCircle size={18} />
            Help & Tour
          </button>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </div>

      {/* Plan Context Modal */}
      <AnimatePresence>
        {planModalOpen && activeSubjectForPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap size={20} className="text-indigo-400" />
                  Customize Study Plan
                </h3>
                <button 
                  onClick={() => setPlanModalOpen(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-white/60 mb-4">
                  Tell the AI more about your current situation for <strong className="text-white">{activeSubjectForPlan.name}</strong> to get a better plan.
                </p>
                
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Priority Books / Resources</label>
                  <input 
                    type="text" 
                    value={planContext.books}
                    onChange={(e) => setPlanContext({...planContext, books: e.target.value})}
                    placeholder="e.g. Physics Vol 1, Khan Academy"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Upcoming Tests / Deadlines</label>
                  <input 
                    type="text" 
                    value={planContext.tests}
                    onChange={(e) => setPlanContext({...planContext, tests: e.target.value})}
                    placeholder="e.g. Midterm next Friday"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Syllabus / Topics to Cover</label>
                  <textarea 
                    value={planContext.syllabus}
                    onChange={(e) => setPlanContext({...planContext, syllabus: e.target.value})}
                    placeholder="e.g. Chapters 1-4, Kinematics"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all resize-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                <button 
                  onClick={() => setPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeGeneratePlan}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  <Zap size={16} />
                  Generate Plan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#0f0f13] shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-white/60 hover:text-white"
            >
              <LayoutDashboard size={24} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold truncate max-w-[200px] md:max-w-none">Welcome, {user?.displayName?.split(' ')[0] || 'Student'}</h1>
              <p className="text-xs md:text-sm text-white/40 hidden md:block">Here's what's happening with your studies today.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-[#1a1a1e] border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 w-64 transition-all"
              />
            </div>
            <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-[#0f0f13]"></span>
            </button>
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-[#0f0f13] shadow-lg"></div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {currentView === 'AI Chat' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full p-4 md:p-8"
            >
              <AIChatView />
            </motion.div>
          )}

          {currentView === 'Overview' && (
            <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          
          {/* Backlog Alerts (High Priority) */}
          {backlogSubjects.length > 0 && (
            <div className="w-full">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
                <Bell className="animate-pulse" /> 🚨 إنذار المتراكم (Backlog Alerts)
              </h2>
              <div className="grid gap-4">
                {backlogSubjects.map(subject => (
                  <div key={subject.id} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-white">{subject.name}</h3>
                        <p className="text-red-300/60 text-sm">{subject.instructor} • <span className="font-bold text-red-400">Critical Status</span></p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onSwitchMode('focus')}
                      className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                    >
                      <Zap size={18} className="fill-white" />
                      Start Focus Session
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white/80 flex items-center gap-2">
                <ListTodo className="text-indigo-400" size={24} />
                Your Tasks
              </h2>
              <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                {tasks.filter(t => !t.completed).length} pending
              </span>
            </div>

            <div className="bg-[#141418] border border-white/5 rounded-2xl p-6">
              <form onSubmit={handleAddTask} className="relative mb-6">
                <input 
                  type="text" 
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a new task..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                />
                <Plus size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <button 
                  type="submit"
                  disabled={!newTask.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/40 transition-colors disabled:opacity-0 disabled:pointer-events-none"
                >
                  <Plus size={16} />
                </button>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                <AnimatePresence mode="popLayout">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-white/30 text-sm">
                      No tasks yet. Add one above!
                    </div>
                  ) : (
                    tasks.map(task => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        layout
                        className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          task.completed 
                            ? 'bg-green-500/10 border-green-500/20' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                        onClick={() => toggleTask(task.id)}
                      >
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                            task.completed
                              ? 'bg-green-500 border-green-500 scale-110'
                              : 'border-white/30 group-hover:border-white/60'
                          }`}
                        >
                          <AnimatePresence>
                            {task.completed && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Check size={12} className="text-white stroke-[3]" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        <span className={`flex-1 text-sm transition-all duration-300 relative ${
                          task.completed ? 'text-white/40' : 'text-white'
                        }`}>
                          {task.text}
                          {task.reminderTime && task.reminderTime > Date.now() && (
                            <span className="ml-2 text-xs text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded flex items-center inline-flex gap-1">
                              <Clock size={10} />
                              {Math.ceil((task.reminderTime - Date.now()) / 60000)}m
                            </span>
                          )}
                          {task.completed && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="absolute left-0 top-1/2 h-px bg-white/40"
                            />
                          )}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Subjects Overview (Real Data) */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-white/80">Your Subjects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {subjects.map(subject => (
                  <motion.div 
                    key={subject.id} 
                    layout
                    className={`bg-[#141418] border ${expandedSubjectId === subject.id ? 'border-indigo-500/30 ring-1 ring-indigo-500/20' : 'border-white/5'} rounded-2xl hover:border-white/10 transition-colors group relative overflow-hidden flex flex-col`}
                  >
                    <div className="p-6 flex-1">
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${
                        subject.status === 'Completed' ? 'from-purple-500/10 to-transparent' :
                        subject.status === 'On Track' ? 'from-green-500/10 to-transparent' :
                        subject.status === 'Backlog' ? 'from-red-500/10 to-transparent' :
                        'from-blue-500/10 to-transparent'
                      } blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none`}></div>
                      
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className={`p-3 rounded-xl ${
                          subject.status === 'Completed' ? 'bg-purple-500/10 text-purple-400' :
                          subject.status === 'On Track' ? 'bg-green-500/10 text-green-400' :
                          subject.status === 'Backlog' ? 'bg-red-500/10 text-red-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          <BookOpen size={20} />
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          subject.status === 'Completed' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          subject.status === 'On Track' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          subject.status === 'Backlog' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {subject.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-1 relative z-10">
                        <h3 className={`text-2xl font-bold truncate pr-2 ${subject.status === 'Completed' ? 'text-white/60 line-through' : ''}`}>
                          {subject.name}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => toggleSubjectCompletion(subject.id)}
                            className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                              subject.status === 'Completed' 
                                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                            }`}
                            title={subject.status === 'Completed' ? "Mark as Incomplete" : "Mark as Completed"}
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button 
                            onClick={() => handleGeneratePlan(subject.id, subject.name, subject.status)}
                            disabled={loadingPlanId === subject.id}
                            className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg transition-colors flex items-center justify-center"
                            title="Generate AI Study Plan"
                          >
                            {loadingPlanId === subject.id ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                          </button>
                          <button 
                            onClick={() => toggleExpand(subject.id)}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                          >
                            {expandedSubjectId === subject.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-white/40 mb-4">{subject.instructor}</p>
                      
                      <div className="w-full bg-white/5 rounded-full h-1.5 mb-2 relative group-hover:h-3 transition-all">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            subject.status === 'Completed' ? 'bg-purple-500' :
                            subject.status === 'On Track' ? 'bg-green-500' :
                            subject.status === 'Backlog' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${subject.progress || 0}%` }}
                        ></div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={subject.progress || 0}
                          onChange={(e) => updateSubjectProgress(subject.id, parseInt(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          title="Adjust progress"
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-white/30">
                        <span>Progress</span>
                        <span>{subject.progress || 0}%</span>
                      </div>
                    </div>

                    {/* Expanded AI Plan Content */}
                    <AnimatePresence>
                      {expandedSubjectId === subject.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/5 bg-black/20"
                        >
                          <div className="p-6 space-y-6">
                            {subjectPlans[subject.id] ? (
                              <>
                                {/* Key Topics */}
                                <div className="space-y-3">
                                  <h4 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle size={14} /> Key Topics
                                  </h4>
                                  <ul className="space-y-2">
                                    {subjectPlans[subject.id].topics.map((topic: string, i: number) => (
                                      <li key={i} className="bg-white/5 rounded-lg px-3 py-2 text-sm text-white/80 border border-white/5">
                                        {topic}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Roadmap */}
                                <SubjectRoadmap subjectId={subject.id} />

                                {/* Schedule */}
                                <div className="space-y-3">
                                  <h4 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar size={14} /> Weekly Schedule
                                  </h4>
                                  <ul className="space-y-2">
                                    {subjectPlans[subject.id].schedule.map((day: string, i: number) => (
                                      <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                                        {day}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Resources */}
                                <div className="space-y-3">
                                  <h4 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={14} /> Resources
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {subjectPlans[subject.id].resources.map((res: string, i: number) => (
                                      <span key={i} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs border border-blue-500/20">
                                        {res}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-center py-8">
                                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Zap size={24} className="text-indigo-400" />
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">No Learning Path Yet</h4>
                                <p className="text-sm text-white/50 mb-6 max-w-xs mx-auto">
                                  Generate a personalized AI study plan and interactive roadmap to master {subject.name}.
                                </p>
                                <button 
                                  onClick={() => handleGeneratePlan(subject.id, subject.name, subject.status)}
                                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors inline-flex items-center gap-2"
                                >
                                  <Zap size={16} />
                                  Generate Path
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* AI Insight Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-indigo-300 text-sm font-bold uppercase tracking-wider w-full">
                <Zap size={14} className="fill-indigo-300" /> AI Study Insight
                <button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  className={`ml-auto p-1.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 transition-colors ${isAnalyzing ? 'animate-spin' : ''}`}
                  title="Refresh Insight"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              
              {profile?.recommendedFocus ? (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 max-w-2xl">{profile.motivationalQuote || "Keep pushing forward!"}</h2>
                  <p className="text-white/60 mb-4 max-w-xl text-base md:text-lg">
                    Based on your goal to master <span className="text-white font-medium">{profile.subjects || "your studies"}</span>, we recommend focusing on: <span className="text-indigo-300">{profile.recommendedFocus}</span>
                  </p>
                  
                  {profile.tags && profile.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {profile.tags.map((tag: string, i: number) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-medium border border-indigo-500/20">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => onSwitchMode('focus')} className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2 w-full sm:w-auto">
                      Start Focus Session <ChevronRight size={16} />
                    </button>
                    <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-center w-full sm:w-auto">
                      Daily Goal: {profile.dailyGoal || "2 hours"}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-start justify-center py-4">
                  <h2 className="text-2xl font-bold mb-2">Ready to optimize your study plan?</h2>
                  <p className="text-white/60 mb-6">Get personalized AI recommendations based on your study habits.</p>
                  <button 
                    onClick={handleAnalyze} 
                    disabled={isAnalyzing}
                    className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>Analyzing <RefreshCw size={16} className="animate-spin" /></>
                    ) : (
                      <>Generate Insights <Zap size={16} className="fill-black" /></>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#141418] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <Clock size={20} />
                </div>
                <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Today</span>
              </div>
              <h3 className="text-3xl font-bold mb-1">{studyTimeDisplay}</h3>
              <p className="text-sm text-white/40">Study time today</p>
            </div>

            <div className="bg-[#141418] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                  <BookOpen size={20} />
                </div>
                <span className="text-xs font-medium text-white/40">Active</span>
              </div>
              <h3 className="text-3xl font-bold mb-1">{currentSubject}</h3>
              <p className="text-sm text-white/40">Current subject focus</p>
            </div>

            <div className="bg-[#141418] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20 transition-colors">
                  <Target size={20} />
                </div>
                <span className="text-xs font-medium text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">Due soon</span>
              </div>
              <h3 className="text-3xl font-bold mb-1">{upcomingExams === "No upcoming exams" ? "None" : "Exams"}</h3>
              <p className="text-sm text-white/40">{upcomingExams}</p>
            </div>
          </div>

          {/* Recent Activity & Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#141418] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Recent Sessions</h3>
                <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {recentSessions.length > 0 ? (
                  recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                          {session.subject ? session.subject.charAt(0) : 'S'}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{session.subject || 'Study Session'}</h4>
                          <p className="text-xs text-white/40">
                            {session.date ? session.date.toLocaleDateString() : 'Just now'} • {session.duration}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-white/60">
                        {session.score || 'Completed'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/40 text-sm">
                    No recent sessions found. Start studying!
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#141418] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Study Schedule</h3>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <Settings size={16} className="text-white/40" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4 relative pb-8 border-l border-white/10 pl-6 last:pb-0 last:border-0">
                  <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-[#141418]"></div>
                  <div className="text-xs font-medium text-white/40 w-12 pt-0.5">09:00</div>
                  <div className="flex-1">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                      <h4 className="font-medium text-sm mb-1">Morning Review</h4>
                      <p className="text-xs text-white/40">Review yesterday's notes</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 relative pb-8 border-l border-white/10 pl-6 last:pb-0 last:border-0">
                  <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-white/20 ring-4 ring-[#141418]"></div>
                  <div className="text-xs font-medium text-white/40 w-12 pt-0.5">14:00</div>
                  <div className="flex-1">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                      <h4 className="font-medium text-sm mb-1">Deep Work Session</h4>
                      <p className="text-xs text-white/40">Physics Chapter 4</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
          )}

          {currentView === 'Subjects' && <SubjectsView />}

          {currentView === 'Schedule' && <ScheduleView />}

          {currentView === 'Analytics' && <AnalyticsView user={user} />}

          {currentView === 'Goals' && <GoalsView />}
        </div>
      </div>
      
      <AnimatePresence>
        {showTour && (
          <WelcomeTour 
            user={user} 
            onClose={() => setShowTour(false)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentDashboard;
