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
      model: "gemini-3-flash-preview",
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
    console.error("AI Analysis failed:", error);
    return {
      recommendedFocus: "Consistency is key!",
      dailyGoal: "1 hour",
      tags: ["General Study"],
      motivationalQuote: "Start where you are. Use what you have. Do what you can.",
      currentSubject: "General",
      upcomingExams: "None"
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
      model: "gemini-3-flash-preview",
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
    console.error("Subject Plan Generation failed:", error);
    return {
      topics: ["Review basics", "Practice problems"],
      schedule: ["Day 1: Read Chapter 1", "Day 2: Exercises"],
      resources: ["Textbook", "Online notes"],
      roadmap: [
        { id: "1", title: "Introduction", description: "Understand the basic concepts", estimatedHours: 2 },
        { id: "2", title: "Core Principles", description: "Dive deeper into the main theories", estimatedHours: 4 },
        { id: "3", title: "Practice & Review", description: "Apply what you've learned", estimatedHours: 3 }
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
      model: "gemini-3.1-flash-lite-preview",
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
      model: "gemini-3-flash-preview",
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
