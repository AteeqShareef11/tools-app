import { useState, useCallback, useRef } from "react";

// ─────────────────────────────────────────────
//  UTILS (unchanged logic)
// ─────────────────────────────────────────────

export async function analyzeResume(resumeText) {
    const res = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
}

export function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
}

export function exportResumeAsText(result) {
    const r = result.optimized_resume;
    const ci = r.contact_info || {};
    const lines = [];
    if (ci.name) lines.push(ci.name.toUpperCase());
    const contactParts = [ci.email, ci.phone, ci.location, ci.linkedin, ci.github].filter(Boolean);
    if (contactParts.length) lines.push(contactParts.join(" | "));
    lines.push("");
    if (r.professional_summary) {
        lines.push("PROFESSIONAL SUMMARY");
        lines.push("─".repeat(40));
        lines.push(r.professional_summary);
        lines.push("");
    }
    if (r.skills?.length) {
        lines.push("SKILLS");
        lines.push("─".repeat(40));
        lines.push(r.skills.join(" • "));
        lines.push("");
    }
    if (r.experience?.length) {
        lines.push("EXPERIENCE");
        lines.push("─".repeat(40));
        r.experience.forEach((e) => {
            lines.push(`${e.role} — ${e.company} (${e.duration})`);
            e.bullets?.forEach((b) => lines.push(`  • ${b}`));
            lines.push("");
        });
    }
    if (r.education?.length) {
        lines.push("EDUCATION");
        lines.push("─".repeat(40));
        r.education.forEach((e) => lines.push(`${e.degree} — ${e.institution} (${e.year})`));
        lines.push("");
    }
    if (r.projects?.length) {
        lines.push("PROJECTS");
        lines.push("─".repeat(40));
        r.projects.forEach((p) => {
            lines.push(`${p.name}`);
            if (p.description) lines.push(`  ${p.description}`);
            if (p.tech?.length) lines.push(`  Tech: ${p.tech.join(", ")}`);
            lines.push("");
        });
    }
    return lines.join("\n");
}

export function scoreColor(score) {
    if (score >= 80) return { fg: "#4ade80", bg: "rgba(74,222,128,0.08)", stroke: "rgba(74,222,128,0.2)" };
    if (score >= 60) return { fg: "#fbbf24", bg: "rgba(251,191,36,0.08)", stroke: "rgba(251,191,36,0.2)" };
    return { fg: "#f87171", bg: "rgba(248,113,113,0.08)", stroke: "rgba(248,113,113,0.2)" };
}

export function scoreLabel(score) {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 55) return "Needs Work";
    return "Poor";
}

// ─────────────────────────────────────────────
//  PDF UTILS (unchanged)
// ─────────────────────────────────────────────

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement("script");
        s.src = src; s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
    });
}

export async function extractTextFromPDF(file) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    const pdfjsLib = window["pdfjs-dist/build/pdf"];
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pages.push(content.items.map((item) => item.str).join(" "));
    }
    return pages.join("\n\n");
}

