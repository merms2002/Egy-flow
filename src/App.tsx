import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, Palette, Maximize, Settings, Clock, Timer, Play, Pause, RotateCcw, 
  X, Zap, Gift, BarChart2, MessageSquare, MoreHorizontal, User, HelpCircle,
  Image as ImageIcon, Video, Upload, Pencil, Leaf, Home, Lightbulb, Minimize,
  Eye, EyeOff, ArrowRight, Calendar, BookOpen, GraduationCap, Flame, TrendingUp,
  LogOut, AlertTriangle, FileText, Award, Lock, LayoutDashboard
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { auth, googleProvider, db } from './services/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import StudentDashboard from './components/StudentDashboard';
import Onboarding from './components/Onboarding';
import Notepad from './components/Notepad';
import SettingsModal, { AppSettings, defaultSettings } from './components/SettingsModal';
import MusicPlayer from './components/MusicPlayer';
import { useGamificationStore } from './store/useGamificationStore';

import SpotifyManager from './components/SpotifyManager';

// --- Reusable Components ---

const MotionButton = ({ children, onClick, className, title, active = false }: any) => (
  <motion.button
    whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.25)" }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`${className} ${active ? 'bg-white text-black shadow-lg scale-105' : ''} transition-colors duration-200`}
    title={title}
  >
    {children}
  </motion.button>
);

