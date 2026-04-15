// api/analyze.js — Vercel Serverless Function
// Proxies requests to Google Gemini 2.5 Pro for deep competitive research

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured in Vercel environment variables" });
  }

  try {
    const { horizonData } = req.body;
    if (!horizonData) {
      return res.status(400).json({ error: "Missing horizonData in request body" });
    }

    const prompt = buildPrompt(horizonData);

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
                text: "You are a world-class competitive intelligence analyst with deep research capabilities. Use your knowledge to provide thorough, current competitive analysis. Always respond with valid JSON only — no markdown, no code blocks, just raw JSON.",
              },
            ],
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 12000,
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

    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: "No content in Gemini response", raw: data });
    }

    // Parse JSON — Gemini with responseMimeType should return clean JSON,
    // but handle code blocks just in case
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/```\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const analysis = JSON.parse(jsonStr.trim());

    return res.status(200).json(analysis);
  } catch (err) {
    console.error("Analysis error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

function buildPrompt(horizonData) {
  const np = (v) => (v && String(v).trim()) ? v : "Not provided";
  return `Based on the following product strategy information, perform a DEEP competitive landscape analysis. Use your research capabilities to identify real companies, real market data, and real competitive dynamics.

## Product Strategy Context

### 0. The Press Release
- **Hook:** ${np(horizonData.prHook)}
- **Status Quo:** ${np(horizonData.prStatusQuo)}
- **The Innovation:** ${np(horizonData.prInnovation)}
- **Before & After:** ${np(horizonData.prBeforeAfter)}
- **Value Prop:** ${np(horizonData.prValueProp)}

### 1. The Problem
- **Situation:** ${np(horizonData.problemSituation)}
- **Victim:** ${np(horizonData.problemVictim)}
- **Failure Mode:** ${np(horizonData.problemFailureMode)}
- **Consequence:** ${np(horizonData.problemConsequence)}
- **Why Current Solutions Fail:** ${np(horizonData.problemCurrentSolutions)}

### 2. Who Pays
- **Buyer Personas:** ${np(horizonData.buyerPersonas)}
- **Current Spend Behavior:** ${np(horizonData.currentSpend)}
- **Switch Logic:** ${np(horizonData.switchLogic)}
- **Real Example / Demand Evidence:** ${np(horizonData.realExample)}
- **Behavior Test:** ${np(horizonData.behaviorTest)}

### 3. Why JW Player Should Do This
- **Market Expectation:** ${np(horizonData.marketExpectation)}
- **Capability Alignment:** ${np(horizonData.capabilityAlignment)}
- **Structural Fit:** ${np(horizonData.structuralFit)}
- **Credibility Test:** ${np(horizonData.credibilityTest)}
- **Stretch / Risk:** ${np(horizonData.stretchRisk)}

### 4. The Money Movement
- **Where the Money Is Today:** ${np(horizonData.moneyToday)}
- **Who Currently Owns It:** ${np(horizonData.moneyOwners)}
- **How We Take It (Expansion or Displacement):** ${np(horizonData.takeMechanism)}
- **Mechanism:** ${np(horizonData.moneyPath)}

### 5. Boundaries
- **What We Are:** ${np(horizonData.whatWeAre)}
- **What We Are Not:** ${np(horizonData.whatWeAreNot)}
- **Competitive Boundaries (who we won't compete with):** ${np(horizonData.competitiveBoundaries)}
- **Strategic Constraints:** ${np(horizonData.strategicConstraints)}

### 6. Open Questions / Weak Points
- **Missing Proof:** ${np(horizonData.missingProof)}
- **Assumptions:** ${np(horizonData.assumptions)}
- **Risks:** ${np(horizonData.risks)}
- **Unknowns:** ${np(horizonData.unknowns)}

## Your Task

Provide a comprehensive competitive analysis in the following JSON format. Be thorough — identify 10-15+ competitors across all categories. Generate exactly 12 challenger questions (2 per category). For each competitor, provide genuine competitive intelligence with real data points, not generic descriptions.

Return ONLY valid JSON with this structure:
{
  "landscapeSummary": "2-3 paragraph executive summary of the competitive landscape, key dynamics, and strategic implications. Include real market data and trends.",
  "competitors": [
    {
      "name": "Company Name",
      "category": "direct" | "indirect" | "emerging" | "adjacent",
      "description": "What they do and why they're relevant (2-3 sentences with real facts)",
      "strengths": ["strength1", "strength2", "strength3"],
      "weaknesses": ["weakness1", "weakness2"],
      "threat": "What specific threat they pose to your strategy",
      "aiRiskRating": "critical" | "high" | "medium" | "low" | "minimal",
      "riskRationale": "Why this risk level — cite specific competitive dynamics, funding rounds, product launches, market share data"
    }
  ],
  "marketDynamics": {
    "consolidationTrend": "Description of M&A and consolidation patterns with real examples",
    "emergingThreats": "New entrants or technology shifts that could disrupt",
    "regulatoryFactors": "Regulatory environment impact",
    "switchingCosts": "Assessment of switching costs in this market"
  },
  "strategicRecommendations": [
    "Specific actionable recommendation based on the analysis"
  ],
  "challengerQuestions": {
    "moat": [
      {"question": "A brutally specific question about competitive defensibility that names a real competitor from your analysis above and forces the PM to explain exactly why customers wouldn't switch", "context": "Cite the specific competitive data point that makes this question dangerous"},
      {"question": "A second pointed moat question referencing a different competitor or market dynamic", "context": "Why this is an existential concern"}
    ],
    "market": [
      {"question": "A pointed question about market timing or sizing that challenges an assumption in their strategy with a specific data point or trend", "context": "The specific market reality that contradicts their assumption"},
      {"question": "A second market question that forces them to confront a headwind they may be underestimating", "context": "Why this headwind could be fatal"}
    ],
    "execution": [
      {"question": "A specific question about whether their team/tech can actually deliver what they're promising, referencing a competitor who already has this capability", "context": "The execution gap that makes this dangerous"},
      {"question": "A second execution question about speed-to-market or technical debt", "context": "Why timing matters here"}
    ],
    "customer": [
      {"question": "A pointed question that challenges whether the customer pain they identified is real, acute, and monetizable — not just a nice-to-have", "context": "Evidence that suggests the pain might not be as severe as claimed"},
      {"question": "A second customer question about switching costs or adoption barriers", "context": "Why customers might not actually switch"}
    ],
    "economics": [
      {"question": "A specific question about unit economics sustainability, referencing a competitor's pricing or a market pricing trend that threatens their margins", "context": "The economic pressure that makes this urgent"},
      {"question": "A second economics question about CAC, retention, or margin compression", "context": "Why the numbers might not work"}
    ],
    "strategy": [
      {"question": "A pointed question about strategic leverage that challenges whether their differentiation is real or just marketing, citing a specific competitor who claims similar positioning", "context": "The strategic vulnerability this exposes"},
      {"question": "A second strategy question about what happens when a larger player copies their approach", "context": "Why this is a realistic scenario"}
    ]
  }
}

CRITICAL INSTRUCTIONS FOR CHALLENGER QUESTIONS:
- Generate EXACTLY 2 questions per category (12 total)
- Every question MUST reference specific competitors, data points, or market dynamics from YOUR analysis above — no generic questions
- Questions should be uncomfortable, pointed, and impossible to answer with hand-waving
- Each question should feel like it came from the smartest competitor's chief strategist
- The "context" field must cite specific competitive intelligence that makes the question dangerous
- If a question could apply to any company in any market, it's too generic — rewrite it`;
}
