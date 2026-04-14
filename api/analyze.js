// api/analyze.js — Vercel Serverless Function
// Proxies requests to OpenAI's API so the key never hits the browser

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY not configured in Vercel environment variables" });
  }

  try {
    const { horizonData } = req.body;
    if (!horizonData) {
      return res.status(400).json({ error: "Missing horizonData in request body" });
    }

    const prompt = buildPrompt(horizonData);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 8000,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a world-class competitive intelligence analyst. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `OpenAI API error: ${errText}` });
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    // Parse JSON (OpenAI json_object mode should return clean JSON, but handle code blocks just in case)
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
  return `Based on the following product strategy information, perform a DEEP competitive landscape analysis.

## Product Strategy Context

**Mission:** ${horizonData.mission || "Not provided"}
**Anti-Mission (What we refuse to do):** ${horizonData.antiMission || "Not provided"}
**Strategic Tenets:** ${(horizonData.tenets || []).filter(Boolean).join(", ") || "Not provided"}
**Market Tailwinds:** ${horizonData.tailwinds || "Not provided"}
**Market Headwinds:** ${horizonData.headwinds || "Not provided"}
**Core Customer Pain:** ${horizonData.customerPain || "Not provided"}
**OKRs:** ${JSON.stringify(horizonData.okrs?.filter(o => o.objective) || [])}

## Your Task

Provide a comprehensive competitive analysis in the following JSON format. Be thorough — identify 10-15+ competitors across all categories. For each competitor, provide genuine competitive intelligence, not generic descriptions.

Return ONLY valid JSON with this structure:
{
  "landscapeSummary": "2-3 paragraph executive summary of the competitive landscape, key dynamics, and strategic implications",
  "competitors": [
    {
      "name": "Company Name",
      "category": "direct" | "indirect" | "emerging" | "adjacent",
      "description": "What they do and why they're relevant (2-3 sentences)",
      "strengths": ["strength1", "strength2", "strength3"],
      "weaknesses": ["weakness1", "weakness2"],
      "threat": "What specific threat they pose to your strategy",
      "aiRiskRating": "critical" | "high" | "medium" | "low" | "minimal",
      "riskRationale": "Why this risk level — be specific about the competitive dynamics"
    }
  ],
  "marketDynamics": {
    "consolidationTrend": "Description of M&A and consolidation patterns",
    "emergingThreats": "New entrants or technology shifts that could disrupt",
    "regulatoryFactors": "Regulatory environment impact",
    "switchingCosts": "Assessment of switching costs in this market"
  },
  "strategicRecommendations": [
    "Specific actionable recommendation based on the analysis"
  ],
  "challengerQuestions": {
    "moat": [
      {"question": "Tough question about competitive moat based on this specific landscape", "context": "Why this question matters given the competitors identified"},
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."}
    ],
    "market": [
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."}
    ],
    "execution": [
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."}
    ],
    "customer": [
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."}
    ],
    "economics": [
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."}
    ],
    "strategy": [
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."},
      {"question": "...", "context": "..."}
    ]
  }
}

Be aggressive and thorough. This is a challenger exercise — the questions should be uncomfortable and force the PM to defend their strategy against real competitive threats you've identified.`;
}
