export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const idea = body?.idea;

    if (!idea) return res.status(400).json({ error: "No idea provided" });

    const systemPrompt = `You are Devil's Advocate AI. Respond ONLY with a valid JSON object (no markdown, no backticks, no preamble):
{
  "counterarguments": ["...", "...", "..."],
  "risks": ["...", "...", "..."],
  "ethical_concerns": ["...", "...", "..."],
  "alternative_perspectives": ["...", "...", "..."],
  "most_dangerous_assumption": "...",
  "balanced_summary": "..."
}
Each array must have exactly 3 items. Each item must be 10-18 words max. Be ruthlessly concise.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: idea }
        ],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: "No response from Groq", details: data });
    }

    const raw = data.choices[0].message.content || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}