import { GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { AppError } from "../errors";

const apiKey = config.geminiApiKey || config.anthropicApiKey;
if (!apiKey) {
  console.warn("No GEMINI_API_KEY or ANTHROPIC_API_KEY detected in configuration.");
}

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({
  apiKey: apiKey,
});

export type RoadmapPhase = {
  phase: number;
  title: string;
  estimatedTime: string;
  description: string;
  resources: {
    type: "official_docs" | "youtube" | "course" | "article" | "practice";
    title: string;
    url: string;
    paid: boolean;
  }[];
  practiceProject: string;
};

export async function generateTaskRoadmap(task: {
  title: string;
  description?: string | null;
  status: string;
}) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a structured learning roadmap for this task.

Task title: ${task.title}
Task description: ${task.description || "No extra description"}
Current status: ${task.status}

Return EXACTLY this JSON structure:
{
  "phases": [
    {
      "phase": 1,
      "title": "string",
      "estimatedTime": "string",
      "description": "string",
      "resources": [
        { "type": "official_docs|youtube|course|article|practice", "title": "string", "url": "string", "paid": false }
      ],
      "practiceProject": "string"
    }
  ]
}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
        systemInstruction:
          "You are a senior learning architect. Prefer official documentation links when they exist. Include a balanced mix of free and paid resources.",
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Empty response received from Gemini API");
    }

    const parsed = JSON.parse(text) as { phases?: RoadmapPhase[] };
    if (!Array.isArray(parsed.phases)) {
      throw new Error("Missing phases array in parsed JSON response");
    }
    return parsed;
  } catch (error: any) {
    console.error("Error generating roadmap via Gemini:", error);
    throw new AppError(
      502,
      `AI response could not be generated: ${error.message || error}`,
      "AI_GENERATE_FAILED"
    );
  }
}

export async function generateAICoachResponse(params: {
  taskTitle: string;
  taskDescription?: string | null;
  message: string;
  history: Array<{ role: "user" | "model"; text: string }>;
}) {
  try {
    // Map custom message history and append current message to Google Gen AI contents structure
    const contents = [
      ...params.history.map((msg) => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.text }],
      })),
      {
        role: "user",
        parts: [{ text: params.message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        temperature: 0.7,
        systemInstruction: `You are a supportive, expert AI study coach and mentor inside the NewDay workspace app.
You are helping the user learn and accomplish a specific task.
Task Title: "${params.taskTitle}"
Task Description: "${params.taskDescription || "No description provided."}"

Guidelines:
- Keep your answers concise, clear, and direct.
- Give practical advice, code snippets if helpful, and encouragement.
- Act as a senior developer mentoring a junior colleague.`,
      },
    });

    const text = response.text || "I'm sorry, I couldn't generate a response at this time.";
    return { text };
  } catch (error: any) {
    console.error("Error generating AI coach response:", error);
    throw new AppError(502, `AI Coach chat failed: ${error.message || error}`, "AI_COACH_FAILED");
  }
}

export async function generateChatAssistantResponse(params: {
  message: string;
  recentMessages: Array<{ senderId: string; userName: string; content: string; createdAt: string }>;
}) {
  try {
    // Build context from recent messages (last 10)
    const contextMessages = params.recentMessages
      .slice(-10)
      .map((msg) => `${msg.userName}: ${msg.content}`)
      .join("\n");

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `Recent chat context:\n${contextMessages}\n\nCurrent message: ${params.message}`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        temperature: 0.7,
        systemInstruction: `You are a professional assistant embedded in NewDay, a task management platform. You help teams draft documents, summarize discussions, brainstorm, and answer questions. Be concise and professional.`,
      },
    });

    const text = response.text || "I'm sorry, I couldn't generate a response at this time.";
    return { reply: text };
  } catch (error: any) {
    console.error("Error generating chat assistant response:", error);
    throw new AppError(
      502,
      `AI Chat Assistant failed: ${error.message || error}`,
      "AI_CHAT_ASSISTANT_FAILED"
    );
  }
}
