// api/score.js — Vercel Serverless Function
// AI evaluates a challenger question answer and generates a follow-up (Gemini 2.5 Pro)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  try {
    const { question, answer, context, category, competitorContext, horizonContext } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "Missing question or answer" });
    }

    const prompt = `You are a ruthless competitive strategy evaluator. A Product Manager is defending their product strategy against a tough challenger question. Your job is to evaluate their answer with ZERO mercy and then ask a pointed follow-up that pushes them harder.

## The Strategic Context
${horizonContext || "No additional context provided."}

## Competitive Intelligence
${competitorContext || "No competitive data provided."}

## Category Being Tested
${category || "General strategy"}

## The Challenger Question
${question}

## Why This Question Matters
${context || "Critical strategic concern."}

## The PM's Answer
${answer}

## Your Task
Evaluate this answer and respond with ONLY valid JSON in this exact format:
{
  "score": <number 1-5>,
  "label": "<one of: CRITICAL GAP | WEAK DEFENSE | PARTIAL DEFENSE | STRONG DEFENSE | BULLETPROOF>",
  "assessment": "<2-3 sentences evaluating the quality of their answer. Be specific about what's missing, what's hand-waving, or what's actually defensible. Reference specific competitors or market dynamics if relevant.>",
  "gaps": ["<specific gap or weakness in their answer>", "<another gap if applicable>"],
  "followUp": "<A pointed follow-up question that digs deeper into the weakest part of their answer. This should be MORE specific than the original question, not less. If they gave a strong answer, probe the edges of their defense. If weak, go for the jugular.>",
  "followUpContext": "<Why this follow-up matters — what competitive or strategic risk it exposes>"
}

SCORING GUIDE:
1 = CRITICAL GAP: No real answer, pure deflection, or dangerously wrong. This would lose a competitive deal.
2 = WEAK DEFENSE: Vague, hand-wavy, or relies on assumptions without evidence. A smart competitor would tear this apart.
3 = PARTIAL DEFENSE: Has the right idea but lacks specificity, data, or fails to address key competitive dynamics.
4 = STRONG DEFENSE: Specific, evidence-based, addresses competitive reality. Would hold up in a board meeting.
5 = BULLETPROOF: Airtight with data, competitive awareness, and a clear action plan. Turns the threat into an advantage.

Be tough but fair. Most answers should score 2-3. A 5 should be rare.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
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
                text: "You are a ruthless but fair competitive strategy evaluator. Always respond with valid JSON only — no markdown, no code blocks, just raw JSON. Never give easy passes — most answers deserve a 2 or 3.",
              },
            ],
          },
          generationConfig: {
            temperature: 0.7,
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
    const evaluation = JSON.parse(jsonStr.trim());

    return res.status(200).json(evaluation);
  } catch (err) {
    console.error("Scoring error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
