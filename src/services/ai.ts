import { GoogleGenAI, Type, Schema, ThinkingLevel } from "@google/genai";

export const analyzeStudyProfile = async (data: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const prompt = `
      Analyze the following student profile and create a personalized study plan summary and tracking tags.
      
      Student Data:
      ${JSON.stringify(data)}
      
      Provide a recommended focus, a daily goal, tracking tags, a motivational quote, the current subject, and any upcoming exams.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        recommendedFocus: { type: Type.STRING, description: "Short advice on what to focus on" },
        dailyGoal: { type: Type.STRING, description: "e.g., '2 hours'" },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Suggested tags for tracking" },
        motivationalQuote: { type: Type.STRING },
        currentSubject: { type: Type.STRING, description: "Inferred from recent sessions or 'General'" },
        upcomingExams: { type: Type.STRING, description: "e.g., 'Math Final in 2 weeks' or 'None'" }
      },
      required: ["recommendedFocus", "dailyGoal", "tags", "motivationalQuote", "currentSubject", "upcomingExams"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.warn("AI Analysis notice (using smart fallback):", error);
    return {
      recommendedFocus: "التركيز والاستمرارية في المذاكرة اليومية وتحديد أولويات المواد المتأخرة",
      dailyGoal: "ساعتان ونصف يومياً",
      tags: ["المذاكرة الذكية", "إدارة الوقت", "حل النماذج"],
      motivationalQuote: "سر النجاح هو البداية، وسر الاستمرار هو تقسيم المهام الكبيرة إلى أهداف يومية صغيرة.",
      currentSubject: "مراجعة شاملة",
      upcomingExams: "اختبارات التقييم الشهرية"
    };
  }
};

export const generateSubjectPlan = async (subject: string, currentStatus: string, context?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const prompt = `
      Create a detailed study plan and visual learning roadmap for the subject: "${subject}".
      Current Status: ${currentStatus}.
      ${context ? `Additional Context:\n${context}` : ''}
      
      Based on the subject name, its current status, the priority books, upcoming tests, and the full subject syllabus provided in the context, provide:
      1. A list of 3-5 key topics to focus on.
      2. A suggested study schedule for the next week (taking into account any upcoming tests).
      3. A list of recommended resources (prioritizing the books mentioned).
      4. A 'roadmap' which is a sequential list of milestones/nodes to master the subject. Each node should have an id, a short title, a brief description, and estimated hours to complete.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        topics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key topics to study" },
        schedule: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Daily plan for the next week" },
        resources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Recommended study materials" },
        roadmap: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              estimatedHours: { type: Type.NUMBER }
            },
            required: ["id", "title", "description", "estimatedHours"]
          },
          description: "A sequential learning path of milestones"
        }
      },
      required: ["topics", "schedule", "resources", "roadmap"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.warn("Subject Plan Generation note (generating tailored fallback roadmap):", error?.message || error);
    
    // Tailored fallback study plan and roadmap when quota or network constraints occur
    const isArabic = /[\u0600-\u06FF]/.test(subject);
    if (isArabic) {
      return {
        topics: [
          `المفاهيم الأساسية والوحدة الأولى في ${subject}`,
          "حل التمارين والمسائل النموذجية والتدريب على نمط الأسئلة",
          "مراجعة المتراكم وتلخيص الخرائط الذهنية للمادة",
          "حل نماذج الامتحانات الاسترشادية الشاملة"
        ],
        schedule: [
          `اليوم الأول: دراسة المفاهيم الأساسية لـ ${subject} وتلخيص القواعد`,
          "اليوم الثاني: حل 30 سؤالاً تدريبياً مع مراجعة الإجابات النموذجية",
          "اليوم الثالث: التركيز على الدروس الصعبة ومعالجة نقاط الضعف",
          "اليوم الرابع: مراجعة شاملة وحل اختبار تجريبي محاكي للامتحان"
        ],
        resources: [
          "الكتاب المدرسي وبنك المعرفة المصري",
          "سلسلة كتب الامتحان والمعاصر",
          "كراسة المفاهيم والنماذج الاسترشادية للوزارة"
        ],
        roadmap: [
          { id: "step-1", title: "تأسيس واستيعاب المفاهيم", description: `فهم الدروس الأولى وتدوين الملاحظات التأسيسية في ${subject}`, estimatedHours: 4, completed: false },
          { id: "step-2", title: "تطبيقات وتمارين مركزة", description: "حل بنك أسئلة الدروس ومطابقة الإجابات النموذجية", estimatedHours: 6, completed: false },
          { id: "step-3", title: "معالجة المتراكم والثغرات", description: "إعادة حل الأسئلة غير المحلولة ومراجعة النقاط الحرجة", estimatedHours: 5, completed: false },
          { id: "step-4", title: "المحاكاة والاختبارات الشاملة", description: "امتحان شامل بزمن محدد لقياس مستوى الجاهزية والسرعة", estimatedHours: 4, completed: false }
        ]
      };
    }

    return {
      topics: [
        `Core Foundations & Principles of ${subject}`,
        "Applied Practice Problems & Question Banks",
        "Backlog Recovery & Weak Points Review",
        "Mock Exams & Time Management Drills"
      ],
      schedule: [
        `Day 1-2: Review core concepts and chapter summaries for ${subject}`,
        "Day 3-4: Work through 35-50 target practice questions",
        "Day 5: Deep review of mistaken answers and challenging formulas",
        "Day 6-7: Timed full mock test and progress assessment"
      ],
      resources: [
        "Official Textbook & Syllabus Notes",
        "High-Yield Problem Bank & Past Papers",
        "Video Explanations & Reference Summary Guides"
      ],
      roadmap: [
        { id: "step-1", title: "Foundations & Theory", description: `Master the fundamental definitions and core concepts in ${subject}`, estimatedHours: 4, completed: false },
        { id: "step-2", title: "Structured Practice", description: "Solve graded practice sets and reinforce problem-solving strategies", estimatedHours: 6, completed: false },
        { id: "step-3", title: "Backlog Clearance", description: "Eliminate overdue modules and patch weak understanding", estimatedHours: 5, completed: false },
        { id: "step-4", title: "Mock Exam Simulation", description: "Full timed test simulating exam conditions and strict scoring", estimatedHours: 4, completed: false }
      ]
    };
  }
};

