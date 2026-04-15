// api/monetization-analysis.js — Vercel Serverless Function
// Takes horizonData (full Working Backwards strategy) + competitiveAnalysis
// and returns a pricing / market read that the PM can use as a starting point.
// Uses Gemini 2.5 Flash — lightweight, no deep research needed.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  try {
    const { horizonData, competitiveAnalysis } = req.body || {};

    if (!horizonData || typeof horizonData !== "object") {
      return res.status(400).json({ error: "Missing horizonData" });
    }

    const strategyContext = formatHorizonContext(horizonData);
    const competitorContext = formatCompetitiveContext(competitiveAnalysis);

    const prompt = `You are a senior pricing strategist helping a Product Manager set a defensible market-read for a new product. The PM has written a strategy doc (Working Backwards format) and has a competitive analysis. Your job is to produce a concise, grounded pricing perspective they can iterate on.

## The Strategy
${strategyContext}

## The Competitive Analysis
${competitorContext}

## Your Task
Produce a pricing market-read as JSON. Be specific, grounded, and honest about uncertainty. Do NOT invent precise numbers you cannot justify. When a range is given, make the reasoning explicit.

## CRITICAL RULES
- Ground every claim in either the strategy or the competitive analysis above — do not invent competitors, deals, or revenue figures.
- If the strategy does not give enough signal on something (e.g. segment size, buyer budget), say so in the observation rather than fabricate.
- Keep language plain and senior — no buzzwords, no "unlock", no "game-changing".
- Price ranges should be realistic given the named competitors' known pricing. If unknown, say "unknown — needs discovery".
- Value metric suggestion should be a single clean noun phrase (e.g. "video minutes delivered", "active seats", "API calls per month"). The rationale should be one sentence.

Respond with ONLY valid JSON in this exact shape:
{
  "marketSummary": "<2-4 sentence read of where pricing gravity is for this product>",
  "competitorBenchmarks": [
    {
      "name": "<competitor name from the analysis>",
      "pricingModel": "<how they charge: per-seat / per-minute / usage-based / flat tier / custom>",
      "priceRange": "<rough public pricing or 'unknown'>",
      "notes": "<one line: what the PM should learn from how they price>"
    }
  ],
  "recommendedPriceRange": "<a single realistic price band, e.g. '$40K-$250K ACV' or '$99-$2,500/mo'>",
  "priceRangeRationale": "<2-3 sentences grounded in the benchmarks and the buyer budget evidence from the strategy>",
  "pricingObservations": [
    "<one concrete observation or risk>",
    "<another>",
    "<another if warranted>"
  ],
  "valueMetricSuggestion": "<short noun phrase>",
  "valueMetricRationale": "<one sentence on why this metric tracks value delivered>"
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
                text: "You are a precise, senior pricing strategist. Always respond with valid JSON only — no markdown, no code fences. Ground every claim in the provided strategy + competitive analysis; never fabricate numbers, competitors, or deals.",
              },
            ],
          },
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4000,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res
        .status(response.status)
        .json({ error: `Gemini API error: ${errText}` });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const finishReason = data.candidates?.[0]?.finishReason;

    if (!text) {
      return res.status(500).json({ error: "No content in Gemini response", raw: data });
    }

    const parsed = parseAnalysisResponse(text, finishReason);
    if (!parsed) {
      return res.status(500).json({
        error: "Could not parse AI response. Try again.",
        debugFinishReason: finishReason,
        debugRawSnippet: text.slice(0, 300),
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Monetization analysis error:", err);
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
  push("Problem — Consequence", h.problemConsequence);
  push("Problem — Why Current Solutions Fail", h.problemWhyFail);

  push("Who Pays — Buyer Personas", h.buyerPersonas);
  push("Who Pays — Current Spend", h.currentSpend);
  push("Who Pays — Switch Logic", h.switchLogic);
  push("Who Pays — Demand Evidence", h.demandEvidence);
  push("Who Pays — Behavior Test", h.behaviorTest);

  push("Why JW — Market Expectation", h.marketExpectation);
  push("Why JW — Capability Alignment", h.capabilityAlignment);
  push("Why JW — Structural Fit", h.structuralFit);
  push("Why JW — Credibility Test", h.credibilityTest);
  push("Why JW — Stretch/Risk", h.stretchRisk);

  push("Money — Where It Is Today", h.moneyToday);
  push("Money — Who Owns It", h.moneyOwner);
  push("Money — How We Take It", h.moneyTake);
  push("Money — Mechanism", h.moneyMechanism);

  push("Boundaries — What We Are", h.whatWeAre);
  push("Boundaries — What We Are Not", h.whatWeAreNot);
  push("Boundaries — Competitive Boundaries", h.competitiveBoundaries);
  push("Boundaries — Strategic Constraints", h.strategicConstraints);

  push("Open — Missing Proof", h.missingProof);
  push("Open — Assumptions", h.openAssumptions);
  push("Open — Risks", h.openRisks);
  push("Open — Unknowns", h.openUnknowns);

  return lines.length ? lines.join("\n") : "(Strategy document is empty.)";
}

function formatCompetitiveContext(ca) {
  if (!ca || typeof ca !== "object") {
    return "(No competitive analysis has been run yet.)";
  }
  const lines = [];
  if (ca.landscapeSummary) lines.push(`**Landscape:** ${ca.landscapeSummary}`);

  if (Array.isArray(ca.competitors) && ca.competitors.length) {
    lines.push("**Competitors:**");
    ca.competitors.forEach((c) => {
      const bits = [c.name, c.category, c.threat ? `threat: ${c.threat}` : null]
        .filter(Boolean)
        .join(" — ");
      const detail = c.rationale || c.summary || "";
      lines.push(`- ${bits}${detail ? `: ${detail}` : ""}`);
    });
  }

  if (ca.marketDynamics) {
    const md = ca.marketDynamics;
    if (md.consolidation) lines.push(`**Consolidation:** ${md.consolidation}`);
    if (md.emergingThreats) lines.push(`**Emerging threats:** ${md.emergingThreats}`);
    if (md.regulatory) lines.push(`**Regulatory:** ${md.regulatory}`);
    if (md.switchingCosts) lines.push(`**Switching costs:** ${md.switchingCosts}`);
  }

  if (Array.isArray(ca.strategicRecommendations) && ca.strategicRecommendations.length) {
    lines.push("**Strategic recs:**");
    ca.strategicRecommendations.forEach((r) => lines.push(`- ${r}`));
  }

  return lines.length ? lines.join("\n") : "(No competitive analysis has been run yet.)";
}

function parseAnalysisResponse(text, finishReason) {
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

    const repaired = repairJson(slice);
    if (repaired) {
      const r = tryParse(repaired);
      if (r) return normalize(r);
    }
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
  out = out.replace(/,(\s*[}\]])/g, "$1");
  return out;
}

function normalize(obj) {
  if (!obj || typeof obj !== "object") return null;

  const benchmarks = Array.isArray(obj.competitorBenchmarks)
    ? obj.competitorBenchmarks
        .map((b) => ({
          name: safeStr(b?.name),
          pricingModel: safeStr(b?.pricingModel),
          priceRange: safeStr(b?.priceRange),
          notes: safeStr(b?.notes),
        }))
        .filter((b) => b.name)
    : [];

  const observations = Array.isArray(obj.pricingObservations)
    ? obj.pricingObservations.map(safeStr).filter(Boolean)
    : [];

  return {
    marketSummary: safeStr(obj.marketSummary),
    competitorBenchmarks: benchmarks,
    recommendedPriceRange: safeStr(obj.recommendedPriceRange),
    priceRangeRationale: safeStr(obj.priceRangeRationale),
    pricingObservations: observations,
    valueMetricSuggestion: safeStr(obj.valueMetricSuggestion),
    valueMetricRationale: safeStr(obj.valueMetricRationale),
  };
}

function safeStr(v) {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}
