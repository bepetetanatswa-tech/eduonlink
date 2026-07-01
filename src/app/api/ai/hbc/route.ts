import { GoogleGenerativeAI } from "@google/generative-ai";

const STAGE_DEFS: Record<number, { name: string; focus: string }> = {
  1: { name: "Topic Selection & Rationale", focus: "Is the topic clearly defined? Is the heritage connection to Zimbabwe explicit? Is the rationale personal and convincing?" },
  2: { name: "Research & Data Collection", focus: "Are multiple sources cited? Is primary research (interviews, observation) mentioned? Is methodology described? Are Zimbabwean sources included?" },
  3: { name: "Analysis & Interpretation", focus: "Does the student go beyond facts to analyse meaning? Are patterns identified? Is the heritage significance interpreted, not just described?" },
  4: { name: "Presentation Planning", focus: "Is there a clear structure outlined? Are visual/multimedia elements planned? Is the audience considered?" },
  5: { name: "Product/Presentation Creation", focus: "Does the product reflect genuine student effort? Is heritage content accurately presented? Is it creative and original?" },
  6: { name: "Evaluation & Reflection", focus: "Is the reflection honest and personal? Does the student identify what they learned? Are both strengths and weaknesses acknowledged?" },
};

const FEEDBACK_SYSTEM = `You are Sir Taks, AI guide for ZIMSEC Heritage-Based Curriculum (HBC) projects.

CRITICAL: You are a REVIEWER — never a writer. Do NOT generate project content or rewrite the student's work.

Your review format:
**What's working well:** (2-3 specific points from what the student wrote)
**Areas to strengthen:** (2-3 questions pointing to gaps — ask, don't tell)
**ZIMSEC rubric alignment:** (brief note on what the examiner will look for)
**Your next steps:** (2-3 actionable questions the student should answer in revision)

Keep total response under 250 words. Be specific to the actual submission.`;

const BLUEPRINT_SYSTEM = `You are Sir Taks, AI guide for ZIMSEC Heritage-Based Curriculum (HBC) projects.

Your role here is to generate a PLANNING BLUEPRINT — a structured framework the student will use to plan and write their OWN content. You do NOT write the project for them.

A blueprint is:
✓ A set of guiding questions the student must answer themselves
✓ A suggested structure/outline with empty sections
✓ Research source suggestions (types of sources, not the content)
✓ ZIMSEC rubric criteria they must meet for this stage
✓ Tips for making their own work stronger

A blueprint is NOT:
✗ Written content for any section
✗ Sample paragraphs or sentences
✗ Completed research or analysis

Format clearly with headers. Use [YOUR ANSWER HERE] placeholders wherever the student fills in content. Keep it practical and specific to Zimbabwe's context.`;

export async function POST(req: Request) {
  try {
    const { mode, stageNumber, stageContent, projectTitle, subject, projectType } = await req.json() as {
      mode: "feedback" | "blueprint";
      stageNumber: number;
      stageContent?: string;
      projectTitle: string;
      subject: string;
      projectType?: string;
    };

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "placeholder_set_in_vercel") {
      return Response.json({ error: "AI service not configured" }, { status: 503 });
    }

    const stageDef = STAGE_DEFS[stageNumber];
    if (!stageDef) return Response.json({ error: "Invalid stage" }, { status: 400 });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    if (mode === "blueprint") {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction: BLUEPRINT_SYSTEM });

      const prompt = `Generate a PLANNING BLUEPRINT for Stage ${stageNumber}: ${stageDef.name}

Project details:
- Title/Topic: ${projectTitle}
- Subject area: ${subject}
- Project type: ${projectType ?? "Heritage-Based Curriculum project"}

Stage focus: ${stageDef.focus}

Create a practical planning blueprint with:
1. What this stage requires (ZIMSEC criteria)
2. Guided questions the student must answer themselves (use [YOUR ANSWER HERE] placeholders)
3. Suggested structure with empty sections
4. Research tips specific to Zimbabwe context for this topic
5. Checklist of what the final stage submission must include

Remember: This is Zimbabwe ZIMSEC context — suggest Zimbabwean sources, examples, and research methods.`;

      const result = await model.generateContent(prompt);
      return Response.json({ result: result.response.text(), mode: "blueprint" });
    }

    // Feedback mode
    if (!stageContent?.trim()) {
      return Response.json({ error: "No content to review" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction: FEEDBACK_SYSTEM });

    const prompt = `Project: "${projectTitle}" | Subject: ${subject}
Stage ${stageNumber} — ${stageDef.name}
Rubric focus: ${stageDef.focus}

Student's submission:
---
${stageContent}
---

Review this submission. Guide and question — do NOT rewrite or give away the answers.`;

    const result = await model.generateContent(prompt);
    return Response.json({ result: result.response.text(), mode: "feedback" });
  } catch (err) {
    console.error("[AI HBC]", err);
    return Response.json({ error: "AI service error" }, { status: 500 });
  }
}
