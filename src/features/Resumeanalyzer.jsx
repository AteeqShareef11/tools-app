import { useState, useCallback, useRef } from "react";

// ════════════════════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════════════════════

// eslint-disable-next-line react-refresh/only-export-components
export async function analyzeResume(resumeText) {
    const res = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
}

// eslint-disable-next-line react-refresh/only-export-components
export function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
}

// eslint-disable-next-line react-refresh/only-export-components
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

// eslint-disable-next-line react-refresh/only-export-components
export function scoreColor(score) {
    if (score >= 80) return { fg: "#22c55e", bg: "rgba(34,197,94,0.1)", stroke: "rgba(34,197,94,0.3)" };
    if (score >= 60) return { fg: "#f59e0b", bg: "rgba(245,158,11,0.1)", stroke: "rgba(245,158,11,0.3)" };
    return { fg: "#ef4444", bg: "rgba(239,68,68,0.1)", stroke: "rgba(239,68,68,0.3)" };
}

// eslint-disable-next-line react-refresh/only-export-components
export function scoreLabel(score) {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 55) return "Needs Work";
    return "Poor";
}

// ════════════════════════════════════════════════════════════
//  PDF UTILITIES
// ════════════════════════════════════════════════════════════

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

/**
 * Extract plain text from a PDF File object using PDF.js.
 * Returns a Promise<string>.
 */
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
        const strings = content.items.map((item) => item.str);
        pages.push(strings.join(" "));
    }
    return pages.join("\n\n");
}

/**
 * Generate and download a styled PDF from the analysis result using jsPDF.
 */
