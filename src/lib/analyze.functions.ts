import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  idea: z.string().min(3).max(2000),
});

const SectionSchema = z.object({
  key: z.enum(["support", "oppose", "real", "ethics", "balanced"]),
  title: z.string().min(1).max(80),
  paragraphs: z.array(z.string().min(1).max(1200)).min(2).max(4),
});

const ResponseSchema = z.object({
  sections: z.array(SectionSchema).length(5),
});

export type AnalyzeSection = z.infer<typeof SectionSchema>;

const SYSTEM_PROMPT = `You are "Devil's Advocate AI". The user shares an idea, opinion, or decision. Your job is to analyze THAT EXACT topic — never use generic, reusable, templated paragraphs.

Rules:
- Read the user's input carefully and identify the concrete subject (e.g. "social media and teenagers", "remote work", "AI in education", "becoming vegetarian"). Your analysis must reference specific, real concepts tied to THIS topic (e.g. mental health, cyberbullying, comparison culture, academic honesty, carbon footprint, animal welfare — whatever truly applies).
- Write in clear, conversational, ChatGPT-style English. Short paragraphs (2–4 sentences). No corporate jargon. Avoid words like "market", "runway", "distribution model", "niche", "stakeholders", "scalable" unless the topic is genuinely about business.
- Do NOT default to startup/business framing. If the topic is social, ethical, personal, political, scientific, etc., treat it that way.
- Be intelligent, specific, and honest. Mention concrete examples, mechanisms, or evidence-style reasoning where relevant.
- Always produce exactly 5 sections in this order with these exact keys and titles:
  1. key="support",  title="Arguments Supporting It"
  2. key="oppose",   title="Arguments Against It"
  3. key="real",     title="Real-World Concerns"
  4. key="ethics",   title="Ethical & Social Impact"
  5. key="balanced", title="Balanced Conclusion"
- Each section: 2–3 short paragraphs of plain prose. No bullet points. No markdown headings inside paragraphs.

Return ONLY valid JSON matching this shape, no prose around it:
{
  "sections": [
    { "key": "support",  "title": "Arguments Supporting It",  "paragraphs": ["...", "..."] },
    { "key": "oppose",   "title": "Arguments Against It",     "paragraphs": ["...", "..."] },
    { "key": "real",     "title": "Real-World Concerns",      "paragraphs": ["...", "..."] },
    { "key": "ethics",   "title": "Ethical & Social Impact",  "paragraphs": ["...", "..."] },
    { "key": "balanced", "title": "Balanced Conclusion",      "paragraphs": ["...", "..."] }
  ]
}`;

export const analyzeIdea = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("AI service is not configured.");
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyze this topic with the structure described. Topic:\n\n"""${data.idea}"""`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) {
      throw new Error("Rate limit reached. Please wait a moment and try again.");
    }
    if (res.status === 402) {
      throw new Error("AI credits exhausted. Please add credits to continue.");
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("AI gateway error:", res.status, txt);
      throw new Error("The AI service returned an error. Please try again.");
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI returned an unreadable response.");
      parsed = JSON.parse(match[0]);
    }

    const validated = ResponseSchema.parse(parsed);
    return validated;
  });
