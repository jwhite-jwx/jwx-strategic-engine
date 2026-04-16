// api/feasibility.js — Vercel Serverless Function
// Sends full strategy dossier to DJ MCP for feasibility review,
// then runs the response through Gemini to produce a PM-friendly version.
// Returns BOTH documents to the frontend.

export default async function handler(req, res) {
  if (req.method \!== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (\!geminiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured in Vercel environment variables" });
  }

  try {
    const { payload } = req.body;

    if (\!payload || typeof payload \!== "object") {
      return res.status(400).json({ error: "Missing feasibility payload" });
    }
    // ── Step 1: Build the DJ query from the strategy payload ──────────────
    const djQuery = buildDJQuery(payload);

    // ── Step 2: Call DJ MCP API ───────────────────────────────────────────
    const djResponse = await callDJ(djQuery);

    // ── Step 3: Run DJ response through Gemini for PM-friendly rewrite ───
    const pmVersion = await rewriteForPM(djResponse, payload, geminiKey);

    // ── Step 4: Return both documents ────────────────────────────────────
    return res.status(200).json({
      djRaw: djResponse,
      pmVersion,
      generatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("Feasibility review error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}


// ─── DJ MCP CALLER ──────────────────────────────────────────────────────────

async function callDJ(query) {
  const response = await fetch("https://dj-mcp.jwp.io/api/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "jwx-dev-key",
    },
    body: JSON.stringify({
      query,
      model: "sonnet",
    }),
  });

  if (\!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`DJ API error (${response.status}): ${errText.slice(0, 500)}`);
  }

  const data = await response.json();

  if (\!data.response || typeof data.response \!== "string") {
    throw new Error("DJ returned an empty response. The query may have been too large or the service may be temporarily unavailable.");
  }

  return data.response;
}


// ─── DJ QUERY BUILDER ───────────────────────────────────────────────────────

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

  // Instructions
  sections.push("=== FEASIBILITY REVIEW REQUEST ===");
  sections.push("");
  sections.push(inference);
  sections.push("");

  // Product scope (boundaries first — this is the contract)
  sections.push("=== PRODUCT SCOPE & BOUNDARIES ===");
  pushIfPresent(sections, "What We Are", b.whatWeAre);
  pushIfPresent(sections, "What We Are Not", b.whatWeAreNot);
  pushIfPresent(sections, "Competitive Boundaries", b.competitiveBoundaries);
  pushIfPresent(sections, "Strategic Constraints", b.strategicConstraints);
  sections.push("");

  // Press release
  sections.push("=== PRESS RELEASE ===");
  pushIfPresent(sections, "Hook", pr.hook);
  pushIfPresent(sections, "Status Quo", pr.statusQuo);
  pushIfPresent(sections, "Innovation", pr.innovation);
  pushIfPresent(sections, "Before & After", pr.beforeAfter);
  pushIfPresent(sections, "Value Prop", pr.valueProp);
  sections.push("");

  // Problem
  sections.push("=== PROBLEM ===");
  pushIfPresent(sections, "Situation", prob.situation);
  pushIfPresent(sections, "Victim", prob.victim);
  pushIfPresent(sections, "Failure Mode", prob.failureMode);
  pushIfPresent(sections, "Consequence", prob.consequence);
  pushIfPresent(sections, "Why Current Solutions Fail", prob.whyCurrentSolutionsFail);
  sections.push("");

  // Who pays
  sections.push("=== WHO PAYS ===");
  pushIfPresent(sections, "Buyer Personas", wp.buyerPersonas);
  pushIfPresent(sections, "Current Spend", wp.currentSpend);
  pushIfPresent(sections, "Switch Logic", wp.switchLogic);
  pushIfPresent(sections, "Demand Evidence", wp.realExample);
  pushIfPresent(sections, "Behavior Test", wp.behaviorTest);
  sections.push("");

  // Why JW
  sections.push("=== WHY JW PLAYER ===");
  pushIfPresent(sections, "Market Expectation", wj.marketExpectation);
  pushIfPresent(sections, "Capability Alignment", wj.capabilityAlignment);
  pushIfPresent(sections, "Structural Fit", wj.structuralFit);
  pushIfPresent(sections, "Credibility Test", wj.credibilityTest);
  pushIfPresent(sections, "Stretch / Risk", wj.stretchRisk);
  sections.push("");

  // Money movement
  sections.push("=== MONEY MOVEMENT ===");
  pushIfPresent(sections, "Where Money Is Today", mm.whereTheMoneyIsToday);
  pushIfPresent(sections, "Who Owns It", mm.whoCurrentlyOwnsIt);
  pushIfPresent(sections, "How We Take It", mm.howWeTakeIt);
  pushIfPresent(sections, "Mechanism", mm.mechanism);
  sections.push("");

  // Open questions
  sections.push("=== OPEN QUESTIONS ===");
  pushIfPresent(sections, "Missing Proof", oq.missingProof);
  pushIfPresent(sections, "Assumptions", oq.assumptions);
  pushIfPresent(sections, "Risks", oq.risks);
  pushIfPresent(sections, "Unknowns", oq.unknowns);
  sections.push("");

  // Competitive summary (condensed)
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

  // Challenger weak areas
  if (challenger.weakAreas && challenger.weakAreas.length > 0) {
    sections.push(`=== CHALLENGER WEAK AREAS: ${challenger.weakAreas.join(", ")} ===`);
    sections.push("");
  }

  // Monetization context
  if (mon.valueMetric || mon.pricingPhilosophy) {
    sections.push("=== MONETIZATION CONTEXT ===");
    pushIfPresent(sections, "Value Metric", mon.valueMetric);
    pushIfPresent(sections, "Pricing Philosophy", mon.pricingPhilosophy);
    if (mon.unitEconomics) {
      pushIfPresent(sections, "CAC", mon.unitEconomics.cac);
      pushIfPresent(sections, "LTV", mon.unitEconomics.ltv);
      pushIfPresent(sections, "Payback Period", mon.unitEconomics.paybackPeriod);
    }
    sections.push("");
  }

  // Specific questions
  sections.push("=== QUESTIONS TO ANSWER ===");
  questions.forEach((q, i) => {
    sections.push(`${i + 1}. ${q}`);
  });

  return sections.join("\n");
}

function pushIfPresent(arr, label, val) {
  if (val && typeof val === "string" && val.trim()) {
    arr.push(`${label}: ${val.trim()}`);
  }
}


// ─── GEMINI PM REWRITE ──────────────────────────────────────────────────────

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

  if (\!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Gemini PM-rewrite failed (${response.status}): ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (\!text) {
    // If Gemini fails, return the raw DJ response as-is rather than failing entirely
    return {
      document: djResponse,
      headline: "PM rewrite unavailable — showing raw engineering assessment",
    };
  }

  const parsed = tryParseJSON(text);
  if (parsed && parsed.document) {
    return parsed;
  }

  // Fallback: try extracting from code fences
  const fenceMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  if (fenceMatch) {
    const fenced = tryParseJSON(fenceMatch[1].trim());
    if (fenced && fenced.document) return fenced;
  }

  // Last resort: return raw text as the document
  return {
    document: text,
    headline: "PM rewrite generated (format fallback)",
  };
}

function tryParseJSON(s) {
  try { return JSON.parse(s); }
  catch { return null; }
}
