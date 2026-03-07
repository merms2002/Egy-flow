import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Circle, Lock, Clock, Play } from 'lucide-react';
import { useStudentStore } from '../../store/useStudentStore';

interface SubjectRoadmapProps {
  subjectId: string;
}

const SubjectRoadmap = ({ subjectId }: SubjectRoadmapProps) => {
  const { subjectPlans, toggleRoadmapNode } = useStudentStore();
  const plan = subjectPlans[subjectId];

  if (!plan || !plan.roadmap || plan.roadmap.length === 0) {
    return null;
  }

  const roadmap = plan.roadmap;

  return (
    <div className="mt-8 relative">
      <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <span className="bg-indigo-500/20 text-indigo-400 p-1.5 rounded-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </span>
        Learning Path
      </h4>

      <div className="relative pl-6 md:pl-0">
        {/* Central Line for Desktop, Left Line for Mobile */}
        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-white/10 transform md:-translate-x-1/2 rounded-full"></div>

        <div className="space-y-8">
          {roadmap.map((node, index) => {
            const isCompleted = node.completed;
            const isNext = !isCompleted && (index === 0 || roadmap[index - 1].completed);
            const isLocked = !isCompleted && !isNext;

            return (
              <motion.div 
                key={node.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex items-center md:justify-between ${
                  index % 2 === 0 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Timeline Node/Icon */}
                <div 
                  className={`absolute left-0 md:left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full border-4 border-[#1a1a1a] flex items-center justify-center z-10 transition-colors cursor-pointer ${
                    isCompleted ? 'bg-purple-500 text-white' :
                    isNext ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' :
                    'bg-white/10 text-white/40'
                  }`}
                  onClick={() => !isLocked && toggleRoadmapNode(subjectId, node.id)}
                >
                  {isCompleted ? <CheckCircle size={16} /> :
                   isNext ? <Play size={16} className="ml-0.5" /> :
                   <Lock size={16} />}
                </div>

                {/* Content Card */}
                <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${
                  index % 2 === 0 ? 'md:text-left' : 'md:text-right'
                }`}>
                  <div 
                    onClick={() => !isLocked && toggleRoadmapNode(subjectId, node.id)}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCompleted ? 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50 cursor-pointer' :
                      isNext ? 'bg-indigo-500/10 border-indigo-500/50 hover:border-indigo-500 cursor-pointer' :
                      'bg-white/5 border-white/10 opacity-60'
                    }`}
                  >
                    <div className={`flex items-center gap-2 mb-2 ${index % 2 !== 0 ? 'md:justify-end' : ''}`}>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        isCompleted ? 'bg-purple-500/20 text-purple-300' :
                        isNext ? 'bg-indigo-500/20 text-indigo-300' :
                        'bg-white/10 text-white/40'
                      }`}>
                        Step {index + 1}
                      </span>
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <Clock size={12} />
                        {node.estimatedHours}h
                      </span>
                    </div>
                    <h5 className={`text-lg font-bold mb-1 ${isCompleted ? 'text-purple-100 line-through opacity-70' : 'text-white'}`}>
                      {node.title}
                    </h5>
                    <p className="text-sm text-white/60">
                      {node.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubjectRoadmap;
