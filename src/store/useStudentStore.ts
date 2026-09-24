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

export const createDefaultPlanForSubject = (subjectName: string): SubjectPlan => {
  return {
    topics: [
      `أساسيات ومفاهيم ${subjectName}`,
      "التطبيقات وحل النماذج التدريبية",
      "المراجعة الشاملة ونقاط التركيز للامتحان"
    ],
    schedule: [
      "اليوم 1-2: دراسة الوحدة الأولى وتلخيص القوانين والمصطلحات",
      "اليوم 3-4: حل بنك الأسئلة والتدريبات التطبيقية",
      "اليوم 5-6: معالجة النقاط الصعبة والاختبار التجريبي",
      "اليوم 7: مراجعة سريعة للاختبار الأسبوعي"
    ],
    resources: [
      "كتاب المدرسة والمذكرات المعتمدة",
      "منصة الحصص التفاعلية وبنك المعرفة",
      "نماذج الامتحانات السابقة وحلولها النموذجية"
    ],
    roadmap: [
      { id: "m1", title: "تأسيس المفاهيم الأساسية", description: `فهم واستيعاب الوحدات التأسيسية لمادة ${subjectName}`, estimatedHours: 4, completed: false },
      { id: "m2", title: "تطبيقات وتمارين مركزة", description: "حل مسائل وتطبيقات على كل درس ومطابقة الإجابات", estimatedHours: 6, completed: false },
      { id: "m3", title: "معالجة المتراكم والثغرات", description: "مراجعة الأسئلة غير المحلولة والتركيز على نقاط الضعف", estimatedHours: 5, completed: false },
      { id: "m4", title: "المحاكاة والامتحانات التجريبية", description: "حل نماذج امتحانات شاملة تحت توقيت زمني محدد", estimatedHours: 4, completed: false }
    ]
  };
};