export async function downloadResumePDF(result) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const r = result.optimized_resume;
    const ci = r.contact_info || {};
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginL = 18, marginR = 18, contentW = pageW - marginL - marginR;
    let y = 0;
    const ACCENT = [194, 105, 42], TEAL = [13, 115, 119], INK = [26, 24, 20], INK_MID = [90, 86, 78], INK_DIM = [155, 150, 144], BORDER = [228, 224, 216];
    function checkPage(n = 8) { if (y + n > pageH - 14) { doc.addPage(); y = 16; } }
    function sectionHeader(title) {
        checkPage(14); y += 5;
        doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK_DIM);
        doc.text(title.toUpperCase(), marginL, y); y += 2;
        doc.setDrawColor(...BORDER); doc.setLineWidth(0.3); doc.line(marginL, y, pageW - marginR, y); y += 5;
    }
    doc.setFillColor(248, 246, 242); doc.rect(0, 0, pageW, 36, "F");
    y = 14;
    if (ci.name) { doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK); doc.text(ci.name, pageW / 2, y, { align: "center" }); y += 7; }
    const cp = [ci.email, ci.phone, ci.location, ci.linkedin, ci.github].filter(Boolean);
    if (cp.length) { doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...INK_MID); doc.text(cp.join("  |  "), pageW / 2, y, { align: "center" }); y += 5; }
    doc.setDrawColor(...ACCENT); doc.setLineWidth(1); doc.line(marginL, y, pageW - marginR, y); y += 8;
    if (r.professional_summary) {
        sectionHeader("Professional Summary");
        doc.setDrawColor(...TEAL); doc.setLineWidth(0.6); doc.line(marginL, y - 1, marginL, y + 12);
        doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...INK_MID);
        const sl = doc.splitTextToSize(r.professional_summary, contentW - 6);
        checkPage(sl.length * 5 + 4); doc.text(sl, marginL + 5, y); y += sl.length * 5 + 3;
    }
    if (r.skills?.length) {
        sectionHeader("Skills");
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...INK_MID);
        let sx = marginL; const pH = 5.5, pPX = 3, pGX = 3, pGY = 2;
        r.skills.forEach(sk => {
            const tw = doc.getTextWidth(sk), pw = tw + pPX * 2;
            if (sx + pw > pageW - marginR) { sx = marginL; y += pH + pGY; checkPage(pH + 4); }
            doc.setFillColor(230, 244, 244); doc.roundedRect(sx, y - 3.5, pw, pH, 1.5, 1.5, "F");
            doc.setDrawColor(...TEAL); doc.setLineWidth(0.2); doc.roundedRect(sx, y - 3.5, pw, pH, 1.5, 1.5, "S");
            doc.setTextColor(...TEAL); doc.text(sk, sx + pPX, y); sx += pw + pGX;
        }); y += pH + 3;
    }
    if (r.experience?.length) {
        sectionHeader("Experience");
        r.experience.forEach(exp => {
            checkPage(14);
            doc.setFillColor(249, 248, 245); doc.rect(marginL, y - 4, contentW, 8, "F");
            doc.setDrawColor(...BORDER); doc.setLineWidth(0.2); doc.rect(marginL, y - 4, contentW, 8, "S");
            doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK); doc.text(exp.role, marginL + 3, y);
            doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...INK_DIM);
            doc.text(`${exp.company}  ·  ${exp.duration}`, pageW - marginR - 3, y, { align: "right" }); y += 6;
            exp.bullets?.forEach(b => {
                const bl = doc.splitTextToSize(b, contentW - 8); checkPage(bl.length * 4.5 + 3);
                doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...INK_MID);
                doc.setFillColor(...ACCENT); doc.circle(marginL + 2, y - 1.2, 0.8, "F");
                doc.text(bl, marginL + 6, y); y += bl.length * 4.5 + 1;
            }); y += 4;
        });
    }
    if (r.education?.length) {
        sectionHeader("Education");
        r.education.forEach(edu => {
            checkPage(9);
            doc.setFillColor(249, 248, 245); doc.roundedRect(marginL, y - 4, contentW, 8, 2, 2, "F");
            doc.setDrawColor(...BORDER); doc.setLineWidth(0.2); doc.roundedRect(marginL, y - 4, contentW, 8, 2, 2, "S");
            doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK); doc.text(edu.degree, marginL + 4, y);
            doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...INK_DIM);
            doc.text(`${edu.institution}  ·  ${edu.year}`, pageW - marginR - 4, y, { align: "right" }); y += 8;
        });
    }
    if (r.projects?.length) {
        sectionHeader("Projects");
        r.projects.forEach(p => {
            checkPage(12); doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK); doc.text(p.name, marginL, y); y += 5;
            if (p.description) { const dl = doc.splitTextToSize(p.description, contentW); checkPage(dl.length * 4.5 + 2); doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...INK_MID); doc.text(dl, marginL, y); y += dl.length * 4.5 + 1; }
            if (p.tech?.length) { doc.setFontSize(8); doc.setTextColor(...TEAL); doc.text("Tech: " + p.tech.join(", "), marginL, y); y += 5; }
            y += 2;
        });
    }
    const filename = ci.name ? `${ci.name.replace(/\s+/g, "_")}_resume.pdf` : "optimized_resume.pdf";
    doc.save(filename);
}

// ─────────────────────────────────────────────
//  DESIGN TOKENS  — dark editorial
// ─────────────────────────────────────────────

