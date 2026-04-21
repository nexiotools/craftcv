import { useState, useEffect, useRef } from "react";

const CHECKOUT_URL_STARTER  = "https://nexiotools.lemonsqueezy.com/checkout/buy/2fa49e1f-d8e3-4eee-b7d8-ba994422dcbe";
const CHECKOUT_URL_PRO      = "https://nexiotools.lemonsqueezy.com/checkout/buy/0620b4a5-4b67-4f7e-9282-9207e8297bb4";
const CHECKOUT_URL_LIFETIME = "https://nexiotools.lemonsqueezy.com/checkout/buy/f64fcf1b-191f-43cd-a11a-8e31a437a527";
const FREE_LIMIT = 2;
const STORAGE_KEY = "craftcv_uses";
const API_TIMEOUT_MS = 40000;

const SAMPLE_JD = `Senior Product Manager – FinTech SaaS

We're looking for a strategic PM to own our core payments product. You'll work closely with engineering, design and commercial teams to define roadmap, ship features, and drive adoption.

Requirements:
- 5+ years PM experience in B2B SaaS or FinTech
- Strong data-driven mindset, comfortable with SQL and analytics tools
- Proven track record of launching 0→1 products
- Excellent stakeholder management and communication skills
- Experience with agile/scrum methodologies`;

const SAMPLE_CV = `Jane Doe | jane@email.com | LinkedIn: janedoe

EXPERIENCE

Product Manager – Monzo Bank (2021–present)
- Led payments feature squad of 8, shipped instant IBAN transfers used by 2M users
- Increased payment success rate from 94% to 99.1% through funnel analysis and iteration
- Managed roadmap across 3 squads, aligned with C-suite on quarterly OKRs

Product Analyst – Booking.com (2019–2021)
- Built dashboards in SQL/Tableau tracking key booking metrics
- Ran 40+ A/B tests, contributed to 12% conversion uplift

EDUCATION
BSc Computer Science, University of Amsterdam, 2019

SKILLS: SQL, Jira, Figma, Mixpanel, Agile`;

// ─── Extract text from PDF using Claude vision ────────────────────────────────
async function extractFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result.split(",")[1];
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-opus-4-7",
            max_tokens: 2000,
            system: "You extract text from PDF documents. Return only the raw extracted text, preserving structure and formatting. No commentary.",
            messages: [{
              role: "user",
              content: [
                { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
                { type: "text", text: "Extract all text from this document. Return only the raw text." }
              ]
            }]
          })
        });
        const data = await response.json();
        const text = data.content?.find(b => b.type === "text")?.text || "";
        if (text.trim()) resolve(text.trim());
        else reject(new Error("Could not extract text from PDF."));
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

// ─── Extract text from plain text / docx (read as text) ──────────────────────
async function extractFromText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      if (text && text.trim().length > 20) resolve(text.trim());
      else reject(new Error("File appears to be empty or unreadable. Please paste your text manually."));
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return extractFromPDF(file);
  if (name.endsWith(".txt")) return extractFromText(file);
  // For .doc/.docx -- try as text, likely won't work but gives a useful error
  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    throw new Error("Word documents (.docx) are not supported yet. Please copy and paste your text, or save as PDF and upload that.");
  }
  return extractFromText(file);
}

// ─── UPLOAD BUTTON COMPONENT ─────────────────────────────────────────────────
function UploadBtn({ label, onExtract, uploading, setUploading, setError }) {
  const ref = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setError("");
    try {
      const text = await extractTextFromFile(file);
      onExtract(text);
    } catch (err) {
      setError(err.message || "Could not read file. Please paste your text manually.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input ref={ref} type="file" accept=".pdf,.txt" onChange={handleFile} style={{ display: "none" }} />
      <button
        onClick={() => ref.current?.click()}
        disabled={uploading}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "#f0ede8", border: "1px solid #e8e4de",
          color: "#666", fontSize: 11, fontWeight: 500,
          padding: "4px 10px", borderRadius: 12, cursor: uploading ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif", opacity: uploading ? 0.6 : 1,
          transition: "all 0.2s"
        }}
      >
        📎 {uploading ? "Reading..." : label}
      </button>
    </>
  );
}