const INITIAL_SUBJECT_PLANS: Record<string, SubjectPlan> = {
  '1': {
    topics: ["الوحدة الأولى: النحو (المشتقات وإعرابها)", "الأدب: مدرسة الإحياء والبعث والاتجاه الوجداني", "البلاغة: التجربة الشعرية والمحسنات البديعية", "التعبير ونصوص القراءة المتحررة"],
    schedule: [
      "السبت: مراجعة إعمال اسم الفاعل والمفعول وحل 30 سؤالاً",
      "الإثنين: نصوص متحررة وتطبيق سمات الإحياء والبعث",
      "الأربعاء: بلاغة وتطبيقات التجربة الشعرية",
      "الجمعة: امتحان شامل على الأسبوع في كتاب الامتحان"
    ],
    resources: ["كتاب الامتحان في اللغة العربية", "كتاب الأضواء - بنك الأسئلة", "مذكرة الأستاذ محمد صلاح"],
    roadmap: [
      { id: "ar-1", title: "النحو: المشتقات والمصادر", description: "إتقان استخراج وإعراب المشتقات العاملة وغير العاملة", estimatedHours: 5, completed: true },
      { id: "ar-2", title: "الأدب ومدارس الشعر", description: "فهم سمات المدارس الشعرية والموازنة بين النصوص", estimatedHours: 4, completed: true },
      { id: "ar-3", title: "التجربة الشعرية والبلاغة", description: "استخراج الصور المركبة والمبتكرة والمحسنات", estimatedHours: 3, completed: true },
      { id: "ar-4", title: "القراءة والنصوص المتحررة", description: "التدريب على استنتاج المغزى والأسلوب والتراكيب", estimatedHours: 6, completed: false },
      { id: "ar-5", title: "امتحانات الأعوام السابقة", description: "حل نماذج الثانوية العامة الرسمية ومراجعة الأخطاء", estimatedHours: 5, completed: false }
    ]
  },
  '2': {
    topics: ["التفاضل والتكامل (مشتقات الدوال المثلثية)", "الجبر والهندسة الفراغية (المحددات والمصفوفات)", "الاستاتيكا (الاحتكاك والعزوم)", "الديناميكا (قوانين نيوتن للحركة)"],
    schedule: [
      "الأحد: قواعد الاشتقاق وحل مسائل المعدلات الزمنية",
      "الثلاثاء: الاحتكاك واتزان جسم على مستوى مائل",
      "الخميس: ضرب المصفوفات والمحددات في الجبر",
      "الجمعة: حل مسائل المتفوقين في كتاب المعاصر"
    ],
    resources: ["كتاب المعاصر في الرياضيات البحتة والتطبيقية", "نماذج الوزارة الاسترشادية", "مذكرات الأستاذ لطفي زهران"],
    roadmap: [
      { id: "math-1", title: "اشتقاق الدوال المثلثية والعكسية", description: "إتقان مسائل المعدلات الزمنية وتطبيقات التفاضل", estimatedHours: 6, completed: true },
      { id: "math-2", title: "سلوك الدالة ورسم المنحنيات", description: "القيم العظمى والصغرى ونقاط الانقلاب", estimatedHours: 5, completed: false },
      { id: "math-3", title: "الاحتكاك والعزوم في الاستاتيكا", description: "حل متراكم مسائل الاتزان وتطبيقات القوى", estimatedHours: 7, completed: false },
      { id: "math-4", title: "المحددات والهندسة الفراغية", description: "معادلة المستقيم والكرة والضرب الاتجاهي", estimatedHours: 6, completed: false },
      { id: "math-5", title: "المراجعة النهائية ونماذج الفاينال", description: "امتحانات شاملة بزمن محدد وتقييم دقيق للدرجة", estimatedHours: 8, completed: false }
    ]
  },
  '3': {
    topics: ["كيمياء المحاليل والأحماض والقلويات", "الطاقة والمادة في الكائنات الحية", "علوم الأرض والتغير المناخي", "تطبيقات القياس والنانوتكنولوجي"],
    schedule: [
      "الإثنين: دراسة الروابط والتفاعلات الكيميائية البيولوجية",
      "الأربعاء: تطبيقات الطاقة والبيئة",
      "السبت: حل تدريبات منصة الوزارة"
    ],
    resources: ["الكتاب المدرسي للعلوم المتكاملة", "بنك المعرفة المصري", "ملخصات الدكتور الجوهري"],
    roadmap: [
      { id: "sci-1", title: "الخواص الكيميائية والفيزيائية للمحاليل", description: "الأس الهيدروجيني والتركيز والذائبية", estimatedHours: 4, completed: true },
      { id: "sci-2", title: "تدفق الطاقة في النظم البيئية", description: "سلاسل الغذاء والتوازن البيولوجي", estimatedHours: 4, completed: true },
      { id: "sci-3", title: "الظواهر الجيولوجية والمناخ", description: "دورة الصخور والتغير المناخي الحديث", estimatedHours: 5, completed: false },
      { id: "sci-4", title: "اختبارات التقييم الشاملة", description: "حل بنك أسئلة العلوم المتكاملة", estimatedHours: 4, completed: false }
    ]
  },
  '4': {
    topics: ["مصر من الحملة الفرنسية حتى محمد علي", "بناء الدولة الحديثة والنهضة الاقتصادية", "الثورة العرابية والاحتلال البريطاني", "ثورة 1919 حتى ثورة 23 يوليو 1952"],
    schedule: [
      "الأحد: قراءة الفصل الثاني وعمل خرائط ذهنية",
      "الثلاثاء: المقارنات بين معاهدات القرن التاسع عشر",
      "الخميس: حل 50 سؤالاً بنظام الاختيار من متعدد"
    ],
    resources: ["كتاب الامتحان في التاريخ", "مذكرات الأستاذ جمعة السيد", "كراسة المفاهيم الوزارية"],
    roadmap: [
      { id: "his-1", title: "الحملة الفرنسية على مصر والشام", description: "أسباب الحملة والمعارك والآثار الفكرية والسياسية", estimatedHours: 4, completed: true },
      { id: "his-2", title: "عصر محمد علي وبناء الدولة", description: "الاحتكار والجيش والسياسة الخارجية وحروب الشام", estimatedHours: 6, completed: false },
      { id: "his-3", title: "مصر تحت الاحتلال والثورة العرابية", description: "الأزمة المالية والتدخل الأجنبي ومعركة التل الكبير", estimatedHours: 5, completed: false },
      { id: "his-4", title: "ثورات مصر الحديثة والاستقلال", description: "تحليل نصوص معاهدة 1936 وثورة 23 يوليو", estimatedHours: 5, completed: false }
    ]
  },
  '5': {
    topics: ["Grammar: Tenses, Modals & Passive Voice", "Vocabulary: Core High-Frequency Words", "Reading Comprehension & Critical Analysis", "Essay & Paragraph Writing Techniques"],
    schedule: [
      "Monday: Units 1-2 Grammar rules & 40 practice questions",
      "Wednesday: Reading comprehension passage & idioms",
      "Friday: Writing essay structure and linking words"
    ],
    resources: ["Great Expectations Novel & Questions", "The Best / Senior Grammar Workbook", "Mr. Engelshawi Study Sheets"],
    roadmap: [
      { id: "en-1", title: "Mastering Verb Tenses & Passive", description: "Past, present, and perfect aspects in context", estimatedHours: 4, completed: false },
      { id: "en-2", title: "Vocabulary Building & Collocations", description: "Phrasal verbs, idioms, and contextual clues", estimatedHours: 5, completed: false },
      { id: "en-3", title: "Reading Strategy & Skills", description: "Skimming, scanning, inference, and tone analysis", estimatedHours: 4, completed: false },
      { id: "en-4", title: "Comprehensive Model Exams", description: "Timed full-length mock examinations", estimatedHours: 6, completed: false }
    ]
  },
  '6': {
    topics: ["الفلسفة وقضايا البيئة (مراحل علاقة الإنسان بالبيئة)", "الأخلاق البيولوجية والطبية (البيوتيقا)", "الاستدلال الاستقرائي وتطبيقه في العلوم", "الاستنباط وتطبيقه في الرياضيات"],
    schedule: [
      "السبت: مراجعة مراحل البيئة وآراء الفلاسفة الغربيين والشرقيين",
      "الثلاثاء: قضايا الهندسة الوراثية والاستنساخ والجينوم",
      "الخميس: المنطق الرمزي وصياغة الحجج"
    ],
    resources: ["كتاب الوجيز / الامتحان في الفلسفة والمنطق", "مذكرة الأستاذ نادر جورج", "نماذج تدريبية منصة حصص مصر"],
    roadmap: [
      { id: "phi-1", title: "الفلسفة وقضايا البيئة", description: "آراء علي بن رضوان وابن خلدون وبيتر سينجر وليوبولد", estimatedHours: 4, completed: false },
      { id: "phi-2", title: "البيوتيقا وأخلاقيات الطب الحديث", description: "قضايا موت الدماغ وزراعة الأعضاء واليوجينيا", estimatedHours: 5, completed: false },
      { id: "phi-3", title: "الاستقراء والمنهج العلمي المعاصر", description: "أوهام فرانسيس بيكون وخطوات الاستقراء التجريبي", estimatedHours: 5, completed: false },
      { id: "phi-4", title: "المنطق الرمزي والحجج الاستنباطية", description: "صياغة الروابط المنطقية وجداول الصدق", estimatedHours: 4, completed: false }
    ]
  }
};

