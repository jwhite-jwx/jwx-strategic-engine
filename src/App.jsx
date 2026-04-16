import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Eye, Sword, DollarSign, Target, Shield, Zap, Users, TrendingUp,
  Lock, Check, ChevronRight, ChevronLeft, ArrowRight, AlertTriangle,
  Crown, Flame, BarChart3, Layers, Brain, Loader2, Star, Plus, X,
  Search, Globe, Sparkles, RefreshCw, FileText, Send, Download
} from "lucide-react";
import jsPDF from "jspdf";

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

// ─── JW PLAYER LOGO ────────────────────────────────────────────────────────
const JWLogo = ({ size = 32 }) => (
  <img
    src="https://static-www.adweek.com/wp-content/uploads/2025/12/JWX-Main-Logo-1-2.png?w=640"
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

// ─── ENHANCED TEXTAREA WITH AI "HELP ME MAKE THIS BETTER" ───────────────────
const EnhancedTextArea = ({ label, value, onChange, placeholder, rows = 3, hint, fieldHint, buildContext }) => {
  const [status, setStatus] = useState("idle"); // idle | loading | suggesting | error
  const [suggestion, setSuggestion] = useState(null);
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState(null);

  const handleEnhance = async () => {
    if (!value || !value.trim()) {
      setError("Write a draft first — the AI edits your words, it doesn't invent them.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const fullContext = typeof buildContext === "function" ? buildContext() : (buildContext || "");
      const result = await callEnhanceAPI({
        fieldLabel: label,
        fieldHint: fieldHint || hint || "",
        draft: value,
        fullContext,
      });
      setSuggestion(result.enhanced);
      setRationale(result.rationale || "");
      setStatus("suggesting");
    } catch (err) {
      setError(err.message || "Failed to enhance");
      setStatus("error");
    }
  };

  const acceptSuggestion = () => {
    onChange(suggestion);
    setStatus("idle");
    setSuggestion(null);
  };

  const rejectSuggestion = () => {
    setStatus("idle");
    setSuggestion(null);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold" style={{ color: BRAND.navy }}>{label}</label>
        <button
          onClick={handleEnhance}
          disabled={status === "loading"}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-50"
          style={{ backgroundColor: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}
          title="Let the AI sharpen this draft"
        >
          {status === "loading" ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Sparkles size={12} />
              Expand with AI
            </>
          )}
        </button>
      </div>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border-2 bg-white px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-0"
        style={{ borderColor: BRAND.midGray, color: BRAND.textPrimary }}
        onFocus={(e) => e.target.style.borderColor = BRAND.red}
        onBlur={(e) => e.target.style.borderColor = BRAND.midGray}
      />
      {hint && <p className="text-xs" style={{ color: BRAND.textMuted }}>{hint}</p>}

      {/* AI Suggestion Panel */}
      {status === "suggesting" && suggestion && (
        <div className="mt-3 rounded-xl p-4 space-y-3" style={{ backgroundColor: "#faf5ff", border: "2px solid #ddd6fe" }}>
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: "#7c3aed" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#7c3aed" }}>AI Suggested Edit</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ backgroundColor: "white", border: `1px solid ${BRAND.midGray}` }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.textMuted }}>Your Version</p>
              <p className="text-xs whitespace-pre-wrap" style={{ color: BRAND.textSecondary }}>{value}</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: "white", border: "1px solid #c4b5fd" }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#7c3aed" }}>AI Version</p>
              <p className="text-xs whitespace-pre-wrap" style={{ color: BRAND.textPrimary }}>{suggestion}</p>
            </div>
          </div>
          {rationale && (
            <div className="rounded-lg p-2" style={{ backgroundColor: "white" }}>
              <p className="text-[10px]" style={{ color: BRAND.textMuted }}>
                <span className="font-bold">Why:</span> {rationale}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={acceptSuggestion}
              className="flex-1 rounded-lg px-3 py-2 text-xs font-bold text-white flex items-center justify-center gap-1.5"
              style={{ backgroundColor: "#7c3aed" }}
            >
              <Check size={12} /> Accept AI Version
            </button>
            <button
              onClick={rejectSuggestion}
              className="flex-1 rounded-lg px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-2"
              style={{ borderColor: BRAND.midGray, color: BRAND.textSecondary, backgroundColor: "white" }}
            >
              <X size={12} /> Keep Mine
            </button>
          </div>
        </div>
      )}

      {status === "error" && error && (
        <div className="mt-2 rounded-lg p-2 flex items-start gap-2" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
          <AlertTriangle size={12} style={{ color: "#dc2626" }} className="mt-0.5 flex-shrink-0" />
          <p className="text-xs" style={{ color: "#991b1b" }}>{error}</p>
          <button onClick={() => setStatus("idle")} className="ml-auto">
            <X size={12} style={{ color: "#991b1b" }} />
          </button>
        </div>
      )}
    </div>
  );
};

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

// ─── AI ENHANCEMENT ENGINE (Gemini Flash) ──────────────────────────────────
const callEnhanceAPI = async ({ fieldLabel, fieldHint, draft, fullContext }) => {
  const response = await fetch("/api/enhance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fieldLabel, fieldHint, draft, fullContext }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || `API Error ${response.status}`);
  }

  return response.json();
};

// ─── AI MONETIZATION MARKET ANALYSIS (Gemini) ──────────────────────────────
const callMonetizationAnalysisAPI = async ({ horizonData, competitiveAnalysis }) => {
  const response = await fetch("/api/monetization-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ horizonData, competitiveAnalysis }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || `API Error ${response.status}`);
  }

  return response.json();
};

// ─── AI PRODUCT TITLE (Gemini) ─────────────────────────────────────────────
const callProductTitleAPI = async ({ horizonData }) => {
  const response = await fetch("/api/product-title", {
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

// ─── PDF DOSSIER GENERATOR ─────────────────────────────────────────────────
const NAVY_RGB = [15, 26, 61];
const RED_RGB = [236, 0, 65];
const GRAY_RGB = [74, 80, 104];
const LIGHT_GRAY_RGB = [136, 144, 164];

// Derive a safe filename from the product idea (Press Release hook or innovation)
const sanitizeFilename = (s) => {
  if (!s) return "Product-Dossier";
  return s
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60) || "Product-Dossier";
};

// Draw a simple JWX logo mark (red square with white "JWX")
const drawJwxLogo = (doc, x, y, size = 12) => {
  doc.setFillColor(...RED_RGB);
  doc.roundedRect(x, y, size, size, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size * 0.55);
  doc.setTextColor(255, 255, 255);
  doc.text("JWX", x + size / 2, y + size * 0.66, { align: "center" });
};

const generateDossier = async (horizonData, gauntletData, monetizationData) => {
  // Ask Gemini to summarize the product into a short headline-style title.
  // Fall back to the PR Hook / Innovation / What-We-Are content if the API fails.
  let aiTitle = null;
  let aiTagline = null;
  try {
    console.log("[dossier] calling /api/product-title with horizonData…");
    const titleResp = await callProductTitleAPI({ horizonData });
    console.log("[dossier] /api/product-title responded:", titleResp);
    aiTitle = (titleResp?.title || "").trim() || null;
    aiTagline = (titleResp?.tagline || "").trim() || null;
    if (!aiTitle) {
      console.warn("[dossier] AI returned no title — using fallback.");
      alert("AI title generation returned empty — using fallback text. Check console for details.");
    }
  } catch (err) {
    console.error("[dossier] Product title API failed:", err);
    alert(`Could not generate AI title: ${err.message}\n\nUsing fallback text. Make sure /api/product-title.js is deployed.`);
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const M = 20;
  const CW = W - 2 * M;
  const BOTTOM = 275;
  let y = 0;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const newPage = () => { doc.addPage(); y = M; };

  const ensureSpace = (needed = 20) => {
    if (y + needed > BOTTOM) newPage();
  };

  const heading = (text, size = 18, color = NAVY_RGB) => {
    ensureSpace(size * 0.6 + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(text, M, y);
    y += size * 0.55 + 3;
  };

  const subheading = (text) => {
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...RED_RGB);
    doc.text(text, M, y);
    y += 6;
  };

  const label = (text) => {
    ensureSpace(6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY_RGB);
    doc.text(text.toUpperCase(), M, y);
    y += 4;
  };

  const body = (text, indent = 0, size = 9.5) => {
    if (!text) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...GRAY_RGB);
    const lines = doc.splitTextToSize(String(text), CW - indent);
    // Page-break aware rendering
    const lineHeight = size * 0.45;
    lines.forEach((line) => {
      ensureSpace(lineHeight + 1);
      doc.text(line, M + indent, y);
      y += lineHeight;
    });
    y += 1;
  };

  const fieldBlock = (labelText, value) => {
    if (!value || !String(value).trim()) return;
    label(labelText);
    body(value, 0, 9.5);
    y += 2;
  };

  const spacer = (h = 4) => { y += h; };

  const divider = () => {
    ensureSpace(6);
    doc.setDrawColor(...RED_RGB);
    doc.setLineWidth(0.5);
    doc.line(M, y, W - M, y);
    y += 4;
  };

  // Section break page — big title, optional subtitle
  const sectionCoverPage = (number, title, subtitle) => {
    newPage();
    // Background accent bar on left edge
    doc.setFillColor(...RED_RGB);
    doc.rect(0, M + 20, 8, 60, "F");
    // Section number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(54);
    doc.setTextColor(...RED_RGB);
    doc.text(String(number), M + 4, M + 50);
    // Section title
    doc.setFontSize(24);
    doc.setTextColor(...NAVY_RGB);
    doc.text(title, M + 4, M + 70);
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...GRAY_RGB);
      const subLines = doc.splitTextToSize(subtitle, CW - 4);
      doc.text(subLines, M + 4, M + 80);
    }
    // Logo in corner
    drawJwxLogo(doc, W - M - 12, M, 12);
    y = M + 110;
  };

  const fallbackIdea = horizonData.prHook || horizonData.prInnovation || horizonData.whatWeAre || "Untitled Product Idea";
  const productIdea = aiTitle || fallbackIdea;
  const productTagline = aiTagline || (aiTitle ? fallbackIdea : "");
  const competitors = gauntletData.competitors || [];
  const landscapeSummary = gauntletData.analysisResult?.landscapeSummary;

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER + VISUAL SUMMARY OF EVERYTHING
  // ═══════════════════════════════════════════════════════════════════════════
  y = 0;

  // Top navy band with logo
  doc.setFillColor(...NAVY_RGB);
  doc.rect(0, 0, W, 36, "F");
  drawJwxLogo(doc, M, 10, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("Strategic Engine", M + 22, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Executive Dossier", M + 22, 24);
  doc.setFontSize(8);
  doc.text(
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    W - M, 18, { align: "right" }
  );

  y = 46;

  // Product idea title block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...RED_RGB);
  doc.text("THE PRODUCT IDEA", M, y);
  y += 5;

  doc.setFontSize(20);
  doc.setTextColor(...NAVY_RGB);
  const ideaLines = doc.splitTextToSize(productIdea, CW);
  doc.text(ideaLines, M, y);
  y += ideaLines.length * 8 + 2;

  if (productTagline) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GRAY_RGB);
    const taglineLines = doc.splitTextToSize(productTagline, CW);
    doc.text(taglineLines, M, y);
    y += taglineLines.length * 5 + 3;
  } else {
    y += 2;
  }

  divider();
  spacer(2);

  // Visual summary — 2x3 tile grid
  const tileW = (CW - 6) / 2;
  const tileH = 38;
  const tiles = [
    {
      title: "THE PROBLEM",
      body: horizonData.problemSituation || horizonData.problemFailureMode || "Not defined",
      color: "#fef2f2",
      border: "#fecaca",
      accent: "#dc2626",
    },
    {
      title: "WHO PAYS",
      body: horizonData.buyerPersonas || horizonData.currentSpend || "Not defined",
      color: "#fffbeb",
      border: "#fde68a",
      accent: "#d97706",
    },
    {
      title: "WHY JW PLAYER",
      body: horizonData.capabilityAlignment || horizonData.structuralFit || "Not defined",
      color: "#f0fdf4",
      border: "#bbf7d0",
      accent: "#16a34a",
    },
    {
      title: "MONEY MOVEMENT",
      body: horizonData.takeMechanism || horizonData.moneyPath || "Not defined",
      color: "#eff6ff",
      border: "#bfdbfe",
      accent: "#2563eb",
    },
    {
      title: "BOUNDARIES",
      body: horizonData.whatWeAreNot || horizonData.strategicConstraints || "Not defined",
      color: "#faf5ff",
      border: "#ddd6fe",
      accent: "#7c3aed",
    },
    {
      title: "OPEN QUESTIONS",
      body: horizonData.assumptions || horizonData.risks || "Not defined",
      color: "#f8fafc",
      border: "#e2e8f0",
      accent: "#475569",
    },
  ];

  const hexToRgb = (hex) => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };

  tiles.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const tx = M + col * (tileW + 6);
    const ty = y + row * (tileH + 5);
    // Background
    doc.setFillColor(...hexToRgb(t.color));
    doc.setDrawColor(...hexToRgb(t.border));
    doc.setLineWidth(0.3);
    doc.roundedRect(tx, ty, tileW, tileH, 2, 2, "FD");
    // Accent bar
    doc.setFillColor(...hexToRgb(t.accent));
    doc.rect(tx, ty, 1.5, tileH, "F");
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...hexToRgb(t.accent));
    doc.text(t.title, tx + 4, ty + 5);
    // Body (truncated)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY_RGB);
    const bodyLines = doc.splitTextToSize(t.body, tileW - 7).slice(0, 5);
    doc.text(bodyLines, tx + 4, ty + 10);
  });
  y += 3 * (tileH + 5) + 4;

  // Snapshot stats row (competitors, avg AI score, unit econ)
  const interrogationCategories = [
    { id: "moat", label: "Competitive Moat" },
    { id: "market", label: "Market Reality" },
    { id: "execution", label: "Execution Risk" },
    { id: "customer", label: "Customer Truth" },
    { id: "economics", label: "Unit Economics" },
    { id: "strategy", label: "Strategic Leverage" },
  ];
  const aiScores = gauntletData.interrogationScores || {};
  const allAiScores = Object.values(aiScores);
  const aiScoreAvg = allAiScores.length > 0
    ? (allAiScores.reduce((a, b) => a + b, 0) / allAiScores.length).toFixed(1)
    : "—";

  ensureSpace(30);
  const statW = (CW - 12) / 3;
  const stats = [
    { label: "Competitors Mapped", value: String(competitors.length || 0) },
    { label: "Avg AI Defense Score", value: `${aiScoreAvg}/5` },
    { label: "LTV:CAC Target", value: monetizationData.ltvCacRatio || "—" },
  ];
  stats.forEach((s, i) => {
    const sx = M + i * (statW + 6);
    doc.setFillColor(...NAVY_RGB);
    doc.roundedRect(sx, y, statW, 22, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(s.value, sx + statW / 2, y + 11, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(220, 220, 230);
    doc.text(s.label, sx + statW / 2, y + 17, { align: "center" });
  });
  y += 26;

  // Executive summary paragraph
  ensureSpace(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...RED_RGB);
  doc.text("AT A GLANCE", M, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_RGB);
  const execLine = [
    horizonData.prHook ? `Hook: ${horizonData.prHook}` : null,
    competitors.length > 0 ? `Landscape: ${competitors.length} competitors mapped.` : null,
    monetizationData.valueMetric ? `Value metric: ${monetizationData.valueMetric}.` : null,
  ].filter(Boolean).join(" ");
  if (execLine) {
    const execLines = doc.splitTextToSize(execLine, CW);
    doc.text(execLines, M, y);
    y += execLines.length * 4.5;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION: STRATEGY DOC (7-section Working Backwards)
  // ═══════════════════════════════════════════════════════════════════════════
  sectionCoverPage(1, "The Strategy", "Working-Backwards product strategy in seven sections.");

  const strategySections = [
    {
      title: "0. The Press Release",
      fields: [
        ["Hook", horizonData.prHook],
        ["Status Quo", horizonData.prStatusQuo],
        ["Innovation", horizonData.prInnovation],
        ["Before & After", horizonData.prBeforeAfter],
        ["Value Prop", horizonData.prValueProp],
      ],
    },
    {
      title: "1. The Problem",
      fields: [
        ["Situation", horizonData.problemSituation],
        ["Victim", horizonData.problemVictim],
        ["Failure Mode", horizonData.problemFailureMode],
        ["Consequence", horizonData.problemConsequence],
        ["Why Current Solutions Fail", horizonData.problemCurrentSolutions],
      ],
    },
    {
      title: "2. Who Pays",
      fields: [
        ["Buyer Personas", horizonData.buyerPersonas],
        ["Current Spend", horizonData.currentSpend],
        ["Switch Logic", horizonData.switchLogic],
        ["Real Example", horizonData.realExample],
        ["Behavior Test", horizonData.behaviorTest],
      ],
    },
    {
      title: "3. Why JW Player Should Do This",
      fields: [
        ["Market Expectation", horizonData.marketExpectation],
        ["Capability Alignment", horizonData.capabilityAlignment],
        ["Structural Fit", horizonData.structuralFit],
        ["Credibility Test", horizonData.credibilityTest],
        ["Stretch / Risk", horizonData.stretchRisk],
      ],
    },
    {
      title: "4. The Money Movement",
      fields: [
        ["Where the Money Is Today", horizonData.moneyToday],
        ["Who Currently Owns It", horizonData.moneyOwners],
        ["How We Take It", horizonData.takeMechanism],
        ["Mechanism", horizonData.moneyPath],
      ],
    },
    {
      title: "5. Boundaries",
      fields: [
        ["What We Are", horizonData.whatWeAre],
        ["What We Are Not", horizonData.whatWeAreNot],
        ["Competitive Boundaries", horizonData.competitiveBoundaries],
        ["Strategic Constraints", horizonData.strategicConstraints],
      ],
    },
    {
      title: "6. Open Questions / Weak Points",
      fields: [
        ["Missing Proof", horizonData.missingProof],
        ["Assumptions", horizonData.assumptions],
        ["Risks", horizonData.risks],
        ["Unknowns", horizonData.unknowns],
      ],
    },
  ];

  strategySections.forEach((section) => {
    ensureSpace(30);
    subheading(section.title);
    spacer(1);
    section.fields.forEach(([l, v]) => fieldBlock(l, v));
    spacer(3);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION: COMPETITIVE LANDSCAPE
  // ═══════════════════════════════════════════════════════════════════════════
  sectionCoverPage(2, "Competitive Landscape", "AI-generated competitive analysis across direct, indirect, emerging, and adjacent players.");

  if (landscapeSummary) {
    label("Landscape Summary");
    body(landscapeSummary);
    spacer(3);
  }

  if (competitors.length > 0) {
    subheading(`Competitors (${competitors.length})`);
    spacer(1);
    competitors.forEach((c, i) => {
      ensureSpace(22);
      // Name + category header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...NAVY_RGB);
      doc.text(`${i + 1}. ${c.name}`, M, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...LIGHT_GRAY_RGB);
      const meta = `${c.category || "—"} · AI Risk: ${c.aiRiskRating || "—"}${gauntletData.pmRatings?.[c.name] ? ` · PM Risk: ${gauntletData.pmRatings[c.name]}` : ""}`;
      doc.text(meta, M + 60, y);
      y += 5;
      if (c.description) body(c.description, 4);
      if (c.threat) body(`Threat: ${c.threat}`, 4);
      if (c.riskRationale) body(`Risk rationale: ${c.riskRationale}`, 4);
      spacer(2);
    });
  }

  if (gauntletData.analysisResult?.marketDynamics) {
    ensureSpace(20);
    subheading("Market Dynamics");
    const md = gauntletData.analysisResult.marketDynamics;
    fieldBlock("Consolidation Trend", md.consolidationTrend);
    fieldBlock("Emerging Threats", md.emergingThreats);
    fieldBlock("Regulatory Factors", md.regulatoryFactors);
    fieldBlock("Switching Costs", md.switchingCosts);
  }

  if (Array.isArray(gauntletData.analysisResult?.strategicRecommendations) && gauntletData.analysisResult.strategicRecommendations.length > 0) {
    ensureSpace(20);
    subheading("Strategic Recommendations");
    gauntletData.analysisResult.strategicRecommendations.forEach((r, i) => body(`${i + 1}. ${r}`, 2));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION: INTERROGATION
  // ═══════════════════════════════════════════════════════════════════════════
  sectionCoverPage(3, "Challenger Interrogation", "AI-powered steel-man interrogation results across six categories.");

  const pmSelfScores = gauntletData.pmScores || {};
  const responses = gauntletData.interrogationResponses || {};
  const evals = gauntletData.evaluations || {};
  const followUps = gauntletData.followUpResponses || {};

  subheading("Score Summary (AI vs PM Self-Assessment)");
  spacer(1);
  interrogationCategories.forEach((cat) => {
    const aiCat = Object.entries(aiScores).filter(([k]) => k.startsWith(cat.id)).map(([, v]) => v);
    const pmCat = Object.entries(pmSelfScores).filter(([k]) => k.startsWith(cat.id)).map(([, v]) => v);
    const aiAvg = aiCat.length > 0 ? (aiCat.reduce((a, b) => a + b, 0) / aiCat.length).toFixed(1) : "—";
    const pmAvg = pmCat.length > 0 ? (pmCat.reduce((a, b) => a + b, 0) / pmCat.length).toFixed(1) : "—";
    body(`${cat.label}: AI ${aiAvg}/5  |  PM ${pmAvg}/5`, 2);
  });
  spacer(4);

  subheading("Detailed Responses");
  spacer(1);
  const challengerQs = gauntletData.analysisResult?.challengerQuestions || {};
  interrogationCategories.forEach((cat) => {
    const questions = challengerQs[cat.id] || [];
    questions.forEach((q, qi) => {
      ensureSpace(25);
      const key = `${cat.id}_${qi}`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...NAVY_RGB);
      const qLines = doc.splitTextToSize(`Q: ${q.question}`, CW - 4);
      qLines.forEach((line) => {
        ensureSpace(5);
        doc.text(line, M + 2, y);
        y += 4;
      });
      y += 1;
      if (responses[key]) body(`A: ${responses[key]}`, 4);
      const ev = evals[key];
      if (ev) {
        ensureSpace(5);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...RED_RGB);
        doc.text(`AI Score: ${ev.score}/5 — ${ev.label}`, M + 4, y);
        y += 4;
        if (ev.assessment) body(`Assessment: ${ev.assessment}`, 4);
      }
      if (followUps[key]) body(`Follow-up response: ${followUps[key]}`, 4);
      spacer(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION: MONETIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  sectionCoverPage(4, "Monetization", "AI market read, value metric, pricing philosophy, and unit economics.");

  const ma = monetizationData.marketAnalysis;
  if (ma) {
    subheading("AI Market Analysis");
    if (ma.marketSummary) { label("Market Summary"); body(ma.marketSummary); }
    if (Array.isArray(ma.competitorBenchmarks) && ma.competitorBenchmarks.length > 0) {
      label("Peer Pricing Benchmarks");
      ma.competitorBenchmarks.forEach((b) => {
        body(`${b.name} — ${b.pricingModel || "—"}${b.priceRange ? ` · ${b.priceRange}` : ""}${b.notes ? `. ${b.notes}` : ""}`, 2);
      });
    }
    if (ma.recommendedPriceRange) {
      label("Reasonable Price Range");
      body(ma.recommendedPriceRange);
      if (ma.priceRangeRationale) body(ma.priceRangeRationale, 2, 8.5);
    }
    if (Array.isArray(ma.pricingObservations) && ma.pricingObservations.length > 0) {
      label("Pricing Observations");
      ma.pricingObservations.forEach((obs) => body(`• ${obs}`, 2));
    }
    spacer(3);
  }

  if (monetizationData.valueMetric) {
    subheading("Value Metric");
    body(monetizationData.valueMetric);
    spacer(2);
  }
  if (monetizationData.pricingPhilosophy) {
    subheading("Pricing Philosophy");
    body(monetizationData.pricingPhilosophy);
    spacer(2);
  }

  if (monetizationData.cac || monetizationData.ltv || monetizationData.ltvCacRatio || monetizationData.paybackPeriod) {
    subheading("Unit Economics");
    fieldBlock("Target CAC", monetizationData.cac);
    fieldBlock("Target LTV", monetizationData.ltv);
    fieldBlock("LTV:CAC Ratio", monetizationData.ltvCacRatio);
    fieldBlock("Payback Period", monetizationData.paybackPeriod);
  }

  // ── Footer on every page ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Mini logo footer-left
    drawJwxLogo(doc, M, 285, 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...LIGHT_GRAY_RGB);
    doc.text("Strategic Engine — Confidential", M + 7, 289);
    doc.text(`Page ${i} of ${pageCount}`, W - M, 289, { align: "right" });
  }

  const safeName = sanitizeFilename(productIdea);
  doc.save(`${safeName}.pdf`);
};

// ─── FEASIBILITY PAYLOAD BUILDER ───────────────────────────────────────────
const buildFeasibilityPayload = (horizonData, gauntletData, monetizationData) => {
  const competitors = gauntletData.competitors || [];
  const aiScores = gauntletData.interrogationScores || {};
  const pmSelfScores = gauntletData.pmScores || {};

  const interrogationCategories = [
    { id: "moat", label: "Competitive Moat" },
    { id: "market", label: "Market Reality" },
    { id: "execution", label: "Execution Risk" },
    { id: "customer", label: "Customer Truth" },
    { id: "economics", label: "Unit Economics" },
    { id: "strategy", label: "Strategic Leverage" },
  ];

  const scoreSummary = interrogationCategories.map(cat => {
    const aiCatScores = Object.entries(aiScores).filter(([k]) => k.startsWith(cat.id)).map(([,v]) => v);
    const pmCatScores = Object.entries(pmSelfScores).filter(([k]) => k.startsWith(cat.id)).map(([,v]) => v);
    return {
      category: cat.label,
      aiAvg: aiCatScores.length > 0 ? +(aiCatScores.reduce((a,b) => a+b, 0) / aiCatScores.length).toFixed(1) : null,
      pmAvg: pmCatScores.length > 0 ? +(pmCatScores.reduce((a,b) => a+b, 0) / pmCatScores.length).toFixed(1) : null,
    };
  });

  const weakAreas = scoreSummary.filter(s => s.aiAvg && s.aiAvg < 3).map(s => s.category);
  const blindSpots = scoreSummary.filter(s => s.aiAvg && s.pmAvg && (s.pmAvg - s.aiAvg) > 1).map(s => s.category);

  return {
    requestType: "feasibility_analysis",
    submittedAt: new Date().toISOString(),
    inference: [
      "SCOPE LOCK: Evaluate the feasibility of ONLY the product literally described in this dossier — nothing more.",
      "The 'boundaries' object (whatWeAre / whatWeAreNot / competitiveBoundaries / strategicConstraints) is the definitive scope. Treat it as a hard contract. If a capability is not in 'whatWeAre', it is OUT of scope for this review.",
      "",
      "YOUR JOB:",
      "1. Determine whether the product AS DESCRIBED can be built using JW's existing infrastructure, systems, and codebases.",
      "2. Identify which specific JW systems can be used as-is, which need modification, and which components are missing.",
      "3. Quantify the lift: realistic MVP timeline, team composition, and rough infra cost range at the stated scale.",
      "4. Flag any technical constraint in our current stack that makes the product AS SCOPED infeasible.",
      "",
      "DO NOT:",
      "- Expand, reimagine, or 'improve' the product. You are not a product designer.",
      "- Suggest adjacent features, additional phases, or a larger vision than what is written.",
      "- Propose a bigger platform play, rebrand, or strategic pivot — even if one seems obvious.",
      "- Recommend rescoping the product to better fit our infrastructure. If something is infeasible, say so plainly; do not redesign it.",
      "- Pad the estimate for features that aren't in this dossier.",
      "",
      "If the dossier is ambiguous about a specific capability, default to the narrowest reasonable interpretation and note the ambiguity — do not assume the larger interpretation.",
    ].join("\n"),

    strategy: {
      pressRelease: {
        hook: horizonData.prHook,
        statusQuo: horizonData.prStatusQuo,
        innovation: horizonData.prInnovation,
        beforeAfter: horizonData.prBeforeAfter,
        valueProp: horizonData.prValueProp,
      },
      problem: {
        situation: horizonData.problemSituation,
        victim: horizonData.problemVictim,
        failureMode: horizonData.problemFailureMode,
        consequence: horizonData.problemConsequence,
        whyCurrentSolutionsFail: horizonData.problemCurrentSolutions,
      },
      whoPays: {
        buyerPersonas: horizonData.buyerPersonas,
        currentSpend: horizonData.currentSpend,
        switchLogic: horizonData.switchLogic,
        realExample: horizonData.realExample,
        behaviorTest: horizonData.behaviorTest,
      },
      whyJW: {
        marketExpectation: horizonData.marketExpectation,
        capabilityAlignment: horizonData.capabilityAlignment,
        structuralFit: horizonData.structuralFit,
        credibilityTest: horizonData.credibilityTest,
        stretchRisk: horizonData.stretchRisk,
      },
      moneyMovement: {
        whereTheMoneyIsToday: horizonData.moneyToday,
        whoCurrentlyOwnsIt: horizonData.moneyOwners,
        howWeTakeIt: horizonData.takeMechanism,
        mechanism: horizonData.moneyPath,
      },
      boundaries: {
        whatWeAre: horizonData.whatWeAre,
        whatWeAreNot: horizonData.whatWeAreNot,
        competitiveBoundaries: horizonData.competitiveBoundaries,
        strategicConstraints: horizonData.strategicConstraints,
      },
      openQuestions: {
        missingProof: horizonData.missingProof,
        assumptions: horizonData.assumptions,
        risks: horizonData.risks,
        unknowns: horizonData.unknowns,
      },
    },

    competitiveAnalysis: {
      landscapeSummary: gauntletData.analysisResult?.landscapeSummary,
      competitorCount: competitors.length,
      competitors: competitors.map(c => ({
        name: c.name,
        category: c.category,
        aiRiskRating: c.aiRiskRating,
        pmRiskRating: gauntletData.pmRatings?.[c.name] || null,
        description: c.description,
        threat: c.threat,
      })),
      marketDynamics: gauntletData.analysisResult?.marketDynamics,
      strategicRecommendations: gauntletData.analysisResult?.strategicRecommendations,
    },

    challengerResults: {
      scoreSummary,
      weakAreas,
      blindSpots,
      evaluations: gauntletData.evaluations || {},
      responses: gauntletData.interrogationResponses || {},
      followUpResponses: gauntletData.followUpResponses || {},
    },

    monetization: {
      valueMetric: monetizationData.valueMetric,
      pricingPhilosophy: monetizationData.pricingPhilosophy,
      marketAnalysis: monetizationData.marketAnalysis || null,
      unitEconomics: {
        cac: monetizationData.cac,
        ltv: monetizationData.ltv,
        ltvCacRatio: monetizationData.ltvCacRatio,
        paybackPeriod: monetizationData.paybackPeriod,
      },
    },

    feasibilityQuestions: [
      "Which specific JW systems, services, or repositories can be used AS-IS to deliver the product exactly as described in the 'boundaries' section? List by name.",
      "For the product as literally scoped (no expansions, no adjacent features), what components would need to be built new or materially modified? Be specific and minimal — only what is required to ship what's written.",
      "What technical risks, architecture gaps, or integration hazards exist IN OUR CURRENT STACK for delivering this specific scope? Do not list risks for features outside the dossier.",
      "Given the scope in 'whatWeAre' and the limits in 'strategicConstraints', what is a realistic MVP timeline? Assume the smallest credible team, not an aspirational one.",
      "Are there hard technical constraints in our existing infrastructure that make the product AS DESCRIBED infeasible? Flag them directly — do not recommend rescoping to work around them.",
      "What is the minimum team composition needed to ship exactly this scope? Do not staff for a broader roadmap or a future phase.",
      "At the customer scale and usage levels implied by the strategy, what are rough Year 1 and Year 2 infrastructure cost ranges?",
      "On a 1-5 scale, how confident are you in this feasibility read? If below 4, name the specific unknowns that would need discovery to raise confidence.",
    ],
  };
};

const callFeasibilityAPI = async (payload) => {
  const response = await fetch("/api/feasibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || `API Error ${response.status}`);
  }

  return response.json();
};

// ─── MODULE 1: THE HORIZON (7-SECTION STRATEGY DOC) ─────────────────────────
const HorizonModule = ({ data, setData, onComplete }) => {
  const [activeSection, setActiveSection] = useState(0);

  const update = (key, value) => setData({ ...data, [key]: value });

  // Serializes the entire strategy doc so the AI can edit any field with full context
  const buildFullContext = () => {
    const lines = [
      `# 0. Press Release`,
      `Hook: ${data.prHook || "(not yet written)"}`,
      `Status Quo: ${data.prStatusQuo || "(not yet written)"}`,
      `Innovation: ${data.prInnovation || "(not yet written)"}`,
      `Before & After: ${data.prBeforeAfter || "(not yet written)"}`,
      `Value Prop: ${data.prValueProp || "(not yet written)"}`,
      ``,
      `# 1. The Problem`,
      `Situation: ${data.problemSituation || "(not yet written)"}`,
      `Victim: ${data.problemVictim || "(not yet written)"}`,
      `Failure Mode: ${data.problemFailureMode || "(not yet written)"}`,
      `Consequence: ${data.problemConsequence || "(not yet written)"}`,
      `Why Current Solutions Fail: ${data.problemCurrentSolutions || "(not yet written)"}`,
      ``,
      `# 2. Who Pays`,
      `Buyer Personas: ${data.buyerPersonas || "(not yet written)"}`,
      `Current Spend Behavior: ${data.currentSpend || "(not yet written)"}`,
      `Switch Logic: ${data.switchLogic || "(not yet written)"}`,
      `Real Example: ${data.realExample || "(not yet written)"}`,
      `Behavior Test: ${data.behaviorTest || "(not yet written)"}`,
      ``,
      `# 3. Why JW Player Should Do This`,
      `Market Expectation: ${data.marketExpectation || "(not yet written)"}`,
      `Capability Alignment: ${data.capabilityAlignment || "(not yet written)"}`,
      `Structural Fit: ${data.structuralFit || "(not yet written)"}`,
      `Credibility Test: ${data.credibilityTest || "(not yet written)"}`,
      `Stretch/Risk: ${data.stretchRisk || "(not yet written)"}`,
      ``,
      `# 4. The Money Movement`,
      `Where the Money Is Today: ${data.moneyToday || "(not yet written)"}`,
      `Who Currently Owns It: ${data.moneyOwners || "(not yet written)"}`,
      `How We Take It: ${data.takeMechanism || "(not yet written)"}`,
      `Mechanism/Path: ${data.moneyPath || "(not yet written)"}`,
      ``,
      `# 5. Boundaries`,
      `What We Are: ${data.whatWeAre || "(not yet written)"}`,
      `What We Are Not: ${data.whatWeAreNot || "(not yet written)"}`,
      `Competitive Boundaries: ${data.competitiveBoundaries || "(not yet written)"}`,
      `Strategic Constraints: ${data.strategicConstraints || "(not yet written)"}`,
      ``,
      `# 6. Open Questions / Weak Points`,
      `Missing Proof: ${data.missingProof || "(not yet written)"}`,
      `Assumptions: ${data.assumptions || "(not yet written)"}`,
      `Risks: ${data.risks || "(not yet written)"}`,
      `Unknowns: ${data.unknowns || "(not yet written)"}`,
    ];
    return lines.join("\n");
  };

  const sectionConfig = [
    {
      id: "press-release",
      label: "Press Release",
      icon: Sparkles,
      description: "The hook, status quo, innovation, before/after, and value prop — written as if announcing this to the world on day one.",
      fields: [
        { key: "prHook", label: "The Hook", rows: 2, placeholder: "Summarize the 'New Reality' in one punchy sentence. What becomes possible the day we ship this?", hint: "One sentence. If a reporter would quote it, you nailed it." },
        { key: "prStatusQuo", label: "The Status Quo", rows: 3, placeholder: "Describe the current market inefficiency or missed opportunity. What's broken today that everyone accepts?" },
        { key: "prInnovation", label: "The Innovation", rows: 3, placeholder: "Introduce the new model/product. What's the core idea in plain English?" },
        { key: "prBeforeAfter", label: "The Before and After", rows: 3, placeholder: "A simple comparison of the outcome for stakeholders before and after this exists." },
        { key: "prValueProp", label: "The Value Prop", rows: 3, placeholder: "Explicitly state the benefits for each participating party (publishers, viewers, advertisers, partners)." },
      ],
    },
    {
      id: "problem",
      label: "The Problem",
      icon: AlertTriangle,
      description: "What's broken, who it hurts, and why existing solutions haven't solved it.",
      fields: [
        { key: "problemSituation", label: "1.1 The Situation", rows: 3, placeholder: "What is the technical/market context? Provide specific data points or metrics illustrating the current state." },
        { key: "problemVictim", label: "1.2 The Victim", rows: 2, placeholder: "Who is specifically hurt by this problem (internal teams or external customers)?" },
        { key: "problemFailureMode", label: "1.3 The Failure Mode", rows: 3, placeholder: "Describe the exact 'moment of failure' or the point where value is lost." },
        { key: "problemConsequence", label: "1.4 The Consequence", rows: 3, placeholder: "What is the macro-impact (lost revenue, increased costs, brand dilution) at scale?" },
        { key: "problemCurrentSolutions", label: "1.5 Why Current Solutions Fail", rows: 3, placeholder: "List existing workarounds and explain why they don't solve the root cause." },
      ],
    },
    {
      id: "who-pays",
      label: "Who Pays",
      icon: DollarSign,
      description: "The specific buyer, their current budget, and what triggers them to switch.",
      fields: [
        { key: "buyerPersonas", label: "2.1 The Buyer", rows: 2, placeholder: "Define the specific personas or departments who control the budget." },
        { key: "currentSpend", label: "2.2 Current Spend Behavior", rows: 3, placeholder: "What are they currently spending money on to achieve this goal?" },
        { key: "switchLogic", label: "2.3 The Switch Logic", rows: 3, placeholder: "What is the specific trigger that makes them move budget to this new solution?" },
        { key: "realExample", label: "2.4 Real Example", rows: 3, placeholder: "Provide anecdotal or data-backed evidence of existing demand (e.g., lost deals, direct requests, RFPs)." },
        { key: "behaviorTest", label: "2.5 Behavior Test", rows: 3, placeholder: "Describe the delta between a world with this solution and a world where it never exists." },
      ],
    },
    {
      id: "why-jw",
      label: "Why JW Player",
      icon: Crown,
      description: "The capability, credibility, and strategic fit arguments for why JW specifically should do this.",
      fields: [
        { key: "marketExpectation", label: "3.1 Market Expectation", rows: 3, placeholder: "How does the market currently perceive JW Player, and does this fit that image?" },
        { key: "capabilityAlignment", label: "3.2 Capability Alignment", rows: 3, placeholder: "What specific assets (tech, data, relationships) do we own that make us uniquely qualified?" },
        { key: "structuralFit", label: "3.3 Structural Fit", rows: 3, placeholder: "Where does this live in our existing product/monetization stack?" },
        { key: "credibilityTest", label: "3.4 Credibility Test", rows: 3, placeholder: "Will the market view this as a natural evolution or a confusing pivot?" },
        { key: "stretchRisk", label: "3.5 Stretch / Risk", rows: 3, placeholder: "What are the organizational or technical hurdles we haven't cleared yet?" },
      ],
    },
    {
      id: "money-movement",
      label: "Money Movement",
      icon: TrendingUp,
      description: "Where the dollars are today, who owns them, and how they move into our bank account.",
      fields: [
        { key: "moneyToday", label: "4.1 Where the Money Is Today", rows: 3, placeholder: "Identify the specific pools of capital (ad budgets, subscription revenue, infrastructure spend, etc)." },
        { key: "moneyOwners", label: "4.2 Who Currently Owns It", rows: 3, placeholder: "Name the entities currently capturing this spend." },
        { key: "takeMechanism", label: "4.3 How We Take It", rows: 2, placeholder: "Expansion (net new revenue) or Displacement (taking from a competitor)? Be explicit." },
        { key: "moneyPath", label: "4.4 Mechanism", rows: 3, placeholder: "The logical path of how a dollar moves from the buyer to our bank account." },
      ],
    },
    {
      id: "boundaries",
      label: "Boundaries",
      icon: Shield,
      description: "What we are, what we're not, and who we're choosing not to compete with.",
      fields: [
        { key: "whatWeAre", label: "5.1 What We Are", rows: 2, placeholder: "A one-sentence definition of the product/initiative." },
        { key: "whatWeAreNot", label: "5.2 What We Are Not", rows: 3, placeholder: "Define what we are intentionally not building to avoid scope creep or identity crisis." },
        { key: "competitiveBoundaries", label: "5.3 Competitive Boundaries", rows: 3, placeholder: "Who are we choosing not to compete with?" },
        { key: "strategicConstraints", label: "5.4 Strategic Constraints", rows: 3, placeholder: "Any hard dependencies or limitations on the initial rollout (e.g., specific regions or formats)." },
      ],
    },
    {
      id: "open-questions",
      label: "Open Questions",
      icon: Brain,
      description: "What we still need to prove, the assumptions the whole doc rests on, and the risks.",
      fields: [
        { key: "missingProof", label: "6.1 Missing Proof", rows: 3, placeholder: "What data or validation do we still need to collect?" },
        { key: "assumptions", label: "6.2 Assumptions", rows: 3, placeholder: "What core beliefs must be true for this entire document to remain valid?" },
        { key: "risks", label: "6.3 Risks", rows: 3, placeholder: "What are the primary threats (cannibalization, reputation, technical blockers)?" },
        { key: "unknowns", label: "6.4 Unknowns", rows: 3, placeholder: "What questions can only be answered by launching or further engineering discovery?" },
      ],
    },
  ];

  const allFields = sectionConfig.flatMap(s => s.fields);
  const filledCount = allFields.filter(f => data[f.key] && String(data[f.key]).trim()).length;
  const completeness = Math.round((filledCount / allFields.length) * 100);

  const activeSectionConfig = sectionConfig[activeSection];
  const SectionIcon = activeSectionConfig.icon;

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {sectionConfig.map((s, i) => {
          const Icon = s.icon;
          const sectionFilled = s.fields.filter(f => data[f.key] && String(data[f.key]).trim()).length;
          const sectionTotal = s.fields.length;
          const sectionComplete = sectionFilled === sectionTotal;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(i)}
              className="flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-semibold transition-all"
              style={{
                borderColor: activeSection === i ? BRAND.red : BRAND.midGray,
                backgroundColor: activeSection === i ? `${BRAND.red}08` : "white",
                color: activeSection === i ? BRAND.red : BRAND.textSecondary,
              }}
            >
              <Icon size={14} />
              <span>{i}. {s.label}</span>
              <span
                className="inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                style={{
                  backgroundColor: sectionComplete ? "#16a34a" : BRAND.midGray,
                  color: "white",
                  minWidth: 24,
                }}
              >
                {sectionFilled}/{sectionTotal}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Section */}
      <SectionCard>
        <div className="mb-5 pb-4 border-b-2" style={{ borderColor: BRAND.lightGray }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${BRAND.red}10` }}>
              <SectionIcon size={20} style={{ color: BRAND.red }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: BRAND.textMuted }}>Section {activeSection}</p>
              <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>{activeSectionConfig.label}</h3>
            </div>
          </div>
          <p className="text-sm" style={{ color: BRAND.textSecondary }}>{activeSectionConfig.description}</p>
        </div>
        <div className="space-y-5">
          {activeSectionConfig.fields.map(f => (
            <EnhancedTextArea
              key={f.key}
              label={f.label}
              value={data[f.key]}
              onChange={(v) => update(f.key, v)}
              placeholder={f.placeholder}
              rows={f.rows}
              hint={f.hint}
              fieldHint={f.placeholder}
              buildContext={buildFullContext}
            />
          ))}
        </div>
      </SectionCard>

      {/* Prev/Next Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
          disabled={activeSection === 0}
          className="flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ borderColor: BRAND.midGray, color: BRAND.textSecondary, backgroundColor: "white" }}
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <span className="text-xs" style={{ color: BRAND.textMuted }}>
          Section {activeSection + 1} of {sectionConfig.length}
        </span>
        <button
          onClick={() => setActiveSection(Math.min(sectionConfig.length - 1, activeSection + 1))}
          disabled={activeSection === sectionConfig.length - 1}
          className="flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ borderColor: BRAND.midGray, color: BRAND.textSecondary, backgroundColor: "white" }}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>

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
            <p className="text-sm font-semibold" style={{ color: BRAND.navy }}>Strategy Doc Completeness</p>
            <p className="text-xs" style={{ color: BRAND.textMuted }}>
              {completeness >= 70 ? "Ready to face The Gauntlet" : `${filledCount}/${allFields.length} fields filled — aim for 70%+ before locking`}
            </p>
          </div>
        </div>
        <button
          onClick={onComplete}
          disabled={completeness < 50}
          className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: completeness >= 50 ? BRAND.red : BRAND.midGray }}
          onMouseEnter={(e) => { if (completeness >= 50) e.currentTarget.style.backgroundColor = BRAND.redHover; }}
          onMouseLeave={(e) => { if (completeness >= 50) e.currentTarget.style.backgroundColor = BRAND.red; }}
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
                <p className="text-xs font-semibold" style={{ color: BRAND.textMuted }}>The Hook</p>
                <p className="text-sm mt-0.5" style={{ color: BRAND.textPrimary }}>
                  {horizonData.prHook || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: BRAND.textMuted }}>The Problem</p>
                <p className="text-sm mt-0.5" style={{ color: BRAND.textPrimary }}>
                  {horizonData.problemSituation || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: BRAND.textMuted }}>Who Pays</p>
                <p className="text-sm mt-0.5" style={{ color: BRAND.textPrimary }}>
                  {horizonData.buyerPersonas || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: BRAND.textMuted }}>What We Are Not</p>
                <p className="text-sm mt-0.5" style={{ color: BRAND.textPrimary }}>
                  {horizonData.whatWeAreNot || "—"}
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
    const sectionsWithAnswer = INTERROGATION_CATEGORIES.filter(c =>
      Object.keys(responses).some(k => k.startsWith(c.id) && responses[k]?.trim())
    ).length;
    const canProceed = sectionsWithAnswer >= INTERROGATION_CATEGORIES.length;

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
                {sectionsWithAnswer}/{INTERROGATION_CATEGORIES.length} sections answered · answer one per section to continue
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 rounded-full" style={{ backgroundColor: BRAND.midGray }}>
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${(sectionsWithAnswer / INTERROGATION_CATEGORIES.length) * 100}%`, backgroundColor: BRAND.red }}
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
                        const horizonSummary = `HOOK: ${horizonData.prHook || "—"}\nINNOVATION: ${horizonData.prInnovation || "—"}\nPROBLEM SITUATION: ${horizonData.problemSituation || "—"}\nVICTIM: ${horizonData.problemVictim || "—"}\nBUYER: ${horizonData.buyerPersonas || "—"}\nSWITCH LOGIC: ${horizonData.switchLogic || "—"}\nWHY JW (CAPABILITY ALIGNMENT): ${horizonData.capabilityAlignment || "—"}\nHOW WE TAKE THE MONEY: ${horizonData.takeMechanism || "—"}\nWHAT WE ARE NOT: ${horizonData.whatWeAreNot || "—"}\nKEY ASSUMPTIONS: ${horizonData.assumptions || "—"}\nKNOWN RISKS: ${horizonData.risks || "—"}`;
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

              {/* AI Follow-Up Question — only shown when score < 4 */}
              {evaluations[responseKey].followUp && evaluations[responseKey].score < 4 && (
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
        {canProceed && (
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
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState(null);

  const competitorNames = (gauntletData.competitors || []).map((c) => c.name).filter(Boolean);
  const marketAnalysis = data.marketAnalysis || null;

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

  const runMarketAnalysis = async () => {
    setMarketLoading(true);
    setMarketError(null);
    try {
      const result = await callMonetizationAnalysisAPI({
        horizonData,
        competitiveAnalysis: gauntletData.analysisResult || {},
      });
      setData({ ...data, marketAnalysis: result });
    } catch (err) {
      setMarketError(err.message || "Failed to analyze the market");
    } finally {
      setMarketLoading(false);
    }
  };

  const applyValueMetricSuggestion = () => {
    if (marketAnalysis?.valueMetricSuggestion) {
      setData({ ...data, valueMetric: marketAnalysis.valueMetricSuggestion });
    }
  };

  const scrollToPublish = () => {
    const el = document.getElementById("publish-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      {/* ═══ FINALIZE CTA BAR (ALWAYS VISIBLE AT TOP) ═══ */}
      <div
        className="sticky top-4 z-30 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4"
        style={{ backgroundColor: BRAND.navy, border: `2px solid ${BRAND.red}` }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: BRAND.red }}>
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Ready to finalize?</p>
            <p className="text-xs" style={{ color: "#cbd5e1" }}>Publish your dossier or send for feasibility review</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try { await generateDossier(horizonData, gauntletData, data); }
              catch (err) { console.error("Dossier generation failed:", err); alert("Could not generate the dossier. Please try again."); }
            }}
            className="rounded-xl px-4 py-2 text-xs font-bold text-white flex items-center gap-2 transition-all whitespace-nowrap"
            style={{ backgroundColor: BRAND.red }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = BRAND.redHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = BRAND.red}
          >
            <Download size={14} />
            Publish Dossier (PDF)
          </button>
          <button
            onClick={scrollToPublish}
            className="rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-2 transition-all border-2 whitespace-nowrap"
            style={{ backgroundColor: "transparent", color: "white", borderColor: "white" }}
          >
            Jump to Finalize
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

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
            <p className="text-xs font-semibold mb-1" style={{ color: BRAND.textMuted }}>The Hook</p>
            <p className="text-sm" style={{ color: BRAND.textPrimary }}>{horizonData.prHook || "Not yet defined"}</p>
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

      {/* ═══ AI MARKET ANALYSIS ═══ */}
      <SectionCard>
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "#f5f3ff" }}>
              <Brain size={20} style={{ color: "#7c3aed" }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>AI Market Read</h3>
              <p className="text-xs" style={{ color: BRAND.textMuted }}>
                Gemini reviews your competitive landscape and proposes a value metric + pricing observations.
              </p>
            </div>
          </div>
          <button
            onClick={runMarketAnalysis}
            disabled={marketLoading}
            className="rounded-xl px-4 py-2 text-xs font-bold text-white flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
            style={{ backgroundColor: "#7c3aed" }}
          >
            {marketLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Analyzing...
              </>
            ) : marketAnalysis ? (
              <>
                <RefreshCw size={14} /> Re-run Analysis
              </>
            ) : (
              <>
                <Sparkles size={14} /> Run Market Analysis
              </>
            )}
          </button>
        </div>

        {marketError && (
          <div className="rounded-xl border-2 p-3 mb-3 flex items-start gap-2" style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}>
            <AlertTriangle size={14} style={{ color: "#dc2626" }} className="mt-0.5 shrink-0" />
            <p className="text-xs" style={{ color: "#991b1b" }}>{marketError}</p>
          </div>
        )}

        {!marketAnalysis && !marketLoading && (
          <p className="text-xs italic" style={{ color: BRAND.textMuted }}>
            No market analysis yet. Run it to see how peers price comparable products and what value metric is most defensible for your idea.
          </p>
        )}

        {marketAnalysis && (
          <div className="space-y-4">
            {marketAnalysis.marketSummary && (
              <div className="rounded-xl p-4" style={{ backgroundColor: "#faf5ff", border: "1px solid #ddd6fe" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#7c3aed" }}>Market Summary</p>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textSecondary }}>{marketAnalysis.marketSummary}</p>
              </div>
            )}

            {Array.isArray(marketAnalysis.competitorBenchmarks) && marketAnalysis.competitorBenchmarks.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: BRAND.textMuted }}>How Peers Price</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {marketAnalysis.competitorBenchmarks.map((b, i) => (
                    <div key={i} className="rounded-lg p-3" style={{ backgroundColor: BRAND.lightGray }}>
                      <p className="text-xs font-bold" style={{ color: BRAND.navy }}>{b.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: BRAND.textSecondary }}>
                        <span className="font-semibold">Model:</span> {b.pricingModel}
                      </p>
                      {b.priceRange && (
                        <p className="text-[11px]" style={{ color: BRAND.textSecondary }}>
                          <span className="font-semibold">Range:</span> {b.priceRange}
                        </p>
                      )}
                      {b.notes && <p className="text-[11px] italic mt-1" style={{ color: BRAND.textMuted }}>{b.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {marketAnalysis.recommendedPriceRange && (
              <div className="rounded-xl p-4" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#16a34a" }}>Reasonable Price Range</p>
                <p className="text-sm font-semibold" style={{ color: BRAND.navy }}>{marketAnalysis.recommendedPriceRange}</p>
                {marketAnalysis.priceRangeRationale && (
                  <p className="text-xs mt-1" style={{ color: BRAND.textSecondary }}>{marketAnalysis.priceRangeRationale}</p>
                )}
              </div>
            )}

            {Array.isArray(marketAnalysis.pricingObservations) && marketAnalysis.pricingObservations.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: BRAND.textMuted }}>Pricing Observations</p>
                <ul className="space-y-1">
                  {marketAnalysis.pricingObservations.map((obs, i) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: BRAND.textSecondary }}>
                      <span style={{ color: BRAND.red }}>•</span> {obs}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ═══ VALUE METRIC (recommended but editable) ═══ */}
      <SectionCard>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold" style={{ color: BRAND.navy }}>
            Value Metric (What You Charge For)
          </label>
          {marketAnalysis?.valueMetricSuggestion && (
            <button
              onClick={applyValueMetricSuggestion}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}
              title="Use the AI-recommended value metric"
            >
              <Sparkles size={12} />
              Use AI suggestion
            </button>
          )}
        </div>

        {marketAnalysis?.valueMetricSuggestion && (
          <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: "#faf5ff", border: "1px solid #ddd6fe" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#7c3aed" }}>AI Recommendation</p>
            <p className="text-sm font-semibold" style={{ color: BRAND.navy }}>{marketAnalysis.valueMetricSuggestion}</p>
            {marketAnalysis.valueMetricRationale && (
              <p className="text-xs mt-1" style={{ color: BRAND.textSecondary }}>{marketAnalysis.valueMetricRationale}</p>
            )}
          </div>
        )}

        <textarea
          value={data.valueMetric || ""}
          onChange={(e) => setData({ ...data, valueMetric: e.target.value })}
          placeholder="The unit that scales with customer success (e.g., 'video minutes delivered', 'API calls', 'GB encoded')."
          rows={2}
          className="w-full rounded-xl border-2 bg-white px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-0"
          style={{ borderColor: BRAND.midGray, color: BRAND.textPrimary }}
          onFocus={(e) => e.target.style.borderColor = BRAND.red}
          onBlur={(e) => e.target.style.borderColor = BRAND.midGray}
        />
        <p className="text-xs mt-1" style={{ color: BRAND.textMuted }}>
          The best value metrics correlate directly with the customer outcome your product enables.
        </p>
      </SectionCard>

      {/* ═══ PRICING PHILOSOPHY (free text) ═══ */}
      <SectionCard>
        <TextArea
          label="Pricing Philosophy"
          value={data.pricingPhilosophy}
          onChange={(v) => setData({ ...data, pricingPhilosophy: v })}
          placeholder="How should this be priced and why? What's the thesis — value-based, penetration, premium, displacement? How does this pricing create a moat?"
          rows={4}
        />
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

      {/* ═══ PUBLISH & FEASIBILITY ═══ */}
      <div id="publish-section" className="mt-8 pt-8 border-t-4 rounded-2xl p-6 scroll-mt-24" style={{ borderColor: BRAND.red, backgroundColor: `${BRAND.red}05` }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: BRAND.red }}>
            <FileText size={26} className="text-white" />
          </div>
          <div>
            <Badge variant="danger">FINALIZE</Badge>
            <h3 className="text-2xl font-black mt-1" style={{ color: BRAND.navy }}>Publish & Review</h3>
            <p className="text-sm" style={{ color: BRAND.textSecondary }}>
              Generate your executive dossier or send for internal feasibility review
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PDF Dossier */}
          <SectionCard>
            <div className="flex items-center gap-2 mb-3">
              <Download size={16} style={{ color: BRAND.red }} />
              <h4 className="text-sm font-bold" style={{ color: BRAND.navy }}>Executive Dossier (PDF)</h4>
            </div>
            <p className="text-xs mb-4" style={{ color: BRAND.textSecondary }}>
              Generates a branded PDF with executive roundup, competitive landscape, interrogation results, and monetization strategy.
            </p>
            <button
              onClick={async () => {
              try { await generateDossier(horizonData, gauntletData, data); }
              catch (err) { console.error("Dossier generation failed:", err); alert("Could not generate the dossier. Please try again."); }
            }}
              className="w-full rounded-xl px-5 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: BRAND.red }}
              onMouseEnter={(e) => e.target.style.backgroundColor = BRAND.redHover}
              onMouseLeave={(e) => e.target.style.backgroundColor = BRAND.red}
            >
              <FileText size={16} />
              Publish Dossier
            </button>
          </SectionCard>

          {/* Feasibility Review */}
          <FeasibilityCard horizonData={horizonData} gauntletData={gauntletData} monetizationData={data} />
        </div>
      </div>
    </div>
  );
};

// ─── FEASIBILITY REVIEW CARD ───────────────────────────────────────────────
const FeasibilityCard = ({ horizonData, gauntletData, monetizationData }) => {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const sendForReview = async () => {
    setStatus("sending");
    setError(null);
    try {
      const payload = buildFeasibilityPayload(horizonData, gauntletData, monetizationData);
      const res = await callFeasibilityAPI(payload);
      setResult(res);
      setStatus("sent");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  return (
    <SectionCard>
      <div className="flex items-center gap-2 mb-3">
        <Send size={16} style={{ color: BRAND.navy }} />
        <h4 className="text-sm font-bold" style={{ color: BRAND.navy }}>Internal Feasibility Review</h4>
      </div>
      <p className="text-xs mb-4" style={{ color: BRAND.textSecondary }}>
        Sends the full strategy dossier to your internal architecture review API for a feasibility assessment against existing infrastructure.
      </p>

      {status === "idle" && (
        <button
          onClick={sendForReview}
          className="w-full rounded-xl px-5 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
          style={{ backgroundColor: BRAND.navy }}
          onMouseEnter={(e) => e.target.style.backgroundColor = BRAND.red}
          onMouseLeave={(e) => e.target.style.backgroundColor = BRAND.navy}
        >
          <Send size={16} />
          Send for Feasibility Review
        </button>
      )}

      {status === "sending" && (
        <div className="flex items-center justify-center gap-2 py-3">
          <Loader2 size={16} className="animate-spin" style={{ color: BRAND.red }} />
          <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>Sending to internal review...</span>
        </div>
      )}

      {status === "sent" && (
        <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: "#16a34a" }}>
            <Check size={16} /> Sent for Review
          </p>
          {result?.message && (
            <p className="text-xs" style={{ color: BRAND.textSecondary }}>{result.message}</p>
          )}
          <button
            onClick={() => setStatus("idle")}
            className="text-xs font-semibold underline mt-2"
            style={{ color: BRAND.navy }}
          >
            Send again
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: "#dc2626" }}>
            <AlertTriangle size={16} /> Review Error
          </p>
          <p className="text-xs" style={{ color: "#991b1b" }}>{error}</p>
          <button
            onClick={sendForReview}
            className="text-xs font-semibold underline mt-2"
            style={{ color: BRAND.red }}
          >
            Retry
          </button>
        </div>
      )}
    </SectionCard>
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
    // 0. Press Release
    prHook: "", prStatusQuo: "", prInnovation: "", prBeforeAfter: "", prValueProp: "",
    // 1. The Problem
    problemSituation: "", problemVictim: "", problemFailureMode: "", problemConsequence: "", problemCurrentSolutions: "",
    // 2. Who Pays
    buyerPersonas: "", currentSpend: "", switchLogic: "", realExample: "", behaviorTest: "",
    // 3. Why JW Player
    marketExpectation: "", capabilityAlignment: "", structuralFit: "", credibilityTest: "", stretchRisk: "",
    // 4. Money Movement
    moneyToday: "", moneyOwners: "", takeMechanism: "", moneyPath: "",
    // 5. Boundaries
    whatWeAre: "", whatWeAreNot: "", competitiveBoundaries: "", strategicConstraints: "",
    // 6. Open Questions
    missingProof: "", assumptions: "", risks: "", unknowns: "",
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
    marketAnalysis: null,
    cac: "", ltv: "", ltvCacRatio: "", paybackPeriod: "",
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
