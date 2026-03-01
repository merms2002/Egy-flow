import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeStudyProfile = async (data: any) => {
  try {
    const prompt = `
      Analyze the following student profile and create a personalized study plan summary and tracking tags.
      
      Student Data:
      ${JSON.stringify(data)}
      
      Return a JSON object with this structure:
      {
        "recommendedFocus": "string (short advice)",
        "dailyGoal": "string (e.g., '2 hours')",
        "tags": ["string", "string"] (suggested tags for tracking),
        "motivationalQuote": "string",
        "currentSubject": "string (inferred from recent sessions or 'General')",
        "upcomingExams": "string (e.g., 'Math Final in 2 weeks' or 'None')"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      recommendedFocus: "Consistency is key!",
      dailyGoal: "1 hour",
      tags: ["General Study"],
      motivationalQuote: "Start where you are. Use what you have. Do what you can."
    };
  }
};
