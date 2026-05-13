/* eslint-disable no-undef */

export const SYSTEM_PROMPT = `
You are an elite ATS engine, technical recruiter, and career analyst.

Your task:
Analyze the resume and return ONLY valid raw JSON.

CRITICAL RULES:
- Do NOT return markdown
- Do NOT use \`\`\`json
- Do NOT explain anything
- Do NOT add preamble text
- Output must be parseable JSON only
- Never hallucinate certifications, companies, salaries, or years
- If data is missing, use null
- Never invent job apply URLs
- Use only realistic public job domains:
  linkedin.com
  indeed.com
  glassdoor.com
  lever.co
  greenhouse.io
  company career pages
- Avoid duplicate jobs
- Only include jobs with matchScore >= 65
- Max 10 jobs
- Keep summaries concise
- Match seniority realistically
- Infer experience conservatively
- Skills must be normalized and deduplicated
- Salary must be null unless strongly implied
- Arrays must never contain duplicates
- Return compact JSON only

Return EXACTLY this structure:

{
  "candidate": {
    "name": "string or null",
    "title": "best matching professional title",
    "summary": "2-3 sentence professional summary",
    "experience": "X years or null",
    "seniority": "Junior|Mid|Senior|Lead|Principal|null",
    "salary": "$X-$Y/year or null",
    "location": "City, Country or null",
    "bestRoles": [],
    "primarySkills": [],
    "secondarySkills": [],
    "skillGaps": [],
    "strengths": [],
    "recommendations": []
  },
  "jobs": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "workType": "Remote|Hybrid|On-site|null",
      "type": "Full-time|Contract|Part-time|null",
      "salary": "string or null",
      "matchScore": 0,
      "whyMatches": [],
      "skills": [],
      "applyLink": "valid URL",
      "source": "LinkedIn|Indeed|Glassdoor|Company Careers|Lever|Greenhouse",
      "posted": "string or null"
    }
  ]
}

Validation requirements:
- matchScore must be integer 0-100
- jobs array must contain maximum 10 items
- applyLink must begin with https://
- Return empty arrays instead of null for arrays
- Never omit required fields
`;
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { resumeText } = req.body;

    if (!resumeText || resumeText.trim().length < 80) {
      return res.status(400).json({
        error: "Resume content is too short.",
      });
    }

    // hard safety: prevent huge payload abuse
    const trimmedResume = resumeText.slice(0, 12000);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          top_p: 1,
          max_tokens: 3500,

          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT, // 👈 keep prompt in env
            },
            {
              role: "user",
              content: `Analyze this resume and return ONLY valid JSON:\n\n${trimmedResume}`,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));

      return res.status(response.status).json({
        error: err?.error?.message || "Groq API error",
      });
    }

    const data = await response.json();

    const raw = data?.choices?.[0]?.message?.content?.trim() || "";

    const parsed = parseStrictJSON(raw);

    // optional: server-side sanity validation
    const safe = validateResponse(parsed);

    return res.status(200).json(safe);
  } catch (error) {
    console.error("Resume analysis error:", error);

    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}

function parseStrictJSON(raw) {
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);

    throw new Error("Failed to parse AI response JSON");
  }
}

function validateResponse(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response format");
  }

  // enforce jobs safety rules
  if (!Array.isArray(data.jobs)) data.jobs = [];

  data.jobs = data.jobs
    .filter((job) => job && job.matchScore >= 65)
    .slice(0, 10)
    .map((job) => ({
      ...job,
      matchScore: clamp(job.matchScore),
      applyLink: sanitizeUrl(job.applyLink),
    }));

  return data;
}

function clamp(score) {
  if (typeof score !== "number") return 0;
  return Math.max(0, Math.min(100, score));
}

function sanitizeUrl(url) {
  if (typeof url !== "string") return null;
  if (!url.startsWith("https://")) return null;
  return url;
}
