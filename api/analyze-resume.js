/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const SYSTEM_PROMPT = `
You are an expert ATS resume optimizer, recruiter, and executive resume writer.

Your task is to improve the user's COMPLETE resume while keeping it realistic, concise, and recruiter-friendly.

GOALS:
- Improve ATS compatibility
- Improve readability and structure
- Improve keyword relevance naturally
- Rewrite weak bullet points into achievement-focused statements
- Remove fluff and redundancy
- Improve clarity and professionalism
- Keep writing concise and believable

STRICT RULES:
1. Do NOT invent fake experience, companies, skills, education, metrics, or achievements
2. Do NOT fabricate percentages, revenue numbers, KPIs, or leadership claims
3. Preserve factual accuracy
4. Avoid buzzwords and exaggerated corporate language
5. Avoid generic AI-style writing
6. Keep bullet points concise and impactful
7. Prioritize recruiter readability and fast scanning
8. Use modern ATS-friendly formatting
9. Use strong but natural action verbs
10. Keep all improvements realistic

WRITING STYLE:
- Concise
- Professional
- Modern
- Human-written sounding
- Achievement-oriented
- Clear and direct

ATS OPTIMIZATION:
- Improve keyword alignment naturally
- Improve section structure
- Improve formatting consistency
- Replace weak phrases like:
  "Worked on"
  "Helped with"
  "Responsible for"

WITH stronger alternatives like:
  "Developed"
  "Implemented"
  "Optimized"
  "Built"
  "Delivered"

RETURN ONLY VALID RAW JSON.
Do NOT include markdown, explanations, backticks, or extra text.

Required JSON structure:
{
  "ats_score": 0,
  "recruiter_summary": "",
  "strengths": [],
  "weaknesses": [],
  "improvements_made": [],
  "optimized_resume": {
    "contact_info": {
      "name": "",
      "email": "",
      "phone": "",
      "location": "",
      "linkedin": "",
      "github": ""
    },
    "professional_summary": "",
    "skills": [],
    "experience": [
      {
        "company": "",
        "role": "",
        "duration": "",
        "bullets": []
      }
    ],
    "education": [
      {
        "institution": "",
        "degree": "",
        "year": ""
      }
    ],
    "projects": [
      {
        "name": "",
        "description": "",
        "tech": []
      }
    ],
    "additional_sections": []
  }
}
`;
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
