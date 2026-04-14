import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Eye, Sword, DollarSign, Target, Shield, Zap, Users, TrendingUp,
  Lock, Check, ChevronRight, ChevronLeft, ArrowRight, AlertTriangle,
  Crown, Flame, BarChart3, Layers, Brain, Loader2, Star, Plus, X,
  Search, Globe, Sparkles, RefreshCw
} from "lucide-react";

// ─── BRAND COLORS ───────────────────────────────────────────────────────────
const BRAND = {
  navy: "#0f1a3d",
  red: "#EC0041",
  redHover: "#860025",
  redActive: "#530017",
  lightGray: "#f8f9fb",
  midGray: "#e5e7ec",
  textPrimary: "#0f1a3d",
  textSecondary: "#4a5068",
  textMuted: "#8890a4",
};

// ─── INTERROGATION CATEGORIES ───────────────────────────────────────────────
const INTERROGATION_CATEGORIES = [
  { id: "moat", label: "Competitive Moat", icon: Shield, description: "Defensibility & barriers to entry" },
  { id: "market", label: "Market Reality", icon: TrendingUp, description: "Timing, sizing & dynamics" },
  { id: "execution", label: "Execution Risk", icon: Zap, description: "Team, tech & operational capacity" },
  { id: "customer", label: "Customer Truth", icon: Users, description: "Real demand vs. assumed demand" },
  { id: "economics", label: "Unit Economics", icon: BarChart3, description: "Revenue model sustainability" },
  { id: "strategy", label: "Strategic Leverage", icon: Target, description: "Asymmetric advantages" },
];

// ─── PRICING TEMPLATES ──────────────────────────────────────────────────────
const PRICING_TEMPLATES = {
  entry: {
    name: "Entry",
    subtitle: "Land & Prove Value",
    color: "from-blue-500/20 to-blue-600/10",
  },
  growth: {
    name: "Growth",
    subtitle: "Expand & Entrench",
    color: "from-emerald-500/20 to-emerald-600/10",
  },
  enterprise: {
    name: "Enterprise",
    subtitle: "Lock-in & Maximize",
    color: "from-purple-500/20 to-purple-600/10",
  },
};

// ─── JW PLAYER LOGO ────────────────────────────────────────────────────────
// Place the actual JW Player logo at public/jw-logo.png in the repo
const JWLogo = ({ size = 32 }) => (
  <img
    src="/jw-logo.png"
    alt="JW Player"
    width={size}
    height={size}
    style={{ objectFit: "contain", background: "transparent" }}
  />
);

// ─── REUSABLE COMPONENTS ────────────────────────────────────────────────────
const TextArea = ({ label, value, onChange, placeholder, rows = 3, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold" style={{ color: BRAND.navy }}>{label}</label>
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-xl border-2 bg-white px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-0"
      style={{
        borderColor: BRAND.midGray,
        color: BRAND.textPrimary,
      }}
      onFocus={(e) => e.target.style.borderColor = BRAND.red}
      onBlur={(e) => e.target.style.borderColor = BRAND.midGray}
    />
    {hint && <p className="text-xs" style={{ color: BRAND.textMuted }}>{hint}</p>}
  </div>
);

const InputField = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold" style={{ color: BRAND.navy }}>{label}</label>
    <input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border-2 bg-white px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-0"
      style={{
        borderColor: BRAND.midGray,
        color: BRAND.textPrimary,
      }}
      onFocus={(e) => e.target.style.borderColor = BRAND.red}
      onBlur={(e) => e.target.style.borderColor = BRAND.midGray}
    />
  </div>
);