const TrackerMode = ({ user, onSwitchMode }: { user: FirebaseUser | null, onSwitchMode: (mode: 'student-dashboard') => void }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate().toLocaleString() || 'Just now'
      }));
      setSessions(sessionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogSession = async () => {
    if (!user) return;
    
    const subjects = ['Mathematics', 'Physics', 'History', 'Chemistry', 'Biology'];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    const durations = ['30m', '45m', '1h', '1h 30m', '2h'];
    const randomDuration = durations[Math.floor(Math.random() * durations.length)];
    const scores = ['High', 'Medium', 'Low'];
    const randomScore = scores[Math.floor(Math.random() * scores.length)];

    try {
      await addDoc(collection(db, 'sessions'), {
        userId: user.uid,
        subject: randomSubject,
        duration: randomDuration,
        score: randomScore,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error adding session: ", error);
    }
  };

  const studyData = [
    { name: 'Mon', hours: 2 },
    { name: 'Tue', hours: 4.5 },
    { name: 'Wed', hours: 3 },
    { name: 'Thu', hours: 5 },
    { name: 'Fri', hours: 1.5 },
    { name: 'Sat', hours: 0 },
    { name: 'Sun', hours: 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0a0a]/60 text-white shadow-2xl backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex flex-col gap-6 border-b border-white/10 p-8 md:flex-row md:items-center md:justify-between bg-white/5">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1e1e24] border border-white/5 shadow-inner">
            <BarChart2 size={32} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-base text-white/40 font-medium">Track your progress and stay motivated</p>
          </div>
        </div>
        <button 
          onClick={() => onSwitchMode('student-dashboard')}
          className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95"
        >
          <GraduationCap size={18} />
          Student Mode
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-8 bg-white/[0.02]">
        {['Overview', 'Sessions', 'Insights', 'School Year'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-6 py-5 text-sm font-medium transition-colors ${
              activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/80'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
        <AnimatePresence mode="wait">
          {activeTab === 'Overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#151518] p-6 transition-colors hover:border-white/20">
                   <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/40">
                     <Calendar size={16} /> Today
                   </div>
                   <div className="text-4xl font-bold tracking-tight mb-2">2h 15m</div>
                   <div className="text-sm font-medium text-green-400 flex items-center gap-1.5">
                     <TrendingUp size={14} /> +15% vs yesterday
                   </div>
                </div>
                <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#151518] p-6 transition-colors hover:border-white/20">
                   <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/40">
                     <Calendar size={16} /> Week
                   </div>
                   <div className="text-4xl font-bold tracking-tight mb-2">12h 45m</div>
                   <div className="text-sm font-medium text-white/40">
                     Goal: 20h
                   </div>
                </div>
                <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#151518] p-6 transition-colors hover:border-white/20">
                   <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/40">
                     <Calendar size={16} /> Month
                   </div>
                   <div className="text-4xl font-bold tracking-tight mb-2">48h 30m</div>
                   <div className="text-sm font-medium text-white/40">
                     On track
                   </div>
                </div>
              </div>

              {/* Streak Section */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#151518] to-[#0f0f10] p-10 text-center">
                 <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                       <Flame size={80} className="text-orange-500 fill-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] animate-pulse" />
                       <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-orange-600 shadow-lg border-2 border-[#151518]">
                         3
                       </div>
                    </div>
                    <h3 className="mb-2 text-2xl font-bold tracking-tight">3 Day Streak!</h3>
                    <p className="text-base text-white/40 max-w-md mx-auto">
                      You're on fire! Keep studying every day to maintain your streak.
                    </p>
                 </div>
              </div>

              {/* Chart */}
              <div className="rounded-3xl border border-white/10 bg-[#151518] p-8">
                <h3 className="mb-8 text-xl font-bold tracking-tight">Weekly Activity</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0} minHeight={0}>
                    <BarChart data={studyData}>
                      <XAxis 
                        dataKey="name" 
                        stroke="rgba(255,255,255,0.3)" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.3)" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `${value}h`}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }}
                      />
                      <Bar dataKey="hours" radius={[6, 6, 6, 6]} barSize={40}>
                        {studyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 3 ? '#6366f1' : 'rgba(255,255,255,0.1)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Recent Sessions</h3>
                <button 
                  onClick={handleLogSession}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
                >
                  Log Session (Demo)
                </button>
              </div>

              {loading ? (
                 <div className="text-center text-white/40 py-8">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center text-white/40 py-8">No sessions logged yet.</div>
              ) : (
                sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`rounded-xl p-3 ${
                        session.subject === 'Mathematics' ? 'bg-blue-500/20 text-blue-400' :
                        session.subject === 'Physics' ? 'bg-purple-500/20 text-purple-400' :
                        session.subject === 'History' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{session.subject}</h4>
                        <p className="text-sm text-white/60">{session.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-lg">{session.duration}</div>
                      <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${
                        session.score === 'High' ? 'bg-green-500/20 text-green-400' :
                        session.score === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {session.score} Focus
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'Insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex h-full flex-col items-center justify-center text-center text-white/40 py-20"
            >
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <BarChart2 size={32} className="opacity-50" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Insights Yet</h3>
              <p className="max-w-xs mx-auto">Detailed insights will appear here once you log more study sessions.</p>
            </motion.div>
          )}

          {activeTab === 'School Year' && (
            <motion.div
              key="school-year"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/[0.07]">
                <div className="flex items-center gap-5">
                  <div className="rounded-2xl bg-blue-500/20 p-4 text-blue-400">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Courses</h3>
                    <p className="text-sm text-white/60">0 active courses</p>
                  </div>
                </div>
                <button className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold transition-colors hover:bg-white/20">
                  Create Course
                </button>
              </div>

              <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/[0.07]">
                <div className="flex items-center gap-5">
                  <div className="rounded-2xl bg-purple-500/20 p-4 text-purple-400">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Exams</h3>
                    <p className="text-sm text-white/60">No upcoming exams</p>
                  </div>
                </div>
                <button className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold transition-colors hover:bg-white/20">
                  Add Exam
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isStudent, setIsStudent] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Save user profile with student status
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          isStudent: isStudent,
          isOnboarded: false,
          createdAt: new Date()
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Check if user exists, if not create profile (defaulting isStudent to false for Google sign-in, or prompt later)
      // For simplicity, we'll assume they might update it later or we could prompt.
      // But user specifically asked for "in the sign in". 
      // Since Google Sign In skips the form, we can't easily ask *during* the popup.
      // We'll check if the doc exists, if not create it.
      const docRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          email: result.user.email,
          isStudent: false, // Default or handle via onboarding check later
          isOnboarded: false,
          createdAt: new Date()
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-[#1a1a1a]/80 text-white shadow-2xl backdrop-blur-xl p-8 md:p-10 text-center"
          >
            <h2 className="text-3xl font-bold mb-2 tracking-tight">
              {isLogin ? 'Welcome back' : 'Let\'s get more done'} <span className="text-yellow-400">✨</span>
            </h2>
            <p className="text-white/60 mb-8 text-sm font-medium">
              {isLogin ? 'Log in to continue your progress.' : 'Save your setup for peak productivity.'}
            </p>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <form className="space-y-5 mb-8" onSubmit={handleAuth}>
              {!isLogin && (
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="First name" 
                    className="w-full bg-transparent border-b border-white/20 py-2.5 text-white placeholder:text-white/40 focus:border-white focus:outline-none transition-colors text-sm"
                  />
                </div>
              )}
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 py-2.5 text-white placeholder:text-white/40 focus:border-white focus:outline-none transition-colors text-sm"
                />
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder={isLogin ? "password" : "create password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 py-2.5 text-white placeholder:text-white/40 focus:border-white focus:outline-none transition-colors text-sm pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-2.5 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {!isLogin && (
                  <p className="text-[10px] text-white/30 text-left mt-1.5">
                    8+ characters, 1 uppercase letter, 1 number
                  </p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      id="isStudent" 
                      checked={isStudent}
                      onChange={(e) => setIsStudent(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 accent-[#6366f1] cursor-pointer"
                    />
                    <label htmlFor="isStudent" className="text-xs text-white/60 cursor-pointer select-none">
                      I am a student
                    </label>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      id="newsletter" 
                      className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 accent-[#6366f1] cursor-pointer"
                    />
                    <label htmlFor="newsletter" className="text-xs text-white/60 cursor-pointer select-none">
                      Join our productivity newsletter
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <motion.button 
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-full bg-[#6366f1] py-3 text-sm font-bold text-white hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-500/20"
                >
                  {isLogin ? 'Log In' : 'Continue'}
                </motion.button>
                <motion.button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-full bg-white text-black py-3 text-sm font-bold hover:bg-gray-200 transition-all shadow-lg"
                >
                  Sign in with Google
                </motion.button>
                <motion.button 
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-full bg-[#2a2a30] py-3 text-sm font-bold text-white hover:bg-[#3a3a40] transition-all flex items-center justify-center gap-2"
                >
                  Stay logged out <ArrowRight size={14} />
                </motion.button>
              </div>
            </form>

            <div className="text-xs text-white/40 mb-6">
              {isLogin ? "Don't have an account?" : "Have an account?"} 
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-white hover:underline font-medium ml-1"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </div>

            <div className="text-[10px] text-white/20 leading-tight max-w-xs mx-auto">
              By proceeding, you agree to the <a href="#" className="underline hover:text-white/40">Terms of Service</a> and <a href="#" className="underline hover:text-white/40">Privacy Policy</a>.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};



const AmbientMode = () => {
  const [timeLeft, setTimeLeft] = useState(50 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="absolute right-8 md:right-24 top-1/2 -translate-y-1/2 flex flex-col items-center text-white"
    >
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold mb-2 opacity-90 tracking-wide drop-shadow-md"
      >
        Focus
      </motion.div>
      <motion.div 
        layoutId="timer-display"
        className="text-6xl md:text-8xl font-bold leading-none tracking-tighter mb-6 tabular-nums drop-shadow-2xl font-[Inter]"
      >
        {formatTime(timeLeft)}
      </motion.div>
      <motion.button 
        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)" }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTimer}
        className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-10 py-3 rounded-full text-base font-bold transition-all shadow-xl w-full max-w-[160px]"
      >
        {isActive ? 'Pause' : 'Start'}
      </motion.button>
    </motion.div>
  );
};

const TimerMode = ({ user, settings, setIsGamificationOpen }: { user: FirebaseUser | null, settings: AppSettings, setIsGamificationOpen: (isOpen: boolean) => void }) => {
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(settings.focusWorkDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentSession, setCurrentSession] = useState(0);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const totalSessions = 5;
  
  const { addPoints, updateStreak, focusPoints, currentStreak } = useGamificationStore();

  const modes = {
    focus: { label: 'Focus', time: settings.focusWorkDuration * 60 },
    shortBreak: { label: 'Short Break', time: settings.focusShortBreak * 60 },
    longBreak: { label: 'Long Break', time: settings.focusLongBreak * 60 },
  };

  // Update timeLeft when settings change if we are not active
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(modes[mode].time);
    }
  }, [settings.focusWorkDuration, settings.focusShortBreak, settings.focusLongBreak]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
        if (mode === 'focus') {
          setAccumulatedTime((t) => t + 1);
        }
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished logic
      if (mode === 'focus') {
        // Focus session finished
        addPoints(10); // Award 10 points for a completed focus session
        updateStreak(); // Update daily streak
        
        if (currentSession < totalSessions - 1) {
          setMode('shortBreak');
          setTimeLeft(modes.shortBreak.time);
          setIsActive(true);
        } else {
          setMode('longBreak');
          setTimeLeft(modes.longBreak.time);
          setIsActive(true);
        }
      } else if (mode === 'shortBreak') {
        // Short break finished
        setCurrentSession(prev => prev + 1);
        setMode('focus');
        setTimeLeft(modes.focus.time);
        setIsActive(true);
      } else if (mode === 'longBreak') {
        // Long break finished - Reset cycle
        setCurrentSession(0);
        setMode('focus');
        setTimeLeft(modes.focus.time);
        setIsActive(false);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, currentSession, totalSessions, modes.focus.time, modes.shortBreak.time, modes.longBreak.time, addPoints, updateStreak]);

  const handleModeChange = (newMode: keyof typeof modes) => {
    setMode(newMode);
    setTimeLeft(modes[newMode].time);
    setIsActive(false);
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const formatDurationString = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const confirmReset = async () => {
    if (accumulatedTime > 0 && user) {
      try {
        await addDoc(collection(db, 'sessions'), {
          userId: user.uid,
          subject: 'Focus Session',
          duration: formatDurationString(accumulatedTime),
          seconds: accumulatedTime,
          score: 'Medium',
          createdAt: Timestamp.now()
        });
      } catch (e) {
        console.error("Error saving session:", e);
      }
    }
    setIsActive(false);
    setTimeLeft(modes[mode].time);
    setAccumulatedTime(0);
    setShowResetConfirm(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center text-white w-full max-w-4xl relative"
    >
      {/* Gamification Stats */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 right-0 flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
        onClick={() => setIsGamificationOpen(true)}
      >
        <div className="flex items-center gap-1.5 text-sm font-bold text-orange-400" title="Daily Streak">
          <Flame size={16} className="fill-orange-400" />
          {currentStreak}
        </div>
        <div className="w-px h-4 bg-white/20"></div>
        <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-400" title="Focus Points">
          <Zap size={16} className="fill-indigo-400" />
          {focusPoints}
        </div>
      </motion.div>

      {!settings.focusMinimal && (
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-8 opacity-90 tracking-wide text-center flex items-center gap-2 drop-shadow-md mt-12"
        >
          What do you want to focus on? <Pencil size={20} className="opacity-50" />
        </motion.h2>
      )}

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-4 mb-8"
      >
        {(Object.keys(modes) as Array<keyof typeof modes>).map((m) => (
          <motion.button
            key={m}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleModeChange(m)}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${
              mode === m 
                ? 'bg-[#6366f1] border-[#6366f1] text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                : 'bg-transparent border-white/30 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {modes[m].label}
          </motion.button>
        ))}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3 mb-6"
      >
        {Array.from({ length: totalSessions }).map((_, i) => (
          <motion.div 
            key={i} 
            animate={
              (i === currentSession && mode === 'focus' && isActive) 
                ? { opacity: [1, 0.4, 1] } 
                : { opacity: i <= currentSession ? 1 : 0.2 }
            }
            transition={
              (i === currentSession && mode === 'focus' && isActive)
                ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                : { duration: 0.3 }
            }
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i <= currentSession ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'bg-white' 
            }`} 
          />
        ))}
      </motion.div>

      <div className="relative group">
        <motion.h1 
          layoutId="timer-display"
          className="text-[6rem] md:text-[10rem] lg:text-[12rem] font-bold leading-none tracking-tighter mb-12 tabular-nums drop-shadow-2xl font-[Inter]"
        >
          {formatTime(timeLeft)}
        </motion.h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4"
      >
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTimer}
          className="bg-[#6366f1] text-white px-12 py-3 rounded-full text-lg font-bold hover:bg-[#4f46e5] transition-all shadow-xl"
        >
          {isActive ? 'Pause' : 'Start'}
        </motion.button>
        
        <motion.button 
          whileHover={{ rotate: 180, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleResetClick}
          className="p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-500"
          title="Reset Timer"
        >
          <RotateCcw size={24} />
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl shadow-2xl text-center max-w-xs mx-4"
            >
              <div className="flex justify-center mb-4 text-yellow-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2">Reset Timer?</h3>
              <p className="text-sm text-white/60 mb-6">
                Current progress will be saved to your analysis.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReset}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                >
                  Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

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
      className="flex flex-col items-center text-white w-full max-w-4xl"
    >
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-xl md:text-3xl font-bold mb-4 opacity-100 tracking-wide text-center drop-shadow-md"
      >
        {greeting}
      </motion.h2>
      <motion.h1 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="text-[6rem] md:text-[10rem] lg:text-[12rem] font-bold leading-none tracking-tighter tabular-nums drop-shadow-2xl font-[Inter]"
      >
        {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })}
      </motion.h1>
    </motion.div>
  );
};

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
            className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-[#1a1a1a]/90 text-white shadow-2xl backdrop-blur-xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Award size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Achievements</h2>
                <p className="text-white/60">Track your focus milestones</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <Zap size={32} className="text-indigo-400 mb-2" />
                <div className="text-3xl font-bold">{focusPoints}</div>
                <div className="text-sm text-white/60">Total Focus Points</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <Flame size={32} className="text-orange-400 mb-2" />
                <div className="text-3xl font-bold">{currentStreak}</div>
                <div className="text-sm text-white/60">Day Streak</div>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-4">Badges</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
              {badges.map((badge) => (
                <div 
                  key={badge.id} 
                  className={`relative overflow-hidden rounded-2xl border p-4 flex flex-col items-center text-center transition-all ${
                    badge.unlockedAt 
                      ? 'bg-gradient-to-b from-white/10 to-white/5 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                      : 'bg-white/5 border-white/5 opacity-50 grayscale'
                  }`}
                >
                  <div className="text-4xl mb-3">{badge.icon}</div>
                  <h4 className="font-bold text-sm mb-1">{badge.name}</h4>
                  <p className="text-xs text-white/60">{badge.description}</p>
                  
                  {!badge.unlockedAt && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                      <Lock size={24} className="text-white/40" />
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

export default function App() {
  const [appMode, setAppMode] = useState<'ambient' | 'home' | 'focus' | 'tracker' | 'student-dashboard'>('ambient');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
  const [isSpotifyManagerOpen, setIsSpotifyManagerOpen] = useState(false);
  const [isGamificationOpen, setIsGamificationOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsAuthOpen(false);
        // Fetch user profile
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsStudent(data.isStudent);
          setIsOnboarded(data.isOnboarded);
          
          if (data.isStudent && !data.isOnboarded) {
            setShowOnboarding(true);
          } else if (data.isStudent && data.isOnboarded) {
            setAppMode('student-dashboard');
          }
        }
      } else {
        setIsStudent(false);
        setIsOnboarded(false);
        setShowOnboarding(false);
        setAppMode('ambient');
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if an input is focused
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key.toLowerCase() === 'f') toggleFullscreen();
      if (e.key.toLowerCase() === 's') setIsSettingsOpen(prev => !prev);
      if (e.key.toLowerCase() === 'n') setIsNotepadOpen(prev => !prev);
      if (e.key.toLowerCase() === 'd') {
        if (isStudent) {
          setAppMode(prev => prev === 'student-dashboard' ? 'home' : 'student-dashboard');
        } else {
          setAppMode(prev => prev === 'tracker' ? 'home' : 'tracker');
        }
      }
      if (e.key.toLowerCase() === 'a') setAppMode('ambient');
      if (e.key.toLowerCase() === 'h') setAppMode('home');
      if (e.key.toLowerCase() === 't') setAppMode('focus');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  const getBackground = () => {
    // Base image for all modes (Implant Mode aesthetic - Lush Forest)
    const baseImage = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop';
    
    switch (appMode) {
      case 'ambient':
        return {
          type: 'image',
          image: baseImage,
          overlayStyle: { backgroundColor: 'rgba(0, 0, 0, 0.2)' },
          blurStyle: { filter: 'blur(0px)' }
        };
      case 'focus':
        if (settings.focusBackground === 'solid') {
          return {
            type: 'solid',
            image: '',
            overlayStyle: { backgroundColor: '#171717' }, // neutral-900
            blurStyle: { filter: 'blur(0px)' }
          };
        } else if (settings.focusBackground.startsWith('gradient-')) {
          let gradientClass = '';
          switch (settings.focusBackground) {
            case 'gradient-morning':
              gradientClass = 'bg-gradient-to-br from-rose-400 via-fuchsia-500 to-indigo-500';
              break;
            case 'gradient-afternoon':
              gradientClass = 'bg-gradient-to-br from-amber-200 via-orange-400 to-rose-500';
              break;
            case 'gradient-evening':
              gradientClass = 'bg-gradient-to-br from-violet-500 to-purple-900';
              break;
            case 'gradient-night':
              gradientClass = 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900';
              break;
          }
          return {
            type: 'gradient',
            gradientClass,
            image: '',
            overlayStyle: { backgroundColor: 'transparent' },
            blurStyle: { filter: 'blur(0px)' }
          };
        }
        return {
          type: 'image',
          image: baseImage,
          overlayStyle: { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
          blurStyle: { filter: 'blur(4px)' }
        };
      case 'student-dashboard':
        return {
          type: 'solid',
          image: '', // No background image for student dashboard
          overlayStyle: { backgroundColor: '#0f0f13' },
          blurStyle: { filter: 'blur(0px)' }
        };
      case 'tracker':
        return {
          type: 'image',
          image: baseImage,
          overlayStyle: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          blurStyle: { filter: 'blur(4px)' }
        };
      case 'home':
      default:
        return {
          type: 'image',
          image: baseImage,
          overlayStyle: { backgroundColor: `rgba(0, 0, 0, ${settings.homeOverlay / 100})` },
          blurStyle: { filter: `blur(${settings.homeBlur}px)` }
        };
    }
  };

  const bg = getBackground();

  const handleUserClick = () => {
    if (user) {
      if (confirm('Are you sure you want to log out?')) {
        signOut(auth);
      }
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans selection:bg-white/30 text-white">
      {/* Background */}
      {appMode !== 'student-dashboard' && (
        <div className="absolute inset-0 z-0 transition-all duration-1000">
          <motion.div 
            initial={false}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <AnimatePresence mode="wait">
              {bg.type === 'image' && (
                <motion.img
                  key="bg-image"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  src={bg.image}
                  alt="Background"
                  className="h-full w-full object-cover transition-all duration-1000"
                  style={bg.blurStyle}
                />
              )}
              {bg.type === 'gradient' && (
                <motion.div
                  key={bg.gradientClass}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className={`absolute inset-0 ${bg.gradientClass}`}
                />
              )}
            </AnimatePresence>
          </motion.div>
          <div className="absolute inset-0 transition-colors duration-1000" style={bg.overlayStyle} />
        </div>
      )}

      {/* Top Bar */}
      {appMode !== 'student-dashboard' && (
        <header className="absolute top-0 left-0 right-0 p-6 md:p-8 flex justify-between items-center z-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold tracking-tighter text-white select-none drop-shadow-md pointer-events-auto flex items-center gap-2"
          >
            <Leaf className="text-green-400" size={24} />
            EgyFlow
          </motion.div>
          <AnimatePresence>
            {appMode !== 'ambient' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-white/80 italic text-sm font-medium select-none drop-shadow-md pointer-events-auto hidden md:block"
              >
                "Your only limit is your mind"
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      {/* Center Stage */}
      <main className={`relative z-10 w-full ${appMode === 'student-dashboard' ? 'h-screen overflow-hidden' : 'flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-32'}`}>
        <AnimatePresence mode="wait">
          {appMode === 'home' && (
            <motion.div key="home" className="w-full h-full flex justify-center">
              <ClockMode />
            </motion.div>
          )}
          {appMode === 'focus' && (
            <motion.div key="focus" className="w-full h-full flex justify-center">
              <TimerMode user={user} settings={settings} setIsGamificationOpen={setIsGamificationOpen} />
            </motion.div>
          )}
          {appMode === 'ambient' && (
            <motion.div key="ambient" className="w-full h-full flex justify-center">
              <AmbientMode />
            </motion.div>
          )}
          {appMode === 'tracker' && (
            <motion.div key="tracker" className="w-full h-full flex justify-center">
              <TrackerMode user={user} onSwitchMode={(mode) => setAppMode(mode)} />
            </motion.div>
          )}
          {appMode === 'student-dashboard' && (
             <motion.div key="student-dashboard" className="w-full h-full">
               <StudentDashboard user={user} onSwitchMode={(mode) => setAppMode(mode)} />
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && user && (
          <Onboarding 
            user={user} 
            onComplete={() => {
              setShowOnboarding(false);
              setIsOnboarded(true);
              setAppMode('student-dashboard');
            }} 
          />
        )}
      </AnimatePresence>

      {/* Bottom Bar */}
      {appMode !== 'student-dashboard' && (
        <>
          <footer className="absolute bottom-8 left-0 right-0 flex justify-between items-end z-10 px-8 pointer-events-none">
            {/* Left Side */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 pointer-events-auto"
            >
              <div className="relative">
                <MotionButton 
                  onClick={() => setIsMusicPlayerOpen(!isMusicPlayerOpen)}
                  className="p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white" 
                  title="Music"
                >
                  <Music size={20} />
                </MotionButton>
                <AnimatePresence>
                  {isMusicPlayerOpen && (
                    <div className="absolute bottom-full left-0 mb-4 pointer-events-auto">
                      <MusicPlayer 
                        onClose={() => setIsMusicPlayerOpen(false)} 
                        onOpenManager={() => {
                          setIsMusicPlayerOpen(false);
                          setIsSpotifyManagerOpen(true);
                        }}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
              <MotionButton 
                onClick={() => setAppMode('student-dashboard')}
                className="p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white" 
                title="Student Dashboard"
              >
                <LayoutDashboard size={20} />
              </MotionButton>
              <MotionButton 
                onClick={() => setIsNotepadOpen(true)}
                className="p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white" 
                title="Notepad (N)"
              >
                <FileText size={20} />
              </MotionButton>
            </motion.div>

            {/* Right Side */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-end gap-4 pointer-events-auto"
            >
              {/* Mode Pill */}
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xl border border-white/10 rounded-full p-2 shadow-2xl">
                <MotionButton 
                  onClick={() => setAppMode('ambient')}
                  active={appMode === 'ambient'}
                  className={`p-3 rounded-full ${appMode === 'ambient' ? '' : 'text-white/60 hover:text-white'}`}
                  title="Ambient Mode (A)"
                >
                  <Leaf size={20} />
                </MotionButton>
                <MotionButton 
                  onClick={() => setAppMode('home')}
                  active={appMode === 'home'}
                  className={`p-3 rounded-full ${appMode === 'home' ? '' : 'text-white/60 hover:text-white'}`}
                  title="Home Mode (H)"
                >
                  <Home size={20} />
                </MotionButton>

                <MotionButton 
                  onClick={() => setAppMode('focus')}
                  active={appMode === 'focus'}
                  className={`p-3 rounded-full ${appMode === 'focus' ? '' : 'text-white/60 hover:text-white'}`}
                  title="Focus Mode (T)"
                >
                  <Timer size={20} />
                </MotionButton>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-2">
                <MotionButton 
                  onClick={handleUserClick} 
                  className="p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white" 
                  title={user ? `Logged in as ${user.email}` : "Log In"}
                >
                  {user ? (
                    user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                    )
                  ) : (
                    <User size={20} />
                  )}
                </MotionButton>
                <MotionButton onClick={() => setIsSettingsOpen(true)} className="p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white" title="Settings (S)">
                  <Settings size={20} />
                </MotionButton>
                <MotionButton onClick={toggleFullscreen} className="p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white" title="Fullscreen (F)">
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </MotionButton>
              </div>
            </motion.div>
          </footer>

          <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            user={user}
            isStudent={isStudent}
            setIsStudent={setIsStudent}
            settings={settings}
            updateSettings={updateSettings}
            appMode={appMode}
            setAppMode={setAppMode}
          />
          <Notepad isOpen={isNotepadOpen} onClose={() => setIsNotepadOpen(false)} />
          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
          <GamificationModal isOpen={isGamificationOpen} onClose={() => setIsGamificationOpen(false)} />
          <AnimatePresence>
            {isSpotifyManagerOpen && (
              <SpotifyManager onClose={() => setIsSpotifyManagerOpen(false)} />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
