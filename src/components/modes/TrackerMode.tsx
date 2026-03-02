import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart2, GraduationCap, Calendar, TrendingUp, Flame, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

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
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateObj: doc.data().createdAt?.toDate() || new Date(),
        date: doc.data().createdAt?.toDate().toLocaleString() || 'Just now'
      }));
      
      // Sort client-side
      sessionsData.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
      
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
      <div className="flex flex-col gap-6 border-b border-white/10 p-4 md:p-8 md:flex-row md:items-center md:justify-between bg-white/5">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1e1e24] border border-white/5 shadow-inner shrink-0">
            <BarChart2 size={32} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-sm md:text-base text-white/40 font-medium">Track your progress and stay motivated</p>
          </div>
        </div>
        <button 
          onClick={() => onSwitchMode('student-dashboard')}
          className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 w-full md:w-auto"
        >
          <GraduationCap size={18} />
          Student Mode
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-4 md:px-8 bg-white/[0.02] overflow-x-auto custom-scrollbar">
        {['Overview', 'Sessions', 'Insights', 'School Year'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-4 md:px-6 py-4 md:py-5 text-sm font-medium transition-colors whitespace-nowrap ${
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
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
        <AnimatePresence mode="wait">
          {activeTab === 'Overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 md:space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-3">
                <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#151518] p-6 transition-colors hover:border-white/20">
                   <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/40">
                     <Calendar size={16} /> Today
                   </div>
                   <div className="text-3xl md:text-4xl font-bold tracking-tight mb-2">2h 15m</div>
                   <div className="text-sm font-medium text-green-400 flex items-center gap-1.5">
                     <TrendingUp size={14} /> +15% vs yesterday
                   </div>
                </div>
                <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#151518] p-6 transition-colors hover:border-white/20">
                   <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/40">
                     <Calendar size={16} /> Week
                   </div>
                   <div className="text-3xl md:text-4xl font-bold tracking-tight mb-2">12h 45m</div>
                   <div className="text-sm font-medium text-white/40">
                     Goal: 20h
                   </div>
                </div>
                <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#151518] p-6 transition-colors hover:border-white/20">
                   <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/40">
                     <Calendar size={16} /> Month
                   </div>
                   <div className="text-3xl md:text-4xl font-bold tracking-tight mb-2">48h 30m</div>
                   <div className="text-sm font-medium text-white/40">
                     On track
                   </div>
                </div>
              </div>

              {/* Streak Section */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#151518] to-[#0f0f10] p-6 md:p-10 text-center">
                 <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                       <Flame size={80} className="text-orange-500 fill-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] animate-pulse" />
                       <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-orange-600 shadow-lg border-2 border-[#151518]">
                         3
                       </div>
                    </div>
                    <h3 className="mb-2 text-xl md:text-2xl font-bold tracking-tight">3 Day Streak!</h3>
                    <p className="text-sm md:text-base text-white/40 max-w-md mx-auto">
                      You're on fire! Keep studying every day to maintain your streak.
                    </p>
                 </div>
              </div>

              {/* Chart */}
              <div className="rounded-3xl border border-white/10 bg-[#151518] p-4 md:p-8 overflow-x-auto">
                <h3 className="mb-6 md:mb-8 text-lg md:text-xl font-bold tracking-tight">Weekly Activity</h3>
                <div style={{ width: '100%', height: 300, minWidth: 500 }}>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h3 className="text-lg md:text-xl font-semibold">Recent Sessions</h3>
                <button 
                  onClick={handleLogSession}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20 w-full sm:w-auto"
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
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`rounded-xl p-3 shrink-0 ${
                        session.subject === 'Mathematics' ? 'bg-blue-500/20 text-blue-400' :
                        session.subject === 'Physics' ? 'bg-purple-500/20 text-purple-400' :
                        session.subject === 'History' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base md:text-lg">{session.subject}</h4>
                        <p className="text-xs md:text-sm text-white/60">{session.date}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="font-mono font-bold text-base md:text-lg">{session.duration}</div>
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
              <p className="max-w-xs mx-auto text-sm md:text-base">Detailed insights will appear here once you log more study sessions.</p>
            </motion.div>
          )}

          {activeTab === 'School Year' && (
            <motion.div
              key="school-year"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 md:space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6 transition-colors hover:bg-white/[0.07] gap-4">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="rounded-2xl bg-blue-500/20 p-3 md:p-4 text-blue-400 shrink-0">
                    <BookOpen size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base md:text-lg">Courses</h3>
                    <p className="text-xs md:text-sm text-white/60">0 active courses</p>
                  </div>
                </div>
                <button className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold transition-colors hover:bg-white/20 w-full sm:w-auto">
                  Create Course
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6 transition-colors hover:bg-white/[0.07] gap-4">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="rounded-2xl bg-purple-500/20 p-3 md:p-4 text-purple-400 shrink-0">
                    <GraduationCap size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base md:text-lg">Exams</h3>
                    <p className="text-xs md:text-sm text-white/60">No upcoming exams</p>
                  </div>
                </div>
                <button className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold transition-colors hover:bg-white/20 w-full sm:w-auto">
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

export default TrackerMode;
