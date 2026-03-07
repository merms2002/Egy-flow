import React from 'react';
import { CheckCircle2, ListTodo, Target, Trophy } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { useStudentStore } from '../../store/useStudentStore';

const GoalsView = () => {
  const { tasks } = useTaskStore();
  const { subjects } = useStudentStore();

  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.length - completedTasks;
  const completedSubjects = subjects.filter((subject) => subject.status === 'Completed').length;
  const onTrackSubjects = subjects.filter((subject) => subject.status === 'On Track').length;
  const overallProgress = subjects.length
    ? Math.round(subjects.reduce((sum, subject) => sum + (subject.progress || 0), 0) / subjects.length)
    : 0;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Goals & Progress</h2>
          <p className="text-white/50 text-sm mt-1">Track your momentum and focus the next win.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Completed Tasks</span>
            <CheckCircle2 size={18} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold mt-3">{completedTasks}</p>
        </div>

        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Pending Tasks</span>
            <ListTodo size={18} className="text-indigo-400" />
          </div>
          <p className="text-3xl font-bold mt-3">{pendingTasks}</p>
        </div>

        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Completed Subjects</span>
            <Trophy size={18} className="text-amber-400" />
          </div>
          <p className="text-3xl font-bold mt-3">{completedSubjects}</p>
        </div>

        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Average Progress</span>
            <Target size={18} className="text-cyan-400" />
          </div>
          <p className="text-3xl font-bold mt-3">{overallProgress}%</p>
        </div>
      </div>

      <div className="bg-[#141418] border border-white/5 rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4">Subject Status</h3>
        <div className="space-y-3">
          {subjects.map((subject) => (
            <div key={subject.id} className="p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-white">{subject.name}</p>
                <span className="text-xs text-white/50">{subject.progress || 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${subject.progress || 0}%` }}
                />
              </div>
              <p className="text-xs text-white/40 mt-2">Status: {subject.status}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 text-sm text-indigo-100">
        <p className="font-semibold mb-1">Suggested next action</p>
        <p>
          {pendingTasks > 0
            ? `Complete ${Math.min(3, pendingTasks)} high-impact tasks today to keep your streak alive.`
            : onTrackSubjects > 0
              ? 'Great flow! Start a focused session to push one on-track subject closer to completion.'
              : 'Add a new goal from the tasks section to keep momentum going.'}
        </p>
      </div>
    </div>
  );
};

export default GoalsView;
