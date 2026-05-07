// ============================================================
// UpworkProposalGenerator.jsx
// Production-ready AI Upwork Proposal Generator
// ============================================================

import { useState, useCallback } from "react";
import GrokResponse from "../components/response/Grokresponse";

// ============================================================
// SECTION 1: THEME & STATIC DATA (utils/theme.js equivalent)
// ============================================================

const THEME = {
    colors: {
        primary: "#0D9488",       // teal-600
        primaryLight: "#CCFBF1",  // teal-100
        primaryDark: "#0F766E",   // teal-700
        accent: "#F59E0B",        // amber-500
        accentLight: "#FEF3C7",   // amber-100
        accentDark: "#D97706",    // amber-600
        surface: "#0F172A",       // slate-900
        surfaceAlt: "#1E293B",    // slate-800
        surfaceCard: "#162032",   // custom dark card
        border: "#334155",        // slate-700
        borderLight: "#475569",   // slate-600
        textPrimary: "#F1F5F9",   // slate-100
        textSecondary: "#94A3B8", // slate-400
        textMuted: "#64748B",     // slate-500
        success: "#10B981",
        error: "#EF4444",
        errorLight: "#FEE2E2",
    },
    fonts: {
        display: "'Playfair Display', Georgia, serif",
        body: "'DM Sans', 'Helvetica Neue', sans-serif",
        mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
};

const EXPERIENCE_LEVELS = [
    { value: "", label: "Select experience level…" },
    { value: "entry", label: "Entry Level (0–2 years)" },
    { value: "intermediate", label: "Intermediate (2–5 years)" },
    { value: "expert", label: "Expert (5–10 years)" },
    { value: "senior", label: "Senior (10+ years)" },
];

const FIELD_CONSTRAINTS = {
    jobTitle: { min: 3, max: 120 },
    jobDescription: { min: 30, max: 3000 },
    userSkills: { min: 5, max: 500 },
};


// ============================================================
// SECTION 2: VALIDATION UTILS (utils/validation.js equivalent)
// ============================================================

const validateForm = (fields) => {
    const errors = {};

    if (!fields.jobTitle?.trim()) {
        errors.jobTitle = "Job title is required.";
    } else if (fields.jobTitle.trim().length < FIELD_CONSTRAINTS.jobTitle.min) {
        errors.jobTitle = `Job title must be at least ${FIELD_CONSTRAINTS.jobTitle.min} characters.`;
    } else if (fields.jobTitle.trim().length > FIELD_CONSTRAINTS.jobTitle.max) {
        errors.jobTitle = `Job title must be under ${FIELD_CONSTRAINTS.jobTitle.max} characters.`;
    }

    if (!fields.jobDescription?.trim()) {
        errors.jobDescription = "Job description is required.";
    } else if (fields.jobDescription.trim().length < FIELD_CONSTRAINTS.jobDescription.min) {
        errors.jobDescription = `Please provide at least ${FIELD_CONSTRAINTS.jobDescription.min} characters.`;
    }

    if (!fields.userSkills?.trim()) {
        errors.userSkills = "Your skills are required.";
    } else if (fields.userSkills.trim().length < FIELD_CONSTRAINTS.userSkills.min) {
        errors.userSkills = `Please list at least ${FIELD_CONSTRAINTS.userSkills.min} characters of skills.`;
    }

    if (!fields.experienceLevel) {
        errors.experienceLevel = "Please select your experience level.";
    }

    return errors;
};

// ============================================================
// SECTION 3: API LAYER (utils/proposalApi.js equivalent)
// ============================================================

const buildProposalPrompt = ({ jobTitle, jobDescription, userSkills, experienceLevel }) => {
    const levelMap = {
        entry: "Entry Level (0–2 years)",
        intermediate: "Intermediate (2–5 years)",
        expert: "Expert (5–10 years)",
        senior: "Senior (10+ years)",
    };

    return `You are an expert Upwork proposal writer with a proven track record of winning contracts.

Generate a compelling Upwork proposal for the following job:

**Job Title:** ${jobTitle}

**Job Description:**
${jobDescription}

**Freelancer Skills:** ${userSkills}

**Experience Level:** ${levelMap[experienceLevel] || experienceLevel}

`;
};

// AFTER
const generateProposalViaAPI = async (form) => {          // ✅ accept form
    const prompt = buildProposalPrompt(form);              // ✅ build dynamic prompt

    const response = await fetch(
        "https://tools-app-sable.vercel.app/api/generateProposal",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),              // ✅ send it
        }
    );

    const data = await response.json();
    console.log("data", data);

    return data.result;
};

