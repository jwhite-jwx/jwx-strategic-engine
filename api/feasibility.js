// api/feasibility.js — Vercel Serverless Function
// Step 1: Builds a structured query from the strategy payload and sends it to DJ (dj.jwp.io)
// Step 2: Takes DJ's raw response and rewrites it via Gemini into a PM-friendly document
// Returns both the raw DJ assessment and the PM version

// Allow up to 5 minutes for DJ + Gemini processing
export const maxDuration = 300;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured in Vercel environment variables" });
  }

  try {
    const { payload } = req.body;

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Missing strategy payload" });
    }

    // --- Step 1: Query DJ ---
    console.log("[feasibility] Building DJ query from payload...");
    const djQuery = buildDJQuery(payload);
    console.log("[feasibility] DJ query length:", djQuery.length, "chars");
    console.log("[feasibility] Calling DJ at dj.jwp.io...");

    const djController = new AbortController();
    const djTimeout = setTimeout(() => djController.abort(), 240000); // 4 min timeout

    let djRes;
    try {
      djRes = await fetch("https://dj.jwp.io/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "jwx-dev-key",
        },
        body: JSON.stringify({ query: djQuery, model: "sonnet-4.5" }),
        signal: djController.signal,
      });
    } catch (fetchErr) {
      clearTimeout(djTimeout);
      if (fetchErr.name === "AbortError") {
        throw new Error("DJ query timed out after 4 minutes. DJ may be under heavy load — try again.");
      }
      throw new Error(`DJ fetch failed: ${fetchErr.message}`);
    }
    clearTimeout(djTimeout);

    if (!djRes.ok) {
      const errText = await djRes.text().catch(() => "");
      throw new Error(`DJ API error (${djRes.status}): ${errText.slice(0, 300)}`);
    }

    const djData = await djRes.json();
    const djRaw = djData.response;

    if (!djRaw || typeof djRaw !== "string" || djRaw.trim().length === 0) {
      throw new Error("DJ returned an empty response. The model may be unavailable — try again.");
    }

    console.log("[feasibility] DJ response received, length:", djRaw.length);

    // --- Step 2: Gemini PM Rewrite ---
    console.log("[feasibility] Calling Gemini for PM rewrite...");
    const pmVersion = await rewriteForPM(djRaw, payload, geminiKey);
    console.log("[feasibility] PM rewrite done, headline:", pmVersion?.headline);

    return res.status(200).json({
      djRaw,
      pmVersion,
      generatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[feasibility] FATAL ERROR:", err.message, err.stack);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}


// --- BUILD DJ QUERY ---

function buildDJQuery(payload) {
  const s = payload.strategy || {};
  const b = s.boundaries || {};
  const pr = s.pressRelease || {};
  const prob = s.problem || {};
  const wp = s.whoPays || {};
  const wj = s.whyJW || {};
  const mm = s.moneyMovement || {};
  const oq = s.openQuestions || {};
  const comp = payload.competitiveAnalysis || {};
  const mon = payload.monetization || {};
  const challenger = payload.challengerResults || {};
  const questions = payload.feasibilityQuestions || [];
  const inference = payload.inference || "";

  const sections = [];
  const push = (label, val) => {
    if (val && typeof val === "string" && val.trim()) sections.push(`${label}: ${val.trim()}`);
  };

  sections.push("=== FEASIBILITY REVIEW REQUEST ===", "", inference, "");
  sections.push("=== PRODUCT SCOPE & BOUNDARIES ===");
  push("What We Are", b.whatWeAre); push("What We Are Not", b.whatWeAreNot);
  push("Competitive Boundaries", b.competitiveBoundaries); push("Strategic Constraints", b.strategicConstraints);
  sections.push("", "=== PRESS RELEASE ===");
  push("Hook", pr.hook); push("Status Quo", pr.statusQuo); push("Innovation", pr.innovation);
  push("Before & After", pr.beforeAfter); push("Value Prop", pr.valueProp);
  sections.push("", "=== PROBLEM ===");
  push("Situation", prob.situation); push("Victim", prob.victim); push("Failure Mode", prob.failureMode);
  push("Consequence", prob.consequence); push("Why Current Solutions Fail", prob.whyCurrentSolutionsFail);
  sections.push("", "=== WHO PAYS ===");
  push("Buyer Personas", wp.buyerPersonas); push("Current Spend", wp.currentSpend);
  push("Switch Logic", wp.switchLogic); push("Demand Evidence", wp.realExample); push("Behavior Test", wp.behaviorTest);
  sections.push("", "=== WHY JW PLAYER ===");
  push("Market Expectation", wj.marketExpectation); push("Capability Alignment", wj.capabilityAlignment);
  push("Structural Fit", wj.structuralFit); push("Credibility Test", wj.credibilityTest); push("Stretch / Risk", wj.stretchRisk);
  sections.push("", "=== MONEY MOVEMENT ===");
  push("Where Money Is Today", mm.whereTheMoneyIsToday); push("Who Owns It", mm.whoCurrentlyOwnsIt);
  push("How We Take It", mm.howWeTakeIt); push("Mechanism", mm.mechanism);
  sections.push("", "=== OPEN QUESTIONS ===");
  push("Missing Proof", oq.missingProof); push("Assumptions", oq.assumptions);
  push("Risks", oq.risks); push("Unknowns", oq.unknowns);
  sections.push("");

  if (comp.landscapeSummary || (comp.competitors && comp.competitors.length > 0)) {
    sections.push("=== COMPETITIVE CONTEXT (condensed) ===");
    if (comp.landscapeSummary) sections.push(comp.landscapeSummary);
    if (comp.competitors) {
      sections.push("");
      comp.competitors.slice(0, 8).forEach(c => {
        sections.push(`- ${c.name} (${c.category}, risk: ${c.aiRiskRating || "unknown"}): ${c.threat || c.description || ""}`);
      });
    }
    sections.push("");
  }
  if (challenger.weakAreas && challenger.weakAreas.length > 0) {
    sections.push(`=== CHALLENGER WEAK AREAS: ${challenger.weakAreas.join(", ")} ===`, "");
  }
  if (mon.valueMetric || mon.pricingPhilosophy) {
    sections.push("=== MONETIZATION CONTEXT ===");
    push("Value Metric", mon.valueMetric); push("Pricing Philosophy", mon.pricingPhilosophy);
    if (mon.unitEconomics) { push("CAC", mon.unitEconomics.cac); push("LTV", mon.unitEconomics.ltv); push("Payback Period", mon.unitEconomics.paybackPeriod); }
    sections.push("");
  }
  sections.push("=== QUESTIONS TO ANSWER ===");
  questions.forEach((q, i) => sections.push(`${i + 1}. ${q}`));
  return sections.join("\n");
}


// --- GEMINI PM REWRITE ---

async function rewriteForPM(djResponse, payload, geminiKey) {
  const boundaries = payload.strategy?.boundaries || {};
  const prHook = payload.strategy?.pressRelease?.hook || "";

  const prompt = `You are a senior technical product manager at JW Player. You've just received a raw feasibility assessment from the internal architecture team (DJ) for a new product initiative. Your job is to rewrite it into a clean, PM-readable document that can be shared with leadership and cross-functional stakeholders.

## The Raw Feasibility Assessment from DJ
${djResponse}

## Product Context
- Product hook: ${prHook || "(not provided)"}
- What we are: ${boundaries.whatWeAre || "(not provided)"}
- What we are not: ${boundaries.whatWeAreNot || "(not provided)"}

## Your Task
Rewrite the DJ assessment into a structured PM-friendly feasibility document. The document should:

1. **Executive Summary** (3-5 sentences) — Can we build this? What's the headline? Is it a go, conditional go, or no-go?

2. **What We Can Leverage** — Which existing JW systems, services, and infrastructure can be used as-is? Translate technical system names into plain language where helpful, but keep the specific names.

3. **What Needs to Be Built** — New components or significant modifications required. For each, give a plain-language description of what it is and why it's needed.

4. **Key Risks & Constraints** — Technical risks, integration hazards, or infrastructure gaps. Translate into business impact where possible (e.g., "X adds ~4 weeks to timeline" rather than just "X is complex").

5. **Timeline & Team** — Realistic MVP timeline and minimum team composition. Call out any assumptions.

6. **Infrastructure Cost Estimate** — Year 1 and Year 2 rough ranges, with key cost drivers named.

7. **Confidence Assessment** — How confident is this read? What unknowns would need discovery sprints?

8. **PM Takeaways & Decision Points** — 3-5 bullet points: what decisions need to be made, what de-risking steps are recommended, and any scope questions that surfaced.

## RULES
- Do NOT invent technical details that aren't in the DJ assessment. If DJ didn't cover something, say "Not assessed by engineering" rather than guessing.
- Do NOT change DJ's conclusions — if they said something is infeasible, keep it infeasible. You're translating, not editorializing.
- Keep it under 1500 words. Concise and scannable.
- Use plain English. Avoid jargon unless the technical term is important for stakeholder conversations.
- Use markdown formatting (headers, bullets) for structure.

Respond with ONLY valid JSON:
{
  "document": "<the full PM-friendly feasibility document in markdown>",
  "headline": "<one-line summary, e.g. 'Conditionally feasible — 12-week MVP with 2 key unknowns'>"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: {
          parts: [{
            text: "You are a senior technical PM translating an engineering feasibility assessment into a leadership-ready document. Always respond with valid JSON only — no markdown fences, no code blocks, just raw JSON. Be precise and honest; never soften engineering concerns.",
          }],
        },
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 6000,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Gemini PM-rewrite failed (${response.status}): ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return {
      document: djResponse,
      headline: "PM rewrite unavailable — showing raw engineering assessment",
    };
  }

  const parsed = tryParseJSON(text);
  if (parsed && parsed.document) {
    return parsed;
  }

  const fenceMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  if (fenceMatch) {
    const fenced = tryParseJSON(fenceMatch[1].trim());
    if (fenced && fenced.document) return fenced;
  }

  return {
    document: text,
    headline: "PM rewrite generated (format fallback)",
  };
}

function tryParseJSON(s) {
  try { return JSON.parse(s); }
  catch { return null; }
}
