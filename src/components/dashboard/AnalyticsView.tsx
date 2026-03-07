import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useTaskStore } from '../../store/useTaskStore';
import { Clock, CheckCircle, TrendingUp, Calendar, Target } from 'lucide-react';

interface AnalyticsViewProps {
  user: any;
}

const AnalyticsView = ({ user }: AnalyticsViewProps) => {
  const [sessionData, setSessionData] = useState<any[]>([]);
  const [focusDistribution, setFocusDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { tasks } = useTaskStore();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch sessions
        const sessionsRef = collection(db, 'sessions');
        const q = query(
          sessionsRef, 
          where('userId', '==', user.uid)
        );
        
        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map(doc => ({
          ...doc.data(),
          date: doc.data().createdAt?.toDate()
        }));

        // Sort client-side to avoid index requirement
        sessions.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

        // Limit to last 50 sessions
        const recentSessions = sessions.slice(0, 50);

        processSessionData(recentSessions);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const processSessionData = (sessions: any[]) => {
    // 1. Daily Focus Time (Last 7 Days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const dailyData = last7Days.map(dateStr => {
      const daySessions = sessions.filter(s => 
        s.date && s.date.toISOString().split('T')[0] === dateStr
      );
      const totalSeconds = daySessions.reduce((acc, s) => acc + (s.seconds || 0), 0);
      return {
        date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
        minutes: Math.round(totalSeconds / 60)
      };
    });

    setSessionData(dailyData);

    // 2. Focus Distribution by Subject (Mock logic if subject isn't strictly tracked yet, 
    //    or use 'subject' field from session if available)
    //    In TimerMode, we save subject as 'Focus Session' mostly, but let's see if we can aggregate.
    const subjectCounts: Record<string, number> = {};
    sessions.forEach(s => {
      const subj = s.subject || 'General';
      subjectCounts[subj] = (subjectCounts[subj] || 0) + (s.seconds || 0);
    });

    const distData = Object.entries(subjectCounts).map(([name, seconds]) => ({
      name,
      value: Math.round(seconds / 60)
    }));

    // If no data, provide placeholder
    if (distData.length === 0) {
      distData.push({ name: 'General', value: 0 });
    }

    setFocusDistribution(distData);
  };

  // Task Stats
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Analytics</h2>
          <p className="text-white/60">Track your productivity and study habits.</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#141418] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-white/40 text-sm">Total Focus Time</p>
              <h3 className="text-2xl font-bold text-white">
                {Math.round(sessionData.reduce((acc, d) => acc + d.minutes, 0) / 60)}h {' '}
                {sessionData.reduce((acc, d) => acc + d.minutes, 0) % 60}m
              </h3>
            </div>
          </div>
          <div className="text-xs text-white/40 mt-2">
            Last 7 days
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#141418] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-white/40 text-sm">Task Completion</p>
              <h3 className="text-2xl font-bold text-white">{completionRate}%</h3>
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 mt-3">
            <div 
              className="bg-green-500 h-1.5 rounded-full transition-all duration-1000" 
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="text-xs text-white/40 mt-2">
            {completedTasks} / {totalTasks} tasks completed
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#141418] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400">
              <Target size={24} />
            </div>
            <div>
              <p className="text-white/40 text-sm">Daily Average</p>
              <h3 className="text-2xl font-bold text-white">
                {Math.round(sessionData.reduce((acc, d) => acc + d.minutes, 0) / 7)}m
              </h3>
            </div>
          </div>
          <div className="text-xs text-white/40 mt-2">
            Focus time per day
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Focus Activity Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-[#141418] border border-white/5 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-400" />
            Focus Activity (Last 7 Days)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff40" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#ffffff40" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}m`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1e', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: '#ffffff05' }}
                />
                <Bar 
                  dataKey="minutes" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Focus Distribution Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-[#141418] border border-white/5 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Calendar size={18} className="text-purple-400" />
            Subject Distribution
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {focusDistribution.reduce((acc, curr) => acc + curr.value, 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={focusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {focusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1e', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-white/20 text-center">
                <p>No focus data available yet.</p>
                <p className="text-sm mt-2">Start a focus session to see stats!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsView;