// ============================================================
// SECTION 4: CUSTOM HOOK (hooks/useProposalGenerator.js)
// ============================================================

const INITIAL_FORM = {
    jobTitle: "",
    jobDescription: "",
    userSkills: "",
    experienceLevel: "",
};

const useProposalGenerator = () => {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // proposal is now STRING
    const [proposal, setProposal] = useState("");

    const [apiError, setApiError] = useState(null);
    const [copied, setCopied] = useState(null);

    const updateField = useCallback((field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));

        setErrors((prev) => {
            if (!prev[field]) return prev;

            const next = { ...prev };
            delete next[field];

            return next;
        });
    }, []);

    const resetForm = useCallback(() => {
        setForm(INITIAL_FORM);
        setErrors({});
        setProposal("");
        setApiError(null);
    }, []);

    const handleSubmit = useCallback(async () => {
        const validationErrors = validateForm(form);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setApiError(null);
        setProposal("");

        try {
            const result = await generateProposalViaAPI(form);

            // result is plain text now
            setProposal(result);

        } catch (err) {
            setApiError(
                err.message || "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [form]);

    const copyToClipboard = useCallback(async (key, text) => {
        try {
            await navigator.clipboard.writeText(text);

            setCopied(key);

            setTimeout(() => {
                setCopied(null);
            }, 2200);

        } catch {
            setCopied(null);
        }
    }, []);

    const copyFullProposal = useCallback(async () => {
        if (!proposal) return;

        await copyToClipboard("all", proposal);

    }, [proposal, copyToClipboard]);

    return {
        form,
        errors,
        loading,
        proposal,
        apiError,
        copied,
        updateField,
        handleSubmit,
        resetForm,
        copyToClipboard,
        copyFullProposal,
    };
};

// ============================================================
// SECTION 5: SUB-COMPONENTS
// ============================================================

// -- InputField --
const InputField = ({ id, label, value, onChange, error, placeholder, maxLength, hint }) => (
    <div style={{ marginBottom: "1.25rem" }}>
        <label
            htmlFor={id}
            style={{
                display: "block",
                fontFamily: THEME.fonts.body,
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: THEME.colors.textSecondary,
                marginBottom: "6px",
            }}
        >
            {label}
        </label>
        <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            autoComplete="off"
            style={{
                width: "100%",
                padding: "10px 14px",
                background: THEME.colors.surfaceAlt,
                border: `1.5px solid ${error ? THEME.colors.error : THEME.colors.border}`,
                borderRadius: "8px",
                color: THEME.colors.textPrimary,
                fontFamily: THEME.fonts.body,
                fontSize: "15px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = error ? THEME.colors.error : THEME.colors.primary)}
            onBlur={(e) => (e.target.style.borderColor = error ? THEME.colors.error : THEME.colors.border)}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            {error && (
                <span style={{ color: THEME.colors.error, fontSize: "12px", fontFamily: THEME.fonts.body }}>
                    {error}
                </span>
            )}
            {hint && !error && (
                <span style={{ color: THEME.colors.textMuted, fontSize: "12px", fontFamily: THEME.fonts.body }}>
                    {hint}
                </span>
            )}
            {maxLength && (
                <span
                    style={{
                        color: value.length > maxLength * 0.9 ? THEME.colors.accent : THEME.colors.textMuted,
                        fontSize: "12px",
                        fontFamily: THEME.fonts.mono,
                        marginLeft: "auto",
                    }}
                >
                    {value.length}/{maxLength}
                </span>
            )}
        </div>
    </div>
);

// -- TextAreaField --
const TextAreaField = ({ id, label, value, onChange, error, placeholder, rows = 5, maxLength, hint }) => (
    <div style={{ marginBottom: "1.25rem" }}>
        <label
            htmlFor={id}
            style={{
                display: "block",
                fontFamily: THEME.fonts.body,
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: THEME.colors.textSecondary,
                marginBottom: "6px",
            }}
        >
            {label}
        </label>
        <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            style={{
                width: "100%",
                padding: "10px 14px",
                background: THEME.colors.surfaceAlt,
                border: `1.5px solid ${error ? THEME.colors.error : THEME.colors.border}`,
                borderRadius: "8px",
                color: THEME.colors.textPrimary,
                fontFamily: THEME.fonts.body,
                fontSize: "15px",
                outline: "none",
                resize: "vertical",
                lineHeight: "1.6",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = error ? THEME.colors.error : THEME.colors.primary)}
            onBlur={(e) => (e.target.style.borderColor = error ? THEME.colors.error : THEME.colors.border)}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            {error && (
                <span style={{ color: THEME.colors.error, fontSize: "12px", fontFamily: THEME.fonts.body }}>
                    {error}
                </span>
            )}
            {hint && !error && (
                <span style={{ color: THEME.colors.textMuted, fontSize: "12px", fontFamily: THEME.fonts.body }}>
                    {hint}
                </span>
            )}
            {maxLength && (
                <span
                    style={{
                        color: value.length > maxLength * 0.9 ? THEME.colors.accent : THEME.colors.textMuted,
                        fontSize: "12px",
                        fontFamily: THEME.fonts.mono,
                        marginLeft: "auto",
                    }}
                >
                    {value.length}/{maxLength}
                </span>
            )}
        </div>
    </div>
);

// -- SelectField --
const SelectField = ({ id, label, value, onChange, error, options }) => (
    <div style={{ marginBottom: "1.25rem" }}>
        <label
            htmlFor={id}
            style={{
                display: "block",
                fontFamily: THEME.fonts.body,
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: THEME.colors.textSecondary,
                marginBottom: "6px",
            }}
        >
            {label}
        </label>
        <div style={{ position: "relative" }}>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: "100%",
                    padding: "10px 40px 10px 14px",
                    background: THEME.colors.surfaceAlt,
                    border: `1.5px solid ${error ? THEME.colors.error : THEME.colors.border}`,
                    borderRadius: "8px",
                    color: value ? THEME.colors.textPrimary : THEME.colors.textMuted,
                    fontFamily: THEME.fonts.body,
                    fontSize: "15px",
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = error ? THEME.colors.error : THEME.colors.primary)}
                onBlur={(e) => (e.target.style.borderColor = error ? THEME.colors.error : THEME.colors.border)}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.value === "" && value !== ""}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <span
                style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: THEME.colors.textMuted,
                    pointerEvents: "none",
                    fontSize: "14px",
                }}
            >
                ▾
            </span>
        </div>
        {error && (
            <span style={{ color: THEME.colors.error, fontSize: "12px", fontFamily: THEME.fonts.body, marginTop: "4px", display: "block" }}>
                {error}
            </span>
        )}
    </div>
);

