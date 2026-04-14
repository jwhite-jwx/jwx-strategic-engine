import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  Target, Shield, DollarSign, ChevronRight, ChevronLeft, Check,
  AlertTriangle, Flame, Eye, Sword, Crown, Zap, TrendingUp,
  ArrowRight, Plus, X, ChevronDown, ChevronUp, BarChart3,
  Lock, Unlock, Star, Award, Layers, Globe, Users, Briefcase,
  MessageSquare, HelpCircle, Lightbulb, RefreshCw, Save,
  FileText, Layout, Activity, Crosshair, BookOpen
} from "lucide-react";

// ─── STEEL MAN INTERROGATION ENGINE ─────────────────────────────────────────
const CHALLENGER_QUESTIONS = {
  switchingCost: [
    "Your target customers are already embedded in {competitor}'s ecosystem. What is the ACTUAL dollar cost of switching — including retraining, migration, and lost productivity? Have you quantified this, or are you assuming it's low?",
    "If {competitor} offers a 40% discount tomorrow to retain the accounts you're targeting, what happens to your pipeline? Be specific.",
    "Your customer's IT team has spent 18 months integrating {competitor}. Why would they risk their credibility on an unproven alternative?",
    "What contractual lock-in (annual commitments, data portability barriers, API dependencies) keeps customers with {competitor}? How do you break that?"
  ],
  fastFollow: [
    "{competitor} has 10x your engineering headcount. If your feature ships and gains traction, what stops them from replicating it in 90 days with better distribution?",
    "Name ONE technical moat you have that {competitor} cannot replicate within two quarters. Not a feature — a structural advantage.",
    "Microsoft entered the collaboration space and decimated Slack's growth thesis. What makes you think {competitor} won't do the same to you?",
    "Your 'innovation advantage' has a half-life. What is it? 6 months? 12? What happens when it expires?"
  ],
  valueProp: [
    "You say your value prop is '{value_prop}'. I can find 4 startups on Product Hunt claiming the exact same thing. What's actually different?",
    "Strip away the marketing language. In one sentence a CFO would understand, why does this make my company more money or save me more money than {competitor}?",
    "Your 'unique' differentiator — is it unique because no one else thought of it, or because no one else found it valuable enough to build?",
    "If I gave {competitor}'s PM your PRD right now, what would they say? Would they laugh, panic, or shrug? Be honest."
  ],
  marketTiming: [
    "You claim the market is 'ready' for this. What changed in the last 12 months that makes this viable NOW when it wasn't before?",
    "Three companies tried this exact approach in 2022 and failed. What do you know that they didn't? Or are you just hoping the market has shifted?",
    "Is this a 'vitamin' or a 'painkiller'? Because your positioning sounds like a vitamin dressed up as a painkiller.",
    "What macro trend breaks your thesis? If interest rates stay high, if AI commoditizes your feature, if regulation tightens — which of these kills you?"
  ],
  unitEconomics: [
    "What's your projected CAC? Now triple it — that's the realistic number for enterprise sales. Does your model survive?",
    "Your LTV assumptions require {X}% annual retention. The industry average is 85%. Why do you deserve to be above average?",
    "At what customer count do you break even on fully-loaded costs? Not gross margin — fully loaded. Include the sales team, the CS team, the infrastructure.",
    "If your biggest customer churns in month 6, does your cohort economics still work? Show me the math without the top 10% of accounts."
  ],
  defensibility: [
    "Network effects, switching costs, economies of scale, or brand — which moat are you actually building? Because 'better product' isn't a moat.",
    "In 5 years, what prevents this from becoming a feature inside a platform play by {competitor}?",
    "Your data advantage — how much data do you actually need before it compounds? Are you at 1% of that threshold or 50%?",
    "Open source alternatives exist for nearly everything. What happens when a well-funded OSS project targets your core functionality?"
  ]
};

const INTERROGATION_CATEGORIES = [
  { id: "switchingCost", label: "Switching Cost Attack", icon: Lock, color: "text-red-400" },
  { id: "fastFollow", label: "Fast-Follow Threat", icon: Zap, color: "text-amber-400" },
  { id: "valueProp", label: "Value Prop Dissection", icon: Crosshair, color: "text-orange-400" },
  { id: "marketTiming", label: "Market Timing Challenge", icon: Activity, color: "text-rose-400" },
  { id: "unitEconomics", label: "Unit Economics Stress Test", icon: BarChart3, color: "text-yellow-400" },
  { id: "defensibility", label: "Defensibility Audit", icon: Shield, color: "text-red-500" }
];

// ─── PRICING TEMPLATES ──────────────────────────────────────────────────────
const PRICING_TEMPLATES = {
  entry: { name: "Entry", subtitle: "Land & Validate", color: "from-slate-600 to-slate-700", multiplier: 1 },
  growth: { name: "Growth", subtitle: "Expand & Retain", color: "from-blue-600 to-indigo-700", multiplier: 2.8 },
  enterprise: { name: "Enterprise", subtitle: "Strategic Lock-in", color: "from-amber-600 to-orange-700", multiplier: 7.5 }
};

