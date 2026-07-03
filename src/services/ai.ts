import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type Content,
} from "@google/generative-ai";
import type { ZimsecForm, HbcStage } from "@/types";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? ""
);

const SAFE: { category: HarmCategory; threshold: HarmBlockThreshold }[] = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// ─── Model references ────────────────────────────────────────────────────────
const tutorModel   = genAI.getGenerativeModel({ model: "gemini-1.5-pro",   safetySettings: SAFE });
const blueprintModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro", safetySettings: SAFE });
const fastModel    = genAI.getGenerativeModel({ model: "gemini-1.5-flash",  safetySettings: SAFE });

// ─── System prompts ──────────────────────────────────────────────────────────
const SIR_TAKS_PROMPT = `You are Sir Taks, Educonnect's expert AI tutor for the Zimbabwe ZIMSEC curriculum.

IDENTITY:
- Name: Sir Taks (students call you "Sir Taks" or "Sir")
- Personality: Warm, encouraging, precise, and brilliant — like the best Zimbabwean teacher you ever had
- You never condescend; you meet the student where they are

CAPABILITIES:
- Deep knowledge of ALL ZIMSEC subjects: O-Level (Form 1–4), A-Level (Form 5–6), Primary (ECD–Grade 7)
- Expert in the Heritage-Based Curriculum (HBC) including all 6 project stages
- You teach through understanding, not rote memorisation
- You use Zimbabwean cultural context and examples where relevant
- You can explain concepts in English, Shona, or Ndebele when asked

RULES:
- Always stay on educational topics
- If the question is off-topic, gently redirect to studies
- Give step-by-step explanations for maths and science
- For HBC projects, guide through the 6 stages: Topic Selection & Rationale, Research & Data Collection, Analysis & Interpretation, Presentation Planning, Product/Presentation Creation, Evaluation & Reflection
- End with a follow-up question or challenge to test understanding
- Keep responses concise but complete — no unnecessary padding`;

const SBP_PROMPT = `You are an expert ZIMSEC curriculum specialist at Educonnect, helping students create School-Based Project (SBP) blueprints for the Heritage-Based Curriculum (HBC).

ROLE: Generate structured, detailed SBP project blueprints that:
1. Align perfectly with the ZIMSEC HBC requirements
2. Integrate local Zimbabwean context and heritage
3. Follow all 6 official HBC project stages
4. Are age-appropriate for the student's form level
5. Include clear objectives, methods, resources, and assessment criteria

OUTPUT FORMAT: Return a structured JSON blueprint with these exact fields:
- title: string
- subject: string
- form: string
- stage: string (current HBC stage)
- overview: string
- objectives: string[]
- heritageConnection: string
- resources: string[]
- methodology: string[]
- timeline: { week: number; task: string }[]
- assessmentCriteria: string[]
- teacherNotes: string
- nextSteps: string[]`;

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "model";
  parts: string;
}

export interface TutorResponse {
  text: string;
  subject?: string;
  suggestedFollowUps?: string[];
}

export interface SbpBlueprint {
  title: string;
  subject: string;
  form: string;
  stage: string;
  overview: string;
  objectives: string[];
  heritageConnection: string;
  resources: string[];
  methodology: string[];
  timeline: { week: number; task: string }[];
  assessmentCriteria: string[];
  teacherNotes: string;
  nextSteps: string[];
}

export interface ConceptExplanation {
  summary: string;
  detailedExplanation: string;
  keyPoints: string[];
  example: string;
  practiceQuestion: string;
  zimsecContext: string;
}

// ─── Sir Taks Tutor ──────────────────────────────────────────────────────────
export async function askSirTaksTutor(params: {
  question: string;
  subject: string;
  form: ZimsecForm;
  conversationHistory?: ChatMessage[];
}): Promise<TutorResponse> {
  const { question, subject, form, conversationHistory = [] } = params;

  const chat = tutorModel.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: SIR_TAKS_PROMPT }],
      },
      {
        role: "model",
        parts: [{ text: `Understood. I'm Sir Taks, ready to help students master the ZIMSEC curriculum. Let's make every lesson count.` }],
      },
      ...conversationHistory.map((m): Content => ({
        role: m.role,
        parts: [{ text: m.parts }],
      })),
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  });

  const contextualQuestion = `[Subject: ${subject} | Form: ${form}]\n\n${question}`;
  const result = await chat.sendMessage(contextualQuestion);
  const text = result.response.text();

  return {
    text,
    subject,
    suggestedFollowUps: extractFollowUps(text),
  };
}