// -- LoadingSpinner --
const LoadingSpinner = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "3rem 0" }}>
        <div
            style={{
                width: "48px",
                height: "48px",
                border: `3px solid ${THEME.colors.border}`,
                borderTop: `3px solid ${THEME.colors.primary}`,
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
            }}
        />
        <p style={{ color: THEME.colors.textSecondary, fontFamily: THEME.fonts.body, fontSize: "14px", margin: 0 }}>
            Crafting your proposal…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

// -- CopyButton --
const CopyButton = ({ isCopied, onClick, label = "Copy" }) => (
    <button
        onClick={onClick}
        title={isCopied ? "Copied!" : `Copy ${label}`}
        style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            background: isCopied ? THEME.colors.primary : "transparent",
            border: `1px solid ${isCopied ? THEME.colors.primary : THEME.colors.borderLight}`,
            borderRadius: "6px",
            color: isCopied ? "#fff" : THEME.colors.textSecondary,
            fontFamily: THEME.fonts.body,
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.18s ease",
            whiteSpace: "nowrap",
        }}
    >
        <span style={{ fontSize: "13px" }}>{isCopied ? "✓" : "⎘"}</span>
        {isCopied ? "Copied!" : label}
    </button>
);

// -- ProposalSection --
const ProposalSection = ({ section, text, isCopied, onCopy }) => (
    <div
        style={{
            background: THEME.colors.surfaceAlt,
            border: `1px solid ${THEME.colors.border}`,
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            marginBottom: "1rem",
        }}
    >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>{section.icon}</span>
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontFamily: THEME.fonts.body,
                            fontSize: "13px",
                            fontWeight: 600,
                            color: THEME.colors.primary,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                        }}
                    >
                        {section.label}
                    </p>
                    <p style={{ margin: 0, fontFamily: THEME.fonts.body, fontSize: "11px", color: THEME.colors.textMuted }}>
                        {section.description}
                    </p>
                </div>
            </div>
            <CopyButton isCopied={isCopied} onClick={() => onCopy(section.key, text)} label={section.label} />
        </div>
        <p
            style={{
                margin: 0,
                fontFamily: THEME.fonts.body,
                fontSize: "15px",
                lineHeight: "1.75",
                color: THEME.colors.textPrimary,
                whiteSpace: "pre-wrap",
                borderTop: `1px solid ${THEME.colors.border}`,
                paddingTop: "10px",
            }}
        >
            {text}
        </p>
    </div>
);

