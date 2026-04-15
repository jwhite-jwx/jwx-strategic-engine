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
            maxOutputTokens: 4000,
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
    const finishReason = data.candidates?.[0]?.finishReason;
    if (!text) {
      return res.status(500).json({ error: "No content in Gemini response", raw: data });
    }

    const enhancement = parseEnhancementResponse(text, finishReason, draft);
    if (!enhancement) {
      return res.status(500).json({
        error: "Could not parse AI response. Try again, or shorten your draft.",
        debugFinishReason: finishReason,
        debugRawSnippet: text.slice(0, 300),
      });
    }

    return res.status(200).json(enhancement);
  } catch (err) {
    console.error("Enhance error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

// Robust parser for Gemini responses. Tries multiple strategies in order
// and falls back to returning the raw text as the enhancement if all
// structured parsing fails.
function parseEnhancementResponse(text, finishReason, originalDraft) {
  if (!text || typeof text !== "string") return null;

  // Strategy 1: Direct JSON parse (happy path with responseMimeType: application/json)
  const direct = tryParse(text.trim());
  if (direct) return normalize(direct, originalDraft);

  // Strategy 2: Strip markdown code fences if the model wrapped it anyway
  const fenceMatch =
    text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  if (fenceMatch) {
    const fenced = tryParse(fenceMatch[1].trim());
    if (fenced) return normalize(fenced, originalDraft);
  }

  // Strategy 3: Grab the outermost {...} block
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const slice = text.slice(firstBrace, lastBrace + 1);
    const sliced = tryParse(slice);
    if (sliced) return normalize(sliced, originalDraft);

    // Strategy 4: Attempt to repair common issues (unescaped newlines / quotes inside strings)
    const repaired = repairJson(slice);
    if (repaired) {
      const parsedRepaired = tryParse(repaired);
      if (parsedRepaired) return normalize(parsedRepaired, originalDraft);
    }
  }

  // Strategy 5: If response was truncated by token limit, try to recover
  // the "enhanced" field by regex — the rationale may be lost.
  if (finishReason === "MAX_TOKENS" || finishReason === "LENGTH") {
    const enhancedMatch = text.match(/"enhanced"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"rationale"|$)/);
    if (enhancedMatch) {
      const recovered = enhancedMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .trim();
      if (recovered) {
        return {
          enhanced: recovered,
          rationale:
            "Response was truncated by token limit; recovered the edited draft but rationale was lost.",
        };
      }
    }
  }

  // Strategy 6: Last-resort fallback — treat the raw text as the enhancement
  // if it looks like prose rather than broken JSON. Better than a hard error
  // for the PM, who can still compare and accept/reject.
  const looksLikeProse =
    !text.trim().startsWith("{") && text.trim().length > 0 && text.length < 8000;
  if (looksLikeProse) {
    return {
      enhanced: text.trim(),
      rationale:
        "AI response wasn't valid JSON; showing the raw edit. Review carefully before accepting.",
    };
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

// Very light repair for common Gemini JSON failures:
// - Unescaped newlines inside string values
// - Trailing commas before } or ]
function repairJson(s) {
  let out = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      out += ch;
      escape = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString && ch === "\n") {
      out += "\\n";
      continue;
    }
    if (inString && ch === "\r") {
      out += "\\r";
      continue;
    }
    if (inString && ch === "\t") {
      out += "\\t";
      continue;
    }
    out += ch;
  }
  // Strip trailing commas
  out = out.replace(/,(\s*[}\]])/g, "$1");
  return out;
}

function normalize(obj, originalDraft) {
  if (!obj || typeof obj !== "object") return null;
  const enhanced =
    typeof obj.enhanced === "string"
      ? obj.enhanced
      : typeof obj.text === "string"
      ? obj.text
      : typeof obj.result === "string"
      ? obj.result
      : null;
  if (!enhanced || !enhanced.trim()) return null;
  const rationale =
    typeof obj.rationale === "string" && obj.rationale.trim()
      ? obj.rationale
      : "Tightened the draft for specificity and rigor.";
  return { enhanced: enhanced.trim(), rationale };
}