export async function downloadResumePDF(result) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const r = result.optimized_resume;
    const ci = r.contact_info || {};
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginL = 18;
    const marginR = 18;
    const contentW = pageW - marginL - marginR;
    let y = 0;

    const ACCENT = [194, 105, 42];      // #c2692a
    const TEAL = [13, 115, 119];      // #0d7377
    const INK = [26, 24, 20];        // #1a1814
    const INK_MID = [90, 86, 78];       // #5a564e
    const INK_DIM = [155, 150, 144];    // #9b9690
    const BORDER = [228, 224, 216];    // #e4e0d8

    function checkPage(needed = 8) {
        if (y + needed > pageH - 14) {
            doc.addPage();
            y = 16;
        }
    }

    function sectionHeader(title) {
        checkPage(14);
        y += 5;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...INK_DIM);
        doc.text(title.toUpperCase(), marginL, y);
        y += 2;
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.3);
        doc.line(marginL, y, pageW - marginR, y);
        y += 5;
    }

    // ── Header block ──
    doc.setFillColor(248, 246, 242);
    doc.rect(0, 0, pageW, 36, "F");

    y = 14;
    if (ci.name) {
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...INK);
        doc.text(ci.name, pageW / 2, y, { align: "center" });
        y += 7;
    }

    const contactParts = [ci.email, ci.phone, ci.location, ci.linkedin, ci.github].filter(Boolean);
    if (contactParts.length) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...INK_MID);
        doc.text(contactParts.join("  |  "), pageW / 2, y, { align: "center" });
        y += 5;
    }

    // accent underline
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(1);
    doc.line(marginL, y, pageW - marginR, y);
    y += 8;

    // ── ATS Score badge ──
    const badgeX = pageW - marginR - 28;
    const badgeY = 5;
    const sc = result.ats_score;
    const scoreCol = sc >= 80 ? [34, 197, 94] : sc >= 60 ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(...scoreCol.map(v => Math.round(v * 0.15 + 240)));
    doc.roundedRect(badgeX, badgeY, 26, 14, 3, 3, "F");
    doc.setDrawColor(...scoreCol);
    doc.setLineWidth(0.4);
    doc.roundedRect(badgeX, badgeY, 26, 14, 3, 3, "S");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...scoreCol);
    doc.text(String(sc), badgeX + 13, badgeY + 7.5, { align: "center" });
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text("ATS SCORE", badgeX + 13, badgeY + 12.5, { align: "center" });

    // ── Professional Summary ──
    if (r.professional_summary) {
        sectionHeader("Professional Summary");
        doc.setDrawColor(...TEAL);
        doc.setLineWidth(0.6);
        doc.line(marginL, y - 1, marginL, y + 12);
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...INK_MID);
        const sumLines = doc.splitTextToSize(r.professional_summary, contentW - 6);
        checkPage(sumLines.length * 5 + 4);
        doc.text(sumLines, marginL + 5, y);
        y += sumLines.length * 5 + 3;
    }

    // ── Skills ──
    if (r.skills?.length) {
        sectionHeader("Skills");
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...INK_MID);

        let sx = marginL;
        const pillH = 5.5;
        const pillPadX = 3;
        const pillGapX = 3;
        const pillGapY = 2;
        const rowStart = y;

        r.skills.forEach((skill) => {
            const tw = doc.getTextWidth(skill);
            const pillW = tw + pillPadX * 2;
            if (sx + pillW > pageW - marginR) {
                sx = marginL;
                y += pillH + pillGapY;
                checkPage(pillH + 4);
            }
            doc.setFillColor(13, 115, 119, 0.08);
            doc.setFillColor(230, 244, 244);
            doc.roundedRect(sx, y - 3.5, pillW, pillH, 1.5, 1.5, "F");
            doc.setDrawColor(...TEAL);
            doc.setLineWidth(0.2);
            doc.roundedRect(sx, y - 3.5, pillW, pillH, 1.5, 1.5, "S");
            doc.setTextColor(...TEAL);
            doc.text(skill, sx + pillPadX, y);
            sx += pillW + pillGapX;
        });
        y += pillH + 3;
    }

    // ── Experience ──
    if (r.experience?.length) {
        sectionHeader("Experience");
        r.experience.forEach((exp) => {
            checkPage(14);
            // Role header bar
            doc.setFillColor(249, 248, 245);
            doc.rect(marginL, y - 4, contentW, 8, "F");
            doc.setDrawColor(...BORDER);
            doc.setLineWidth(0.2);
            doc.rect(marginL, y - 4, contentW, 8, "S");

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...INK);
            doc.text(exp.role, marginL + 3, y);

            const meta = `${exp.company}  ·  ${exp.duration}`;
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...INK_DIM);
            doc.text(meta, pageW - marginR - 3, y, { align: "right" });
            y += 6;

            exp.bullets?.forEach((bullet) => {
                const bLines = doc.splitTextToSize(bullet, contentW - 8);
                checkPage(bLines.length * 4.5 + 3);
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(...INK_MID);
                doc.setFillColor(...ACCENT);
                doc.circle(marginL + 2, y - 1.2, 0.8, "F");
                doc.text(bLines, marginL + 6, y);
                y += bLines.length * 4.5 + 1;
            });
            y += 4;
        });
    }

    // ── Education ──
    if (r.education?.length) {
        sectionHeader("Education");
        r.education.forEach((edu) => {
            checkPage(9);
            doc.setFillColor(249, 248, 245);
            doc.roundedRect(marginL, y - 4, contentW, 8, 2, 2, "F");
            doc.setDrawColor(...BORDER);
            doc.setLineWidth(0.2);
            doc.roundedRect(marginL, y - 4, contentW, 8, 2, 2, "S");
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...INK);
            doc.text(edu.degree, marginL + 4, y);
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...INK_DIM);
            doc.text(`${edu.institution}  ·  ${edu.year}`, pageW - marginR - 4, y, { align: "right" });
            y += 8;
        });
    }

    // ── Projects ──
    if (r.projects?.length) {
        sectionHeader("Projects");
        r.projects.forEach((proj) => {
            checkPage(12);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...INK);
            doc.text(proj.name, marginL, y);
            y += 5;
            if (proj.description) {
                const dLines = doc.splitTextToSize(proj.description, contentW);
                checkPage(dLines.length * 4.5 + 2);
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(...INK_MID);
                doc.text(dLines, marginL, y);
                y += dLines.length * 4.5 + 1;
            }
            if (proj.tech?.length) {
                doc.setFontSize(8);
                doc.setTextColor(...TEAL);
                doc.text("Tech: " + proj.tech.join(", "), marginL, y);
                y += 5;
            }
            y += 2;
        });
    }

    // ── Footer on every page ──
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.3);
        doc.line(marginL, pageH - 10, pageW - marginR, pageH - 10);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...INK_DIM);
        doc.text("ATS-Optimized Resume", marginL, pageH - 6);
        doc.text(`Page ${i} of ${totalPages}`, pageW - marginR, pageH - 6, { align: "right" });
    }

    const filename = ci.name
        ? `${ci.name.replace(/\s+/g, "_")}_resume.pdf`
        : "optimized_resume.pdf";
    doc.save(filename);
}

