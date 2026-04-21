import { useState, useEffect, useRef } from "react";

const CHECKOUT_URL_STARTER  = "https://nexiotools.lemonsqueezy.com/checkout/buy/9bdbb630-0778-4cc8-8c5f-0fd9810fb54f";
const CHECKOUT_URL_PRO      = "https://nexiotools.lemonsqueezy.com/checkout/buy/cec06506-b65e-400c-a745-1175e1f7ee12";
const CHECKOUT_URL_LIFETIME = "https://nexiotools.lemonsqueezy.com/checkout/buy/ebdc7bf6-06d4-4eb8-a901-5bc8b66aa1d0";
const FREE_LIMIT = 2;
const STORAGE_KEY = "brieflyai_uses";
const API_TIMEOUT_MS = 30000;

const SAMPLE_NOTES = [
  `Quarterly sales review - April 2026

Attendees: Lisa (Sales Manager), Tom (Account Exec), Mira (Marketing)

Pipeline is at €420k, down from €510k last quarter. Tom lost the Retail Corp deal due to pricing -- competitor came in 15% cheaper. Lisa wants a pricing review before end of month. Mira confirmed LinkedIn campaign starts next week, budget €3k.

Agreed: Tom to follow up on 3 warm leads by Friday. Lisa to propose revised pricing tiers by April 25. Mira to share campaign brief with team before launch.

Next QBR scheduled for July.`,

  `Team onboarding sync - April 2026

Attendees: Yara (HR), Daan (IT), Sophie (Office Manager)

Two new starters joining May 1st: Farrukh (Dev) and Elena (Marketing). IT needs laptop orders placed by April 22 -- Daan to handle. Office badges need activating 2 days before start. Sophie will arrange desk setup and welcome pack.

Buddy system discussed -- Yara to assign buddies by April 24. Onboarding schedule still being finalised, Yara sends draft to Sophie by April 23.

Open question: remote work policy for first 3 months still unclear, HR director to confirm.`,

  `Weekly management update - April 2026

Attendees: Marc (CEO), Jess (CFO), Robin (COO)

Q1 revenue came in at €1.2M, slightly below target of €1.3M. CFO flagged cash position is healthy. Two cost-saving measures approved: freeze on external consultants, and office lease renegotiation starting next month.

COO raised operational bottleneck in logistics -- third-party courier delays affecting customer satisfaction. Decision: evaluate alternative couriers by May 15.

CEO wants monthly all-hands reinstated starting May. Jess to send calendar invite to full team.`
];