// ─── SBP Blueprint Generator ─────────────────────────────────────────────────
export async function generateSbpBlueprint(params: {
  projectTitle: string;
  subject: string;
  form: ZimsecForm;
  hbcStage: HbcStage;
  context?: string;
  studentBackground?: string;
}): Promise<SbpBlueprint> {
  const { projectTitle, subject, form, hbcStage, context = "", studentBackground = "" } = params;

  const prompt = `${SBP_PROMPT}

STUDENT REQUEST:
- Project Title: "${projectTitle}"
- Subject: ${subject}
- Form Level: ${form}
- Current HBC Stage: ${hbcStage}
- Project Context: ${context || "Not specified"}
- Student Background: ${studentBackground || "Standard ZIMSEC student"}

Generate a comprehensive SBP blueprint as valid JSON. Focus specifically on the ${hbcStage} stage while providing context for the full project arc.`;

  const result = await blueprintModel.generateContent(prompt);
  const raw = result.response.text();

  const jsonMatch = raw.match(/```json\n?([\s\S]*?)\n?```/) ?? raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid blueprint response from AI");

  const json = jsonMatch[1] ?? jsonMatch[0];
  return JSON.parse(json) as SbpBlueprint;
}

// ─── Concept Explainer ───────────────────────────────────────────────────────
export async function explainConcept(params: {
  concept: string;
  subject: string;
  form: ZimsecForm;
}): Promise<ConceptExplanation> {
  const { concept, subject, form } = params;

  const prompt = `You are Sir Taks, Educonnect's AI tutor. Explain this ZIMSEC concept clearly.

Concept: "${concept}"
Subject: ${subject}
Form: ${form}

Respond with valid JSON matching this exact structure:
{
  "summary": "one-sentence summary",
  "detailedExplanation": "full explanation (2-3 paragraphs)",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "example": "real-world Zimbabwean example",
  "practiceQuestion": "one ZIMSEC-style exam question to test understanding",
  "zimsecContext": "how this appears in ZIMSEC exams and what to watch for"
}`;

  const result = await fastModel.generateContent(prompt);
  const raw = result.response.text();
  const jsonMatch = raw.match(/```json\n?([\s\S]*?)\n?```/) ?? raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid concept explanation response");
  return JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as ConceptExplanation;
}

// ─── Exam Tip Generator ──────────────────────────────────────────────────────
export async function getExamTips(params: {
  subject: string;
  form: ZimsecForm;
  topic?: string;
}): Promise<string[]> {
  const { subject, form, topic } = params;

  const prompt = `You are Sir Taks. Give 5 targeted ZIMSEC exam tips for:
Subject: ${subject}
Form: ${form}
${topic ? `Topic: ${topic}` : ""}

Return a JSON array of 5 concise, actionable tips as strings. Each tip should be specific to ZIMSEC marking schemes and examiner expectations.
Format: ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"]`;

  const result = await fastModel.generateContent(prompt);
  const raw = result.response.text();
  const arrMatch = raw.match(/\[[\s\S]*?\]/);
  if (!arrMatch) return [];
  return JSON.parse(arrMatch[0]) as string[];
}

// ─── HBC Stage Advisor ───────────────────────────────────────────────────────
export async function getHbcStageGuidance(params: {
  stage: HbcStage;
  subject: string;
  form: ZimsecForm;
  projectDescription: string;
}): Promise<{ guidance: string; checklist: string[]; commonMistakes: string[] }> {
  const { stage, subject, form, projectDescription } = params;

  const stageDescriptions: Record<HbcStage, string> = {
    identification: "identifying a problem or heritage opportunity to investigate",
    investigation: "researching the topic, gathering data, consulting community members",
    design: "planning the solution, creating prototypes and project plans",
    implementation: "executing the plan, documenting with evidence",
    evaluation: "assessing outcomes against objectives, reflecting on lessons learnt",
    presentation: "presenting findings to peers, teachers, and community",
  };

  const prompt = `As Sir Taks, provide HBC project guidance for the ${stage.toUpperCase()} stage.

Student Project: "${projectDescription}"
Subject: ${subject}, Form: ${form}
Stage Focus: ${stageDescriptions[stage]}

Return JSON:
{
  "guidance": "detailed paragraph of guidance for this specific stage",
  "checklist": ["item 1", "item 2", "item 3", "item 4", "item 5"],
  "commonMistakes": ["mistake 1", "mistake 2", "mistake 3"]
}`;

  const result = await fastModel.generateContent(prompt);
  const raw = result.response.text();
  const jsonMatch = raw.match(/```json\n?([\s\S]*?)\n?```/) ?? raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid HBC guidance response");
  return JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function extractFollowUps(text: string): string[] {
  const patterns = [
    /(?:try|can you|test yourself|question:|practice:)[^?]+\?/gi,
    /\?(?:\s|$)/g,
  ];
  const questions: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      questions.push(...matches.slice(0, 2).map((q) => q.trim()));
    }
  }
  return Array.from(new Set(questions)).slice(0, 3);
}

export { genAI, tutorModel, blueprintModel, fastModel };