const T = {
    bg: "#0f0e0d",
    bgPanel: "#161512",
    bgRaised: "#1d1b18",
    bgHover: "#242118",
    border: "#2a2722",
    borderMid: "#383430",
    borderBright: "#4a4540",
    ink: "#f0ece4",
    inkMid: "#a09890",
    inkDim: "#5a5450",
    amber: "#e8a04a",
    amberDim: "rgba(232,160,74,0.12)",
    amberStroke: "rgba(232,160,74,0.25)",
    teal: "#3ecfcf",
    tealDim: "rgba(62,207,207,0.1)",
    tealStroke: "rgba(62,207,207,0.22)",
    green: "#4ade80",
    greenDim: "rgba(74,222,128,0.08)",
    greenStroke: "rgba(74,222,128,0.18)",
    red: "#f87171",
    redDim: "rgba(248,113,113,0.08)",
    redStroke: "rgba(248,113,113,0.18)",
};

const SAMPLE = `John Doe
john@email.com | (555) 123-4567 | San Francisco, CA | linkedin.com/in/johndoe

SUMMARY
Experienced software engineer who has worked on various web projects and helped teams build applications.

EXPERIENCE
Senior Frontend Developer — Acme Corp (2021–Present)
- Responsible for building React components
- Worked on improving the performance of the dashboard
- Helped with migration from legacy codebase to modern stack

Frontend Developer — StartupXYZ (2019–2021)
- Worked on UI features
- Helped with bug fixes

EDUCATION
B.S. Computer Science — State University (2019)

SKILLS
React, JavaScript, TypeScript, CSS, Node.js, Git, REST APIs

PROJECTS
Portfolio Site — Built a personal website using React and CSS`;

// ─────────────────────────────────────────────
//  ATOMS
// ─────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::placeholder { color: ${T.inkDim} !important; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.borderMid}; border-radius: 2px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
  @keyframes scoreIn { from { stroke-dasharray: 0 999; } }
  .ra-btn-ghost:hover { background: ${T.bgHover} !important; border-color: ${T.borderBright} !important; }
  .ra-tab:hover { color: ${T.inkMid} !important; }
  .ra-skill-pill:hover { background: ${T.tealDim} !important; border-color: ${T.teal} !important; color: ${T.teal} !important; }
  .ra-list-item:hover { border-color: ${T.borderBright} !important; }