// ════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ════════════════════════════════════════════════════════════

const T = {
    bg: "#f5f3ee",
    surface: "#ffffff",
    surfaceAlt: "#f9f8f5",
    border: "#e4e0d8",
    borderMid: "#ccc8be",
    ink: "#1a1814",
    inkMid: "#5a564e",
    inkDim: "#9b9690",
    accent: "#c2692a",
    accentLight: "rgba(194,105,42,0.1)",
    accentStroke: "rgba(194,105,42,0.25)",
    teal: "#0d7377",
    tealLight: "rgba(13,115,119,0.1)",
    tealStroke: "rgba(13,115,119,0.25)",
    shadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
};

// ════════════════════════════════════════════════════════════
//  SMALL UI PIECES
// ════════════════════════════════════════════════════════════

const SAMPLE = `John Doe
john@email.com | (555) 123-4567 | San Francisco, CA | linkedin.com/in/johndoe

SUMMARY
Experienced software engineer who has worked on various web projects and helped teams build applications.

EXPERIENCE
Senior Frontend Developer — Acme Corp (2021–Present)
- Responsible for building React components
- Worked on improving the performance of the dashboard
- Helped with migration from legacy codebase to modern stack
- Was involved in code reviews

Frontend Developer — StartupXYZ (2019–2021)
- Worked on UI features
- Helped with bug fixes
- Responsible for writing tests

EDUCATION
B.S. Computer Science — State University (2019)

SKILLS
React, JavaScript, CSS, HTML, Git, REST APIs

PROJECTS
Portfolio Site — Built a personal website using React and CSS`;

function Tag({ label, color = "teal" }) {
    const c = color === "accent"
        ? { bg: T.accentLight, fg: T.accent, border: T.accentStroke }
        : { bg: T.tealLight, fg: T.teal, border: T.tealStroke };
    return (
        <span style={{
            display: "inline-block", fontSize: "11px", fontWeight: 600,
            padding: "2px 9px", borderRadius: "99px", letterSpacing: "0.03em",
            background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
        }}>{label}</span>
    );
}

function ScoreRing({ score }) {
    const c = scoreColor(score);
    const r = 44, stroke = 7;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
                <circle
                    cx="55" cy="55" r={r} fill="none"
                    stroke={c.fg} strokeWidth={stroke}
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    transform="rotate(-90 55 55)"
                    style={{ transition: "stroke-dasharray 1s ease" }}
                />
                <text x="55" y="50" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: "24px", fontWeight: 700, fill: c.fg, fontFamily: "inherit" }}>
                    {score}
                </text>
                <text x="55" y="68" textAnchor="middle"
                    style={{ fontSize: "10px", fill: T.inkDim, fontFamily: "inherit", fontWeight: 500, letterSpacing: "0.05em" }}>
                    ATS SCORE
                </text>
            </svg>
            <Tag label={scoreLabel(score)} color="accent" />
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div style={{ marginBottom: "24px" }}>
            <h3 style={{
                margin: "0 0 12px", fontSize: "11px", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: T.inkDim, paddingBottom: "8px",
                borderBottom: `1px solid ${T.border}`,
            }}>{title}</h3>
            {children}
        </div>
    );
}