function PaywallModal({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, animation: "fadeIn 0.2s ease both"
    }}>
      <div style={{
        background: "#13131a", border: "1px solid rgba(255,200,80,0.2)",
        borderRadius: 20, padding: "40px 36px", maxWidth: 440, width: "100%",
        position: "relative", animation: "slideUp 0.3s ease both",
        boxShadow: "0 0 80px rgba(255,200,80,0.06), 0 24px 60px rgba(0,0,0,0.6)"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, background: "transparent",
          border: "none", color: "#4a4a50", cursor: "pointer", fontSize: 18,
          padding: "4px 8px", borderRadius: 6
        }}>✕</button>

        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "rgba(255,200,80,0.1)", border: "1px solid rgba(255,200,80,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20, fontSize: 22
        }}>⚡</div>

        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700,
          color: "#f0ece2", marginBottom: 10, lineHeight: 1.2
        }}>You've used your 2 free debriefs</h2>

        <p style={{ color: "#7a7570", fontSize: 14, fontWeight: 300, lineHeight: 1.7, marginBottom: 24 }}>
          One-time payment. No subscription. No surprises.
        </p>

        <div style={{ marginBottom: 24 }}>
          {[
            "Unlimited meeting debriefs",
            "Action items with owner + deadline",
            "Ready-to-send follow-up emails",
            "Works in any language",
            "Works for any type of meeting",
            "One-time payment — no recurring charges",
          ].map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
              borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none"
            }}>
              <span style={{ color: "#ffc850", fontSize: 13 }}>✓</span>
              <span style={{ color: "#c8c4bc", fontSize: 14, fontWeight: 300 }}>{f}</span>
            </div>
          ))}
        </div>

        <a href={CHECKOUT_URL_STARTER} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "transparent", color: "#c8c4bc",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 8,
          textDecoration: "none"
        }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500 }}>Starter — 3 Months</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 300, color: "#5a5650" }}>One-time payment</div>
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#c8c4bc" }}>€15</div>
        </a>

        <a href={CHECKOUT_URL_PRO} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#ffc850", color: "#0c0c0e",
          borderRadius: 10, padding: "14px 16px", marginBottom: 8,
          textDecoration: "none",
          boxShadow: "0 4px 20px rgba(255,200,80,0.25)",
          position: "relative"
        }}>
          <div style={{
            position: "absolute", top: -10, left: 16,
            background: "#0c0c0e", color: "#ffc850",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            padding: "2px 8px", borderRadius: 4, textTransform: "uppercase"
          }}>Most popular</div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700 }}>Pro — 1 Year</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 400, opacity: 0.65 }}>One-time payment · €3.25/month</div>
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>€39</div>
        </a>

        <a href={CHECKOUT_URL_LIFETIME} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "transparent", color: "#f0ece2",
          border: "1px solid rgba(255,200,80,0.25)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
          textDecoration: "none"
        }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>Lifetime Access</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 300, color: "#7a7570" }}>Pay once, use forever</div>
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#ffc850" }}>€79</div>
        </a>

        <p style={{ textAlign: "center", color: "#3a3a40", fontSize: 11 }}>
          Secure checkout · Lemon Squeezy · VAT included
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const [copied, setCopied] = useState("");
  const [usesCount, setUsesCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const abortRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const stored = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      setUsesCount(stored);
    } catch { setUsesCount(0); }
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  const incrementUses = () => {
    const next = usesCount + 1;
    setUsesCount(next);
    try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
    return next;
  };

  const isLocked = usesCount >= FREE_LIMIT;
  const remainingFree = Math.max(0, FREE_LIMIT - usesCount);

  const openPaywall = () => {
    setResult(null);
    setShowPaywall(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }

    // Show preview
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setImagePreview(base64);
      setExtracting(true);
      setError("");

      try {
        const base64Data = base64.split(",")[1];
        const mediaType = file.type;

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-opus-4-7",
            max_tokens: 1000,
            system: "You extract text from images of handwritten or printed meeting notes. Return only the extracted text, exactly as written, with no commentary or formatting. Preserve line breaks and structure.",
            messages: [{
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "base64", media_type: mediaType, data: base64Data }
                },
                {
                  type: "text",
                  text: "Extract all text from this image of meeting notes. Return only the raw text, preserving structure and line breaks."
                }
              ]
            }]
          })
        });

        const data = await response.json();
        const extracted = data.content?.find(b => b.type === "text")?.text || "";
        if (extracted.trim()) {
          setNotes(extracted.trim());
        } else {
          setError("Could not extract text from image. Please try a clearer photo or type your notes manually.");
        }
      } catch (e) {
        setError("Image extraction failed. Please try again or type your notes manually.");
      } finally {
        setExtracting(false);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  const handleGenerate = async () => {
    if (!notes.trim() || notes.trim().length < 30) {
      setError("Please paste your meeting notes first (at least 30 characters).");
      return;
    }
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
          max_tokens: 1000,
          system: `You are an expert meeting facilitator and business communication specialist. Transform raw meeting notes into structured, actionable outputs. IMPORTANT: Detect the language of the meeting notes and respond in that same language throughout. Always respond with valid JSON only — no markdown, no backticks, no preamble.`,
          messages: [{
            role: "user",
            content: `Transform these meeting notes into structured outputs. Respond ONLY with a valid JSON object:

{
  "title": "concise meeting title (max 8 words, same language as notes)",
  "summary": "2-3 sentence executive summary (same language as notes)",
  "decisions": ["key decisions made (same language as notes)"],
  "actions": [{ "owner": "person name", "task": "specific task (same language as notes)", "deadline": "deadline or TBD" }],
  "followups": ["topics needing follow-up (same language as notes)"],
  "email": {
    "subject": "email subject line (same language as notes)",
    "body": "professional follow-up email (3-4 paragraphs, plain text, same language as notes)"
  }
}

Meeting notes:
${notes}`
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

      let parsed;
      try { parsed = JSON.parse(clean); }
      catch { throw new Error("Could not parse response. Please try again."); }

      if (!parsed.title || !parsed.summary) {
        throw new Error("Incomplete response. Please try again.");
      }

      setResult(parsed);
      setActiveTab("summary");
      const newCount = incrementUses();
      if (newCount >= FREE_LIMIT) {
        // Next attempt will show paywall
      }

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

  const loadSample = () => {
    setNotes(SAMPLE_NOTES[sampleIndex % SAMPLE_NOTES.length]);
    setSampleIndex(i => i + 1);
    setResult(null);
    setError("");
  };

  const reset = () => { setNotes(""); setResult(null); setError(""); };

  const tabs = [
    { key: "summary", label: "Summary" },
    { key: "actions", label: "Actions" },
    { key: "email", label: "Follow-up Email" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c0e", fontFamily: "'DM Sans', sans-serif", color: "#e8e4dc", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a30; border-radius: 2px; }
        .grain { position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); opacity: 0.4; }
        .glow-orb { position: fixed; border-radius: 50%; filter: blur(120px); pointer-events: none; z-index: 0; }
        .container { max-width: 780px; margin: 0 auto; padding: 0 24px 80px; position: relative; z-index: 1; }
        .header { padding: 56px 0 40px; animation: fadeUp 0.6s ease both; }
        .header-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
        .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,200,80,0.08); border: 1px solid rgba(255,200,80,0.2); color: #ffc850; font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 12px; border-radius: 20px; }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #ffc850; animation: pulse 2s infinite; }
        .usage-pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #7a7570; font-size: 11px; padding: 5px 12px; border-radius: 20px; }
        .usage-pill.warn { background: rgba(255,120,80,0.08); border-color: rgba(255,120,80,0.2); color: #ff9070; }
        .access-btn { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,200,80,0.1); border: 1px solid rgba(255,200,80,0.25); color: #ffc850; font-size: 11px; font-weight: 500; padding: 5px 12px; border-radius: 20px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        h1 { font-family: 'Playfair Display', serif; font-size: clamp(32px, 5vw, 48px); font-weight: 700; line-height: 1.1; color: #f0ece2; margin-bottom: 14px; letter-spacing: -0.02em; }
        h1 span { color: #ffc850; }
        .subtitle { color: #7a7570; font-size: 15px; font-weight: 300; line-height: 1.6; max-width: 480px; }
        .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 28px; backdrop-filter: blur(10px); animation: fadeUp 0.6s ease both; }
        .card-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #5a5650; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
        textarea { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; color: #c8c4bc; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 300; line-height: 1.7; padding: 16px; resize: vertical; outline: none; transition: border-color 0.2s; min-height: 180px; max-height: 400px; }
        textarea:focus { border-color: rgba(255,200,80,0.3); }
        textarea::placeholder { color: #3a3a40; }
        .btn-row { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
        .btn-primary { flex: 1; min-width: 140px; background: #ffc850; color: #0c0c0e; border: none; border-radius: 10px; padding: 14px 24px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-primary:hover:not(:disabled) { background: #ffd060; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-primary.locked { background: rgba(255,200,80,0.12); color: #ffc850; border: 1px solid rgba(255,200,80,0.3); }
        .btn-primary.locked:hover { background: rgba(255,200,80,0.2); transform: translateY(-1px); }
        .btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #7a7570; border-radius: 10px; padding: 14px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-secondary:hover { border-color: rgba(255,255,255,0.2); color: #c8c4bc; }
        .error { margin-top: 12px; background: rgba(255,80,80,0.08); border: 1px solid rgba(255,80,80,0.2); color: #ff8080; border-radius: 8px; padding: 10px 14px; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; }
        .error-retry { background: transparent; border: 1px solid rgba(255,80,80,0.3); color: #ff8080; border-radius: 6px; padding: 4px 10px; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; white-space: nowrap; margin-left: auto; flex-shrink: 0; }
        .loading-state { text-align: center; padding: 56px 0; animation: fadeUp 0.4s ease both; }
        .spinner { width: 40px; height: 40px; border: 2px solid rgba(255,200,80,0.15); border-top-color: #ffc850; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px; }
        .loading-text { color: #5a5650; font-size: 14px; font-weight: 300; }
        .loading-cancel { margin-top: 16px; background: transparent; border: 1px solid rgba(255,255,255,0.08); color: #4a4a50; border-radius: 8px; padding: 8px 16px; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; }
        .result-section { animation: fadeUp 0.5s ease both; }
        .result-title { font-family: 'Playfair Display', serif; font-size: 20px; color: #f0ece2; margin-bottom: 20px; font-weight: 700; }
        .tabs { display: flex; gap: 2px; background: rgba(0,0,0,0.3); border-radius: 10px; padding: 3px; margin-bottom: 20px; }
        .tab { flex: 1; padding: 9px 14px; background: transparent; border: none; border-radius: 8px; color: #5a5650; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .tab.active { background: rgba(255,200,80,0.12); color: #ffc850; }
        .tab:hover:not(.active) { color: #9a9590; }
        .summary-text { color: #c8c4bc; font-size: 15px; font-weight: 300; line-height: 1.75; margin-bottom: 24px; }
        .section-heading { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #5a5650; margin-bottom: 12px; margin-top: 24px; }
        .section-heading:first-child { margin-top: 0; }
        .decision-list { list-style: none; }
        .decision-list li { display: flex; align-items: flex-start; gap: 10px; color: #c8c4bc; font-size: 14px; font-weight: 300; line-height: 1.6; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .decision-list li:last-child { border-bottom: none; }
        .decision-dot { width: 6px; height: 6px; border-radius: 50%; background: #ffc850; margin-top: 7px; flex-shrink: 0; }
        .action-card { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px; margin-bottom: 8px; }
        .action-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px; }
        .action-owner { font-size: 12px; font-weight: 600; letter-spacing: 0.05em; color: #ffc850; text-transform: uppercase; }
        .action-deadline { font-size: 11px; color: #4a4a50; background: rgba(255,255,255,0.04); border-radius: 4px; padding: 2px 8px; }
        .action-task { color: #c8c4bc; font-size: 14px; font-weight: 300; line-height: 1.5; }
        .followup-list { list-style: none; }
        .followup-list li { display: flex; align-items: flex-start; gap: 10px; color: #9a9590; font-size: 14px; font-weight: 300; line-height: 1.6; padding: 7px 0; }
        .followup-arrow { color: #3a3a40; flex-shrink: 0; }
        .email-subject { background: rgba(255,200,80,0.06); border: 1px solid rgba(255,200,80,0.15); border-radius: 8px; padding: 12px 16px; margin-bottom: 14px; }
        .email-subject-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #5a5040; margin-bottom: 4px; }
        .email-subject-text { color: #e8c870; font-size: 14px; font-weight: 500; }
        .email-body { color: #b8b4ac; font-size: 14px; font-weight: 300; line-height: 1.8; white-space: pre-wrap; background: rgba(0,0,0,0.2); border-radius: 8px; padding: 16px; }
        .copy-btn { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #7a7570; border-radius: 6px; padding: 7px 12px; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.2s; margin-top: 12px; float: right; }
        .copy-btn:hover { border-color: rgba(255,200,80,0.3); color: #ffc850; }
        .copy-btn.copied { border-color: rgba(80,200,120,0.3); color: #50c878; }
        .upgrade-banner { margin-top: 20px; background: rgba(255,200,80,0.05); border: 1px solid rgba(255,200,80,0.15); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .upgrade-banner-text { color: #9a9590; font-size: 13px; font-weight: 300; }
        .upgrade-banner-text strong { color: #ffc850; font-weight: 500; }
        .upgrade-banner-btn { background: #ffc850; color: #0c0c0e; border: none; border-radius: 8px; padding: 9px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .upgrade-banner-btn:hover { background: #ffd060; }
        .try-again-btn { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid rgba(255,255,255,0.08); color: #5a5650; border-radius: 8px; padding: 10px 16px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; margin-top: 20px; }
        .try-again-btn:hover { color: #9a9590; border-color: rgba(255,255,255,0.15); }
        .privacy-note { margin-top: 16px; padding: 10px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; font-size: 11px; color: #3a3a40; line-height: 1.6; }
        .footer { text-align: center; padding-top: 40px; color: #3a3a40; font-size: 12px; font-weight: 300; }
        .footer a { color: #5a5650; text-decoration: none; }
        .footer a:hover { color: #9a9590; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 520px) {
          .btn-row { flex-direction: column; }
          .btn-primary, .btn-secondary { width: 100%; min-width: unset; }
          .tabs { gap: 1px; }
          .tab { padding: 8px 8px; font-size: 12px; }
          h1 { font-size: 28px; }
          .card { padding: 20px; }
        }
      `}</style>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <div className="grain" />
      <div className="glow-orb" style={{ width: 500, height: 500, background: "rgba(255,200,80,0.04)", top: -200, right: -100 }} />
      <div className="glow-orb" style={{ width: 400, height: 400, background: "rgba(80,120,255,0.03)", bottom: 0, left: -150 }} />

      <div className="container">
        <div className="header">
          <div className="header-top">
            <div className="badge"><span className="badge-dot" />AI-Powered</div>
            {usesCount < FREE_LIMIT ? (
              <span className={`usage-pill${remainingFree === 1 ? " warn" : ""}`}>
                {remainingFree === 1 ? "⚠ " : ""}{remainingFree} free {remainingFree === 1 ? "debrief" : "debriefs"} left
              </span>
            ) : (
              <button className="access-btn" onClick={openPaywall}>
                ⚡ Get Access from €15
              </button>
            )}
          </div>
          <h1>Turn messy notes into<br /><span>clear action.</span></h1>
          <p className="subtitle">Paste your raw meeting notes. Get a structured summary, action items, and a ready-to-send follow-up email — in seconds. Works in any language.</p>
        </div>

        {!result && !loading && (
          <div className="card" style={{ animationDelay: "0.1s" }}>
            <div className="card-label">
              <span>Your meeting notes</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {notes.length > 0 && <span style={{ color: "#3a3a40", fontWeight: 400 }}>{notes.length} chars</span>}
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
                {/* Camera / upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={extracting}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "rgba(255,200,80,0.08)", border: "1px solid rgba(255,200,80,0.2)",
                    color: "#ffc850", fontSize: 11, fontWeight: 500,
                    padding: "4px 10px", borderRadius: 12, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", opacity: extracting ? 0.5 : 1
                  }}
                >
                  📷 {extracting ? "Reading..." : "Scan notes"}
                </button>
              </div>
            </div>

            {/* Image preview */}
            {imagePreview && !extracting && (
              <div style={{
                marginBottom: 10, borderRadius: 8, overflow: "hidden",
                border: "1px solid rgba(255,200,80,0.2)", position: "relative"
              }}>
                <img src={imagePreview} alt="Uploaded notes" style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }} />
                <button
                  onClick={() => { setImagePreview(null); setNotes(""); }}
                  style={{
                    position: "absolute", top: 6, right: 6,
                    background: "rgba(0,0,0,0.6)", border: "none", color: "#fff",
                    borderRadius: "50%", width: 22, height: 22, cursor: "pointer",
                    fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >✕</button>
              </div>
            )}

            {extracting && (
              <div style={{
                marginBottom: 10, padding: "14px 16px",
                background: "rgba(255,200,80,0.05)", border: "1px solid rgba(255,200,80,0.15)",
                borderRadius: 8, display: "flex", alignItems: "center", gap: 10
              }}>
                <div style={{
                  width: 16, height: 16, border: "2px solid rgba(255,200,80,0.2)",
                  borderTopColor: "#ffc850", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0
                }} />
                <span style={{ color: "#7a7570", fontSize: 13 }}>Reading your handwritten notes...</span>
              </div>
            )}

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Paste your raw notes here — or use 📷 Scan notes to photograph handwritten or printed notes. Works in English, Dutch, or any language."
            />
            <div className="btn-row">
              <button
                className={`btn-primary${isLocked ? " locked" : ""}`}
                onClick={isLocked ? openPaywall : handleGenerate}
                disabled={!notes.trim() && !isLocked}
              >
                {isLocked
                  ? <>🔒 Unlock to Generate</>
                  : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>Generate Debrief</>
                }
              </button>
              <button className="btn-secondary" onClick={loadSample}>Try sample</button>
              {notes && !isLocked && <button className="btn-secondary" onClick={reset}>Clear</button>}
            </div>
            {error && (
              <div className="error">
                <span>{error}</span>
                <button className="error-retry" onClick={handleGenerate}>Try again</button>
              </div>
            )}
            <div className="privacy-note">
              🔒 Your notes are sent securely and are not stored or used for training. Do not paste confidential content.
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p className="loading-text">Analysing your meeting...</p>
            <button className="loading-cancel" onClick={() => { if (abortRef.current) abortRef.current.abort(); setLoading(false); }}>
              Cancel
            </button>
          </div>
        )}

        {result && !loading && (
          <div className="result-section">
            <div className="card">
              <p className="result-title">{result.title}</p>
              <div className="tabs">
                {tabs.map(t => (
                  <button key={t.key} className={`tab${activeTab === t.key ? " active" : ""}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
                ))}
              </div>

              {activeTab === "summary" && (
                <div>
                  <p className="summary-text">{result.summary}</p>
                  {result.decisions?.length > 0 && (<>
                    <p className="section-heading">Decisions made</p>
                    <ul className="decision-list">{result.decisions.map((d, i) => <li key={i}><span className="decision-dot" />{d}</li>)}</ul>
                  </>)}
                  {result.followups?.length > 0 && (<>
                    <p className="section-heading">Needs follow-up</p>
                    <ul className="followup-list">{result.followups.map((f, i) => <li key={i}><span className="followup-arrow">→</span>{f}</li>)}</ul>
                  </>)}
                </div>
              )}

              {activeTab === "actions" && (
                <div>
                  {result.actions?.length > 0 ? result.actions.map((a, i) => (
                    <div key={i} className="action-card">
                      <div className="action-header">
                        <span className="action-owner">{a.owner}</span>
                        <span className="action-deadline">Due: {a.deadline}</span>
                      </div>
                      <p className="action-task">{a.task}</p>
                    </div>
                  )) : <p style={{ color: "#5a5650", fontSize: 14 }}>No specific action items identified.</p>}
                  {result.actions?.length > 0 && (
                    <button className={`copy-btn${copied === "actions" ? " copied" : ""}`} onClick={() => copyToClipboard(result.actions.map(a => `${a.owner}: ${a.task} (Due: ${a.deadline})`).join("\n"), "actions")}>
                      {copied === "actions" ? "✓ Copied" : "Copy all actions"}
                    </button>
                  )}
                </div>
              )}

              {activeTab === "email" && result.email && (
                <div>
                  <div className="email-subject">
                    <div className="email-subject-label">Subject</div>
                    <div className="email-subject-text">{result.email.subject}</div>
                  </div>
                  <div className="email-body">{result.email.body}</div>
                  <button className={`copy-btn${copied === "email" ? " copied" : ""}`} onClick={() => copyToClipboard(`Subject: ${result.email.subject}\n\n${result.email.body}`, "email")}>
                    {copied === "email" ? "✓ Copied" : "Copy email"}
                  </button>
                </div>
              )}
            </div>

            {usesCount >= FREE_LIMIT && (
              <div className="upgrade-banner">
                <p className="upgrade-banner-text">
                  <strong>That was your last free debrief.</strong> Get full access from €15 — one-time payment.
                </p>
                <button className="upgrade-banner-btn" onClick={openPaywall}>
                  Get access →
                </button>
              </div>
            )}

            <button className="try-again-btn" onClick={reset}>← New meeting</button>
          </div>
        )}

        <div className="footer">
          <p>BrieflyAI by <a href="https://nexio.tools" target="_blank" rel="noopener noreferrer">Nexio</a> &mdash; Save 20 minutes per meeting</p>
        </div>
      </div>
    </div>
  );
}