// ─── REUSABLE COMPONENTS ────────────────────────────────────────────────────
const GlowBorder = ({ children, active, challenger, className = "" }) => (
  <div className={`relative rounded-xl ${className}`}>
    {active && (
      <div className={`absolute -inset-[1px] rounded-xl ${
        challenger
          ? "bg-gradient-to-r from-red-500/30 via-amber-500/30 to-red-500/30"
          : "bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30"
      } blur-sm`} />
    )}
    <div className="relative">{children}</div>
  </div>
);

const TextArea = ({ label, value, onChange, placeholder, rows = 3, challenger, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-slate-300">{label}</label>
    {hint && <p className="text-xs text-slate-500 italic">{hint}</p>}
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full rounded-lg border bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all focus:ring-2 ${
        challenger
          ? "border-amber-700/50 focus:border-amber-500 focus:ring-amber-500/20"
          : "border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20"
      }`}
    />
  </div>
);

const InputField = ({ label, value, onChange, placeholder, challenger, type = "text" }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-slate-300">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-lg border bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all focus:ring-2 ${
        challenger
          ? "border-amber-700/50 focus:border-amber-500 focus:ring-amber-500/20"
          : "border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20"
      }`}
    />
  </div>
);

const Badge = ({ children, variant = "default", challenger }) => {
  const styles = {
    default: challenger ? "bg-amber-900/40 text-amber-300 border-amber-700/40" : "bg-blue-900/40 text-blue-300 border-blue-700/40",
    success: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
    warning: "bg-amber-900/40 text-amber-300 border-amber-700/40",
    danger: "bg-red-900/40 text-red-300 border-red-700/40",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
};

// ─── MODULE 1: THE HORIZON ──────────────────────────────────────────────────
const HorizonModule = ({ data, setData, challenger, onComplete }) => {
  const [activeSection, setActiveSection] = useState(0);

  const sections = [
    {
      id: "mission",
      title: "Mission Statement",
      icon: Target,
      description: "The singular obsession. What does JWX conquer?",
      content: (
        <div className="space-y-6">
          <TextArea
            label="Mission (The North Star)"
            value={data.mission}
            onChange={(v) => setData({ ...data, mission: v })}
            placeholder="In one paragraph: What must be true for JWX to dominate this space? Think Amazon's 'customer obsession' — not a tagline, a mandate."
            rows={4}
            challenger={challenger}
            hint="Write this as if you're briefing Bezos. No fluff."
          />
          <TextArea
            label="Anti-Mission (What We Will NOT Do)"
            value={data.antiMission}
            onChange={(v) => setData({ ...data, antiMission: v })}
            placeholder="Strategy is as much about what you refuse to do. What markets, features, or customer segments are explicitly out of scope?"
            rows={3}
            challenger={challenger}
            hint="The best strategies have hard boundaries."
          />
        </div>
      )
    },
    {
      id: "tenets",
      title: "Operating Tenets",
      icon: BookOpen,
      description: "The non-negotiable principles that govern every decision.",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Tenets are ranked. When two tenets conflict, the higher-ranked tenet wins. This is how Amazon resolves ambiguity at scale.
          </p>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                challenger ? "bg-amber-900/50 text-amber-300" : "bg-blue-900/50 text-blue-300"
              }`}>
                {i + 1}
              </div>
              <InputField
                label=""
                value={data.tenets?.[i] || ""}
                onChange={(v) => {
                  const newTenets = [...(data.tenets || ["", "", "", ""])];
                  newTenets[i] = v;
                  setData({ ...data, tenets: newTenets });
                }}
                placeholder={[
                  "e.g., 'Customer outcomes over feature count — always.'",
                  "e.g., 'Margin-positive from Day 1. No growth-at-all-costs.'",
                  "e.g., 'Platform-first. Never build a point solution.'",
                  "e.g., 'Earn trust through transparency, not lock-in.'"
                ][i]}
                challenger={challenger}
              />
            </div>
          ))}
        </div>
      )
    },
    {
      id: "drivers",
      title: "Strategic Drivers",
      icon: TrendingUp,
      description: "The market forces, tech shifts, and customer pain that create the opening.",
      content: (
        <div className="space-y-6">
          <TextArea
            label="Market Tailwinds"
            value={data.tailwinds}
            onChange={(v) => setData({ ...data, tailwinds: v })}
            placeholder="What macro forces are working IN your favor? (e.g., regulatory shifts, platform migrations, budget reallocation trends)"
            rows={3}
            challenger={challenger}
          />
          <TextArea
            label="Market Headwinds"
            value={data.headwinds}
            onChange={(v) => setData({ ...data, headwinds: v })}
            placeholder="What forces are working AGAINST you? Don't sugarcoat this. Investors and execs will find these — better you name them first."
            rows={3}
            challenger={challenger}
          />
          <TextArea
            label="Customer Pain (Unfiltered)"
            value={data.customerPain}
            onChange={(v) => setData({ ...data, customerPain: v })}
            placeholder="Quote actual customers. 'We struggle with...' not 'Customers want...' — the difference matters."
            rows={3}
            challenger={challenger}
          />
        </div>
      )
    },
    {
      id: "okrs",
      title: "Success OKRs",
      icon: Award,
      description: "Measurable outcomes. Not outputs — outcomes.",
      content: (
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`rounded-lg border p-4 space-y-3 ${
              challenger ? "border-amber-800/40 bg-amber-950/20" : "border-slate-700/40 bg-slate-800/30"
            }`}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  challenger ? "bg-amber-400" : "bg-blue-400"
                }`} />
                <span className="text-sm font-semibold text-slate-200">Objective {i + 1}</span>
              </div>
              <InputField
                label="Objective"
                value={data.okrs?.[i]?.objective || ""}
                onChange={(v) => {
                  const newOkrs = [...(data.okrs || [{}, {}, {}])];
                  newOkrs[i] = { ...newOkrs[i], objective: v };
                  setData({ ...data, okrs: newOkrs });
                }}
                placeholder="Qualitative goal (e.g., 'Become the default choice for mid-market video infrastructure')"
                challenger={challenger}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[0, 1, 2].map((j) => (
                  <InputField
                    key={j}
                    label={`Key Result ${j + 1}`}
                    value={data.okrs?.[i]?.keyResults?.[j] || ""}
                    onChange={(v) => {
                      const newOkrs = [...(data.okrs || [{}, {}, {}])];
                      const kr = [...(newOkrs[i]?.keyResults || ["", "", ""])];
                      kr[j] = v;
                      newOkrs[i] = { ...newOkrs[i], keyResults: kr };
                      setData({ ...data, okrs: newOkrs });
                    }}
                    placeholder={`Measurable target ${j + 1}`}
                    challenger={challenger}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }
  ];

  const completeness = useMemo(() => {
    let filled = 0;
    let total = 8;
    if (data.mission?.length > 20) filled++;
    if (data.antiMission?.length > 10) filled++;
    if (data.tenets?.filter(t => t?.length > 5).length >= 2) filled++;
    if (data.tailwinds?.length > 10) filled++;
    if (data.headwinds?.length > 10) filled++;
    if (data.customerPain?.length > 10) filled++;
    if (data.okrs?.[0]?.objective?.length > 5) filled++;
    if (data.okrs?.[0]?.keyResults?.filter(k => k?.length > 3).length >= 2) filled++;
    return Math.round((filled / total) * 100);
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Horizon Completeness</span>
          <span className={challenger ? "text-amber-400" : "text-blue-400"}>{completeness}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              challenger
                ? "bg-gradient-to-r from-amber-500 to-red-500"
                : "bg-gradient-to-r from-blue-500 to-cyan-400"
            }`}
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(i)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                activeSection === i
                  ? challenger
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                    : "border-blue-500/50 bg-blue-500/10 text-blue-300"
                  : "border-slate-700/40 bg-slate-800/40 text-slate-400 hover:text-slate-300 hover:border-slate-600"
              }`}
            >
              <Icon size={16} />
              {s.title}
            </button>
          );
        })}
      </div>

      {/* Active Section */}
      <GlowBorder active={true} challenger={challenger}>
        <div className={`rounded-xl border p-6 ${
          challenger ? "border-amber-800/30 bg-slate-900/80" : "border-slate-700/30 bg-slate-900/80"
        }`}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">{sections[activeSection].title}</h3>
            <p className="text-sm text-slate-400 mt-1">{sections[activeSection].description}</p>
          </div>
          {sections[activeSection].content}
        </div>
      </GlowBorder>

      {/* Complete Button */}
      {completeness >= 75 && (
        <button
          onClick={onComplete}
          className={`w-full rounded-lg py-3 px-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            challenger
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          Lock Horizon & Enter The Gauntlet
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
};

// ─── MODULE 2: THE GAUNTLET ─────────────────────────────────────────────────
const GauntletModule = ({ data, setData, horizonData, challenger, onComplete }) => {
  const [phase, setPhase] = useState("wizard"); // wizard | interrogation
  const [wizardStep, setWizardStep] = useState(0);
  const [activeCategory, setActiveCategory] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [scores, setScores] = useState({});

  // Wizard Steps
  const addCompetitor = (type) => {
    const list = type === "direct" ? "directCompetitors" : "indirectCompetitors";
    setData({
      ...data,
      [list]: [...(data[list] || []), { name: "", threat: "", strength: "", weakness: "", valueProp: "" }]
    });
  };

  const updateCompetitor = (type, index, field, value) => {
    const list = type === "direct" ? "directCompetitors" : "indirectCompetitors";
    const updated = [...(data[list] || [])];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, [list]: updated });
  };

  const removeCompetitor = (type, index) => {
    const list = type === "direct" ? "directCompetitors" : "indirectCompetitors";
    const updated = [...(data[list] || [])];
    updated.splice(index, 1);
    setData({ ...data, [list]: updated });
  };

  const primaryCompetitor = data.directCompetitors?.[0]?.name || "the competitor";
  const userValueProp = data.directCompetitors?.[0]?.valueProp || horizonData.mission || "your product";

  const getQuestion = (categoryId, qIndex) => {
    const questions = CHALLENGER_QUESTIONS[categoryId] || [];
    const q = questions[qIndex % questions.length] || "";
    return q.replace(/\{competitor\}/g, primaryCompetitor)
      .replace(/\{value_prop\}/g, userValueProp)
      .replace(/\{X\}/g, "95");
  };

  const handleResponse = (categoryId, response) => {
    const key = `${categoryId}_${currentQuestionIndex}`;
    setResponses({ ...responses, [key]: response });
  };

  const scoreResponse = (categoryId, score) => {
    const key = `${categoryId}_${currentQuestionIndex}`;
    setScores({ ...scores, [key]: score });
  };

  const wizardSteps = [
    {
      title: "Direct Competitors",
      subtitle: "Who are you going HEAD-TO-HEAD against?",
      icon: Sword,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Direct competitors serve the same customer with the same core value proposition. Be ruthlessly honest — if a prospect would evaluate them alongside you, they belong here.
          </p>
          {(data.directCompetitors || []).map((comp, i) => (
            <div key={i} className={`rounded-lg border p-4 space-y-3 ${
              challenger ? "border-amber-800/30 bg-amber-950/10" : "border-slate-700/30 bg-slate-800/20"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Competitor {i + 1}</span>
                <button onClick={() => removeCompetitor("direct", i)} className="text-slate-500 hover:text-red-400">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InputField label="Name" value={comp.name} onChange={(v) => updateCompetitor("direct", i, "name", v)} placeholder="e.g., Mux, Cloudflare Stream" challenger={challenger} />
                <InputField label="Threat Level" value={comp.threat} onChange={(v) => updateCompetitor("direct", i, "threat", v)} placeholder="Critical / High / Medium" challenger={challenger} />
              </div>
              <InputField label="Their Core Strength (be generous)" value={comp.strength} onChange={(v) => updateCompetitor("direct", i, "strength", v)} placeholder="What do they do BETTER than you? No cope." challenger={challenger} />
              <InputField label="Their Weakness (be specific)" value={comp.weakness} onChange={(v) => updateCompetitor("direct", i, "weakness", v)} placeholder="Not 'bad UI' — what structural weakness can you exploit?" challenger={challenger} />
              <InputField label="Your Counter-Value Prop" value={comp.valueProp} onChange={(v) => updateCompetitor("direct", i, "valueProp", v)} placeholder="Why does the customer choose YOU over them?" challenger={challenger} />
            </div>
          ))}
          <button
            onClick={() => addCompetitor("direct")}
            className={`flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm w-full justify-center transition-colors ${
              challenger
                ? "border-amber-700/40 text-amber-400 hover:border-amber-600 hover:bg-amber-950/20"
                : "border-slate-600/40 text-slate-400 hover:border-blue-500 hover:bg-blue-950/20"
            }`}
          >
            <Plus size={16} /> Add Direct Competitor
          </button>
        </div>
      )
    },
    {
      title: "Indirect Competitors",
      subtitle: "Who solves the same PROBLEM differently?",
      icon: Globe,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Indirect competitors are the sneaky ones. They solve the customer's underlying problem but with a completely different approach. Spreadsheets, manual processes, and "do nothing" are valid entries.
          </p>
          {(data.indirectCompetitors || []).map((comp, i) => (
            <div key={i} className={`rounded-lg border p-4 space-y-3 ${
              challenger ? "border-amber-800/30 bg-amber-950/10" : "border-slate-700/30 bg-slate-800/20"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Alternative {i + 1}</span>
                <button onClick={() => removeCompetitor("indirect", i)} className="text-slate-500 hover:text-red-400">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InputField label="Name / Category" value={comp.name} onChange={(v) => updateCompetitor("indirect", i, "name", v)} placeholder="e.g., In-house FFmpeg pipeline, YouTube unlisted" challenger={challenger} />
                <InputField label="Why Customers Use It" value={comp.strength} onChange={(v) => updateCompetitor("indirect", i, "strength", v)} placeholder="What makes this 'good enough'?" challenger={challenger} />
              </div>
              <InputField label="Your Displacement Strategy" value={comp.valueProp} onChange={(v) => updateCompetitor("indirect", i, "valueProp", v)} placeholder="How do you convince them that 'good enough' isn't good enough?" challenger={challenger} />
            </div>
          ))}
          <button
            onClick={() => addCompetitor("indirect")}
            className={`flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm w-full justify-center transition-colors ${
              challenger
                ? "border-amber-700/40 text-amber-400 hover:border-amber-600 hover:bg-amber-950/20"
                : "border-slate-600/40 text-slate-400 hover:border-blue-500 hover:bg-blue-950/20"
            }`}
          >
            <Plus size={16} /> Add Indirect Competitor
          </button>
        </div>
      )
    },
    {
      title: "Battleground Definition",
      subtitle: "Where will you fight — and where will you retreat?",
      icon: Layout,
      content: (
        <div className="space-y-6">
          <TextArea
            label="Your Beachhead Segment"
            value={data.beachhead}
            onChange={(v) => setData({ ...data, beachhead: v })}
            placeholder="The specific, narrow segment you will DOMINATE first. Not 'enterprise' — give me the ICP with detail. Industry, size, tech stack, buying trigger."
            rows={3}
            challenger={challenger}
          />
          <TextArea
            label="Competitive Positioning Statement"
            value={data.positioning}
            onChange={(v) => setData({ ...data, positioning: v })}
            placeholder="For [target customer] who [need], [product] is a [category] that [key benefit]. Unlike [primary competitor], we [primary differentiator]."
            rows={3}
            challenger={challenger}
            hint="Geoffrey Moore's positioning template. Fill it in completely."
          />
          <TextArea
            label="What You're Willing to LOSE"
            value={data.tradeoffs}
            onChange={(v) => setData({ ...data, tradeoffs: v })}
            placeholder="Strategy requires trade-offs. What features, segments, or capabilities will you explicitly sacrifice to win your beachhead?"
            rows={3}
            challenger={challenger}
          />
        </div>
      )
    }
  ];

  const canEnterInterrogation = (data.directCompetitors?.length > 0) && data.positioning?.length > 10;

  if (phase === "interrogation") {
    const cat = INTERROGATION_CATEGORIES[activeCategory];
    const question = getQuestion(cat.id, currentQuestionIndex);
    const responseKey = `${cat.id}_${currentQuestionIndex}`;
    const totalAnswered = Object.keys(responses).length;
    const totalQuestions = INTERROGATION_CATEGORIES.length * 2; // 2 questions per category minimum

    return (
      <div className="space-y-6">
        {/* Interrogation Header */}
        <div className="rounded-xl border border-red-800/40 bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/40 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-900/50">
              <Flame size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-300">STEEL MAN INTERROGATION</h3>
              <p className="text-xs text-red-400/70">Mode: Hostile Competitor | Challenger Method Active</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            I am now your smartest competitor's strategist. I will defend their position with maximum conviction.
            Your job is to convince me — with evidence, not hope — that your product deserves to exist.
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (totalAnswered / totalQuestions) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-slate-500">
            <span>{totalAnswered} challenges answered</span>
            <span>{totalQuestions} minimum required</span>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {INTERROGATION_CATEGORIES.map((c, i) => {
            const Icon = c.icon;
            const answered = Object.keys(responses).filter(k => k.startsWith(c.id)).length;
            return (
              <button
                key={c.id}
                onClick={() => { setActiveCategory(i); setCurrentQuestionIndex(0); }}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${
                  activeCategory === i
                    ? "border-red-500/50 bg-red-500/10 text-red-300"
                    : "border-slate-700/40 bg-slate-800/40 text-slate-400 hover:text-slate-300"
                }`}
              >
                <Icon size={14} className={activeCategory === i ? c.color : ""} />
                <span className="truncate">{c.label}</span>
                {answered > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-900/50 text-[10px] text-red-300">
                    {answered}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        <div className="rounded-xl border border-red-800/30 bg-slate-900/80 p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-900/40">
              <Sword size={16} className="text-red-400" />
            </div>
            <div>
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">
                {cat.label} — Challenge {currentQuestionIndex + 1}
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">{question}</p>
            </div>
          </div>

          <TextArea
            label="Your Defense"
            value={responses[responseKey] || ""}
            onChange={(v) => handleResponse(cat.id, v)}
            placeholder="Defend your position. Use data, customer quotes, and structural arguments — not assertions. If you can't defend it, that's a signal."
            rows={5}
            challenger={true}
          />

          {/* Self-Score */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">Confidence in your answer:</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => scoreResponse(cat.id, s)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    scores[responseKey] >= s
                      ? s <= 2 ? "bg-red-600 text-white" : s <= 3 ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">
              {scores[responseKey] <= 2 ? "⚠ Weak — revisit this" : scores[responseKey] <= 3 ? "Needs strengthening" : scores[responseKey] >= 4 ? "Strong position" : "Rate yourself"}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={() => {
                const maxQ = CHALLENGER_QUESTIONS[cat.id]?.length || 4;
                if (currentQuestionIndex < maxQ - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                } else if (activeCategory < INTERROGATION_CATEGORIES.length - 1) {
                  setActiveCategory(activeCategory + 1);
                  setCurrentQuestionIndex(0);
                }
              }}
              className="flex items-center gap-1.5 rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
            >
              Next Challenge <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Vulnerability Report */}
        {totalAnswered >= totalQuestions && (
          <div className="rounded-xl border border-amber-700/30 bg-amber-950/20 p-5 space-y-4">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <AlertTriangle size={16} /> Vulnerability Assessment
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INTERROGATION_CATEGORIES.map((c) => {
                const catScores = Object.entries(scores)
                  .filter(([k]) => k.startsWith(c.id))
                  .map(([, v]) => v);
                const avg = catScores.length > 0 ? (catScores.reduce((a, b) => a + b, 0) / catScores.length) : 0;
                return (
                  <div key={c.id} className="rounded-lg bg-slate-900/60 border border-slate-700/30 p-3">
                    <p className="text-xs text-slate-400 mb-1">{c.label}</p>
                    <div className="flex items-center gap-2">
                      <div className={`text-lg font-bold ${avg <= 2 ? "text-red-400" : avg <= 3 ? "text-amber-400" : "text-emerald-400"}`}>
                        {avg.toFixed(1)}
                      </div>
                      <span className="text-xs text-slate-500">/5</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => {
                setData({
                  ...data,
                  interrogationResponses: responses,
                  interrogationScores: scores
                });
                onComplete();
              }}
              className="w-full rounded-lg bg-amber-600 py-3 text-sm font-semibold text-white hover:bg-amber-500 transition-colors flex items-center justify-center gap-2"
            >
              <Crown size={16} />
              Survive The Gauntlet — Proceed to Monetization
            </button>
          </div>
        )}

        {/* Back to Wizard */}
        <button
          onClick={() => setPhase("wizard")}
          className="text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1"
        >
          <ChevronLeft size={12} /> Back to Competitive Setup
        </button>
      </div>
    );
  }

  // WIZARD PHASE
  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {wizardSteps.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={i}
              onClick={() => setWizardStep(i)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                wizardStep === i
                  ? challenger
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                    : "border-blue-500/50 bg-blue-500/10 text-blue-300"
                  : "border-slate-700/40 bg-slate-800/40 text-slate-400 hover:text-slate-300"
              }`}
            >
              <Icon size={16} />
              {s.title}
            </button>
          );
        })}
      </div>

      {/* Active Step */}
      <GlowBorder active={true} challenger={challenger}>
        <div className={`rounded-xl border p-6 ${
          challenger ? "border-amber-800/30 bg-slate-900/80" : "border-slate-700/30 bg-slate-900/80"
        }`}>
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">{wizardSteps[wizardStep].title}</h3>
            <p className="text-sm text-slate-400 mt-1">{wizardSteps[wizardStep].subtitle}</p>
          </div>
          {wizardSteps[wizardStep].content}
        </div>
      </GlowBorder>

      {/* Enter Interrogation */}
      {canEnterInterrogation && (
        <button
          onClick={() => setPhase("interrogation")}
          className="w-full rounded-xl border border-red-700/40 bg-gradient-to-r from-red-950/60 to-amber-950/60 py-4 px-6 text-sm font-semibold transition-all hover:from-red-900/60 hover:to-amber-900/60 flex items-center justify-center gap-3 group"
        >
          <Flame size={20} className="text-red-400 group-hover:animate-pulse" />
          <span className="text-red-300">Enter Steel Man Interrogation</span>
          <ArrowRight size={16} className="text-red-400" />
        </button>
      )}
    </div>
  );
};

// ─── MODULE 3: MONETIZATION ─────────────────────────────────────────────────
const MonetizationModule = ({ data, setData, gauntletData, horizonData, challenger }) => {
  const [activeTier, setActiveTier] = useState("growth");

  const competitorNames = [
    ...(gauntletData.directCompetitors || []).map(c => c.name),
    ...(gauntletData.indirectCompetitors || []).map(c => c.name)
  ].filter(Boolean);

  const weakAreas = useMemo(() => {
    const scores = gauntletData.interrogationScores || {};
    return INTERROGATION_CATEGORIES
      .map(c => {
        const catScores = Object.entries(scores)
          .filter(([k]) => k.startsWith(c.id))
          .map(([, v]) => v);
        const avg = catScores.length > 0 ? catScores.reduce((a, b) => a + b, 0) / catScores.length : 3;
        return { ...c, avg };
      })
      .filter(c => c.avg < 3.5)
      .sort((a, b) => a.avg - b.avg);
  }, [gauntletData]);

  return (
    <div className="space-y-6">
      {/* Inherited Intelligence */}
      <div className={`rounded-xl border p-5 ${
        challenger ? "border-amber-800/30 bg-amber-950/10" : "border-slate-700/30 bg-slate-800/20"
      }`}>
        <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-3">
          <Layers size={16} className={challenger ? "text-amber-400" : "text-blue-400"} />
          Inherited from The Gauntlet
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-700/20">
            <p className="text-xs text-slate-500 mb-1">Competitive Landscape</p>
            <p className="text-sm text-slate-300">{competitorNames.join(", ") || "No competitors defined"}</p>
          </div>
          <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-700/20">
            <p className="text-xs text-slate-500 mb-1">Beachhead</p>
            <p className="text-sm text-slate-300">{gauntletData.beachhead || "Not yet defined"}</p>
          </div>
        </div>
        {weakAreas.length > 0 && (
          <div className="mt-3 rounded-lg bg-red-950/20 border border-red-800/20 p-3">
            <p className="text-xs text-red-400 font-semibold mb-1">Pricing Risk Zones (from Interrogation)</p>
            <p className="text-xs text-slate-400">
              Your weak scores in {weakAreas.map(w => w.label).join(", ")} mean your pricing must account for higher churn risk and lower switching costs.
            </p>
          </div>
        )}
      </div>

      {/* Pricing Strategy Input */}
      <div className="space-y-4">
        <TextArea
          label="Value Metric (What You Charge For)"
          value={data.valueMetric}
          onChange={(v) => setData({ ...data, valueMetric: v })}
          placeholder="The unit that scales with the customer's success. Not 'seats' unless your value scales with headcount. (e.g., 'video minutes delivered', 'API calls', 'GB encoded')"
          rows={2}
          challenger={challenger}
          hint="The best value metrics correlate directly with the customer outcome your product enables."
        />
        <TextArea
          label="Pricing Philosophy"
          value={data.pricingPhilosophy}
          onChange={(v) => setData({ ...data, pricingPhilosophy: v })}
          placeholder="Value-based, cost-plus, or competitive? Why? How does this pricing create a moat — not just revenue?"
          rows={2}
          challenger={challenger}
        />
      </div>

      {/* Tier Selector */}
      <div className="flex gap-3">
        {Object.entries(PRICING_TEMPLATES).map(([key, tier]) => (
          <button
            key={key}
            onClick={() => setActiveTier(key)}
            className={`flex-1 rounded-xl border p-4 transition-all ${
              activeTier === key
                ? `border-transparent bg-gradient-to-b ${tier.color} shadow-lg`
                : "border-slate-700/30 bg-slate-800/30 hover:border-slate-600"
            }`}
          >
            <p className={`text-sm font-bold ${activeTier === key ? "text-white" : "text-slate-300"}`}>{tier.name}</p>
            <p className={`text-xs mt-0.5 ${activeTier === key ? "text-white/70" : "text-slate-500"}`}>{tier.subtitle}</p>
          </button>
        ))}
      </div>

      {/* Active Tier Configuration */}
      <GlowBorder active={true} challenger={challenger}>
        <div className={`rounded-xl border p-6 space-y-5 ${
          challenger ? "border-amber-800/30 bg-slate-900/80" : "border-slate-700/30 bg-slate-900/80"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{PRICING_TEMPLATES[activeTier].name} Tier</h3>
              <p className="text-sm text-slate-400">{PRICING_TEMPLATES[activeTier].subtitle}</p>
            </div>
            <Badge challenger={challenger}>
              {activeTier === "entry" ? "Land" : activeTier === "growth" ? "Expand" : "Lock-in"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Price Point"
              value={data.tiers?.[activeTier]?.price || ""}
              onChange={(v) => {
                const newTiers = { ...(data.tiers || {}), [activeTier]: { ...(data.tiers?.[activeTier] || {}), price: v } };
                setData({ ...data, tiers: newTiers });
              }}
              placeholder={activeTier === "entry" ? "$0-99/mo" : activeTier === "growth" ? "$299-999/mo" : "Custom / $2,000+/mo"}
              challenger={challenger}
            />
            <InputField
              label="Target Segment"
              value={data.tiers?.[activeTier]?.segment || ""}
              onChange={(v) => {
                const newTiers = { ...(data.tiers || {}), [activeTier]: { ...(data.tiers?.[activeTier] || {}), segment: v } };
                setData({ ...data, tiers: newTiers });
              }}
              placeholder="Who is this tier designed for?"
              challenger={challenger}
            />
          </div>

          <TextArea
            label="Included Capabilities"
            value={data.tiers?.[activeTier]?.capabilities || ""}
            onChange={(v) => {
              const newTiers = { ...(data.tiers || {}), [activeTier]: { ...(data.tiers?.[activeTier] || {}), capabilities: v } };
              setData({ ...data, tiers: newTiers });
            }}
            placeholder="What's included at this tier? Be specific about limits — usage caps, feature gates, SLA levels."
            rows={3}
            challenger={challenger}
          />

          <TextArea
            label="Upgrade Trigger (What Makes Them Outgrow This Tier)"
            value={data.tiers?.[activeTier]?.upgradeTrigger || ""}
            onChange={(v) => {
              const newTiers = { ...(data.tiers || {}), [activeTier]: { ...(data.tiers?.[activeTier] || {}), upgradeTrigger: v } };
              setData({ ...data, tiers: newTiers });
            }}
            placeholder="What usage pattern or business event naturally pushes them to the next tier?"
            rows={2}
            challenger={challenger}
          />

          <TextArea
            label="Margin Defense"
            value={data.tiers?.[activeTier]?.marginDefense || ""}
            onChange={(v) => {
              const newTiers = { ...(data.tiers || {}), [activeTier]: { ...(data.tiers?.[activeTier] || {}), marginDefense: v } };
              setData({ ...data, tiers: newTiers });
            }}
            placeholder="Why can you sustain this margin? What cost advantages or value multipliers protect you from price compression?"
            rows={2}
            challenger={challenger}
          />
        </div>
      </GlowBorder>

      {/* Unit Economics Summary */}
      <div className={`rounded-xl border p-5 space-y-4 ${
        challenger ? "border-amber-800/30 bg-amber-950/10" : "border-slate-700/30 bg-slate-800/20"
      }`}>
        <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <BarChart3 size={16} className={challenger ? "text-amber-400" : "text-blue-400"} />
          Unit Economics Assumptions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Target CAC"
            value={data.cac || ""}
            onChange={(v) => setData({ ...data, cac: v })}
            placeholder="$X"
            challenger={challenger}
          />
          <InputField
            label="Target LTV"
            value={data.ltv || ""}
            onChange={(v) => setData({ ...data, ltv: v })}
            placeholder="$X"
            challenger={challenger}
          />
          <InputField
            label="LTV:CAC Ratio"
            value={data.ltvCacRatio || ""}
            onChange={(v) => setData({ ...data, ltvCacRatio: v })}
            placeholder="e.g., 4:1"
            challenger={challenger}
          />
        </div>
        <TextArea
          label="Payback Period & Justification"
          value={data.paybackPeriod}
          onChange={(v) => setData({ ...data, paybackPeriod: v })}
          placeholder="Months to recover CAC. If >12 months for SMB or >18 months for enterprise, justify why your retention assumptions support this."
          rows={2}
          challenger={challenger}
        />
      </div>
    </div>
  );
};

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [activeModule, setActiveModule] = useState(0);
  const [challengerMode, setChallengerMode] = useState(false);
  const [horizonLocked, setHorizonLocked] = useState(false);
  const [gauntletComplete, setGauntletComplete] = useState(false);

  const [horizonData, setHorizonData] = useState({
    mission: "", antiMission: "", tenets: ["", "", "", ""],
    tailwinds: "", headwinds: "", customerPain: "",
    okrs: [{}, {}, {}]
  });
  const [gauntletData, setGauntletData] = useState({
    directCompetitors: [], indirectCompetitors: [],
    beachhead: "", positioning: "", tradeoffs: "",
    interrogationResponses: {}, interrogationScores: {}
  });
  const [monetizationData, setMonetizationData] = useState({
    valueMetric: "", pricingPhilosophy: "",
    tiers: {}, cac: "", ltv: "", ltvCacRatio: "", paybackPeriod: ""
  });

  const modules = [
    { id: "horizon", title: "The Horizon", subtitle: "Vision", icon: Eye, locked: false, complete: horizonLocked },
    { id: "gauntlet", title: "The Gauntlet", subtitle: "Challenger", icon: Sword, locked: !horizonLocked, complete: gauntletComplete },
    { id: "monetization", title: "Monetization", subtitle: "Value", icon: DollarSign, locked: !gauntletComplete, complete: false }
  ];

  // Auto-enable challenger mode when entering Gauntlet
  useEffect(() => {
    if (activeModule === 1 && horizonLocked) {
      setChallengerMode(true);
    } else if (activeModule === 0) {
      setChallengerMode(false);
    }
  }, [activeModule, horizonLocked]);

  return (
    <div className={`min-h-screen transition-colors duration-700 ${
      challengerMode
        ? "bg-gradient-to-b from-slate-950 via-red-950/10 to-slate-950"
        : "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
    }`}>
      {/* Top Bar */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-500 ${
        challengerMode
          ? "border-red-900/30 bg-slate-950/90"
          : "border-slate-800/50 bg-slate-950/90"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-black text-sm ${
              challengerMode ? "bg-red-600 text-white" : "bg-blue-600 text-white"
            }`}>
              JWX
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Strategic Engine</h1>
              <p className="text-[11px] text-slate-500">Strategy-First Product Architecture</p>
            </div>
          </div>

          {/* Challenger Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className={`text-xs font-medium ${challengerMode ? "text-red-400" : "text-slate-500"}`}>
                Challenger Mode
              </span>
              <button
                onClick={() => setChallengerMode(!challengerMode)}
                className={`relative h-6 w-11 rounded-full transition-all duration-300 ${
                  challengerMode
                    ? "bg-gradient-to-r from-red-600 to-amber-600 shadow-lg shadow-red-500/20"
                    : "bg-slate-700"
                }`}
              >
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${
                  challengerMode ? "left-[22px]" : "left-0.5"
                }`}>
                  {challengerMode && (
                    <Flame size={12} className="text-red-500 absolute top-1 left-1" />
                  )}
                </div>
              </button>
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
                className={`relative rounded-xl border p-4 text-left transition-all duration-300 ${
                  isLocked
                    ? "border-slate-800/40 bg-slate-900/30 opacity-40 cursor-not-allowed"
                    : isActive
                      ? challengerMode
                        ? "border-red-500/40 bg-red-950/20 shadow-lg shadow-red-500/5"
                        : "border-blue-500/40 bg-blue-950/20 shadow-lg shadow-blue-500/5"
                      : "border-slate-700/30 bg-slate-800/20 hover:border-slate-600 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    mod.complete
                      ? "bg-emerald-900/50"
                      : isActive
                        ? challengerMode ? "bg-red-900/50" : "bg-blue-900/50"
                        : "bg-slate-800"
                  }`}>
                    {mod.complete ? (
                      <Check size={18} className="text-emerald-400" />
                    ) : isLocked ? (
                      <Lock size={18} className="text-slate-600" />
                    ) : (
                      <Icon size={18} className={
                        isActive
                          ? challengerMode ? "text-red-400" : "text-blue-400"
                          : "text-slate-400"
                      } />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-300"}`}>
                      {mod.title}
                    </p>
                    <p className="text-xs text-slate-500">{mod.subtitle}</p>
                  </div>
                </div>
                {isActive && (
                  <div className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full ${
                    challengerMode
                      ? "bg-gradient-to-r from-red-500 to-amber-500"
                      : "bg-gradient-to-r from-blue-500 to-cyan-400"
                  }`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Challenger Mode Banner */}
        {challengerMode && activeModule === 1 && (
          <div className="mb-6 rounded-xl border border-red-800/30 bg-gradient-to-r from-red-950/30 via-slate-900/80 to-amber-950/30 p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-900/40">
              <Flame size={24} className="text-red-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-300">CHALLENGER MODE ACTIVE</p>
              <p className="text-xs text-slate-400">
                The system is now acting as your smartest competitor's strategist. Expect hostility. It's by design.
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
            challenger={challengerMode}
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
            challenger={challengerMode}
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
            challenger={challengerMode}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/30 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-xs text-slate-600">JWX Strategic Engine v1.0 — Strategy-First Product Architecture</p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Built for PMs who ship, not PMs who spec</span>
          </div>
        </div>
      </footer>
    </div>
  );
}