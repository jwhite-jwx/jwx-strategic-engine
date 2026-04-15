// api/product-title.js — Vercel Serverless Function
// Takes the full horizonData (Working Backwards strategy) and returns a short
// product name + tagline using Gemini 2.5 Flash. Used for the dossier cover
// page and filename.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  try {
    const { horizonData } = req.body || {};
    if (!horizonData || typeof horizonData !== "object") {
      return res.status(400).json({ error: "Missing horizonData" });
    }

    const strategyContext = formatHorizonContext(horizonData);

    const prompt = `You are a senior product strategist naming an internal product concept for an executive dossier. Read the strategy document below and produce a short, confident product title plus a one-line tagline.

## The Strategy
${strategyContext}

## Your Task
Return two things:
1. **title** — a short product name or headline (3-8 words max). It should feel like something you'd print on a slide header or a dossier cover, not a sentence. Crisp, specific, and stripped of filler.
2. **tagline** — one line (under 18 words) that states what this product is and who it's for. No buzzwords, no hype, no "revolutionary" / "unlock" / "game-changer".

## RULES
- Do NOT invent facts, features, or company positioning not already in the strategy.
- Do NOT copy the Press Release hook verbatim — distill, don't echo.
- Do NOT include punctuation at the end of the title.
- If the strategy is very sparse, still return your best crisp title using whatever signal exists. Never refuse.
- Plain English only. No emoji, no all-caps, no marketing clichés.

Respond with ONLY valid JSON in this exact shape:
{
  "title": "<short product title>",
  "tagline": "<one-line tagline>"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: {
            parts: [
              {
                text: "You are a ruthless product naming editor. Always respond with valid JSON only — no markdown, no code fences. Titles are short and specific; never fluffy, never marketing-speak.",
              },
            ],
          },
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
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
    const finishReason = data.candidates?.[0]?.finishReason;

    if (!text) {
      return res.status(500).json({
        error: `No content in Gemini response (finishReason=${finishReason || "unknown"})`,
        raw: JSON.stringify(data).slice(0, 1000),
      });
    }

    const parsed = parseTitleResponse(text);
    if (!parsed || !parsed.title) {
      return res.status(500).json({
        error: `Could not parse AI response (finishReason=${finishReason || "unknown"})`,
        debugRawSnippet: text.slice(0, 500),
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Product title error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

// ---------- Helpers ----------

function formatHorizonContext(h) {
  const lines = [];
  const push = (label, v) => {
    if (v && typeof v === "string" && v.trim()) lines.push(`**${label}:** ${v.trim()}`);
  };

  push("Press Release — Hook", h.prHook);
  push("Press Release — Status Quo", h.prStatusQuo);
  push("Press Release — Innovation", h.prInnovation);
  push("Press Release — Before & After", h.prBeforeAfter);
  push("Press Release — Value Prop", h.prValueProp);

  push("Problem — Situation", h.problemSituation);
  push("Problem — Victim", h.problemVictim);
  push("Problem — Failure Mode", h.problemFailureMode);

  push("Who Pays — Buyer Personas", h.buyerPersonas);

  push("Why JW — Market Expectation", h.marketExpectation);
  push("Why JW — Capability Alignment", h.capabilityAlignment);

  push("Boundaries — What We Are", h.whatWeAre);
  push("Boundaries — What We Are Not", h.whatWeAreNot);

  return lines.length ? lines.join("\n") : "(Strategy document is sparse — produce a best-effort title from any signal available.)";
}

function parseTitleResponse(text) {
  if (!text || typeof text !== "string") return null;

  const direct = tryParse(text.trim());
  if (direct) return normalize(direct);

  const fenceMatch =
    text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  if (fenceMatch) {
    const fenced = tryParse(fenceMatch[1].trim());
    if (fenced) return normalize(fenced);
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const slice = text.slice(firstBrace, lastBrace + 1);
    const sliced = tryParse(slice);
    if (sliced) return normalize(sliced);
  }

  return null;
}

function tryParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function normalize(obj) {
  if (!obj || typeof obj !== "object") return null;
  const title = typeof obj.title === "string" ? obj.title.trim().replace(/[.!?]+$/, "") : "";
  const tagline = typeof obj.tagline === "string" ? obj.tagline.trim() : "";
  if (!title) return null;
  return { title, tagline };
}