`;

function Mono({ children, size = 11, color = T.inkDim, style = {} }) {
    return (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: size, color, letterSpacing: "0.04em", ...style }}>
            {children}
        </span>
    );
}

function Label({ children }) {
    return (
        <Mono size={10} color={T.inkDim} style={{ textTransform: "uppercase", letterSpacing: "0.12em", display: "block", marginBottom: 10 }}>
            {children}
        </Mono>
    );
}

function Divider({ mt = 0, mb = 0 }) {
    return <div style={{ height: 1, background: T.border, margin: `${mt}px 0 ${mb}px` }} />;
}

function StatusDot({ color = T.green }) {
    return (
        <span style={{
            display: "inline-block", width: 6, height: 6, borderRadius: "50%",
            background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0,
        }} />
    );
}

function Pill({ label, variant = "teal" }) {
    const map = {
        teal: { bg: T.tealDim, fg: T.teal, border: T.tealStroke },
        amber: { bg: T.amberDim, fg: T.amber, border: T.amberStroke },
        green: { bg: T.greenDim, fg: T.green, border: T.greenStroke },
        red: { bg: T.redDim, fg: T.red, border: T.redStroke },
    };
    const c = map[variant] || map.teal;
    return (
        <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10, fontWeight: 500,
            padding: "3px 9px", borderRadius: 4,
            background: c.bg, color: c.fg,
            border: `1px solid ${c.border}`,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
        }}>{label}</span>
    );
}

// ─────────────────────────────────────────────
//  SCORE RING
// ─────────────────────────────────────────────

function ScoreRing({ score }) {
    const c = scoreColor(score);
    const R = 42, sw = 6;
    const circ = 2 * Math.PI * R;
    const dash = (score / 100) * circ;
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{
                position: "relative", width: 108, height: 108,
                background: T.bgRaised, borderRadius: "50%",
                border: `1px solid ${T.border}`,
            }}>
                <svg width="108" height="108" viewBox="0 0 108 108" style={{ position: "absolute", inset: 0 }}>
                    <circle cx="54" cy="54" r={R} fill="none" stroke={T.border} strokeWidth={sw} />
                    <circle
                        cx="54" cy="54" r={R} fill="none"
                        stroke={c.fg} strokeWidth={sw}
                        strokeDasharray={`${dash} ${circ}`}
                        strokeLinecap="round"
                        transform="rotate(-90 54 54)"
                        style={{ animation: "scoreIn 1.2s ease forwards", transition: "stroke-dasharray 1s ease" }}
                    />
                </svg>
                <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                }}>
                    <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 28, fontWeight: 600, color: c.fg, lineHeight: 1,
                    }}>{score}</span>
                    <Mono size={9} color={T.inkDim} style={{ marginTop: 2 }}>ATS</Mono>
                </div>
            </div>
            <Pill label={scoreLabel(score)} variant={score >= 80 ? "green" : score >= 60 ? "amber" : "red"} />
        </div>
    );
}

// ─────────────────────────────────────────────
//  SECTION WRAPPER
// ─────────────────────────────────────────────

function Section({ title, count, children }) {
    return (
        <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Label>{title}</Label>
                {count != null && (
                    <Mono size={10} color={T.inkDim} style={{ marginBottom: 10, marginLeft: "auto" }}>
                        {count}
                    </Mono>
                )}
            </div>
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────
//  LIST ITEMS
// ─────────────────────────────────────────────

function ListItems({ items, variant = "amber" }) {
    const map = {
        green: { dot: T.green, bg: T.greenDim, border: T.greenStroke, left: T.green },
        red: { dot: T.red, bg: T.redDim, border: T.redStroke, left: T.red },
        amber: { dot: T.amber, bg: T.amberDim, border: T.amberStroke, left: T.amber },
    };
    const c = map[variant] || map.amber;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((item, i) => (
                <div key={i} className="ra-list-item" style={{
                    display: "flex", gap: 12, alignItems: "flex-start",
                    padding: "10px 14px",
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    borderLeft: `2px solid ${c.left}`,
                    borderRadius: 6,
                    transition: "border-color 0.15s",
                }}>
                    <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        color: c.dot, fontSize: 12, lineHeight: "20px", flexShrink: 0,
                    }}>›</span>
                    <span style={{
                        fontSize: 13, color: T.inkMid, lineHeight: 1.6,
                        fontFamily: "'IBM Plex Sans', sans-serif",
                    }}>{item}</span>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
//  COPY + PDF BUTTONS
// ─────────────────────────────────────────────

function CopyBtn({ text }) {
    const [done, setDone] = useState(false);
    return (
        <button className="ra-btn-ghost" onClick={async () => {
            await copyToClipboard(text);
            setDone(true);
            setTimeout(() => setDone(false), 2000);
        }} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent",
            border: `1px solid ${T.borderMid}`,
            borderRadius: 6, padding: "6px 13px",
            color: done ? T.green : T.inkMid,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11, cursor: "pointer",
            transition: "all 0.18s",
        }}>
            {done ? "✓ copied" : "copy text"}
        </button>
    );
}

function DownloadPDFBtn({ result }) {
    const [status, setStatus] = useState("idle");
    const handle = async () => {
        setStatus("loading");
        try {
            await downloadResumePDF(result);
            setStatus("done");
            setTimeout(() => setStatus("idle"), 2500);
        } catch { setStatus("error"); setTimeout(() => setStatus("idle"), 2500); }
    };
    const map = {
        idle: { bg: T.amber, color: "#0f0e0d", border: T.amber, label: "↓ download pdf" },
        loading: { bg: T.amberDim, color: T.amber, border: T.amberStroke, label: "generating…" },
        done: { bg: T.greenDim, color: T.green, border: T.greenStroke, label: "✓ saved!" },
        error: { bg: T.redDim, color: T.red, border: T.redStroke, label: "error — retry" },
    };
    const s = map[status];
    return (
        <button onClick={handle} disabled={status === "loading"} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 6, padding: "6px 14px",
            color: s.color,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11, fontWeight: 600, cursor: status === "loading" ? "not-allowed" : "pointer",
            transition: "all 0.2s",
        }}>{s.label}</button>
    );
}

// ─────────────────────────────────────────────
//  PDF UPLOAD ZONE
// ─────────────────────────────────────────────

function PDFUploadZone({ onExtracted, onError }) {
    const [drag, setDrag] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [fileName, setFileName] = useState(null);
    const ref = useRef(null);

    const handle = useCallback(async (file) => {
        if (!file || file.type !== "application/pdf") { onError("Please upload a valid PDF file."); return; }
        setParsing(true); setFileName(file.name);
        try {
            const text = await extractTextFromPDF(file);
            if (!text.trim()) throw new Error("No readable text found. Try a text-based PDF.");
            onExtracted(text);
        } catch (e) { onError(e.message || "Failed to read PDF."); setFileName(null); }
        finally { setParsing(false); }
    }, [onExtracted, onError]);

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}
            onClick={() => !parsing && ref.current?.click()}
            style={{
                border: `1px dashed ${drag ? T.amber : T.borderMid}`,
                borderRadius: 8,
                padding: "13px 16px",
                background: drag ? T.amberDim : T.bgRaised,
                cursor: parsing ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 12,
            }}>
            <input ref={ref} type="file" accept="application/pdf"
                onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }}
                style={{ display: "none" }} />
            <div style={{
                width: 34, height: 34, borderRadius: 6, flexShrink: 0,
                background: T.amberDim, border: `1px solid ${T.amberStroke}`,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                {parsing
                    ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${T.borderMid}`, borderTopColor: T.amber, animation: "spin 0.7s linear infinite" }} />
                    : <Mono size={14} color={T.amber}>↑</Mono>
                }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 500, color: T.ink, marginBottom: 2 }}>
                    {parsing ? "reading pdf…" : fileName ? `✓ ${fileName}` : "upload pdf resume"}
                </div>
                <Mono size={10} color={T.inkDim}>
                    {parsing ? "extracting text with pdf.js" : "drag & drop or click · text-based pdfs only"}
                </Mono>
            </div>
            {!parsing && <Pill label="PDF" variant="amber" />}
        </div>
    );
}

