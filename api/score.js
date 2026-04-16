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
  "score": <integer 1-5>,
  "label": "<one of: CRITICAL GAP | WEAK DEFENSE | PARTIAL DEFENSE | STRONG DEFENSE | BULLETPROOF>",
  "assessment": "<2-3 sentences evaluating the quality of their answer. Be specific about what's missing, what's hand-waving, or what's actually defensible. Reference specific competitors or market dynamics if relevant.>",
  "gaps": ["<specific gap or weakness in their answer>", "<another gap if applicable>"],
  "followUp": "<A pointed follow-up question that digs deeper into the weakest part of their answer. This should be MORE specific than the original question, not less. If they gave a strong answer, probe the edges of their defense. If weak, go for the jugular.>",
  "followUpContext": "<Why this follow-up matters — what competitive or strategic risk it exposes>"
}

## HOW TO SCORE — READ THIS CAREFULLY

Do NOT default to 3. Do NOT average toward the middle to be polite. The score MUST be the lowest score whose trigger conditions are met. A single disqualifier forces the ceiling — it cannot be offset by strengths elsewhere.

Evaluate on TWO axes, then take the WEAKER of the two as your final score:
  A. **Defense quality** — how specific, evidenced, and rigorous is the answer as written?
  B. **Position viability** — is the underlying position the PM is defending actually defensible given the strategic and competitive context?

A brilliantly-written defense of an impossible position is still a 1 or 2. If the correct critique is "this cannot work, ever" or "this is structurally doomed", the score is 1 regardless of how articulate the PM was.

### Trigger Conditions (take the LOWEST applicable score)

**Score = 1 (CRITICAL GAP)** — Any of:
  - The PM's position is strategically infeasible, structurally doomed, or factually wrong in a way that would sink a deal or investment.
  - Your assessment uses or implies phrases like "cannot work", "will never", "no viable path", "impossible", "fatal", "fundamentally broken", "would lose every deal", "obviously wrong".
  - The answer is blank, a pure deflection ("good question, we'll figure it out"), or concedes the point entirely.
  - The answer directly contradicts something the PM already wrote elsewhere in their strategy.

**Score = 2 (WEAK DEFENSE)** — Any of (and none of the score=1 triggers apply):
  - The position could be defensible in theory, but the answer offers NO concrete evidence, data, examples, or mechanism.
  - Relies on unverified assumptions ("we believe", "we think", "customers probably want") without grounding.
  - Answer is short hand-waving ("our brand is strong", "we'll execute well") with no substance.
  - A competent competitor could dismantle this in one counter.

**Score = 3 (PARTIAL DEFENSE)** — Any of (and none of the score=1 or 2 triggers apply):
  - Has a coherent argument with some specificity, but misses a major competitive dynamic, pricing reality, or technical constraint.
  - Cites one piece of evidence but leaves the biggest risk unaddressed.
  - Right instinct, incomplete execution of the argument.

**Score = 4 (STRONG DEFENSE)** — All of:
  - Specific evidence, concrete mechanism, or named data points.
  - Acknowledges the strongest counter-argument and addresses it.
  - Consistent with the rest of the strategy document.
  - Would hold up in a board meeting.

**Score = 5 (BULLETPROOF)** — RARE. All of:
  - Every claim is backed by a specific mechanism, data point, or named precedent.
  - Proactively identifies and neutralizes the two strongest possible counters.
  - Turns the challenger's question into a demonstrated advantage.
  - You genuinely cannot think of a rebuttal.

### Internal Consistency Check (MANDATORY)