function ListItems({ items, icon, color }) {
    const c = color === "red"
        ? { dot: "#ef4444", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.15)" }
        : color === "green"
            ? { dot: "#22c55e", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.15)" }
            : { dot: T.accent, bg: T.accentLight, border: T.accentStroke };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {items.map((item, i) => (
                <div key={i} style={{
                    display: "flex", gap: "10px", alignItems: "flex-start",
                    padding: "8px 12px", borderRadius: "8px",
                    background: c.bg, border: `1px solid ${c.border}`,
                }}>
                    <span style={{ color: c.dot, fontSize: "14px", lineHeight: "20px", flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: "13px", color: T.inkMid, lineHeight: 1.55 }}>{item}</span>
                </div>
            ))}
        </div>
    );
}

function CopyBtn({ text, label = "Copy" }) {
    const [done, setDone] = useState(false);
    const handleClick = async () => {
        await copyToClipboard(text);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
    };
    return (
        <button onClick={handleClick} style={{
            display: "flex", alignItems: "center", gap: "5px",
            background: done ? "rgba(34,197,94,0.1)" : T.surfaceAlt,
            border: `1px solid ${done ? "rgba(34,197,94,0.3)" : T.border}`,
            borderRadius: "7px", padding: "5px 12px",
            color: done ? "#22c55e" : T.inkMid,
            fontSize: "12px", cursor: "pointer", fontWeight: 500,
            transition: "all 0.2s",
        }}>
            {done ? "✓ Copied" : label}
        </button>
    );
}

function DownloadPDFBtn({ result }) {
    const [status, setStatus] = useState("idle"); // "idle" | "loading" | "done" | "error"
    const handleClick = async () => {
        setStatus("loading");
        try {
            await downloadResumePDF(result);
            setStatus("done");
            setTimeout(() => setStatus("idle"), 2500);
        } catch (e) {
            console.error(e);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 2500);
        }
    };
    const styles = {
        idle: { bg: T.accent, color: "#fff", border: T.accent },
        loading: { bg: T.accentLight, color: T.accent, border: T.accentStroke },
        done: { bg: "rgba(34,197,94,0.1)", color: "#22c55e", border: "rgba(34,197,94,0.3)" },
        error: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.3)" },
    };
    const s = styles[status];
    const labels = { idle: "⬇ Download PDF", loading: "Generating…", done: "✓ Downloaded!", error: "Error — retry" };
    return (
        <button
            onClick={handleClick}
            disabled={status === "loading"}
            style={{
                display: "flex", alignItems: "center", gap: "5px",
                background: s.bg, border: `1px solid ${s.border}`,
                borderRadius: "7px", padding: "5px 14px",
                color: s.color, fontSize: "12px",
                cursor: status === "loading" ? "not-allowed" : "pointer",
                fontWeight: 600, transition: "all 0.2s",
            }}
        >
            {labels[status]}
        </button>
    );
}

function Spinner() {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "60px 0" }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
            <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                border: `3px solid ${T.border}`, borderTopColor: T.accent,
                animation: "spin 0.75s linear infinite",
            }} />
            <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 4px", fontSize: "14px", color: T.ink, fontWeight: 500 }}>Analyzing your resume…</p>
                <p style={{ margin: 0, fontSize: "12px", color: T.inkDim, animation: "pulse 2s ease-in-out infinite" }}>
                    Running ATS checks · Rewriting bullets · Scoring
                </p>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════
//  PDF UPLOAD ZONE
// ════════════════════════════════════════════════════════════