// ─────────────────────────────────────────────
//  SPINNER
// ─────────────────────────────────────────────

function Spinner() {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "56px 0" }}>
            <div style={{
                width: 32, height: 32, borderRadius: "50%",
                border: `2px solid ${T.border}`, borderTopColor: T.amber,
                animation: "spin 0.75s linear infinite",
            }} />
            <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: T.ink, fontWeight: 400, marginBottom: 6 }}>
                    analyzing your resume
                </div>
                <Mono size={11} color={T.inkDim} style={{ animation: "shimmer 2s ease-in-out infinite" }}>
                    ats checks · bullet rewrite · scoring
                </Mono>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  OVERVIEW TAB
// ─────────────────────────────────────────────

function OverviewTab({ result }) {
    return (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
            {/* Score row */}
            <div style={{
                display: "flex", gap: 24, alignItems: "flex-start",
                marginBottom: 32, flexWrap: "wrap",
            }}>
                <ScoreRing score={result.ats_score} />
                <div style={{ flex: 1, minWidth: 180 }}>
                    <p style={{
                        fontFamily: "'Fraunces', serif",
                        fontStyle: "italic",
                        fontSize: 14, color: T.inkMid, lineHeight: 1.75,
                        borderLeft: `2px solid ${T.amber}`,
                        paddingLeft: 14, marginBottom: 14,
                    }}>{result.summary}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Pill label={`${result.strengths?.length || 0} strengths`} variant="green" />
                        <Pill label={`${result.weaknesses?.length || 0} to fix`} variant="red" />
                        <Pill label={`${result.improvements_made?.length || 0} improved`} variant="teal" />
                    </div>
                </div>
            </div>

            <Divider mb={24} />

            {result.strengths?.length > 0 && (
                <Section title="Strengths" count={`${result.strengths.length} found`}>
                    <ListItems items={result.strengths} variant="green" />
                </Section>
            )}
            {result.weaknesses?.length > 0 && (
                <Section title="Areas to Improve" count={`${result.weaknesses.length} items`}>
                    <ListItems items={result.weaknesses} variant="red" />
                </Section>
            )}
            {result.improvements_made?.length > 0 && (
                <Section title="Improvements Made" count={`${result.improvements_made.length} changes`}>
                    <ListItems items={result.improvements_made} variant="amber" />
                </Section>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
//  RESUME TAB
// ─────────────────────────────────────────────

function ResumeTab({ result }) {
    const r = result.optimized_resume;
    const ci = r.contact_info || {};
    const exportText = exportResumeAsText(result);

    return (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
            {/* actions bar */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 20, flexWrap: "wrap", gap: 8,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusDot color={T.teal} />
                    <Mono size={11} color={T.inkDim}>ats-optimized · ready to export</Mono>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <CopyBtn text={exportText} />
                    <DownloadPDFBtn result={result} />
                </div>
            </div>

            <Divider mb={20} />

            {/* contact block */}
            {Object.values(ci).some(Boolean) && (
                <div style={{
                    background: T.bgRaised, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: "16px 18px", marginBottom: 22,
                }}>
                    {ci.name && (
                        <div style={{
                            fontFamily: "'Fraunces', serif",
                            fontSize: 22, fontWeight: 600, color: T.ink,
                            marginBottom: 8, letterSpacing: "-0.02em",
                        }}>{ci.name}</div>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
                        {[ci.email, ci.phone, ci.location, ci.linkedin, ci.github].filter(Boolean).map((v, i) => (
                            <Mono key={i} size={11} color={T.inkMid}>{v}</Mono>
                        ))}
                    </div>
                </div>
            )}

            {r.professional_summary && (
                <Section title="Professional Summary">
                    <p style={{
                        margin: 0, fontSize: 13, color: T.inkMid, lineHeight: 1.75,
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        padding: "12px 16px",
                        background: T.bgRaised,
                        borderRadius: 6,
                        borderLeft: `2px solid ${T.teal}`,
                    }}>{r.professional_summary}</p>
                </Section>
            )}

            {r.skills?.length > 0 && (
                <Section title="Skills" count={`${r.skills.length} skills`}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {r.skills.map((s, i) => (
                            <span key={i} className="ra-skill-pill" style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: 11, padding: "4px 11px", borderRadius: 4,
                                background: T.bgRaised, color: T.inkMid,
                                border: `1px solid ${T.borderMid}`, fontWeight: 500,
                                cursor: "default", transition: "all 0.15s",
                            }}>{s}</span>
                        ))}
                    </div>
                </Section>
            )}

            {r.experience?.length > 0 && (
                <Section title="Experience" count={`${r.experience.length} roles`}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {r.experience.map((exp, i) => (
                            <div key={i} style={{
                                border: `1px solid ${T.border}`,
                                borderRadius: 8, overflow: "hidden",
                            }}>
                                <div style={{
                                    background: T.bgRaised, padding: "10px 16px",
                                    borderBottom: `1px solid ${T.border}`,
                                    display: "flex", justifyContent: "space-between",
                                    alignItems: "center", flexWrap: "wrap", gap: 6,
                                }}>
                                    <span style={{
                                        fontFamily: "'Fraunces', serif",
                                        fontWeight: 600, fontSize: 15, color: T.ink,
                                    }}>{exp.role}</span>
                                    <Mono size={11} color={T.inkDim}>{exp.company} · {exp.duration}</Mono>
                                </div>
                                <div style={{ padding: "12px 16px", background: T.bgPanel }}>
                                    {exp.bullets?.map((b, j) => (
                                        <div key={j} style={{
                                            display: "flex", gap: 10, alignItems: "flex-start",
                                            marginBottom: j < exp.bullets.length - 1 ? 8 : 0,
                                        }}>
                                            <Mono size={12} color={T.amber} style={{ lineHeight: "20px", flexShrink: 0 }}>›</Mono>
                                            <span style={{
                                                fontSize: 13, color: T.inkMid, lineHeight: 1.65,
                                                fontFamily: "'IBM Plex Sans', sans-serif",
                                            }}>{b}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {r.education?.length > 0 && (
                <Section title="Education">
                    {r.education.map((e, i) => (
                        <div key={i} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 14px",
                            background: T.bgRaised, borderRadius: 6,
                            border: `1px solid ${T.border}`,
                            marginBottom: 6, flexWrap: "wrap", gap: 6,
                        }}>
                            <span style={{
                                fontFamily: "'Fraunces', serif",
                                fontSize: 14, fontWeight: 600, color: T.ink,
                            }}>{e.degree}</span>
                            <Mono size={11} color={T.inkDim}>{e.institution} · {e.year}</Mono>
                        </div>
                    ))}
                </Section>
            )}

            {r.projects?.length > 0 && (
                <Section title="Projects" count={`${r.projects.length} projects`}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {r.projects.map((p, i) => (
                            <div key={i} style={{
                                padding: "12px 14px", borderRadius: 6,
                                background: T.bgRaised, border: `1px solid ${T.border}`,
                            }}>
                                <div style={{
                                    fontFamily: "'Fraunces', serif",
                                    fontWeight: 600, fontSize: 14, color: T.ink, marginBottom: 5,
                                }}>{p.name}</div>
                                {p.description && (
                                    <p style={{
                                        fontSize: 13, color: T.inkMid, margin: "0 0 8px",
                                        lineHeight: 1.65, fontFamily: "'IBM Plex Sans', sans-serif",
                                    }}>{p.description}</p>
                                )}
                                {p.tech?.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                        {p.tech.map((t, j) => <Pill key={j} label={t} variant="teal" />)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────

export default function ResumeAnalyzer() {
    const [resumeText, setResumeText] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState("overview");
    const [uploadError, setUploadError] = useState(null);
    const resultRef = useRef(null);

    const handleAnalyze = useCallback(async () => {
        const text = resumeText.trim();
        if (!text) return;
        setLoading(true); setError(null); setResult(null); setTab("overview");
        try {
            const data = await analyzeResume(text);
            setResult(data);
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        } catch (e) { setError(e.message || "Analysis failed. Please try again."); }
        finally { setLoading(false); }
    }, [resumeText]);

    const charCount = resumeText.trim().length;
    const ready = charCount > 100;

    const TABS = [
        { key: "overview", label: "overview" },
        { key: "resume", label: "optimized resume" },
    ];

    return (
        <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'IBM Plex Sans', sans-serif", color: T.ink }}>
            <style>{css}</style>

            {/* ── HEADER ── */}
            <header style={{
                background: T.bgPanel,
                borderBottom: `1px solid ${T.border}`,
                padding: "0 32px",
                height: 56,
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.amber, boxShadow: `0 0 8px ${T.amber}` }} />
                        <span style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 13, fontWeight: 600, color: T.ink, letterSpacing: "0.04em",
                        }}>resume.ai</span>
                    </div>
                    <div style={{ width: 1, height: 20, background: T.border }} />
                    <Mono size={11} color={T.inkDim}>ats optimizer · bullet rewriter · pdf export</Mono>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusDot />
                    <Mono size={10} color={T.inkDim}>ready</Mono>
                </div>
            </header>

            {/* ── BODY ── */}
            <div style={{
                maxWidth: 1160, margin: "0 auto",
                padding: "36px 24px 80px",
                display: "grid",
                gridTemplateColumns: result || loading ? "1fr 1fr" : "minmax(0,680px)",
                justifyContent: result || loading ? "stretch" : "center",
                gap: 24,
                alignItems: "start",
            }}>

                {/* INPUT PANEL */}
                <div>
                    <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                        <Label>your resume</Label>
                        {charCount > 0 && (
                            <Mono size={10} color={T.inkDim} style={{ marginBottom: 10, marginLeft: "auto" }}>
                                {charCount.toLocaleString()} chars
                            </Mono>
                        )}
                    </div>

                    <div style={{
                        background: T.bgPanel,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        overflow: "hidden",
                    }}>
                        {/* Upload zone */}
                        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
                            <PDFUploadZone
                                onExtracted={(text) => { setResumeText(text); setUploadError(null); }}
                                onError={(msg) => setUploadError(msg)}
                            />
                            {uploadError && (
                                <div style={{
                                    marginTop: 8, padding: "7px 12px",
                                    background: T.redDim, border: `1px solid ${T.redStroke}`,
                                    borderRadius: 5, color: T.red,
                                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                                }}>{uploadError}</div>
                            )}
                        </div>

                        {/* or divider */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px 0" }}>
                            <div style={{ flex: 1, height: 1, background: T.border }} />
                            <Mono size={10} color={T.inkDim}>or paste text</Mono>
                            <div style={{ flex: 1, height: 1, background: T.border }} />
                        </div>

                        {/* Textarea */}
                        <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder={SAMPLE}
                            rows={18}
                            style={{
                                width: "100%", border: "none",
                                padding: "12px 16px 16px",
                                fontSize: 12, lineHeight: 1.75, color: T.inkMid,
                                background: "transparent",
                                resize: "vertical",
                                fontFamily: "'IBM Plex Mono', monospace",
                                outline: "none",
                            }}
                        />

                        {/* Footer */}
                        <div style={{
                            padding: "10px 16px",
                            borderTop: `1px solid ${T.border}`,
                            background: T.bgRaised,
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                            <button
                                className="ra-btn-ghost"
                                onClick={() => setResumeText(SAMPLE)}
                                style={{
                                    background: "transparent", border: `1px solid ${T.borderMid}`,
                                    borderRadius: 5, padding: "5px 12px",
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: 11, color: T.inkDim, cursor: "pointer",
                                    transition: "all 0.15s",
                                }}>load sample</button>

                            <button
                                onClick={handleAnalyze}
                                disabled={!ready || loading}
                                style={{
                                    background: ready && !loading ? T.amber : T.bgHover,
                                    border: `1px solid ${ready && !loading ? T.amber : T.borderMid}`,
                                    borderRadius: 6,
                                    padding: "7px 22px",
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: 12, fontWeight: 600,
                                    color: ready && !loading ? "#0f0e0d" : T.inkDim,
                                    cursor: ready && !loading ? "pointer" : "not-allowed",
                                    transition: "all 0.2s",
                                    letterSpacing: "0.02em",
                                }}>
                                {loading ? "analyzing…" : "analyze →"}
                            </button>
                        </div>
                    </div>

                    {!ready && charCount > 0 && (
                        <Mono size={10} color={T.inkDim} style={{ marginTop: 7, paddingLeft: 2, display: "block" }}>
                            needs at least 100 characters
                        </Mono>
                    )}
                </div>

                {/* RESULTS PANEL */}
                {(loading || result || error) && (
                    <div ref={resultRef} style={{ animation: "fadeUp 0.35s ease" }}>
                        <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                            {result && !loading
                                ? <Label>analysis complete</Label>
                                : <Label>analyzing</Label>
                            }
                        </div>

                        <div style={{
                            background: T.bgPanel,
                            border: `1px solid ${T.border}`,
                            borderRadius: 10,
                            overflow: "hidden",
                        }}>
                            {/* Tab bar */}
                            {result && !loading && (
                                <div style={{
                                    display: "flex",
                                    borderBottom: `1px solid ${T.border}`,
                                    background: T.bgRaised,
                                }}>
                                    {TABS.map(({ key, label }) => (
                                        <button key={key} className="ra-tab" onClick={() => setTab(key)} style={{
                                            flex: 1, padding: "11px 14px",
                                            background: "transparent", border: "none",
                                            borderBottom: `2px solid ${tab === key ? T.amber : "transparent"}`,
                                            fontFamily: "'IBM Plex Mono', monospace",
                                            fontSize: 11, fontWeight: tab === key ? 600 : 400,
                                            color: tab === key ? T.amber : T.inkDim,
                                            cursor: "pointer", transition: "all 0.15s",
                                            letterSpacing: "0.04em",
                                        }}>{label}</button>
                                    ))}
                                </div>
                            )}

                            <div style={{ padding: "20px 20px", maxHeight: 700, overflowY: "auto" }}>
                                {loading && <Spinner />}
                                {error && !loading && (
                                    <div style={{
                                        padding: 14, background: T.redDim,
                                        border: `1px solid ${T.redStroke}`,
                                        borderRadius: 6, color: T.red,
                                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
                                    }}>{error}</div>
                                )}
                                {result && !loading && (
                                    <>
                                        {tab === "overview" && <OverviewTab result={result} />}
                                        {tab === "resume" && <ResumeTab result={result} />}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}