// -- ProposalOutput --
const ProposalOutput = ({ proposal, loading, apiError, copied, onCopyAll }) => {
    if (loading) return <LoadingSpinner />;

    if (apiError) {
        return (
            <div
                style={{
                    background: "rgba(239,68,68,0.08)",
                    border: `1px solid ${THEME.colors.error}`,
                    borderRadius: "10px",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                }}
            >
                <span style={{ fontSize: "18px", flexShrink: 0 }}>⚠️</span>
                <div>
                    <p style={{ margin: "0 0 4px", fontFamily: THEME.fonts.body, fontWeight: 600, color: THEME.colors.error, fontSize: "14px" }}>
                        Generation Failed
                    </p>
                    <p style={{ margin: 0, fontFamily: THEME.fonts.body, fontSize: "14px", color: "#FCA5A5" }}>
                        {apiError}
                    </p>
                </div>
            </div>
        );
    }

    if (!proposal) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "3rem 1rem",
                    textAlign: "center",
                    borderRadius: "12px",
                    border: `1.5px dashed ${THEME.colors.border}`,
                }}
            >
                <div
                    style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: "rgba(13,148,136,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "16px",
                        fontSize: "24px",
                    }}
                >
                    ✍️
                </div>
                <p
                    style={{
                        fontFamily: THEME.fonts.display,
                        fontSize: "18px",
                        fontWeight: 600,
                        color: THEME.colors.textPrimary,
                        margin: "0 0 8px",
                    }}
                >
                    Your proposal awaits
                </p>
                <p style={{ fontFamily: THEME.fonts.body, fontSize: "14px", color: THEME.colors.textMuted, margin: 0, maxWidth: "260px" }}>
                    Fill in the form and click Generate to craft a winning Upwork proposal.
                </p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div>
                    <h3
                        style={{
                            fontFamily: THEME.fonts.display,
                            fontSize: "18px",
                            fontWeight: 700,
                            color: THEME.colors.textPrimary,
                            margin: "0 0 4px",
                        }}
                    >
                        Your Proposal
                    </h3>
                    <p style={{ margin: 0, fontFamily: THEME.fonts.body, fontSize: "13px", color: THEME.colors.textMuted }}>
                        3 sections generated — edit as needed before sending
                    </p>
                </div>
                <button
                    onClick={onCopyAll}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 16px",
                        background: copied === "all" ? THEME.colors.primary : "transparent",
                        border: `1.5px solid ${copied === "all" ? THEME.colors.primary : THEME.colors.borderLight}`,
                        borderRadius: "8px",
                        color: copied === "all" ? "#fff" : THEME.colors.textSecondary,
                        fontFamily: THEME.fonts.body,
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.18s ease",
                    }}
                >
                    {copied === "all" ? "✓ All Copied!" : "⎘ Copy All"}
                </button>
            </div>


            <GrokResponse content={proposal} />

            {/* {PROPOSAL_SECTIONS.map((section) => (
                <ProposalSection
                    key={section.key}
                    section={section}
                    text={proposal[section.key]}
                    isCopied={copied === section.key}
                    onCopy={onCopy}
                />
            ))} */}
        </div>
    );
};