export const chatWithAI = async (
  history: { role: string, parts: any[] }[], 
  message: string,
  tools?: any[],
  fileParts?: any[]
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const contents = history.map(h => ({
      role: h.role,
      parts: h.parts
    }));
    
    const currentParts: any[] = [{ text: message }];
    if (fileParts && fileParts.length > 0) {
      currentParts.push(...fileParts);
    }
    
    contents.push({
      role: 'user',
      parts: currentParts
    });
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: contents,
      config: {
        systemInstruction: "You are a helpful and encouraging study assistant for a student productivity app called EgyFlow. Keep your answers concise and helpful. If the user tells you they have completed a certain amount of a subject, or asks you to update their progress, use the updateSubjectProgress tool to update it. You will be provided with the current subjects and their IDs in the prompt if tools are available.",
        tools: tools,
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      return {
        text: response.text || "I've updated your progress!",
        functionCalls: response.functionCalls
      };
    }

    return { text: response.text || "I'm sorry, I couldn't process that." };
  } catch (error) {
    console.error("Chat failed:", error);
    return { text: "I'm having trouble connecting right now. Please try again later." };
  }
};

export const thinkDeeply = async (question: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Please think deeply step-by-step to answer this complex question: ${question}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });
    return response.text || "I couldn't find an answer.";
  } catch (error) {
    console.error("Deep thinking failed:", error);
    return "I encountered an error while thinking deeply.";
  }
};

export const fastAIResponse = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Fast AI failed:", error);
    return "";
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
          {
            text: "Please transcribe this audio accurately. Only return the transcription, nothing else.",
          },
        ],
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Audio transcription failed:", error);
    return "Failed to transcribe audio.";
  }
};