function PDFUploadZone({ onExtracted, onError }) {
    const [dragOver, setDragOver] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [fileName, setFileName] = useState(null);
    const fileRef = useRef(null);

    const handleFile = useCallback(async (file) => {
        if (!file || file.type !== "application/pdf") {
            onError("Please upload a valid PDF file.");
            return;
        }
        setParsing(true);
        setFileName(file.name);
        try {
            const text = await extractTextFromPDF(file);
            if (!text.trim()) throw new Error("No readable text found in PDF. Try a text-based PDF.");
            onExtracted(text);
        } catch (e) {
            onError(e.message || "Failed to read PDF.");
            setFileName(null);
        } finally {
            setParsing(false);
        }
    }, [onExtracted, onError]);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const onInputChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = "";
    }, [handleFile]);

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !parsing && fileRef.current?.click()}
            style={{
                border: `2px dashed ${dragOver ? T.accent : T.borderMid}`,
                borderRadius: "10px",
                padding: "16px 20px",
                marginBottom: "10px",
                background: dragOver ? T.accentLight : T.surfaceAlt,
                cursor: parsing ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "12px",
            }}
        >
            <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                onChange={onInputChange}
                style={{ display: "none" }}
            />

            {/* Icon */}
            <div style={{
                width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
                background: dragOver ? T.accentLight : "rgba(194,105,42,0.08)",
                border: `1px solid ${T.accentStroke}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px",
            }}>
                {parsing ? (
                    <span style={{
                        display: "block", width: "16px", height: "16px", borderRadius: "50%",
                        border: `2px solid ${T.border}`, borderTopColor: T.accent,
                        animation: "spin 0.75s linear infinite",
                    }} />
                ) : "📄"}
            </div>

            {/* Text */}
            <div style={{ minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: T.ink }}>
                    {parsing
                        ? "Reading PDF…"
                        : fileName
                            ? `✓ ${fileName}`
                            : "Upload PDF resume"}
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: T.inkDim }}>
                    {parsing
                        ? "Extracting text with PDF.js"
                        : "Drag & drop or click to browse · text-based PDFs only"}
                </p>
            </div>

            {/* Badge */}
            {!parsing && (
                <span style={{
                    marginLeft: "auto", flexShrink: 0,
                    fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em",
                    padding: "2px 8px", borderRadius: "99px",
                    background: T.accentLight, color: T.accent,
                    border: `1px solid ${T.accentStroke}`,
                }}>PDF</span>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════
//  RESULT TABS: Overview / Optimized Resume
// ════════════════════════════════════════════════════════════

function OverviewTab({ result }) {
    return (
        <div>
            {/* score + summary row */}
            <div style={{
                display: "flex", gap: "20px", alignItems: "flex-start",
                marginBottom: "28px", flexWrap: "wrap",
            }}>
                <ScoreRing score={result.ats_score} />
                <div style={{ flex: 1, minWidth: "180px" }}>
                    <p style={{
                        margin: "0 0 12px", fontSize: "14px", color: T.inkMid,
                        lineHeight: 1.65, fontStyle: "italic",
                        borderLeft: `3px solid ${T.accent}`,
                        paddingLeft: "12px",
                    }}>{result.summary}</p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <Tag label={`${result.strengths?.length || 0} strengths`} color="teal" />
                        <Tag label={`${result.weaknesses?.length || 0} areas to fix`} color="accent" />
                        <Tag label={`${result.improvements_made?.length || 0} improvements`} color="teal" />
                    </div>
                </div>
            </div>

            {result.strengths?.length > 0 && (
                <Section title="Strengths">
                    <ListItems items={result.strengths} icon="✦" color="green" />
                </Section>
            )}
            {result.weaknesses?.length > 0 && (
                <Section title="Areas to Improve">
                    <ListItems items={result.weaknesses} icon="△" color="red" />
                </Section>
            )}
            {result.improvements_made?.length > 0 && (
                <Section title="Improvements Made">
                    <ListItems items={result.improvements_made} icon="→" color="accent" />
                </Section>
            )}
        </div>
    );
}

function ResumeTab({ result }) {
    const r = result.optimized_resume;
    const ci = r.contact_info || {};
    const exportText = exportResumeAsText(result);

    return (
        <div>
            {/* top bar */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: "20px", gap: "8px", flexWrap: "wrap",
            }}>
                <span style={{ fontSize: "13px", color: T.inkDim }}>
                    ATS-optimized · ready to use
                </span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <CopyBtn text={exportText} label="Copy text" />
                    <DownloadPDFBtn result={result} />
                </div>
            </div>

            {/* contact */}
            {Object.values(ci).some(Boolean) && (
                <div style={{
                    background: T.surfaceAlt, border: `1px solid ${T.border}`,
                    borderRadius: "10px", padding: "14px 16px", marginBottom: "16px",
                }}>
                    {ci.name && <p style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700, color: T.ink }}>{ci.name}</p>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                        {[ci.email, ci.phone, ci.location, ci.linkedin, ci.github].filter(Boolean).map((v, i) => (
                            <span key={i} style={{ fontSize: "12px", color: T.inkMid }}>{v}</span>
                        ))}
                    </div>
                </div>
            )}

            {r.professional_summary && (
                <Section title="Professional Summary">
                    <p style={{
                        margin: 0, fontSize: "14px", color: T.inkMid, lineHeight: 1.7,
                        padding: "12px 14px", background: T.surfaceAlt,
                        borderRadius: "8px", borderLeft: `3px solid ${T.teal}`,
                    }}>{r.professional_summary}</p>
                </Section>
            )}

            {r.skills?.length > 0 && (
                <Section title="Skills">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {r.skills.map((s, i) => (
                            <span key={i} style={{
                                fontSize: "12px", padding: "3px 11px", borderRadius: "6px",
                                background: T.tealLight, color: T.teal,
                                border: `1px solid ${T.tealStroke}`, fontWeight: 500,
                            }}>{s}</span>
                        ))}
                    </div>
                </Section>
            )}

            {r.experience?.length > 0 && (
                <Section title="Experience">
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {r.experience.map((exp, i) => (
                            <div key={i} style={{
                                border: `1px solid ${T.border}`, borderRadius: "10px",
                                overflow: "hidden",
                            }}>
                                <div style={{
                                    background: T.surfaceAlt, padding: "10px 14px",
                                    borderBottom: `1px solid ${T.border}`,
                                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                                    flexWrap: "wrap", gap: "4px",
                                }}>
                                    <span style={{ fontWeight: 700, fontSize: "14px", color: T.ink }}>{exp.role}</span>
                                    <span style={{ fontSize: "12px", color: T.inkDim }}>{exp.company} · {exp.duration}</span>
                                </div>
                                <ul style={{ margin: 0, padding: "12px 14px 12px 28px" }}>
                                    {exp.bullets?.map((b, j) => (
                                        <li key={j} style={{
                                            fontSize: "13px", color: T.inkMid, lineHeight: 1.65,
                                            marginBottom: j < exp.bullets.length - 1 ? "7px" : 0,
                                        }}>{b}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {r.education?.length > 0 && (
                <Section title="Education">
                    {r.education.map((e, i) => (
                        <div key={i} style={{
                            display: "flex", justifyContent: "space-between",
                            padding: "8px 12px", background: T.surfaceAlt,
                            borderRadius: "8px", marginBottom: "6px",
                            border: `1px solid ${T.border}`,
                        }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: T.ink }}>{e.degree}</span>
                            <span style={{ fontSize: "12px", color: T.inkDim }}>{e.institution} · {e.year}</span>
                        </div>
                    ))}
                </Section>
            )}

            {r.projects?.length > 0 && (
                <Section title="Projects">
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {r.projects.map((p, i) => (
                            <div key={i} style={{
                                padding: "10px 14px", borderRadius: "8px",
                                background: T.surfaceAlt, border: `1px solid ${T.border}`,
                            }}>
                                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "13px", color: T.ink }}>{p.name}</p>
                                {p.description && <p style={{ margin: "0 0 6px", fontSize: "13px", color: T.inkMid }}>{p.description}</p>}
                                {p.tech?.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                                        {p.tech.map((t, j) => (
                                            <Tag key={j} label={t} color="teal" />
                                        ))}
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

// ════════════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════════════

export default function ResumeAnalyzer() {
    const [resumeText, setResumeText] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState("overview"); // "overview" | "resume"
    const [uploadError, setUploadError] = useState(null);
    const resultRef = useRef(null);

    const handleAnalyze = useCallback(async () => {
        const text = resumeText.trim();
        if (!text) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setTab("overview");
        try {
            const data = await analyzeResume(text);
            setResult(data);
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        } catch (e) {
            setError(e.message || "Analysis failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [resumeText]);

    const handlePDFExtracted = useCallback((text) => {
        setResumeText(text);
        setUploadError(null);
    }, []);

    const charCount = resumeText.trim().length;
    const ready = charCount > 100;

    return (
        <div style={{
            minHeight: "100vh",
            background: T.bg,
            fontFamily: "'Lora', 'Georgia', serif",
            color: T.ink,
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;}
        ::placeholder{color:${T.inkDim}!important;}
        textarea,button,span,p,li,div{font-family:'DM Sans','Segoe UI',sans-serif;}
        h1,h2,h3{font-family:'Lora',serif;}
        textarea:focus{outline:none;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${T.borderMid};border-radius:3px;}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

            {/* ── HEADER ── */}
            <header style={{
                background: T.surface, borderBottom: `1px solid ${T.border}`,
                padding: "20px 32px", display: "flex", alignItems: "center", gap: "14px",
                boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
            }}>
                <div style={{
                    width: "38px", height: "38px", borderRadius: "10px",
                    background: T.accent, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "18px", flexShrink: 0,
                }}>📄</div>
                <div>
                    <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: T.ink, letterSpacing: "-0.02em" }}>
                        Resume Analyzer
                    </h1>
                    <p style={{ margin: 0, fontSize: "12px", color: T.inkDim }}>
                        ATS optimization · Bullet rewriting · Score & feedback · PDF export
                    </p>
                </div>
            </header>

            {/* ── BODY ── */}
            <div style={{
                maxWidth: "1100px", margin: "0 auto",
                padding: "32px 24px 64px",
                display: "grid",
                gridTemplateColumns: result || loading ? "1fr 1fr" : "1fr",
                gap: "28px",
                alignItems: "start",
            }}>

                {/* ── INPUT PANEL ── */}
                <div>
                    <div style={{
                        background: T.surface, border: `1px solid ${T.border}`,
                        borderRadius: "14px", overflow: "hidden",
                        boxShadow: T.shadow,
                    }}>
                        <div style={{
                            padding: "14px 18px", borderBottom: `1px solid ${T.border}`,
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                            <div>
                                <span style={{ fontSize: "14px", fontWeight: 600, color: T.ink }}>Your Resume</span>
                                <span style={{ fontSize: "12px", color: T.inkDim, marginLeft: "10px" }}>paste text or upload PDF</span>
                            </div>
                            {charCount > 0 && (
                                <span style={{ fontSize: "11px", color: T.inkDim }}>{charCount.toLocaleString()} chars</span>
                            )}
                        </div>

                        {/* PDF Upload Zone */}
                        <div style={{ padding: "14px 18px 0" }}>
                            <PDFUploadZone
                                onExtracted={handlePDFExtracted}
                                onError={(msg) => setUploadError(msg)}
                            />
                            {uploadError && (
                                <p style={{
                                    fontSize: "12px", color: "#ef4444", marginBottom: "10px",
                                    padding: "6px 10px", borderRadius: "6px",
                                    background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                                }}>{uploadError}</p>
                            )}

                            {/* Divider */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: "10px",
                                marginBottom: "10px",
                            }}>
                                <div style={{ flex: 1, height: "1px", background: T.border }} />
                                <span style={{ fontSize: "11px", color: T.inkDim, fontWeight: 500 }}>or paste below</span>
                                <div style={{ flex: 1, height: "1px", background: T.border }} />
                            </div>
                        </div>

                        <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder={SAMPLE}
                            rows={18}
                            style={{
                                width: "100%", border: "none", padding: "0 18px 16px",
                                fontSize: "13px", lineHeight: 1.7, color: T.ink,
                                background: "transparent", resize: "vertical",
                            }}
                        />

                        <div style={{
                            padding: "12px 18px", borderTop: `1px solid ${T.border}`,
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            background: T.surfaceAlt,
                        }}>
                            <button
                                onClick={() => setResumeText(SAMPLE)}
                                style={{
                                    background: "none", border: `1px solid ${T.border}`,
                                    borderRadius: "7px", padding: "6px 12px", fontSize: "12px",
                                    color: T.inkDim, cursor: "pointer",
                                }}
                            >
                                Load sample
                            </button>
                            <button
                                onClick={handleAnalyze}
                                disabled={!ready || loading}
                                style={{
                                    background: ready && !loading ? T.accent : T.border,
                                    border: "none", borderRadius: "8px",
                                    padding: "9px 24px", fontSize: "14px", fontWeight: 600,
                                    color: ready && !loading ? "#fff" : T.inkDim,
                                    cursor: ready && !loading ? "pointer" : "not-allowed",
                                    transition: "all 0.2s",
                                    letterSpacing: "-0.01em",
                                }}
                            >
                                {loading ? "Analyzing…" : "Analyze Resume →"}
                            </button>
                        </div>
                    </div>

                    {!ready && charCount > 0 && (
                        <p style={{ fontSize: "12px", color: T.inkDim, marginTop: "8px", paddingLeft: "4px" }}>
                            Add more content — needs at least 100 characters.
                        </p>
                    )}
                </div>

                {/* ── RESULTS PANEL ── */}
                {(loading || result || error) && (
                    <div ref={resultRef} style={{ animation: "fadein 0.3s ease" }}>
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: "14px", overflow: "hidden", boxShadow: T.shadow,
                        }}>
                            {/* tab bar */}
                            {result && !loading && (
                                <div style={{
                                    display: "flex", borderBottom: `1px solid ${T.border}`,
                                    background: T.surfaceAlt,
                                }}>
                                    {[
                                        { key: "overview", label: "Overview" },
                                        { key: "resume", label: "Optimized Resume" },
                                    ].map(({ key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => setTab(key)}
                                            style={{
                                                flex: 1, padding: "12px", border: "none",
                                                background: tab === key ? T.surface : "transparent",
                                                borderBottom: tab === key ? `2px solid ${T.accent}` : "2px solid transparent",
                                                fontSize: "13px", fontWeight: tab === key ? 600 : 400,
                                                color: tab === key ? T.accent : T.inkDim,
                                                cursor: "pointer", transition: "all 0.15s",
                                            }}
                                        >{label}</button>
                                    ))}
                                </div>
                            )}

                            <div style={{ padding: "20px", maxHeight: "680px", overflowY: "auto" }}>
                                {loading && <Spinner />}
                                {error && !loading && (
                                    <div style={{
                                        padding: "16px", background: "rgba(239,68,68,0.08)",
                                        border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px",
                                        color: "#ef4444", fontSize: "14px",
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

                {/* ── EMPTY RIGHT STATE (before any run) ── */}
                {!loading && !result && !error && (
                    <div style={{ display: "none" }} />
                )}
            </div>
        </div>
    );
}