// ─── PAYWALL MODAL ────────────────────────────────────────────────────────────
function PaywallModal({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(245,243,240,0.92)", backdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, animation: "fadeIn 0.2s ease both"
    }}>
      <div style={{
        background: "#fff", border: "1px solid #e8e4de",
        borderRadius: 20, padding: "40px 36px", maxWidth: 440, width: "100%",
        position: "relative", animation: "slideUp 0.3s ease both",
        boxShadow: "0 24px 80px rgba(0,0,0,0.12)"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, background: "transparent",
          border: "none", color: "#bbb", cursor: "pointer", fontSize: 18,
          padding: "4px 8px", borderRadius: 6
        }}>✕</button>

        <div style={{
          width: 48, height: 48, borderRadius: 12, background: "#0f0f0f",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20, fontSize: 20
        }}>🎯</div>

        <h2 style={{
          fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800,
          color: "#0f0f0f", marginBottom: 8, lineHeight: 1.2
        }}>You've used your 2 free analyses</h2>

        <p style={{ color: "#888", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          One-time payment. No subscription. No surprises.
        </p>

        <div style={{ marginBottom: 24 }}>
          {[
            "Unlimited CV + JD analyses",
            "Tailored cover letters every time",
            "Keyword gap detection",
            "Upload PDF or paste text",
            "One-time payment — no recurring charges",
          ].map((f, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "center", padding: "8px 0",
              borderBottom: i < 4 ? "1px solid #f0ede8" : "none"
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: 6, background: "#0f0f0f", color: "#fff",
                fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontWeight: 700
              }}>✓</span>
              <span style={{ color: "#444", fontSize: 14 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Starter */}
        <a href={CHECKOUT_URL_STARTER} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "transparent", border: "1px solid #e8e4de",
          borderRadius: 10, padding: "12px 16px", marginBottom: 8, textDecoration: "none"
        }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#444" }}>Starter — 3 Months</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>One-time payment</div>
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#444" }}>€15</div>
        </a>

        {/* Pro */}
        <a href={CHECKOUT_URL_PRO} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#0f0f0f", borderRadius: 10, padding: "14px 16px", marginBottom: 8,
          textDecoration: "none", position: "relative",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)"
        }}>
          <div style={{
            position: "absolute", top: -10, left: 16,
            background: "#fff", color: "#0f0f0f", border: "1px solid #e8e4de",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            padding: "2px 8px", borderRadius: 4, textTransform: "uppercase"
          }}>Most popular</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: "#fff" }}>Pro — 1 Year</div>
            <div style={{ fontSize: 11, color: "#888" }}>One-time payment · €3.25/month</div>
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff" }}>€39</div>
        </a>

        {/* Lifetime */}
        <a href={CHECKOUT_URL_LIFETIME} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "transparent", border: "1px solid #0f0f0f",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16, textDecoration: "none"
        }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#0f0f0f" }}>Lifetime Access</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>Pay once, use forever</div>
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#0f0f0f" }}>€79</div>
        </a>

        <p style={{ textAlign: "center", color: "#bbb", fontSize: 11 }}>
          Secure checkout · Lemon Squeezy · VAT included
        </p>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [jd, setJd] = useState("");
  const [cv, setCv] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingJd, setUploadingJd] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("score");
  const [copied, setCopied] = useState("");
  const [usesCount, setUsesCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [step, setStep] = useState(1);
  const abortRef = useRef(null);

  useEffect(() => {
    try {
      const stored = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      setUsesCount(stored);
    } catch { setUsesCount(0); }
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  const isLocked = usesCount >= FREE_LIMIT;
  const remainingFree = Math.max(0, FREE_LIMIT - usesCount);

  const openPaywall = () => { setResult(null); setShowPaywall(true); };

  const incrementUses = () => {
    const next = usesCount + 1;
    setUsesCount(next);
    try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
  };

  const handleAnalyze = async () => {
    if (!jd.trim() || !cv.trim()) { setError("Please fill in both fields."); return; }
    if (isLocked) { openPaywall(); return; }

    setError("");
    setLoading(true);
    setResult(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-opus-4-7",
          max_tokens: 1500,
          system: `You are an elite career coach and hiring expert with 20 years of experience reviewing CVs and cover letters. You give sharp, honest, actionable feedback. Detect the language of the inputs and respond in that same language throughout. Respond ONLY with valid JSON — no markdown, no backticks, no preamble.`,
          messages: [{
            role: "user",
            content: `Analyze this CV against the job description. Respond ONLY with this exact JSON object and nothing else:

{
  "match_score": <integer 0-100>,
  "match_verdict": "<one punchy sentence about overall fit>",
  "strengths": ["<2-4 specific strengths that match the JD>"],
  "gaps": ["<2-4 specific gaps or missing keywords from the JD>"],
  "cv_improvements": ["<3-5 concrete, specific CV improvements — be direct>"],
  "cover_letter": "<a sharp, tailored cover letter (4 paragraphs). First paragraph: hook with a specific achievement. Second: align experience to JD requirements. Third: show cultural/strategic fit. Fourth: confident close. Plain text, no markdown.>"
}

JOB DESCRIPTION:
${jd}

CV:
${cv}`
          }]
        })
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();

      // Find JSON in response even if there's surrounding text
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse response. Please try again.");

      let parsed;
      try { parsed = JSON.parse(jsonMatch[0]); }
      catch { throw new Error("Could not parse response. Please try again."); }

      if (parsed.match_score === undefined || !parsed.match_verdict) {
        throw new Error("Incomplete response. Please try again.");
      }

      setResult(parsed);
      setActiveTab("score");
      incrementUses();

    } catch (e) {
      clearTimeout(timeout);
      if (e.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(e.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const reset = () => { setJd(""); setCv(""); setResult(null); setError(""); setStep(1); };

  const scoreColor = (s) => { if (s >= 75) return "#22c55e"; if (s >= 50) return "#f59e0b"; return "#ef4444"; };
  const scoreLabel = (s) => { if (s >= 75) return "Strong match"; if (s >= 50) return "Partial match"; return "Weak match"; };

  const tabs = [
    { key: "score", label: "Match Score" },
    { key: "improve", label: "Improvements" },
    { key: "letter", label: "Cover Letter" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3f0", fontFamily: "'DM Sans', sans-serif", color: "#0f0f0f" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
        .container { max-width: 800px; margin: 0 auto; padding: 0 24px 80px; }
        .header { padding: 52px 0 36px; animation: fadeUp 0.5s ease both; }
        .header-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
        .logo-mark { display: inline-flex; align-items: center; gap: 8px; background: #0f0f0f; color: #fff; font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 14px; border-radius: 6px; }
        .free-badge { font-size: 11px; font-weight: 500; color: #888; background: #fff; border: 1px solid #e8e4de; padding: 5px 12px; border-radius: 20px; font-family: 'DM Sans', sans-serif; }
        .free-badge.warn { color: #f59e0b; border-color: #fde68a; background: #fffbeb; }
        .access-btn { font-size: 11px; font-weight: 600; color: #fff; background: #0f0f0f; border: none; padding: 5px 12px; border-radius: 20px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        h1 { font-family: 'Syne', sans-serif; font-size: clamp(30px, 5vw, 46px); font-weight: 800; line-height: 1.05; color: #0f0f0f; margin-bottom: 12px; letter-spacing: -0.03em; }
        h1 em { font-style: normal; color: #888; }
        .subtitle { color: #888; font-size: 15px; font-weight: 300; line-height: 1.6; max-width: 460px; }
        .step-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; font-family: 'Syne', sans-serif; transition: all 0.2s; flex-shrink: 0; }
        .step-dot.active { background: #0f0f0f; color: #fff; }
        .step-dot.done { background: #22c55e; color: #fff; }
        .step-dot.inactive { background: #e8e4de; color: #aaa; }
        .step-line { flex: 1; height: 1px; background: #e8e4de; }
        .card { background: #fff; border: 1px solid #e8e4de; border-radius: 16px; padding: 28px; animation: fadeUp 0.5s ease both; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
        .card-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #aaa; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; }
        .card-label-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        textarea { width: 100%; background: #f9f7f5; border: 1px solid #e8e4de; border-radius: 10px; color: #0f0f0f; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 300; line-height: 1.7; padding: 16px; resize: vertical; outline: none; transition: border-color 0.2s; min-height: 160px; max-height: 360px; }
        textarea:focus { border-color: #0f0f0f; background: #fff; }
        textarea::placeholder { color: #bbb; }
        .btn-row { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
        .btn-primary { flex: 1; min-width: 140px; background: #0f0f0f; color: #fff; border: none; border-radius: 10px; padding: 14px 24px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-primary:hover:not(:disabled) { background: #222; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-primary.locked { background: #fff; color: #0f0f0f; border: 2px solid #0f0f0f; }
        .btn-primary.locked:hover:not(:disabled) { background: #f5f3f0; transform: translateY(-1px); }
        .btn-secondary { background: transparent; border: 1px solid #e8e4de; color: #888; border-radius: 10px; padding: 14px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-secondary:hover { border-color: #0f0f0f; color: #0f0f0f; }
        .btn-next { background: #0f0f0f; color: #fff; border: none; border-radius: 10px; padding: 14px 24px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; cursor: pointer; transition: all 0.2s; }
        .btn-next:hover { background: #222; transform: translateY(-1px); }
        .btn-back { background: transparent; border: 1px solid #e8e4de; color: #888; border-radius: 10px; padding: 14px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .btn-back:hover { border-color: #aaa; color: #444; }
        .error { margin-top: 12px; background: #fff5f5; border: 1px solid #fca5a5; color: #ef4444; border-radius: 8px; padding: 10px 14px; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; }
        .error-retry { background: transparent; border: 1px solid #fca5a5; color: #ef4444; border-radius: 6px; padding: 4px 10px; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; white-space: nowrap; margin-left: auto; flex-shrink: 0; }
        .loading-state { text-align: center; padding: 60px 0; animation: fadeUp 0.4s ease both; }
        .spinner { width: 36px; height: 36px; border: 2px solid #e8e4de; border-top-color: #0f0f0f; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 20px; }
        .loading-text { color: #aaa; font-size: 14px; font-weight: 300; }
        .loading-cancel { margin-top: 16px; background: transparent; border: 1px solid #e8e4de; color: #aaa; border-radius: 8px; padding: 8px 16px; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; }
        .result-section { animation: fadeUp 0.5s ease both; }
        .score-block { display: flex; align-items: center; gap: 24px; padding: 24px; background: #f9f7f5; border-radius: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .score-ring { width: 80px; height: 80px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 3px solid; flex-shrink: 0; }
        .score-number { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; line-height: 1; }
        .score-pct { font-size: 10px; color: #aaa; }
        .score-verdict { font-size: 15px; font-weight: 500; color: #0f0f0f; line-height: 1.5; }
        .score-label { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }
        .tabs { display: flex; gap: 2px; background: #f0ede8; border-radius: 10px; padding: 3px; margin-bottom: 20px; }
        .tab { flex: 1; padding: 9px 14px; background: transparent; border: none; border-radius: 8px; color: #aaa; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .tab.active { background: #fff; color: #0f0f0f; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .tab:hover:not(.active) { color: #666; }
        .section-heading { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #aaa; margin-bottom: 12px; margin-top: 20px; }
        .section-heading:first-child { margin-top: 0; }
        .pill-list { display: flex; flex-direction: column; gap: 8px; }
        .pill { display: flex; align-items: flex-start; gap: 10px; background: #f9f7f5; border-radius: 10px; padding: 12px 14px; font-size: 14px; font-weight: 300; color: #333; line-height: 1.5; }
        .pill-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
        .letter-body { color: #444; font-size: 14px; font-weight: 300; line-height: 1.85; white-space: pre-wrap; background: #f9f7f5; border-radius: 10px; padding: 20px; }
        .copy-btn { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #e8e4de; color: #aaa; border-radius: 6px; padding: 7px 12px; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.2s; margin-top: 12px; float: right; }
        .copy-btn:hover { border-color: #0f0f0f; color: #0f0f0f; }
        .copy-btn.copied { border-color: #22c55e; color: #22c55e; }
        .upgrade-banner { margin-top: 20px; background: #0f0f0f; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .upgrade-banner-text { color: #888; font-size: 13px; font-weight: 300; }
        .upgrade-banner-text strong { color: #fff; font-weight: 600; }
        .upgrade-banner-btn { background: #fff; color: #0f0f0f; border: none; border-radius: 8px; padding: 9px 18px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; cursor: pointer; white-space: nowrap; }
        .upgrade-banner-btn:hover { background: #f0ede8; }
        .try-again-btn { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #e8e4de; color: #aaa; border-radius: 8px; padding: 10px 16px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; margin-top: 20px; }
        .try-again-btn:hover { color: #444; border-color: #aaa; }
        .privacy-note { margin-top: 12px; padding: 10px 14px; background: #f9f7f5; border: 1px solid #e8e4de; border-radius: 8px; font-size: 11px; color: #bbb; line-height: 1.6; }
        .upload-hint { font-size: 11px; color: #bbb; margin-top: 6px; }
        .footer { text-align: center; padding-top: 40px; color: #ccc; font-size: 12px; font-weight: 300; }
        .footer a { color: #aaa; text-decoration: none; }
        .footer a:hover { color: #0f0f0f; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) { .btn-row { flex-direction: column; } .btn-primary, .btn-secondary { width: 100%; } }
      `}</style>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <div className="container">
        <div className="header">
          <div className="header-row">
            <div className="logo-mark">✦ CraftCV</div>
            {usesCount < FREE_LIMIT ? (
              <span className={`free-badge${remainingFree === 1 ? " warn" : ""}`}>
                {remainingFree === 1 ? "⚠ " : ""}{remainingFree} free {remainingFree === 1 ? "analysis" : "analyses"} left
              </span>
            ) : (
              <button className="access-btn" onClick={openPaywall}>🎯 Get Access from €15</button>
            )}
          </div>
          <h1>Land more interviews.<br /><em>Faster.</em></h1>
          <p className="subtitle">Paste or upload your job description and CV. Get a match score, actionable improvements, and a tailored cover letter — in seconds.</p>
        </div>

        {!result && !loading && (
          <>
            {/* Step indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, animation: "fadeUp 0.4s ease both" }}>
              <div className={`step-dot ${step >= 1 ? (step > 1 ? "done" : "active") : "inactive"}`}>{step > 1 ? "✓" : "1"}</div>
              <div className="step-line" />
              <div className={`step-dot ${step >= 2 ? "active" : "inactive"}`}>2</div>
              <div style={{ fontSize: 12, color: "#aaa", marginLeft: 8, fontWeight: 400 }}>
                {step === 1 ? "Job description" : "Your CV"}
              </div>
            </div>

            {step === 1 && (
              <div className="card" key="step1">
                <div className="card-label">
                  <span>Step 1 — Job description</span>
                  <div className="card-label-actions">
                    {jd.length > 0 && <span style={{ color: "#bbb", fontWeight: 400 }}>{jd.length} chars</span>}
                    <UploadBtn
                      label="Upload PDF"
                      onExtract={setJd}
                      uploading={uploadingJd}
                      setUploading={setUploadingJd}
                      setError={setError}
                    />
                  </div>
                </div>
                {uploadingJd && (
                  <div style={{ marginBottom: 10, padding: "10px 14px", background: "#f9f7f5", border: "1px solid #e8e4de", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 14, height: 14, border: "2px solid #e8e4de", borderTopColor: "#0f0f0f", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                    <span style={{ color: "#888", fontSize: 13 }}>Reading job description...</span>
                  </div>
                )}
                <textarea
                  value={jd}
                  onChange={e => setJd(e.target.value)}
                  placeholder="Paste the job description here, or upload a PDF using the button above..."
                />
                <p className="upload-hint">Supported: paste text, or upload a .pdf or .txt file</p>
                <div className="btn-row">
                  <button className="btn-next" onClick={() => { if (jd.trim().length > 20) { setStep(2); setError(""); } else setError("Please add a job description first."); }}>
                    Next: Add your CV →
                  </button>
                  <button className="btn-secondary" onClick={() => { setJd(SAMPLE_JD); setError(""); }}>
                    Use sample JD
                  </button>
                </div>
                {error && <div className="error"><span>{error}</span></div>}
              </div>
            )}

            {step === 2 && (
              <div className="card" key="step2">
                <div className="card-label">
                  <span>Step 2 — Your CV</span>
                  <div className="card-label-actions">
                    {cv.length > 0 && <span style={{ color: "#bbb", fontWeight: 400 }}>{cv.length} chars</span>}
                    <UploadBtn
                      label="Upload CV (PDF)"
                      onExtract={setCv}
                      uploading={uploadingCv}
                      setUploading={setUploadingCv}
                      setError={setError}
                    />
                  </div>
                </div>
                {uploadingCv && (
                  <div style={{ marginBottom: 10, padding: "10px 14px", background: "#f9f7f5", border: "1px solid #e8e4de", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 14, height: 14, border: "2px solid #e8e4de", borderTopColor: "#0f0f0f", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                    <span style={{ color: "#888", fontSize: 13 }}>Reading your CV...</span>
                  </div>
                )}
                <textarea
                  value={cv}
                  onChange={e => setCv(e.target.value)}
                  placeholder="Paste your CV here, or upload a PDF using the button above..."
                  autoFocus
                />
                <p className="upload-hint">Supported: paste text, or upload a .pdf or .txt file</p>
                <div className="btn-row">
                  <button
                    className={`btn-primary${isLocked ? " locked" : ""}`}
                    onClick={isLocked ? openPaywall : handleAnalyze}
                    disabled={!cv.trim() && !isLocked}
                  >
                    {isLocked ? "🔒 Unlock to Analyse" : "Analyse my CV →"}
                  </button>
                  <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn-secondary" onClick={() => { setCv(SAMPLE_CV); setError(""); }}>
                    Use sample CV
                  </button>
                </div>
                {error && (
                  <div className="error">
                    <span>{error}</span>
                    <button className="error-retry" onClick={handleAnalyze}>Try again</button>
                  </div>
                )}
                <div className="privacy-note">
                  🔒 Your CV and job description are sent securely and are not stored or used for training.
                </div>
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p className="loading-text">Analysing your CV against the role...</p>
            <button className="loading-cancel" onClick={() => { if (abortRef.current) abortRef.current.abort(); setLoading(false); }}>
              Cancel
            </button>
          </div>
        )}

        {result && !loading && (
          <div className="result-section">
            <div className="card">
              <div className="score-block">
                <div className="score-ring" style={{ borderColor: scoreColor(result.match_score), color: scoreColor(result.match_score) }}>
                  <span className="score-number">{result.match_score}</span>
                  <span className="score-pct">/ 100</span>
                </div>
                <div>
                  <div className="score-label" style={{ color: scoreColor(result.match_score) }}>{scoreLabel(result.match_score)}</div>
                  <p className="score-verdict">{result.match_verdict}</p>
                </div>
              </div>

              <div className="tabs">
                {tabs.map(t => (
                  <button key={t.key} className={`tab${activeTab === t.key ? " active" : ""}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
                ))}
              </div>

              {activeTab === "score" && (
                <div>
                  {result.strengths?.length > 0 && (<>
                    <p className="section-heading">What's working</p>
                    <div className="pill-list">{result.strengths.map((s, i) => <div key={i} className="pill"><span className="pill-icon">✓</span>{s}</div>)}</div>
                  </>)}
                  {result.gaps?.length > 0 && (<>
                    <p className="section-heading">Gaps to address</p>
                    <div className="pill-list">{result.gaps.map((g, i) => <div key={i} className="pill"><span className="pill-icon">△</span>{g}</div>)}</div>
                  </>)}
                </div>
              )}

              {activeTab === "improve" && (
                <div>
                  <p className="section-heading">CV improvements</p>
                  <div className="pill-list">
                    {result.cv_improvements?.map((imp, i) => (
                      <div key={i} className="pill">
                        <span className="pill-icon" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#0f0f0f", fontSize: 12 }}>{i + 1}</span>
                        {imp}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "letter" && (
                <div>
                  <div className="letter-body">{result.cover_letter}</div>
                  <button className={`copy-btn${copied === "letter" ? " copied" : ""}`} onClick={() => copyToClipboard(result.cover_letter, "letter")}>
                    {copied === "letter" ? "✓ Copied" : "Copy letter"}
                  </button>
                </div>
              )}
            </div>

            {usesCount >= FREE_LIMIT && (
              <div className="upgrade-banner">
                <p className="upgrade-banner-text">
                  <strong>That was your last free analysis.</strong> Get full access from €15 — one-time payment.
                </p>
                <button className="upgrade-banner-btn" onClick={openPaywall}>Get access →</button>
              </div>
            )}

            <button className="try-again-btn" onClick={reset}>← Analyse another role</button>
          </div>
        )}

        <div className="footer">
          <p>CraftCV by <a href="https://nexio.tools" target="_blank" rel="noopener noreferrer">Nexio</a> &mdash; Land the role you deserve</p>
        </div>
      </div>
    </div>
  );
}
