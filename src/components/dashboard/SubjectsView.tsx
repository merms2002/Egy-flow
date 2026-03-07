import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp, Zap, Loader2, Calendar, FileText, CheckCircle, X } from 'lucide-react';
import { useStudentStore } from '../../store/useStudentStore';
import SubjectRoadmap from './SubjectRoadmap';
import { generateSubjectPlan } from '../../services/ai';

const SubjectsView = () => {
  const { subjects, setSubjects, toggleSubjectCompletion, updateSubjectProgress, subjectPlans, setSubjectPlan } = useStudentStore();
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newInstructor, setNewInstructor] = useState('');
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [activeSubjectForPlan, setActiveSubjectForPlan] = useState<any>(null);
  const [planContext, setPlanContext] = useState({ books: '', tests: '', syllabus: '' });

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const newSubject = {
      id: Date.now().toString(),
      name: newSubjectName,
      instructor: newInstructor || 'TBD',
      status: 'New' as const,
    };

    setSubjects([...subjects, newSubject]);
    setNewSubjectName('');
    setNewInstructor('');
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
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

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">My Subjects</h2>
          <p className="text-white/60">Manage your courses and get AI-powered study plans.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
          <BookOpen size={18} className="text-indigo-400" />
          <span className="text-indigo-300 font-bold">{subjects.length} Active Courses</span>
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

      {/* Add New Subject Form */}
      <motion.form 
        onSubmit={handleAddSubject}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#141418] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-end"
      >
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Subject Name</label>
          <input 
            type="text" 
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="e.g. Advanced Physics"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Instructor (Optional)</label>
          <input 
            type="text" 
            value={newInstructor}
            onChange={(e) => setNewInstructor(e.target.value)}
            placeholder="e.g. Dr. Smith"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
          />
        </div>
        <button 
          type="submit"
          disabled={!newSubjectName.trim()}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Add Subject
        </button>
      </motion.form>

      {/* Subjects List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {subjects.map((subject) => (
            <motion.div
              key={subject.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-[#141418] border ${expandedSubjectId === subject.id ? 'border-indigo-500/30 ring-1 ring-indigo-500/20' : 'border-white/5'} rounded-2xl overflow-hidden transition-all`}
            >
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                    subject.status === 'Completed' ? 'bg-purple-500/20 text-purple-400' :
                    subject.status === 'On Track' ? 'bg-green-500/20 text-green-400' :
                    subject.status === 'Backlog' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {subject.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${subject.status === 'Completed' ? 'text-white/60 line-through' : 'text-white'}`}>{subject.name}</h3>
                    <p className="text-white/40 text-sm flex items-center gap-2">
                      {subject.instructor}
                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                      <span className={`${
                        subject.status === 'Completed' ? 'text-purple-400' :
                        subject.status === 'On Track' ? 'text-green-400' :
                        subject.status === 'Backlog' ? 'text-red-400' :
                        'text-blue-400'
                      }`}>{subject.status}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="hidden md:flex flex-col items-end mr-4 w-32">
                    <div className="w-full bg-white/5 rounded-full h-1.5 mb-1 relative group-hover:h-2 transition-all">
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
                    <span className="text-xs text-white/40">{subject.progress || 0}%</span>
                  </div>

                  <button 
                    onClick={() => toggleSubjectCompletion(subject.id)}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border ${
                      subject.status === 'Completed' 
                        ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/20' 
                        : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-white/10'
                    }`}
                  >
                    <CheckCircle size={16} />
                    {subject.status === 'Completed' ? 'Completed' : 'Mark Complete'}
                  </button>
                  
                  <button 
                    onClick={() => handleGeneratePlan(subject.id, subject.name, subject.status)}
                    disabled={loadingPlanId === subject.id}
                    className="flex-1 md:flex-none px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-indigo-500/20"
                  >
                    {loadingPlanId === subject.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Zap size={16} />
                    )}
                    {subjectPlans[subject.id] ? 'Regenerate Plan' : 'AI Study Plan'}
                  </button>
                  
                  <button 
                    onClick={() => toggleExpand(subject.id)}
                    className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                  >
                    {expandedSubjectId === subject.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  
                  <button 
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
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
                    <div className="p-6">
                      {subjectPlans[subject.id] ? (
                        <div className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          </div>
                          
                          {/* Roadmap */}
                          <SubjectRoadmap subjectId={subject.id} />
                        </div>
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
  );
};

export default SubjectsView;
