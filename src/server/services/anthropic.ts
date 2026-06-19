import Groq from "groq-sdk";
import { config } from "../config";
import { AppError } from "../errors";

const apiKey = process.env.GROQ_API_KEY || config.geminiApiKey || config.anthropicApiKey;
if (!apiKey) {
  console.warn("No GROQ_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY detected in configuration.");
}

// Initialize the Groq SDK
const groq = new Groq({ apiKey });

// System prompts for each AI feature
const systemPrompts: Record<string, string> = {
  task_breakdown:
    "You are a senior project manager. The user has a task titled: [taskTitle] with description: [taskDescription]. Break this task down into clear, actionable subtasks ordered by logical sequence. Give each subtask a suggested time estimate.",
  summarize:
    "You are an expert at summarizing documents clearly and concisely. The user is working on a task titled: [taskTitle]. Summarize the following document or content into clear, structured bullet points highlighting the key points, main arguments, and conclusions.",
  study_notes:
    "You are an expert educator. The user is working on a task titled: [taskTitle]. Convert the provided content into well-structured study notes with headings, bullet points, key terms, and a brief summary at the end.",
  explain:
    "You are a clear and patient teacher. The user is working on: [taskTitle]. Explain the concept or topic they describe in plain, simple language. Use analogies and examples where helpful. Assume no prior knowledge.",
  code_explain:
    "You are a senior software engineer and mentor. The user is working on: [taskTitle]. Explain the code they provide clearly — what it does, how it works line by line if needed, and any notable patterns or potential issues.",
  error_explain:
    "You are a senior software engineer. The user is working on: [taskTitle]. Analyze the error message or code they provide. Explain what the error means, what is causing it, and provide a clear fix with a corrected code example.",
  brainstorm:
    "You are a creative thinking partner. The user is working on: [taskTitle]. Help them brainstorm ideas, think through approaches, or explore possibilities. Be generative and expansive, then help narrow down to the most promising directions.",
  resume:
    "You are an expert career coach and resume writer. The user is working on: [taskTitle]. Review and improve the resume content they provide. Strengthen language, improve clarity, highlight impact with metrics where possible, and tailor it to sound professional and compelling.",
  cover_letter:
    "You are an expert career coach and professional writer. The user is working on: [taskTitle]. Write or improve a compelling cover letter based on the information they provide. Make it specific, confident, and genuinely engaging — not generic.",
  interview:
    "You are an expert interview coach. The user is working on: [taskTitle]. Help them prepare for their interview. If they share a job description or role, generate likely interview questions and strong example answers using the STAR method.",
};

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
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a senior learning architect. Prefer official documentation links when they exist. Include a balanced mix of free and paid resources.",
        },
        {
          role: "user",
          content: `Create a structured learning roadmap for this task.

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
        },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("Empty response received from Groq API");
    }

    const parsed = JSON.parse(text) as { phases?: RoadmapPhase[] };
    if (!Array.isArray(parsed.phases)) {
      throw new Error("Missing phases array in parsed JSON response");
    }
    return parsed;
  } catch (error: any) {
    console.error("Error generating roadmap via Groq:", error);
    throw new AppError(
      error?.status || 502,
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
    // Map custom message history and append current message to Groq messages structure
    const messages = [
      {
        role: "system" as const,
        content: `You are a supportive, expert AI study coach and mentor inside the NewDay workspace app.
You are helping the user learn and accomplish a specific task.
Task Title: "${params.taskTitle}"
Task Description: "${params.taskDescription || "No description provided."}"

Guidelines:
- Keep your answers concise, clear, and direct.
- Give practical advice, code snippets if helpful, and encouragement.
- Act as a senior developer mentoring a junior colleague.`,
      },
      ...params.history.map((msg) => ({
        role: (msg.role === "model" ? "assistant" : "user") as "assistant" | "user",
        content: msg.text,
      })),
      {
        role: "user" as const,
        content: params.message,
      },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
    });

    const text =
      completion.choices[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response at this time.";
    return { text };
  } catch (error: any) {
    console.error("Error generating AI coach response:", error);
    throw new AppError(
      error?.status || 502,
      `AI Coach chat failed: ${error.message || error}`,
      "AI_COACH_FAILED"
    );
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

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a professional assistant embedded in NewDay, a task management platform. You help teams draft documents, summarize discussions, brainstorm, and answer questions. Be concise and professional.",
        },
        {
          role: "user",
          content: `Recent chat context:\n${contextMessages}\n\nCurrent message: ${params.message}`,
        },
      ],
      temperature: 0.7,
    });

    const text =
      completion.choices[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response at this time.";
    return { reply: text };
  } catch (error: any) {
    console.error("Error generating chat assistant response:", error);
    throw new AppError(
      error?.status || 502,
      `AI Chat Assistant failed: ${error.message || error}`,
      "AI_CHAT_ASSISTANT_FAILED"
    );
  }
}

export async function getLearningCoachResponse(params: {
  feature: string;
  userRequest: string;
  taskTitle: string;
  taskDescription?: string | null;
  documentText?: string;
}) {
  try {
    const { feature, userRequest, taskTitle, taskDescription, documentText } = params;

    // Get the system prompt for the selected feature
    const basePrompt = systemPrompts[feature] || systemPrompts.explain;

    // Replace placeholders in the system prompt
    let systemInstruction = basePrompt
      .replace(/\[taskTitle\]/g, taskTitle)
      .replace(/\[taskDescription\]/g, taskDescription || "No description provided.");

    // Build the user message
    let userMessage = userRequest;
    if (documentText) {
      userMessage = `Document content:\n${documentText}\n\nUser request: ${userRequest}`;
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content || "I could not generate a response.";
    return { text };
  } catch (error: any) {
    console.error("Groq Error Status:", error?.status);
    console.error("Groq Error Message:", error?.message);
    console.error("Full Groq Error:", error);
    throw new AppError(
      error?.status || 500,
      error?.message || "Groq request failed",
      "AI_LEARNING_COACH_FAILED"
    );
  }
}
