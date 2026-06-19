import { NextResponse } from "next/server";
import { credsFromHeaders, generateJson, llmAvailable } from "@/lib/llm";

// Grades a French writing sample against a CEFR target level using the
// configured LLM provider (Anthropic Claude or Google Gemini). Falls back to a
// basic offline estimate when no provider key is set so the app stays usable.

interface GradeBody {
  text: string;
  task: string;
  targetLevel: string;
}

interface GradeResult {
  score: number;
  level: string;
  strengths: string[];
  improvements: string[];
  corrected: string;
}

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer", description: "Overall score 0-100" },
    level: {
      type: "string",
      description: "Estimated CEFR level, e.g. A1, A2, B1, B2",
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      description: "2-4 specific strengths, in English",
    },
    improvements: {
      type: "array",
      items: { type: "string" },
      description: "2-4 specific, actionable improvements, in English",
    },
    corrected: {
      type: "string",
      description: "A corrected/improved version of the learner's French text",
    },
  },
  required: ["score", "level", "strengths", "improvements", "corrected"],
  additionalProperties: false,
} as const;

function offlineFallback(body: GradeBody) {
  const words = body.text.trim().split(/\s+/).filter(Boolean).length;
  const score = Math.min(100, 40 + words * 2);
  return {
    score,
    level: body.targetLevel,
    strengths: [
      `You wrote ${words} words — keep practising regularly.`,
      "You attempted the task in French.",
    ],
    improvements: [
      "Add an ANTHROPIC_API_KEY (Claude) or GEMINI_API_KEY (Gemini) in .env.local for detailed grammar feedback.",
      "Re-read your text aloud to catch agreement and spelling errors.",
    ],
    corrected: body.text,
    fallback: true,
  };
}

export async function POST(req: Request) {
  let body: GradeBody;
  try {
    body = (await req.json()) as GradeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.text?.trim()) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const creds = credsFromHeaders(req);
  if (!llmAvailable(creds)) {
    return NextResponse.json(offlineFallback(body));
  }

  const system = `You are an experienced examiner for the French TEF/TCF exams and a CEFR-certified French teacher.
Grade the learner's writing against the target level ${body.targetLevel}.
Be encouraging but precise. Score on grammar, vocabulary range, spelling/accents, coherence, and task completion.
Write all feedback (strengths/improvements) in English so a beginner can understand, but keep the corrected version in natural French.`;

  const userPrompt = `TASK (in French): ${body.task}

TARGET LEVEL: ${body.targetLevel}

LEARNER'S RESPONSE:
"""
${body.text}
"""

Grade it and return the structured result.`;

  try {
    const result = await generateJson<GradeResult>(
      {
        system,
        user: userPrompt,
        schema: RESULT_SCHEMA,
        maxTokens: 2000,
      },
      creds,
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("Grading failed:", err);
    // Degrade gracefully rather than failing the lesson.
    return NextResponse.json(offlineFallback(body));
  }
}
