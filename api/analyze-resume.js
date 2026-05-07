/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const SYSTEM_PROMPT = `You are an elite ATS resume optimization expert, executive resume writer, and recruiter.
Your task is to analyze and improve the user's COMPLETE resume for:
- ATS compatibility
- Professional impact
- Clarity
- Grammar
- Keyword optimization
- Achievement-focused writing
- Better structure and readability

IMPORTANT RULES:
1. Do NOT invent fake experience, companies, or skills
2. Keep all improvements realistic
3. Preserve factual accuracy
4. Rewrite weak bullet points into strong accomplishment-driven statements
5. Improve formatting consistency
6. Remove redundant wording
7. Improve professional tone
8. Add strong action verbs
9. Optimize for modern ATS systems
10. Keep concise and high-value language

ATS OPTIMIZATION REQUIREMENTS:
- Improve keyword relevance
- Use recruiter-friendly wording
- Improve readability
- Ensure clean section structure
- Prioritize measurable achievements
- Replace weak phrases like "Worked on", "Helped with", "Responsible for"
  WITH: "Developed", "Implemented", "Optimized", "Led", "Engineered", "Delivered"

RETURN ONLY RAW JSON — no markdown, no backticks, no explanation. Exactly this structure:
{
  "ats_score": 85,
  "summary": "Short summary of resume quality and improvements",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "improvements_made": ["Improvement 1", "Improvement 2"],
  "optimized_resume": {
    "contact_info": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "" },
    "professional_summary": "",
    "skills": ["skill1", "skill2"],
    "experience": [
      { "company": "", "role": "", "duration": "", "bullets": [] }
    ],
    "education": [
      { "institution": "", "degree": "", "year": "" }
    ],
    "projects": [
      { "name": "", "description": "", "tech": [] }
    ]
  }
}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: "resumeText is required" });
    }

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
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Analyze and optimize this resume:\n\n${resumeText}`,
            },
          ],
          temperature: 0.4,
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    function extractJSON(text) {
      try {
        // remove markdown
        let cleaned = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        // find first valid json object
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");

        if (firstBrace === -1 || lastBrace === -1) {
          throw new Error("No JSON object found");
        }

        cleaned = cleaned.slice(firstBrace, lastBrace + 1);

        // remove trailing commas
        cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

        return JSON.parse(cleaned);
      } catch (err) {
        console.error("RAW MODEL OUTPUT:\n", text);
        throw err;
      }
    }

    let parsed;

    try {
      parsed = extractJSON(raw);
    } catch (e) {
      return res.status(500).json({
        error: "Invalid JSON from model",
        raw,
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({
      error: err.message || "Server error",
    });
  }
}