const getSavedState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('egyflow_student_store');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to load student store from localStorage", e);
  }
  return null;
};

const savedState = getSavedState();

export const useStudentStore = create<StudentState>((set) => ({
  subjects: savedState?.subjects || [
    { id: '1', name: 'اللغة العربية', instructor: 'م. محمد صلاح', status: 'On Track', progress: 75 },
    { id: '2', name: 'الرياضيات', instructor: 'م. لطفي زهران', status: 'Backlog', isCritical: true, progress: 30 },
    { id: '3', name: 'العلوم المتكاملة', instructor: 'د. الجوهري', status: 'On Track', progress: 60 },
    { id: '4', name: 'التاريخ', instructor: 'م. جمعة السيد', status: 'Backlog', progress: 20 },
    { id: '5', name: 'اللغة الإنجليزية', instructor: 'م. انجلشاوي', status: 'New', progress: 0 },
    { id: '6', name: 'الفلسفة', instructor: 'م. نادر جورج', status: 'New', progress: 0 },
  ],
  subjectPlans: savedState?.subjectPlans || INITIAL_SUBJECT_PLANS,
  setSubjects: (subjects) => set((state) => {
    const newState = { ...state, subjects };
    try { localStorage.setItem('egyflow_student_store', JSON.stringify(newState)); } catch {}
    return newState;
  }),
  toggleSubjectCompletion: (id) => set((state) => {
    const updatedSubjects = state.subjects.map(subject => 
      subject.id === id 
        ? { ...subject, status: (subject.status === 'Completed' ? 'On Track' : 'Completed') as Subject['status'], progress: subject.status === 'Completed' ? (subject.progress || 0) : 100 } 
        : subject
    );
    const newState = { ...state, subjects: updatedSubjects };
    try { localStorage.setItem('egyflow_student_store', JSON.stringify(newState)); } catch {}
    return newState;
  }),
  updateSubjectProgress: (id, progress) => set((state) => {
    const updatedSubjects = state.subjects.map(subject => {
      if (subject.id === id) {
        const newStatus = progress === 100 ? 'Completed' : (progress < 40 ? 'Backlog' : 'On Track');
        return { ...subject, progress, status: newStatus as Subject['status'] };
      }
      return subject;
    });
    const newState = { ...state, subjects: updatedSubjects };
    try { localStorage.setItem('egyflow_student_store', JSON.stringify(newState)); } catch {}
    return newState;
  }),
  setSubjectPlan: (subjectId, plan) => set((state) => {
    const newPlans = { ...state.subjectPlans, [subjectId]: plan };
    const newState = { ...state, subjectPlans: newPlans };
    try { localStorage.setItem('egyflow_student_store', JSON.stringify(newState)); } catch {}
    return newState;
  }),
  toggleRoadmapNode: (subjectId, nodeId) => set((state) => {
    const plan = state.subjectPlans[subjectId] || createDefaultPlanForSubject('المادة');
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

    const newState = {
      subjectPlans: {
        ...state.subjectPlans,
        [subjectId]: { ...plan, roadmap: updatedRoadmap }
      },
      subjects: updatedSubjects
    };
    try { localStorage.setItem('egyflow_student_store', JSON.stringify(newState)); } catch {}
    return newState;
  }),
}));