// -- InputForm --
const InputForm = ({ form, errors, loading, onChange, onSubmit, onReset, hasProposal }) => (
    <div>
        <InputField
            id="jobTitle"
            label="Job Title"
            value={form.jobTitle}
            onChange={(v) => onChange("jobTitle", v)}
            error={errors.jobTitle}
            placeholder="e.g. React Developer for E-Commerce Dashboard"
            maxLength={FIELD_CONSTRAINTS.jobTitle.max}
        />
        <TextAreaField
            id="jobDescription"
            label="Job Description"
            value={form.jobDescription}
            onChange={(v) => onChange("jobDescription", v)}
            error={errors.jobDescription}
            placeholder="Paste the full job description here…"
            rows={6}
            maxLength={FIELD_CONSTRAINTS.jobDescription.max}
            hint="More detail = better proposal"
        />
        <TextAreaField
            id="userSkills"
            label="Your Skills & Expertise"
            value={form.userSkills}
            onChange={(v) => onChange("userSkills", v)}
            error={errors.userSkills}
            placeholder="e.g. React, TypeScript, Node.js, REST APIs, Figma-to-code, 4 years freelance…"
            rows={3}
            maxLength={FIELD_CONSTRAINTS.userSkills.max}
        />
        <SelectField
            id="experienceLevel"
            label="Experience Level"
            value={form.experienceLevel}
            onChange={(v) => onChange("experienceLevel", v)}
            error={errors.experienceLevel}
            options={EXPERIENCE_LEVELS}
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
            <button
                onClick={onSubmit}
                disabled={loading}
                style={{
                    flex: 1,
                    padding: "12px 20px",
                    background: loading
                        ? THEME.colors.border
                        : `linear-gradient(135deg, ${THEME.colors.primary}, ${THEME.colors.primaryDark})`,
                    border: "none",
                    borderRadius: "8px",
                    color: loading ? THEME.colors.textMuted : "#fff",
                    fontFamily: THEME.fonts.body,
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "opacity 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    letterSpacing: "0.02em",
                }}
            >
                {loading ? (
                    <>
                        <span
                            style={{
                                display: "inline-block",
                                width: "16px",
                                height: "16px",
                                border: "2px solid rgba(255,255,255,0.3)",
                                borderTop: "2px solid #fff",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                            }}
                        />
                        Generating…
                    </>
                ) : (
                    <>✦ Generate Proposal</>
                )}
            </button>
            {hasProposal && (
                <button
                    onClick={onReset}
                    disabled={loading}
                    style={{
                        padding: "12px 16px",
                        background: "transparent",
                        border: `1.5px solid ${THEME.colors.border}`,
                        borderRadius: "8px",
                        color: THEME.colors.textSecondary,
                        fontFamily: THEME.fonts.body,
                        fontSize: "14px",
                        cursor: loading ? "not-allowed" : "pointer",
                        transition: "all 0.18s",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = THEME.colors.borderLight)}
                    onMouseOut={(e) => (e.currentTarget.style.borderColor = THEME.colors.border)}
                >
                    ↺ Reset
                </button>
            )}
        </div>
    </div>
);

