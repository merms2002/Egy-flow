import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, BookOpen, Calendar, Settings, LogOut, 
  TrendingUp, Clock, Target, Zap, ChevronRight, Bell, Search, RefreshCw 
} from 'lucide-react';
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { analyzeStudyProfile } from '../services/ai';

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

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Profile listener
    const profileUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
      setLoading(false);
    });

    // Sessions listener
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const sessionsUnsub = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate()
      }));
      setRecentSessions(sessions);
    });

    return () => {
      profileUnsub();
      sessionsUnsub();
    };
  }, [user]);

  const handleAnalyze = async () => {
    if (!user) return;
    setIsAnalyzing(true);
    try {
      const analysisData = {
        subjects: profile?.subjects || "General Studies",
        recentSessions: recentSessions.map(s => ({ 
          subject: s.subject, 
          duration: s.duration, 
          score: s.score 
        })),
        goals: profile?.goals || []
      };
      
      const insight = await analyzeStudyProfile(analysisData);
      
      await updateDoc(doc(db, 'users', user.uid), {
        recommendedFocus: insight.recommendedFocus,
        dailyGoal: insight.dailyGoal,
        motivationalQuote: insight.motivationalQuote,
        tags: insight.tags,
        currentSubject: insight.currentSubject,
        upcomingExams: insight.upcomingExams,
        lastAnalysis: new Date().toISOString()
      });
      
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
    { icon: LayoutDashboard, label: 'Overview', active: true },
    { icon: BookOpen, label: 'Subjects' },
    { icon: Calendar, label: 'Schedule' },
    { icon: TrendingUp, label: 'Analytics' },
    { icon: Target, label: 'Goals' },
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
              <Zap className="text-white fill-white" size={16} />
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
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                item.active 
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
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </div>

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
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
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
                  <p className="text-white/60 mb-8 max-w-xl text-base md:text-lg">
                    Based on your goal to master <span className="text-white font-medium">{profile.subjects || "your studies"}</span>, we recommend focusing on: <span className="text-indigo-300">{profile.recommendedFocus}</span>
                  </p>
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
      </div>
    </motion.div>
  );
};

export default StudentDashboard;