Before finalizing, verify:
  1. If your \`assessment\` contains language like "cannot", "will never", "impossible", "no path", "fatally", "structurally doomed", "would lose", "not defensible" → score MUST be 1.
  2. If your \`assessment\` describes the answer as "vague", "hand-waving", "no evidence", "no data", "pure assertion", "unsupported" → score MUST be ≤ 2.
  3. If your \`gaps\` array contains anything framed as a structural or fatal problem → score MUST be 1 or 2.
  4. If your \`assessment\` praises the answer AND your \`gaps\` list is empty or trivial → score should be 4 or 5.
  5. The \`label\` must match the score exactly per the mapping above.

If any of these checks fail, fix the score — NEVER the assessment. Your written critique is the truth; the score is derived from it.

### Calibration Examples

- PM says "We'll win because we have brand equity." → score 2. Zero mechanism, pure assertion.
- PM says "Mux would need 18 months to replicate our analytics moat because X, Y, Z contract terms prevent account movement." → score 4 if X/Y/Z are specific.
- PM says "We'll build a CDN from scratch in a quarter with our current team" when strategy says the team is 3 engineers → score 1. Structurally impossible.
- PM says "We lost 3 deals to Mux last quarter, here's what each of them switched on." → score 4-5 depending on whether the switching criteria are actually named.

## FINAL INSTRUCTION

Score first by identifying the single most damning finding in your assessment. Let that finding dictate the score. Do not "balance" strengths against fatal weaknesses. A bridge with one cracked support is not a 3/5 bridge — it's a collapsed bridge.`;

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
                text: "You are a ruthless and internally-consistent competitive strategy evaluator. Always respond with valid JSON only — no markdown, no code blocks, just raw JSON. Your numeric score MUST match the severity of your written assessment. If the assessment says a position is fatally flawed, the score is 1. If the assessment is vague praise with no substance, the score is not 5. Never soften a score to be polite; never default to 3. Your prose is the source of truth — the score is derived from it.",
              },
            ],
          },
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2500,
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

    const reconciled = reconcileScore(evaluation);
    return res.status(200).json(reconciled);
  } catch (err) {
    console.error("Scoring error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Backend score reconciliation — if the model's prose says "fatal" but the
// numeric score is 3, clamp the score to what the prose actually implies.
// Belt-and-suspenders for the in-prompt consistency rules.
// ────────────────────────────────────────────────────────────────────────────

const FATAL_TRIGGERS = [
  /\bcannot\s+(work|succeed|ship|build|compete|defend|be\s+built)\b/i,
  /\bwill\s+never\b/i,
  /\bno\s+(viable\s+)?path\b/i,
  /\bimpossibl[ey]\b/i,
  /\bstructurally\s+(doomed|broken|infeasible)\b/i,
  /\bfatal(ly)?\b/i,
  /\bfundamentally\s+(broken|flawed|wrong)\b/i,
  /\bnot\s+defensible\b/i,
  /\bwould\s+lose\s+(every|most)\s+deal/i,
  /\bobviously\s+wrong\b/i,
  /\bself-contradict/i,
  /\bcontradicts?\b.*\bstrateg/i,
];

const WEAK_TRIGGERS = [
  /\bvague\b/i,
  /\bhand[-\s]?waving\b/i,
  /\bno\s+(concrete\s+)?evidence\b/i,
  /\bno\s+data\b/i,
  /\bpure\s+assertion\b/i,
  /\bunsupported\b/i,
  /\bno\s+mechanism\b/i,
  /\blacks\s+(specificity|evidence|data|rigor)\b/i,
  /\bmarketing\s+speak\b/i,
  /\bbuzzwords?\b/i,
];

const LABELS = {
  1: "CRITICAL GAP",
  2: "WEAK DEFENSE",
  3: "PARTIAL DEFENSE",
  4: "STRONG DEFENSE",
  5: "BULLETPROOF",
};

function reconcileScore(evalObj) {
  if (!evalObj || typeof evalObj !== "object") return evalObj;

  let score = Number(evalObj.score);
  if (!Number.isFinite(score)) score = 3;
  score = Math.max(1, Math.min(5, Math.round(score)));

  const corpus = [
    evalObj.assessment || "",
    Array.isArray(evalObj.gaps) ? evalObj.gaps.join(" ") : "",
  ].join(" ");

  const adjustments = [];

  // Fatal triggers force score to 1
  for (const re of FATAL_TRIGGERS) {
    if (re.test(corpus)) {
      if (score > 1) {
        adjustments.push(`Assessment contains fatal language (matched ${re}); clamped from ${score} to 1.`);
        score = 1;
      }
      break;
    }
  }

  // Weak triggers cap score at 2 (only if not already clamped to 1)
  if (score > 2) {
    for (const re of WEAK_TRIGGERS) {
      if (re.test(corpus)) {
        adjustments.push(`Assessment contains weak-defense language (matched ${re}); clamped from ${score} to 2.`);
        score = 2;
        break;
      }
    }
  }

  // Force label to match the (possibly-clamped) score
  const correctLabel = LABELS[score];
  if (evalObj.label !== correctLabel) {
    if (evalObj.label) {
      adjustments.push(`Label "${evalObj.label}" did not match score ${score}; corrected to "${correctLabel}".`);
    }
    evalObj.label = correctLabel;
  }

  evalObj.score = score;
  if (adjustments.length > 0) {
    evalObj._scoreReconciliation = adjustments;
  }
  return evalObj;
}
