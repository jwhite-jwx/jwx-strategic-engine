// api/enhance.js — Vercel Serverless Function
// Takes a PM's draft field + full strategy context and returns an improved version (Gemini 2.5 Flash)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  try {
    const { fieldLabel, fieldHint, draft, fullContext } = req.body;

    if (!draft || !draft.trim()) {
      return res.status(400).json({ error: "Missing draft text" });
    }
    if (!fieldLabel) {
      return res.status(400).json({ error: "Missing fieldLabel" });
    }

    const prompt = `You are a sharp, senior product strategy editor helping a Product Manager write an investment-grade strategy document. The PM has drafted one field and wants you to make it better.

## Field Being Edited
**${fieldLabel}**
${fieldHint ? `Guidance for this field: ${fieldHint}` : ""}

## Full Strategy Document Context
The PM has written the following across the entire document. Use this context so your edit is consistent with what they've said elsewhere. Do NOT edit any of these fields — only the draft at the bottom.

${fullContext || "(No other sections filled in yet.)"}

## PM's Draft for "${fieldLabel}"
${draft}

## Your Task
Rewrite ONLY the draft above so it is:
- Sharper and more specific — replace vague claims with concrete ones
- More strategically rigorous — reads like a senior PM presenting to execs
- Free of hand-waving, buzzwords, and marketing fluff
- Concrete with numbers, company names, or specific mechanisms where the original context supports it
- The same length or SHORTER — never pad

## CRITICAL RULES
- DO NOT invent facts, numbers, companies, or claims that aren't supported by the PM's draft or the full context above
- DO NOT change the core intent or argument — this is an edit, not a rewrite
- If the PM's draft is already strong, make MINIMAL changes
- Preserve any specific data points, company names, or numbers the PM included verbatim
- Do NOT add generic filler like "In today's fast-paced market" or "As we all know"
- Keep it plain prose — no headings, no bullet points inside the answer (unless the original had them)

Respond with ONLY valid JSON:
{
  "enhanced": "<the improved draft>",
  "rationale": "<one sentence explaining the main thing you changed and why>"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          systemInstruction: {
            parts: [
              {
                text: "You are a ruthless but precise product strategy editor. Always respond with valid JSON only — no markdown, no code blocks, just raw JSON. Make edits tighter, more specific, and more rigorous without inventing facts.",
              },
            ],
          },
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Gemini API error: ${errText}` });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: "No content in Gemini response", raw: data });
    }

    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/```\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const enhancement = JSON.parse(jsonStr.trim());

    return res.status(200).json(enhancement);
  } catch (err) {
    console.error("Enhance error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