// ============================================================
// SECTION 6: MAIN COMPONENT
// ============================================================

export default function UpworkProposalGenerator() {
    const {
        form,
        errors,
        loading,
        proposal,
        apiError,
        copied,
        updateField,
        handleSubmit,
        resetForm,
        copyToClipboard,
        copyFullProposal,
    } = useProposalGenerator();

    return (
        <>
            {/* Google Fonts */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        select option { background: #1E293B; color: #F1F5F9; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

            <div
                style={{
                    minHeight: "100vh",
                    background: THEME.colors.surface,
                    fontFamily: THEME.fonts.body,
                    padding: "0",
                }}
            >
                {/* SEO / Page Header */}
                <header
                    style={{
                        background: "rgba(15,23,42,0.95)",
                        borderBottom: `1px solid ${THEME.colors.border}`,
                        padding: "1rem 1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "sticky",
                        top: 0,
                        zIndex: 50,
                        backdropFilter: "blur(8px)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                            style={{
                                width: "32px",
                                height: "32px",
                                background: `linear-gradient(135deg, ${THEME.colors.primary}, ${THEME.colors.accent})`,
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                            }}
                        >
                            ✦
                        </div>
                        <div>
                            <h1
                                style={{
                                    fontFamily: THEME.fonts.display,
                                    fontSize: "17px",
                                    fontWeight: 700,
                                    color: THEME.colors.textPrimary,
                                    margin: 0,
                                    lineHeight: 1,
                                }}
                            >
                                ProposalAI
                            </h1>
                            <p style={{ margin: 0, fontSize: "11px", color: THEME.colors.textMuted, fontFamily: THEME.fonts.body }}>
                                Upwork Proposal Generator
                            </p>
                        </div>
                    </div>
                    <span
                        style={{
                            padding: "4px 12px",
                            background: "rgba(13,148,136,0.15)",
                            border: `1px solid rgba(13,148,136,0.4)`,
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: THEME.colors.primary,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                        }}
                    >
                        AI Powered
                    </span>
                </header>

                {/* Hero strip */}
                <div
                    style={{
                        background: `linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(245,158,11,0.04) 100%)`,
                        borderBottom: `1px solid ${THEME.colors.border}`,
                        padding: "2rem 1.5rem 1.75rem",
                        textAlign: "center",
                    }}
                >
                    <h2
                        style={{
                            fontFamily: THEME.fonts.display,
                            fontSize: "clamp(22px, 4vw, 34px)",
                            fontWeight: 700,
                            color: THEME.colors.textPrimary,
                            margin: "0 0 10px",
                            lineHeight: 1.2,
                        }}
                    >
                        Win More Contracts on Upwork
                    </h2>
                    <p
                        style={{
                            fontFamily: THEME.fonts.body,
                            fontSize: "15px",
                            color: THEME.colors.textSecondary,
                            margin: "0 auto",
                            maxWidth: "480px",
                            lineHeight: 1.6,
                        }}
                    >
                        Generate a tailored, persuasive proposal in seconds. Just describe the job and your skills — AI handles the rest.
                    </p>
                </div>

                {/* Main two-column layout */}
                <main
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                        gap: "1.5rem",
                        maxWidth: "1180px",
                        margin: "0 auto",
                        padding: "2rem 1.5rem",
                        alignItems: "start",
                    }}
                >
                    {/* LEFT — Input Form */}
                    <section
                        aria-label="Proposal Input Form"
                        style={{
                            background: THEME.colors.surfaceCard,
                            border: `1px solid ${THEME.colors.border}`,
                            borderRadius: "14px",
                            padding: "1.75rem",
                            animation: "fadeIn 0.4s ease both",
                        }}
                    >
                        <div style={{ marginBottom: "1.5rem" }}>
                            <h2
                                style={{
                                    fontFamily: THEME.fonts.display,
                                    fontSize: "20px",
                                    fontWeight: 700,
                                    color: THEME.colors.textPrimary,
                                    margin: "0 0 4px",
                                }}
                            >
                                Job Details
                            </h2>
                            <p style={{ margin: 0, fontFamily: THEME.fonts.body, fontSize: "13px", color: THEME.colors.textMuted }}>
                                The more detail you provide, the better the output.
                            </p>
                        </div>

                        <InputForm
                            form={form}
                            errors={errors}
                            loading={loading}
                            onChange={updateField}
                            onSubmit={handleSubmit}
                            onReset={resetForm}
                            hasProposal={!!proposal}
                        />

                        {/* Tips box */}
                        <div
                            style={{
                                marginTop: "1.5rem",
                                padding: "1rem",
                                background: "rgba(245,158,11,0.05)",
                                border: `1px solid rgba(245,158,11,0.2)`,
                                borderRadius: "8px",
                            }}
                        >
                            <p
                                style={{
                                    margin: "0 0 8px",
                                    fontFamily: THEME.fonts.body,
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: THEME.colors.accent,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                }}
                            >
                                💡 Pro Tips
                            </p>
                            {[
                                "Paste the full job description for best results",
                                "List specific technologies, not just categories",
                                "Mention past results (e.g. 'built 15 Shopify stores')",
                            ].map((tip, i) => (
                                <p key={i} style={{ margin: "4px 0 0", fontFamily: THEME.fonts.body, fontSize: "12px", color: THEME.colors.textMuted }}>
                                    • {tip}
                                </p>
                            ))}
                        </div>
                    </section>

                    {/* RIGHT — Proposal Output */}
                    <section
                        aria-label="Generated Proposal Output"
                        style={{
                            background: THEME.colors.surfaceCard,
                            border: `1px solid ${THEME.colors.border}`,
                            borderRadius: "14px",
                            padding: "1.75rem",
                            animation: "fadeIn 0.4s ease 0.1s both",
                        }}
                    >
                        <div style={{ marginBottom: "1.5rem" }}>
                            <h2
                                style={{
                                    fontFamily: THEME.fonts.display,
                                    fontSize: "20px",
                                    fontWeight: 700,
                                    color: THEME.colors.textPrimary,
                                    margin: "0 0 4px",
                                }}
                            >
                                Generated Proposal
                            </h2>
                            <p style={{ margin: 0, fontFamily: THEME.fonts.body, fontSize: "13px", color: THEME.colors.textMuted }}>
                                Review, copy, and customize before sending.
                            </p>
                        </div>

                        <ProposalOutput
                            proposal={proposal}
                            loading={loading}
                            apiError={apiError}
                            copied={copied}
                            onCopy={copyToClipboard}
                            onCopyAll={copyFullProposal}
                        />
                    </section>
                </main>

                {/* Footer */}
                <footer
                    style={{
                        borderTop: `1px solid ${THEME.colors.border}`,
                        padding: "1.25rem 1.5rem",
                        textAlign: "center",
                    }}
                >
                    <p style={{ margin: 0, fontFamily: THEME.fonts.body, fontSize: "12px", color: THEME.colors.textMuted }}>
                        ProposalAI — Built with Claude AI · For freelancers who value their time
                    </p>
                </footer>
            </div>
        </>
    );
}