// ─── API ──────────────────────────────────────────────────────────────────────
export const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
export const MAX_TOKENS = 4096;

// ─── SCREENS ──────────────────────────────────────────────────────────────────
export const SCREENS = {
  UPLOAD: "upload",
  ANALYZING: "analyzing",
  RESULTS: "results",
};

// ─── ANALYSIS PROGRESS STEPS ─────────────────────────────────────────────────
export const ANALYSIS_STEPS = [
  "Parsing resume content...",
  "Extracting skills & experience...",
  "Determining seniority level...",
  "Searching job market...",
  "Scoring job matches...",
  "Building career strategy...",
];

// ─── ACCEPTED FILE TYPES ──────────────────────────────────────────────────────
export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
];
export const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".md"];

// ─── MATCH SCORE THRESHOLDS ───────────────────────────────────────────────────
export const SCORE_COLORS = {
  excellent: { min: 80, color: "#34d399", label: "Excellent" },
  good: { min: 65, color: "#60a5fa", label: "Good" },
  fair: { min: 50, color: "#fbbf24", label: "Fair" },
  weak: { min: 0, color: "#f87171", label: "Weak" },
};

export function getScoreColor(score) {
  if (score >= 80) return SCORE_COLORS.excellent.color;
  if (score >= 65) return SCORE_COLORS.good.color;
  if (score >= 50) return SCORE_COLORS.fair.color;
  return SCORE_COLORS.weak.color;
}

// ─── SKILL CHIP VARIANTS ──────────────────────────────────────────────────────
export const CHIP_VARIANTS = {
  primary: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20",
  secondary: "bg-white/5 text-slate-300 border border-white/10",
  gap: "bg-red-500/10 text-red-400 border border-red-500/20",
  strength: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
};

// ─── BADGE VARIANTS ───────────────────────────────────────────────────────────
export const BADGE_VARIANTS = {
  purple: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20",
  blue: "bg-sky-500/10 text-sky-300 border border-sky-500/20",
  green: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  red: "bg-red-500/10 text-red-400 border border-red-500/20",
  gray: "bg-white/5 text-slate-400 border border-white/10",
};

// ─── STAT CARD THEMES ─────────────────────────────────────────────────────────
export const STAT_THEMES = {
  indigo: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-300",
    border: "border-indigo-500/15",
  },
  sky: {
    bg: "bg-sky-500/10",
    text: "text-sky-300",
    border: "border-sky-500/15",
  },
  green: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    border: "border-emerald-500/15",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    border: "border-amber-500/15",
  },
};

// ─── FEATURES (upload screen) ─────────────────────────────────────────────────
export const FEATURES = [
  {
    icon: "🧠",
    title: "Deep Analysis",
    desc: "Skills, seniority, ATS keywords",
  },
  {
    icon: "🎯",
    title: "Smart Match",
    desc: "Real jobs, scored by fit",
  },
  {
    icon: "📈",
    title: "Strategy",
    desc: "Gaps, salary, roadmap",
  },
];

// ─── SUPPORTED FORMATS ────────────────────────────────────────────────────────
export const SUPPORTED_FORMATS = ["PDF", "TXT", "MD"];

// ─── CLAUDE SYSTEM PROMPT ────────────────────────────────────────────────────
export const SYSTEM_PROMPT = `You are an elite technical recruiter, ATS engine, and career strategist.
Analyze resumes and return ONLY valid JSON. No markdown fences, no preamble.
Return EXACTLY this shape:
{
  "candidate": {
    "name": "string or null",
    "title": "best role title",
    "summary": "2–3 sentence professional summary",
    "experience": "X years",
    "seniority": "Junior|Mid|Senior|Lead|Principal",
    "salary": "$X–$Y/yr or null",
    "location": "city/country or null",
    "bestRoles": ["role1","role2","role3"],
    "primarySkills": ["skill1",...],
    "secondarySkills": ["skill1",...],
    "skillGaps": ["gap1",...],
    "strengths": ["s1","s2","s3"],
    "recommendations": ["rec1","rec2","rec3"]
  },
  "jobs": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, Country or Remote",
      "workType": "Remote|Hybrid|On-site",
      "type": "Full-time|Contract|Part-time",
      "salary": "$X–$Y or null",
      "matchScore": 85,
      "whyMatches": ["reason1","reason2"],
      "skills": ["skill1","skill2"],
      "applyLink": "https://linkedin.com/jobs/...",
      "source": "LinkedIn|Indeed|company careers",
      "posted": "X days ago"
    }
  ]
}
Rules: max 10 jobs, only matchScore>=65, never invent salaries, applyLink must use a real plausible domain.`;