const Badge = ({ children, variant = "default" }) => {
  const styles = {
    default: { backgroundColor: `${BRAND.red}15`, color: BRAND.red, border: `1px solid ${BRAND.red}30` },
    danger: { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" },
    success: { backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" },
    warning: { backgroundColor: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" },
    ai: { backgroundColor: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" },
  };
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase"
      style={styles[variant] || styles.default}
    >
      {children}
    </span>
  );
};

const SectionCard = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border-2 bg-white p-6 shadow-sm ${className}`}
    style={{ borderColor: BRAND.midGray }}
  >
    {children}
  </div>
);

const RiskBadge = ({ level }) => {
  const config = {
    critical: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca", label: "Critical" },
    high: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa", label: "High" },
    medium: { bg: "#fffbeb", text: "#d97706", border: "#fde68a", label: "Medium" },
    low: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0", label: "Low" },
    minimal: { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0", label: "Minimal" },
  };
  const c = config[level] || config.medium;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  );
};

// ─── AI ANALYSIS ENGINE ─────────────────────────────────────────────────────
const callAnalysisAPI = async (horizonData) => {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ horizonData }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || `API Error ${response.status}`);
  }

  return response.json();
};

// ─── AI SCORING ENGINE ─────────────────────────────────────────────────────
const callScoringAPI = async ({ question, answer, context, category, competitorContext, horizonContext }) => {
  const response = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, answer, context, category, competitorContext, horizonContext }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || `API Error ${response.status}`);
  }

  return response.json();
};

// ─── MODULE 1: THE HORIZON ──────────────────────────────────────────────────
const HorizonModule = ({ data, setData, onComplete }) => {
  const sections = [
    {
      id: "mission",
      content: (
        <div className="space-y-5">
          <TextArea
            label="Mission Statement"
            value={data.mission}
            onChange={(v) => setData({ ...data, mission: v })}
            placeholder="In one sentence: what does this product exist to do? Not 'help customers' — the specific transformation you enable. This should be so clear that a competitor reading it would know exactly where you're aiming."
            rows={3}
            hint="Great missions are specific enough to say NO to things. If your mission could belong to any competitor, it's too vague."
          />
          <TextArea
            label="Anti-Mission (What We Refuse To Do)"
            value={data.antiMission}
            onChange={(v) => setData({ ...data, antiMission: v })}
            placeholder="What will you explicitly NOT do, even if customers ask? This is as strategic as your mission. Every company that lost focus said 'yes' one too many times."
            rows={3}
          />
        </div>
      ),
    },
    {
      id: "tenets",
      content: (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: BRAND.textSecondary }}>
            Strategic tenets are your decision-making shortcuts. When two good options conflict, tenets break the tie.
          </p>
          {(data.tenets || ["", "", "", ""]).map((t, i) => (
            <InputField
              key={i}
              label={`Tenet ${i + 1}`}
              value={t}
              onChange={(v) => {
                const newTenets = [...(data.tenets || ["", "", "", ""])];
                newTenets[i] = v;
                setData({ ...data, tenets: newTenets });
              }}
              placeholder={[
                "e.g., 'Developer experience over enterprise features'",
                "e.g., 'Latency is a feature — sub-100ms or don't ship'",
                "e.g., 'Open standards over proprietary lock-in'",
                "e.g., 'Revenue quality over revenue quantity'",
              ][i]}
            />
          ))}
        </div>
      ),
    },
    {
      id: "drivers",
      content: (
        <div className="space-y-5">
          <TextArea
            label="Market Tailwinds"
            value={data.tailwinds}
            onChange={(v) => setData({ ...data, tailwinds: v })}
            placeholder="What macro trends are accelerating demand for your solution? Be specific — 'AI is growing' is not a tailwind. 'Enterprise video consumption is up 340% since 2020 and IT teams lack tools to manage it' is."
            rows={3}
          />
          <TextArea
            label="Market Headwinds"
            value={data.headwinds}
            onChange={(v) => setData({ ...data, headwinds: v })}
            placeholder="What forces are working against you? Economic, regulatory, competitive, behavioral. Be brutally honest — The Gauntlet will expose any blind spots here."
            rows={3}
          />
          <TextArea
            label="Core Customer Pain"
            value={data.customerPain}
            onChange={(v) => setData({ ...data, customerPain: v })}
            placeholder="What's the #1 pain your customer has TODAY that your product solves? Not 'they need better tools' — the actual felt pain. 'Their video infrastructure costs $200K/yr and breaks during traffic spikes, costing them $50K per incident.'"
            rows={3}
          />
        </div>
      ),
    },
    {
      id: "okrs",
      content: (
        <div className="space-y-6">
          {(data.okrs || [{}, {}, {}]).map((okr, i) => (
            <div key={i} className="rounded-xl border-2 p-5 space-y-3" style={{ borderColor: BRAND.midGray }}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: BRAND.red }}
                >
                  O{i + 1}
                </div>
                <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>Objective {i + 1}</span>
              </div>
              <InputField
                label="Objective"
                value={okr.objective}
                onChange={(v) => {
                  const newOkrs = [...(data.okrs || [{}, {}, {}])];
                  newOkrs[i] = { ...newOkrs[i], objective: v };
                  setData({ ...data, okrs: newOkrs });
                }}
                placeholder="Qualitative goal — ambitious but achievable"
              />
              <TextArea
                label="Key Results"
                value={okr.keyResults}
                onChange={(v) => {
                  const newOkrs = [...(data.okrs || [{}, {}, {}])];
                  newOkrs[i] = { ...newOkrs[i], keyResults: v };
                  setData({ ...data, okrs: newOkrs });
                }}
                placeholder="3 measurable results (one per line). Must be quantified."
                rows={3}
              />
            </div>
          ))}
        </div>
      ),
    },
  ];

  const sectionLabels = ["Mission & Anti-Mission", "Strategic Tenets", "Market Drivers", "OKRs"];
  const sectionIcons = [Target, Shield, TrendingUp, Zap];
  const [activeSection, setActiveSection] = useState(0);

  const completeness = useMemo(() => {
    let filled = 0;
    let total = 9;
    if (data.mission) filled++;
    if (data.antiMission) filled++;
    (data.tenets || []).forEach((t) => { if (t) filled++; });
    if (data.tailwinds) filled++;
    if (data.headwinds) filled++;
    if (data.customerPain) filled++;
    // Not counting OKRs as required
    return Math.round((filled / total) * 100);
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {sectionLabels.map((label, i) => {
          const Icon = sectionIcons[i];
          return (
            <button
              key={i}
              onClick={() => setActiveSection(i)}
              className="flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all"
              style={{
                borderColor: activeSection === i ? BRAND.red : BRAND.midGray,
                backgroundColor: activeSection === i ? `${BRAND.red}08` : "white",
                color: activeSection === i ? BRAND.red : BRAND.textSecondary,
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Active Section */}
      <SectionCard>
        <div className="mb-5">
          <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>
            {sectionLabels[activeSection]}
          </h3>
        </div>
        {sections[activeSection].content}
      </SectionCard>

      {/* Completeness & Lock */}
      <div className="flex items-center justify-between rounded-2xl border-2 bg-white p-5" style={{ borderColor: BRAND.midGray }}>
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12">
            <svg className="h-12 w-12 -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke={BRAND.midGray} strokeWidth="3" />
              <circle
                cx="24" cy="24" r="20" fill="none"
                stroke={completeness >= 80 ? "#16a34a" : BRAND.red}
                strokeWidth="3"
                strokeDasharray={`${completeness * 1.257} 999`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: BRAND.navy }}>
              {completeness}%
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: BRAND.navy }}>Horizon Completeness</p>
            <p className="text-xs" style={{ color: BRAND.textMuted }}>
              {completeness >= 80 ? "Ready to face The Gauntlet" : "Fill in more fields to unlock The Gauntlet"}
            </p>
          </div>
        </div>
        <button
          onClick={onComplete}
          disabled={completeness < 60}
          className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: completeness >= 60 ? BRAND.red : BRAND.midGray }}
          onMouseEnter={(e) => { if (completeness >= 60) e.target.style.backgroundColor = BRAND.redHover; }}
          onMouseLeave={(e) => { if (completeness >= 60) e.target.style.backgroundColor = BRAND.red; }}
        >
          <Lock size={16} />
          Lock Horizon & Enter The Gauntlet
        </button>
      </div>
    </div>
  );
};

// ─── MODULE 2: THE GAUNTLET (AI-POWERED) ────────────────────────────────────
const GauntletModule = ({ data, setData, horizonData, onComplete }) => {
  // Restore state from persisted data if available
  const [phase, setPhase] = useState(data.analysisResult ? "results" : "setup");
  const [analysisResult, setAnalysisResult] = useState(data.analysisResult || null);
  const [analysisError, setAnalysisError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualCompetitors, setManualCompetitors] = useState(data.manualCompetitors || []);
  const [newCompetitorName, setNewCompetitorName] = useState("");
  const [pmRatings, setPmRatings] = useState(data.pmRatings || {});
  const [activeCategory, setActiveCategory] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState(data.interrogationResponses || {});
  const [scores, setScores] = useState(data.interrogationScores || {});
  const [competitorFilter, setCompetitorFilter] = useState("all");
  const [evaluations, setEvaluations] = useState(data.evaluations || {}); // AI evaluations keyed by responseKey
  const [followUpResponses, setFollowUpResponses] = useState(data.followUpResponses || {}); // Follow-up answers keyed by responseKey
  const [pmScores, setPmScores] = useState(data.pmScores || {}); // PM self-ratings before AI scores
  const [isScoring, setIsScoring] = useState(false);
  const [scoringError, setScoringError] = useState(null);

  // Persist Gauntlet internal state back to parent on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setData((prev) => ({
        ...prev,
        analysisResult,
        manualCompetitors,
        pmRatings,
        interrogationResponses: responses,
        interrogationScores: scores,
        evaluations,
        followUpResponses,
        pmScores,
      }));
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisResult, manualCompetitors, pmRatings, responses, scores, evaluations, followUpResponses, pmScores]);

  // Challenger questions from AI or fallback
  const challengerQuestions = useMemo(() => {
    if (analysisResult?.challengerQuestions) {
      return analysisResult.challengerQuestions;
    }
    return null;
  }, [analysisResult]);

  const allCompetitors = useMemo(() => {
    const aiCompetitors = (analysisResult?.competitors || []).map((c) => ({
      ...c,
      source: "ai",
    }));
    const manual = manualCompetitors.map((c) => ({
      ...c,
      source: "manual",
    }));
    return [...aiCompetitors, ...manual];
  }, [analysisResult, manualCompetitors]);

  const filteredCompetitors = useMemo(() => {
    if (competitorFilter === "all") return allCompetitors;
    return allCompetitors.filter((c) => c.category === competitorFilter);
  }, [allCompetitors, competitorFilter]);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setPhase("analyzing");

    try {
      const result = await callAnalysisAPI(horizonData);
      setAnalysisResult(result);
      setPhase("results");
    } catch (err) {
      setAnalysisError(err.message);
      setPhase("setup");
    } finally {
      setIsAnalyzing(false);
    }
  }, [horizonData]);

  const addManualCompetitor = () => {
    if (!newCompetitorName.trim()) return;
    setManualCompetitors([
      ...manualCompetitors,
      {
        name: newCompetitorName,
        category: "direct",
        description: "",
        strengths: [],
        weaknesses: [],
        threat: "",
        aiRiskRating: "medium",
        riskRationale: "PM-added competitor — rate manually",
      },
    ]);
    setNewCompetitorName("");
  };

  const categoryColors = {
    direct: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
    indirect: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
    emerging: { bg: "#f5f3ff", text: "#7c3aed", border: "#ddd6fe" },
    adjacent: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  };

  // ── SETUP PHASE ──
  if (phase === "setup") {
    return (
      <div className="space-y-6">
        <SectionCard>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${BRAND.red}10` }}>
              <Brain size={24} style={{ color: BRAND.red }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>
                AI Competitive Intelligence Engine
              </h3>
              <p className="text-sm" style={{ color: BRAND.textSecondary }}>
                AI will analyze your Horizon data and deliver a deep competitive landscape analysis
              </p>
            </div>
          </div>

          <div className="rounded-xl border-2 p-5 space-y-4 mb-5" style={{ borderColor: BRAND.midGray }}>
            <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: BRAND.navy }}>
              <Sparkles size={16} style={{ color: BRAND.red }} />
              What the AI will analyze:
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                "10-15+ competitors (direct, indirect, emerging)",
                "Risk ratings with rationale for each",
                "Market dynamics & consolidation trends",
                "Switching costs & regulatory factors",
                "Strategic recommendations",
                "12 pointed challenger questions tied to your competitors",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm" style={{ color: BRAND.textSecondary }}>
                  <Check size={14} className="mt-0.5 shrink-0" style={{ color: "#16a34a" }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Horizon Data Preview */}
          <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: BRAND.lightGray }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: BRAND.textMuted }}>
              Data from The Horizon
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold" style={{ color: BRAND.textMuted }}>Mission</p>
                <p className="text-sm mt-0.5" style={{ color: BRAND.textPrimary }}>
                  {horizonData.mission || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: BRAND.textMuted }}>Customer Pain</p>
                <p className="text-sm mt-0.5" style={{ color: BRAND.textPrimary }}>
                  {horizonData.customerPain || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: BRAND.textMuted }}>Tailwinds</p>
                <p className="text-sm mt-0.5" style={{ color: BRAND.textPrimary }}>
                  {horizonData.tailwinds || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: BRAND.textMuted }}>Headwinds</p>
                <p className="text-sm mt-0.5" style={{ color: BRAND.textPrimary }}>
                  {horizonData.headwinds || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Run Analysis Button */}
          <button
            onClick={runAnalysis}
            className="w-full rounded-xl px-6 py-4 text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: BRAND.red }}
            onMouseEnter={(e) => e.target.style.backgroundColor = BRAND.redHover}
            onMouseLeave={(e) => e.target.style.backgroundColor = BRAND.red}
          >
            <Brain size={18} />
            Run Deep Competitive Analysis
          </button>

          {analysisError && (
            <div className="rounded-xl border-2 p-4 mt-4" style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}>
              <p className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle size={16} /> Analysis Error
              </p>
              <p className="text-xs text-red-500 mt-1">{analysisError}</p>
            </div>
          )}
        </SectionCard>
      </div>
    );
  }

  // ── ANALYZING PHASE ──
  if (phase === "analyzing") {
    return (
      <div className="space-y-6">
        <SectionCard>
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${BRAND.red}10` }}>
                <Brain size={36} style={{ color: BRAND.red }} className="animate-pulse" />
              </div>
              <Loader2 size={56} className="absolute -top-4 -left-4 animate-spin" style={{ color: `${BRAND.red}40` }} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2" style={{ color: BRAND.navy }}>
                Running Deep Competitive Analysis
              </h3>
              <p className="text-sm max-w-md" style={{ color: BRAND.textSecondary }}>
                AI is analyzing your strategy, identifying 10-15+ competitors across the landscape,
                assessing risk levels, and crafting targeted challenger questions...
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              {["Scanning market", "Identifying competitors", "Assessing threats", "Building questions"].map((step, i) => (
                <span
                  key={i}
                  className="rounded-full px-3 py-1 text-xs font-medium animate-pulse"
                  style={{
                    backgroundColor: `${BRAND.red}10`,
                    color: BRAND.red,
                    animationDelay: `${i * 0.5}s`,
                  }}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  // ── RESULTS PHASE (Competitive Landscape) ──
  if (phase === "results") {
    return (
      <div className="space-y-6">
        {/* Landscape Summary */}
        <SectionCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${BRAND.red}10` }}>
                <Globe size={20} style={{ color: BRAND.red }} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>Competitive Landscape</h3>
                <p className="text-xs" style={{ color: BRAND.textMuted }}>
                  {allCompetitors.length} competitors identified
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="ai">AI-Powered</Badge>
              <button
                onClick={() => setPhase("setup")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border-2 transition-all"
                style={{ borderColor: BRAND.midGray, color: BRAND.textSecondary }}
              >
                <RefreshCw size={12} /> Re-analyze
              </button>
            </div>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: BRAND.textSecondary }}>
            {analysisResult?.landscapeSummary}
          </p>
        </SectionCard>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: `All (${allCompetitors.length})` },
            { key: "direct", label: `Direct (${allCompetitors.filter((c) => c.category === "direct").length})` },
            { key: "indirect", label: `Indirect (${allCompetitors.filter((c) => c.category === "indirect").length})` },
            { key: "emerging", label: `Emerging (${allCompetitors.filter((c) => c.category === "emerging").length})` },
            { key: "adjacent", label: `Adjacent (${allCompetitors.filter((c) => c.category === "adjacent").length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCompetitorFilter(tab.key)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold border-2 transition-all"
              style={{
                borderColor: competitorFilter === tab.key ? BRAND.red : BRAND.midGray,
                backgroundColor: competitorFilter === tab.key ? `${BRAND.red}08` : "white",
                color: competitorFilter === tab.key ? BRAND.red : BRAND.textSecondary,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Competitor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCompetitors.map((comp, i) => {
            const catColor = categoryColors[comp.category] || categoryColors.direct;
            return (
              <div
                key={`${comp.name}-${i}`}
                className="rounded-2xl border-2 bg-white p-5 space-y-3 transition-all hover:shadow-md"
                style={{ borderColor: BRAND.midGray }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold" style={{ color: BRAND.navy }}>{comp.name}</h4>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{ backgroundColor: catColor.bg, color: catColor.text, border: `1px solid ${catColor.border}` }}
                      >
                        {comp.category}
                      </span>
                      {comp.source === "manual" && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-500">PM Added</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: BRAND.textSecondary }}>{comp.description}</p>
                  </div>
                </div>

                {/* Risk Ratings */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Brain size={12} style={{ color: "#7c3aed" }} />
                    <span className="text-[10px] font-semibold" style={{ color: BRAND.textMuted }}>AI Risk:</span>
                    <RiskBadge level={comp.aiRiskRating} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={12} style={{ color: BRAND.red }} />
                    <span className="text-[10px] font-semibold" style={{ color: BRAND.textMuted }}>PM Risk:</span>
                    <select
                      value={pmRatings[comp.name] || ""}
                      onChange={(e) => setPmRatings({ ...pmRatings, [comp.name]: e.target.value })}
                      className="rounded-md border text-xs px-2 py-0.5 font-semibold"
                      style={{ borderColor: BRAND.midGray, color: BRAND.textPrimary }}
                    >
                      <option value="">Rate...</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                      <option value="minimal">Minimal</option>
                    </select>
                    {pmRatings[comp.name] && <RiskBadge level={pmRatings[comp.name]} />}
                  </div>
                </div>

                {/* Risk Rationale */}
                <p className="text-xs italic" style={{ color: BRAND.textMuted }}>
                  {comp.riskRationale}
                </p>

                {/* Strengths & Weaknesses */}
                {(comp.strengths?.length > 0 || comp.weaknesses?.length > 0) && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#dc2626" }}>Strengths</p>
                      {(comp.strengths || []).map((s, j) => (
                        <p key={j} className="text-xs flex items-start gap-1" style={{ color: BRAND.textSecondary }}>
                          <span className="text-red-400 mt-0.5">•</span> {s}
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#16a34a" }}>Weaknesses</p>
                      {(comp.weaknesses || []).map((w, j) => (
                        <p key={j} className="text-xs flex items-start gap-1" style={{ color: BRAND.textSecondary }}>
                          <span className="text-green-400 mt-0.5">•</span> {w}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Manual Competitor */}
        <SectionCard>
          <h4 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: BRAND.navy }}>
            <Plus size={16} style={{ color: BRAND.red }} />
            Add Your Own Competitor
          </h4>
          <div className="flex gap-3">
            <input
              value={newCompetitorName}
              onChange={(e) => setNewCompetitorName(e.target.value)}
              placeholder="Competitor name..."
              className="flex-1 rounded-xl border-2 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none"
              style={{ borderColor: BRAND.midGray, color: BRAND.textPrimary }}
              onKeyDown={(e) => e.key === "Enter" && addManualCompetitor()}
              onFocus={(e) => e.target.style.borderColor = BRAND.red}
              onBlur={(e) => e.target.style.borderColor = BRAND.midGray}
            />
            <button
              onClick={addManualCompetitor}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-white flex items-center gap-2"
              style={{ backgroundColor: BRAND.red }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </SectionCard>

        {/* Market Dynamics */}
        {analysisResult?.marketDynamics && (
          <SectionCard>
            <h4 className="text-sm font-bold flex items-center gap-2 mb-4" style={{ color: BRAND.navy }}>
              <TrendingUp size={16} style={{ color: BRAND.red }} />
              Market Dynamics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(analysisResult.marketDynamics).map(([key, value]) => (
                <div key={key} className="rounded-xl p-4" style={{ backgroundColor: BRAND.lightGray }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: BRAND.textMuted }}>
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <p className="text-sm" style={{ color: BRAND.textSecondary }}>{value}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Strategic Recommendations */}
        {analysisResult?.strategicRecommendations?.length > 0 && (
          <SectionCard>
            <h4 className="text-sm font-bold flex items-center gap-2 mb-4" style={{ color: BRAND.navy }}>
              <Sparkles size={16} style={{ color: BRAND.red }} />
              Strategic Recommendations
            </h4>
            <div className="space-y-2">
              {analysisResult.strategicRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ backgroundColor: BRAND.lightGray }}>
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: BRAND.red }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-sm" style={{ color: BRAND.textSecondary }}>{rec}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Enter Interrogation */}
        <button
          onClick={() => {
            setData({
              ...data,
              competitors: allCompetitors,
              pmRatings,
              analysisResult,
            });
            setPhase("interrogation");
          }}
          className="w-full rounded-2xl border-2 py-5 px-6 text-sm font-bold transition-all flex items-center justify-center gap-3 group"
          style={{
            borderColor: BRAND.red,
            backgroundColor: `${BRAND.red}05`,
            color: BRAND.red,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = BRAND.red;
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${BRAND.red}05`;
            e.currentTarget.style.color = BRAND.red;
          }}
        >
          <Flame size={20} className="group-hover:animate-pulse" />
          Enter Steel Man Interrogation — {challengerQuestions ? "12 AI-Tailored Questions" : "12 Questions"}
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  // ── INTERROGATION PHASE ──
  if (phase === "interrogation") {
    const cat = INTERROGATION_CATEGORIES[activeCategory];
    const CatIcon = cat.icon;
    const questions = challengerQuestions?.[cat.id] || [];
    const currentQ = questions[currentQuestionIndex];
    const responseKey = `${cat.id}_${currentQuestionIndex}`;

    const totalAnswered = Object.keys(responses).filter((k) => responses[k]).length;
    const totalQuestions = INTERROGATION_CATEGORIES.length * 2;
    const catAnswered = Object.keys(responses).filter((k) => k.startsWith(cat.id) && responses[k]).length;

    return (
      <div className="space-y-6">
        {/* Interrogation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${BRAND.red}10` }}>
              <Flame size={20} style={{ color: BRAND.red }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>Steel Man Interrogation</h3>
              <p className="text-xs" style={{ color: BRAND.textMuted }}>
                {totalAnswered}/{totalQuestions} challenges answered
              </p>
            </div>
          </div>
          <Badge variant="danger">HOSTILE</Badge>
        </div>

        {/* Progress Bar */}
        <div className="h-2 rounded-full" style={{ backgroundColor: BRAND.midGray }}>
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${(totalAnswered / totalQuestions) * 100}%`, backgroundColor: BRAND.red }}
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {INTERROGATION_CATEGORIES.map((c, i) => {
            const Icon = c.icon;
            const answered = Object.keys(responses).filter((k) => k.startsWith(c.id) && responses[k]).length;
            return (
              <button
                key={c.id}
                onClick={() => { setActiveCategory(i); setCurrentQuestionIndex(0); }}
                className="flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-semibold transition-all"
                style={{
                  borderColor: activeCategory === i ? BRAND.red : BRAND.midGray,
                  backgroundColor: activeCategory === i ? `${BRAND.red}08` : "white",
                  color: activeCategory === i ? BRAND.red : BRAND.textSecondary,
                }}
              >
                <Icon size={14} />
                {c.label}
                <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{
                  backgroundColor: answered === 2 ? "#dcfce7" : `${BRAND.red}10`,
                  color: answered === 2 ? "#16a34a" : BRAND.red,
                }}>
                  {answered}/2
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Question */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <CatIcon size={18} style={{ color: BRAND.red }} />
            <h4 className="text-sm font-bold" style={{ color: BRAND.navy }}>
              {cat.label} — Question {currentQuestionIndex + 1}/2
            </h4>
          </div>

          {currentQ && (
            <>
              <p className="text-base font-semibold mb-2" style={{ color: BRAND.navy }}>
                {currentQ.question}
              </p>
              {currentQ.context && (
                <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: `${BRAND.red}05`, border: `1px solid ${BRAND.red}20` }}>
                  <p className="text-xs flex items-start gap-2" style={{ color: BRAND.red }}>
                    <Brain size={12} className="mt-0.5 shrink-0" />
                    <span className="italic">{currentQ.context}</span>
                  </p>
                </div>
              )}
            </>
          )}

          {/* Answer Input */}
          <textarea
            value={responses[responseKey] || ""}
            onChange={(e) => setResponses({ ...responses, [responseKey]: e.target.value })}
            placeholder="Defend your position. Be specific — hand-waving will be exposed..."
            rows={4}
            disabled={!!evaluations[responseKey]}
            className="w-full rounded-xl border-2 bg-white px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:outline-none mb-4 disabled:opacity-60 disabled:bg-gray-50"
            style={{ borderColor: BRAND.midGray, color: BRAND.textPrimary }}
            onFocus={(e) => e.target.style.borderColor = BRAND.red}
            onBlur={(e) => e.target.style.borderColor = BRAND.midGray}
          />

          {/* PM Self-Rating — auto-triggers AI evaluation on click */}
          {!evaluations[responseKey] && !isScoring && responses[responseKey]?.trim() && (
            <div className="rounded-xl border-2 p-4 mb-4 space-y-3" style={{ borderColor: BRAND.midGray }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: BRAND.navy }}>Rate Your Answer</span>
                <span className="text-[10px]" style={{ color: BRAND.textMuted }}>AI evaluation starts automatically</span>
              </div>
              <p className="text-xs" style={{ color: BRAND.textMuted }}>Be honest — the AI will score you next, and we'll compare.</p>
              <div className="flex gap-2">
                {[
                  { val: 1, label: "No Answer", desc: "Can't defend this" },
                  { val: 2, label: "Weak", desc: "Hand-waving" },
                  { val: 3, label: "Partial", desc: "Some evidence" },
                  { val: 4, label: "Strong", desc: "Data-backed" },
                  { val: 5, label: "Bulletproof", desc: "Unassailable" },
                ].map((option) => (
                  <button
                    key={option.val}
                    onClick={async () => {
                      // Lock in PM score and immediately trigger AI evaluation
                      const updatedPmScores = { ...pmScores, [responseKey]: option.val };
                      setPmScores(updatedPmScores);
                      setIsScoring(true);
                      setScoringError(null);
                      try {
                        const competitorSummary = (analysisResult?.competitors || [])
                          .map(c => `${c.name} (${c.category}, risk: ${c.aiRiskRating}): ${c.description}`)
                          .join("\n");
                        const horizonSummary = `Mission: ${horizonData.mission}\nAnti-Mission: ${horizonData.antiMission}\nTailwinds: ${horizonData.tailwinds}\nHeadwinds: ${horizonData.headwinds}\nCustomer Pain: ${horizonData.customerPain}`;
                        const evaluation = await callScoringAPI({
                          question: currentQ?.question || "",
                          answer: responses[responseKey],
                          context: currentQ?.context || "",
                          category: cat.label,
                          competitorContext: competitorSummary,
                          horizonContext: horizonSummary,
                        });
                        setEvaluations((prev) => ({ ...prev, [responseKey]: evaluation }));
                        setScores((prev) => ({ ...prev, [responseKey]: evaluation.score }));
                      } catch (err) {
                        setScoringError(err.message);
                      } finally {
                        setIsScoring(false);
                      }
                    }}
                    className="flex-1 rounded-lg border-2 py-2 px-1 text-center transition-all"
                    style={{
                      borderColor: BRAND.midGray,
                      backgroundColor: "white",
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: BRAND.navy }}>{option.label}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scoring in Progress */}
          {isScoring && (
            <div className="rounded-xl border-2 p-6 mb-4 flex flex-col items-center gap-3" style={{ borderColor: BRAND.midGray }}>
              <Loader2 size={24} className="animate-spin" style={{ color: BRAND.red }} />
              <p className="text-sm font-semibold" style={{ color: BRAND.navy }}>AI is evaluating your defense...</p>
              <p className="text-xs" style={{ color: BRAND.textMuted }}>Checking for hand-waving, logical gaps, and competitive blind spots</p>
            </div>
          )}

          {scoringError && (
            <div className="rounded-xl border-2 p-4 mb-4" style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}>
              <p className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle size={16} /> Evaluation Error
              </p>
              <p className="text-xs text-red-500 mt-1">{scoringError}</p>
              <button
                onClick={() => setScoringError(null)}
                className="mt-2 text-xs font-semibold underline"
                style={{ color: BRAND.red }}
              >
                Try again
              </button>
            </div>
          )}

          {/* AI Evaluation Result */}
          {evaluations[responseKey] && (() => {
            const aiScore = evaluations[responseKey].score;
            const pmScore = pmScores[responseKey] || 0;
            const delta = pmScore - aiScore;
            const deltaLabel = delta > 1 ? "OVERCONFIDENT" : delta > 0 ? "SLIGHTLY OPTIMISTIC" : delta === 0 ? "WELL CALIBRATED" : delta >= -1 ? "UNDERSELLING YOURSELF" : "MORE DEFENSIBLE THAN YOU THINK";
            const deltaColor = delta > 1 ? "#dc2626" : delta > 0 ? "#d97706" : delta === 0 ? "#16a34a" : "#2563eb";
            return (
            <div className="space-y-4 mb-4">
              {/* PM vs AI Score Comparison */}
              <div className="rounded-xl border-2 p-4" style={{ borderColor: BRAND.midGray }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: BRAND.navy }}>Score Comparison</span>
                  <span className="text-xs font-black px-3 py-1 rounded-full" style={{ backgroundColor: `${deltaColor}15`, color: deltaColor, border: `1px solid ${deltaColor}40` }}>
                    {deltaLabel}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* PM Score */}
                  <div className="text-center rounded-xl p-3" style={{ backgroundColor: BRAND.lightGray }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: BRAND.textMuted }}>Your Rating</p>
                    <p className="text-3xl font-black" style={{ color: BRAND.navy }}>{pmScore}</p>
                    <p className="text-[10px]" style={{ color: BRAND.textMuted }}>/5</p>
                  </div>
                  {/* Delta */}
                  <div className="text-center">
                    <div className="text-2xl font-black" style={{ color: deltaColor }}>
                      {delta > 0 ? `+${delta}` : delta === 0 ? "=" : delta}
                    </div>
                    <p className="text-[10px] font-bold" style={{ color: deltaColor }}>
                      {delta > 0 ? "GAP" : delta === 0 ? "MATCH" : "DELTA"}
                    </p>
                  </div>
                  {/* AI Score */}
                  <div className="text-center rounded-xl p-3" style={{
                    backgroundColor: aiScore <= 2 ? "#fef2f2" : aiScore <= 3 ? "#fffbeb" : "#f0fdf4",
                  }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: BRAND.textMuted }}>AI Rating</p>
                    <p className="text-3xl font-black" style={{ color: aiScore <= 2 ? "#dc2626" : aiScore <= 3 ? "#d97706" : "#16a34a" }}>{aiScore}</p>
                    <p className="text-[10px]" style={{ color: BRAND.textMuted }}>/5</p>
                  </div>
                </div>
                {delta > 1 && (
                  <div className="mt-3 rounded-lg p-2 flex items-center gap-2" style={{ backgroundColor: "#fef2f2" }}>
                    <AlertTriangle size={12} style={{ color: "#dc2626" }} />
                    <p className="text-[11px] font-semibold" style={{ color: "#dc2626" }}>
                      Blind spot detected — you think this is stronger than the evidence supports.
                    </p>
                  </div>
                )}
                {delta < -1 && (
                  <div className="mt-3 rounded-lg p-2 flex items-center gap-2" style={{ backgroundColor: "#eff6ff" }}>
                    <Star size={12} style={{ color: "#2563eb" }} />
                    <p className="text-[11px] font-semibold" style={{ color: "#2563eb" }}>
                      You're underselling this defense — the AI sees more strength here than you do. Use it.
                    </p>
                  </div>
                )}
              </div>

              {/* AI Assessment Detail */}
              <div className="rounded-xl border-2 p-4" style={{
                borderColor: aiScore <= 2 ? "#fecaca" : aiScore <= 3 ? "#fde68a" : "#bbf7d0",
                backgroundColor: aiScore <= 2 ? "#fef2f2" : aiScore <= 3 ? "#fffbeb" : "#f0fdf4",
              }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain size={16} style={{ color: BRAND.navy }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: BRAND.navy }}>AI Assessment</span>
                  </div>
                  <span className="text-sm font-black px-3 py-1 rounded-full" style={{
                    backgroundColor: aiScore <= 2 ? "#dc2626" : aiScore <= 3 ? "#d97706" : "#16a34a",
                    color: "white",
                  }}>
                    {aiScore}/5 — {evaluations[responseKey].label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textPrimary }}>
                  {evaluations[responseKey].assessment}
                </p>
                {evaluations[responseKey].gaps?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#dc2626" }}>Gaps Identified:</p>
                    {evaluations[responseKey].gaps.map((gap, gi) => (
                      <p key={gi} className="text-xs flex items-start gap-1.5" style={{ color: BRAND.textSecondary }}>
                        <AlertTriangle size={10} className="mt-0.5 shrink-0" style={{ color: "#dc2626" }} />
                        {gap}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Follow-Up Question */}
              {evaluations[responseKey].followUp && (
                <div className="rounded-xl border-2 p-4 space-y-3" style={{ borderColor: BRAND.red, backgroundColor: `${BRAND.red}03` }}>
                  <div className="flex items-center gap-2">
                    <Flame size={14} style={{ color: BRAND.red }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: BRAND.red }}>AI Follow-Up Challenge</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: BRAND.navy }}>
                    {evaluations[responseKey].followUp}
                  </p>
                  {evaluations[responseKey].followUpContext && (
                    <p className="text-xs italic" style={{ color: BRAND.textMuted }}>
                      {evaluations[responseKey].followUpContext}
                    </p>
                  )}
                  <textarea
                    value={followUpResponses[responseKey] || ""}
                    onChange={(e) => setFollowUpResponses({ ...followUpResponses, [responseKey]: e.target.value })}
                    placeholder="Dig deeper. The AI found a crack in your defense — seal it or acknowledge the gap..."
                    rows={3}
                    className="w-full rounded-xl border-2 bg-white px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:outline-none"
                    style={{ borderColor: BRAND.midGray, color: BRAND.textPrimary }}
                    onFocus={(e) => e.target.style.borderColor = BRAND.red}
                    onBlur={(e) => e.target.style.borderColor = BRAND.midGray}
                  />
                </div>
              )}
            </div>
          );
          })()}

          {/* Navigation */}
          <div className="flex justify-between pt-2 border-t-2" style={{ borderColor: BRAND.midGray }}>
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-30"
              style={{ color: BRAND.textSecondary }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={() => {
                if (currentQuestionIndex < 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                } else if (activeCategory < INTERROGATION_CATEGORIES.length - 1) {
                  setActiveCategory(activeCategory + 1);
                  setCurrentQuestionIndex(0);
                }
              }}
              className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold text-white transition-all"
              style={{ backgroundColor: BRAND.red }}
              onMouseEnter={(e) => e.target.style.backgroundColor = BRAND.redHover}
              onMouseLeave={(e) => e.target.style.backgroundColor = BRAND.red}
            >
              Next Challenge <ChevronRight size={16} />
            </button>
          </div>
        </SectionCard>

        {/* Vulnerability Report */}
        {totalAnswered >= totalQuestions && (
          <SectionCard>
            <h4 className="text-sm font-bold flex items-center gap-2 mb-4" style={{ color: BRAND.navy }}>
              <AlertTriangle size={16} style={{ color: "#d97706" }} /> Vulnerability Assessment
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {INTERROGATION_CATEGORIES.map((c) => {
                const aiCatScores = Object.entries(scores)
                  .filter(([k]) => k.startsWith(c.id))
                  .map(([, v]) => v);
                const pmCatScores = Object.entries(pmScores)
                  .filter(([k]) => k.startsWith(c.id))
                  .map(([, v]) => v);
                const aiAvg = aiCatScores.length > 0 ? (aiCatScores.reduce((a, b) => a + b, 0) / aiCatScores.length) : 0;
                const pmAvg = pmCatScores.length > 0 ? (pmCatScores.reduce((a, b) => a + b, 0) / pmCatScores.length) : 0;
                const delta = pmAvg - aiAvg;
                return (
                  <div key={c.id} className="rounded-xl border-2 p-3" style={{ borderColor: BRAND.midGray }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: BRAND.textMuted }}>{c.label}</p>
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-lg font-bold" style={{ color: aiAvg <= 2 ? "#dc2626" : aiAvg <= 3 ? "#d97706" : "#16a34a" }}>
                          {aiAvg.toFixed(1)}
                        </span>
                        <span className="text-[10px] ml-0.5" style={{ color: BRAND.textMuted }}>AI</span>
                      </div>
                      <div className="text-[10px] font-bold" style={{ color: BRAND.textMuted }}>vs</div>
                      <div>
                        <span className="text-lg font-bold" style={{ color: BRAND.navy }}>
                          {pmAvg.toFixed(1)}
                        </span>
                        <span className="text-[10px] ml-0.5" style={{ color: BRAND.textMuted }}>You</span>
                      </div>
                    </div>
                    {Math.abs(delta) > 0.5 && (
                      <p className="text-[10px] font-bold mt-1" style={{ color: delta > 0 ? "#dc2626" : "#2563eb" }}>
                        {delta > 0 ? `Blind spot (+${delta.toFixed(1)})` : `Underselling (${delta.toFixed(1)})`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => {
                setData({
                  ...data,
                  interrogationResponses: responses,
                  interrogationScores: scores,
                  evaluations,
                  followUpResponses,
                  pmScores,
                  competitors: allCompetitors,
                  pmRatings,
                  analysisResult,
                });
                onComplete();
              }}
              className="w-full rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: BRAND.red }}
              onMouseEnter={(e) => e.target.style.backgroundColor = BRAND.redHover}
              onMouseLeave={(e) => e.target.style.backgroundColor = BRAND.red}
            >
              <Crown size={16} />
              Survive The Gauntlet — Proceed to Monetization
            </button>
          </SectionCard>
        )}

        {/* Back */}
        <button
          onClick={() => setPhase("results")}
          className="text-xs flex items-center gap-1"
          style={{ color: BRAND.textMuted }}
        >
          <ChevronLeft size={12} /> Back to Competitive Landscape
        </button>
      </div>
    );
  }

  return null;
};

// ─── MODULE 3: MONETIZATION ─────────────────────────────────────────────────
const MonetizationModule = ({ data, setData, gauntletData, horizonData }) => {
  const [activeTier, setActiveTier] = useState("growth");

  const competitorNames = (gauntletData.competitors || []).map((c) => c.name).filter(Boolean);

  const weakAreas = useMemo(() => {
    const scores = gauntletData.interrogationScores || {};
    return INTERROGATION_CATEGORIES
      .map((c) => {
        const catScores = Object.entries(scores)
          .filter(([k]) => k.startsWith(c.id))
          .map(([, v]) => v);
        const avg = catScores.length > 0 ? catScores.reduce((a, b) => a + b, 0) / catScores.length : 3;
        return { ...c, avg };
      })
      .filter((c) => c.avg < 3.5)
      .sort((a, b) => a.avg - b.avg);
  }, [gauntletData]);

  return (
    <div className="space-y-6">
      {/* Inherited Intelligence */}
      <SectionCard>
        <h4 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: BRAND.navy }}>
          <Layers size={16} style={{ color: BRAND.red }} />
          Inherited from The Gauntlet
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ backgroundColor: BRAND.lightGray }}>
            <p className="text-xs font-semibold mb-1" style={{ color: BRAND.textMuted }}>Competitive Landscape</p>
            <p className="text-sm" style={{ color: BRAND.textPrimary }}>
              {competitorNames.length > 0 ? `${competitorNames.length} competitors: ${competitorNames.slice(0, 5).join(", ")}${competitorNames.length > 5 ? ` +${competitorNames.length - 5} more` : ""}` : "No competitors defined"}
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: BRAND.lightGray }}>
            <p className="text-xs font-semibold mb-1" style={{ color: BRAND.textMuted }}>Mission</p>
            <p className="text-sm" style={{ color: BRAND.textPrimary }}>{horizonData.mission || "Not yet defined"}</p>
          </div>
        </div>
        {weakAreas.length > 0 && (
          <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
            <p className="text-xs font-bold mb-1" style={{ color: "#dc2626" }}>Pricing Risk Zones (from Interrogation)</p>
            <p className="text-xs" style={{ color: BRAND.textSecondary }}>
              Weak scores in {weakAreas.map((w) => w.label).join(", ")} mean pricing must account for higher churn risk.
            </p>
          </div>
        )}
      </SectionCard>

      {/* Pricing Strategy */}
      <SectionCard>
        <div className="space-y-4">
          <TextArea
            label="Value Metric (What You Charge For)"
            value={data.valueMetric}
            onChange={(v) => setData({ ...data, valueMetric: v })}
            placeholder="The unit that scales with customer success. Not 'seats' unless value scales with headcount. (e.g., 'video minutes delivered', 'API calls', 'GB encoded')"
            rows={2}
            hint="The best value metrics correlate directly with the customer outcome your product enables."
          />
          <TextArea
            label="Pricing Philosophy"
            value={data.pricingPhilosophy}
            onChange={(v) => setData({ ...data, pricingPhilosophy: v })}
            placeholder="Value-based, cost-plus, or competitive? Why? How does this pricing create a moat — not just revenue?"
            rows={2}
          />
        </div>
      </SectionCard>

      {/* Tier Selector */}
      <div className="flex gap-3">
        {Object.entries(PRICING_TEMPLATES).map(([key, tier]) => (
          <button
            key={key}
            onClick={() => setActiveTier(key)}
            className="flex-1 rounded-2xl border-2 p-4 transition-all"
            style={{
              borderColor: activeTier === key ? BRAND.red : BRAND.midGray,
              backgroundColor: activeTier === key ? `${BRAND.red}05` : "white",
            }}
          >
            <p className="text-sm font-bold" style={{ color: activeTier === key ? BRAND.red : BRAND.navy }}>
              {tier.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>{tier.subtitle}</p>
          </button>
        ))}
      </div>

      {/* Active Tier Configuration */}
      <SectionCard>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>{PRICING_TEMPLATES[activeTier].name} Tier</h3>
            <p className="text-sm" style={{ color: BRAND.textSecondary }}>{PRICING_TEMPLATES[activeTier].subtitle}</p>
          </div>
          <Badge>
            {activeTier === "entry" ? "Land" : activeTier === "growth" ? "Expand" : "Lock-in"}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Price Point"
              value={data.tiers?.[activeTier]?.price || ""}
              onChange={(v) => {
                const newTiers = { ...(data.tiers || {}), [activeTier]: { ...(data.tiers?.[activeTier] || {}), price: v } };
                setData({ ...data, tiers: newTiers });
              }}
              placeholder={activeTier === "entry" ? "$0-99/mo" : activeTier === "growth" ? "$299-999/mo" : "Custom / $2,000+/mo"}
            />
            <InputField
              label="Target Segment"
              value={data.tiers?.[activeTier]?.segment || ""}
              onChange={(v) => {
                const newTiers = { ...(data.tiers || {}), [activeTier]: { ...(data.tiers?.[activeTier] || {}), segment: v } };
                setData({ ...data, tiers: newTiers });
              }}
              placeholder="Who is this tier designed for?"
            />
          </div>
          <TextArea
            label="Included Capabilities"
            value={data.tiers?.[activeTier]?.capabilities || ""}
            onChange={(v) => {
              const newTiers = { ...(data.tiers || {}), [activeTier]: { ...(data.tiers?.[activeTier] || {}), capabilities: v } };
              setData({ ...data, tiers: newTiers });
            }}
            placeholder="What's included? Be specific about limits — usage caps, feature gates, SLA levels."
            rows={3}
          />
          <TextArea
            label="Upgrade Trigger"
            value={data.tiers?.[activeTier]?.upgradeTrigger || ""}
            onChange={(v) => {
              const newTiers = { ...(data.tiers || {}), [activeTier]: { ...(data.tiers?.[activeTier] || {}), upgradeTrigger: v } };
              setData({ ...data, tiers: newTiers });
            }}
            placeholder="What usage pattern or business event pushes them to the next tier?"
            rows={2}
          />
          <TextArea
            label="Margin Defense"
            value={data.tiers?.[activeTier]?.marginDefense || ""}
            onChange={(v) => {
              const newTiers = { ...(data.tiers || {}), [activeTier]: { ...(data.tiers?.[activeTier] || {}), marginDefense: v } };
              setData({ ...data, tiers: newTiers });
            }}
            placeholder="Why can you sustain this margin? What cost advantages protect you from price compression?"
            rows={2}
          />
        </div>
      </SectionCard>

      {/* Unit Economics */}
      <SectionCard>
        <h4 className="text-sm font-bold flex items-center gap-2 mb-4" style={{ color: BRAND.navy }}>
          <BarChart3 size={16} style={{ color: BRAND.red }} />
          Unit Economics Assumptions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <InputField
            label="Target CAC"
            value={data.cac || ""}
            onChange={(v) => setData({ ...data, cac: v })}
            placeholder="$X"
          />
          <InputField
            label="Target LTV"
            value={data.ltv || ""}
            onChange={(v) => setData({ ...data, ltv: v })}
            placeholder="$X"
          />
          <InputField
            label="LTV:CAC Ratio"
            value={data.ltvCacRatio || ""}
            onChange={(v) => setData({ ...data, ltvCacRatio: v })}
            placeholder="e.g., 4:1"
          />
        </div>
        <TextArea
          label="Payback Period & Justification"
          value={data.paybackPeriod}
          onChange={(v) => setData({ ...data, paybackPeriod: v })}
          placeholder="Months to recover CAC. If >12mo for SMB or >18mo for enterprise, justify your retention assumptions."
          rows={2}
        />
      </SectionCard>
    </div>
  );
};

// ─── PERSISTENCE HELPERS ────────────────────────────────────────────────────
const STORAGE_KEY = "jwx-strategic-engine";

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — silently fail
  }
};

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const saved = useMemo(() => loadState(), []);

  const [activeModule, setActiveModule] = useState(saved?.activeModule ?? 0);
  const [horizonLocked, setHorizonLocked] = useState(saved?.horizonLocked ?? false);
  const [gauntletComplete, setGauntletComplete] = useState(saved?.gauntletComplete ?? false);

  const [horizonData, setHorizonData] = useState(saved?.horizonData ?? {
    mission: "", antiMission: "", tenets: ["", "", "", ""],
    tailwinds: "", headwinds: "", customerPain: "",
    okrs: [{}, {}, {}],
  });
  const [gauntletData, setGauntletData] = useState(saved?.gauntletData ?? {
    competitors: [],
    pmRatings: {},
    analysisResult: null,
    interrogationResponses: {},
    interrogationScores: {},
  });
  const [monetizationData, setMonetizationData] = useState(saved?.monetizationData ?? {
    valueMetric: "", pricingPhilosophy: "",
    tiers: {}, cac: "", ltv: "", ltvCacRatio: "", paybackPeriod: "",
  });

  // Auto-save all state on every change
  useEffect(() => {
    saveState({
      activeModule,
      horizonLocked,
      gauntletComplete,
      horizonData,
      gauntletData,
      monetizationData,
    });
  }, [activeModule, horizonLocked, gauntletComplete, horizonData, gauntletData, monetizationData]);

  const modules = [
    { id: "horizon", title: "The Horizon", subtitle: "Vision & Strategy", icon: Eye, locked: false, complete: horizonLocked },
    { id: "gauntlet", title: "The Gauntlet", subtitle: "AI Competitive Analysis", icon: Sword, locked: !horizonLocked, complete: gauntletComplete },
    { id: "monetization", title: "Monetization", subtitle: "Pricing & Value", icon: DollarSign, locked: !gauntletComplete, complete: false },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      {/* Top Bar */}
      <header
        className="sticky top-0 z-50 border-b-2 backdrop-blur-xl"
        style={{ borderColor: BRAND.midGray, backgroundColor: "rgba(255,255,255,0.95)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <JWLogo size={36} />
            <div>
              <h1 className="text-sm font-bold tracking-tight" style={{ color: BRAND.navy }}>Strategic Engine</h1>
              <p className="text-[11px]" style={{ color: BRAND.textMuted }}>Strategy-First Product Architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="danger">CHALLENGER MODE</Badge>
            <div className="flex items-center gap-1.5">
              <Flame size={16} style={{ color: BRAND.red }} className="animate-pulse" />
              <span className="text-xs font-bold" style={{ color: BRAND.red }}>Always On</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Module Navigation */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            const isActive = activeModule === i;
            const isLocked = mod.locked;

            return (
              <button
                key={mod.id}
                onClick={() => !isLocked && setActiveModule(i)}
                disabled={isLocked}
                className="relative rounded-2xl border-2 p-4 text-left transition-all duration-300"
                style={{
                  borderColor: isLocked ? BRAND.midGray : isActive ? BRAND.red : BRAND.midGray,
                  backgroundColor: isLocked ? "#f9fafb" : isActive ? `${BRAND.red}05` : "white",
                  opacity: isLocked ? 0.4 : 1,
                  cursor: isLocked ? "not-allowed" : "pointer",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: mod.complete ? "#dcfce7" : isActive ? `${BRAND.red}10` : BRAND.lightGray,
                    }}
                  >
                    {mod.complete ? (
                      <Check size={18} style={{ color: "#16a34a" }} />
                    ) : isLocked ? (
                      <Lock size={18} style={{ color: BRAND.textMuted }} />
                    ) : (
                      <Icon size={18} style={{ color: isActive ? BRAND.red : BRAND.textSecondary }} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: isActive ? BRAND.navy : BRAND.textSecondary }}>
                      {mod.title}
                    </p>
                    <p className="text-xs" style={{ color: BRAND.textMuted }}>{mod.subtitle}</p>
                  </div>
                </div>
                {isActive && (
                  <div
                    className="absolute bottom-0 left-4 right-4 h-1 rounded-full"
                    style={{ backgroundColor: BRAND.red }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Challenger Mode Banner */}
        {activeModule === 1 && (
          <div
            className="mb-6 rounded-2xl border-2 p-4 flex items-center gap-4"
            style={{ borderColor: `${BRAND.red}30`, backgroundColor: `${BRAND.red}03` }}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${BRAND.red}10` }}>
              <Flame size={24} style={{ color: BRAND.red }} className="animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: BRAND.red }}>CHALLENGER MODE ACTIVE</p>
              <p className="text-xs" style={{ color: BRAND.textSecondary }}>
                The system acts as your smartest competitor's strategist. Expect hostility — it's by design.
              </p>
            </div>
            <Badge variant="danger">HOSTILE</Badge>
          </div>
        )}

        {/* Module Content */}
        {activeModule === 0 && (
          <HorizonModule
            data={horizonData}
            setData={setHorizonData}
            onComplete={() => {
              setHorizonLocked(true);
              setActiveModule(1);
            }}
          />
        )}
        {activeModule === 1 && (
          <GauntletModule
            data={gauntletData}
            setData={setGauntletData}
            horizonData={horizonData}
            onComplete={() => {
              setGauntletComplete(true);
              setActiveModule(2);
            }}
          />
        )}
        {activeModule === 2 && (
          <MonetizationModule
            data={monetizationData}
            setData={setMonetizationData}
            gauntletData={gauntletData}
            horizonData={horizonData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 mt-16" style={{ borderColor: BRAND.midGray }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <JWLogo size={20} />
            <p className="text-xs" style={{ color: BRAND.textMuted }}>JWX Strategic Engine v2.0</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs" style={{ color: BRAND.textMuted }}>Built for PMs who ship, not PMs who spec</p>
            <button
              onClick={() => { if (window.confirm("Clear all saved data and start fresh?")) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); } }}
              className="text-[10px] px-2 py-1 rounded border"
              style={{ borderColor: BRAND.midGray, color: BRAND.textMuted }}
            >
              Reset All
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
