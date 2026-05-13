/* eslint-disable no-undef */

export default async function handler(req, res) {
  console.log("🔥 NEW CODE VERSION 2.0 LOADED");
  try {
    let body = req.body;

    // HARD normalize (fixes all Vercel/Next weirdness)
    if (!body || typeof body === "string") {
      body = JSON.parse(body || "{}");
    } else {
      body = JSON.parse(JSON.stringify(body));
    }

    const title = body.title;
    const skills = body.skills;
    const location = body.location;

    console.log("FIXED BODY:", body);

    const skillsText =
      Array.isArray(skills) && skills.length ? skills.join(" ") : "";

    const locationText = location?.trim() || "";

    const query = [
      title,
      skillsText,
      locationText,
      workType === "remote" ? "remote" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const encodedQuery = encodeURIComponent(query);

    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodedQuery}&page=1&num_pages=1`,
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      },
    );

    const data = await response.json();

    let jobs = (data?.data || []).map((job) => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city || job.job_country || location,
      description: job.job_description || "",
      workType: job.job_is_remote ? "Remote" : "On-site",
      applyLink: job.job_apply_link,
      source: "JSearch",
    }));

    // ⚠️ post-filtering (still needed because API is noisy)
    if (workType !== "both") {
      jobs = jobs.filter((j) =>
        workType === "remote"
          ? j.workType === "Remote"
          : j.workType === "On-site",
      );
    }

    return res.status(200).json({
      total: jobs.length,
      jobs,
      queryUsed: decodeURIComponent(query),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// function normalizeJob(job) {
//   return {
//     id: job.job_id,
//     title: job.job_title,
//     company: job.employer_name,
//     location: job.job_city || job.job_country,
//     description: job.job_description || "",
//     isRemote: job.job_is_remote,
//     applyLink: job.job_apply_link,
//     posted: job.job_posted_at_datetime_utc,
//   };
// }

// function scoreJob(job, profile) {
//   let score = 0;

//   const fullText = normalize(`${job.title} ${job.description}`);

//   // TITLE MATCH
//   if (fullText.includes(normalize(profile.title))) {
//     score += 35;
//   }

//   // SKILL MATCHES
//   profile.skills.forEach((skill) => {
//     const aliases = [skill, ...(SKILL_ALIASES[skill.toLowerCase()] || [])];

//     aliases.forEach((alias) => {
//       if (fullText.includes(normalize(alias))) {
//         score += 10;
//       }
//     });
//   });

//   // REMOTE BOOST
//   if (profile.location === "remote" && job.isRemote) {
//     score += 10;
//   }

//   return Math.min(score, 100);
// }
